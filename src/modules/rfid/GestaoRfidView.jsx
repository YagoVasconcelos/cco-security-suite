import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Plus, 
  Filter, 
  RotateCcw, 
  CreditCard, 
  KeyRound, 
  Hash, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  RefreshCw, 
  Layers, 
  Building, 
  Calendar, 
  ArrowUpRight, 
  X, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  FileSpreadsheet,
  Edit,
  Sparkles,
  PieChart,
  BarChart3,
  BadgeAlert
} from 'lucide-react';
import NovoCartaoRfidModal from './NovoCartaoRfidModal';
import {
  carregarInventarioRfid,
  salvarInventarioRfid,
  calcularMetricasRfid,
  adicionarCartaoRfid,
  transicionarStatusCartao,
  CAPACIDADE_ROTATIVOS
} from '../../services/rfidService';

export default function GestaoRfidView() {
  const [inventario, setInventario] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS', 'FIXO', 'ROTATIVO'
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS');

  // Modal Novo Cartão
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Alterar Status do Cartão
  const [cartaoParaStatus, setCartaoParaStatus] = useState(null);
  const [novoStatus, setNovoStatus] = useState('ATIVO');
  const [motivoMudanca, setMotivoMudanca] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  // Carrega os dados na inicialização
  useEffect(() => {
    const dados = carregarInventarioRfid();
    setInventario(dados);
  }, []);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Cálculo AUTOMÁTICO das métricas dos Dashboards baseado nos dados salvos localmente
  const metricas = calcularMetricasRfid(inventario);

  // Filtragem da lista
  const inventarioFiltrado = inventario.filter(item => {
    const termo = busca.toLowerCase();
    const matchBusca = 
      item.codigoRfid.toLowerCase().includes(termo) ||
      item.codigoImpresso.toLowerCase().includes(termo) ||
      item.colaborador.toLowerCase().includes(termo) ||
      item.empresa.toLowerCase().includes(termo) ||
      (item.numeroRotativo && item.numeroRotativo.toLowerCase().includes(termo));

    const matchTipo = filtroTipo === 'TODOS' || item.tipo === filtroTipo;
    const matchStatus = filtroStatus === 'TODOS' || item.status === filtroStatus;
    const matchEmpresa = filtroEmpresa === 'TODAS' || item.empresa === filtroEmpresa;

    return matchBusca && matchTipo && matchStatus && matchEmpresa;
  });

  // Salvar novo cartão com validações da regra de negócio
  const handleSalvarNovoCartao = (novo) => {
    try {
      const { novaLista, registroCompleto } = adicionarCartaoRfid(inventario, novo);
      setInventario(novaLista);
      showToast(
        `✓ Credencial RFID ${registroCompleto.codigoRfid} (${registroCompleto.tipo}) adicionada ao inventário com sucesso!`,
        'success'
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // Transicionar status do ciclo de vida com reidratação automática se rotativo
  const handleAtualizarStatus = () => {
    if (!cartaoParaStatus) return;

    const novaLista = transicionarStatusCartao(
      inventario,
      cartaoParaStatus.id,
      novoStatus,
      motivoMudanca
    );

    setInventario(novaLista);
    showToast(
      `✓ Status do cartão RFID ${cartaoParaStatus.codigoRfid} atualizado para "${novoStatus}"!`,
      'success'
    );
    setCartaoParaStatus(null);
  };

  // Abrir modal de alteração de status
  const abrirAlterarStatus = (cartao) => {
    setCartaoParaStatus(cartao);
    setNovoStatus(cartao.status);
    setMotivoMudanca('');
  };

  // Lista única de empresas para o filtro
  const empresasUnicas = Array.from(new Set(inventario.map(i => i.empresa))).sort();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-xl border border-indigo-500/50 bg-indigo-950/90 text-indigo-200 text-xs font-semibold shadow-2xl animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
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
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Módulo 4
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Fixos & Rotativos (0 a 350)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Métricas em Tempo Real
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Gestão Geral de Credenciais (Fixas e Rotativas / RFID)
            </h3>
            <p className="text-xs text-slate-400">
              Inventário centralizado com separação de rotativos de serviços (0-350) e cartões fixos com cálculo automático de indicadores.
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Nova Credencial RFID</span>
          </button>
        </div>
      </div>

      {/* DASHBOARDS DE MÉTRICAS GERAIS (CÁLCULO AUTOMÁTICO EM TEMPO REAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Confeccionados e Liberados no Mês */}
        <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Liberados no Mês
            </p>
            <div className="p-2 bg-blue-950/60 border border-blue-800/60 text-blue-400 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{metricas.liberadosMes}</span>
              <span className="text-[11px] text-blue-300 font-medium">credenciais ativadas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Competência {metricas.mesReferencia.split('-').reverse().join('/')}
            </p>
          </div>
        </div>

        {/* Card 2: Cartões Perdidos vs Pagos / Ressarcidos */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Perdidos vs. Pagos
            </p>
            <div className="p-2 bg-amber-950/60 border border-amber-800/60 text-amber-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-400">{metricas.totalPerdidos}</span>
              <span className="text-[11px] text-red-300 font-semibold">a cobrar</span>
              <span className="text-slate-600">•</span>
              <span className="text-2xl font-black text-emerald-400">{metricas.totalPagos}</span>
              <span className="text-[11px] text-emerald-300 font-semibold">pagos</span>
            </div>
            {/* Barra de Progresso de Ressarcimento */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-750">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metricas.taxaRessarcimento}%` }}
                title={`${metricas.taxaRessarcimento}% ressarcidos`}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{metricas.taxaRessarcimento}% taxa de ressarcimento</span>
              <span className="text-red-400 font-bold">{metricas.pendenteCobranca} pendentes</span>
            </p>
          </div>
        </div>

        {/* Card 3: Rotativos Devolvidos & Reidratados / Disponíveis (0 a 350) */}
        <div className="bg-slate-900 border border-indigo-900/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Rotativos / Reidratados
            </p>
            <div className="p-2 bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300">{metricas.rotativosDisponiveis}</span>
              <span className="text-[11px] text-indigo-200 font-medium">reidratados no estoque</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>{metricas.rotativosAtivos} em circulação</span>
              <span className="text-slate-500">Capacidade 0 a {metricas.capacidadeRotativos}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Inventário Total Geral */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Inventário Total
            </p>
            <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{metricas.totalGeral}</span>
              <span className="text-[11px] text-slate-400 font-medium">credenciais cadastradas</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-blue-400">{metricas.totalFixos} Fixos</span>
              <span>•</span>
              <span className="text-indigo-400">{metricas.totalRotativosCadastrados} Rotativos</span>
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por Código RFID, Código Verso (5 dígitos), Colaborador ou Empresa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Abas Rápidas de Tipo (Fixos vs Rotativos) */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                filtroTipo === 'TODOS'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({metricas.totalGeral})
            </button>
            <button
              onClick={() => setFiltroTipo('ROTATIVO')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                filtroTipo === 'ROTATIVO'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-indigo-300'
              }`}
            >
              <Layers className="w-3 h-3" />
              Rotativos 0-350 ({metricas.totalRotativosCadastrados})
            </button>
            <button
              onClick={() => setFiltroTipo('FIXO')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                filtroTipo === 'FIXO'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-blue-300'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              Fixos Nominais ({metricas.totalFixos})
            </button>
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ATIVO">🟢 Ativo / Em Uso</option>
              <option value="DISPONIVEL">🔵 Disponível no Estoque</option>
              <option value="PERDIDO">🔴 Perdido / Extraviado</option>
              <option value="PAGO">🟡 Pago / Ressarcido</option>
              <option value="BLOQUEADO">⚪ Bloqueado</option>
            </select>

            {/* Filtro Empresa */}
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[160px] truncate"
            >
              <option value="TODAS">Todas Empresas</option>
              {empresasUnicas.map((emp, i) => (
                <option key={i} value={emp}>{emp}</option>
              ))}
            </select>

            {/* Limpar Filtros */}
            {(busca || filtroTipo !== 'TODOS' || filtroStatus !== 'TODOS' || filtroEmpresa !== 'TODAS') && (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setFiltroTipo('TODOS');
                  setFiltroStatus('TODOS');
                  setFiltroEmpresa('TODAS');
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

      {/* TABELA DE INVENTÁRIO RFID COM SEPARAÇÃO EXPLÍCITA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Inventário de Credenciais ({inventarioFiltrado.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              Separação oficial entre rotativos (0 a 350) e cartões fixos permanentes
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Clique em <span className="text-indigo-400 font-semibold">Alterar Status</span> para registrar perdas, ressarcimentos ou reidratação
          </span>
        </div>

        {/* CABEÇALHO DA LISTA (FLEX w-full) */}
        <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div className="w-28 shrink-0">RFID (Chave)</div>
          <div className="w-16 shrink-0">Verso</div>
          <div className="w-44 lg:w-48 shrink-0 max-w-xs pr-3">Tipo</div>
          <div className="flex-1 min-w-0 pr-2">Colaborador & Empresa</div>
          <div className="w-20 shrink-0">Liberação</div>
          <div className="w-28 shrink-0">Status Ciclo de Vida</div>
          <div className="w-16 shrink-0 text-right">Ação</div>
        </div>

        {/* CORPO DA LISTA (LINHAS FLEX w-full) */}
        <div className="divide-y divide-slate-800/70 bg-slate-900/40 w-full">
          {inventarioFiltrado.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhuma credencial encontrada para os filtros selecionados.
            </div>
          ) : (
            inventarioFiltrado.map((item) => {
              const isRotativo = item.tipo === 'ROTATIVO';

              return (
                <div 
                  key={item.id}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs hover:bg-slate-800/40 transition-colors"
                >
                  {/* Código RFID (Chave Primária) */}
                  <div className="w-28 shrink-0">
                    <div className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="font-mono text-[11px] font-black text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50 truncate">
                        {item.codigoRfid}
                      </span>
                    </div>
                  </div>

                  {/* Código Impresso no Verso (5 dígitos) */}
                  <div className="w-16 shrink-0">
                    <span className="font-mono text-[11px] font-bold text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 inline-block text-center">
                      {item.codigoImpresso}
                    </span>
                  </div>

                  {/* Classificação / Formato */}
                  <div className="w-44 lg:w-48 shrink-0 max-w-xs pr-3 overflow-hidden">
                    {isRotativo ? (
                      <span 
                        className="inline-flex max-w-full items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 overflow-hidden whitespace-nowrap"
                        title={`Rot. ${item.numeroRotativo || '0-350'}`}
                      >
                        <Layers className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span className="truncate whitespace-nowrap">Rot. {item.numeroRotativo || '0-350'}</span>
                      </span>
                    ) : (
                      <span 
                        className="inline-flex max-w-full items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 overflow-hidden whitespace-nowrap"
                        title="Fixo Nominal"
                      >
                        <CreditCard className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                        <span className="truncate whitespace-nowrap">Fixo Nominal</span>
                      </span>
                    )}
                  </div>

                  {/* Colaborador & Empresa */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`font-bold text-xs truncate ${item.status === 'DISPONIVEL' ? 'text-indigo-400 italic' : 'text-slate-100'}`}>
                      {item.colaborador}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                      <Building className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item.empresa}</span>
                      {item.observacoes && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-slate-500 italic truncate" title={item.observacoes}>
                            {item.observacoes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Data de Liberação */}
                  <div className="w-20 shrink-0 text-slate-300 text-[11px] font-mono">
                    {item.dataLiberacao.split('-').reverse().join('/')}
                  </div>

                  {/* Status / Ciclo de Vida */}
                  <div className="w-28 shrink-0">
                    {item.status === 'ATIVO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        <span>Ativo</span>
                      </span>
                    )}
                    {item.status === 'DISPONIVEL' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-700/60">
                        <RefreshCw className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span>Estoque</span>
                      </span>
                    )}
                    {item.status === 'PERDIDO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-700/60 animate-pulse">
                        <AlertCircle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                        <span>Perdido</span>
                      </span>
                    )}
                    {item.status === 'PAGO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        <DollarSign className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        <span>Pago</span>
                      </span>
                    )}
                    {item.status === 'BLOQUEADO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        <span>Bloqueado</span>
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="w-16 shrink-0 flex items-center justify-end text-right">
                    <button
                      type="button"
                      onClick={() => abrirAlterarStatus(item)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0"
                      title="Alterar status do ciclo de vida da credencial"
                    >
                      <Edit className="w-3 h-3 text-indigo-400" />
                      <span>Status</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO DE NOVO CARTÃO RFID */}
      <NovoCartaoRfidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSalvar={handleSalvarNovoCartao}
        rfidExistentes={inventario}
      />

      {/* MODAL DE TRANSIÇÃO DE STATUS DO CICLO DE VIDA */}
      {cartaoParaStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Alterar Ciclo de Vida da Credencial
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atualização de extravio, ressarcimento ou reidratação no estoque
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCartaoParaStatus(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Código RFID:</span>
                <span className="font-bold text-indigo-300">{cartaoParaStatus.codigoRfid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Código Verso:</span>
                <span className="text-slate-200">{cartaoParaStatus.codigoImpresso}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Tipo:</span>
                <span className="font-bold text-slate-300">{cartaoParaStatus.tipo} {cartaoParaStatus.numeroRotativo ? `(${cartaoParaStatus.numeroRotativo})` : ''}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Colaborador:</span>
                <span className="font-bold text-slate-200">{cartaoParaStatus.colaborador}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selecione o Novo Status:
              </label>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="ATIVO">🟢 Ativo / Em Uso</option>
                <option value="DISPONIVEL">🔵 Disponível no Estoque (Reidratado para reuso)</option>
                <option value="PERDIDO">🔴 Perdido / Extraviado (Cobrança de 2ª via)</option>
                <option value="PAGO">🟡 Pago / Ressarcido</option>
                <option value="BLOQUEADO">⚪ Bloqueado / Defeito</option>
              </select>
              {cartaoParaStatus.tipo === 'ROTATIVO' && novoStatus === 'DISPONIVEL' && (
                <p className="text-[11px] text-indigo-300 mt-1.5 bg-indigo-950/40 p-2 rounded border border-indigo-900/50">
                  ℹ️ Ao selecionar <strong>Disponível no Estoque</strong>, este cartão rotativo será reidratado e ficará pronto para uma nova entrega.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Motivo / Justificativa da Alteração:
              </label>
              <input
                type="text"
                placeholder="Ex: Pagamento efetuado via RH / Devolvido pelo terceiro..."
                value={motivoMudanca}
                onChange={(e) => setMotivoMudanca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCartaoParaStatus(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAtualizarStatus}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Alteração</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
