// Teste Automatizado de Licenciamento, HWID Binding e Proteção Contra Cópia
// CCO Security Suite Rev 1.2 — TecPrimus Soluções Tecnológicas
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const licensingHelper = require('../electron/licensingHelper.cjs');

console.log('===============================================================');
console.log(' [TEST SUITE] Validação de Licenciamento, HWID e Blindagem');
console.log('===============================================================');

// Mock simples do app do Electron
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') return path.resolve(__dirname, '..', 'data');
    return path.resolve(__dirname, '..');
  }
};

const licenseFile = path.resolve(__dirname, '..', 'data', 'license.lic');

// Limpa licença prévia de teste para iniciar estado limpo
if (fs.existsSync(licenseFile)) {
  fs.unlinkSync(licenseFile);
}

// TESTE 1: Geração de HWID Estável
console.log('\n[1] Testando cálculo do HWID da máquina local...');
const hwid = licensingHelper.obterHwidLocal();
console.log(`    HWID Gerado: ${hwid}`);
assert(typeof hwid === 'string' && hwid.startsWith('CCO-HWID-'), 'HWID deve iniciar com CCO-HWID-');
assert(hwid.length >= 20, 'HWID deve possuir comprimento suficiente');
console.log('    ✓ HWID calculado com sucesso no formato canônico.');

// TESTE 2: Verificação de Estado Não Ativado
console.log('\n[2] Testando verificação em ambiente limpo (sem licença)...');
const statusInicial = licensingHelper.verificarStatusLicenca(mockApp);
console.log(`    Status retornado: ${statusInicial.status}`);
assert.strictEqual(statusInicial.status, 'NOT_ACTIVATED', 'Deveria retornar NOT_ACTIVATED quando não há licença.');
console.log('    ✓ Detectou corretamente ausência de licença.');

// TESTE 3: Tentativa de Ativação com Senha Incorreta
console.log('\n[3] Testando ativação com senha incorreta ("SENHA_ERRADA")...');
const ativacaoInvalida = licensingHelper.ativarLicencaComSenha('SENHA_ERRADA', mockApp);
console.log(`    Sucesso: ${ativacaoInvalida.sucesso}, Mensagem: "${ativacaoInvalida.message}"`);
assert.strictEqual(ativacaoInvalida.sucesso, false, 'Não deve ativar com senha incorreta.');
assert(!fs.existsSync(licenseFile), 'Arquivo de licença não pode ter sido criado.');
console.log('    ✓ Recusou com segurança senha não autorizada.');

// TESTE 4: Ativação com a Senha Correta (YAGO@2806)
console.log('\n[4] Testando ativação com a senha correta ("YAGO@2806")...');
const ativacaoCorreta = licensingHelper.ativarLicencaComSenha('YAGO@2806', mockApp);
console.log(`    Sucesso: ${ativacaoCorreta.sucesso}, Mensagem: "${ativacaoCorreta.message}"`);
assert.strictEqual(ativacaoCorreta.sucesso, true, 'Deve ativar com YAGO@2806.');
assert(fs.existsSync(licenseFile), 'Arquivo de licença deve existir em disco.');
console.log('    ✓ Licença ativada e gravada com sucesso em disco.');

// TESTE 5: Validação da Licença Ativada na Mesma Máquina
console.log('\n[5] Testando verificação da licença ativa na mesma máquina...');
const statusAtivo = licensingHelper.verificarStatusLicenca(mockApp);
console.log(`    Status retornado: ${statusAtivo.status}, HWID: ${statusAtivo.currentHwid}`);
assert.strictEqual(statusAtivo.status, 'VALID', 'Licença deve ser VALID na mesma máquina.');
assert.strictEqual(statusAtivo.currentHwid, hwid, 'HWID atual deve coincidir com o gerado.');
console.log('    ✓ Licença verificada como válida e íntegra.');

// TESTE 6: Simulação de Cópia para Outro Computador (HWID Divergente)
console.log('\n[6] Testando detecção de cópia não autorizada para outro PC...');
// Criamos uma licença vinculada a outro HWID fictício
const crypto = require('crypto');
const fakeHwid = 'CCO-HWID-9999-8888-7777-6666';
const fakeDate = new Date().toISOString();
const SECRET = 'CCO_SECURITY_SUITE_HWID_BINDING_KEY_2026_YAGO_TECPRIMUS';
const fakeSignature = crypto.createHmac('sha512', SECRET)
  .update(`${fakeHwid}:1.2.0:${fakeDate}`)
  .digest('hex');

const fakePayload = JSON.stringify({
  hwid: fakeHwid,
  version: '1.2.0',
  activatedAt: fakeDate,
  signature: fakeSignature
});

// Encripta e sobrescreve
const AES_KEY = crypto.createHash('sha256').update(SECRET).digest();
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
let enc = cipher.update(fakePayload, 'utf-8', 'hex');
enc += cipher.final('hex');
fs.writeFileSync(licenseFile, iv.toString('hex') + ':' + enc, 'utf-8');

const statusMismatch = licensingHelper.verificarStatusLicenca(mockApp);
console.log(`    Status retornado: ${statusMismatch.status}`);
console.log(`    HWID Salvo: ${statusMismatch.savedHwid} vs Atual: ${statusMismatch.currentHwid}`);
assert.strictEqual(statusMismatch.status, 'HWID_MISMATCH', 'Deve detectar violação por divergência de hardware.');
assert.strictEqual(statusMismatch.message, 'Erro de Violação de Licença / Cópia Não Autorizada');
console.log('    ✓ Detectou violação de cópia não autorizada com mensagem de bloqueio imediato!');

// Limpeza final do arquivo de teste temporário
if (fs.existsSync(licenseFile)) {
  fs.unlinkSync(licenseFile);
}

console.log('\n===============================================================');
console.log(' [TEST SUITE] Todos os 6 testes passaram com 100% de sucesso!');
console.log('===============================================================');
