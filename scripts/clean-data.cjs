// Script de Limpeza de Dados Pré-Build (Clean Build)
// Garante que a versão de produção (Release) seja empacotada com banco de dados 100% zerado
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const templatesDir = path.join(rootDir, 'templates');
const templateJsonPath = path.join(dataDir, 'database_template.json');

console.log('[Clean Build] Iniciando processo de higienização do banco de dados...');

if (!fs.existsSync(templateJsonPath)) {
  console.error('[Clean Build] ERRO: Arquivo database_template.json não encontrado em data/!');
  process.exit(1);
}

const template = JSON.parse(fs.readFileSync(templateJsonPath, 'utf-8'));

// 1. Garante que data/ existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 2. Reseta arquivos operacionais em data/
const filesToReset = {
  'ocorrencias.json': template.ocorrencias || [],
  'provisorios.json': template.provisorios || [],
  'visitantes.json': template.visitantes || [],
  'rfid.json': template.rfid || [],
  'seguranca.json': template.seguranca || require('../src/server/cryptoHelper.cjs').gerarRegistroSeguro('admin123'),
  'responsaveis.json': template.responsaveis || {
    gerenteSite: 'Gerência de Operações',
    coordenacao: 'Coordenação de Segurança Corporativa',
    fiscalContrato: 'Fiscalização de Contrato',
    caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
  },
  'operadores.json': template.operadores || [],
  'vigilantes.json': template.vigilantes || [],
  'turnos.json': template.turnos || [],
  'observacoes.json': template.observacoes || [],
  'cargos.json': template.cargos || [],
  'sugestoes_observacoes.json': template.sugestoes_observacoes || []
};

for (const [filename, content] of Object.entries(filesToReset)) {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`  ✓ data/${filename} zerado com template oficial.`);
}

// 3. Remove arquivos residuais de teste da raiz do projeto
const rootFilesToRemove = [
  'ocorrencias.json',
  'ocorrencias.xlsx',
  'operadores.json',
  'operadores.xlsx',
  'vigilantes.json',
  'vigilantes.xlsx',
  'provisorios.json',
  'visitantes.json',
  'rfid.json',
  'responsaveis.json',
  'seguranca.json',
  'turnos.json',
  'observacoes.json'
];

for (const file of rootFilesToRemove) {
  const p = path.join(rootDir, file);
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
      console.log(`  ✓ Removido arquivo residual da raiz: ${file}`);
    } catch (e) {
      console.warn(`  ! Aviso ao remover ${file}: ${e.message}`);
    }
  }
}

// 4. Limpa exports/ para não levar PDFs de teste
const exportsDir = path.join(rootDir, 'exports');
if (fs.existsSync(exportsDir)) {
  const files = fs.readdirSync(exportsDir);
  for (const f of files) {
    if (f !== '.gitkeep') {
      try {
        fs.unlinkSync(path.join(exportsDir, f));
      } catch (e) {}
    }
  }
  console.log('  ✓ Pasta exports/ higienizada.');
}

console.log('[Clean Build] Concluído! Banco de dados preparado para Release de Produção.');
