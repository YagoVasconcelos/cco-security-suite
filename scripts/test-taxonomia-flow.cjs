const fs = require('fs');
const path = require('path');
const http = require('http');

const TAXONOMIA_FILE = path.join(__dirname, '..', 'data', 'taxonomia_predios_areas.json');

console.log('=== TESTE DE INTEGRAÇÃO: TAXONOMIA DE PRÉDIOS E ÁREAS ===');

// 1. Verificar arquivo JSON no disco
if (!fs.existsSync(TAXONOMIA_FILE)) {
  console.error('❌ Arquivo data/taxonomia_predios_areas.json não encontrado!');
  process.exit(1);
}

const raw = fs.readFileSync(TAXONOMIA_FILE, 'utf8');
let list;
try {
  list = JSON.parse(raw);
} catch (e) {
  console.error('❌ Falha ao parsear JSON:', e);
  process.exit(1);
}

console.log(`✓ Arquivo carregado com sucesso. Total de registros: ${list.length}`);
if (list.length < 90) {
  console.error(`❌ Esperado ao menos 90 registros, encontrado: ${list.length}`);
  process.exit(1);
}

// 2. Verificar estrutura dos itens
const first = list[0];
if (!first.id || !first.predio || !first.area || !first.status) {
  console.error('❌ Formato inválido de item:', first);
  process.exit(1);
}
console.log('✓ Estrutura de dados válida (id, predio, area, status, dataCadastro).');

// 3. Verificar especificamente CATRACA RESTAURANTE em RESTAURANTE (SODEXO)
const restauranteCatraca = list.find(
  it => it.predio === 'RESTAURANTE (SODEXO)' && it.area === 'CATRACA RESTAURANTE'
);
if (restauranteCatraca) {
  console.log('✓ Área "CATRACA RESTAURANTE" confirmada em "RESTAURANTE (SODEXO)".');
} else {
  console.error('❌ Área "CATRACA RESTAURANTE" não encontrada em "RESTAURANTE (SODEXO)"!');
  process.exit(1);
}

// 4. Testar endpoint da API REST (Vite dev server rodando na porta 3001)
function testarApiGet() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/taxonomia-predios-areas', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            console.log(`✓ GET /api/taxonomia-predios-areas OK! Retornou ${json.length} itens.`);
            resolve(json);
          } else {
            reject(new Error('Resposta inválida (não é array): ' + data));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', (err) => reject(err));
  });
}

function testarApiPost(novosDados) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(novosDados);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/salvar-taxonomia-predios-areas',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            console.log(`✓ POST /api/salvar-taxonomia-predios-areas OK! Salvou ${json.count} itens.`);
            resolve(json);
          } else {
            reject(new Error('Falha ao salvar: ' + data));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    const dadosApi = await testarApiGet();
    
    // Inserir item temporário de teste
    const testId = 'test_taxonomia_' + Date.now();
    const itemTeste = {
      id: testId,
      predio: 'PRÉDIO TESTE AUTOMATIZADO',
      area: 'SALA DE TESTE INTEGRADO',
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    console.log('Testando salvamento de novo Prédio/Área via POST...');
    await testarApiPost([...dadosApi, itemTeste]);

    // Verificar se foi persistido
    const dadosAtualizados = await testarApiGet();
    const achou = dadosAtualizados.find(x => x.id === testId);
    if (!achou) {
      throw new Error('Item de teste não foi persistido corretamente no backend!');
    }
    console.log('✓ Item de teste inserido e validado com sucesso via API!');

    // Reverter/Limpar o item de teste
    console.log('Revertendo item de teste para manter os dados canônicos limpos...');
    const limpos = dadosAtualizados.filter(x => x.id !== testId);
    await testarApiPost(limpos);

    const dadosFinais = await testarApiGet();
    if (dadosFinais.some(x => x.id === testId)) {
      throw new Error('Falha ao limpar item de teste!');
    }
    console.log(`✓ Base canônica restaurada com perfeição. Total: ${dadosFinais.length}`);
    console.log('\n🎉 TODOS OS TESTES DE INTEGRAÇÃO DA TAXONOMIA PASSARAM COM SUCESSO!');
  } catch (err) {
    console.error('❌ Erro no teste de integração da API:', err.message);
    process.exit(1);
  }
}

run();
