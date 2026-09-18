// Script Oficial de Limpeza da Base de Dados (Reset to Zero) - Rev 1.2
// CCO Security Suite - TecPrimus Soluções Tecnológicas
const fs = require('fs');
const path = require('path');
const cryptoHelper = require('../src/server/cryptoHelper.cjs');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const templatesDir = path.join(rootDir, 'templates');

console.log('===============================================================');
console.log(' [CCO Security Suite Rev 1.2] Reset to Zero & Limpeza de Base');
console.log('===============================================================');

// 1. Garante diretórios
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

// 2. Configurações Padrão Oficiais
const cargosPadrao = [
  { id: 'cargo-1', nome: 'Op. Central de Segurança', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'cargo-2', nome: 'Tec. em SDAI', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'cargo-3', nome: 'Coordenador Patrimonial', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'cargo-4', nome: 'Vigilante Portaria 1', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'cargo-5', nome: 'Vigilante Portaria 2', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'cargo-6', nome: 'Vigilante Caldeira', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'cargo-7', nome: 'Vigilante Ronda', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
];

const operadoresPadrao = [
  { id: 1, matricula: 'OP001', nome: 'Op. Operador 01', cargo: 'Op. Central de Segurança', turno: '12x36 Diurno', status: 'Ativo' },
  { id: 2, matricula: 'OP002', nome: 'Op. Operador 02', cargo: 'Tec. em SDAI', turno: '12x36 Noturno', status: 'Ativo' }
];

const vigilantesPadrao = [
  { id: 1, matricula: 'VIG001', nome: 'Vigilante Portaria 1', cargo: 'Vigilante Portaria 1', posto: 'Portaria 1 - Principal', status: 'Ativo' },
  { id: 2, matricula: 'VIG002', nome: 'Vigilante Portaria 2', cargo: 'Vigilante Portaria 2', posto: 'Portaria 2 - Cargas & Serviços', status: 'Ativo' }
];

const turnosPadrao = [
  { id: 1, nome: '12x36 Diurno', descricao: 'Escala Diurna (06:00 às 18:00)' },
  { id: 2, nome: '12x36 Noturno', descricao: 'Escala Noturna (18:00 às 06:00)' },
  { id: 3, nome: 'Administrativo', descricao: 'Escala Comercial (08:00 às 17:00)' }
];

const observacoesPadrao = [
  { id: 1, nome: 'ESQUECEU' },
  { id: 2, nome: 'PERDEU' },
  { id: 3, nome: 'COM DEFEITO' },
  { id: 4, nome: 'BLOQUEADO' },
  { id: 5, nome: 'RETORNO DE FÉRIAS' },
  { id: 6, nome: 'AINDA NÃO POSSUI' },
  { id: 7, nome: 'NÃO PASSOU' },
  { id: 8, nome: 'FURTADO' },
  { id: 9, nome: 'ATM' },
  { id: 10, nome: 'OUTROS' }
];

const responsaveisPadrao = {
  gerenteSite: 'Gerência de Operações',
  coordenacao: 'Coordenação de Segurança Corporativa',
  fiscalContrato: 'Fiscalização de Contrato',
  caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
};

const segurancaPadrao = cryptoHelper.gerarRegistroSeguro('admin123');

// Função auxiliar para carregar existente ou usar padrão
function carregarOuPadrao(filename, padrao) {
  const p = path.join(dataDir, filename);
  if (fs.existsSync(p)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
        return parsed;
      }
    } catch (e) {}
  }
  return padrao;
}

const cargosPreservados = carregarOuPadrao('cargos.json', cargosPadrao);
const operadoresPreservados = carregarOuPadrao('operadores.json', operadoresPadrao);
const vigilantesPreservados = carregarOuPadrao('vigilantes.json', vigilantesPadrao);
const turnosPreservados = carregarOuPadrao('turnos.json', turnosPadrao);
const observacoesPreservadas = carregarOuPadrao('observacoes.json', observacoesPadrao);
const responsaveisPreservados = carregarOuPadrao('responsaveis.json', responsaveisPadrao);
const segurancaPreservada = carregarOuPadrao('seguranca.json', segurancaPadrao);

// 3. Monta o Template de Fábrica Oficial Limpo (Rev 1.2)
const databaseTemplateLimpo = {
  versao: '1.2.0',
  dataGeracao: new Date().toISOString(),
  descricao: 'Base Limpa de Fábrica (Clean State) - CCO Security Suite Rev 1.2',
  ocorrencias: [],
  provisorios: [],
  visitantes: [],
  rfid: [],
  operadores: operadoresPreservados,
  vigilantes: vigilantesPreservados,
  cargos: cargosPreservados,
  turnos: turnosPreservados,
  observacoes: observacoesPreservadas,
  responsaveis: responsaveisPreservados,
  seguranca: segurancaPreservada
};

// Grava em data/ e templates/
fs.writeFileSync(path.join(dataDir, 'database_template.json'), JSON.stringify(databaseTemplateLimpo, null, 2), 'utf-8');
fs.writeFileSync(path.join(templatesDir, 'database_template.json'), JSON.stringify(databaseTemplateLimpo, null, 2), 'utf-8');
console.log('  ✓ Template limpo oficial database_template.json (Rev 1.2) gerado.');

// 4. Esvazia Tabelas Transacionais em data/
const transacionaisZerados = {
  'ocorrencias.json': [],
  'provisorios.json': [],
  'visitantes.json': [],
  'rfid.json': []
};

for (const [file, content] of Object.entries(transacionaisZerados)) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(content, null, 2), 'utf-8');
  console.log(`  ✓ Tabela transacional data/${file} esvaziada (0 registros).`);
}

// 5. Garante Arquivos de Configuração em data/
const configuracoes = {
  'cargos.json': cargosPreservados,
  'operadores.json': operadoresPreservados,
  'vigilantes.json': vigilantesPreservados,
  'turnos.json': turnosPreservados,
  'observacoes.json': observacoesPreservadas,
  'responsaveis.json': responsaveisPreservados,
  'seguranca.json': segurancaPreservada
};

for (const [file, content] of Object.entries(configuracoes)) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(content, null, 2), 'utf-8');
  console.log(`  ✓ Configuração data/${file} preservada/inicializada.`);
}

// Também mantém cargos.json na raiz sincronizado
fs.writeFileSync(path.join(rootDir, 'cargos.json'), JSON.stringify(cargosPreservados, null, 2), 'utf-8');

// 6. Varredura e Limpeza de Bancos SQLite (se existirem arquivos .db ou .sqlite)
function limparBancosSqliteSeHouver(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
      limparBancosSqliteSeHouver(fullPath);
    } else if (file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sqlite3')) {
      try {
        console.log(`  [SQLite] Detectado banco de dados: ${fullPath}`);
        // Se existir um módulo sqlite3 ou better-sqlite3 instalado, executaria limpeza.
        // Como fallback de baixo nível, remove ou zera o arquivo para criar schema limpo
        fs.unlinkSync(fullPath);
        console.log(`  ✓ Banco SQLite ${file} higienizado com sucesso.`);
      } catch (e) {
        console.warn(`  ! Aviso ao limpar SQLite ${file}: ${e.message}`);
      }
    }
  }
}
limparBancosSqliteSeHouver(rootDir);

// 7. Remove Arquivos Residuais de Teste da Raiz do Projeto
const residuaisRaiz = [
  'ocorrencias.json',
  'ocorrencias.xlsx',
  'operadores.json',
  'operadores.xlsx',
  'vigilantes.json',
  'vigilantes.xlsx',
  'provisorios.json',
  'visitantes.json',
  'rfid.json',
  'CONTROLE DE CREDENCIAL 2026.xlsx',
  'observacoes.json',
  'turnos.json',
  'responsaveis.json',
  'seguranca.json'
];

for (const f of residuaisRaiz) {
  const p = path.join(rootDir, f);
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
      console.log(`  ✓ Removido arquivo residual da raiz: ${f}`);
    } catch (e) {
      console.warn(`  ! Não foi possível remover ${f}: ${e.message}`);
    }
  }
}

// 8. Higieniza Pasta exports/
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
  console.log('  ✓ Diretório exports/ higienizado.');
}

console.log('===============================================================');
console.log(' [Reset to Zero] Concluído com Sucesso! Base pronta para Rev 1.2');
console.log('===============================================================');
