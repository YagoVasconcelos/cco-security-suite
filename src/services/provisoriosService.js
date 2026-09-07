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
 * Carrega os registros do armazenamento local (localStorage) ou base padrão
 */
export function carregarRegistros() {
  try {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos !== null) {
      const parsed = JSON.parse(dadosSalvos);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler do localStorage:', err);
  }

  // Se não existir no localStorage, inicia com os registros da base padrão (vazia)
  const inicial = Array.isArray(databaseTemplate.provisorios) ? databaseTemplate.provisorios : [];
  salvarRegistros(inicial);
  return inicial;
}

/**
 * Salva a lista de registros no armazenamento local
 */
export function salvarRegistros(registros) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

/**
 * REGRA DE NEGÓCIO: Consulta o histórico de acessos de um colaborador no mês
 * e verifica se ultrapassou o limite de 3 acessos.
 */
export function verificarRegraTresAcessos(registros, colaboradorNome, dataReferencia) {
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
  const historicoMes = registros.filter(r => {
    const mesmoColaborador = normalizarNome(r.colaborador) === nomeNorm;
    const mesmoMes = obterMesAno(r.dataRetirada) === mesAnoReferencia;
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
  const agora = new Date();
  const dataAuto = novoRegistro.dataRetirada || agora.toISOString().split('T')[0];
  const horaAuto = novoRegistro.horaRetirada || agora.toTimeString().split(' ')[0].substring(0, 5);

  // Validação da regra dos 3 acessos
  const verificacao = verificarRegraTresAcessos(registros, novoRegistro.colaborador, dataAuto);

  const registroCompleto = {
    id: Date.now(),
    cartao: novoRegistro.cartao,
    portaria: novoRegistro.portaria,
    colaborador: novoRegistro.colaborador.trim().toUpperCase(),
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

  const novaLista = [registroCompleto, ...registros];
  salvarRegistros(novaLista);
  return { novaLista, registroCompleto, verificacao };
}

/**
 * Registra a baixa/devolução de um cartão com timestamp automático
 */
export function registrarBaixaDevolucao(registros, idRegistro, dadosDevolucao = {}) {
  const agora = new Date();
  const dataDev = dadosDevolucao.dataDevolucao || agora.toISOString().split('T')[0];
  const horaDev = dadosDevolucao.horaDevolucao || agora.toTimeString().split(' ')[0].substring(0, 5);
  const vigilante = dadosDevolucao.vigilanteDevolucao || 'Vig. CCO';

  const novaLista = registros.map(item => {
    if (item.id === idRegistro) {
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
