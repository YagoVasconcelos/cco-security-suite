/**
 * Script de Vínculo Relacional do Efetivo e Correção Crítica de Status de Cautelas
 * 
 * 1. Popula data/vigilantes.json com os 38 vigilantes canônicos (35 reais + 3 postos)
 * 2. Popula data/operadores.json com o efetivo da central CCO (Op. Yago Marinho, etc.)
 * 3. Normaliza data/provisorios.json:
 *    - Resolve conflito de status: se dataDevolucao é nula, situacao = 'NÃO DEVOLVIDO'
 *    - Vincula 100% dos nomes de vigilante e vigilanteDevolucao à tabela canônica
 *    - Limpa notas e anotações acidentais nas colunas de nomes
 * 4. Normaliza data/visitantes.json:
 *    - Garante vigilantes canônicos de portaria
 * 5. Normaliza data/ocorrencias.json:
 *    - Associa as 31 ocorrências a 'Op. Yago Marinho'
 *    - Atualiza ocorrencias.xlsx
 * 6. Sincroniza data/database_template.json e templates/database_template.json
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const templatesDir = path.join(rootDir, 'templates');

console.log('=== INICIANDO VÍNCULO RELACIONAL E CORREÇÃO DE STATUS ===\n');

// 1. Roster Oficial de Vigilantes (38 canônicos)
const vigilantesOficiais = [
  { id: 'vig-01', nome: 'Rosana Cruz', matricula: 'VIG-2001', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-02', nome: 'João Paulo', matricula: 'VIG-2002', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-03', nome: 'Ana Célia', matricula: 'VIG-2003', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-04', nome: 'Jéssica Santos', matricula: 'VIG-2004', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-05', nome: 'Elaine Moura', matricula: 'VIG-2005', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-06', nome: 'Ana Costa', matricula: 'VIG-2006', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-07', nome: 'Meggy Maia', matricula: 'VIG-2007', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-08', nome: 'Marcilene Silva', matricula: 'VIG-2008', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-09', nome: 'Verusca Bezerra', matricula: 'VIG-2009', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-10', nome: 'Bulhosa', matricula: 'VIG-2010', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-11', nome: 'Victor Rocha', matricula: 'VIG-2011', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-12', nome: 'Josimar Souza', matricula: 'VIG-2012', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-13', nome: 'Léo Lima', matricula: 'VIG-2013', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-14', nome: 'David Santos', matricula: 'VIG-2014', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-15', nome: 'João Natas', matricula: 'VIG-2015', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-16', nome: 'Helder Miranda', matricula: 'VIG-2016', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-17', nome: 'Rafael Bruno', matricula: 'VIG-2017', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-18', nome: 'Rafael Conceição', matricula: 'VIG-2018', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-19', nome: 'Rafael Dutra', matricula: 'VIG-2019', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-20', nome: 'Rafael', matricula: 'VIG-2020', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-21', nome: 'Nayara Pena', matricula: 'VIG-2021', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-22', nome: 'Mauro Silva', matricula: 'VIG-2022', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-23', nome: 'Wilson Leão', matricula: 'VIG-2023', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-24', nome: 'Silva', matricula: 'VIG-2024', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-25', nome: 'Johannes', matricula: 'VIG-2025', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-26', nome: 'Léo Jaime', matricula: 'VIG-2026', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-27', nome: 'Zeca Lima', matricula: 'VIG-2027', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-28', nome: 'Rafaela', matricula: 'VIG-2028', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-29', nome: 'Rangel', matricula: 'VIG-2029', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-30', nome: 'Douglas', matricula: 'VIG-2030', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-31', nome: 'Benjamin', matricula: 'VIG-2031', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-32', nome: 'Casemiro', matricula: 'VIG-2032', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-33', nome: 'Mikaelly', matricula: 'VIG-2033', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-34', nome: 'Elielson Lagoia', matricula: 'VIG-2034', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-35', nome: 'Raimundo', matricula: 'VIG-2035', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-36', nome: 'Ana Margarida', matricula: 'VIG-2036', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-37', nome: 'Zadiel Ferreira', matricula: 'VIG-2037', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Patrimonial', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Controle de Acesso P1' },
  { id: 'vig-38', nome: 'Vigilante Portaria 1', matricula: 'VIG-2038', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Portaria 1', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto principal de controle de acesso (P1)' },
  { id: 'vig-39', nome: 'Vigilante Portaria 2', matricula: 'VIG-2039', posto: 'Portaria 2', cargo: 'Vigilante Portaria 2', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto de controle de acesso de serviços / carga (P2)' },
  { id: 'vig-40', nome: 'Vigilante Ronda', matricula: 'VIG-2040', posto: 'Caldeira', cargo: 'Vigilante Ronda', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Ronda perimetral e fiscalização móvel' }
].map(v => ({ ...v, dataCadastro: '2026-01-01' }));

// Salva vigilantes oficiais
fs.writeFileSync(path.join(dataDir, 'vigilantes.json'), JSON.stringify(vigilantesOficiais, null, 2), 'utf-8');
console.log(`✓ data/vigilantes.json atualizado com ${vigilantesOficiais.length} vigilantes cadastrados.`);

// 2. Roster Oficial de Operadores (CCO Central)
const operadoresOficiais = [
  { id: 'op-01', nome: 'Op. Yago Marinho', matricula: 'CCO-2535', cargo: 'Tec. Segurança Eletrônica', turno: 'Comercial Adm', status: 'Ativo', observacoes: 'Administrador e Responsável Técnico CCO', dataCadastro: '2026-01-01' },
  { id: 'op-02', nome: 'Operador CCO Líder', matricula: 'CCO-1001', cargo: 'Operador CCO Líder', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Central de Operações de Segurança', dataCadastro: '2026-01-01' },
  { id: 'op-03', nome: 'Op. Central CFTV', matricula: 'CCO-1002', cargo: 'Operador CFTV', turno: '12x36 Noturno', status: 'Ativo', observacoes: 'Monitoramento contínuo de CFTV', dataCadastro: '2026-01-01' },
  { id: 'op-04', nome: 'Supervisor CCO', matricula: 'CCO-1003', cargo: 'Supervisor Operacional', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Supervisão de Efetivo e Ocorrências', dataCadastro: '2026-01-01' }
];

fs.writeFileSync(path.join(dataDir, 'operadores.json'), JSON.stringify(operadoresOficiais, null, 2), 'utf-8');
console.log(`✓ data/operadores.json atualizado com ${operadoresOficiais.length} operadores cadastrados.`);

// Dicionário de Normalização de Vigilantes
function normalizarNomeVigilante(nomeBruto, portaria = 'P1') {
  if (!nomeBruto || typeof nomeBruto !== 'string') {
    return portaria === 'P2' || String(portaria).includes('2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1';
  }

  const s = nomeBruto.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Notas acidentais
  if (s.includes('SEMPRE NOME') || s.includes('COLOCAR A OBS') || s.includes('FALTA PEGAR') || s.includes('PAGAMENTO NA SEXTA') || s === 'DE') {
    return portaria === 'P2' || String(portaria).includes('2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1';
  }

  if (s.includes('ROSANA')) return 'Rosana Cruz';
  if (s.includes('JOAO PAULO')) return 'João Paulo';
  if (s.includes('ANA CELIA')) return 'Ana Célia';
  if (s.includes('JESSICA')) return 'Jéssica Santos';
  if (s.includes('MOURA') || s.includes('ELAINE')) return 'Elaine Moura';
  if (s.includes('ANA COSTA')) return 'Ana Costa';
  if (s.includes('MAIA') || s.includes('MEGGY')) return 'Meggy Maia';
  if (s.includes('MARCILENE')) return 'Marcilene Silva';
  if (s.includes('VERUSCA')) return 'Verusca Bezerra';
  if (s.includes('BULHOSA')) return 'Bulhosa';
  if (s.includes('VICTOR')) return 'Victor Rocha';
  if (s.includes('JOSIMAR') || s.includes('JOZIMAR')) return 'Josimar Souza';
  if (s.includes('LEO LIMA') || (s.includes('LIMA') && !s.includes('ZECA'))) return 'Léo Lima';
  if (s.includes('DAIVID') || s.includes('DAVID')) return 'David Santos';
  if (s.includes('NATAS')) return 'João Natas';
  if (s.includes('HELDER')) return 'Helder Miranda';
  if (s.includes('RAFAEL BRUNO')) return 'Rafael Bruno';
  if (s.includes('RAFAEL CONCEICAO')) return 'Rafael Conceição';
  if (s.includes('DUTRA') || s.includes('DRUTRA')) return 'Rafael Dutra';
  if (s.includes('NAYARA') || s.includes('NAIARA')) return 'Nayara Pena';
  if (s.includes('MAURO')) return 'Mauro Silva';
  if (s.includes('WILSON')) return 'Wilson Leão';
  if (s === 'SILVA') return 'Silva';
  if (s.includes('JOHANNES') || s.includes('JONHANNES')) return 'Johannes';
  if (s.includes('LEO JAIME')) return 'Léo Jaime';
  if (s.includes('ZECA')) return 'Zeca Lima';
  if (s.includes('RAFAELA')) return 'Rafaela';
  if (s.includes('RANGEL')) return 'Rangel';
  if (s.includes('DOUGLAS')) return 'Douglas';
  if (s.includes('BENJAMIN')) return 'Benjamin';
  if (s.includes('CASEMIRO')) return 'Casemiro';
  if (s.includes('MIKAELLY')) return 'Mikaelly';
  if (s.includes('LAGOIA') || s.includes('ELIELSON')) return 'Elielson Lagoia';
  if (s.includes('RAIMUNDO')) return 'Raimundo';
  if (s.includes('MARGARIDA')) return 'Ana Margarida';
  if (s.includes('ZADIEL')) return 'Zadiel Ferreira';
  if (s === 'RAFAEL') return 'Rafael';
  if (s.includes('PORTARIA 2') || s.includes('P2')) return 'Vigilante Portaria 2';
  if (s.includes('RONDA')) return 'Vigilante Ronda';
  if (s.includes('PORTARIA 1') || s.includes('P1')) return 'Vigilante Portaria 1';

  // Procura correspondência parcial
  const vigMatch = vigilantesOficiais.find(v => v.nome.toUpperCase().includes(s) || s.includes(v.nome.toUpperCase()));
  if (vigMatch) return vigMatch.nome;

  return portaria === 'P2' || String(portaria).includes('2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1';
}

// 3. Normalização de data/provisorios.json
const provisoriosPath = path.join(dataDir, 'provisorios.json');
let provisorios = [];
if (fs.existsSync(provisoriosPath)) {
  provisorios = JSON.parse(fs.readFileSync(provisoriosPath, 'utf-8'));
}

let alteradosStatus = 0;
let alteradosVigilante = 0;

provisorios = provisorios.map(item => {
  let situacao = item.situacao || 'DEVOLVIDO';
  const isPerdido = situacao === 'PERDIDO' || item.status === 'PERDIDO' || item.observacao === 'PERDEU';
  const isPago = situacao === 'PAGO' || item.status === 'PAGO';

  // CORREÇÃO CRÍTICA DE STATUS:
  // Identifica registros que foram retirados recentemente (ex: hoje às 07:30) e que na realidade operacional estão em posse contínua
  const isCautelaAtivaReal = (item.colaborador && (item.colaborador.includes('EDIVALDO CARDOSOD') || item.colaborador.includes('ROGERIO GONCALVES') || item.colaborador.includes('ROGERIO GONÇALVES'))) && (item.dataRetirada === '2026-09-16' || item.dataRetirada === '2026-09-15');

  if (isCautelaAtivaReal) {
    situacao = 'NÃO DEVOLVIDO';
    item.dataDevolucao = null;
    item.horaDevolucao = null;
    item.tempoPermanencia = null;
    item.vigilanteDevolucao = null;
    alteradosStatus++;
  } else if (!isPerdido && !isPago) {
    if (!item.dataDevolucao) {
      if (situacao !== 'NÃO DEVOLVIDO') {
        situacao = 'NÃO DEVOLVIDO';
        alteradosStatus++;
      }
    } else {
      if (situacao !== 'DEVOLVIDO') {
        situacao = 'DEVOLVIDO';
        alteradosStatus++;
      }
    }
  }

  // Normalização de Vigilante de saída
  const vigNorm = normalizarNomeVigilante(item.vigilante, item.portaria);
  if (vigNorm !== item.vigilante) alteradosVigilante++;

  // Normalização de Vigilante de devolução
  let vigDevNorm = null;
  if (situacao === 'DEVOLVIDO' && item.dataDevolucao) {
    vigDevNorm = normalizarNomeVigilante(item.vigilanteDevolucao || item.vigilante, item.portaria);
  }

  // Tratamento de anotação de célula
  let obs = item.observacao || 'ESQUECEU';
  let obsComp = item.observacaoComplementar || null;
  const vBruto = String(item.vigilante || '').trim().toUpperCase();
  if (vBruto.includes('SEMPRE NOME') || vBruto.includes('COLOCAR A OBS') || vBruto.includes('FALTA PEGAR') || vBruto.includes('PAGAMENTO NA SEXTA')) {
    obsComp = obsComp ? `${obsComp} | Nota original: ${item.vigilante}` : `Nota: ${item.vigilante}`;
  }

  return {
    ...item,
    situacao,
    dataDevolucao: situacao === 'DEVOLVIDO' ? item.dataDevolucao : null,
    horaDevolucao: situacao === 'DEVOLVIDO' ? item.horaDevolucao : null,
    tempoPermanencia: situacao === 'DEVOLVIDO' ? item.tempoPermanencia : null,
    vigilante: vigNorm,
    vigilanteDevolucao: vigDevNorm,
    observacao: obs,
    observacaoComplementar: obsComp
  };
});

fs.writeFileSync(provisoriosPath, JSON.stringify(provisorios, null, 2), 'utf-8');
console.log(`✓ data/provisorios.json: ${provisorios.length} registros normalizados. Status corrigidos: ${alteradosStatus}, Vigilantes mapeados: ${alteradosVigilante}.`);

// 4. Normalização de data/visitantes.json
const visitantesPath = path.join(dataDir, 'visitantes.json');
let visitantes = [];
if (fs.existsSync(visitantesPath)) {
  visitantes = JSON.parse(fs.readFileSync(visitantesPath, 'utf-8'));
}

visitantes = visitantes.map(v => {
  const vigEnt = v.portaria && v.portaria.includes('2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1';
  const vigSai = v.dataSaida ? vigEnt : null;
  return {
    ...v,
    vigilanteEntrada: normalizarNomeVigilante(v.vigilanteEntrada || vigEnt, v.portaria),
    vigilanteSaida: v.dataSaida ? normalizarNomeVigilante(v.vigilanteSaida || vigSai, v.portaria) : null
  };
});

fs.writeFileSync(visitantesPath, JSON.stringify(visitantes, null, 2), 'utf-8');
console.log(`✓ data/visitantes.json: ${visitantes.length} visitantes normalizados.`);

// 5. Normalização de data/ocorrencias.json e ocorrencias.xlsx
const ocorrenciasPath = path.join(dataDir, 'ocorrencias.json');
let ocorrencias = [];
if (fs.existsSync(ocorrenciasPath)) {
  ocorrencias = JSON.parse(fs.readFileSync(ocorrenciasPath, 'utf-8'));
}

const operadorAdmin = 'Op. Yago Marinho';
ocorrencias = ocorrencias.map(o => {
  const resp = o.responsaveis || {};
  return {
    ...o,
    operador: operadorAdmin,
    responsaveis: {
      ...resp,
      operador: operadorAdmin
    }
  };
});

fs.writeFileSync(ocorrenciasPath, JSON.stringify(ocorrencias, null, 2), 'utf-8');
console.log(`✓ data/ocorrencias.json: ${ocorrencias.length} ocorrências vinculadas a '${operadorAdmin}'.`);

// Regenera ocorrencias.xlsx espelho
try {
  const wb = XLSX.utils.book_new();
  const linhasXlsx = ocorrencias.map(o => ({
    'NÚMERO DO RO': o.numeroRO || '',
    'DATA': o.data || '',
    'HORÁRIO': o.hora || '',
    'TÍTULO DO FATO': o.titulo || '',
    'TÓPICO / CLASSIFICAÇÃO': o.topico || '',
    'LOCAL / PRÉDIO': o.predio || o.local || '',
    'ÁREA': o.area || '',
    'GRAVIDADE': o.gravidade || 'BAIXA',
    'STATUS': o.status || 'FINALIZADO',
    'OPERADOR CCO': o.operador || operadorAdmin,
    'SÍNTESE / DESCRIÇÃO': o.descricao || '',
    'TOTAL ENVOLVIDOS': Array.isArray(o.envolvidos) ? o.envolvidos.length : 0,
    'TOTAL FOTOS': Array.isArray(o.fotos) ? o.fotos.length : 0
  }));
  const ws = XLSX.utils.json_to_sheet(linhasXlsx);
  XLSX.utils.book_append_sheet(wb, ws, 'Ocorrências CCO');
  XLSX.writeFile(wb, path.join(rootDir, 'ocorrencias.xlsx'));
  console.log(`✓ ocorrencias.xlsx regravado com sucesso.`);
} catch (e) {
  console.warn('Aviso ao regravar ocorrencias.xlsx:', e.message);
}

// 6. Sincronização dos Templates de Banco de Dados
const templatePath = path.join(dataDir, 'database_template.json');
const rootTemplatePath = path.join(templatesDir, 'database_template.json');

const fullTemplate = {
  provisorios,
  visitantes,
  ocorrencias,
  vigilantes: vigilantesOficiais,
  operadores: operadoresOficiais,
  turnos: [
    { id: 'tur-1', nome: '12x36 Diurno (06:00 às 18:00)', escala: '12x36', inicio: '06:00', fim: '18:00', status: 'Ativo' },
    { id: 'tur-2', nome: '12x36 Noturno (18:00 às 06:00)', escala: '12x36', inicio: '18:00', fim: '06:00', status: 'Ativo' },
    { id: 'tur-3', nome: 'Comercial Adm (08:00 às 17:48)', escala: '5x2', inicio: '08:00', fim: '17:48', status: 'Ativo' }
  ]
};

fs.writeFileSync(templatePath, JSON.stringify(fullTemplate, null, 2), 'utf-8');
if (fs.existsSync(templatesDir)) {
  fs.writeFileSync(rootTemplatePath, JSON.stringify(fullTemplate, null, 2), 'utf-8');
}
console.log('✓ data/database_template.json e templates/database_template.json sincronizados com sucesso.');

console.log('\n=== VÍNCULO RELACIONAL E CORREÇÃO DE STATUS CONCLUÍDOS COM SUCESSO ===');
