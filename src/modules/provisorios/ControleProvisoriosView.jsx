import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
  ChevronRight,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Check,
  X,
  History,
  Timer,
  FileCheck
} from 'lucide-react';
import CardSlotsVisualizer from './CardSlotsVisualizer';
import NovaSaidaModal from './NovaSaidaModal';
import {
  carregarRegistros,
  salvarRegistros,
  registrarSaidaCredencial,
  registrarBaixaDevolucao,
  verificarRegraTresAcessos,
  formatarDataBr,
  LIMITE_ACESSOS_MES
} from '../../services/provisoriosService';

const VIGILANTES_PADRAO = [
  'Vig. Ordiley Batista',
  'Vig. Silva (P1)',
  'Vig. Santos (P2)',
  'Vig. Oliveira (Ronda)',
  'Vig. Pereira (CCO)',
  'Vig. Marcilene',
  'Vig. David',
  'Vig. Jozimar Souza'
];

import {
  carregarObservacoes,
  obterNomesObservacoesAtivas
} from '../../services/observacoesService';

export default function ControleProvisoriosView() {
  const [registros, setRegistros] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroPortaria, setFiltroPortaria] = useState('TODAS');
  const [filtroSituacao, setFiltroSituacao] = useState('TODAS');
  const [filtroObservacao, setFiltroObservacao] = useState('TODAS');

  // Observações Dinâmicas
  const [listaObservacoes, setListaObservacoes] = useState(() => obterNomesObservacoesAtivas());



  // Modal de Nova Saída
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal de Confirmação de Baixa
  const [registroParaBaixa, setRegistroParaBaixa] = useState(null);
  const [dataBaixa, setDataBaixa] = useState('');
  const [horaBaixa, setHoraBaixa] = useState('');
  const [vigilanteRecebedor, setVigilanteRecebedor] = useState('Vig. Ordiley Batista');

  // Modal de Detalhes de Reincidência (Histórico dos acessos do colaborador no mês)
  const [detalhesColaborador, setDetalhesColaborador] = useState(null);

  // Monitor do escaninho
  const [portariaEscaninho, setPortariaEscaninho] = useState('P1');

  // Feedback de ações
  const [toast, setToast] = useState(null);

  // Carrega os dados na inicialização
  useEffect(() => {
    const dados = carregarRegistros();
    setRegistros(dados);

    const atualizarObs = async () => {
      try {
        const obsDados = await carregarObservacoes();
        const ativas = obsDados.filter(o => o.status !== 'Inativo').map(o => o.nome);
        if (ativas.length > 0) {
          setListaObservacoes(ativas);
        }
      } catch (e) { }
    };

    atualizarObs();

    const handleObsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativas = e.detail.filter(o => o.status !== 'Inativo').map(o => o.nome);
        if (ativas.length > 0) {
          setListaObservacoes(ativas);
        }
      } else {
        atualizarObs();
      }
    };

    window.addEventListener('cco_observacoes_changed', handleObsChanged);
    return () => window.removeEventListener('cco_observacoes_changed', handleObsChanged);
  }, []);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Mês atual em formato 'YYYY-MM'
  const mesAtual = new Date().toISOString().substring(0, 7);

  // Cartões ocupados (status = NÃO DEVOLVIDO)
  const cartoesOcupados = registros
    .filter(r => r.situacao === 'NÃO DEVOLVIDO')
    .map(r => ({
      cartao: r.cartao,
      colaborador: r.colaborador,
      hora: r.horaRetirada
    }));

  // Identifica colaboradores que ultrapassaram o limite de 3 acessos no mês atual
  const mapaReincidentesMes = new Map();
  registros.forEach(r => {
    if (r.dataRetirada.startsWith(mesAtual)) {
      const nomeChave = r.colaborador.toUpperCase().trim();
      const contagem = (mapaReincidentesMes.get(nomeChave) || 0) + 1;
      mapaReincidentesMes.set(nomeChave, contagem);
    }
  });

  const totalReincidentesUnicos = Array.from(mapaReincidentesMes.entries())
    .filter(([_, count]) => count >= LIMITE_ACESSOS_MES).length;

  // Métricas
  const totalPendentes = registros.filter(r => r.situacao === 'NÃO DEVOLVIDO').length;
  const hojeStr = new Date().toISOString().split('T')[0];
  const totalDevolvidosHoje = registros.filter(r => r.situacao === 'DEVOLVIDO' && r.dataDevolucao === hojeStr).length;
  const totalRegistros = registros.length;

  // Filtragem da lista
  const registrosFiltrados = registros.filter(r => {
    const termo = busca.toLowerCase().trim();
    const matchBusca = !termo ||
      (r.colaborador && r.colaborador.toLowerCase().includes(termo)) ||
      (r.empresa && r.empresa.toLowerCase().includes(termo)) ||
      (r.cartao && r.cartao.toLowerCase().includes(termo)) ||
      (r.matricula && r.matricula.toLowerCase().includes(termo));

    const matchPortaria = filtroPortaria === 'TODAS' || r.portaria === filtroPortaria;

    let matchSituacao = true;
    if (filtroSituacao === 'DEVOLVIDO') {
      matchSituacao = r.situacao === 'DEVOLVIDO' || r.status === 'DEVOLVIDO';
    } else if (filtroSituacao === 'NÃO DEVOLVIDO') {
      matchSituacao = r.situacao === 'NÃO DEVOLVIDO' || r.situacao === 'NAO_DEVOLVIDO' || r.status === 'NAO_DEVOLVIDO';
    }

    const matchObs = filtroObservacao === 'TODAS' || (r.observacao && r.observacao.toUpperCase() === filtroObservacao.toUpperCase());

    return matchBusca && matchPortaria && matchSituacao && matchObs;
  });

  // Salvar novo registro com regra dos 3 acessos e timestamp
  const handleSalvarNovaSaida = (novoRegistro) => {
    const { novaLista, registroCompleto, verificacao } = registrarSaidaCredencial(registros, novoRegistro);
    setRegistros(novaLista);

    if (verificacao.ultrapassouLimite) {
      showToast(
        `⚠️ Saída do cartão ${registroCompleto.cartao} registrada com justificativa para ${registroCompleto.colaborador} (${verificacao.proximoAcessoNumero}º acesso no mês)!`,
        'warning'
      );
    } else {
      showToast(
        `✓ Saída do cartão ${registroCompleto.cartao} registrada com sucesso às ${registroCompleto.horaRetirada}!`,
        'success'
      );
    }
  };

  // Abrir modal de baixa preparando timestamp em tempo real
  const iniciarBaixa = (item) => {
    const agora = new Date();
    setRegistroParaBaixa(item);
    setDataBaixa(agora.toISOString().split('T')[0]);
    setHoraBaixa(agora.toTimeString().split(' ')[0].substring(0, 5));
    setVigilanteRecebedor('Vig. Ordiley Batista');
  };

  // Confirmar baixa / devolução do cartão
  const confirmarBaixaDevolucao = () => {
    if (!registroParaBaixa) return;

    const novaLista = registrarBaixaDevolucao(registros, registroParaBaixa.id, {
      dataDevolucao: dataBaixa,
      horaDevolucao: horaBaixa,
      vigilanteDevolucao: vigilanteRecebedor
    });

    setRegistros(novaLista);
    showToast(`✓ Devolução do cartão ${registroParaBaixa.cartao} registrada às ${horaBaixa}! Slot liberado.`, 'success');
    setRegistroParaBaixa(null);
  };

  // Abre modal de histórico para conferir as retiradas do colaborador
  const abrirHistoricoColaborador = (nomeColaborador) => {
    const resultado = verificarRegraTresAcessos(registros, nomeColaborador, hojeStr);
    setDetalhesColaborador({
      nome: nomeColaborador,
      ...resultado
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 ${toast.tipo === 'warning'
            ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
            : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
          }`}>
          <div className="flex items-center gap-2.5">
            {toast.tipo === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
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
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Módulo 2
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Portarias P1 & P2
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Regra dos 3 Acessos Ativa
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Controle de Credenciais Provisórias
            </h3>
            <p className="text-xs text-slate-400">
              Controle automatizado de saída/devolução por portaria, auditoria de permanência e bloqueio por reincidência.
            </p>
          </div>
        </div>

      </div>

      {/* NOVA BARRA DE PESQUISA E FILTROS DINÂMICOS (MINIMALISTA E HORIZONTAL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca por Texto (Nome do Colaborador ou Empresa) */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou empresa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70 transition-colors"
          />
        </div>

        {/* Filtros em Linha & Ação Principal */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Filtro de Status (Todos, Devolvidos, Não Devolvidos) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="bg-transparent border-0 py-1 text-xs text-slate-200 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="TODAS" className="bg-slate-950 text-slate-200">Todos os Status</option>
              <option value="DEVOLVIDO" className="bg-slate-950 text-emerald-400">Devolvidos</option>
              <option value="NÃO DEVOLVIDO" className="bg-slate-950 text-red-400">Não Devolvidos</option>
            </select>
          </div>

          {/* Filtro de Portaria */}
          <select
            value={filtroPortaria}
            onChange={(e) => setFiltroPortaria(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 font-medium cursor-pointer"
          >
            <option value="TODAS" className="bg-slate-950">Todas Portarias</option>
            <option value="P1" className="bg-slate-950">Portaria 1 (P1)</option>
            <option value="P2" className="bg-slate-950">Portaria 2 (P2)</option>
          </select>

          {/* Limpar Filtros */}
          {(busca || filtroSituacao !== 'TODAS' || filtroPortaria !== 'TODAS') && (
            <button
              type="button"
              onClick={() => {
                setBusca('');
                setFiltroSituacao('TODAS');
                setFiltroPortaria('TODAS');
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Limpar filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Botão Principal + Nova Credencial */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Credencial</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pendentes / Não Devolvidos */}
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Pendentes de Devolução
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalPendentes}</span>
              <span className="text-[11px] text-red-300 font-medium">cartões retidos</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Sujeito a cobrança de 2ª via</p>
          </div>
          <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Devolvidos Hoje */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Devolvidos Hoje
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalDevolvidosHoje}</span>
              <span className="text-[11px] text-emerald-300 font-medium">baixas registradas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Cartões retornados ao escaninho</p>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Regra dos 3 Acessos / Reincidentes no Mês */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Alerta de Reincidência
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalReincidentesUnicos}</span>
              <span className="text-[11px] text-amber-300 font-medium">colaboradores (≥ 3x)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Limite mensal de 3 atingido</p>
          </div>
          <div className="p-3 bg-amber-950/60 border border-amber-800/60 text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total de Movimentações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Total Registrado
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{totalRegistros}</span>
              <span className="text-[11px] text-slate-400 font-medium">movimentações</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Base local sincronizada</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 text-blue-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MONITOR DO ESCANINHO DE CARTÕES FÍSICOS (P1 & P2) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Escaninho Físico das Portarias (Clique no cartão disponível para registrar saída)
          </span>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPortariaEscaninho('P1')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${portariaEscaninho === 'P1'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Portaria 1 (01 - 10)
            </button>
            <button
              onClick={() => setPortariaEscaninho('P2')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${portariaEscaninho === 'P2'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Portaria 2 (11 - 20)
            </button>
          </div>
        </div>
        <CardSlotsVisualizer
          portaria={portariaEscaninho}
          ocupados={cartoesOcupados}
          onSelectCard={(num) => {
            setIsModalOpen(true);
          }}
        />
      </div>



      {/* LISTA / REGISTROS DE CREDENCIAIS PROVISÓRIAS (FLEX 100% W-FULL SEM SCROLL HORIZONTAL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm w-full">
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Registros de Movimentação ({registrosFiltrados.length})
            </h4>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              • Histórico operacional com cálculo de permanência e regras de acesso
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Pendências em <span className="text-red-400 font-semibold">vermelho</span>
          </span>
        </div>

        {/* CABEÇALHO DA LISTA (FLEX w-full) */}
        <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div className="w-14 shrink-0">Cartão</div>
          <div className="flex-1 min-w-0 pr-2">Colaborador & Empresa</div>
          <div className="w-28 shrink-0">Retirada</div>
          <div className="w-32 shrink-0">Devolução</div>
          <div className="w-24 shrink-0">Motivo</div>
          <div className="w-24 lg:w-28 shrink-0">Vigilante</div>
          <div className="w-24 shrink-0 text-right">Ação</div>
        </div>

        {/* CORPO DA LISTA (LINHAS FLEX w-full) */}
        <div className="divide-y divide-slate-800/70 bg-slate-900/40 w-full">
          {registrosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          ) : (
            registrosFiltrados.map((item) => {
              const isPendente = item.situacao === 'NÃO DEVOLVIDO';

              // Verifica quantos acessos o colaborador fez no mês da retirada
              const checkRegra = verificarRegraTresAcessos(registros, item.colaborador, item.dataRetirada);
              const isReincidente = checkRegra.totalAcessosMes >= LIMITE_ACESSOS_MES;

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

                  {/* Colaborador & Empresa */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-100 text-xs truncate max-w-[200px] xl:max-w-none">
                        {item.colaborador}
                      </span>
                      {isReincidente && (
                        <button
                          type="button"
                          onClick={() => abrirHistoricoColaborador(item.colaborador)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 flex items-center gap-1 transition-colors shrink-0"
                          title="Clique para ver histórico completo das retiradas deste colaborador"
                        >
                          <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                          <span>{checkRegra.totalAcessosMes}x</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                      <span className="truncate">{item.empresa}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500 shrink-0">Mat: {item.matricula}</span>
                    </div>
                  </div>

                  {/* Retirada (Horário e Data compactos) */}
                  <div className="w-28 shrink-0 text-slate-300">
                    <p className="font-semibold text-[11px]">{formatarDataBr(item.dataRetirada)}</p>
                    <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <ArrowUpRight className="w-3 h-3 text-amber-400" />
                      <span className="font-bold text-slate-200">{item.horaRetirada}</span>
                    </p>
                  </div>

                  {/* Devolução (Permanência ou Status Pendente) */}
                  <div className="w-32 shrink-0">
                    {item.dataDevolucao ? (
                      <div className="text-slate-300">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-emerald-400 text-[11px]">{formatarDataBr(item.dataDevolucao)}</span>
                          <span className="text-[10px] font-mono text-slate-300">às {item.horaDevolucao}</span>
                        </div>
                        {item.tempoPermanencia && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono truncate">
                            <Timer className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                            <span>{item.tempoPermanencia}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/60 animate-pulse">
                        Não Devolvido
                      </span>
                    )}
                  </div>

                  {/* Motivo / Observação */}
                  <div className="w-24 shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${item.observacao === 'PERDEU' || item.observacao === 'FURTADO'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : item.observacao === 'ESQUECEU'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                      {item.observacao}
                    </span>
                    {item.justificativa && (
                      <p className="text-[9px] text-slate-400 mt-0.5 italic truncate" title={item.justificativa}>
                        {item.justificativa}
                      </p>
                    )}
                  </div>

                  {/* Vigilante */}
                  <div className="w-24 lg:w-28 shrink-0 truncate text-slate-300 text-[11px] font-medium" title={item.vigilante}>
                    <p className="truncate">{item.vigilante}</p>
                    {item.vigilanteDevolucao && item.vigilanteDevolucao !== item.vigilante && (
                      <p className="text-[9px] text-slate-500 truncate">
                        Baixa: {item.vigilanteDevolucao}
                      </p>
                    )}
                  </div>

                  {/* Status / Ação (Sempre visível à direita sem scroll horizontal) */}
                  <div className="w-24 shrink-0 flex items-center justify-end text-right">
                    {isPendente ? (
                      <button
                        type="button"
                        onClick={() => iniciarBaixa(item)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all shrink-0"
                        title="Registrar devolução e horário de baixa deste cartão"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Baixa</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Devolvido
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE NOVA SAÍDA */}
      <NovaSaidaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSalvar={handleSalvarNovaSaida}
        cartoesOcupados={cartoesOcupados}
        registrosExistentes={registros}
      />

      {/* MODAL DE REGISTRO DE BAIXA / DEVOLUÇÃO (COM TIMESTAMP EM TEMPO REAL) */}
      {registroParaBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Registrar Baixa de Devolução
                  </h3>
                  <p className="text-xs text-slate-400">
                    Captura automática do horário de devolução e liberação do cartão
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRegistroParaBaixa(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Cartão:</span>
                <span className="font-mono font-bold text-amber-300">{registroParaBaixa.cartao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Colaborador:</span>
                <span className="font-bold text-slate-200">{registroParaBaixa.colaborador}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Empresa:</span>
                <span className="text-slate-300">{registroParaBaixa.empresa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Retirado em:</span>
                <span className="text-slate-300 font-mono">
                  {formatarDataBr(registroParaBaixa.dataRetirada)} às {registroParaBaixa.horaRetirada}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Data de Devolução:
                </label>
                <input
                  type="date"
                  value={dataBaixa}
                  onChange={(e) => setDataBaixa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Hora de Devolução:
                </label>
                <input
                  type="time"
                  step="1"
                  value={horaBaixa}
                  onChange={(e) => setHoraBaixa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vigilante que recebeu a devolução:
              </label>
              <select
                value={vigilanteRecebedor}
                onChange={(e) => setVigilanteRecebedor(e.target.value)}
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
                onClick={() => setRegistroParaBaixa(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBaixaDevolucao}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Baixa & Horário</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DO COLABORADOR (AUDITORIA DA REGRA DOS 3 ACESSOS) */}
      {detalhesColaborador && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Auditoria da Regra dos 3 Acessos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Histórico de retiradas de credenciais provisórias no mês
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetalhesColaborador(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3.5 text-xs text-red-200">
              <p className="font-bold text-white text-sm mb-1">
                {detalhesColaborador.nome}
              </p>
              <p className="text-red-200/90 leading-relaxed">
                Este colaborador registrou <strong>{detalhesColaborador.totalAcessosMes} acessos provisórios</strong> no período.
                O limite operacional do CCO é de no máximo <strong>{LIMITE_ACESSOS_MES} vezes no mês</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                <span>Ocorrências registradas no mês:</span>
              </p>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {detalhesColaborador.historicoMes.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{item.cartao}</span>
                        <span className="text-slate-300">
                          {formatarDataBr(item.dataRetirada)} às {item.horaRetirada}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Motivo: <strong className="text-slate-200">{item.observacao}</strong> • Vigilante: {item.vigilante}
                      </p>
                      {item.justificativa && (
                        <p className="text-[10px] text-amber-300/80 italic mt-1 bg-amber-950/40 p-1 rounded border border-amber-900/40">
                          Justificativa: {item.justificativa}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.situacao === 'NÃO DEVOLVIDO'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                      {item.situacao}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetalhesColaborador(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
