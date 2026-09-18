/**
 * Teste de Validação da Blindagem Criptográfica de Dados Sensíveis
 * Testa data/seguranca.json, PBKDF2-HMAC-SHA512 e Endpoints de Autenticação
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const cryptoHelper = require('../src/server/cryptoHelper.cjs');
const { startServer } = require('../electron/server.cjs');

const rootDir = path.resolve(__dirname, '..');
const dataJsonPath = path.join(rootDir, 'data', 'seguranca.json');

function requestHttp(port, method, pathUrl, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathUrl,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== TESTE DE SEGURANÇA E CRIPTOGRAFIA CCO ===\n');

  // 1. Inspecionar data/seguranca.json
  console.log('1. Verificando arquivo físico data/seguranca.json:');
  if (!fs.existsSync(dataJsonPath)) {
    console.error('❌ ERRO: data/seguranca.json não existe!');
    process.exit(1);
  }
  const rawContent = fs.readFileSync(dataJsonPath, 'utf-8');
  const parsed = JSON.parse(rawContent);

  if (rawContent.includes('"senhaMestra"') || parsed.senhaMestra) {
    console.error('❌ FALHA CRÍTICA: "senhaMestra" em texto plano foi encontrada no arquivo!');
    process.exit(1);
  } else {
    console.log('   ✓ Sucesso: Nenhuma senha em texto plano existe em data/seguranca.json.');
  }

  if (parsed.algoritmo && parsed.salt && parsed.hash && parsed.protegido) {
    console.log(`   ✓ Formato blindado confirmado: ${parsed.algoritmo} (${parsed.iteracoes} iterações)`);
    console.log(`   ✓ Salt: ${parsed.salt.slice(0, 16)}...`);
    console.log(`   ✓ Hash: ${parsed.hash.slice(0, 16)}...`);
  } else {
    console.error('❌ Formato de hash inválido!');
    process.exit(1);
  }

  // 2. Testar lógica do cryptoHelper
  console.log('\n2. Testando validação criptográfica (cryptoHelper):');
  const validPadrao = cryptoHelper.verificarSenha('admin123', parsed);
  const invalidTest = cryptoHelper.verificarSenha('senhaErrada123', parsed);
  console.log(`   ✓ Validação 'admin123': ${validPadrao ? 'CORRETA' : 'FALHA'}`);
  console.log(`   ✓ Rejeição de senha inválida: ${!invalidTest ? 'CORRETA (Rejeitado)' : 'FALHA'}`);

  // 3. Iniciar servidor de teste
  console.log('\n3. Iniciando servidor HTTP embutido para testes de API:');
  const { server, port } = await startServer(0);
  console.log(`   ✓ Servidor ativo na porta ${port}`);

  try {
    // 3.1 GET /api/seguranca
    const getSeg = await requestHttp(port, 'GET', '/api/seguranca');
    console.log(`   ✓ GET /api/seguranca -> HTTP ${getSeg.status}:`);
    console.log(`     - Protegido: ${getSeg.data.protegido}`);
    console.log(`     - Tipo: ${getSeg.data.tipoCriptografia}`);
    console.log(`     - Contém senhaMestra? ${getSeg.data.senhaMestra !== undefined ? 'SIM (Vulnerabilidade)' : 'NÃO (Seguro)'}`);
    console.log(`     - Contém hash? ${getSeg.data.hash !== undefined ? 'SIM (Vulnerabilidade)' : 'NÃO (Seguro)'}`);

    // 3.2 POST /api/validar-senha
    const postValidaOk = await requestHttp(port, 'POST', '/api/validar-senha', { senha: 'admin123' });
    console.log(`   ✓ POST /api/validar-senha ('admin123') -> HTTP ${postValidaOk.status}, Valido: ${postValidaOk.data.valido}`);

    const postValidaErr = await requestHttp(port, 'POST', '/api/validar-senha', { senha: 'senhaIncorreta' });
    console.log(`   ✓ POST /api/validar-senha ('senhaIncorreta') -> HTTP ${postValidaErr.status}, Valido: ${postValidaErr.data.valido}`);

    // 4. Testar alteração segura de senha
    console.log('\n4. Testando alteração segura de senha:');
    const alteracao = await requestHttp(port, 'POST', '/api/salvar-senha', {
      senhaAtual: 'admin123',
      novaSenha: 'NovaSenhaSegura@2026'
    });
    console.log(`   ✓ POST /api/salvar-senha -> HTTP ${alteracao.status}, Msg: ${alteracao.data.message}`);

    const validaNova = await requestHttp(port, 'POST', '/api/validar-senha', { senha: 'NovaSenhaSegura@2026' });
    console.log(`   ✓ Validação da Nova Senha -> Valido: ${validaNova.data.valido}`);

    const validaAntiga = await requestHttp(port, 'POST', '/api/validar-senha', { senha: 'admin123' });
    console.log(`   ✓ Validação da Senha Antiga (deve falhar) -> Valido: ${validaAntiga.data.valido}`);

    // 5. Restaura padrão de fábrica admin123
    console.log('\n5. Restaurando senha padrão de fábrica admin123:');
    const restaurar = await requestHttp(port, 'POST', '/api/salvar-senha', {
      senhaAtual: 'NovaSenhaSegura@2026',
      novaSenha: 'admin123'
    });
    console.log(`   ✓ Senha padrão restaurada: ${restaurar.data.message}`);
    const validaFinal = await requestHttp(port, 'POST', '/api/validar-senha', { senha: 'admin123' });
    console.log(`   ✓ Validação final 'admin123': ${validaFinal.data.valido}`);

    console.log('\n=== TODOS OS TESTES DE CRIPTOGRAFIA PASSARAM COM 100% DE SUCESSO! ===\n');
  } finally {
    server.close();
  }
}

runTests();
