/**
 * Módulo Central de Criptografia e Blindagem de Dados Sensíveis
 * CCO Security Suite - Proteção de Nível Corporativo
 * 
 * Implementa:
 * 1. Hash irreversível PBKDF2 com HMAC-SHA512 e Salt criptográfico de 32 bytes (100.000 iterações).
 * 2. Comparação segura contra Timing Attacks com crypto.timingSafeEqual.
 * 3. Envoltório para Electron safeStorage (DPAPI do Windows) quando disponível.
 * 4. Auto-migração transparente de senhas legadas em texto plano para formato blindado.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ITERACOES_PADRAO = 100000;
const TAMANHO_KEY = 64; // 512 bits
const DIGEST = 'sha512';
const SENHA_PADRAO_FABRICA = 'admin123';

/**
 * Gera um hash PBKDF2 seguro a partir de uma senha e salt.
 * @param {string} senha 
 * @param {string} saltHex 
 * @param {number} iteracoes 
 * @returns {string} Hash em formato hexadecimal
 */
function derivarHash(senha, saltHex, iteracoes = ITERACOES_PADRAO) {
  const saltBuf = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(String(senha), saltBuf, iteracoes, TAMANHO_KEY, DIGEST).toString('hex');
}

/**
 * Cria a estrutura criptográfica completa para uma nova senha.
 * @param {string} novaSenha 
 * @param {object|null} electronSafeStorage 
 * @returns {object} Objeto pronto para gravação em seguranca.json
 */
function gerarRegistroSeguro(novaSenha, electronSafeStorage = null) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = derivarHash(novaSenha, salt, ITERACOES_PADRAO);
  const dataAtualizacao = new Date().toISOString();

  const registro = {
    formato: 'CCO_SECURE_V2',
    algoritmo: 'PBKDF2-HMAC-SHA512',
    iteracoes: ITERACOES_PADRAO,
    digest: DIGEST,
    salt,
    hash,
    dataAtualizacao,
    protegido: true
  };

  // Se o safeStorage do Electron estiver disponível e habilitado
  if (electronSafeStorage && typeof electronSafeStorage.isEncryptionAvailable === 'function' && electronSafeStorage.isEncryptionAvailable()) {
    try {
      const payloadSensivel = JSON.stringify({ salt, hash, dataAtualizacao });
      const bufferCriptografado = electronSafeStorage.encryptString(payloadSensivel);
      registro.safeStorageCipher = bufferCriptografado.toString('base64');
      registro.safeStorageAtivo = true;
    } catch (e) {
      console.warn('[cryptoHelper] Falha ao aplicar safeStorage adicional, mantendo PBKDF2:', e.message);
    }
  }

  return registro;
}

/**
 * Compara a senha digitada com a estrutura salva de forma resistente a timing attacks.
 * @param {string} senhaDigitada 
 * @param {object} configSeguranca 
 * @returns {boolean}
 */
function verificarSenha(senhaDigitada, configSeguranca) {
  if (!senhaDigitada || typeof senhaDigitada !== 'string' || !configSeguranca) {
    return false;
  }

  // 1. Suporte ao formato CCO_SECURE_V2 (PBKDF2-SHA512)
  if (configSeguranca.salt && configSeguranca.hash) {
    try {
      const iteracoes = configSeguranca.iteracoes || ITERACOES_PADRAO;
      const hashCalculado = derivarHash(senhaDigitada, configSeguranca.salt, iteracoes);

      const bufCalculado = Buffer.from(hashCalculado, 'hex');
      const bufArmazenado = Buffer.from(configSeguranca.hash, 'hex');

      if (bufCalculado.length !== bufArmazenado.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufCalculado, bufArmazenado);
    } catch (err) {
      console.error('[cryptoHelper] Erro durante verificação criptográfica:', err.message);
      return false;
    }
  }

  // 2. Fallback temporário de compatibilidade se ainda estiver no formato legado (texto puro)
  if (configSeguranca.senhaMestra) {
    return senhaDigitada.trim() === String(configSeguranca.senhaMestra).trim();
  }

  return false;
}

/**
 * Carrega o arquivo seguranca.json. Se contiver senha em texto plano legada,
 * executa a auto-migração imediata, gravando o formato blindado em disco.
 * Se o arquivo não existir ou estiver corrompido, inicializa de forma segura com o padrão de fábrica.
 * 
 * @param {string} dataJsonPath Caminho para data/seguranca.json
 * @param {string} [rootJsonPath] Caminho secundário de espelho (se aplicável)
 * @param {object} [electronSafeStorage] Objeto safeStorage do Electron
 * @returns {object} Objeto blindado seguro
 */
function carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath = null, electronSafeStorage = null) {
  let configRaw = null;
  let caminhoEncontrado = null;

  if (fs.existsSync(dataJsonPath)) {
    try {
      configRaw = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
      caminhoEncontrado = dataJsonPath;
    } catch (e) {
      console.warn('[cryptoHelper] Falha ao ler data/seguranca.json, tentando reparar:', e.message);
      configRaw = null;
    }
  }

  if (!configRaw && rootJsonPath && fs.existsSync(rootJsonPath)) {
    try {
      configRaw = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
      caminhoEncontrado = rootJsonPath;
    } catch (e) {
      configRaw = null;
    }
  }

  // Caso 1: Arquivo não existe ou inválido -> Inicializa padrão blindado (sem texto plano)
  if (!configRaw || (!configRaw.hash && !configRaw.senhaMestra)) {
    console.log('[cryptoHelper] Inicializando seguranca.json com padrão blindado PBKDF2...');
    const novoRegistro = gerarRegistroSeguro(SENHA_PADRAO_FABRICA, electronSafeStorage);
    salvarEmDisco(dataJsonPath, rootJsonPath, novoRegistro);
    return novoRegistro;
  }

  // Caso 2: Detectou senha legada em texto plano -> Auto-migração imediata
  if (configRaw.senhaMestra && !configRaw.hash) {
    console.log('[cryptoHelper] 🔒 ALERTA DE SEGURANÇA: Senha legada em texto plano detectada! Executando auto-migração para PBKDF2-HMAC-SHA512...');
    const senhaLegada = String(configRaw.senhaMestra).trim();
    const dataExistente = configRaw.dataAtualizacao || new Date().toISOString();
    
    const registroBlindado = gerarRegistroSeguro(senhaLegada, electronSafeStorage);
    registroBlindado.dataAtualizacao = dataExistente;

    // Sobrescreve no disco eliminando completamente o texto plano
    salvarEmDisco(dataJsonPath, rootJsonPath, registroBlindado);
    console.log('[cryptoHelper] ✓ Arquivo seguranca.json blindado com sucesso. Nenhuma senha legível permanece em disco.');
    return registroBlindado;
  }

  // Caso 3: Já está no formato seguro CCO_SECURE_V2
  return configRaw;
}

/**
 * Grava de forma segura no disco (garantindo diretórios).
 */
function salvarEmDisco(dataJsonPath, rootJsonPath, registro) {
  try {
    const dir = path.dirname(dataJsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const conteudo = JSON.stringify(registro, null, 2);
    fs.writeFileSync(dataJsonPath, conteudo, 'utf-8');

    if (rootJsonPath && rootJsonPath !== dataJsonPath) {
      try {
        fs.writeFileSync(rootJsonPath, conteudo, 'utf-8');
      } catch (e) {}
    }
  } catch (err) {
    console.error('[cryptoHelper] Falha ao gravar arquivo seguro em disco:', err.message);
  }
}

/**
 * Retorna os metadados públicos seguros para resposta de API (sem salt, hash ou senha).
 * @param {object} configSegura 
 * @returns {object}
 */
function obterMetadadosPublicos(configSegura) {
  return {
    success: true,
    protegido: true,
    formato: configSegura.formato || 'CCO_SECURE_V2',
    tipoCriptografia: configSegura.safeStorageAtivo 
      ? 'PBKDF2-HMAC-SHA512 (100.000 iterações) + Electron safeStorage (DPAPI)'
      : 'PBKDF2-HMAC-SHA512 (100.000 iterações com Salt Aleatório)',
    dataAtualizacao: configSegura.dataAtualizacao || new Date().toISOString()
  };
}

module.exports = {
  ITERACOES_PADRAO,
  SENHA_PADRAO_FABRICA,
  derivarHash,
  gerarRegistroSeguro,
  verificarSenha,
  carregarOuMigrarSeguranca,
  salvarEmDisco,
  obterMetadadosPublicos
};
