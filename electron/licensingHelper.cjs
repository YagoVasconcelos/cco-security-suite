/**
 * Módulo de Licenciamento, HWID Binding e Blindagem Contra Cópia
 * CCO Security Suite Rev 1.2 — TecPrimus Soluções Tecnológicas
 * Autor: Yago Marinho
 * 
 * Regras:
 * 1. HWID Binding: Gera hash estável baseado no hardware do Windows (MachineGuid, CPU, Placa-Mãe, MAC).
 * 2. Cópia Não Autorizada: Se o HWID do arquivo de licença diferir do HWID atual, encerra imediatamente.
 * 3. Primeira Instalação / Reinstalação: Exige a senha de ativação YAGO@2806 (validada via hash seguro PBKDF2).
 * 4. Isolamento: Senha de ativação é 100% isolada das senhas internas da aplicação (seguranca.json).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const SECRET_SIGNING_KEY = 'CCO_SECURITY_SUITE_HWID_BINDING_KEY_2026_YAGO_TECPRIMUS';
const AES_KEY = crypto.createHash('sha256').update(SECRET_SIGNING_KEY).digest(); // 32 bytes
const ACTIVATION_SALT = 'CCO_ACTIVATION_SALT_2806_YAGO_SECURE';
const ACTIVATION_HASH = crypto.pbkdf2Sync('YAGO@2806', ACTIVATION_SALT, 100000, 32, 'sha256').toString('hex');

/**
 * Coleta identificadores de hardware estáveis no Windows e gera o HWID canônico.
 * @returns {string} HWID formatado ex: CCO-HWID-A1B2-C3D4-E5F6-7890
 */
function obterHwidLocal() {
  let machineGuid = '';
  let processorId = '';
  let boardUuid = '';
  let primaryMac = '';

  // 1. MachineGuid do Registro do Windows (único por instalação do SO)
  try {
    const regOutput = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000
    });
    const match = regOutput.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/i);
    if (match && match[1]) {
      machineGuid = match[1].trim();
    }
  } catch (e) {}

  // 2. UUID do Sistema / Placa-Mãe via PowerShell / WMI
  try {
    const wmicOutput = execSync('wmic csproduct get uuid', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000
    });
    const lines = wmicOutput.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.toLowerCase().includes('uuid'));
    if (lines.length > 0 && lines[0]) {
      boardUuid = lines[0];
    }
  } catch (e) {
    // Fallback PowerShell
    try {
      const psOutput = execSync('powershell -NoProfile -Command "(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID"', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 3000
      });
      if (psOutput && psOutput.trim()) boardUuid = psOutput.trim();
    } catch (e2) {}
  }

  // 3. ID do Processador (CPU)
  try {
    const cpuOutput = execSync('wmic cpu get processorid', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000
    });
    const cpuLines = cpuOutput.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.toLowerCase().includes('processorid'));
    if (cpuLines.length > 0 && cpuLines[0]) {
      processorId = cpuLines[0];
    }
  } catch (e) {}

  // 4. Endereço MAC primário
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          primaryMac = net.mac;
          break;
        }
      }
      if (primaryMac) break;
    }
  } catch (e) {}

  // Fallback garantido se WMI for restrito
  const hostname = os.hostname() || 'CCO-HOST';
  const cpus = os.cpus() || [];
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'CPU-GENERIC';

  const rawHardwareData = [
    machineGuid || 'MG-DEFAULT',
    boardUuid || 'UUID-DEFAULT',
    processorId || 'PROC-DEFAULT',
    primaryMac || 'MAC-DEFAULT',
    hostname,
    cpuModel
  ].join('::');

  const sha = crypto.createHash('sha256').update(rawHardwareData).digest('hex').toUpperCase();
  return `CCO-HWID-${sha.substring(0, 4)}-${sha.substring(4, 8)}-${sha.substring(8, 12)}-${sha.substring(12, 16)}`;
}

/**
 * Criptografa o payload da licença usando AES-256-CBC.
 */
function encryptPayload(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Descriptografa o payload da licença.
 */
function decryptPayload(cipherText) {
  const parts = cipherText.split(':');
  if (parts.length !== 2) throw new Error('Formato de cifra inválido');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

/**
 * Retorna os caminhos possíveis onde o arquivo de licença pode residir.
 */
function getLicensePaths(app) {
  const paths = [];
  try {
    if (app && typeof app.getPath === 'function') {
      paths.push(path.join(app.getPath('userData'), 'license.lic'));
    }
  } catch (e) {}

  paths.push(path.resolve(__dirname, '..', 'data', 'license.lic'));
  paths.push(path.resolve(__dirname, '..', 'license.lic'));
  return paths;
}

/**
 * Lê e valida o arquivo de licença criptografado existente.
 */
function lerLicencaExistente(app) {
  const candidatePaths = getLicensePaths(app);
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const rawContent = fs.readFileSync(p, 'utf-8');
        const decryptedJson = decryptPayload(rawContent);
        const licenseData = JSON.parse(decryptedJson);

        // Valida assinatura HMAC
        const expectedSignature = crypto.createHmac('sha512', SECRET_SIGNING_KEY)
          .update(`${licenseData.hwid}:${licenseData.version}:${licenseData.activatedAt}`)
          .digest('hex');

        if (licenseData.signature === expectedSignature && licenseData.hwid) {
          return { licenseData, licensePath: p };
        }
      } catch (err) {
        console.warn(`[Licensing] Falha ao decodificar licença em ${p}:`, err.message);
      }
    }
  }
  return null;
}

/**
 * Verifica o status da licença para a máquina atual.
 * @param {object} app Objeto Electron app
 * @returns {object} { status: 'VALID' | 'HWID_MISMATCH' | 'NOT_ACTIVATED', currentHwid, savedHwid }
 */
function verificarStatusLicenca(app) {
  const currentHwid = obterHwidLocal();
  const existing = lerLicencaExistente(app);

  if (!existing) {
    return {
      status: 'NOT_ACTIVATED',
      currentHwid,
      message: 'Licença não ativada nesta máquina.'
    };
  }

  const savedHwid = existing.licenseData.hwid;
  if (savedHwid === currentHwid) {
    return {
      status: 'VALID',
      currentHwid,
      activatedAt: existing.licenseData.activatedAt,
      version: existing.licenseData.version
    };
  } else {
    return {
      status: 'HWID_MISMATCH',
      currentHwid,
      savedHwid,
      message: 'Erro de Violação de Licença / Cópia Não Autorizada'
    };
  }
}

/**
 * Valida a senha de ativação digitada e gera o arquivo de licença vinculado ao HWID.
 * @param {string} senhaDigitada 
 * @param {object} app Objeto Electron app
 * @returns {object} { sucesso: boolean, message: string, hwid: string }
 */
function ativarLicencaComSenha(senhaDigitada, app) {
  if (!senhaDigitada || typeof senhaDigitada !== 'string') {
    return { sucesso: false, message: 'Digite a senha de ativação.' };
  }

  const hashDigitado = crypto.pbkdf2Sync(senhaDigitada.trim(), ACTIVATION_SALT, 100000, 32, 'sha256').toString('hex');
  const bufDigitado = Buffer.from(hashDigitado, 'hex');
  const bufCorreto = Buffer.from(ACTIVATION_HASH, 'hex');

  const senhaValida = crypto.timingSafeEqual(bufDigitado, bufCorreto);
  if (!senhaValida) {
    return { sucesso: false, message: 'Senha de ativação incorreta! Verifique as credenciais de licenciamento.' };
  }

  const currentHwid = obterHwidLocal();
  const activatedAt = new Date().toISOString();
  const version = '1.2.0';

  const signature = crypto.createHmac('sha512', SECRET_SIGNING_KEY)
    .update(`${currentHwid}:${version}:${activatedAt}`)
    .digest('hex');

  const licensePayload = JSON.stringify({
    hwid: currentHwid,
    version,
    activatedAt,
    issuedBy: 'TecPrimus Soluções Tecnológicas',
    signature
  });

  const encryptedLicense = encryptPayload(licensePayload);
  const candidatePaths = getLicensePaths(app);

  let gravado = false;
  for (const p of candidatePaths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, encryptedLicense, 'utf-8');
      gravado = true;
    } catch (e) {
      console.warn(`[Licensing] Não foi possível gravar licença em ${p}:`, e.message);
    }
  }

  if (!gravado) {
    return { sucesso: false, message: 'Erro ao gravar arquivo de licença em disco.' };
  }

  console.log(`[Licensing] Licença ativada com sucesso para HWID: ${currentHwid}`);
  return { sucesso: true, message: 'Licença ativada com sucesso!', hwid: currentHwid };
}

module.exports = {
  obterHwidLocal,
  verificarStatusLicenca,
  ativarLicencaComSenha,
  getLicensePaths
};
