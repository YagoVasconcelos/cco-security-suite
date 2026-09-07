// Serviço de Regras de Negócio e Persistência do Inventário RFID (Fixos e Rotativos 0-350)
import databaseTemplate from '../../data/database_template.json';

const STORAGE_KEY = 'cco_rfid_inventario';
export const CAPACIDADE_ROTATIVOS = 350;

function gerarInventarioInicial() {
  if (Array.isArray(databaseTemplate.rfid) && databaseTemplate.rfid.length > 0) {
    return databaseTemplate.rfid;
  }
  const lista = [];
  for (let i = 0; i <= CAPACIDADE_ROTATIVOS; i++) {
    const numFmt = String(i).padStart(2, '0');
    lista.push({
      id: i + 1,
      codigoRfid: `RFID-${numFmt}`,
      codigoImpresso: `${10000 + i}`,
      tipo: 'ROTATIVO',
      numeroRotativo: `CSN SERVIÇOS ${numFmt}`,
      numeroRotativoIdx: i,
      colaborador: 'DISPONÍVEL NO ESTOQUE',
      empresa: 'ESTOQUE CENTRAL',
      dataLiberacao: '2026-01-01',
      status: 'DISPONIVEL',
      observacoes: 'Cartão disponível no estoque'
    });
  }
  return lista;
}

const dadosIniciaisJson = gerarInventarioInicial();

/**
 * Normaliza strings para comparações
 */
export function normalizar(str = '') {
  return str.trim().toUpperCase();
}

/**
 * Carrega os cartões do localStorage ou da base padrão
 */
export function carregarInventarioRfid() {
  try {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos) {
      const parsed = JSON.parse(dadosSalvos);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler inventário RFID do localStorage:', err);
  }

  salvarInventarioRfid(dadosIniciaisJson);
  return dadosIniciaisJson;
}

/**
 * Salva a lista de cartões no localStorage
 */
export function salvarInventarioRfid(cartoes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartoes));
  } catch (err) {
    console.error('Erro ao salvar inventário RFID no localStorage:', err);
  }
}

/**
 * REGRA DE NEGÓCIO: Calcula automaticamente todas as métricas para os Dashboards
 */
export function calcularMetricasRfid(cartoes, mesReferencia) {
  const mesRef = mesReferencia || new Date().toISOString().substring(0, 7); // 'YYYY-MM'

  // 1. Total confeccionados e liberados no mês
  const liberadosMes = cartoes.filter(c => c.dataLiberacao && c.dataLiberacao.startsWith(mesRef)).length;

  // 2. Cartões Perdidos vs. Pagos / Ressarcidos
  const totalPerdidos = cartoes.filter(c => c.status === 'PERDIDO').length;
  const totalPagos = cartoes.filter(c => c.status === 'PAGO').length;
  const totalExtravios = totalPerdidos + totalPagos;
  const taxaRessarcimento = totalExtravios > 0 
    ? Math.round((totalPagos / totalExtravios) * 100) 
    : 100;
  const pendenteCobranca = totalPerdidos; // Aguardando ressarcimento

  // 3. Rotativos Devolvidos & Reidratados / Disponíveis (Intervalo 0 a 350)
  const rotativos = cartoes.filter(c => c.tipo === 'ROTATIVO');
  const rotativosDisponiveis = rotativos.filter(c => c.status === 'DISPONIVEL').length;
  const rotativosAtivos = rotativos.filter(c => c.status === 'ATIVO').length;
  const rotativosPerdidos = rotativos.filter(c => c.status === 'PERDIDO' || c.status === 'PAGO').length;
  const totalRotativosCadastrados = rotativos.length;

  // 4. Cartões Fixos Nominais
  const fixos = cartoes.filter(c => c.tipo === 'FIXO');
  const fixosAtivos = fixos.filter(c => c.status === 'ATIVO').length;
  const fixosPerdidos = fixos.filter(c => c.status === 'PERDIDO' || c.status === 'PAGO').length;
  const totalFixos = fixos.length;

  // 5. Total Geral
  const totalGeral = cartoes.length;

  return {
    mesReferencia: mesRef,
    liberadosMes,
    totalPerdidos,
    totalPagos,
    totalExtravios,
    taxaRessarcimento,
    pendenteCobranca,
    rotativosDisponiveis,
    rotativosAtivos,
    rotativosPerdidos,
    totalRotativosCadastrados,
    capacidadeRotativos: CAPACIDADE_ROTATIVOS,
    fixosAtivos,
    fixosPerdidos,
    totalFixos,
    totalGeral
  };
}

/**
 * REGRA DE NEGÓCIO: Validação e Inclusão de Novo Cartão RFID
 */
export function adicionarCartaoRfid(cartoes, novo) {
  const rfidFormatado = normalizar(novo.codigoRfid);
  
  // Valida unicidade da Chave Primária (Código RFID)
  const existe = cartoes.some(c => normalizar(c.codigoRfid) === rfidFormatado);
  if (existe) {
    throw new Error(`O Código RFID "${rfidFormatado}" já está cadastrado no inventário. A chave primária deve ser única.`);
  }

  // Validação do tamanho (6 a 10 dígitos)
  if (rfidFormatado.length < 6 || rfidFormatado.length > 10) {
    throw new Error('O Código RFID deve conter entre 6 e 10 dígitos alfa-numéricos.');
  }

  // Validação do código impresso (5 dígitos)
  const impressoFormatado = String(novo.codigoImpresso || '').trim();
  if (impressoFormatado.length !== 5) {
    throw new Error('O Código Impresso no verso deve conter exatamente 5 dígitos numéricos.');
  }

  // Validação específica para Rotativo (0 a 350)
  let numeroRotativoFinal = null;
  let numeroRotativoIdx = null;
  if (novo.tipo === 'ROTATIVO') {
    if (novo.numeroRotativoIdx !== undefined && novo.numeroRotativoIdx !== '') {
      const num = parseInt(novo.numeroRotativoIdx, 10);
      if (isNaN(num) || num < 0 || num > CAPACIDADE_ROTATIVOS) {
        throw new Error(`Para cartões rotativos, o número deve estar no intervalo oficial de 0 a ${CAPACIDADE_ROTATIVOS}.`);
      }
      numeroRotativoIdx = num;
      numeroRotativoFinal = `CSN SERVIÇOS ${String(num).padStart(2, '0')}`;
    } else {
      numeroRotativoFinal = novo.numeroRotativo || 'ROTATIVO';
    }
  }

  const registroCompleto = {
    id: Date.now(),
    codigoRfid: rfidFormatado,
    codigoImpresso: impressoFormatado,
    tipo: novo.tipo, // 'FIXO' ou 'ROTATIVO'
    numeroRotativo: numeroRotativoFinal,
    numeroRotativoIdx: numeroRotativoIdx,
    colaborador: novo.colaborador ? normalizar(novo.colaborador) : (novo.tipo === 'ROTATIVO' ? 'DISPONÍVEL NO ESTOQUE' : 'NÃO INFORMADO'),
    empresa: normalizar(novo.empresa || 'TERCEIRO'),
    dataLiberacao: novo.dataLiberacao || new Date().toISOString().split('T')[0],
    status: novo.status || 'ATIVO',
    observacoes: novo.observacoes || 'Cadastrado no inventário CCO'
  };

  const novaLista = [registroCompleto, ...cartoes];
  salvarInventarioRfid(novaLista);
  return { novaLista, registroCompleto };
}

/**
 * REGRA DE NEGÓCIO: Transição de Ciclo de Vida do Cartão (Perda, Pagamento, Reidratação)
 */
export function transicionarStatusCartao(cartoes, idCartao, novoStatus, motivo) {
  const agoraStr = new Date().toLocaleDateString('pt-BR');

  const novaLista = cartoes.map(item => {
    if (item.id === idCartao) {
      let colaboradorAtualizado = item.colaborador;

      // Se for rotativo e for devolvido para DISPONIVEL, reidrata no estoque
      if (item.tipo === 'ROTATIVO' && novoStatus === 'DISPONIVEL') {
        colaboradorAtualizado = 'DISPONÍVEL NO ESTOQUE (REIDRATADO)';
      }

      let obsFinal = item.observacoes;
      if (motivo) {
        obsFinal = `${motivo} (${agoraStr}) • ${item.observacoes}`;
      } else if (novoStatus === 'PAGO') {
        obsFinal = `Segunda via quitada pelo colaborador (${agoraStr}) • ${item.observacoes}`;
      } else if (novoStatus === 'PERDIDO') {
        obsFinal = `Extravio comunicado - aguardando desconto (${agoraStr}) • ${item.observacoes}`;
      } else if (novoStatus === 'DISPONIVEL') {
        obsFinal = `Devolvido e reidratado no estoque (${agoraStr}) • ${item.observacoes}`;
      }

      return {
        ...item,
        status: novoStatus,
        colaborador: colaboradorAtualizado,
        observacoes: obsFinal
      };
    }
    return item;
  });

  salvarInventarioRfid(novaLista);
  return novaLista;
}
