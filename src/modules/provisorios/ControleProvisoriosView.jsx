import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Check,
  X,
  History,
  Timer,
  FileCheck,
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import CardSlotsVisualizer from './CardSlotsVisualizer';
import NovaSaidaModal from './NovaSaidaModal';
import {
  carregarRegistros,
  salvarRegistros,
  obterRegistrosLocais,
  registrarSaidaCredencial,
  registrarBaixaDevolucao,
  registrarPerdaProvisorio,
  marcarProvisorioComoPago,
  calcularMetricasProvisorios,
  verificarRegraTresAcessos,
  formatarDataBr,
  LIMITE_ACESSOS_MES
} from '../../services/provisoriosService';



import {
  carregarObservacoes,
  obterNomesObservacoesAtivas
} from '../../services/observacoesService';
import {
  carregarVigilantes,
  obterNomesVigilantesAtivos
} from '../../services/vigilantesService';

export default function ControleProvisoriosView() {
  const [registros, setRegistros] = useState(() => {
    const locais = obterRegistrosLocais();
    return Array.isArray(locais) ? locais : [];
  });
  const [busca, setBusca] = useState('');
  const [filtroPortaria, setFiltroPortaria] = useState('TODAS');
  const [filtroSituacao, setFiltroSituacao] = useState('TODAS');
  const [filtroObservacao, setFiltroObservacao] = useState('TODAS');

  // Ordenação dinâmica das colunas
  // Padrão inicial: 'retirada' decrescente (mais recentes primeiro)
  const [sortField, setSortField] = useState('retirada'); // 'cartao' | 'colaborador' | 'retirada' | 'devolucao' | 'motivo' | 'vigilante'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'retirada' || field === 'devolucao' ? 'desc' : 'asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return (
        <span className="inline-flex items-center text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity ml-1">
          <ArrowUpDown className="w-3 h-3" />
        </span>
      );
    }
    return sortOrder === 'desc' ? (
      <span className="inline-flex items-center text-amber-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowDown className="w-3 h-3" />
      </span>
    ) : (
      <span className="inline-flex items-center text-amber-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowUp className="w-3 h-3" />
      </span>
    );
  };

  // Observações Dinâmicas
  const [listaObservacoes, setListaObservacoes] = useState(() => {
    const obs = obterNomesObservacoesAtivas();
    return Array.isArray(obs) ? obs : [];
  });

  // Vigilantes de Posto (Campo) Dinâmicos
  const [listaVigilantes, setListaVigilantes] = useState(() => {
    const ativas = obterNomesVigilantesAtivos();
    return Array.isArray(ativas) && ativas.length > 0 ? ativas : ['Vigilante Portaria 1', 'Vigilante Portaria 2', 'Vigilante Ronda'];
  });

  // Modal de Nova Saída
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal de Confirmação de Baixa
  const [registroParaBaixa, setRegistroParaBaixa] = useState(null);
  const [dataBaixa, setDataBaixa] = useState('');
  const [horaBaixa, setHoraBaixa] = useState('');
  const [vigilanteRecebedor, setVigilanteRecebedor] = useState(() => {
    const ativas = obterNomesVigilantesAtivos();
    return (Array.isArray(ativas) && ativas[0]) || 'Vigilante Portaria 1';
  });

  // Modal de Detalhes de Reincidência (Histórico dos acessos do colaborador no mês)
  const [detalhesColaborador, setDetalhesColaborador] = useState(null);

  // Monitor do escaninho
  const [portariaEscaninho, setPortariaEscaninho] = useState('P1');

  // Feedback de ações
  const [toast, setToast] = useState(null);

  // Carrega os dados na inicialização de forma segura
  useEffect(() => {
    let montado = true;

    carregarRegistros().then(dados => {
      if (montado && Array.isArray(dados)) {
        setRegistros(dados);
      }
    }).catch(err => {
      console.warn('Erro ao carregar registros provisórios:', err);
    });

    const atualizarObs = async () => {
      try {
        const obsDados = await carregarObservacoes();
        const listaObs = Array.isArray(obsDados) ? obsDados : [];
        const ativas = listaObs.filter(o => o && o.status !== 'Inativo').map(o => o.nome);
        if (ativas.length > 0 && montado) {
          setListaObservacoes(ativas);
        }
      } catch (e) { }
    };

    const atualizarVigs = async () => {
      try {
        const vigDados = await carregarVigilantes();
        const listaVigs = Array.isArray(vigDados) ? vigDados : [];
        const ativas = listaVigs.filter(v => v && v.status !== 'Inativo').map(v => v.nome);
        if (ativas.length > 0 && montado) {
          setListaVigilantes(ativas);
        }
      } catch (e) { }
    };

    atualizarObs();
    atualizarVigs();

    const handleProvisoriosChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        if (montado) setRegistros(e.detail);
      } else {
        carregarRegistros().then(dados => {
          if (montado && Array.isArray(dados)) setRegistros(dados);
        });
      }
    };

    const handleObsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativas = e.detail.filter(o => o && o.status !== 'Inativo').map(o => o.nome);
        if (ativas.length > 0 && montado) {
          setListaObservacoes(ativas);
        }
      } else {
        atualizarObs();
      }
    };

    const handleVigsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativas = e.detail.filter(v => v && v.status !== 'Inativo').map(v => v.nome);
        if (ativas.length > 0 && montado) {
          setListaVigilantes(ativas);
        }
      } else {
        atualizarVigs();
      }
    };

    window.addEventListener('cco_provisorios_changed', handleProvisoriosChanged);
    window.addEventListener('cco_observacoes_changed', handleObsChanged);
    window.addEventListener('cco_vigilantes_changed', handleVigsChanged);
    return () => {
      montado = false;
      window.removeEventListener('cco_provisorios_changed', handleProvisoriosChanged);
      window.removeEventListener('cco_observacoes_changed', handleObsChanged);
      window.removeEventListener('cco_vigilantes_changed', handleVigsChanged);
    };
  }, []);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // BLINDAGEM DE ARRAY: Garante que os registros sejam sempre um Array válido
  const dadosSeguros = Array.isArray(registros) ? registros : [];

  // Mês atual em formato 'YYYY-MM'
  const mesAtual = new Date().toISOString().substring(0, 7);
  const hojeStr = new Date().toISOString().split('T')[0];

  // Métricas automáticas consolidadas (incluindo Perdidos vs. Ressarcidos)
  const metricas = useMemo(() => calcularMetricasProvisorios(dadosSeguros), [dadosSeguros]);

  // Cartões ocupados (status = NÃO DEVOLVIDO e não quitado)
  const cartoesOcupados = dadosSeguros
    .filter(r => r && (r.situacao === 'NÃO DEVOLVIDO' || r.situacao === 'NAO_DEVOLVIDO' || r.status === 'NAO_DEVOLVIDO') && !(r.situacao === 'PAGO' || r.status === 'PAGO'))
    .map(r => ({
      cartao: r.cartao,
      colaborador: r.colaborador,
      hora: r.horaRetirada
    }));

  // Filtragem e ordenação dinâmica da lista
  const registrosFiltrados = useMemo(() => {
    const filtrados = dadosSeguros.filter(r => {
      if (!r) return false;
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo ||
        (r.colaborador && r.colaborador.toLowerCase().includes(termo)) ||
        (r.empresa && r.empresa.toLowerCase().includes(termo)) ||
        (r.cartao && r.cartao.toLowerCase().includes(termo)) ||
        (r.matricula && r.matricula.toLowerCase().includes(termo));

      const matchPortaria = filtroPortaria === 'TODAS' || r.portaria === filtroPortaria;

      let matchSituacao = true;
      if (filtroSituacao === 'DEVOLVIDO') {
        matchSituacao = (r.situacao === 'DEVOLVIDO' || r.status === 'DEVOLVIDO') && !(r.situacao === 'PAGO' || r.status === 'PAGO');
      } else if (filtroSituacao === 'NÃO DEVOLVIDO') {
        matchSituacao = (r.situacao === 'NÃO DEVOLVIDO' || r.situacao === 'NAO_DEVOLVIDO' || r.status === 'NAO_DEVOLVIDO') && !(r.situacao === 'PERDIDO' || r.status === 'PERDIDO' || r.observacao === 'PERDEU');
      } else if (filtroSituacao === 'PERDIDO') {
        matchSituacao = r.situacao === 'PERDIDO' || r.status === 'PERDIDO' || (r.situacao === 'NÃO DEVOLVIDO' && r.observacao === 'PERDEU');
      } else if (filtroSituacao === 'PAGO') {
        matchSituacao = r.situacao === 'PAGO' || r.status === 'PAGO';
      }

      const matchObs = filtroObservacao === 'TODAS' || (r.observacao && r.observacao.toUpperCase() === filtroObservacao.toUpperCase());

      return matchBusca && matchPortaria && matchSituacao && matchObs;
    });

    return [...filtrados].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'cartao') {
        const numA = parseInt(String(a.cartao || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.cartao || '').replace(/\D/g, ''), 10) || 0;
        comparison = numA !== numB ? numA - numB : String(a.cartao || '').localeCompare(String(b.cartao || ''), 'pt-BR', { numeric: true });
      } else if (sortField === 'colaborador') {
        const cA = String(a.colaborador || '');
        const cB = String(b.colaborador || '');
        const c1 = cA.localeCompare(cB, 'pt-BR', { sensitivity: 'base' });
        if (c1 !== 0) {
          comparison = c1;
        } else {
          const empA = String(a.empresa || '');
          const empB = String(b.empresa || '');
          comparison = empA.localeCompare(empB, 'pt-BR', { sensitivity: 'base' });
        }
      } else if (sortField === 'retirada') {
        const dataA = a.dataRetirada || '1970-01-01';
        const horaA = a.horaRetirada ? (a.horaRetirada.length === 5 ? `${a.horaRetirada}:00` : a.horaRetirada) : '00:00:00';
        const dataB = b.dataRetirada || '1970-01-01';
        const horaB = b.horaRetirada ? (b.horaRetirada.length === 5 ? `${b.horaRetirada}:00` : b.horaRetirada) : '00:00:00';
        const timeA = new Date(`${dataA}T${horaA}`).getTime() || 0;
        const timeB = new Date(`${dataB}T${horaB}`).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'devolucao') {
        const dataA = a.dataDevolucao || '1970-01-01';
        const horaA = a.horaDevolucao ? (a.horaDevolucao.length === 5 ? `${a.horaDevolucao}:00` : a.horaDevolucao) : '00:00:00';
        const dataB = b.dataDevolucao || '1970-01-01';
        const horaB = b.horaDevolucao ? (b.horaDevolucao.length === 5 ? `${b.horaDevolucao}:00` : b.horaDevolucao) : '00:00:00';
        const timeA = new Date(`${dataA}T${horaA}`).getTime() || 0;
        const timeB = new Date(`${dataB}T${horaB}`).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'motivo') {
        const mA = String(a.observacao || a.motivo || '');
        const mB = String(b.observacao || b.motivo || '');
        comparison = mA.localeCompare(mB, 'pt-BR', { sensitivity: 'base' });
      } else if (sortField === 'vigilante') {
        const vA = String(a.vigilante || a.vigilanteRetirada || '');
        const vB = String(b.vigilante || b.vigilanteRetirada || '');
        comparison = vA.localeCompare(vB, 'pt-BR', { sensitivity: 'base' });
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [dadosSeguros, busca, filtroPortaria, filtroSituacao, filtroObservacao, sortField, sortOrder]);

  // Salvar novo registro com regra dos 3 acessos e timestamp
  const handleSalvarNovaSaida = (novoRegistro) => {
    const { novaLista, registroCompleto, verificacao } = registrarSaidaCredencial(dadosSeguros, novoRegistro);
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
    setVigilanteRecebedor(listaVigilantes[0] || 'Vigilante Portaria 1');
  };

  // Confirmar baixa / devolução do cartão
  const confirmarBaixaDevolucao = () => {
    if (!registroParaBaixa) return;

    const novaLista = registrarBaixaDevolucao(dadosSeguros, registroParaBaixa.id, {
      dataDevolucao: dataBaixa,
      horaDevolucao: horaBaixa,
      vigilanteDevolucao: vigilanteRecebedor
    });

    setRegistros(novaLista);
    showToast(`✓ Devolução do cartão ${registroParaBaixa.cartao} registrada às ${horaBaixa}! Slot liberado.`, 'success');
    setRegistroParaBaixa(null);
  };

  // Quitação instantânea do ressarcimento financeiro (Marcar como Pago)
  const handleMarcarComoPagoProvisorio = (item) => {
    if (!item) return;
    const confirmou = window.confirm(
      `Confirmar ressarcimento financeiro da credencial provisória ${item.cartao} (${item.colaborador})?\n\nValor: R$ 30,00\nO débito será quitado e o card de métricas será atualizado.`
    );
    if (!confirmou) return;

    const novaLista = marcarProvisorioComoPago(dadosSeguros, item.id, {
      valorPago: 30,
      dataPagamento: new Date().toISOString().split('T')[0]
    });
    setRegistros(novaLista);
    showToast(`✓ Ressarcimento da credencial ${item.cartao} (${item.colaborador}) confirmado com sucesso!`, 'success');
  };

  // Declarar perda / extravio do cartão provisório
  const handleRegistrarPerdaProvisorio = (item) => {
    if (!item) return;
    const confirmou = window.confirm(
      `Declarar perda/extravio do cartão provisório ${item.cartao} (${item.colaborador})?\n\nEsta ação gerará uma pendência de ressarcimento (R$ 30,00) no painel de Perdidos vs. Ressarcidos.`
    );
    if (!confirmou) return;

    const novaLista = registrarPerdaProvisorio(dadosSeguros, item.id, {
      motivo: 'Extravio de credencial provisória'
    });
    setRegistros(novaLista);
    setRegistroParaBaixa(null);
    showToast(`⚠️ Extravio registrado para o cartão ${item.cartao}. Cobrança de 2ª via ativada.`, 'warning');
  };

  // Abre modal de histórico para conferir as retiradas do colaborador
  const abrirHistoricoColaborador = (nomeColaborador) => {
    const resultado = verificarRegraTresAcessos(dadosSeguros, nomeColaborador, hojeStr);
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

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Pendentes / Não Devolvidos */}
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Pendentes de Devolução
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{metricas.totalPendentes}</span>
              <span className="text-[11px] text-red-300 font-medium">cartões retidos</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Sujeito a cobrança de 2ª via</p>
          </div>
          <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Devolvidos Hoje */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Devolvidos Hoje
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{metricas.totalDevolvidosHoje}</span>
              <span className="text-[11px] text-emerald-300 font-medium">baixas registradas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Cartões retornados ao escaninho</p>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Perdidos vs. Ressarcidos */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Perdidos vs. Ressarcidos
            </p>
            <div className="p-2 bg-amber-950/60 border border-amber-800/60 text-amber-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroSituacao(filtroSituacao === 'PERDIDO' ? 'TODAS' : 'PERDIDO')}
                className="group inline-flex items-baseline gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                title="Filtrar cartões provisórios Perdidos / A Cobrar"
              >
                <span className="text-2xl font-black text-red-400 group-hover:underline">{metricas.totalPerdidos}</span>
                <span className="text-[11px] text-red-300 font-semibold">a cobrar</span>
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setFiltroSituacao(filtroSituacao === 'PAGO' ? 'TODAS' : 'PAGO')}
                className="group inline-flex items-baseline gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                title="Filtrar cartões provisórios Pagos / Ressarcidos"
              >
                <span className="text-2xl font-black text-emerald-400 group-hover:underline">{metricas.totalPagos}</span>
                <span className="text-[11px] text-emerald-300 font-semibold">pagos</span>
              </button>
            </div>
            {/* Barra de Progresso de Ressarcimento */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-750">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metricas.taxaRessarcimento}%` }}
                title={`${metricas.taxaRessarcimento}% regularizados`}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span>{metricas.taxaRessarcimento}% regularizados</span>
              <span className="text-red-400 font-semibold">
                {metricas.pendenteCobranca} pendentes de cobrança
              </span>
            </p>
          </div>
        </div>

        {/* Card 4: Regra dos 3 Acessos / Reincidentes no Mês */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Alerta de Reincidência
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{metricas.totalReincidentesUnicos}</span>
              <span className="text-[11px] text-amber-300 font-medium">colaboradores (≥ 3x)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Limite mensal de 3 atingido</p>
          </div>
          <div className="p-3 bg-amber-950/60 border border-amber-800/60 text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 5: Total de Movimentações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Total Registrado
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{metricas.totalRegistros}</span>
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

      {/* BARRA DE PESQUISA E FILTROS DINÂMICOS (POSICIONADA IMEDIATAMENTE ACIMA DOS REGISTROS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca por Texto (Colaborador, Empresa, Cartão ou Matrícula) */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por colaborador, empresa, cartão ou matrícula..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70 transition-colors"
          />
        </div>

        {/* Filtros em Linha & Ação Principal */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Filtro de Status (Todos, Devolvidos, Não Devolvidos, Perdidos / A Cobrar, Pagos) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="bg-transparent border-0 py-1 text-xs text-slate-200 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="TODAS" className="bg-slate-950 text-slate-200">Todos os Status</option>
              <option value="NÃO DEVOLVIDO" className="bg-slate-950 text-red-400">Não Devolvidos (Pendentes)</option>
              <option value="DEVOLVIDO" className="bg-slate-950 text-emerald-400">Devolvidos</option>
              <option value="PERDIDO" className="bg-slate-950 text-amber-400">Perdidos / A Cobrar</option>
              <option value="PAGO" className="bg-slate-950 text-emerald-400">Pagos / Ressarcidos</option>
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
          <div
            onClick={() => handleSort('cartao')}
            className="w-14 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Cartão"
          >
            <span>Cartão</span>
            {renderSortIndicator('cartao')}
          </div>

          <div
            onClick={() => handleSort('colaborador')}
            className="flex-1 min-w-0 pr-2 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Colaborador & Empresa"
          >
            <span>Colaborador & Empresa</span>
            {renderSortIndicator('colaborador')}
          </div>

          <div
            onClick={() => handleSort('retirada')}
            className="w-28 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Data/Hora de Retirada"
          >
            <span>Retirada</span>
            {renderSortIndicator('retirada')}
          </div>

          <div
            onClick={() => handleSort('devolucao')}
            className="w-32 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Data/Hora de Devolução"
          >
            <span>Devolução</span>
            {renderSortIndicator('devolucao')}
          </div>

          <div
            onClick={() => handleSort('motivo')}
            className="w-24 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Motivo"
          >
            <span>Motivo</span>
            {renderSortIndicator('motivo')}
          </div>

          <div
            onClick={() => handleSort('vigilante')}
            className="w-24 lg:w-28 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Vigilante"
          >
            <span>Vigilante</span>
            {renderSortIndicator('vigilante')}
          </div>

          <div className="w-28 shrink-0 text-right">Ação</div>
        </div>

        {/* CORPO DA LISTA (LINHAS FLEX w-full) */}
        <div className="divide-y divide-slate-800/70 bg-slate-900/40 w-full">
          {registrosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          ) : (
            registrosFiltrados.map((item) => {
              const isPerdido = item.situacao === 'PERDIDO' || item.status === 'PERDIDO' || (item.situacao === 'NÃO DEVOLVIDO' && item.observacao === 'PERDEU');
              const isPago = item.situacao === 'PAGO' || item.status === 'PAGO';
              const isDevolvido = (item.situacao === 'DEVOLVIDO' || item.status === 'DEVOLVIDO') && !isPago && !isPerdido;
              const isPendente = !isDevolvido && !isPago && !isPerdido;

              // Verifica quantos acessos o colaborador fez no mês da retirada
              const checkRegra = verificarRegraTresAcessos(dadosSeguros, item.colaborador, item.dataRetirada);
              const isReincidente = checkRegra.totalAcessosMes >= LIMITE_ACESSOS_MES;

              return (
                <div
                  key={item.id}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-xs transition-colors ${
                    isPerdido
                      ? 'bg-red-950/20 hover:bg-red-950/30 border-l-2 border-l-red-500'
                      : isPago
                        ? 'bg-emerald-950/10 hover:bg-emerald-950/20'
                        : isPendente
                          ? 'bg-red-950/15 hover:bg-red-950/25'
                          : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Cartão */}
                  <div className="w-14 shrink-0">
                    <span className={`font-mono text-xs font-extrabold px-2 py-1 rounded-md border inline-block text-center ${
                      isPerdido
                        ? 'bg-red-900/60 text-red-200 border-red-600'
                        : isPago
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                          : isPendente
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
                    {isPerdido ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800/60 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        Extraviado / Perda
                      </span>
                    ) : isPago ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ressarcido
                        </span>
                        {item.dataPagamento && (
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{formatarDataBr(item.dataPagamento)}</p>
                        )}
                      </div>
                    ) : item.dataDevolucao ? (
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
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      isPerdido || item.observacao === 'PERDEU' || item.observacao === 'FURTADO'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : item.observacao === 'ESQUECEU'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {item.observacao || 'N/A'}
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
                  <div className="w-28 shrink-0 flex items-center justify-end text-right">
                    {isPerdido ? (
                      <button
                        type="button"
                        onClick={() => handleMarcarComoPagoProvisorio(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-[11px] font-bold shadow-sm shadow-emerald-950/40 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Confirmar quitação/ressarcimento financeiro de 2ª via (Marcar como Pago)"
                      >
                        <Check className="w-3 h-3 text-emerald-200" />
                        <span>À Pagar</span>
                      </button>
                    ) : isPago ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Quitado
                      </span>
                    ) : isPendente ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => iniciarBaixa(item)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                          title="Registrar devolução e horário de baixa deste cartão"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Baixa</span>
                        </button>
                      </div>
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
        registrosExistentes={dadosSeguros}
      />

      {/* MODAL DE REGISTRO DE BAIXA / DEVOLUÇÃO (COM TIMESTAMP EM TEMPO REAL) */}
      {registroParaBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
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
                {listaVigilantes.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => handleRegistrarPerdaProvisorio(registroParaBaixa)}
                className="h-[38px] px-3.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Declarar perda/extravio do cartão e acionar cobrança de 2ª via"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Extravio / Perda</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRegistroParaBaixa(null)}
                  className="h-[38px] px-3.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarBaixaDevolucao}
                  className="h-[38px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-950/50 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Confirmar Baixa & Horário</span>
                </button>
              </div>
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
