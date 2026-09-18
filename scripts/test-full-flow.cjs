const http = require('http');
const path = require('path');
const fs = require('fs');

async function testEndpoint(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', err => reject(err));
  });
}

async function runTests() {
  console.log('=== TESTE DE VALIDAÇÃO DOS DADOS E ENDPOINTS LOCAIS ===\n');

  try {
    const oc = await testEndpoint('/api/ocorrencias');
    console.log(`✓ /api/ocorrencias: HTTP ${oc.status}, Total: ${Array.isArray(oc.data) ? oc.data.length : 0} registros`);
    if (Array.isArray(oc.data) && oc.data.length > 0) {
      console.log(`   Primeiro RO: ${oc.data[0].numeroRO} - ${oc.data[0].titulo} (Fotos: ${oc.data[0].fotos.length})`);
      console.log(`   Nome PDF padrão: ${oc.data[0].nomeArquivoPdf}`);
    }

    const prov = await testEndpoint('/api/provisorios');
    console.log(`✓ /api/provisorios: HTTP ${prov.status}, Total: ${Array.isArray(prov.data) ? prov.data.length : 0} registros`);

    const vis = await testEndpoint('/api/visitantes');
    console.log(`✓ /api/visitantes: HTTP ${vis.status}, Total: ${Array.isArray(vis.data) ? vis.data.length : 0} registros`);

    const rfid = await testEndpoint('/api/rfid');
    console.log(`✓ /api/rfid: HTTP ${rfid.status}, Total: ${Array.isArray(rfid.data) ? rfid.data.length : 0} registros`);

    const dir = await testEndpoint('/api/diretorio-padrao');
    console.log(`✓ /api/diretorio-padrao: HTTP ${dir.status}, Diretório Seguro: ${dir.data?.defaultExportDir}`);
  } catch (err) {
    console.error('Erro ao conectar ao servidor local:', err.message);
  }
}

runTests();
