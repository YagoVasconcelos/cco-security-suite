// Serviço de Regras de Negócio e Persistência do Controle de Credenciais Provisórias
import databaseTemplate from '../../data/database_template.json';

const dadosIniciaisJson = databaseTemplate.provisorios || [];
const STORAGE_KEY = 'cco_provisorios_registros';
export const LIMITE_ACESSOS_MES = 3;

/**
 * Normaliza o nome do colaborador para evitar inconsistências com acentos/espaços
 */
export function normalizarNome(nome = '') {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrai a chave 'YYYY-MM' de uma data ISO (YYYY-MM-DD)
 */
export function obterMesAno(dataIso) {
  if (!dataIso) return '';
  return dataIso.substring(0, 7);
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
 * Calcula a duração de permanência entre a retirada e devolução
 */
export function calcularDuracaoPermanencia(dataRet, horaRet, dataDev, horaDev) {
  if (!dataRet || !horaRet || !dataDev || !horaDev) return null;
  try {
    const inicio = new Date(`${dataRet}T${horaRet.length === 5 ? horaRet + ':00' : horaRet}`);
    const fim = new Date(`${dataDev}T${horaDev.length === 5 ? horaDev + ':00' : horaDev}`);
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
 * Carrega os registros do armazenamento local de forma síncrona
 */
export function obterRegistrosLocais() {
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

  const inicial = (databaseTemplate && Array.isArray(databaseTemplate.provisorios)) 
    ? databaseTemplate.provisorios 
    : [];
  return Array.isArray(inicial) ? inicial : [];
}

/**
 * Carrega os registros sincronizando com a API do servidor (disco) e fallback local
 */
export async function carregarRegistros() {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const res = await fetch('/api/provisorios', {
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
            window.dispatchEvent(new CustomEvent('cco_provisorios_changed', { detail: dados }));
          }
          return dados;
        }
      }
    }
  } catch (err) {
    // Servidor offline ou ambiente sem backend HTTP
  }
  const fallback = obterRegistrosLocais();
  return Array.isArray(fallback) ? fallback : [];
}

/**
 * Salva a lista de registros no armazenamento local, notifica a aplicação e persiste no disco
 */
export async function salvarRegistros(registros) {
  const listaSegura = Array.isArray(registros) ? registros : [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listaSegura));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }

  // Notifica todos os módulos (Dashboard, Telas Operacionais) em tempo real
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cco_provisorios_changed', { detail: listaSegura }));
  }

  // Persiste no backend em data/provisorios.json
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
    await fetch('/api/salvar-provisorios', {
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
 * REGRA DE NEGÓCIO: Consulta o histórico de acessos de um colaborador no mês
 * e verifica se ultrapassou o limite de 3 acessos.
 */
export function verificarRegraTresAcessos(registros, colaboradorNome, dataReferencia) {
  const listaSegura = Array.isArray(registros) ? registros : [];

  if (!colaboradorNome || !colaboradorNome.trim()) {
    return {
      ultrapassouLimite: false,
      totalAcessosMes: 0,
      limite: LIMITE_ACESSOS_MES,
      proximoAcessoNumero: 1,
      historicoMes: [],
      alertaCritico: false
    };
  }

  const nomeNorm = normalizarNome(colaboradorNome);
  const mesAnoReferencia = obterMesAno(dataReferencia || new Date().toISOString().split('T')[0]);

  // Filtra todas as retiradas do colaborador no mesmo mês/ano
  const historicoMes = listaSegura.filter(r => {
    if (!r) return false;
    const mesmoColaborador = normalizarNome(r.colaborador || r.nomeColaborador || '') === nomeNorm;
    const dataItem = r.dataRetirada || r.dataSaida || '';
    const mesmoMes = dataItem ? obterMesAno(dataItem) === mesAnoReferencia : false;
    return mesmoColaborador && mesmoMes;
  });

  const totalAcessosMes = historicoMes.length;
  const proximoAcessoNumero = totalAcessosMes + 1;
  const ultrapassouLimite = totalAcessosMes >= LIMITE_ACESSOS_MES;

  return {
    ultrapassouLimite,
    totalAcessosMes,
    limite: LIMITE_ACESSOS_MES,
    proximoAcessoNumero,
    historicoMes,
    alertaCritico: totalAcessosMes >= LIMITE_ACESSOS_MES,
    mensagemAlerta: ultrapassouLimite
      ? `ATENÇÃO: Este colaborador já possui ${totalAcessosMes} retiradas de credencial provisória em ${mesAnoReferencia}! O limite de ${LIMITE_ACESSOS_MES} foi atingido. Esta será a ${proximoAcessoNumero}ª retirada.`
      : null
  };
}

/**
 * Registra a saída de um cartão com timestamp automático
 */
export function registrarSaidaCredencial(registros, novoRegistro) {
  const listaSegura = Array.isArray(registros) ? registros : [];
  const agora = new Date();
  const dataAuto = novoRegistro.dataRetirada || agora.toISOString().split('T')[0];
  const horaAuto = novoRegistro.horaRetirada || agora.toTimeString().split(' ')[0].substring(0, 5);

  // Validação da regra dos 3 acessos
  const verificacao = verificarRegraTresAcessos(listaSegura, novoRegistro.colaborador, dataAuto);

  const registroCompleto = {
    id: Date.now(),
    cartao: novoRegistro.cartao,
    portaria: novoRegistro.portaria,
    colaborador: (novoRegistro.colaborador || '').trim().toUpperCase(),
    empresa: (novoRegistro.empresa || 'NÃO INFORMADA').trim().toUpperCase(),
    matricula: novoRegistro.matricula || 'N/A',
    cargo: novoRegistro.cargo || 'NÃO INFORMADO',
    dataRetirada: dataAuto,
    horaRetirada: horaAuto,
    dataDevolucao: null,
    horaDevolucao: null,
    tempoPermanencia: null,
    situacao: 'NÃO DEVOLVIDO',
    observacao: novoRegistro.observacao,
    vigilante: novoRegistro.vigilante,
    vigilanteDevolucao: null,
    retiradasMes: verificacao.proximoAcessoNumero,
    reincidenteLimiteExcedido: verificacao.ultrapassouLimite,
    justificativa: verificacao.ultrapassouLimite ? novoRegistro.justificativa : null
  };

  const novaLista = [registroCompleto, ...listaSegura];
  salvarRegistros(novaLista);
  return { novaLista, registroCompleto, verificacao };
}

/**
 * Registra a baixa/devolução de um cartão com timestamp automático
 */
export function registrarBaixaDevolucao(registros, idRegistro, dadosDevolucao = {}) {
  const listaSegura = Array.isArray(registros) ? registros : [];
  const agora = new Date();
  const dataDev = dadosDevolucao.dataDevolucao || agora.toISOString().split('T')[0];
  const horaDev = dadosDevolucao.horaDevolucao || agora.toTimeString().split(' ')[0].substring(0, 5);
  const vigilante = dadosDevolucao.vigilanteDevolucao || 'Vig. CCO';

  const novaLista = listaSegura.map(item => {
    if (String(item.id) === String(idRegistro)) {
      const permanencia = calcularDuracaoPermanencia(
        item.dataRetirada,
        item.horaRetirada,
        dataDev,
        horaDev
      );

      return {
        ...item,
        situacao: 'DEVOLVIDO',
        dataDevolucao: dataDev,
        horaDevolucao: horaDev,
        tempoPermanencia: permanencia,
        vigilanteDevolucao: vigilante
      };
    }
    return item;
  });

  salvarRegistros(novaLista);
  return novaLista;
}

/**
 * Registra perda / extravio de credencial provisória (aciona fluxo de cobrança)
 */
export function registrarPerdaProvisorio(registros, idRegistro, dadosPerda = {}) {
  const listaSegura = Array.isArray(registros) ? registros : [];
  const agora = new Date();
  const dataP = dadosPerda.dataPerda || agora.toISOString().split('T')[0];
  const horaP = dadosPerda.horaPerda || agora.toTimeString().split(' ')[0].substring(0, 5);

  const novaLista = listaSegura.map(item => {
    if (String(item.id) === String(idRegistro)) {
      return {
        ...item,
        situacao: 'PERDIDO',
        status: 'PERDIDO',
        dataPerda: dataP,
        horaPerda: horaP,
        observacao: 'PERDEU',
        motivoPerda: dadosPerda.motivo || 'Extravio de credencial provisória',
        observacoesPerda: dadosPerda.observacoes || `Declarado extraviado/perdido em ${dataP} às ${horaP}.`
      };
    }
    return item;
  });

  salvarRegistros(novaLista);
  return novaLista;
}

/**
 * Registra quitação / ressarcimento financeiro de credencial provisória perdida
 */
export function marcarProvisorioComoPago(registros, idRegistro, dadosPagamento = {}) {
  const listaSegura = Array.isArray(registros) ? registros : [];
  const agora = new Date();
  const dataPag = dadosPagamento.dataPagamento || agora.toISOString().split('T')[0];

  const novaLista = listaSegura.map(item => {
    if (String(item.id) === String(idRegistro)) {
      return {
        ...item,
        situacao: 'PAGO',
        status: 'PAGO',
        dataPagamento: dataPag,
        pagoEm: agora.toISOString(),
        valorPago: dadosPagamento.valorPago || 30,
        observacaoPagamento: 'Ressarcimento financeiro de 2ª via registrado e confirmado'
      };
    }
    return item;
  });

  salvarRegistros(novaLista);
  return novaLista;
}

/**
 * Calcula todas as métricas em tempo real do módulo de Provisórios
 */
export function calcularMetricasProvisorios(registros) {
  const listaSegura = Array.isArray(registros) ? registros : [];
  const mesAtual = new Date().toISOString().substring(0, 7);
  const hojeStr = new Date().toISOString().split('T')[0];

  const totalPendentes = listaSegura.filter(r => r && (r.situacao === 'NÃO DEVOLVIDO' || r.situacao === 'NAO_DEVOLVIDO' || r.status === 'NAO_DEVOLVIDO') && !(r.situacao === 'PERDIDO' || r.status === 'PERDIDO' || r.observacao === 'PERDEU')).length;
  const totalDevolvidosHoje = listaSegura.filter(r => r && r.situacao === 'DEVOLVIDO' && r.dataDevolucao === hojeStr).length;
  const totalRegistros = listaSegura.length;

  // Extraviados vs Ressarcidos
  const totalPerdidos = listaSegura.filter(r => r && (r.situacao === 'PERDIDO' || r.status === 'PERDIDO' || (r.situacao === 'NÃO DEVOLVIDO' && r.observacao === 'PERDEU'))).length;
  const totalPagos = listaSegura.filter(r => r && (r.situacao === 'PAGO' || r.status === 'PAGO')).length;
  const totalIsentosBO = listaSegura.filter(r => r && (r.situacao === 'ISENTO_BO' || r.status === 'ISENTO_BO')).length;
  const totalExtraviadosGeral = totalPerdidos + totalPagos + totalIsentosBO;
  const taxaRessarcimento = totalExtraviadosGeral > 0
    ? Math.round(((totalPagos + totalIsentosBO) / totalExtraviadosGeral) * 100)
    : 100;
  const pendenteCobranca = totalPerdidos;

  // Identifica colaboradores com >= 3 acessos no mês
  const mapaReincidentesMes = new Map();
  listaSegura.forEach(r => {
    if (r && r.dataRetirada && typeof r.dataRetirada === 'string' && r.dataRetirada.startsWith(mesAtual)) {
      const nomeChave = (r.colaborador || '').toUpperCase().trim();
      if (!nomeChave) return;
      const contagem = (mapaReincidentesMes.get(nomeChave) || 0) + 1;
      mapaReincidentesMes.set(nomeChave, contagem);
    }
  });

  const totalReincidentesUnicos = Array.from(mapaReincidentesMes.entries())
    .filter(([_, count]) => count >= LIMITE_ACESSOS_MES).length;

  return {
    totalPendentes,
    totalDevolvidosHoje,
    totalRegistros,
    totalPerdidos,
    totalPagos,
    totalIsentosBO,
    taxaRessarcimento,
    pendenteCobranca,
    totalReincidentesUnicos,
    mesReferencia: mesAtual
  };
}
