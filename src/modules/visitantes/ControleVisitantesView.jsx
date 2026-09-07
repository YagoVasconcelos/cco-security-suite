import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Check,
  X,
  Users,
  Car,
  FileText,
  Timer,
  Shield,
  Phone,
  History,
  ExternalLink
} from 'lucide-react';
import CardSlotsVisitantes from './CardSlotsVisitantes';
import NovoVisitanteModal from './NovoVisitanteModal';
import {
  carregarVisitantes,
  salvarVisitantes,
  registrarEntradaVisitante,
  registrarSaidaVisitante,
  obterHistoricoPorAnfitriao,
  formatarDataBr
} from '../../services/visitantesService';
import {
  carregarObservacoes,
  obterNomesObservacoesAtivas
} from '../../services/observacoesService';

const MOTIVOS_BASE = [
  'REUNIÃO',
  'PRESTAÇÃO DE SERVIÇO',
  'ENTREGA DE MERCADORIA / CARGA',
  'MANUTENÇÃO PREDIAL / INDUSTRIAL',
  'VISITA TÉCNICA',
  'AUDITORIA / FISCALIZAÇÃO',
  'ENTREVISTA / PROCESSO SELETIVO'
];

export default function ControleVisitantesView() {
  const [visitantes, setVisitantes] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroPortaria, setFiltroPortaria] = useState('TODAS');
  const [filtroSituacao, setFiltroSituacao] = useState('TODAS');
  const [filtroMotivo, setFiltroMotivo] = useState('TODAS');

  // Lista dinâmica de Motivos / Observações
  const [listaMotivos, setListaMotivos] = useState(() => {
    const ativas = obterNomesObservacoesAtivas();
    return Array.from(new Set([...MOTIVOS_BASE, ...ativas]));
  });

  // Modal Novo Visitante
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Baixa / Saída do Visitante
  const [visitanteParaBaixa, setVisitanteParaBaixa] = useState(null);
  const [dataSaida, setDataSaida] = useState('');
  const [horaSaida, setHoraSaida] = useState('');
  const [vigilanteSaida, setVigilanteSaida] = useState('Vig. Ordiley Batista');

  // Modal de Auditoria do Anfitrião (Histórico de visitas autorizadas por colaborador interno)
  const [detalhesAnfitriao, setDetalhesAnfitriao] = useState(null);

  // Monitor de escaninho
  const [portariaEscaninho, setPortariaEscaninho] = useState('P1');

  // Feedback Toast
  const [toast, setToast] = useState(null);

  // Carrega os dados na inicialização
  useEffect(() => {
    const dados = carregarVisitantes();
    setVisitantes(dados);

    const atualizarObs = async () => {
      try {
        const obs = await carregarObservacoes();
        const ativas = obs.filter(o => o.status !== 'Inativo').map(o => o.nome);
        setListaMotivos(Array.from(new Set([...MOTIVOS_BASE, ...ativas])));
      } catch (e) { }
    };

    atualizarObs();

    const handleObs = () => atualizarObs();
    window.addEventListener('cco_observacoes_changed', handleObs);
    return () => window.removeEventListener('cco_observacoes_changed', handleObs);
  }, []);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Cartões ocupados (status = NÃO DEVOLVIDO)
  const cartoesOcupados = visitantes
    .filter(v => v.situacao === 'NÃO DEVOLVIDO')
    .map(v => ({
      cartao: v.cartao,
      visitante: v.visitante,
      anfitriao: v.anfitriao,
      hora: v.horaEntrada
    }));

  // Métricas
  const totalNoSite = visitantes.filter(v => v.situacao === 'NÃO DEVOLVIDO').length;
  const hojeStr = new Date().toISOString().split('T')[0];
  const totalDevolvidosHoje = visitantes.filter(v => v.situacao === 'DEVOLVIDO' && v.dataSaida === hojeStr).length;
  const totalRegistros = visitantes.length;

  // Filtragem da lista
  const visitantesFiltrados = visitantes.filter(v => {
    const termo = busca.toLowerCase();
    const matchBusca =
      v.visitante.toLowerCase().includes(termo) ||
      v.cartao.toLowerCase().includes(termo) ||
      v.documento.toLowerCase().includes(termo) ||
      v.empresa.toLowerCase().includes(termo) ||
      v.anfitriao.toLowerCase().includes(termo) ||
      v.anfitriaoSetor.toLowerCase().includes(termo);

    const matchPortaria = filtroPortaria === 'TODAS' || v.portaria === filtroPortaria;
    const matchSituacao = filtroSituacao === 'TODAS' || v.situacao === filtroSituacao;
    const matchMotivo = filtroMotivo === 'TODAS' || v.motivo === filtroMotivo;

    return matchBusca && matchPortaria && matchSituacao && matchMotivo;
  });

  // Salvar novo visitante com validação do anfitrião e timestamp
  const handleSalvarNovoVisitante = (novoVisitante) => {
    try {
      const { novaLista, registroCompleto } = registrarEntradaVisitante(visitantes, novoVisitante);
      setVisitantes(novaLista);
      showToast(
        `✓ Credencial ${registroCompleto.cartao} liberada para o visitante ${registroCompleto.visitante} às ${registroCompleto.horaEntrada}! Anfitrião: ${registroCompleto.anfitriao}`,
        'success'
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // Iniciar baixa de saída do visitante
  const iniciarBaixa = (item) => {
    const agora = new Date();
    setVisitanteParaBaixa(item);
    setDataSaida(agora.toISOString().split('T')[0]);
    setHoraSaida(agora.toTimeString().split(' ')[0].substring(0, 5));
    setVigilanteSaida('Vig. Ordiley Batista');
  };

  // Confirmar saída / devolução da credencial com cálculo de tempo
  const confirmarSaida = () => {
    if (!visitanteParaBaixa) return;

    const novaLista = registrarSaidaVisitante(visitantes, visitanteParaBaixa.id, {
      dataSaida,
      horaSaida,
      vigilanteSaida
    });

    setVisitantes(novaLista);
    showToast(
      `✓ Saída do visitante ${visitanteParaBaixa.visitante} registrada às ${horaSaida}! Credencial ${visitanteParaBaixa.cartao} liberada no escaninho.`,
      'success'
    );
    setVisitanteParaBaixa(null);
  };

  // Abre auditoria de visitas por Anfitrião
  const abrirAuditoriaAnfitriao = (nomeAnfitriao) => {
    const dados = obterHistoricoPorAnfitriao(visitantes, nomeAnfitriao);
    setDetalhesAnfitriao(dados);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/90 text-emerald-200 text-xs font-semibold shadow-2xl animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toast.mensagem}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER DA FERRAMENTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Módulo 3
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Portarias P1 (01-20) & P2 (21-40)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                Vínculo Obrigatório de Anfitrião
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Controle de Liberação de Credenciais para Visitantes
            </h3>
            <p className="text-xs text-slate-400">
              Registro de entrada/saída, cálculo de permanência e auditoria de histórico vinculado ao Anfitrião solicitante.
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Liberação de Visitante</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visitantes no Site (Pendentes) */}
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Visitantes no Site
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalNoSite}</span>
              <span className="text-[11px] text-red-300 font-medium">credenciais ativas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Aguardando registro de saída</p>
          </div>
          <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Visitas Encerradas Hoje */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Visitas Encerradas Hoje
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalDevolvidosHoje}</span>
              <span className="text-[11px] text-emerald-300 font-medium">saídas registradas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Cartões retornados à portaria</p>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Conformidade de Anfitriões */}
        <div className="bg-slate-900 border border-purple-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Vínculo de Anfitrião
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">100%</span>
              <span className="text-[11px] text-purple-300 font-medium">vinculados</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Auditoria de solicitante ativa</p>
          </div>
          <div className="p-3 bg-purple-950/60 border border-purple-800/60 text-purple-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total de Movimentações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Total de Visitas
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalRegistros}</span>
              <span className="text-[11px] text-slate-400 font-medium">registradas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Base local sincronizada</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 text-blue-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MONITOR DO ESCANINHO DE VISITANTES (P1 & P2) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Escaninho de Credenciais de Visitantes (Clique para liberar cartão disponível)
          </span>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPortariaEscaninho('P1')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${portariaEscaninho === 'P1'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Portaria 1 (01 - 20)
            </button>
            <button
              onClick={() => setPortariaEscaninho('P2')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${portariaEscaninho === 'P2'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Portaria 2 (21 - 40)
            </button>
          </div>
        </div>
        <CardSlotsVisitantes
          portaria={portariaEscaninho}
          ocupados={cartoesOcupados}
          onSelectCard={(num) => {
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por visitante, anfitrião (solicitante), empresa, RG/CPF ou cartão..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Portaria */}
            <select
              value={filtroPortaria}
              onChange={(e) => setFiltroPortaria(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODAS">Todas Portarias</option>
              <option value="P1">Portaria 1 (P1: 01-20)</option>
              <option value="P2">Portaria 2 (P2: 21-40)</option>
            </select>

            {/* Situação */}
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="TODAS">Todos os Status</option>
              <option value="NÃO DEVOLVIDO">🔴 No Site (Pendente)</option>
              <option value="DEVOLVIDO">🟢 Visita Encerrada</option>
            </select>

            {/* Motivo / Observação */}
            <select
              value={filtroMotivo}
              onChange={(e) => setFiltroMotivo(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODAS">Todos Motivos / Observações</option>
              {listaMotivos.map((mot) => (
                <option key={mot} value={mot}>{mot}</option>
              ))}
            </select>

            {/* Limpar Filtros */}
            {(busca || filtroPortaria !== 'TODAS' || filtroSituacao !== 'TODAS' || filtroMotivo !== 'TODAS') && (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setFiltroPortaria('TODAS');
                  setFiltroSituacao('TODAS');
                  setFiltroMotivo('TODAS');
                }}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                title="Limpar filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE MOVIMENTAÇÕES DE VISITANTES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Registros de Visitantes ({visitantesFiltrados.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              Clique no Anfitrião para consultar o histórico completo de visitas autorizadas
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Visitantes ativos no site destacados em <span className="text-red-400 font-semibold">vermelho</span>
          </span>
        </div>

        {/* CABEÇALHO DA LISTA (FLEX w-full) */}
        <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div className="w-14 shrink-0">Cartão</div>
          <div className="flex-1 min-w-0 pr-2">Visitante & Empresa</div>
          <div className="w-40 lg:w-48 shrink-0 pr-2 text-emerald-300">Anfitrião (Solicitante)</div>
          <div className="w-24 shrink-0">Entrada</div>
          <div className="w-28 shrink-0">Saída</div>
          <div className="w-20 shrink-0">Motivo</div>
          <div className="w-24 shrink-0 text-right">Ação</div>
        </div>

        {/* CORPO DA LISTA (LINHAS FLEX w-full) */}
        <div className="divide-y divide-slate-800/70 bg-slate-900/40 w-full">
          {visitantesFiltrados.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum visitante encontrado para os filtros selecionados.
            </div>
          ) : (
            visitantesFiltrados.map((item) => {
              const isPendente = item.situacao === 'NÃO DEVOLVIDO';

              return (
                <div
                  key={item.id}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-xs transition-colors ${isPendente
                      ? 'bg-red-950/15 hover:bg-red-950/25'
                      : 'hover:bg-slate-800/40'
                    }`}
                >
                  {/* Cartão */}
                  <div className="w-14 shrink-0">
                    <span className={`font-mono text-xs font-extrabold px-2 py-1 rounded-md border inline-block text-center ${isPendente
                        ? 'bg-red-900/40 text-red-200 border-red-700/60'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                      {item.cartao}
                    </span>
                  </div>

                  {/* Visitante & Empresa */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-slate-100 text-xs truncate">
                      {item.visitante}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                      <span className="font-mono text-slate-300 shrink-0">Doc: {item.documento}</span>
                      <span>•</span>
                      <span className="truncate">{item.empresa}</span>
                    </div>
                  </div>

                  {/* ANFITRIÃO (SOLICITANTE INTERNO) */}
                  <div className="w-40 lg:w-48 shrink-0 pr-2">
                    <button
                      type="button"
                      onClick={() => abrirAuditoriaAnfitriao(item.anfitriao)}
                      className="text-left group w-full truncate"
                      title="Clique para auditar todas as visitas liberadas por este anfitrião"
                    >
                      <div className="flex items-center gap-1 truncate">
                        <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="font-bold text-emerald-300 text-xs truncate group-hover:underline">
                          {item.anfitriao}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate pl-4">
                        {item.anfitriaoSetor}
                      </p>
                    </button>
                  </div>

                  {/* Entrada */}
                  <div className="w-24 shrink-0 text-slate-300">
                    <p className="font-semibold text-[11px]">{formatarDataBr(item.dataEntrada)}</p>
                    <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      <span className="font-bold text-slate-200">{item.horaEntrada}</span>
                    </p>
                  </div>

                  {/* Saída */}
                  <div className="w-28 shrink-0">
                    {item.dataSaida ? (
                      <div className="text-slate-300">
                        <p className="font-semibold text-emerald-400 text-[11px]">{formatarDataBr(item.dataSaida)}</p>
                        <p className="text-[10px] font-mono text-slate-300">às {item.horaSaida}</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/60 animate-pulse">
                        No Site
                      </span>
                    )}
                  </div>

                  {/* Motivo */}
                  <div className="w-20 shrink-0">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-full">
                      {item.motivo}
                    </span>
                  </div>

                  {/* Status / Ações */}
                  <div className="w-24 shrink-0 flex items-center justify-end text-right">
                    {isPendente ? (
                      <button
                        type="button"
                        onClick={() => iniciarBaixa(item)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all shrink-0"
                        title="Registrar horário de saída e devolução da credencial do visitante"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Saída</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Encerrado
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE NOVO VISITANTE */}
      <NovoVisitanteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSalvar={handleSalvarNovoVisitante}
        cartoesOcupados={cartoesOcupados}
      />

      {/* MODAL DE BAIXA DE SAÍDA DO VISITANTE COM CAPTURA DE HORÁRIO */}
      {visitanteParaBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Registrar Saída do Visitante
                  </h3>
                  <p className="text-xs text-slate-400">
                    Captura automática do horário de saída e devolução de credencial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVisitanteParaBaixa(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Credencial:</span>
                <span className="font-mono font-bold text-emerald-300">{visitanteParaBaixa.cartao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visitante:</span>
                <span className="font-bold text-slate-200">{visitanteParaBaixa.visitante}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Anfitrião:</span>
                <span className="font-semibold text-emerald-400">{visitanteParaBaixa.anfitriao} ({visitanteParaBaixa.anfitriaoSetor})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entrada:</span>
                <span className="text-slate-300 font-mono">
                  {formatarDataBr(visitanteParaBaixa.dataEntrada)} às {visitanteParaBaixa.horaEntrada}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Data de Saída:
                </label>
                <input
                  type="date"
                  value={dataSaida}
                  onChange={(e) => setDataSaida(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Hora de Saída:
                </label>
                <input
                  type="time"
                  step="1"
                  value={horaSaida}
                  onChange={(e) => setHoraSaida(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vigilante que registrou a saída:
              </label>
              <select
                value={vigilanteSaida}
                onChange={(e) => setVigilanteSaida(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Vig. Ordiley Batista">Vig. Ordiley Batista</option>
                <option value="Vig. Silva (P1)">Vig. Silva (P1)</option>
                <option value="Vig. Santos (P2)">Vig. Santos (P2)</option>
                <option value="Vig. Oliveira (Ronda)">Vig. Oliveira (Ronda)</option>
                <option value="Vig. Pereira (CCO)">Vig. Pereira (CCO)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setVisitanteParaBaixa(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSaida}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Saída & Baixa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA DO ANFITRIÃO (HISTÓRICO VINCULADO AO SOLICITANTE) */}
      {detalhesAnfitriao && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Histórico do Anfitrião Solicitante
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auditoria de visitantes autorizados pelo colaborador interno
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetalhesAnfitriao(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Anfitrião Responsável</span>
                  <p className="font-bold text-white text-sm">{detalhesAnfitriao.anfitriao}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    {detalhesAnfitriao.total} visitas totais
                  </span>
                  {detalhesAnfitriao.noSite > 0 && (
                    <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                      {detalhesAnfitriao.noSite} no site agora
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Visitantes autorizados por este Anfitrião:</span>
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {detalhesAnfitriao.historico.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 font-mono">{v.cartao}</span>
                        <span className="font-bold text-slate-200">{v.visitante}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {v.empresa} • Doc: {v.documento} • Motivo: <strong className="text-slate-300">{v.motivo}</strong>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        Entrada: {formatarDataBr(v.dataEntrada)} às {v.horaEntrada}
                        {v.horaSaida ? ` • Saída: ${v.horaSaida} (${v.tempoPermanencia || 'Encerrado'})` : ' • ATUALMENTE NO SITE'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.situacao === 'NÃO DEVOLVIDO'
                        ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                      {v.situacao === 'NÃO DEVOLVIDO' ? 'No Site' : 'Devolvido'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetalhesAnfitriao(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
