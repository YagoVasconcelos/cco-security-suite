import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  FileCheck2,
  Layers,
  Sparkles,
  Info,
  Clock,
  FileSpreadsheet,
  X,
  FileJson,
  ArrowRight
} from 'lucide-react';
import {
  coletarDadosCompletos,
  exportarBackupCompleto,
  selecionarArquivoBackup,
  normalizarEstruturaBackup,
  analisarPreviaRestauracao,
  executarRestauracaoComMerge
} from '../../services/backupService';

export default function PainelBackupRestauracao({ onToast }) {
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [estatisticasAtuais, setEstatisticasAtuais] = useState(null);

  // Estados de Ações
  const [exportando, setExportando] = useState(false);
  const [processandoArquivo, setProcessandoArquivo] = useState(false);
  const [executandoRestauracao, setExecutandoRestauracao] = useState(false);

  // Modais
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [modalFeedbackAberto, setModalFeedbackAberto] = useState(false);

  // Dados do Arquivo em Análise
  const [arquivoEmAnalise, setArquivoEmAnalise] = useState(null);
  const [preAnalise, setPreAnalise] = useState(null);
  const [dadosParaRestaurar, setDadosParaRestaurar] = useState(null);

  // Relatório Final da Restauração
  const [relatorioFinal, setRelatorioFinal] = useState(null);

  const notificar = (msg, tipo = 'success') => {
    if (typeof onToast === 'function') {
      onToast(msg, tipo);
    }
  };

  // Carrega contadores atuais para exibir no painel
  const atualizarEstatisticas = async () => {
    try {
      setCarregandoDados(true);
      const snapshot = await coletarDadosCompletos();
      setEstatisticasAtuais(snapshot.estatisticas || null);
    } catch (err) {
      console.warn('[PainelBackup] Erro ao carregar contadores:', err);
    } finally {
      setCarregandoDados(false);
    }
  };

  useEffect(() => {
    atualizarEstatisticas();

    const escutarMudancas = () => atualizarEstatisticas();
    window.addEventListener('cco_ocorrencias_changed', escutarMudancas);
    window.addEventListener('cco_provisorios_changed', escutarMudancas);
    window.addEventListener('cco_visitantes_changed', escutarMudancas);
    window.addEventListener('cco_operadores_changed', escutarMudancas);
    window.addEventListener('cco_vigilantes_changed', escutarMudancas);

    return () => {
      window.removeEventListener('cco_ocorrencias_changed', escutarMudancas);
      window.removeEventListener('cco_provisorios_changed', escutarMudancas);
      window.removeEventListener('cco_visitantes_changed', escutarMudancas);
      window.removeEventListener('cco_operadores_changed', escutarMudancas);
      window.removeEventListener('cco_vigilantes_changed', escutarMudancas);
    };
  }, []);

  // 1. AÇÃO: Fazer Backup / Exportar
  const handleExportarBackup = async () => {
    try {
      setExportando(true);
      const resultado = await exportarBackupCompleto();
      if (resultado.cancelado) {
        return;
      }
      if (resultado.sucesso) {
        notificar(`✓ Backup completo gerado com sucesso! Arquivo: ${resultado.caminhoArquivo.split(/[\\/]/).pop()}`);
      } else {
        notificar(resultado.error || 'Erro ao gerar backup.', 'error');
      }
    } catch (err) {
      notificar(err.message || 'Falha ao exportar backup.', 'error');
    } finally {
      setExportando(false);
    }
  };

  // 2. AÇÃO: Restaurar Backup / Importar (Seleção do arquivo e pré-análise)
  const handleImportarBackup = async () => {
    try {
      setProcessandoArquivo(true);
      const selecao = await selecionarArquivoBackup();
      if (selecao.cancelado) {
        return;
      }
      if (selecao.error) {
        notificar(selecao.error, 'error');
        return;
      }

      // Validação da estrutura
      const estrutura = normalizarEstruturaBackup(selecao.conteudo);

      // Pré-análise do Merge Inteligente
      const analise = await analisarPreviaRestauracao(estrutura.dados);

      setArquivoEmAnalise({
        nome: selecao.nomeArquivo || 'backup.json',
        caminho: selecao.caminhoArquivo || 'Disco Local',
        metadados: estrutura.metadados
      });
      setPreAnalise(analise);
      setDadosParaRestaurar(estrutura.dados);
      setModalConfirmacaoAberto(true);
    } catch (err) {
      notificar(err.message || 'Arquivo de backup inválido ou incompatível.', 'error');
    } finally {
      setProcessandoArquivo(false);
    }
  };

  // 3. AÇÃO: Confirmar e Executar a Restauração
  const handleConfirmarRestauracao = async () => {
    if (!dadosParaRestaurar) return;

    try {
      setExecutandoRestauracao(true);
      const resposta = await executarRestauracaoComMerge(dadosParaRestaurar);

      setModalConfirmacaoAberto(false);
      setRelatorioFinal(resposta);
      setModalFeedbackAberto(true);
      await atualizarEstatisticas();
      notificar('✓ Restauração com Merge Inteligente finalizada com sucesso!');
    } catch (err) {
      notificar(err.message || 'Falha ao executar restauração.', 'error');
    } finally {
      setExecutandoRestauracao(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-inner shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Backup e Restauração de Dados
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Merge Inteligente Anti-Duplicidade
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Windows Native (.json)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Exporte todos os bancos de dados locais em um arquivo unificado ou restaure backups pré-existentes com fusão não-destrutiva.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={atualizarEstatisticas}
            disabled={carregandoDados}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-all cursor-pointer"
            title="Atualizar contadores da base de dados"
          >
            <RefreshCw className={`w-4 h-4 ${carregandoDados ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DOS BOTÕES DE AÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* BOTÃO 1: FAZER BACKUP / EXPORTAR */}
        <div className="group relative bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-blue-500/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Exportação Completa
              </span>
              <span className="text-[10px] text-slate-500 font-mono">dialog.showSaveDialog</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Exportar Arquivo de Backup
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gera um arquivo <span className="text-blue-300 font-mono">.json</span> consolidado contendo todas as ocorrências, provisórios, visitantes, efetivo (operadores e vigilantes), escalas e configurações da Central.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportarBackup}
            disabled={exportando}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {exportando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Coletando e Gravando no Disco...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>[ Fazer Backup / Exportar ]</span>
              </>
            )}
          </button>
        </div>

        {/* BOTÃO 2: RESTAURAR BACKUP / IMPORTAR */}
        <div className="group relative bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-emerald-500/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Fusão Segura
              </span>
              <span className="text-[10px] text-slate-500 font-mono">dialog.showOpenDialog</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Restaurar Backup com Fusão
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Carrega um arquivo <span className="text-emerald-300 font-mono">.json</span> anterior integrando apenas registros novos. Dados existentes são preservados sem nenhuma sobrescrita destrutiva.
            </p>
          </div>

          <button
            type="button"
            onClick={handleImportarBackup}
            disabled={processandoArquivo || executandoRestauracao}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {processandoArquivo ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Examinando Arquivo de Backup...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>[ Restaurar Backup / Importar ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CONTADORES EM TEMPO REAL DA BASE ATUAL */}
      {estatisticasAtuais && (
        <div className="space-y-2.5 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            Volume Atual Armazenado no Disco
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-medium">Ocorrências (RO)</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{estatisticasAtuais.totalOcorrencias || 0}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-medium">Provisórios</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{estatisticasAtuais.totalProvisorios || 0}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-medium">Visitantes</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{estatisticasAtuais.totalVisitantes || 0}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-medium">Operadores CCO</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{estatisticasAtuais.totalOperadores || 0}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-medium">Vigilantes</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{estatisticasAtuais.totalVigilantes || 0}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-medium">Turnos / Motivos</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{(estatisticasAtuais.totalTurnos || 0) + (estatisticasAtuais.totalObservacoes || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* CARDS DE DIRETRIZES DE SEGURANÇA E GARANTIA ANTI-DUPLICIDADE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs text-slate-400">
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Fusão Não-Destrutiva</span>
          </div>
          <p className="leading-relaxed">
            Nenhum dado atual é sobrescrito ou excluído. Se o registro já existir, a versão ativa é preservada intacta.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
            <FileCheck2 className="w-4 h-4" />
            <span>Chaves Únicas de Negócio</span>
          </div>
          <p className="leading-relaxed">
            Identificação por número do Protocolo RO (<span className="font-mono text-slate-300">RO-2026-XXXX</span>), documento/RG de visitantes e matrículas de operadores.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-[11px] uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sincronização com Excel</span>
          </div>
          <p className="leading-relaxed">
            Ao restaurar os dados, as planilhas <span className="font-mono text-slate-300">ocorrencias.xlsx</span> na rede e nos Documentos são atualizadas automaticamente.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRMAÇÃO E PRÉ-ANÁLISE DA RESTAURAÇÃO                         */}
      {/* ========================================================================= */}
      {modalConfirmacaoAberto && arquivoEmAnalise && preAnalise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setModalConfirmacaoAberto(false)}
              disabled={executandoRestauracao}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-start gap-3.5 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirmar Restauração com Merge Inteligente
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revise os dados identificados no arquivo antes de consolidá-los com a base operacional.
                </p>
              </div>
            </div>

            {/* Dados do Arquivo */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-blue-400" />
                  Arquivo Selecionado:
                </span>
                <span className="font-mono text-slate-200 font-semibold">{arquivoEmAnalise.nome}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Data de Exportação:</span>
                <span className="text-slate-300">
                  {arquivoEmAnalise.metadados.dataExportacao
                    ? new Date(arquivoEmAnalise.metadados.dataExportacao).toLocaleString('pt-BR')
                    : 'Não especificada'}
                </span>
              </div>
            </div>

            {/* Resumo da Análise de Merge */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Diagnóstico de Integração de Registros:
              </span>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">Novos Registros</span>
                  <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">+{preAnalise.totalNovos}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Serão integrados</p>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase">Já Existentes</span>
                  <p className="text-2xl font-bold font-mono text-blue-300 mt-1">{preAnalise.totalPreservados}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">100% preservados</p>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60">
                  <span className="text-[10px] text-purple-400 font-semibold uppercase">Duplicidades</span>
                  <p className="text-2xl font-bold font-mono text-purple-300 mt-1">0</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{preAnalise.totalDuplicadosEvitados} já na base</p>
                </div>
              </div>

              {/* Detalhamento por categoria */}
              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs bg-slate-950/40">
                <div className="flex items-center justify-between p-2.5 px-3">
                  <span className="text-slate-300">Ocorrências (RO)</span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-emerald-400">+{preAnalise.previa.ocorrencias.novos} novos</strong> (atual: {preAnalise.previa.ocorrencias.atual})
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 px-3">
                  <span className="text-slate-300">Controle de Provisórios (P1 / P2)</span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-emerald-400">+{preAnalise.previa.provisorios.novos} novos</strong> (atual: {preAnalise.previa.provisorios.atual})
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 px-3">
                  <span className="text-slate-300">Liberação de Visitantes</span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-emerald-400">+{preAnalise.previa.visitantes.novos} novos</strong> (atual: {preAnalise.previa.visitantes.atual})
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 px-3">
                  <span className="text-slate-300">Operadores e Vigilantes</span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-emerald-400">+{preAnalise.previa.operadores.novos + preAnalise.previa.vigilantes.novos} novos</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso de Confirmação */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Garantia de Integridade:</strong> A base atual não será apagada. Ambos os conjuntos serão mesclados em uma base única sem nenhuma duplicidade gerada.
              </span>
            </div>

            {/* Botões do Modal */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacaoAberto(false)}
                disabled={executandoRestauracao}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRestauracao}
                disabled={executandoRestauracao}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {executandoRestauracao ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Executando Merge e Gravando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Executar Restauração</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FEEDBACK DETALHADO DA RESTAURAÇÃO CONCLUÍDA                      */}
      {/* ========================================================================= */}
      {modalFeedbackAberto && relatorioFinal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-xl rounded-2xl p-6 shadow-2xl shadow-emerald-500/10 space-y-5 relative">
            <button
              type="button"
              onClick={() => setModalFeedbackAberto(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ícone e Título de Sucesso */}
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Restauração Concluída com Sucesso!
              </h3>
              <p className="text-xs text-emerald-400/90 font-medium">
                {relatorioFinal.mensagem || 'Dados integrados com sucesso na base operacional.'}
              </p>
            </div>

            {/* Destaque das Métricas Finais */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Novos Integrados</span>
                <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  +{relatorioFinal.totais?.totalNovos || 0}
                </p>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Preservados</span>
                <p className="text-2xl font-black font-mono text-blue-400 mt-1">
                  {relatorioFinal.totais?.totalPreservados || 0}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Duplicados Evitados</span>
                <p className="text-2xl font-black font-mono text-purple-400 mt-1">
                  0
                </p>
              </div>
            </div>

            {/* Detalhes por base */}
            {relatorioFinal.detalhes && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Resumo Detalhado por Módulo:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Ocorrências:</span>
                    <span className="font-mono text-slate-200">
                      +{relatorioFinal.detalhes.ocorrencias?.novos || 0} novos
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Provisórios:</span>
                    <span className="font-mono text-slate-200">
                      +{relatorioFinal.detalhes.provisorios?.novos || 0} novos
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Visitantes:</span>
                    <span className="font-mono text-slate-200">
                      +{relatorioFinal.detalhes.visitantes?.novos || 0} novos
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Operadores:</span>
                    <span className="font-mono text-slate-200">
                      +{relatorioFinal.detalhes.operadores?.novos || 0} novos
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setModalFeedbackAberto(false)}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Concluir e Fechar Resumo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
