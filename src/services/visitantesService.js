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
 * Carrega a lista de visitantes do armazenamento local (localStorage) ou base padrão
 */
export function carregarVisitantes() {
  try {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos) {
      const parsed = JSON.parse(dadosSalvos);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler do localStorage:', err);
  }

  salvarVisitantes(dadosIniciaisJson);
  return dadosIniciaisJson;
}

/**
 * Salva a lista de visitantes no localStorage
 */
export function salvarVisitantes(visitantes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitantes));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

/**
 * REGRA DE NEGÓCIO: Registra a entrada de um visitante com horário e vínculo ao anfitrião
 */
export function registrarEntradaVisitante(visitantes, novo) {
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
    visitante: novo.visitante.trim().toUpperCase(),
    documento: novo.documento.trim(),
    empresa: (novo.empresa || 'VISITA PARTICULAR').trim().toUpperCase(),
    placaVeiculo: (novo.placaVeiculo || 'N/A').trim().toUpperCase(),
    // Vínculo Obrigatório com o Anfitrião
    anfitriao: novo.anfitriao.trim().toUpperCase(),
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

  const novaLista = [registroCompleto, ...visitantes];
  salvarVisitantes(novaLista);
  return { novaLista, registroCompleto };
}

/**
 * REGRA DE NEGÓCIO: Registra a saída / baixa do visitante, calculando a permanência
 */
export function registrarSaidaVisitante(visitantes, idVisitante, dadosSaida = {}) {
  const agora = new Date();
  const dataSaidaAuto = dadosSaida.dataSaida || agora.toISOString().split('T')[0];
  const horaSaidaAuto = dadosSaida.horaSaida || agora.toTimeString().split(' ')[0].substring(0, 5);
  const vigilante = dadosSaida.vigilanteSaida || 'Vig. CCO';

  const novaLista = visitantes.map(item => {
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
 * REGRA DE NEGÓCIO: Consulta o histórico completo de visitas vinculadas a um Anfitrião
 */
export function obterHistoricoPorAnfitriao(visitantes, nomeAnfitriao) {
  if (!nomeAnfitriao) return { total: 0, noSite: 0, historico: [] };
  const nomeNorm = normalizarTexto(nomeAnfitriao);

  const historico = visitantes.filter(v => normalizarTexto(v.anfitriao) === nomeNorm);
  const noSite = historico.filter(v => v.situacao === 'NÃO DEVOLVIDO').length;

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
  if (!documentoOuNome) return [];
  const termo = normalizarTexto(documentoOuNome);

  return visitantes.filter(v =>
    normalizarTexto(v.visitante).includes(termo) ||
    v.documento.includes(termo)
  );
}
