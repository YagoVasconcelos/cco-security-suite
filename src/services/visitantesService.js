// Serviço de Regras de Negócio e Persistência do Controle de Visitantes
import databaseTemplate from '../../data/database_template.json';

const dadosIniciaisJson = databaseTemplate.visitantes || [];
const STORAGE_KEY = 'cco_visitantes_registros';

/**
 * Normaliza textos para comparações precisas
 */
export function normalizarTexto(txt = '') {
  return txt
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Formata data ISO para padrão brasileiro (DD/MM/AAAA)
 */
export function formatarDataBr(dataIso) {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Calcula o tempo total de permanência do visitante no site
 */
export function calcularPermanenciaVisitante(dataEntrada, horaEntrada, dataSaida, horaSaida) {
  if (!dataEntrada || !horaEntrada || !dataSaida || !horaSaida) return null;
  try {
    const inicio = new Date(`${dataEntrada}T${horaEntrada.length === 5 ? horaEntrada + ':00' : horaEntrada}`);
    const fim = new Date(`${dataSaida}T${horaSaida.length === 5 ? horaSaida + ':00' : horaSaida}`);
    const diffMs = fim - inicio;
    if (isNaN(diffMs) || diffMs < 0) return null;

    const diffMin = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;

    if (horas === 0) return `${minutos}min`;
    return `${horas}h ${minutos}m`;
  } catch (e) {
    return null;
  }
}

/**
 * Carrega a lista de visitantes do armazenamento local de forma síncrona
 */
export function obterVisitantesLocais() {
  try {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos !== null && dadosSalvos !== undefined) {
      const parsed = JSON.parse(dadosSalvos);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler do localStorage:', err);
  }

  const inicial = (databaseTemplate && Array.isArray(databaseTemplate.visitantes)) 
    ? databaseTemplate.visitantes 
    : [];
  return Array.isArray(inicial) ? inicial : [];
}

/**
 * Carrega a lista de visitantes sincronizando com a API do servidor (disco) e fallback local
 */
export async function carregarVisitantes() {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const res = await fetch('/api/visitantes', {
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const dados = await res.json();
        if (Array.isArray(dados)) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
          } catch (e) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cco_visitantes_changed', { detail: dados }));
          }
          return dados;
        }
      }
    }
  } catch (err) {
    // Servidor offline ou ambiente sem backend HTTP
  }
  const fallback = obterVisitantesLocais();
  return Array.isArray(fallback) ? fallback : [];
}

/**
 * Salva a lista de visitantes no localStorage, notifica a aplicação e persiste no disco
 */
export async function salvarVisitantes(visitantes) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listaSegura));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }

  // Notifica todos os módulos (Dashboard, Visitantes) em tempo real
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cco_visitantes_changed', { detail: listaSegura }));
  }

  // Persiste no backend em data/visitantes.json
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
    await fetch('/api/salvar-visitantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listaSegura),
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);
  } catch (err) {
    // API offline
  }
}

/**
 * REGRA DE NEGÓCIO: Registra a entrada de um visitante com horário e vínculo ao anfitrião
 */
export function registrarEntradaVisitante(visitantes, novo) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  if (!novo.anfitriao || !novo.anfitriao.trim()) {
    throw new Error('Vínculo obrigatório: Não é permitido liberar a entrada de visitante sem o nome do Anfitrião solicitante.');
  }

  const agora = new Date();
  const dataAuto = novo.dataEntrada || agora.toISOString().split('T')[0];
  const horaAuto = novo.horaEntrada || agora.toTimeString().split(' ')[0].substring(0, 5);

  const registroCompleto = {
    id: Date.now(),
    cartao: novo.cartao,
    portaria: novo.portaria,
    visitante: (novo.visitante || '').trim().toUpperCase(),
    documento: (novo.documento || '').trim(),
    empresa: (novo.empresa || 'VISITA PARTICULAR').trim().toUpperCase(),
    placaVeiculo: (novo.placaVeiculo || 'N/A').trim().toUpperCase(),
    // Vínculo Obrigatório com o Anfitrião
    anfitriao: (novo.anfitriao || '').trim().toUpperCase(),
    anfitriaoSetor: (novo.anfitriaoSetor || 'GERAL').trim().toUpperCase(),
    anfitriaoRamal: novo.anfitriaoRamal || 'N/A',
    motivo: novo.motivo,
    dataEntrada: dataAuto,
    horaEntrada: horaAuto,
    dataSaida: null,
    horaSaida: null,
    tempoPermanencia: null,
    situacao: 'NÃO DEVOLVIDO',
    vigilanteEntrada: novo.vigilanteEntrada || 'Vig. CCO',
    vigilanteSaida: null
  };

  const novaLista = [registroCompleto, ...listaSegura];
  salvarVisitantes(novaLista);
  return { novaLista, registroCompleto };
}

/**
 * REGRA DE NEGÓCIO: Registra a saída / baixa do visitante, calculando a permanência
 */
export function registrarSaidaVisitante(visitantes, idVisitante, dadosSaida = {}) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  const agora = new Date();
  const dataSaidaAuto = dadosSaida.dataSaida || agora.toISOString().split('T')[0];
  const horaSaidaAuto = dadosSaida.horaSaida || agora.toTimeString().split(' ')[0].substring(0, 5);
  const vigilante = dadosSaida.vigilanteSaida || 'Vig. CCO';

  const novaLista = listaSegura.map(item => {
    if (item.id === idVisitante) {
      const permanencia = calcularPermanenciaVisitante(
        item.dataEntrada,
        item.horaEntrada,
        dataSaidaAuto,
        horaSaidaAuto
      );

      return {
        ...item,
        situacao: 'DEVOLVIDO',
        dataSaida: dataSaidaAuto,
        horaSaida: horaSaidaAuto,
        tempoPermanencia: permanencia,
        vigilanteSaida: vigilante
      };
    }
    return item;
  });

  salvarVisitantes(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Edição Completa de Registro de Visitante
 */
export function editarRegistroVisitante(visitantes, idVisitante, dadosAtualizados = {}) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  if (!idVisitante) {
    throw new Error('Identificador do visitante é obrigatório para edição.');
  }

  const novaLista = listaSegura.map(item => {
    if (String(item.id) === String(idVisitante)) {
      const dataEnt = dadosAtualizados.dataEntrada !== undefined ? dadosAtualizados.dataEntrada : item.dataEntrada;
      const horaEnt = dadosAtualizados.horaEntrada !== undefined ? dadosAtualizados.horaEntrada : item.horaEntrada;
      const dataSai = dadosAtualizados.dataSaida !== undefined ? dadosAtualizados.dataSaida : item.dataSaida;
      const horaSai = dadosAtualizados.horaSaida !== undefined ? dadosAtualizados.horaSaida : item.horaSaida;

      let tempoPermanencia = item.tempoPermanencia;
      if (dataSai && horaSai && dataEnt && horaEnt) {
        tempoPermanencia = calcularPermanenciaVisitante(dataEnt, horaEnt, dataSai, horaSai);
      } else if (!dataSai) {
        tempoPermanencia = null;
      }

      return {
        ...item,
        ...dadosAtualizados,
        id: item.id,
        cartao: dadosAtualizados.cartao || item.cartao,
        portaria: dadosAtualizados.portaria || item.portaria,
        visitante: dadosAtualizados.visitante ? String(dadosAtualizados.visitante).trim().toUpperCase() : item.visitante,
        documento: dadosAtualizados.documento !== undefined ? String(dadosAtualizados.documento).trim() : item.documento,
        empresa: dadosAtualizados.empresa ? String(dadosAtualizados.empresa).trim().toUpperCase() : item.empresa,
        placaVeiculo: dadosAtualizados.placaVeiculo !== undefined ? String(dadosAtualizados.placaVeiculo).trim().toUpperCase() : item.placaVeiculo,
        anfitriao: dadosAtualizados.anfitriao ? String(dadosAtualizados.anfitriao).trim().toUpperCase() : item.anfitriao,
        anfitriaoSetor: dadosAtualizados.anfitriaoSetor !== undefined ? String(dadosAtualizados.anfitriaoSetor).trim().toUpperCase() : item.anfitriaoSetor,
        anfitriaoRamal: dadosAtualizados.anfitriaoRamal !== undefined ? String(dadosAtualizados.anfitriaoRamal).trim() : item.anfitriaoRamal,
        motivo: dadosAtualizados.motivo || item.motivo,
        dataEntrada: dataEnt,
        horaEntrada: horaEnt,
        dataSaida: dataSai || null,
        horaSaida: horaSai || null,
        tempoPermanencia,
        situacao: dadosAtualizados.situacao || item.situacao,
        vigilanteEntrada: dadosAtualizados.vigilanteEntrada || item.vigilanteEntrada,
        vigilanteSaida: dadosAtualizados.vigilanteSaida !== undefined ? dadosAtualizados.vigilanteSaida : item.vigilanteSaida
      };
    }
    return item;
  });

  salvarVisitantes(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Consulta o histórico completo de visitas vinculadas a um Anfitrião
 */
export function obterHistoricoPorAnfitriao(visitantes, nomeAnfitriao) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  if (!nomeAnfitriao) return { total: 0, noSite: 0, historico: [] };
  const nomeNorm = normalizarTexto(nomeAnfitriao);

  const historico = listaSegura.filter(v => v && normalizarTexto(v.anfitriao || '') === nomeNorm);
  const noSite = historico.filter(v => v && v.situacao === 'NÃO DEVOLVIDO').length;

  return {
    anfitriao: nomeAnfitriao,
    total: historico.length,
    noSite,
    historico
  };
}

/**
 * REGRA DE NEGÓCIO: Consulta o histórico de um visitante específico (todas as suas visitas e anfitriões)
 */
export function obterHistoricoPorVisitante(visitantes, documentoOuNome) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  if (!documentoOuNome) return [];
  const termo = normalizarTexto(documentoOuNome);

  return listaSegura.filter(v =>
    v && (
      normalizarTexto(v.visitante || '').includes(termo) ||
      (v.documento && v.documento.includes(termo))
    )
  );
}

/**
 * REGRA DE NEGÓCIO: Registra o extravio / perda de um cartão de visitante
 */
export function registrarPerdaVisitante(visitantes, idVisitante, dadosPerda = {}) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  const agora = new Date();
  const dataPerda = dadosPerda.dataPerda || agora.toISOString().split('T')[0];
  const horaPerda = dadosPerda.horaPerda || agora.toTimeString().split(' ')[0].substring(0, 5);

  const novaLista = listaSegura.map(item => {
    if (item.id === idVisitante) {
      return {
        ...item,
        situacao: 'PERDIDO',
        dataSaida: dataPerda,
        horaSaida: horaPerda,
        dataPerda,
        horaPerda,
        motivoPerda: dadosPerda.motivo || 'Extravio pelo visitante',
        observacoes: dadosPerda.observacoes || (item.observacoes ? `${item.observacoes} • Cartão extraviado/perdido` : 'Cartão extraviado/perdido pelo visitante')
      };
    }
    return item;
  });

  salvarVisitantes(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Registra a quitação / ressarcimento financeiro do cartão de visitante perdido
 */
export function marcarVisitanteComoPago(visitantes, idVisitante, dadosPago = {}) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  const agoraIso = new Date().toISOString();

  const novaLista = listaSegura.map(item => {
    if (item.id === idVisitante) {
      return {
        ...item,
        situacao: 'PAGO',
        dataPagamento: dadosPago.dataPagamento || agoraIso.split('T')[0],
        pagoEm: agoraIso,
        valorPago: dadosPago.valorPago || 30.0,
        observacoes: item.observacoes ? `${item.observacoes} • Ressarcimento quitado` : 'Ressarcimento financeiro quitado'
      };
    }
    return item;
  });

  salvarVisitantes(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Registra a saída com isenção formal de cobrança por Boletim de Ocorrência (Furto / Roubo)
 */
export function registrarIsencaoVisitante(visitantes, idVisitante, dadosIsencao = {}) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  const agora = new Date();
  const dataSaidaAuto = dadosIsencao.dataSaida || agora.toISOString().split('T')[0];
  const horaSaidaAuto = dadosIsencao.horaSaida || agora.toTimeString().split(' ')[0].substring(0, 5);
  const vigilante = dadosIsencao.vigilanteSaida || 'Vig. CCO';
  const numeroBO = (dadosIsencao.numeroBO || '').trim().toUpperCase();

  const novaLista = listaSegura.map(item => {
    if (item.id === idVisitante) {
      const permanencia = calcularPermanenciaVisitante(
        item.dataEntrada,
        item.horaEntrada,
        dataSaidaAuto,
        horaSaidaAuto
      );

      return {
        ...item,
        situacao: 'ISENTO_BO',
        status: 'ISENTO_BO',
        dataSaida: dataSaidaAuto,
        horaSaida: horaSaidaAuto,
        tempoPermanencia: permanencia,
        vigilanteSaida: vigilante,
        numeroBO,
        dataBO: dadosIsencao.dataBO || dataSaidaAuto,
        isentoCobranca: true,
        motivoIsencao: dadosIsencao.motivoIsencao || 'Boletim de Ocorrência (Furto/Roubo)',
        observacoes: dadosIsencao.observacoes || (item.observacoes ? `${item.observacoes} • Isento por B.O. ${numeroBO}` : `Isento de cobrança por B.O. nº ${numeroBO}`)
      };
    }
    return item;
  });

  salvarVisitantes(novaLista);
  return novaLista;
}

/**
 * REGRA DE NEGÓCIO: Calcula automaticamente as métricas de visitantes, incluindo Perdidos vs. Ressarcidos
 */
export function calcularMetricasVisitantes(visitantes) {
  const listaSegura = Array.isArray(visitantes) ? visitantes : [];
  const hojeStr = new Date().toISOString().split('T')[0];

  const totalNoSite = listaSegura.filter(v => v && (v.situacao === 'NÃO DEVOLVIDO' || v.situacao === 'NAO_DEVOLVIDO' || v.status === 'NAO_DEVOLVIDO')).length;
  const totalDevolvidosHoje = listaSegura.filter(v => v && v.situacao === 'DEVOLVIDO' && v.dataSaida === hojeStr).length;

  // Extravios e Isenções de Visitantes
  const totalPerdidos = listaSegura.filter(v => v && v.situacao === 'PERDIDO').length;
  const totalPagos = listaSegura.filter(v => v && v.situacao === 'PAGO').length;
  const totalIsentosBO = listaSegura.filter(v => v && (v.situacao === 'ISENTO_BO' || v.situacao === 'ISENTO')).length;
  const totalExtravios = totalPerdidos + totalPagos;
  const taxaRessarcimento = totalExtravios > 0 
    ? Math.round((totalPagos / totalExtravios) * 100) 
    : 100;
  const pendenteCobranca = totalPerdidos;

  const totalRegistros = listaSegura.length;

  return {
    totalNoSite,
    totalDevolvidosHoje,
    totalPerdidos,
    totalPagos,
    totalIsentosBO,
    totalExtravios,
    taxaRessarcimento,
    pendenteCobranca,
    totalRegistros
  };
}

