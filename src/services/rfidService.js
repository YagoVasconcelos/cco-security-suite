import databaseTemplate from '../../data/database_template.json' with { type: 'json' };
import { salvarPessoaUnificada } from './baseUnificadaService.js';

const STORAGE_KEY = 'cco_rfid_inventario';
export const CAPACIDADE_ROTATIVOS = 350;

function gerarInventarioInicial() {
  if (Array.isArray(databaseTemplate.rfid)) {
    return databaseTemplate.rfid;
  }
  return [];
}

const dadosIniciaisJson = gerarInventarioInicial();

/**
 * Normaliza strings para comparações
 */
export function normalizar(str = '') {
  return str.trim().toUpperCase();
}

/**
 * Carrega os cartões do localStorage de forma síncrona
 */
export function obterInventarioRfidLocal() {
  try {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos !== null) {
      const parsed = JSON.parse(dadosSalvos);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler inventário RFID do localStorage:', err);
  }

  return Array.isArray(databaseTemplate.rfid) ? databaseTemplate.rfid : [];
}

/**
 * Carrega os cartões sincronizando com a API do servidor e disco
 */
export async function carregarInventarioRfid() {
  try {
    const res = await fetch('/api/rfid');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados)) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        } catch (_) {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cco_rfid_changed', { detail: dados }));
        }
        return dados;
      }
    }
  } catch (e) {
    console.warn('API RFID offline, usando cache local');
  }

  return obterInventarioRfidLocal();
}

/**
 * Salva a lista de cartões no localStorage e no disco via API
 */
export function salvarInventarioRfid(cartoes) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listaSegura));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cco_rfid_changed', { detail: listaSegura }));
    }
  } catch (err) {
    console.error('Erro ao salvar inventário RFID no localStorage:', err);
  }

  // Sincroniza em background com o disco via API
  fetch('/api/salvar-rfid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid: listaSegura })
  }).catch(e => console.warn('Falha na sincronização do RFID no disco:', e.message));
}

/**
 * REGRA DE NEGÓCIO: Verifica com precisão histórica se o cartão sofreu um vínculo
 * ativo ou emissão dentro do mês de competência (mesRef 'YYYY-MM').
 * 
 * Regra Estrita: Uma vez emitido/vinculado no mês, a desvinculação, devolução ou baixa
 * posterior JAMAIS apaga nem decrementa este registro histórico para fins de produtividade,
 * auditoria e métricas da CCO.
 */
export function cartaoTeveVinculoNoMes(cartao, mesRef) {
  if (!cartao) return false;

  // 1. Verifica no array de histórico completo do cartão
  if (Array.isArray(cartao.historico) && cartao.historico.length > 0) {
    const temEventoMes = cartao.historico.some(h => {
      if (!h || !h.data) return false;
      const dataIso = String(h.data).substring(0, 7);
      if (dataIso !== mesRef) return false;

      // Eventos de emissão / ativação no mês
      if (h.tipo === 'VINCULO' || h.tipo === 'EMISSAO' || h.tipo === 'CADASTRO_ATIVO') {
        return true;
      }
      // Eventos de devolução / desvinculação / perda que comprovam circulação no mês
      if (['DESVINCULO', 'DEVOLVIDO', 'PERDIDO', 'PAGO', 'ISENTO_BO'].includes(h.tipo)) {
        const titular = (h.titularAnterior || h.colaborador || '').trim().toUpperCase();
        if (titular && !titular.includes('ESTOQUE') && !titular.includes('DISPONIVEL') && !titular.includes('DISPONÍVEL')) {
          return true;
        }
      }
      return false;
    });

    if (temEventoMes) return true;
  }

  // 2. Verifica se está atualmente ATIVO com data de liberação ou último vínculo no mês
  const dataLib = cartao.dataLiberacao || cartao.dataUltimoVinculo || cartao.dataUltimaLiberacao;
  if (dataLib && typeof dataLib === 'string' && dataLib.startsWith(mesRef)) {
    const colab = (cartao.colaborador || '').trim().toUpperCase();
    const isEstoque = !colab || colab.includes('ESTOQUE') || colab.includes('DISPONÍVEL') || colab.includes('DISPONIVEL');
    if (!isEstoque) return true;
    if (cartao.dataUltimoVinculo && String(cartao.dataUltimoVinculo).startsWith(mesRef)) return true;
    if (cartao.dataUltimaLiberacao && String(cartao.dataUltimaLiberacao).startsWith(mesRef)) return true;
  }

  // 3. Verifica se tem data de B.O. ou perda no mês
  if (['PERDIDO', 'PAGO', 'ISENTO_BO'].includes(cartao.status)) {
    if (cartao.dataBO && String(cartao.dataBO).startsWith(mesRef)) return true;
  }

  return false;
}

/**
 * REGRA DE NEGÓCIO: Calcula automaticamente todas as métricas para os Dashboards
 */
export function calcularMetricasRfid(cartoes, mesReferencia) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  const mesRef = mesReferencia || new Date().toISOString().substring(0, 7); // 'YYYY-MM'

  // 1. Total confeccionados e liberados no mês (Preservação Histórica Estrita)
  // Todo cartão que sofreu um vínculo ativo no mês entra para a contagem oficial.
  // A desvinculação posterior encerra o ciclo no cartão, mas o registro histórico permanece.
  const liberadosMes = listaSegura.filter(c => cartaoTeveVinculoNoMes(c, mesRef)).length;

  // Total de movimentações de vínculo no mês (caso um mesmo cartão tenha sido reemitido)
  let totalMovimentacoesMes = 0;
  listaSegura.forEach(c => {
    if (Array.isArray(c?.historico)) {
      c.historico.forEach(h => {
        if (h && (h.tipo === 'VINCULO' || h.tipo === 'EMISSAO') && String(h.data || '').startsWith(mesRef)) {
          totalMovimentacoesMes++;
        }
      });
    }
  });
  if (totalMovimentacoesMes < liberadosMes) {
    totalMovimentacoesMes = liberadosMes;
  }

  // 2. Cartões Perdidos vs. Pagos / Ressarcidos vs. Isentos por B.O.
  const totalPerdidos = listaSegura.filter(c => c && c.status === 'PERDIDO').length;
  const totalPagos = listaSegura.filter(c => c && c.status === 'PAGO').length;
  const totalIsentosBO = listaSegura.filter(c => c && c.status === 'ISENTO_BO').length;
  const totalExtravios = totalPerdidos + totalPagos + totalIsentosBO;
  const taxaRessarcimento = totalExtravios > 0 
    ? Math.round(((totalPagos + totalIsentosBO) / totalExtravios) * 100) 
    : 0;
  // Pendente de cobrança: APENAS quem estiver com status PERDIDO e SEM isenção de B.O.
  const pendenteCobranca = totalPerdidos;

  // 3. Rotativos Devolvidos & Reidratados / Disponíveis (Intervalo 0 a 350)
  const rotativos = listaSegura.filter(c => c && c.tipo === 'ROTATIVO');
  const rotativosDisponiveis = rotativos.filter(c => c && c.status === 'DISPONIVEL').length;
  const rotativosAtivos = rotativos.filter(c => c && c.status === 'ATIVO').length;
  const rotativosPerdidos = rotativos.filter(c => c && (c.status === 'PERDIDO' || c.status === 'PAGO' || c.status === 'ISENTO_BO')).length;
  const totalRotativosCadastrados = rotativos.length;

  // 4. Cartões Fixos Nominais
  const fixos = listaSegura.filter(c => c && c.tipo === 'FIXO');
  const fixosAtivos = fixos.filter(c => c && c.status === 'ATIVO').length;
  const fixosPerdidos = fixos.filter(c => c && (c.status === 'PERDIDO' || c.status === 'PAGO' || c.status === 'ISENTO_BO')).length;
  const totalFixos = fixos.length;

  // 5. Total Geral
  const totalGeral = listaSegura.length;

  return {
    mesReferencia: mesRef,
    liberadosMes,
    totalMovimentacoesMes,
    totalPerdidos,
    totalPagos,
    totalIsentosBO,
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
 * Formata o identificador do cartão rotativo no padrão oficial "Serviços XX"
 */
export function formatarNomeRotativo(num) {
  if (num === undefined || num === null || num === '') return 'Serviços';
  const n = parseInt(num, 10);
  if (isNaN(n)) return 'Serviços';
  return `Serviços ${String(n).padStart(2, '0')}`;
}

/**
 * REGRA DE NEGÓCIO: Validação e Inclusão de Novo Cartão RFID
 */
export function adicionarCartaoRfid(cartoes, novo) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  const rfidFormatado = normalizar(novo.codigoRfid);
  
  // Valida unicidade da Chave Primária (Código RFID)
  const existe = listaSegura.some(c => c && normalizar(c.codigoRfid) === rfidFormatado);
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

  // Validação e Nomenclatura para Rotativo / Serviços (0 a 350)
  let numeroRotativoFinal = null;
  let numeroRotativoIdx = null;
  if (novo.tipo === 'ROTATIVO') {
    if (novo.numeroRotativoIdx !== undefined && novo.numeroRotativoIdx !== null && novo.numeroRotativoIdx !== '') {
      const num = parseInt(novo.numeroRotativoIdx, 10);
      if (isNaN(num) || num < 0 || num > CAPACIDADE_ROTATIVOS) {
        throw new Error(`Para cartões rotativos, o número deve estar no intervalo oficial de 0 a ${CAPACIDADE_ROTATIVOS}.`);
      }
      numeroRotativoIdx = num;
      numeroRotativoFinal = formatarNomeRotativo(num);
    } else if (novo.numeroRotativo) {
      numeroRotativoFinal = novo.numeroRotativo;
    } else {
      numeroRotativoFinal = 'Serviços';
    }
  }

  const agoraIso = new Date().toISOString();
  const hojeData = novo.dataLiberacao || agoraIso.split('T')[0];
  const colabFormatado = novo.colaborador ? normalizar(novo.colaborador) : (novo.tipo === 'ROTATIVO' ? 'DISPONÍVEL NO ESTOQUE' : 'ESTOQUE / A VINCULAR');
  const statusFormatado = novo.status || (novo.tipo === 'ROTATIVO' ? 'DISPONIVEL' : 'ATIVO');
  const isAtivoReal = statusFormatado === 'ATIVO' && !colabFormatado.includes('ESTOQUE') && !colabFormatado.includes('DISPONIVEL') && colabFormatado !== 'N/A';

  const historicoInicial = isAtivoReal
    ? [
        {
          tipo: 'VINCULO',
          data: agoraIso,
          colaborador: colabFormatado,
          empresa: normalizar(novo.empresa || 'TERCEIRO'),
          portaria: novo.portaria || 'CCO',
          motivo: novo.observacoes || 'Cadastro inicial e emissão de credencial'
        }
      ]
    : [];

  const registroCompleto = {
    id: Date.now(),
    codigoRfid: rfidFormatado,
    codigoImpresso: impressoFormatado,
    tipo: novo.tipo, // 'FIXO' ou 'ROTATIVO'
    numeroRotativo: numeroRotativoFinal,
    numeroRotativoIdx: numeroRotativoIdx,
    colaborador: colabFormatado,
    empresa: normalizar(novo.empresa || 'ESTOQUE CCO'),
    dataLiberacao: hojeData,
    dataUltimoVinculo: isAtivoReal ? hojeData : null,
    status: statusFormatado,
    numeroBO: novo.numeroBO || null,
    dataBO: novo.dataBO || null,
    observacoes: novo.observacoes || 'Cadastrado no inventário CCO',
    historico: historicoInicial
  };

  const novaLista = [registroCompleto, ...listaSegura];
  salvarInventarioRfid(novaLista);
  return { novaLista, registroCompleto };
}

/**
 * REGRA DE NEGÓCIO: Edição Completa de Cartão RFID
 */
export function editarCartaoRfid(cartoes, cartaoEditado) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  if (!cartaoEditado || !cartaoEditado.id) {
    throw new Error('Identificador do cartão é obrigatório para edição.');
  }

  const rfidFormatado = normalizar(cartaoEditado.codigoRfid);
  // Valida se o RFID editado já existe em outro cartão
  const duplicado = listaSegura.some(c => c && c.id !== cartaoEditado.id && normalizar(c.codigoRfid) === rfidFormatado);
  if (duplicado) {
    throw new Error(`O Código RFID "${rfidFormatado}" já está em uso por outro cartão no inventário.`);
  }

  const impressoFormatado = String(cartaoEditado.codigoImpresso || '').trim();
  if (impressoFormatado.length !== 5) {
    throw new Error('O Código Impresso no verso deve conter exatamente 5 dígitos numéricos.');
  }

  let numeroRotativoFinal = cartaoEditado.numeroRotativo;
  let numeroRotativoIdx = cartaoEditado.numeroRotativoIdx;
  if (cartaoEditado.tipo === 'ROTATIVO') {
    if (numeroRotativoIdx !== undefined && numeroRotativoIdx !== null && numeroRotativoIdx !== '') {
      const num = parseInt(numeroRotativoIdx, 10);
      if (!isNaN(num)) {
        numeroRotativoIdx = num;
        numeroRotativoFinal = formatarNomeRotativo(num);
      }
    }
  }

  const novaLista = listaSegura.map(item => {
    if (item.id === cartaoEditado.id) {
      return {
        ...item,
        ...cartaoEditado,
        codigoRfid: rfidFormatado,
        codigoImpresso: impressoFormatado,
        numeroRotativo: numeroRotativoFinal,
        numeroRotativoIdx: numeroRotativoIdx,
        colaborador: cartaoEditado.colaborador ? normalizar(cartaoEditado.colaborador) : item.colaborador,
        empresa: cartaoEditado.empresa ? normalizar(cartaoEditado.empresa) : item.empresa
      };
    }
    return item;
  });

  salvarInventarioRfid(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Exclusão de Cartão do Inventário
 */
export function excluirCartaoRfid(cartoes, idCartao) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  const novaLista = listaSegura.filter(item => item && item.id !== idCartao);
  salvarInventarioRfid(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Transição de Ciclo de Vida do Cartão (Devolução, Perda, Pagamento, Isenção por B.O.)
 */
export function transicionarStatusCartao(cartoes, idCartao, novoStatus, motivo, dadosBO = {}) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  const agoraIso = new Date().toISOString();
  const agoraStr = new Date().toLocaleDateString('pt-BR');

  const novaLista = listaSegura.map(item => {
    if (!item) return item;
    if (item.id === idCartao) {
      let colaboradorAtualizado = item.colaborador;
      let empresaAtualizada = item.empresa;
      let numeroBOFinal = item.numeroBO || null;
      let dataBOFinal = item.dataBO || null;
      let obsFinal = item.observacoes || '';

      const historicoAtual = Array.isArray(item.historico) ? item.historico : [];
      let novoEventoHistorico = null;

      // 1. Devolvido (Retorna limpo ao Estoque)
      if (novoStatus === 'DISPONIVEL') {
        colaboradorAtualizado = item.tipo === 'ROTATIVO' ? 'DISPONÍVEL NO ESTOQUE' : 'ESTOQUE / A VINCULAR';
        empresaAtualizada = 'ESTOQUE CCO';
        numeroBOFinal = null;
        dataBOFinal = null;
        obsFinal = motivo ? `${motivo} (${agoraStr})` : `Devolvido ao estoque limpo (${agoraStr})`;
        novoEventoHistorico = {
          tipo: 'DEVOLVIDO',
          data: agoraIso,
          titularAnterior: item.colaborador,
          empresaAnterior: item.empresa,
          motivo: obsFinal
        };
      }
      // 2. Isenção Formal por B.O. (Furto / Roubo)
      else if (novoStatus === 'ISENTO_BO') {
        numeroBOFinal = dadosBO.numeroBO || item.numeroBO || 'B.O. ARQUIVADO';
        dataBOFinal = dadosBO.dataBO || agoraStr;
        obsFinal = `Isento formalmente de cobrança por Furto/Roubo - B.O. nº ${numeroBOFinal} arquivado na CCO (${agoraStr}) • ${obsFinal}`;
        novoEventoHistorico = {
          tipo: 'ISENTO_BO',
          data: agoraIso,
          colaborador: item.colaborador,
          numeroBO: numeroBOFinal,
          dataBO: dataBOFinal,
          motivo: obsFinal
        };
      }
      // 3. Quitação / Ressarcimento
      else if (novoStatus === 'PAGO') {
        obsFinal = `Segunda via quitada / ressarcida pelo colaborador (${agoraStr}) • ${obsFinal}`;
        novoEventoHistorico = {
          tipo: 'PAGO',
          data: agoraIso,
          colaborador: item.colaborador,
          motivo: obsFinal
        };
      }
      // 4. Perdido / Extraviado
      else if (novoStatus === 'PERDIDO') {
        obsFinal = `Extravio comunicado - aguardando desconto/ressarcimento (${agoraStr}) • ${obsFinal}`;
        novoEventoHistorico = {
          tipo: 'PERDIDO',
          data: agoraIso,
          colaborador: item.colaborador,
          motivo: obsFinal
        };
      } else if (motivo) {
        obsFinal = `${motivo} (${agoraStr}) • ${obsFinal}`;
        novoEventoHistorico = {
          tipo: novoStatus,
          data: agoraIso,
          motivo: obsFinal
        };
      }

      const historicoAtualizado = novoEventoHistorico
        ? [novoEventoHistorico, ...historicoAtual]
        : historicoAtual;

      return {
        ...item,
        status: novoStatus,
        colaborador: colaboradorAtualizado,
        empresa: empresaAtualizada,
        numeroBO: numeroBOFinal,
        dataBO: dataBOFinal,
        observacoes: obsFinal,
        historico: historicoAtualizado
      };
    }
    return item;
  });

  salvarInventarioRfid(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Vincular Cartão Rotativo ou Fixo a um Colaborador
 */
export function vincularCartaoRfid(cartoes, idCartao, dadosVinculo = {}) {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  const agoraIso = new Date().toISOString();
  const hojeData = dadosVinculo.dataLiberacao || agoraIso.split('T')[0];

  const colabNome = (dadosVinculo.colaborador || '').trim().toUpperCase();
  const colabEmpresa = (dadosVinculo.empresa || '').trim().toUpperCase();

  if (!colabNome || colabNome.includes('ESTOQUE') || colabNome.includes('DISPONÍVEL')) {
    throw new Error('Informe o nome do colaborador para vincular o cartão.');
  }

  // Registra automaticamente na base unificada global compartilhada
  salvarPessoaUnificada({
    nome: colabNome,
    empresa: colabEmpresa,
    matricula: dadosVinculo.matricula,
    cargo: dadosVinculo.cargo,
    documento: dadosVinculo.documento
  });

  const novaLista = listaSegura.map(item => {
    if (item.id === idCartao) {
      const historicoAtual = Array.isArray(item.historico) ? item.historico : [];
      const novoHistorico = [
        {
          tipo: 'VINCULO',
          data: agoraIso,
          colaborador: colabNome,
          empresa: colabEmpresa,
          portaria: dadosVinculo.portaria || 'CCO',
          motivo: dadosVinculo.observacoes || 'Vínculo operacional de credencial'
        },
        ...historicoAtual
      ];

      return {
        ...item,
        status: 'ATIVO',
        colaborador: colabNome,
        empresa: colabEmpresa || 'PRESTADOR / TERCEIRO',
        matricula: dadosVinculo.matricula ? dadosVinculo.matricula.trim().toUpperCase() : item.matricula || '',
        portaria: dadosVinculo.portaria || item.portaria || 'CCO',
        dataLiberacao: hojeData,
        dataUltimoVinculo: hojeData,
        observacoes: dadosVinculo.observacoes ? `${dadosVinculo.observacoes.trim()} • ${item.observacoes || ''}` : item.observacoes || '',
        historico: novoHistorico
      };
    }
    return item;
  });

  salvarInventarioRfid(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Desvincular Cartão e Retornar Limpo ao Estoque
 */
export function desvincularCartaoRfid(cartoes, idCartao, motivo = 'Devolvido na portaria') {
  const listaSegura = Array.isArray(cartoes) ? cartoes : [];
  const agoraIso = new Date().toISOString();

  const novaLista = listaSegura.map(item => {
    if (item.id === idCartao) {
      const historicoAtual = Array.isArray(item.historico) ? item.historico : [];
      const titularAnterior = item.colaborador;
      const empresaAnterior = item.empresa;

      const novoHistorico = [
        {
          tipo: 'DESVINCULO',
          data: agoraIso,
          titularAnterior,
          empresaAnterior,
          motivo: motivo || 'Devolvido ao estoque limpo'
        },
        ...historicoAtual
      ];

      const isRotativo = item.tipo === 'ROTATIVO';
      return {
        ...item,
        status: 'DISPONIVEL',
        colaborador: isRotativo ? 'DISPONÍVEL NO ESTOQUE' : 'ESTOQUE / A VINCULAR',
        empresa: 'ESTOQUE CCO',
        numeroBO: null,
        dataBO: null,
        dataLiberacao: '',
        dataUltimaLiberacao: item.dataLiberacao || item.dataUltimoVinculo || agoraIso.split('T')[0],
        dataUltimoDesvinculo: agoraIso,
        historico: novoHistorico
      };
    }
    return item;
  });

  salvarInventarioRfid(novaLista);
  return novaLista;
}
