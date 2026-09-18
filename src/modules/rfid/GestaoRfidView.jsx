import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Edit,
  Edit3,
  Trash2,
  Shield,
  FileText,
  Sparkles,
  PieChart,
  BarChart3,
  BadgeAlert,
  UserPlus,
  Unlink,
  Link2
} from 'lucide-react';
import NovoCartaoRfidModal from './NovoCartaoRfidModal';
import RelatorioCobrancaModal from './RelatorioCobrancaModal';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import {
  carregarInventarioRfid,
  obterInventarioRfidLocal,
  salvarInventarioRfid,
  calcularMetricasRfid,
  adicionarCartaoRfid,
  editarCartaoRfid,
  excluirCartaoRfid,
  transicionarStatusCartao,
  vincularCartaoRfid,
  desvincularCartaoRfid,
  formatarNomeRotativo,
  CAPACIDADE_ROTATIVOS
} from '../../services/rfidService';
import { salvarPessoaUnificada } from '../../services/baseUnificadaService';

export default function GestaoRfidView() {
  const [inventario, setInventario] = useState(() => {
    const locais = obterInventarioRfidLocal();
    return Array.isArray(locais) ? locais : [];
  });
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS', 'FIXO', 'ROTATIVO'
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS');

  // Ordenação dinâmica das colunas
  // Padrão: 'classificacao' crescente (Serviços 01-350 na sequência e depois Fixos)
  const [sortField, setSortField] = useState('classificacao'); // 'codigoRfid' | 'codigoImpresso' | 'classificacao' | 'colaborador' | 'dataLiberacao' | 'status'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'dataLiberacao' ? 'desc' : 'asc');
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
      <span className="inline-flex items-center text-indigo-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowDown className="w-3 h-3" />
      </span>
    ) : (
      <span className="inline-flex items-center text-indigo-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowUp className="w-3 h-3" />
      </span>
    );
  };

  // Modal Novo Cartão
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Relatório de Cobrança / Faturamento de 2ª via
  const [modalCobrancaOpen, setModalCobrancaOpen] = useState(false);

  // Modal Alterar Status do Cartão / Baixa / Isenção por B.O.
  const [cartaoParaStatus, setCartaoParaStatus] = useState(null);
  const [novoStatus, setNovoStatus] = useState('ATIVO');
  const [motivoMudanca, setMotivoMudanca] = useState('');
  const [numeroBO, setNumeroBO] = useState('');
  const [dataBO, setDataBO] = useState(new Date().toISOString().split('T')[0]);

  // Modal Editar Cartão (CRUD Completo)
  const [cartaoParaEditar, setCartaoParaEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
    id: null,
    codigoRfid: '',
    codigoImpresso: '',
    tipo: 'FIXO',
    numeroRotativoIdx: '',
    numeroRotativo: '',
    colaborador: '',
    empresa: '',
    dataLiberacao: '',
    status: 'ATIVO',
    observacoes: ''
  });

  // Modal Confirmar Exclusão (CRUD Completo)
  const [cartaoParaExcluir, setCartaoParaExcluir] = useState(null);

  // Modal Vincular Cartão Rotativo / Fixo
  const [cartaoParaVincular, setCartaoParaVincular] = useState(null);
  const [formVincular, setFormVincular] = useState({
    colaborador: '',
    empresa: '',
    matricula: '',
    portaria: 'CCO',
    dataLiberacao: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Modal Confirmar Desvinculação (Retorno ao Estoque)
  const [cartaoParaDesvincular, setCartaoParaDesvincular] = useState(null);
  const [motivoDesvinculo, setMotivoDesvinculo] = useState('Devolvido na portaria (retorna ao estoque limpo)');

  // Toast
  const [toast, setToast] = useState(null);

  // Carrega os dados na inicialização e sincroniza
  useEffect(() => {
    let montado = true;
    carregarInventarioRfid().then(dados => {
      if (montado && Array.isArray(dados)) {
        setInventario(dados);
      }
    }).catch(err => {
      console.warn('Erro ao carregar inventário RFID:', err);
    });

    const handleRfidChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        if (montado) setInventario(e.detail);
      }
    };

    window.addEventListener('cco_rfid_changed', handleRfidChanged);
    return () => {
      montado = false;
      window.removeEventListener('cco_rfid_changed', handleRfidChanged);
    };
  }, []);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // BLINDAGEM DE ARRAY: Garante que inventario seja sempre um Array válido
  const inventarioSeguro = Array.isArray(inventario) ? inventario : [];

  // Obter lista única de empresas presentes no inventário para filtro
  const empresasUnicas = useMemo(() => {
    const setEmp = new Set();
    inventarioSeguro.forEach(c => {
      if (c && c.empresa && typeof c.empresa === 'string' && c.empresa.trim()) {
        setEmp.add(c.empresa.trim().toUpperCase());
      }
    });
    return Array.from(setEmp).sort();
  }, [inventarioSeguro]);

  // Transição rápida de item PERDIDO para PAGO (Ressarcimento de 2ª via)
  const handleMarcarComoPago = (cartao) => {
    if (!cartao || !cartao.id) return;
    try {
      const novaLista = transicionarStatusCartao(
        inventarioSeguro,
        cartao.id,
        'PAGO',
        'Ressarcimento financeiro de 2ª via registrado e confirmado'
      );
      setInventario(novaLista);
      showToast(`Credencial ${cartao.codigoRfid || cartao.numeroRotativo || ''} marcada como PAGO / Ressarcida com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      showToast('Erro ao atualizar status para Pago: ' + err.message, 'error');
    }
  };

  // Cálculo AUTOMÁTICO das métricas dos Dashboards baseado nos dados salvos localmente
  const metricas = calcularMetricasRfid(inventarioSeguro);

  // Filtragem e ordenação dinâmica da lista
  const inventarioFiltrado = useMemo(() => {
    const filtrados = inventarioSeguro.filter(item => {
      if (!item) return false;
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo ||
        (item.codigoRfid && item.codigoRfid.toLowerCase().includes(termo)) ||
        (item.codigoImpresso && item.codigoImpresso.toLowerCase().includes(termo)) ||
        (item.colaborador && item.colaborador.toLowerCase().includes(termo)) ||
        (item.empresa && item.empresa.toLowerCase().includes(termo)) ||
        (item.numeroRotativo && item.numeroRotativo.toLowerCase().includes(termo)) ||
        (item.numeroBO && item.numeroBO.toLowerCase().includes(termo));

      const matchTipo = filtroTipo === 'TODOS' || item.tipo === filtroTipo;
      const matchStatus = filtroStatus === 'TODOS' || item.status === filtroStatus;
      const matchEmpresa = filtroEmpresa === 'TODAS' || item.empresa === filtroEmpresa;

      return matchBusca && matchTipo && matchStatus && matchEmpresa;
    });

    return [...filtrados].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'codigoRfid') {
        const rfidA = String(a.codigoRfid || '');
        const rfidB = String(b.codigoRfid || '');
        comparison = rfidA.localeCompare(rfidB, 'pt-BR', { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'codigoImpresso') {
        const vA = String(a.codigoImpresso || '');
        const vB = String(b.codigoImpresso || '');
        comparison = vA.localeCompare(vB, 'pt-BR', { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'classificacao') {
        const isRotA = a.tipo === 'ROTATIVO';
        const isRotB = b.tipo === 'ROTATIVO';
        if (isRotA && isRotB) {
          const idxA = a.numeroRotativoIdx !== null && a.numeroRotativoIdx !== undefined ? Number(a.numeroRotativoIdx) : 999999;
          const idxB = b.numeroRotativoIdx !== null && b.numeroRotativoIdx !== undefined ? Number(b.numeroRotativoIdx) : 999999;
          comparison = idxA - idxB;
        } else if (isRotA && !isRotB) {
          comparison = -1;
        } else if (!isRotA && isRotB) {
          comparison = 1;
        } else {
          const colabA = String(a.colaborador || '');
          const colabB = String(b.colaborador || '');
          comparison = colabA.localeCompare(colabB, 'pt-BR', { sensitivity: 'base' });
        }
      } else if (sortField === 'colaborador') {
        const colabA = String(a.colaborador || '');
        const colabB = String(b.colaborador || '');
        const c1 = colabA.localeCompare(colabB, 'pt-BR', { sensitivity: 'base' });
        if (c1 !== 0) {
          comparison = c1;
        } else {
          const empA = String(a.empresa || '');
          const empB = String(b.empresa || '');
          comparison = empA.localeCompare(empB, 'pt-BR', { sensitivity: 'base' });
        }
      } else if (sortField === 'dataLiberacao') {
        const timeA = a.dataLiberacao ? new Date(a.dataLiberacao).getTime() : 0;
        const timeB = b.dataLiberacao ? new Date(b.dataLiberacao).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortField === 'status') {
        const stA = String(a.status || '');
        const stB = String(b.status || '');
        comparison = stA.localeCompare(stB, 'pt-BR', { sensitivity: 'base' });
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [inventarioSeguro, busca, filtroTipo, filtroStatus, filtroEmpresa, sortField, sortOrder]);

  // Salvar novo cartão via modal
  const handleSalvarNovoCartao = (novoCartao) => {
    try {
      const { novaLista } = adicionarCartaoRfid(inventarioSeguro, novoCartao);
      setInventario(novaLista);
      showToast(`✓ Cartão RFID ${novoCartao.codigoRfid} adicionado com sucesso ao inventário!`, 'success');
    } catch (err) {
      alert(err.message);
    }
  };

  // Abrir modal de alteração de status / baixa
  const abrirAlterarStatus = (cartao) => {
    setCartaoParaStatus(cartao);
    setNovoStatus(cartao.status);
    setMotivoMudanca('');
    setNumeroBO(cartao.numeroBO || '');
    setDataBO(cartao.dataBO || new Date().toISOString().split('T')[0]);
  };

  // Confirmar alteração de status
  const handleAtualizarStatus = () => {
    if (!cartaoParaStatus) return;

    if (novoStatus === 'ISENTO_BO' && !numeroBO.trim()) {
      alert('Por favor, informe o número do Boletim de Ocorrência (B.O.) apresentado e arquivado.');
      return;
    }

    const novaLista = transicionarStatusCartao(
      inventarioSeguro,
      cartaoParaStatus.id,
      novoStatus,
      motivoMudanca,
      { numeroBO: numeroBO.trim().toUpperCase(), dataBO }
    );

    setInventario(novaLista);
    showToast(
      novoStatus === 'ISENTO_BO'
        ? `✓ Cartão ${cartaoParaStatus.codigoRfid} registrado como ISENTO POR B.O. (Encerramento de Cobrança e Responsabilidade)!`
        : `✓ Status do cartão RFID ${cartaoParaStatus.codigoRfid} atualizado para "${novoStatus}"!`,
      'success'
    );
    setCartaoParaStatus(null);
  };

  // Abrir modal de edição completa (CRUD)
  const abrirEditarCartao = (cartao) => {
    setCartaoParaEditar(cartao);
    setFormEditar({
      id: cartao.id,
      codigoRfid: cartao.codigoRfid || '',
      codigoImpresso: cartao.codigoImpresso || '',
      tipo: cartao.tipo || 'FIXO',
      numeroRotativoIdx: cartao.numeroRotativoIdx !== null && cartao.numeroRotativoIdx !== undefined ? cartao.numeroRotativoIdx : '',
      numeroRotativo: cartao.numeroRotativo || '',
      colaborador: cartao.colaborador || '',
      empresa: cartao.empresa || '',
      dataLiberacao: cartao.dataLiberacao || '',
      status: cartao.status || 'ATIVO',
      observacoes: cartao.observacoes || ''
    });
  };

  // Salvar edição completa do cartão
  const handleSalvarEdicao = (e) => {
    e.preventDefault();
    if (!cartaoParaEditar) return;

    try {
      const novaLista = editarCartaoRfid(inventarioSeguro, {
        ...cartaoParaEditar,
        codigoRfid: formEditar.codigoRfid.trim().toUpperCase(),
        codigoImpresso: formEditar.codigoImpresso.trim(),
        tipo: formEditar.tipo,
        numeroRotativoIdx: formEditar.tipo === 'ROTATIVO' ? (formEditar.numeroRotativoIdx !== '' ? parseInt(formEditar.numeroRotativoIdx, 10) : null) : null,
        numeroRotativo: formEditar.tipo === 'ROTATIVO' ? (formEditar.numeroRotativoIdx !== '' ? formatarNomeRotativo(formEditar.numeroRotativoIdx) : 'Serviços') : null,
        colaborador: formEditar.colaborador.trim().toUpperCase() || (formEditar.tipo === 'ROTATIVO' ? 'DISPONÍVEL NO ESTOQUE' : 'ESTOQUE / A VINCULAR'),
        empresa: formEditar.empresa.trim().toUpperCase() || 'ESTOQUE CCO',
        dataLiberacao: formEditar.dataLiberacao || new Date().toISOString().split('T')[0],
        status: formEditar.status,
        observacoes: formEditar.observacoes.trim()
      });

      if (formEditar.colaborador && formEditar.colaborador.trim()) {
        salvarPessoaUnificada({
          nome: formEditar.colaborador.trim(),
          empresa: formEditar.empresa.trim()
        });
      }

      setInventario(novaLista);
      showToast(`✓ Cartão ${formEditar.codigoRfid} atualizado com sucesso!`, 'success');
      setCartaoParaEditar(null);
    } catch (err) {
      alert('Erro ao salvar edição: ' + err.message);
    }
  };

  // Confirmar exclusão do cartão
  const handleConfirmarExclusao = () => {
    if (!cartaoParaExcluir) return;

    const novaLista = excluirCartaoRfid(inventarioSeguro, cartaoParaExcluir.id);
    setInventario(novaLista);
    showToast(`✓ Cartão ${cartaoParaExcluir.codigoRfid} removido do inventário com sucesso!`, 'info');
    setCartaoParaExcluir(null);
  };

  // Abrir modal de vínculo de cartão
  const abrirVincularCartao = (cartao) => {
    setCartaoParaVincular(cartao);
    setFormVincular({
      colaborador: '',
      empresa: '',
      matricula: '',
      portaria: 'CCO',
      dataLiberacao: new Date().toISOString().split('T')[0],
      observacoes: ''
    });
  };

  // Salvar vínculo de credencial
  const handleConfirmarVinculo = (e) => {
    e.preventDefault();
    if (!cartaoParaVincular) return;
    if (!formVincular.colaborador.trim()) {
      alert('Por favor, informe o nome do colaborador para vincular a credencial.');
      return;
    }

    try {
      const novaLista = vincularCartaoRfid(inventarioSeguro, cartaoParaVincular.id, {
        colaborador: formVincular.colaborador.trim(),
        empresa: formVincular.empresa.trim() || 'PRESTADOR / TERCEIRO',
        matricula: formVincular.matricula.trim(),
        portaria: formVincular.portaria,
        dataLiberacao: formVincular.dataLiberacao,
        observacoes: formVincular.observacoes.trim()
      });
      setInventario(novaLista);
      const ident = cartaoParaVincular.tipo === 'ROTATIVO' 
        ? (cartaoParaVincular.numeroRotativo || cartaoParaVincular.codigoRfid) 
        : cartaoParaVincular.codigoRfid;
      showToast(`✓ Cartão ${ident} vinculado com sucesso a ${formVincular.colaborador.toUpperCase()}!`, 'success');
      setCartaoParaVincular(null);
    } catch (err) {
      alert('Erro ao vincular cartão: ' + err.message);
    }
  };

  // Abrir modal de desvinculação
  const abrirDesvincularCartao = (cartao) => {
    setCartaoParaDesvincular(cartao);
    setMotivoDesvinculo('Devolvido na portaria (retorna ao estoque limpo)');
  };

  // Confirmar desvinculação e retorno limpo ao estoque
  const handleConfirmarDesvinculo = () => {
    if (!cartaoParaDesvincular) return;

    try {
      const novaLista = desvincularCartaoRfid(inventarioSeguro, cartaoParaDesvincular.id, motivoDesvinculo);
      setInventario(novaLista);
      const ident = cartaoParaDesvincular.tipo === 'ROTATIVO' 
        ? (cartaoParaDesvincular.numeroRotativo || cartaoParaDesvincular.codigoRfid) 
        : cartaoParaDesvincular.codigoRfid;
      showToast(`✓ Cartão ${ident} desvinculado e retornado limpo ao estoque!`, 'info');
      setCartaoParaDesvincular(null);
    } catch (err) {
      alert('Erro ao desvincular cartão: ' + err.message);
    }
  };

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
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                Fixos & Serviços 01 a 350
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Métricas em Tempo Real
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Gestão de Credenciais RFID (Fixos e Cartões de Serviços)
            </h3>
            <p className="text-xs text-slate-400">
              Inventário completo com CRUD, controle de cartões de Serviços (01 a 350), extravios, baixas e isenção por Boletim de Ocorrência (B.O.).
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Cartão RFID</span>
          </button>
        </div>
      </div>

      {/* DASHBOARDS / INDICADORES AUTOMÁTICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Confeccionados e Liberados no Mês */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
              {metricas.totalMovimentacoesMes > metricas.liberadosMes && (
                <span className="text-blue-400 font-semibold ml-1">
                  • {metricas.totalMovimentacoesMes} vínculos operacionais
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Cartões Perdidos vs Pagos / Ressarcidos vs Isentos por B.O. */}
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
                onClick={() => setFiltroStatus(filtroStatus === 'PERDIDO' ? 'TODOS' : 'PERDIDO')}
                className="group inline-flex items-baseline gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                title="Filtrar cartões Perdidos / A Cobrar"
              >
                <span className="text-2xl font-black text-red-400 group-hover:underline">{metricas.totalPerdidos}</span>
                <span className="text-[11px] text-red-300 font-semibold">a cobrar</span>
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setFiltroStatus(filtroStatus === 'PAGO' ? 'TODOS' : 'PAGO')}
                className="group inline-flex items-baseline gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                title="Filtrar cartões Pagos / Ressarcidos"
              >
                <span className="text-2xl font-black text-emerald-400 group-hover:underline">{metricas.totalPagos}</span>
                <span className="text-[11px] text-emerald-300 font-semibold">pagos</span>
              </button>
              {metricas.totalIsentosBO > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setFiltroStatus(filtroStatus === 'ISENTO_BO' ? 'TODOS' : 'ISENTO_BO')}
                    className="group inline-flex items-baseline gap-1 cursor-pointer hover:scale-105 transition-transform"
                    title="Filtrar cartões Isentos por B.O."
                  >
                    <span className="text-xl font-black text-cyan-400 group-hover:underline">{metricas.totalIsentosBO}</span>
                    <span className="text-[10px] text-cyan-300 font-semibold">B.O.</span>
                  </button>
                </>
              )}
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

        {/* Card 3: Cartões de Serviços (Rotativos) / Reidratados */}
        <div className="bg-slate-900 border border-indigo-900/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Serviços (Rotativos)
            </p>
            <div className="p-2 bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300">{metricas.rotativosDisponiveis}</span>
              <span className="text-[11px] text-indigo-200 font-medium">disponíveis no estoque</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>{metricas.rotativosAtivos} em circulação</span>
              <span className="text-slate-500">Capacidade 01 a {metricas.capacidadeRotativos}</span>
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
              <span className="text-indigo-400">{metricas.totalRotativosCadastrados} Serviços</span>
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
              placeholder="Buscar por Código RFID, Código Verso (5 dígitos), Colaborador, Empresa ou B.O..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Abas Rápidas de Tipo (Fixos vs Serviços) */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filtroTipo === 'TODOS'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              Todos ({metricas.totalGeral})
            </button>
            <button
              onClick={() => setFiltroTipo('ROTATIVO')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${filtroTipo === 'ROTATIVO'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-indigo-300'
                }`}
            >
              <Layers className="w-3 h-3" />
              Serviços 01-350 ({metricas.totalRotativosCadastrados})
            </button>
            <button
              onClick={() => setFiltroTipo('FIXO')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${filtroTipo === 'FIXO'
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
              <option value="PERDIDO">🔴 Perdido (Pendente)</option>
              <option value="PAGO">🟡 Pago / Ressarcido</option>
              <option value="ISENTO_BO">🛡️ Isento por B.O.</option>
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
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Limpar filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE INVENTÁRIO RFID COM CRUD COMPLETO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Inventário de Credenciais ({inventarioFiltrado.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              Controle oficial de cartões de Serviços (01 a 350) e Fixos Nominais
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Ações: <span className="text-emerald-400 font-semibold">Vincular/Desvincular</span> • <span className="text-indigo-400 font-semibold">Baixa</span> • <span className="text-blue-400 font-semibold">Editar</span> • <span className="text-red-400 font-semibold">Excluir</span>
          </span>
        </div>

        {/* CABEÇALHO DA LISTA (FLEX w-full) */}
        <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div
            onClick={() => handleSort('codigoRfid')}
            className="w-28 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por RFID (Chave)"
          >
            <span>RFID (Chave)</span>
            {renderSortIndicator('codigoRfid')}
          </div>

          <div
            onClick={() => handleSort('codigoImpresso')}
            className="w-16 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Código Verso"
          >
            <span>Verso</span>
            {renderSortIndicator('codigoImpresso')}
          </div>

          <div
            onClick={() => handleSort('classificacao')}
            className="w-36 shrink-0 max-w-xs pr-2 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Classificação (Serviços 01-350 / Fixo)"
          >
            <span>Classificação</span>
            {renderSortIndicator('classificacao')}
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
            onClick={() => handleSort('dataLiberacao')}
            className="w-20 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Data de Liberação"
          >
            <span>Liberação</span>
            {renderSortIndicator('dataLiberacao')}
          </div>

          <div
            onClick={() => handleSort('status')}
            className="w-28 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Status do Ciclo"
          >
            <span>Status Ciclo</span>
            {renderSortIndicator('status')}
          </div>

          <div className="w-48 shrink-0 text-right">Ações</div>
        </div>

        {/* CORPO DA LISTA (LINHAS FLEX w-full) */}
        <div className="divide-y divide-slate-800/70 bg-slate-900/40 w-full">
          {inventarioFiltrado.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Nenhuma credencial encontrada para os filtros selecionados.
            </div>
          ) : (
            inventarioFiltrado.map((item) => {
              const isRotativo = item.tipo === 'ROTATIVO';
              const nomeServico = isRotativo 
                ? (item.numeroRotativo || (item.numeroRotativoIdx !== null ? formatarNomeRotativo(item.numeroRotativoIdx) : 'Serviços'))
                : 'Fixo Nominal';

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

                  {/* Classificação / Formato (Serviços XX vs Fixo Nominal) */}
                  <div className="w-36 shrink-0 max-w-xs pr-2 overflow-hidden">
                    {isRotativo ? (
                      <span
                        className="inline-flex max-w-full items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 overflow-hidden whitespace-nowrap"
                        title={nomeServico}
                      >
                        <Layers className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span className="truncate whitespace-nowrap">{nomeServico}</span>
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
                      {item.numeroBO && (
                        <span className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40">
                          B.O.: {item.numeroBO}
                        </span>
                      )}
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
                    {item.dataLiberacao ? item.dataLiberacao.split('-').reverse().join('/') : '--/--/----'}
                  </div>

                  {/* Status / Ciclo de Vida */}
                  <div className="w-28 shrink-0 flex items-center">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-700/60 shrink-0">
                        <AlertCircle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                        <span>Perdido</span>
                      </span>
                    )}
                    {item.status === 'PAGO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span>Pago</span>
                      </span>
                    )}
                    {item.status === 'ISENTO_BO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-700/60" title={item.numeroBO ? `B.O. nº ${item.numeroBO} arquivado na CCO` : 'Isenção formal concedida via B.O.'}>
                        <ShieldCheck className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span>Isento B.O.</span>
                      </span>
                    )}
                    {item.status === 'BLOQUEADO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        <span>Bloqueado</span>
                      </span>
                    )}
                  </div>

                  {/* Ações (Vincular / Desvincular / À Pagar + Baixa + Editar + Excluir) */}
                  <div className="w-48 shrink-0 flex items-center justify-end gap-1.5 text-right">
                    {/* Botão Contextual: Vincular (para Estoque), Desvincular (para Ativo) ou À Pagar (para Perdido) */}
                    {item.status === 'DISPONIVEL' ? (
                      <button
                        type="button"
                        onClick={() => abrirVincularCartao(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm shadow-emerald-950/40 transition-all cursor-pointer shrink-0"
                        title="Vincular a um colaborador"
                      >
                        <UserPlus className="w-3 h-3 text-emerald-200" />
                        <span>Vincular</span>
                      </button>
                    ) : item.status === 'ATIVO' ? (
                      <button
                        type="button"
                        onClick={() => abrirDesvincularCartao(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-bold shadow-sm shadow-indigo-950/40 transition-all cursor-pointer shrink-0"
                        title="Desvincular e retornar ao estoque"
                      >
                        <Unlink className="w-3 h-3 text-indigo-200" />
                        <span>Desvincular</span>
                      </button>
                    ) : item.status === 'PERDIDO' ? (
                      <button
                        type="button"
                        onClick={() => handleMarcarComoPago(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-[11px] font-bold shadow-sm shadow-emerald-950/40 transition-all cursor-pointer shrink-0"
                        title="Confirmar ressarcimento financeiro (Marcar como Pago)"
                      >
                        <Check className="w-3 h-3 text-emerald-200" />
                        <span>À Pagar</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => abrirAlterarStatus(item)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0 cursor-pointer"
                      title="Alterar status / Baixa / Isenção por B.O."
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-400" />
                      <span className="hidden lg:inline text-[11px]">Baixa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirEditarCartao(item)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white transition-colors cursor-pointer"
                      title="Editar dados da credencial"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCartaoParaExcluir(item)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Excluir credencial do inventário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL DE TRANSIÇÃO DE STATUS DO CICLO DE VIDA / BAIXA / ISENÇÃO POR B.O. */}
      {cartaoParaStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Controle de Baixa & Ciclo de Vida
                  </h3>
                  <p className="text-xs text-slate-400">
                    Extravio, ressarcimento, isenção por B.O. ou reidratação
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartaoParaStatus(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
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
                <span className="font-bold text-slate-300">
                  {cartaoParaStatus.tipo === 'ROTATIVO' 
                    ? (cartaoParaStatus.numeroRotativo || (cartaoParaStatus.numeroRotativoIdx !== null ? formatarNomeRotativo(cartaoParaStatus.numeroRotativoIdx) : 'Serviços')) 
                    : 'Fixo Nominal'}
                </span>
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
              >
                <option value="ATIVO">🟢 Ativo / Em Uso</option>
                <option value="DISPONIVEL">🔵 Disponível no Estoque (Reidratado)</option>
                <option value="PERDIDO">🔴 Perdido / Extraviado (Aguardando Cobrança)</option>
                <option value="PAGO">🟡 Pago / Ressarcido (2ª Via Quitada)</option>
                <option value="ISENTO_BO">🛡️ Isento por B.O. (Furto/Roubo - Encerramento de Cobrança)</option>
                <option value="BLOQUEADO">⚪ Bloqueado / Defeito</option>
              </select>

              {cartaoParaStatus.tipo === 'ROTATIVO' && novoStatus === 'DISPONIVEL' && (
                <p className="text-[11px] text-indigo-300 mt-1.5 bg-indigo-950/40 p-2 rounded border border-indigo-900/50">
                  ℹ️ Ao selecionar <strong>Disponível no Estoque</strong>, este cartão de Serviços será reidratado e liberado para novo empréstimo.
                </p>
              )}

              {novoStatus === 'ISENTO_BO' && (
                <div className="mt-2.5 p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/60 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Regra de Isenção Formal (Furto / Roubo)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Com a apresentação e arquivamento formal do Boletim de Ocorrência na CCO, o cartão e o responsável ficam <strong>isentos de cobrança ou penalidade</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Nº do Boletim (B.O.) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2026/048123-1"
                        value={numeroBO}
                        onChange={(e) => setNumeroBO(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-800/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 uppercase font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                        Data de Arquivamento
                      </label>
                      <input
                        type="date"
                        value={dataBO}
                        onChange={(e) => setDataBO(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Motivo / Justificativa da Alteração:
              </label>
              <input
                type="text"
                placeholder="Ex: B.O. arquivado na central / Devolvido na portaria / Pagamento RH..."
                value={motivoMudanca}
                onChange={(e) => setMotivoMudanca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCartaoParaStatus(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAtualizarStatus}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Baixa/Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO COMPLETA DO CARTÃO (CRUD) */}
      {cartaoParaEditar && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Editar Credencial RFID
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atualização cadastral de identificadores, vínculo e dados operacionais
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartaoParaEditar(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Código RFID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Código RFID (Chave) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEditar.codigoRfid}
                    onChange={(e) => setFormEditar({ ...formEditar, codigoRfid: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold uppercase focus:outline-none"
                    required
                  />
                </div>

                {/* Código Impresso Verso */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Código Verso (5 dígitos) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formEditar.codigoImpresso}
                    onChange={(e) => setFormEditar({ ...formEditar, codigoImpresso: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Tipo e Número de Serviços */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Tipo de Credencial
                  </label>
                  <select
                    value={formEditar.tipo}
                    onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="FIXO">Cartão Fixo Nominal</option>
                    <option value="ROTATIVO">Cartão de Serviços (Rotativo)</option>
                  </select>
                </div>

                {formEditar.tipo === 'ROTATIVO' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Número Serviços (01 a 350)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="350"
                      value={formEditar.numeroRotativoIdx}
                      onChange={(e) => setFormEditar({ ...formEditar, numeroRotativoIdx: e.target.value })}
                      placeholder="Ex: 01, 15..."
                      className="w-full bg-slate-950 border border-indigo-500/50 focus:border-indigo-400 rounded-lg px-3 py-2 text-indigo-200 font-mono font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Vínculo: Colaborador e Empresa */}
              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div>
                  <AutocompleteInput
                    tipo="pessoa"
                    label="Colaborador / Portador (Opcional)"
                    placeholder="Digite o nome (ou selecione da base global)..."
                    value={formEditar.colaborador}
                    onChange={(val) => setFormEditar({ ...formEditar, colaborador: val })}
                    onSelect={(pessoa) => {
                      setFormEditar(prev => ({
                        ...prev,
                        colaborador: pessoa.nome,
                        empresa: pessoa.empresa && pessoa.empresa !== 'ESTOQUE CCO' && pessoa.empresa !== 'VISITA PARTICULAR' ? pessoa.empresa : prev.empresa
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <AutocompleteInput
                      tipo="empresa"
                      label="Empresa Vinculada (Opcional)"
                      placeholder="Ex: PRESTADOR, ESTOQUE CCO..."
                      value={formEditar.empresa}
                      onChange={(val) => setFormEditar({ ...formEditar, empresa: val })}
                      onSelect={(emp) => setFormEditar(prev => ({ ...prev, empresa: typeof emp === 'string' ? emp : emp.empresa || emp }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Data de Liberação
                    </label>
                    <input
                      type="date"
                      value={formEditar.dataLiberacao}
                      onChange={(e) => setFormEditar({ ...formEditar, dataLiberacao: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Observações Gerais
                </label>
                <textarea
                  rows={2}
                  value={formEditar.observacoes}
                  onChange={(e) => setFormEditar({ ...formEditar, observacoes: e.target.value })}
                  placeholder="Informações adicionais de inventário..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCartaoParaEditar(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (CRUD) */}
      {cartaoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-red-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Excluir Cartão do Inventário?
                </h3>
                <p className="text-xs text-slate-400">
                  Esta ação removerá o registro permanentemente do sistema.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">RFID:</span>
                <span className="font-bold text-indigo-300">{cartaoParaExcluir.codigoRfid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verso:</span>
                <span className="text-slate-200">{cartaoParaExcluir.codigoImpresso}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Classificação:</span>
                <span className="font-bold text-slate-200">
                  {cartaoParaExcluir.tipo === 'ROTATIVO' 
                    ? (cartaoParaExcluir.numeroRotativo || (cartaoParaExcluir.numeroRotativoIdx !== null ? formatarNomeRotativo(cartaoParaExcluir.numeroRotativoIdx) : 'Serviços')) 
                    : 'Fixo Nominal'}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Colaborador:</span>
                <span className="text-slate-300">{cartaoParaExcluir.colaborador}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCartaoParaExcluir(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VÍNCULO DE CARTÃO (ROTATIVO OU FIXO) */}
      {cartaoParaVincular && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Vincular Credencial a Colaborador
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ativação operacional de cartão de Serviços ou Fixo Nominal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartaoParaVincular(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Identificação do Cartão */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Identificador:</span>
                <span className="font-bold text-indigo-300">
                  {cartaoParaVincular.tipo === 'ROTATIVO' 
                    ? (cartaoParaVincular.numeroRotativo || (cartaoParaVincular.numeroRotativoIdx !== null ? formatarNomeRotativo(cartaoParaVincular.numeroRotativoIdx) : 'Serviços')) 
                    : 'Fixo Nominal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RFID:</span>
                <span className="font-bold text-slate-200">{cartaoParaVincular.codigoRfid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verso:</span>
                <span className="text-slate-300">{cartaoParaVincular.codigoImpresso}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmarVinculo} className="space-y-4 text-xs">
              {/* Colaborador com Autocomplete Inteligente da Base Global */}
              <div>
                <AutocompleteInput
                  tipo="pessoa"
                  label="Nome Completo do Colaborador"
                  required
                  placeholder="Digite o nome (busca automática na base global)..."
                  value={formVincular.colaborador}
                  onChange={(val) => setFormVincular({ ...formVincular, colaborador: val })}
                  onSelect={(pessoa) => {
                    setFormVincular(prev => ({
                      ...prev,
                      colaborador: pessoa.nome,
                      empresa: pessoa.empresa && pessoa.empresa !== 'ESTOQUE CCO' && pessoa.empresa !== 'VISITA PARTICULAR' ? pessoa.empresa : prev.empresa,
                      matricula: pessoa.matricula || prev.matricula
                    }));
                  }}
                />
              </div>

              {/* Empresa com Autocomplete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <AutocompleteInput
                    tipo="empresa"
                    label="Empresa do Colaborador"
                    required
                    placeholder="Ex: PRESTADOR, TECH, TERCEIRO..."
                    value={formVincular.empresa}
                    onChange={(val) => setFormVincular({ ...formVincular, empresa: val })}
                    onSelect={(emp) => setFormVincular(prev => ({ ...prev, empresa: typeof emp === 'string' ? emp : emp.empresa || emp }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Matrícula / Documento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MAT-12345 ou RG/CPF"
                    value={formVincular.matricula}
                    onChange={(e) => setFormVincular({ ...formVincular, matricula: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Portaria / Local de Entrega
                  </label>
                  <select
                    value={formVincular.portaria}
                    onChange={(e) => setFormVincular({ ...formVincular, portaria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="CCO">CCO Central</option>
                    <option value="P1">Portaria 1 (P1)</option>
                    <option value="P2">Portaria 2 (P2)</option>
                    <option value="Caldeira">Caldeira</option>
                    <option value="Cobertura">Cobertura</option>
                    {formVincular.portaria && !['CCO', 'P1', 'P2', 'Caldeira', 'Cobertura'].includes(formVincular.portaria) && (
                      <option value={formVincular.portaria}>{formVincular.portaria}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Data de Liberação
                  </label>
                  <input
                    type="date"
                    value={formVincular.dataLiberacao}
                    onChange={(e) => setFormVincular({ ...formVincular, dataLiberacao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Observações de Vínculo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Empréstimo temporário para obra / Vínculo padrão..."
                  value={formVincular.observacoes}
                  onChange={(e) => setFormVincular({ ...formVincular, observacoes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCartaoParaVincular(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Vínculo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DESVINCULAÇÃO E RETORNO LIMPO AO ESTOQUE */}
      {cartaoParaDesvincular && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Unlink className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Desvincular e Retornar ao Estoque
                  </h3>
                  <p className="text-xs text-slate-400">
                    Encerra o vínculo com o portador e disponibiliza a credencial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartaoParaDesvincular(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Credencial:</span>
                <span className="font-bold text-indigo-300">
                  {cartaoParaDesvincular.tipo === 'ROTATIVO' 
                    ? (cartaoParaDesvincular.numeroRotativo || (cartaoParaDesvincular.numeroRotativoIdx !== null ? formatarNomeRotativo(cartaoParaDesvincular.numeroRotativoIdx) : 'Serviços')) 
                    : 'Fixo Nominal'}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Portador Atual:</span>
                <span className="font-bold text-slate-100">{cartaoParaDesvincular.colaborador}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Empresa:</span>
                <span className="text-slate-300">{cartaoParaDesvincular.empresa}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Motivo da Devolução / Encerramento:
              </label>
              <input
                type="text"
                value={motivoDesvinculo}
                onChange={(e) => setMotivoDesvinculo(e.target.value)}
                placeholder="Ex: Devolvido na portaria ao fim do expediente"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-[11px] text-indigo-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>O cartão retornará ao status <strong>"Disponível no Estoque"</strong> e estará limpo para novo empréstimo.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCartaoParaDesvincular(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDesvinculo}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Retorno ao Estoque</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório de Cobrança Financeira de 2ª Via */}
      <RelatorioCobrancaModal
        isOpen={modalCobrancaOpen}
        onClose={() => setModalCobrancaOpen(false)}
        inventario={inventarioSeguro}
        onMarcarPago={handleMarcarComoPago}
      />
    </div>
  );
}
