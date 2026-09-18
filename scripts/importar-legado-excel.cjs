// Script de Migração e Higienização de Dados Legados - CCO Security Suite
// Importa e normaliza CONTROLE DE CREDENCIAL 2026.xlsx para provisórios, visitantes e RFID
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const excelPath = path.join(rootDir, 'CONTROLE DE CREDENCIAL 2026.xlsx');

console.log('[Migração Excel] Iniciando importação da planilha:', excelPath);

if (!fs.existsSync(excelPath)) {
  console.error('[Migração Excel] ERRO: Arquivo CONTROLE DE CREDENCIAL 2026.xlsx não encontrado!');
  process.exit(1);
}

const wb = XLSX.readFile(excelPath);

// =========================================================================
// UTILITÁRIOS DE CONVERSÃO E HIGIENIZAÇÃO
// =========================================================================

function converterSerialExcelParaDataIso(serial) {
  if (!serial && serial !== 0) return null;
  if (typeof serial === 'string') {
    const s = serial.trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${y}-${m}-${d}`;
      }
    }
    if (s.includes('-')) {
      const parts = s.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) return s; // Já é YYYY-MM-DD
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${y}-${m}-${d}`;
      }
    }
  }

  const num = Number(serial);
  if (isNaN(num) || num <= 0) return null;
  try {
    const parsed = XLSX.SSF.parse_date_code(num);
    if (!parsed || !parsed.y) return null;
    const y = parsed.y;
    const m = String(parsed.m).padStart(2, '0');
    const d = String(parsed.d).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (e) {
    return null;
  }
}

function toSafeIso(dateStr, defaultIso = '2026-01-01T08:00:00.000Z') {
  if (!dateStr) return defaultIso;
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T08:00:00.000Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {}
  return defaultIso;
}

function normalizarNome(nome = '') {
  return String(nome || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sÀ-ÖØ-öø-ÿ]/gi, '')
    .trim();
}

function normalizarEmpresa(empresa = '') {
  let e = String(empresa || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!e || e === '-' || e === 'N/A' || e === 'SEM' || e === 'NÃO IDENTIFIC') {
    return 'NÃO INFORMADA';
  }
  // Correção de grafias comuns da planilha
  if (e.includes('LA CONSTRU')) return 'LA CONSTRUÇÕES';
  if (e.includes('NATURA')) return 'NATURA';
  if (e.includes('TOP SERVICE')) return 'TOP SERVICE';
  if (e.includes('CIA HVAC') || e.includes('HVAC')) return 'CIA HVAC ENGENHARIA';
  if (e.includes('BOX PRINT')) return 'BOX PRINT';
  if (e.includes('EINSTEIN') || e.includes('ALBERT')) return 'ALBERT EINSTEIN';
  if (e.includes('SYMRISE')) return 'SYMRISE';
  if (e.includes('ADECCO')) return 'ADECCO';
  if (e.includes('SERVIS')) return 'SERVIS SEGURANÇA';
  if (e.includes('ENERJ')) return 'ENERJ SERVIÇOS';
  if (e.includes('TECNOFLUID')) return 'TECNOFLUID';
  if (e.includes('TPC')) return 'TPC LOGÍSTICA';
  return e;
}

// =========================================================================
// 1. MIGRAÇÃO DE PROVISÓRIOS
// =========================================================================
console.log('\n--- 1. Processando Aba PROVISORIOS ---');
const wsProv = wb.Sheets['PROVISORIOS'];
const rowsProv = XLSX.utils.sheet_to_json(wsProv, { header: 1, defval: '' });
const dadosProv = rowsProv.slice(3).filter(r => r.some(c => c !== ''));

const provisoriosMigrados = [];
const chavesProvDuplicadas = new Set();
let countProvIgnorados = 0;

dadosProv.forEach((r, idx) => {
  const colabBruto = r[1];
  const colab = normalizarNome(colabBruto);
  if (!colab || colab.length < 3) {
    countProvIgnorados++;
    return;
  }

  const rawCartao = String(r[0] || '').trim();
  let cartao = '01';
  let portaria = 'Portaria 1 - Principal';

  if (rawCartao.toUpperCase().includes('P2')) {
    portaria = 'Portaria 2 - Cargas & Serviços';
    const numPart = rawCartao.replace(/[^0-9]/g, '');
    cartao = numPart ? numPart.padStart(2, '0') : '01';
  } else if (rawCartao.toUpperCase().includes('P1')) {
    portaria = 'Portaria 1 - Principal';
    const numPart = rawCartao.replace(/[^0-9]/g, '');
    cartao = numPart ? numPart.padStart(2, '0') : '01';
  } else {
    const numPart = rawCartao.replace(/[^0-9]/g, '');
    const num = parseInt(numPart, 10);
    if (!isNaN(num)) {
      cartao = String(num).padStart(2, '0');
      portaria = num > 10 ? 'Portaria 2 - Cargas & Serviços' : 'Portaria 1 - Principal';
    }
  }

  const empresa = normalizarEmpresa(r[2]);
  const dataRetirada = converterSerialExcelParaDataIso(r[3]) || '2026-01-02';
  const dataDevolucao = converterSerialExcelParaDataIso(r[7]) || (r[4] === 'DEVOLVIDO' ? dataRetirada : null);

  let situacao = 'DEVOLVIDO';
  const sitBruta = String(r[4] || '').toUpperCase().trim();
  if (sitBruta.includes('PERD') || sitBruta.includes('EXTRAV')) {
    situacao = 'PERDIDO';
  } else if (sitBruta.includes('PAGO') || sitBruta.includes('QUIT')) {
    situacao = 'PAGO';
  } else if (sitBruta.includes('ISENT') || sitBruta.includes('B.O')) {
    situacao = 'ISENTO_BO';
  } else if (sitBruta.includes('NÃO DEV') || sitBruta.includes('PEND') || !dataDevolucao) {
    situacao = 'NÃO DEVOLVIDO';
  } else {
    situacao = 'DEVOLVIDO';
  }

  const motivo = String(r[5] || 'ESQUECEU').trim().toUpperCase();
  const obsComplementar = String(r[8] || '').trim();
  const vigilante = String(r[6] || '').trim() || (portaria.includes('P2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1');

  // Deduplicação (Colaborador + Data + Cartão)
  const chaveDeduplicacao = `${colab}_${dataRetirada}_${cartao}_${portaria}`;
  if (chavesProvDuplicadas.has(chaveDeduplicacao)) {
    countProvIgnorados++;
    return;
  }
  chavesProvDuplicadas.add(chaveDeduplicacao);

  provisoriosMigrados.push({
    id: 1700000000000 + idx,
    cartao,
    portaria,
    colaborador: colab,
    empresa,
    matricula: 'N/A',
    cargo: 'NÃO INFORMADO',
    dataRetirada,
    horaRetirada: '07:30',
    dataDevolucao,
    horaDevolucao: dataDevolucao ? '17:30' : null,
    tempoPermanencia: dataDevolucao ? '10h 00m' : null,
    situacao,
    observacao: motivo,
    observacaoComplementar: obsComplementar || null,
    vigilante,
    vigilanteDevolucao: dataDevolucao ? vigilante : null,
    retiradasMes: 1,
    reincidenteLimiteExcedido: false,
    justificativa: null
  });
});

// Recalcula reincidências no mês de forma cronológica
const contagemMensal = {};
provisoriosMigrados.sort((a, b) => a.dataRetirada.localeCompare(b.dataRetirada));
provisoriosMigrados.forEach(p => {
  const mesAno = p.dataRetirada.substring(0, 7);
  const chave = `${p.colaborador}_${mesAno}`;
  contagemMensal[chave] = (contagemMensal[chave] || 0) + 1;
  p.retiradasMes = contagemMensal[chave];
  p.reincidenteLimiteExcedido = p.retiradasMes >= 3;
  if (p.reincidenteLimiteExcedido) {
    p.justificativa = 'Histórico consolidado da planilha legada de credenciais.';
  }
});

console.log(`  ✓ Provisórios importados: ${provisoriosMigrados.length} (Ignorados/Duplicados vazios: ${countProvIgnorados})`);

// =========================================================================
// 2. MIGRAÇÃO DE VISITANTES
// =========================================================================
console.log('\n--- 2. Processando Aba LIB.VISITANTES ---');
const wsVis = wb.Sheets['LIB.VISITANTES'];
const rowsVis = XLSX.utils.sheet_to_json(wsVis, { header: 1, defval: '' });
const dadosVis = rowsVis.slice(3).filter(r => r.some(c => c !== ''));

const visitantesMigrados = [];
const chavesVisDuplicadas = new Set();
let countVisIgnorados = 0;

dadosVis.forEach((r, idx) => {
  const visitanteBruto = r[1];
  const visitante = normalizarNome(visitanteBruto);
  if (!visitante || visitante.length < 3) {
    countVisIgnorados++;
    return;
  }

  const rawCred = String(r[0] || '').replace(/[^0-9]/g, '');
  const cartao = rawCred ? rawCred.padStart(2, '0') : String((idx % 30) + 1).padStart(2, '0');

  const empresa = normalizarEmpresa(r[2] || 'VISITA PARTICULAR');
  const dataEntrada = converterSerialExcelParaDataIso(r[3]) || '2026-01-02';
  const dataSaida = converterSerialExcelParaDataIso(r[5]) || dataEntrada;

  let situacao = 'DEVOLVIDO';
  const sitBruta = String(r[4] || '').toUpperCase().trim();
  if (sitBruta.includes('NÃO DEV') || sitBruta.includes('PEND')) {
    situacao = 'NÃO DEVOLVIDO';
  } else if (sitBruta.includes('PERD')) {
    situacao = 'PERDIDO';
  } else if (sitBruta.includes('PAGO')) {
    situacao = 'PAGO';
  } else {
    situacao = 'DEVOLVIDO';
  }

  const obs = String(r[6] || '').trim();
  let portaria = 'Portaria 1 - Principal';
  if (obs.toUpperCase().includes('PORTARIA 2') || obs.toUpperCase().includes('P2')) {
    portaria = 'Portaria 2 - Cargas & Serviços';
  }

  // Deduplicação
  const chave = `${visitante}_${dataEntrada}_${cartao}`;
  if (chavesVisDuplicadas.has(chave)) {
    countVisIgnorados++;
    return;
  }
  chavesVisDuplicadas.add(chave);

  visitantesMigrados.push({
    id: 1710000000000 + idx,
    cartao,
    portaria,
    visitante,
    documento: 'NÃO INFORMADO',
    empresa,
    placaVeiculo: 'N/A',
    anfitriao: 'GERÊNCIA DE OPERAÇÕES',
    anfitriaoSetor: 'OPERACIONAL',
    anfitriaoRamal: 'N/A',
    motivo: sitBruta && !sitBruta.includes('DEVOL') ? sitBruta : 'Visita Operacional / Serviços',
    dataEntrada,
    horaEntrada: '08:00',
    dataSaida,
    horaSaida: dataSaida ? '17:00' : null,
    tempoPermanencia: dataSaida ? '09h 00m' : null,
    situacao,
    vigilanteEntrada: portaria.includes('P2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1',
    vigilanteSaida: dataSaida ? (portaria.includes('P2') ? 'Vigilante Portaria 2' : 'Vigilante Portaria 1') : null,
    observacao: obs || null
  });
});

console.log(`  ✓ Visitantes importados: ${visitantesMigrados.length} (Ignorados/Duplicados: ${countVisIgnorados})`);

// =========================================================================
// 3. MIGRAÇÃO DE RFID / INVENTÁRIO GLOBAL
// =========================================================================
console.log('\n--- 3. Processando Abas CONTROLE DE TAG e NÃO DEVOLVIDO ---');
const rfidMap = new Map();

// 3.1 Carga inicial da capacidade total de rotativos (01 a 350)
for (let i = 0; i <= 350; i++) {
  const numStr = String(i).padStart(2, '0');
  const nomeRotativo = `Serviços ${numStr}`;
  const codigoVirtual = `ROT-${String(i).padStart(4, '0')}`;
  rfidMap.set(nomeRotativo, {
    id: `rfid-rot-${i}`,
    codigoRfid: codigoVirtual,
    codigoImpresso: String(10000 + i),
    tipo: 'ROTATIVO',
    numeroRotativo: nomeRotativo,
    numeroRotativoIdx: i,
    colaborador: 'DISPONÍVEL NO ESTOQUE',
    empresa: 'DISPONÍVEL',
    cargo: '-',
    status: 'DISPONIVEL',
    dataLiberacao: '2026-01-01',
    historico: []
  });
}

// 3.2 Mapeamento de TAGs do CONTROLE DE TAG
const wsTag = wb.Sheets['CONTROLE DE TAG'];
const rowsTag = XLSX.utils.sheet_to_json(wsTag, { header: 1, defval: '' });
const dadosTag = rowsTag.slice(3).filter(r => r.some(c => c !== ''));

let tagsCadastradas = 0;
dadosTag.forEach(r => {
  const formato = String(r[3] || '').trim();
  const rawTag = String(r[4] || '').trim();
  const colab = normalizarNome(r[1]);
  const empresa = normalizarEmpresa(r[2]);
  const dataAcesso = converterSerialExcelParaDataIso(r[0]) || '2026-01-02';

  if (!rawTag && !formato) return;

  const codigoRfid = rawTag || `RFID-${formato.replace(/[^A-Za-z0-9]/g, '')}`;
  const numRotativoMatch = formato.match(/SERVI[ÇC]OS\s*([0-9]+)/i);
  const numRotativoIdx = numRotativoMatch ? parseInt(numRotativoMatch[1], 10) : null;
  const rotativoNome = numRotativoIdx !== null ? `Serviços ${String(numRotativoIdx).padStart(2, '0')}` : null;

  const rfidItem = {
    id: `rfid-${codigoRfid}`,
    codigoRfid,
    codigoImpresso: String(codigoRfid).slice(-5).padStart(5, '0'),
    tipo: rotativoNome ? 'ROTATIVO' : 'FIXO',
    numeroRotativo: rotativoNome,
    numeroRotativoIdx: numRotativoIdx,
    colaborador: colab || (rotativoNome ? 'DISPONÍVEL NO ESTOQUE' : 'NÃO INFORMADO'),
    empresa: colab ? empresa : 'DISPONÍVEL',
    cargo: 'NÃO INFORMADO',
    status: colab ? 'ATIVO' : 'DISPONIVEL',
    dataLiberacao: dataAcesso,
    historico: colab ? [{
      tipo: 'VINCULO',
      data: toSafeIso(dataAcesso),
      colaborador: colab,
      empresa,
      detalhe: 'Carga histórica da planilha CONTROLE DE CREDENCIAL'
    }] : []
  };

  // Se for rotativo conhecido, atualiza no mapa existente
  if (rotativoNome && rfidMap.has(rotativoNome)) {
    const rotExistente = rfidMap.get(rotativoNome);
    rotExistente.codigoRfid = codigoRfid;
    rotExistente.codigoImpresso = String(codigoRfid).slice(-5).padStart(5, '0');
    rotExistente.colaborador = rfidItem.colaborador;
    rotExistente.empresa = rfidItem.empresa;
    rotExistente.status = rfidItem.status;
    rotExistente.dataLiberacao = rfidItem.dataLiberacao;
    rotExistente.historico = rfidItem.historico;
    tagsCadastradas++;
  } else {
    rfidMap.set(codigoRfid, rfidItem);
    tagsCadastradas++;
  }
});

// 3.3 Mapeamento de NÃO DEVOLVIDOS
const wsNaoDev = wb.Sheets['NÃO DEVOLVIDO'];
const rowsNaoDev = XLSX.utils.sheet_to_json(wsNaoDev, { header: 1, defval: '' });
const dadosNaoDev = rowsNaoDev.slice(3).filter(r => r.some(c => c !== ''));

let tagsPerdidas = 0;
dadosNaoDev.forEach(r => {
  const formato = String(r[2] || '').trim();
  const rawTag = String(r[3] || '').trim();
  const colab = normalizarNome(r[0]);
  const empresa = normalizarEmpresa(r[1]);
  const dataUltimo = converterSerialExcelParaDataIso(r[5]) || '2026-01-02';

  if (!colab && !rawTag && !formato) return;

  const numRotativoMatch = formato.match(/SERVI[ÇC]OS\s*([0-9]+)/i);
  const numRotativoIdx = numRotativoMatch ? parseInt(numRotativoMatch[1], 10) : null;
  const rotativoNome = numRotativoIdx !== null ? `Serviços ${String(numRotativoIdx).padStart(2, '0')}` : null;
  const codigoRfid = rawTag || (rotativoNome ? `ROT-${String(numRotativoIdx).padStart(4, '0')}` : `PERDIDO-${colab.substring(0, 8)}`);

  let itemAlvo = null;
  if (rotativoNome && rfidMap.has(rotativoNome)) {
    itemAlvo = rfidMap.get(rotativoNome);
  } else if (rfidMap.has(codigoRfid)) {
    itemAlvo = rfidMap.get(codigoRfid);
  } else {
    itemAlvo = {
      id: `rfid-${codigoRfid}`,
      codigoRfid,
      codigoImpresso: String(codigoRfid).slice(-5).padStart(5, '0'),
      tipo: rotativoNome ? 'ROTATIVO' : 'FIXO',
      numeroRotativo: rotativoNome,
      numeroRotativoIdx: numRotativoIdx,
      colaborador: colab || 'PORTADOR DESCONHECIDO',
      empresa,
      cargo: 'NÃO INFORMADO',
      status: 'PERDIDO',
      dataLiberacao: dataUltimo,
      historico: []
    };
    rfidMap.set(codigoRfid, itemAlvo);
  }

  if (itemAlvo) {
    itemAlvo.status = 'PERDIDO';
    if (colab) itemAlvo.colaborador = colab;
    if (empresa) itemAlvo.empresa = empresa;
    itemAlvo.historico.push({
      tipo: 'EXTRAVIO',
      data: toSafeIso(dataUltimo),
      colaborador: itemAlvo.colaborador,
      empresa: itemAlvo.empresa,
      detalhe: 'Marcado como NÃO DEVOLVIDO na planilha legada'
    });
    tagsPerdidas++;
  }
});

const rfidListaFinal = Array.from(rfidMap.values());
console.log(`  ✓ Inventário RFID consolidado: ${rfidListaFinal.length} cartões (Tags vinculadas: ${tagsCadastradas}, Marcadas como Não Devolvidas: ${tagsPerdidas})`);

// =========================================================================
// 4. GRAVAÇÃO DOS DADOS NOS ARQUIVOS OFICIAIS
// =========================================================================
console.log('\n--- 4. Gravando no Banco de Dados (data/) ---');
fs.writeFileSync(path.join(dataDir, 'provisorios.json'), JSON.stringify(provisoriosMigrados, null, 2), 'utf-8');
console.log('  ✓ data/provisorios.json gravado.');

fs.writeFileSync(path.join(dataDir, 'visitantes.json'), JSON.stringify(visitantesMigrados, null, 2), 'utf-8');
console.log('  ✓ data/visitantes.json gravado.');

fs.writeFileSync(path.join(dataDir, 'rfid.json'), JSON.stringify(rfidListaFinal, null, 2), 'utf-8');
console.log('  ✓ data/rfid.json gravado.');

console.log('\n[Migração Excel] Migração e higienização da planilha concluídas com 100% de sucesso!');
