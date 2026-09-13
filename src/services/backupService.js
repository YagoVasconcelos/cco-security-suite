/**
 * Serviço Corporativo de Backup e Restauração de Dados com Merge Inteligente
 * CCO Security Suite - TecPrimus Soluções Tecnológicas
 * 
 * Responsável por:
 * 1. Coleta unificada de todos os bancos de dados locais (JSON/disco/localStorage).
 * 2. Exportação com diálogo nativo do Windows (dialog.showSaveDialog via Electron) ou download via navegador.
 * 3. Seleção de arquivo pré-existente (dialog.showOpenDialog via Electron) ou picker HTML5.
 * 4. Algoritmo rigoroso de Fusão Não-Destrutiva (Merge Inteligente Anti-Duplicidade).
 * 5. Notificação reativa para todos os módulos e sincronização dos armazenamentos locais.
 */

import { carregarOcorrencias } from './ocorrenciasService';
import { carregarRegistros as carregarProvisorios } from './provisoriosService';
import { carregarVisitantes } from './visitantesService';
import { carregarOperadores } from './operadoresService';
import { carregarVigilantes } from './vigilantesService';
import { carregarTurnos } from './turnosService';
import { carregarObservacoes } from './observacoesService';
import { carregarResponsaveis } from './responsaveisService';
import { carregarInventarioRfid } from './rfidService';
import { obterSenhaMestra } from './segurancaService';

/**
 * Coleta todos os dados das entidades locais do sistema
 * @returns {Promise<Object>} Estrutura consolidada pronta para backup
 */
export async function coletarDadosCompletos() {
  // 1. Tenta obter consolidado direto do servidor de disco
  try {
    const res = await fetch('/api/backup/coletar');
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.dados) {
        return payload;
      }
    }
  } catch (err) {
    console.warn('[backupService] API de coleta offline, realizando coleta individual:', err);
  }

  // 2. Fallback resiliente: Coleta paralela via serviços locais da aplicação
  const [
    ocorrencias,
    provisorios,
    visitantes,
    operadores,
    vigilantes,
    turnos,
    observacoes,
    responsaveis,
    rfid,
    seguranca
  ] = await Promise.all([
    carregarOcorrencias().catch(() => []),
    carregarProvisorios().catch(() => []),
    carregarVisitantes().catch(() => []),
    carregarOperadores().catch(() => []),
    carregarVigilantes().catch(() => []),
    carregarTurnos().catch(() => []),
    carregarObservacoes().catch(() => []),
    carregarResponsaveis().catch(() => ({})),
    carregarInventarioRfid().catch(() => []),
    obterSenhaMestra().catch(() => ({}))
  ]);

  return {
    sistema: 'CCO Security Suite',
    versao: '2.0',
    dataExportacao: new Date().toISOString(),
    geradoPor: 'TecPrimus Soluções Tecnológicas',
    estatisticas: {
      totalOcorrencias: Array.isArray(ocorrencias) ? ocorrencias.length : 0,
      totalProvisorios: Array.isArray(provisorios) ? provisorios.length : 0,
      totalVisitantes: Array.isArray(visitantes) ? visitantes.length : 0,
      totalOperadores: Array.isArray(operadores) ? operadores.length : 0,
      totalVigilantes: Array.isArray(vigilantes) ? vigilantes.length : 0,
      totalTurnos: Array.isArray(turnos) ? turnos.length : 0,
      totalObservacoes: Array.isArray(observacoes) ? observacoes.length : 0,
      totalRfid: Array.isArray(rfid) ? rfid.length : 0
    },
    dados: {
      ocorrencias: Array.isArray(ocorrencias) ? ocorrencias : [],
      provisorios: Array.isArray(provisorios) ? provisorios : [],
      visitantes: Array.isArray(visitantes) ? visitantes : [],
      operadores: Array.isArray(operadores) ? operadores : [],
      vigilantes: Array.isArray(vigilantes) ? vigilantes : [],
      turnos: Array.isArray(turnos) ? turnos : [],
      observacoes: Array.isArray(observacoes) ? observacoes : [],
      responsaveis: typeof responsaveis === 'object' && responsaveis !== null ? responsaveis : {},
      rfid: Array.isArray(rfid) ? rfid : [],
      seguranca: typeof seguranca === 'object' && seguranca !== null ? seguranca : {}
    }
  };
}

/**
 * Exporta o backup completo gerando arquivo .json estruturado no disco do Windows
 * @returns {Promise<{ sucesso: boolean, cancelado?: boolean, caminhoArquivo?: string, estatisticas?: Object, error?: string }>}
 */
export async function exportarBackupCompleto() {
  try {
    const backupData = await coletarDadosCompletos();
    const agora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dataHoraStr = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}h${pad(agora.getMinutes())}m`;
    const nomeSugerido = `backup_cco_completo_${dataHoraStr}.json`;

    // 1. Executa via módulo nativo do Electron se disponível
    if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.salvarArquivoBackup === 'function') {
      const res = await window.electronAPI.salvarArquivoBackup(backupData, nomeSugerido);
      if (res.canceled) {
        return { sucesso: false, cancelado: true };
      }
      if (res.error) {
        throw new Error(res.error);
      }
      return {
        sucesso: true,
        cancelado: false,
        caminhoArquivo: res.filePath,
        estatisticas: backupData.estatisticas,
        dados: backupData.dados
      };
    }

    // 2. Fallback para navegador web (Download direto via Blob)
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeSugerido;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      sucesso: true,
      cancelado: false,
      caminhoArquivo: nomeSugerido,
      estatisticas: backupData.estatisticas,
      dados: backupData.dados
    };
  } catch (err) {
    console.error('[backupService] Erro ao exportar backup:', err);
    return {
      sucesso: false,
      cancelado: false,
      error: err.message || 'Falha desconhecida ao gerar backup.'
    };
  }
}

/**
 * Dispara diálogo para o usuário escolher um arquivo .json existente
 * @returns {Promise<{ cancelado: boolean, nomeArquivo?: string, caminhoArquivo?: string, conteudo?: string, error?: string }>}
 */
export async function selecionarArquivoBackup() {
  try {
    // 1. Electron nativo
    if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.selecionarArquivoBackup === 'function') {
      const res = await window.electronAPI.selecionarArquivoBackup();
      if (res.canceled) {
        return { cancelado: true };
      }
      if (res.error) {
        return { cancelado: false, error: res.error };
      }
      return {
        cancelado: false,
        caminhoArquivo: res.filePath,
        nomeArquivo: res.filePath.split(/[\\/]/).pop(),
        conteudo: res.content
      };
    }

    // 2. Fallback Web File Picker
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          resolve({ cancelado: true });
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            cancelado: false,
            nomeArquivo: file.name,
            caminhoArquivo: file.name,
            conteudo: ev.target.result
          });
        };
        reader.onerror = () => {
          resolve({ cancelado: false, error: 'Erro ao ler arquivo selecionado.' });
        };
        reader.readAsText(file);
      };
      input.click();
    });
  } catch (err) {
    return { cancelado: false, error: err.message };
  }
}

/**
 * Normaliza e valida a estrutura de um arquivo de backup
 */
export function normalizarEstruturaBackup(conteudoOuObjeto) {
  let objeto = conteudoOuObjeto;
  if (typeof conteudoOuObjeto === 'string') {
    try {
      objeto = JSON.parse(conteudoOuObjeto);
    } catch (e) {
      throw new Error('O arquivo selecionado não é um JSON válido.');
    }
  }

  if (!objeto || typeof objeto !== 'object') {
    throw new Error('Arquivo de backup vazio ou formato incorreto.');
  }

  // Identifica se os dados estão aninhados em 'dados' ou na raiz
  const dados = objeto.dados || objeto;

  const temAlgumaTabela =
    Array.isArray(dados.ocorrencias) ||
    Array.isArray(dados.provisorios) ||
    Array.isArray(dados.visitantes) ||
    Array.isArray(dados.operadores) ||
    Array.isArray(dados.vigilantes) ||
    Array.isArray(dados.turnos) ||
    Array.isArray(dados.observacoes) ||
    Array.isArray(dados.rfid) ||
    (typeof dados.responsaveis === 'object' && dados.responsaveis !== null);

  if (!temAlgumaTabela) {
    throw new Error('O arquivo selecionado não contém nenhuma base de dados reconhecida do CCO Security Suite.');
  }

  return {
    metadados: {
      sistema: objeto.sistema || 'CCO Security Suite',
      versao: objeto.versao || '1.0',
      dataExportacao: objeto.dataExportacao || null,
      geradoPor: objeto.geradoPor || 'Arquivo Externo'
    },
    dados: {
      ocorrencias: Array.isArray(dados.ocorrencias) ? dados.ocorrencias : [],
      provisorios: Array.isArray(dados.provisorios) ? dados.provisorios : [],
      visitantes: Array.isArray(dados.visitantes) ? dados.visitantes : [],
      operadores: Array.isArray(dados.operadores) ? dados.operadores : [],
      vigilantes: Array.isArray(dados.vigilantes) ? dados.vigilantes : [],
      turnos: Array.isArray(dados.turnos) ? dados.turnos : [],
      observacoes: Array.isArray(dados.observacoes) ? dados.observacoes : [],
      responsaveis: typeof dados.responsaveis === 'object' && dados.responsaveis !== null ? dados.responsaveis : {},
      rfid: Array.isArray(dados.rfid) ? dados.rfid : [],
      seguranca: typeof dados.seguranca === 'object' && dados.seguranca !== null ? dados.seguranca : {}
    }
  };
}

// Extratores de chaves únicas para o algoritmo de merge anti-duplicidade
const extratoresChave = {
  ocorrencias: (o) => (o.numeroRO && typeof o.numeroRO === 'string' && o.numeroRO.trim()) ? o.numeroRO.trim().toUpperCase() : String(o.id || ''),
  provisorios: (p) => p.id ? String(p.id) : `${(p.cartao || '').trim().toUpperCase()}_${(p.colaborador || '').trim().toUpperCase()}_${p.dataRetirada || ''}_${p.horaRetirada || ''}`,
  visitantes: (v) => v.id ? String(v.id) : `${(v.documento || '').replace(/\D/g, '')}_${v.dataEntrada || ''}_${v.horaEntrada || ''}`,
  operadores: (op) => (op.matricula && op.matricula !== 'N/A' && op.matricula.trim()) ? op.matricula.trim().toUpperCase() : (op.id ? String(op.id).trim().toUpperCase() : (op.nome || '').trim().toUpperCase()),
  vigilantes: (vig) => (vig.matricula && vig.matricula !== 'N/A' && vig.matricula.trim()) ? vig.matricula.trim().toUpperCase() : (vig.id ? String(vig.id).trim().toUpperCase() : (vig.nome || '').trim().toUpperCase()),
  turnos: (t) => (t.nome || '').trim().toUpperCase() || String(t.id || ''),
  observacoes: (obs) => (obs.nome || '').trim().toUpperCase() || String(obs.id || ''),
  rfid: (r) => String(r.numeroCartao || r.codigoHex || r.id || '').trim().toUpperCase()
};

/**
 * Analisa a prévia de restauração para exibir no modal de confirmação
 */
export async function analisarPreviaRestauracao(dadosBackup) {
  const baseAtual = await coletarDadosCompletos();
  const dadosAtuais = baseAtual.dados || {};

  const calcularStatsColecao = (colecaoNome, extrator) => {
    const atualArr = Array.isArray(dadosAtuais[colecaoNome]) ? dadosAtuais[colecaoNome] : [];
    const backupArr = Array.isArray(dadosBackup[colecaoNome]) ? dadosBackup[colecaoNome] : [];

    const chavesAtuais = new Set();
    for (const item of atualArr) {
      const ch = extrator(item);
      if (ch) chavesAtuais.add(ch);
    }

    let novos = 0;
    let duplicadosEvitados = 0;

    for (const item of backupArr) {
      const ch = extrator(item);
      if (!ch) continue;
      if (chavesAtuais.has(ch)) {
        duplicadosEvitados++;
      } else {
        chavesAtuais.add(ch);
        novos++;
      }
    }

    return {
      atual: atualArr.length,
      noBackup: backupArr.length,
      novos,
      duplicadosEvitados,
      totalFinal: atualArr.length + novos
    };
  };

  const previa = {
    ocorrencias: calcularStatsColecao('ocorrencias', extratoresChave.ocorrencias),
    provisorios: calcularStatsColecao('provisorios', extratoresChave.provisorios),
    visitantes: calcularStatsColecao('visitantes', extratoresChave.visitantes),
    operadores: calcularStatsColecao('operadores', extratoresChave.operadores),
    vigilantes: calcularStatsColecao('vigilantes', extratoresChave.vigilantes),
    turnos: calcularStatsColecao('turnos', extratoresChave.turnos),
    observacoes: calcularStatsColecao('observacoes', extratoresChave.observacoes),
    rfid: calcularStatsColecao('rfid', extratoresChave.rfid),
    responsaveis: {
      atualConfigurado: Boolean(dadosAtuais.responsaveis && dadosAtuais.responsaveis.caminhoRede),
      preservado: true
    }
  };

  const totalNovos =
    previa.ocorrencias.novos +
    previa.provisorios.novos +
    previa.visitantes.novos +
    previa.operadores.novos +
    previa.vigilantes.novos +
    previa.turnos.novos +
    previa.observacoes.novos +
    previa.rfid.novos;

  const totalDuplicadosEvitados =
    previa.ocorrencias.duplicadosEvitados +
    previa.provisorios.duplicadosEvitados +
    previa.visitantes.duplicadosEvitados +
    previa.operadores.duplicadosEvitados +
    previa.vigilantes.duplicadosEvitados +
    previa.turnos.duplicadosEvitados +
    previa.observacoes.duplicadosEvitados +
    previa.rfid.duplicadosEvitados;

  const totalPreservados =
    previa.ocorrencias.atual +
    previa.provisorios.atual +
    previa.visitantes.atual +
    previa.operadores.atual +
    previa.vigilantes.atual +
    previa.turnos.atual +
    previa.observacoes.atual +
    previa.rfid.atual;

  return {
    previa,
    totalNovos,
    totalDuplicadosEvitados,
    totalPreservados
  };
}

/**
 * Executa a restauração completa com o Algoritmo de Merge Inteligente Anti-Duplicidade
 * @param {Object} dadosBackup Dados estruturados para fusão
 * @returns {Promise<Object>} Resumo e métricas da restauração
 */
export async function executarRestauracaoComMerge(dadosBackup) {
  // 1. Tenta executar via backend API (que atualiza JSONs e Excel em disco)
  try {
    const res = await fetch('/api/backup/restaurar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dados: dadosBackup })
    });

    if (res.ok) {
      const resposta = await res.json();
      if (resposta && resposta.success) {
        // Atualiza os caches locais do navegador
        sincronizarCachesLocais(resposta.dadosAtualizados || dadosBackup);
        notificarMudancasGlobais(resposta.dadosAtualizados || dadosBackup);
        return resposta;
      }
    }
  } catch (apiErr) {
    console.warn('[backupService] Falha na rota de API de restauração, executando merge local:', apiErr);
  }

  // 2. Fallback de Merge Inteligente na Camada Cliente/Navegador
  const baseAtual = await coletarDadosCompletos();
  const dadosAtuais = baseAtual.dados || {};

  const executarMergeLocal = (colecaoNome, extrator) => {
    const atualArr = Array.isArray(dadosAtuais[colecaoNome]) ? [...dadosAtuais[colecaoNome]] : [];
    const backupArr = Array.isArray(dadosBackup[colecaoNome]) ? dadosBackup[colecaoNome] : [];
    const chaves = new Set();

    for (const item of atualArr) {
      const ch = extrator(item);
      if (ch) chaves.add(ch);
    }

    let novos = 0;
    let duplicadosEvitados = 0;
    const adicionados = [];

    for (const item of backupArr) {
      const ch = extrator(item);
      if (!ch) continue;
      if (chaves.has(ch)) {
        duplicadosEvitados++;
      } else {
        chaves.add(ch);
        adicionados.push(item);
        novos++;
      }
    }

    const listaFinal = [...atualArr, ...adicionados];
    return {
      listaFinal,
      novos,
      preservados: atualArr.length,
      duplicadosEvitados,
      total: listaFinal.length
    };
  };

  const resOcorrencias = executarMergeLocal('ocorrencias', extratoresChave.ocorrencias);
  const resProvisorios = executarMergeLocal('provisorios', extratoresChave.provisorios);
  const resVisitantes = executarMergeLocal('visitantes', extratoresChave.visitantes);
  const resOperadores = executarMergeLocal('operadores', extratoresChave.operadores);
  const resVigilantes = executarMergeLocal('vigilantes', extratoresChave.vigilantes);
  const resTurnos = executarMergeLocal('turnos', extratoresChave.turnos);
  const resObservacoes = executarMergeLocal('observacoes', extratoresChave.observacoes);
  const resRfid = executarMergeLocal('rfid', extratoresChave.rfid);

  const responsaveisFinal = {
    ...(dadosBackup.responsaveis || {}),
    ...(dadosAtuais.responsaveis || {})
  };

  const totalNovos = resOcorrencias.novos + resProvisorios.novos + resVisitantes.novos + resOperadores.novos + resVigilantes.novos + resTurnos.novos + resObservacoes.novos + resRfid.novos;
  const totalPreservados = resOcorrencias.preservados + resProvisorios.preservados + resVisitantes.preservados + resOperadores.preservados + resVigilantes.preservados + resTurnos.preservados + resObservacoes.preservados + resRfid.preservados;
  const totalDuplicadosEvitados = resOcorrencias.duplicadosEvitados + resProvisorios.duplicadosEvitados + resVisitantes.duplicadosEvitados + resOperadores.duplicadosEvitados + resVigilantes.duplicadosEvitados + resTurnos.duplicadosEvitados + resObservacoes.duplicadosEvitados + resRfid.duplicadosEvitados;

  const dadosAtualizados = {
    ocorrencias: resOcorrencias.listaFinal,
    provisorios: resProvisorios.listaFinal,
    visitantes: resVisitantes.listaFinal,
    operadores: resOperadores.listaFinal,
    vigilantes: resVigilantes.listaFinal,
    turnos: resTurnos.listaFinal,
    observacoes: resObservacoes.listaFinal,
    rfid: resRfid.listaFinal,
    responsaveis: responsaveisFinal,
    seguranca: dadosAtuais.seguranca || {}
  };

  sincronizarCachesLocais(dadosAtualizados);
  notificarMudancasGlobais(dadosAtualizados);

  return {
    success: true,
    mensagem: `Backup restaurado com sucesso! ${totalNovos} registros novos integrados, ${totalDuplicadosEvitados} duplicados evitados.`,
    detalhes: {
      ocorrencias: resOcorrencias,
      provisorios: resProvisorios,
      visitantes: resVisitantes,
      operadores: resOperadores,
      vigilantes: resVigilantes,
      turnos: resTurnos,
      observacoes: resObservacoes,
      rfid: resRfid,
      responsaveis: { atualizado: true },
      seguranca: { preservado: true }
    },
    totais: {
      totalNovos,
      totalPreservados,
      totalDuplicadosEvitados
    },
    dadosAtualizados
  };
}

/**
 * Atualiza todas as chaves de localStorage como garantia de redundância offline
 */
function sincronizarCachesLocais(dados) {
  if (typeof window === 'undefined') return;

  const salvarLocal = (chave, valor) => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      // Ignora quota cheia se houver imagens base64 muito grandes
    }
  };

  if (Array.isArray(dados.ocorrencias)) salvarLocal('cco_ocorrencias_registros', dados.ocorrencias);
  if (Array.isArray(dados.provisorios)) salvarLocal('cco_provisorios_registros', dados.provisorios);
  if (Array.isArray(dados.visitantes)) salvarLocal('cco_visitantes_registros', dados.visitantes);
  if (Array.isArray(dados.operadores)) salvarLocal('cco_operadores', dados.operadores);
  if (Array.isArray(dados.vigilantes)) salvarLocal('cco_vigilantes', dados.vigilantes);
  if (Array.isArray(dados.turnos)) salvarLocal('cco_turnos', dados.turnos);
  if (Array.isArray(dados.observacoes)) salvarLocal('cco_observacoes', dados.observacoes);
  if (Array.isArray(dados.rfid)) salvarLocal('cco_rfid_inventario', dados.rfid);
  if (dados.responsaveis) salvarLocal('cco_responsaveis', dados.responsaveis);
}

/**
 * Dispara eventos CustomEvent para os módulos atualizarem seus estados React em tempo real
 */
function notificarMudancasGlobais(dados) {
  if (typeof window === 'undefined') return;

  const disparar = (nomeEvento, payload) => {
    window.dispatchEvent(new CustomEvent(nomeEvento, { detail: payload }));
  };

  if (Array.isArray(dados.ocorrencias)) disparar('cco_ocorrencias_changed', dados.ocorrencias);
  if (Array.isArray(dados.provisorios)) disparar('cco_provisorios_changed', dados.provisorios);
  if (Array.isArray(dados.visitantes)) disparar('cco_visitantes_changed', dados.visitantes);
  if (Array.isArray(dados.operadores)) disparar('cco_operadores_changed', dados.operadores);
  if (Array.isArray(dados.vigilantes)) disparar('cco_vigilantes_changed', dados.vigilantes);
  if (Array.isArray(dados.turnos)) disparar('cco_turnos_changed', dados.turnos);
  if (Array.isArray(dados.observacoes)) disparar('cco_observacoes_changed', dados.observacoes);
  if (Array.isArray(dados.rfid)) disparar('cco_rfid_changed', dados.rfid);
  if (dados.responsaveis) disparar('cco_responsaveis_changed', dados.responsaveis);
}
