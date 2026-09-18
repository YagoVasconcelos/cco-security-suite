import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  ExternalLink,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import CardSlotsVisitantes from './CardSlotsVisitantes';
import NovoVisitanteModal from './NovoVisitanteModal';
import EditarVisitanteModal from './EditarVisitanteModal';
import { salvarPessoaUnificada } from '../../services/baseUnificadaService';
import {
  carregarVisitantes,
  salvarVisitantes,
  obterVisitantesLocais,
  registrarEntradaVisitante,
  registrarSaidaVisitante,
  editarRegistroVisitante,
  registrarIsencaoVisitante,
  registrarPerdaVisitante,
  marcarVisitanteComoPago,
  calcularMetricasVisitantes,
  obterHistoricoPorAnfitriao,
  formatarDataBr
} from '../../services/visitantesService';
import {
  carregarObservacoes,
  obterNomesObservacoesAtivas
} from '../../services/observacoesService';
import {
  carregarVigilantes,
  obterNomesVigilantesAtivos
} from '../../services/vigilantesService';

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
  const [visitantes, setVisitantes] = useState(() => {
    const locais = obterVisitantesLocais();
    return Array.isArray(locais) ? locais : [];
  });
  const [busca, setBusca] = useState('');
  const [filtroPortaria, setFiltroPortaria] = useState('TODAS');
  const [filtroSituacao, setFiltroSituacao] = useState('TODAS');
  const [filtroMotivo, setFiltroMotivo] = useState('TODAS');

  // Ordenação dinâmica das colunas
  // Padrão inicial: 'entrada' decrescente (visitas mais recentes primeiro)
  const [sortField, setSortField] = useState('entrada'); // 'cartao' | 'visitante' | 'anfitriao' | 'entrada' | 'saida' | 'motivo'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'entrada' || field === 'saida' ? 'desc' : 'asc');
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
      <span className="inline-flex items-center text-emerald-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowDown className="w-3 h-3" />
      </span>
    ) : (
      <span className="inline-flex items-center text-emerald-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowUp className="w-3 h-3" />
      </span>
    );
  };

  // Lista dinâmica de Motivos / Observações
  const [listaMotivos, setListaMotivos] = useState(() => {
    const ativas = obterNomesObservacoesAtivas();
    const listaAtivas = Array.isArray(ativas) ? ativas : [];
    return Array.from(new Set([...MOTIVOS_BASE, ...listaAtivas]));
  });

  // Lista dinâmica de Vigilantes de Posto (Campo)
  const [listaVigilantes, setListaVigilantes] = useState(() => {
    const ativas = obterNomesVigilantesAtivos();
    return Array.isArray(ativas) && ativas.length > 0 ? ativas : ['Vigilante Portaria 1', 'Vigilante Portaria 2', 'Vigilante Ronda'];
  });

  // Modal Novo Visitante
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Baixa / Saída do Visitante
  const [visitanteParaBaixa, setVisitanteParaBaixa] = useState(null);
  // Modal de Edição Completa (CRUD)
  const [visitanteParaEditar, setVisitanteParaEditar] = useState(null);
  const [statusSaidaCredencial, setStatusSaidaCredencial] = useState('DEVOLVIDO');
  const [numeroBO, setNumeroBO] = useState('');
  const [dataBO, setDataBO] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [horaSaida, setHoraSaida] = useState('');
  const [vigilanteSaida, setVigilanteSaida] = useState(() => {
    const ativas = obterNomesVigilantesAtivos();
    return (Array.isArray(ativas) && ativas[0]) || 'Vigilante Portaria 1';
  });

  // Modal de Auditoria do Anfitrião (Histórico de visitas autorizadas por colaborador interno)
  const [detalhesAnfitriao, setDetalhesAnfitriao] = useState(null);

  // Monitor de escaninho
  const [portariaEscaninho, setPortariaEscaninho] = useState('P1');

  // Feedback Toast
  const [toast, setToast] = useState(null);

  // Carrega os dados na inicialização de forma segura
  useEffect(() => {
    let montado = true;

    carregarVisitantes().then(dados => {
      if (montado && Array.isArray(dados)) {
        setVisitantes(dados);
      }
    }).catch(err => {
      console.warn('Erro ao carregar visitantes:', err);
    });

    const atualizarObs = async () => {
      try {
        const obs = await carregarObservacoes();
        const listaObs = Array.isArray(obs) ? obs : [];
        const ativas = listaObs.filter(o => o && o.status !== 'Inativo').map(o => o.nome);
        if (montado) {
          setListaMotivos(Array.from(new Set([...MOTIVOS_BASE, ...ativas])));
        }
      } catch (e) { }
    };

    const atualizarVigs = async () => {
      try {
        const vigs = await carregarVigilantes();
        const listaVigs = Array.isArray(vigs) ? vigs : [];
        const ativas = listaVigs.filter(v => v && v.status !== 'Inativo').map(v => v.nome);
        if (ativas.length > 0 && montado) {
          setListaVigilantes(ativas);
        }
      } catch (e) { }
    };

    atualizarObs();
    atualizarVigs();

    const handleVisitantesChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        if (montado) setVisitantes(e.detail);
      } else {
        carregarVisitantes().then(dados => {
          if (montado && Array.isArray(dados)) setVisitantes(dados);
        });
      }
    };

    const handleObs = () => atualizarObs();
    const handleVigs = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativas = e.detail.filter(v => v && v.status !== 'Inativo').map(v => v.nome);
        if (ativas.length > 0 && montado) {
          setListaVigilantes(ativas);
        }
      } else {
        atualizarVigs();
      }
    };

    window.addEventListener('cco_visitantes_changed', handleVisitantesChanged);
    window.addEventListener('cco_observacoes_changed', handleObs);
    window.addEventListener('cco_vigilantes_changed', handleVigs);
    return () => {
      montado = false;
      window.removeEventListener('cco_visitantes_changed', handleVisitantesChanged);
      window.removeEventListener('cco_observacoes_changed', handleObs);
      window.removeEventListener('cco_vigilantes_changed', handleVigs);
    };
  }, []);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // BLINDAGEM DE ARRAY: Garante que os visitantes sejam sempre um Array válido
  const dadosSeguros = Array.isArray(visitantes) ? visitantes : [];

  // Cartões ocupados / indisponíveis (em uso ou perdidos pendentes)
  const cartoesOcupados = dadosSeguros
    .filter(v => v && (
      v.situacao === 'NÃO DEVOLVIDO' || 
      v.situacao === 'NAO_DEVOLVIDO' || 
      v.status === 'NAO_DEVOLVIDO' ||
      v.situacao === 'PERDIDO' ||
      v.situacao === 'ISENTO_BO'
    ))
    .map(v => ({
      cartao: v.cartao,
      visitante: v.visitante,
      anfitriao: v.anfitriao,
      hora: v.horaEntrada,
      isPerdido: v.situacao === 'PERDIDO'
    }));

  // Métricas automáticas consolidadas (incluindo Perdidos vs. Ressarcidos)
  const metricas = useMemo(() => calcularMetricasVisitantes(dadosSeguros), [dadosSeguros]);

  // Filtragem e ordenação dinâmica da lista
  const visitantesFiltrados = useMemo(() => {
    const filtrados = dadosSeguros.filter(v => {
      if (!v) return false;
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo ||
        (v.visitante && v.visitante.toLowerCase().includes(termo)) ||
        (v.cartao && v.cartao.toLowerCase().includes(termo)) ||
        (v.documento && v.documento.toLowerCase().includes(termo)) ||
        (v.empresa && v.empresa.toLowerCase().includes(termo)) ||
        (v.anfitriao && v.anfitriao.toLowerCase().includes(termo)) ||
        (v.anfitriaoSetor && v.anfitriaoSetor.toLowerCase().includes(termo));

      const matchPortaria = filtroPortaria === 'TODAS' || v.portaria === filtroPortaria;
      const matchSituacao = filtroSituacao === 'TODAS' ||
        (filtroSituacao === 'NÃO DEVOLVIDO' && (v.situacao === 'NÃO DEVOLVIDO' || v.situacao === 'NAO_DEVOLVIDO' || v.status === 'NAO_DEVOLVIDO')) ||
        (filtroSituacao === 'ISENTO_BO' && (v.situacao === 'ISENTO_BO' || v.situacao === 'ISENTO' || v.situacao === 'FURTADO')) ||
        v.situacao === filtroSituacao;
      const matchMotivo = filtroMotivo === 'TODAS' || (v.motivo && v.motivo.toUpperCase() === filtroMotivo.toUpperCase());

      return matchBusca && matchPortaria && matchSituacao && matchMotivo;
    });

    return [...filtrados].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'cartao') {
        const numA = parseInt(String(a.cartao || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.cartao || '').replace(/\D/g, ''), 10) || 0;
        comparison = numA !== numB ? numA - numB : String(a.cartao || '').localeCompare(String(b.cartao || ''), 'pt-BR', { numeric: true });
      } else if (sortField === 'visitante') {
        const vA = String(a.visitante || '');
        const vB = String(b.visitante || '');
        const c1 = vA.localeCompare(vB, 'pt-BR', { sensitivity: 'base' });
        if (c1 !== 0) {
          comparison = c1;
        } else {
          const empA = String(a.empresa || '');
          const empB = String(b.empresa || '');
          comparison = empA.localeCompare(empB, 'pt-BR', { sensitivity: 'base' });
        }
      } else if (sortField === 'anfitriao') {
        const anfA = String(a.anfitriao || '');
        const anfB = String(b.anfitriao || '');
        comparison = anfA.localeCompare(anfB, 'pt-BR', { sensitivity: 'base' });
      } else if (sortField === 'entrada') {
        const dataA = a.dataEntrada || '1970-01-01';
        const horaA = a.horaEntrada ? (a.horaEntrada.length === 5 ? `${a.horaEntrada}:00` : a.horaEntrada) : '00:00:00';
        const dataB = b.dataEntrada || '1970-01-01';
        const horaB = b.horaEntrada ? (b.horaEntrada.length === 5 ? `${b.horaEntrada}:00` : b.horaEntrada) : '00:00:00';
        const timeA = new Date(`${dataA}T${horaA}`).getTime() || 0;
        const timeB = new Date(`${dataB}T${horaB}`).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'saida') {
        const dataA = a.dataSaida || '1970-01-01';
        const horaA = a.horaSaida ? (a.horaSaida.length === 5 ? `${a.horaSaida}:00` : a.horaSaida) : '00:00:00';
        const dataB = b.dataSaida || '1970-01-01';
        const horaB = b.horaSaida ? (b.horaSaida.length === 5 ? `${b.horaSaida}:00` : b.horaSaida) : '00:00:00';
        const timeA = new Date(`${dataA}T${horaA}`).getTime() || 0;
        const timeB = new Date(`${dataB}T${horaB}`).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'motivo') {
        const mA = String(a.motivo || '');
        const mB = String(b.motivo || '');
        comparison = mA.localeCompare(mB, 'pt-BR', { sensitivity: 'base' });
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [dadosSeguros, busca, filtroPortaria, filtroSituacao, filtroMotivo, sortField, sortOrder]);

  // Salvar novo visitante com validação do anfitrião e timestamp
  const handleSalvarNovoVisitante = (novoVisitante) => {
    try {
      const { novaLista, registroCompleto } = registrarEntradaVisitante(dadosSeguros, novoVisitante);
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
    setStatusSaidaCredencial('DEVOLVIDO');
    setNumeroBO('');
    setDataBO(agora.toISOString().split('T')[0]);
    setDataSaida(agora.toISOString().split('T')[0]);
    setHoraSaida(agora.toTimeString().split(' ')[0].substring(0, 5));
    setVigilanteSaida(listaVigilantes[0] || 'Vigilante Portaria 1');
  };

  // Confirmar saída / devolução da credencial com cálculo de tempo e status
  const confirmarSaida = () => {
    if (!visitanteParaBaixa) return;

    if (statusSaidaCredencial === 'FURTADO') {
      if (!numeroBO || !numeroBO.trim()) {
        alert('Por favor, informe o número do Boletim de Ocorrência (B.O.) apresentado para isenção.');
        return;
      }

      const novaLista = registrarIsencaoVisitante(dadosSeguros, visitanteParaBaixa.id, {
        dataSaida,
        horaSaida,
        vigilanteSaida,
        numeroBO: numeroBO.trim().toUpperCase(),
        dataBO,
        motivoIsencao: 'Boletim de Ocorrência (Furto/Roubo)',
        observacoes: `Isento de cobrança por B.O. nº ${numeroBO.trim().toUpperCase()}`
      });

      setVisitantes(novaLista);
      showToast(
        `🛡️ Saída do visitante ${visitanteParaBaixa.visitante} registrada com ISENÇÃO por B.O. nº ${numeroBO.trim().toUpperCase()}!`,
        'success'
      );
      setVisitanteParaBaixa(null);
      return;
    }

    if (statusSaidaCredencial === 'PERDIDO') {
      const novaLista = registrarPerdaVisitante(dadosSeguros, visitanteParaBaixa.id, {
        dataPerda: dataSaida,
        horaPerda: horaSaida,
        motivo: 'Extraviado pelo visitante no encerramento da visita',
        observacoes: `Extraviado pelo visitante às ${horaSaida}. Registrado por ${vigilanteSaida}.`
      });

      setVisitantes(novaLista);
      showToast(
        `⚠️ Cartão ${visitanteParaBaixa.cartao} registrado como PERDIDO. Adicionado à fila de cobrança/ressarcimento!`,
        'warning'
      );
      setVisitanteParaBaixa(null);
      return;
    }

    // Padrão: DEVOLVIDO
    const novaLista = registrarSaidaVisitante(dadosSeguros, visitanteParaBaixa.id, {
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

  // Registrar perda / extravio de credencial de visitante
  const handleRegistrarPerda = (visitante) => {
    if (!visitante) return;
    const confirmou = window.confirm(
      `Confirmar registro de PERDA do cartão ${visitante.cartao} pelo visitante ${visitante.visitante}?\n\nO cartão entrará no controle de cobrança e pendência de ressarcimento.`
    );
    if (!confirmou) return;

    const novaLista = registrarPerdaVisitante(dadosSeguros, visitante.id);
    setVisitantes(novaLista);
    if (visitanteParaBaixa) setVisitanteParaBaixa(null);
    showToast(`⚠️ Cartão ${visitante.cartao} registrado como PERDIDO. Adicionado à fila de cobrança/ressarcimento!`, 'warning');
  };

  // Quitar / Marcar como Pago cartão de visitante perdido
  const handleMarcarComoPagoVisitante = (visitante) => {
    if (!visitante) return;
    try {
      const novaLista = marcarVisitanteComoPago(dadosSeguros, visitante.id);
      setVisitantes(novaLista);
      showToast(`✓ Cartão de visitante ${visitante.cartao} (${visitante.visitante}) marcado como PAGO / Ressarcido com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      showToast('Erro ao atualizar status para Pago: ' + err.message, 'error');
    }
  };

  // Abre auditoria de visitas por Anfitrião
  const abrirAuditoriaAnfitriao = (nomeAnfitriao) => {
    const dados = obterHistoricoPorAnfitriao(dadosSeguros, nomeAnfitriao);
    setDetalhesAnfitriao(dados);
  };

  // Abrir modal de edição do visitante
  const abrirEditarVisitante = (item) => {
    setVisitanteParaEditar(item);
  };

  // Salvar edições do visitante
  const handleSalvarEdicaoVisitante = (dadosEditados) => {
    try {
      const novaLista = editarRegistroVisitante(dadosSeguros, dadosEditados.id, dadosEditados);
      setVisitantes(novaLista);

      if (dadosEditados.visitante && dadosEditados.visitante.trim()) {
        salvarPessoaUnificada({
          nome: dadosEditados.visitante.trim(),
          empresa: dadosEditados.empresa,
          rg: dadosEditados.documento
        });
      }

      showToast(`✓ Visitante ${dadosEditados.visitante} (Cartão ${dadosEditados.cartao}) atualizado com sucesso!`, 'success');
      setVisitanteParaEditar(null);
    } catch (err) {
      showToast(`Erro ao editar visitante: ${err.message}`, 'error');
    }
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
              <span className="text-2xl font-extrabold text-white">{metricas.totalNoSite}</span>
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
              <span className="text-2xl font-extrabold text-white">{metricas.totalDevolvidosHoje}</span>
              <span className="text-[11px] text-emerald-300 font-medium">saídas registradas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Cartões retornados à portaria</p>
          </div>
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Cartões Perdidos vs Pagos / Ressarcidos (Substitui Vínculo de Anfitrião) */}
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
                title="Filtrar cartões Perdidos / A Cobrar"
              >
                <span className="text-2xl font-black text-red-400 group-hover:underline">{metricas.totalPerdidos}</span>
                <span className="text-[11px] text-red-300 font-semibold">a cobrar</span>
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setFiltroSituacao(filtroSituacao === 'PAGO' ? 'TODAS' : 'PAGO')}
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
                    onClick={() => setFiltroSituacao(filtroSituacao === 'ISENTO_BO' ? 'TODAS' : 'ISENTO_BO')}
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

        {/* Card 4: Total de Movimentações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Total de Visitas
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{metricas.totalRegistros}</span>
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
              <option value="PERDIDO">⚠️ Perdido (A Cobrar)</option>
              <option value="PAGO">💰 Pago / Ressarcido</option>
              <option value="ISENTO_BO">🛡️ Isento por B.O.</option>
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
          <div
            onClick={() => handleSort('cartao')}
            className="w-24 shrink-0 pr-2 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Cartão"
          >
            <span>Cartão</span>
            {renderSortIndicator('cartao')}
          </div>

          <div
            onClick={() => handleSort('visitante')}
            className="flex-1 min-w-[200px] pr-3 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Visitante & Empresa"
          >
            <span>Visitante & Empresa</span>
            {renderSortIndicator('visitante')}
          </div>

          <div
            onClick={() => handleSort('anfitriao')}
            className="w-40 lg:w-48 shrink-0 pr-2 cursor-pointer hover:text-white transition-colors group flex items-center gap-1 text-emerald-300"
            title="Clique para ordenar por Anfitrião (Solicitante)"
          >
            <span>Anfitrião</span>
            {renderSortIndicator('anfitriao')}
          </div>

          <div
            onClick={() => handleSort('entrada')}
            className="w-24 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Data/Hora de Entrada"
          >
            <span>Entrada</span>
            {renderSortIndicator('entrada')}
          </div>

          <div
            onClick={() => handleSort('saida')}
            className="w-28 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Data/Hora de Saída"
          >
            <span>Saída</span>
            {renderSortIndicator('saida')}
          </div>

          <div
            onClick={() => handleSort('motivo')}
            className="w-20 shrink-0 cursor-pointer hover:text-white transition-colors group flex items-center gap-1"
            title="Clique para ordenar por Motivo"
          >
            <span>Motivo</span>
            {renderSortIndicator('motivo')}
          </div>

          <div className="w-36 shrink-0 text-right">Ações</div>
        </div>

        {/* CORPO DA LISTA (LINHAS FLEX w-full) */}
        <div className="divide-y divide-slate-800/70 bg-slate-900/40 w-full">
          {visitantesFiltrados.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum visitante encontrado para os filtros selecionados.
            </div>
          ) : (
            visitantesFiltrados.map((item) => {
              const isPendente = item.situacao === 'NÃO DEVOLVIDO' || (!item.dataSaida && item.situacao !== 'PERDIDO' && item.situacao !== 'PAGO' && item.situacao !== 'ISENTO_BO');
              const isPerdido = item.situacao === 'PERDIDO';
              const isPago = item.situacao === 'PAGO';
              const isIsento = item.situacao === 'ISENTO_BO' || item.situacao === 'ISENTO' || item.situacao === 'FURTADO';

              return (
                <div
                  key={item.id}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-xs transition-colors ${
                    isPerdido
                      ? 'bg-amber-950/20 hover:bg-amber-950/30'
                      : isPago
                      ? 'bg-emerald-950/10 hover:bg-emerald-950/20'
                      : isIsento
                      ? 'bg-cyan-950/15 hover:bg-cyan-950/25'
                      : isPendente
                      ? 'bg-red-950/15 hover:bg-red-950/25'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Cartão */}
                  <div className="w-24 shrink-0 pr-2 flex items-center">
                    <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-md border inline-block text-center min-w-[60px] ${
                      isPerdido
                        ? 'bg-amber-950/60 text-amber-200 border-amber-800/60'
                        : isPago
                        ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800/60'
                        : isIsento
                        ? 'bg-cyan-950/60 text-cyan-200 border-cyan-800/60'
                        : isPendente
                        ? 'bg-red-900/40 text-red-200 border-red-700/60'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}>
                      {item.cartao}
                    </span>
                  </div>

                  {/* Visitante & Empresa */}
                  <div className="flex-1 min-w-[200px] pr-3">
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
                    {isPerdido ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Perdido
                      </span>
                    ) : isPago ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" />
                        Ressarcido
                      </span>
                    ) : isIsento ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60" title={`Isento formalmente por B.O. nº ${item.numeroBO || 'Registrado'}`}>
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        Isento B.O.
                      </span>
                    ) : item.dataSaida ? (
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
                  <div className="w-36 shrink-0 flex items-center justify-end gap-1.5 text-right">
                    {isPerdido ? (
                      <button
                        type="button"
                        onClick={() => handleMarcarComoPagoVisitante(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-[11px] font-bold shadow-sm shadow-emerald-950/40 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        title="Confirmar ressarcimento financeiro da credencial (Marcar como Pago)"
                      >
                        <Check className="w-3 h-3 text-emerald-200" />
                        <span>À Pagar</span>
                      </button>
                    ) : isPago ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Quitado
                      </span>
                    ) : isIsento ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 shrink-0" title={`Isento por B.O. nº ${item.numeroBO || ''}`}>
                        <ShieldCheck className="w-3 h-3" />
                        Isento
                      </span>
                    ) : isPendente ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => iniciarBaixa(item)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                          title="Registrar horário de saída e devolução da credencial do visitante"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Saída</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegistrarPerda(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer shrink-0"
                          title="Declarar perda / extravio desta credencial de visitante"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Encerrado
                      </span>
                    )}

                    {/* Botão de Edição Completa */}
                    <button
                      type="button"
                      onClick={() => abrirEditarVisitante(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/40 transition-colors cursor-pointer shrink-0"
                      title="Editar dados do visitante"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
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

      {/* MODAL DE EDIÇÃO COMPLETA DO VISITANTE */}
      <EditarVisitanteModal
        isOpen={!!visitanteParaEditar}
        visitante={visitanteParaEditar}
        onClose={() => setVisitanteParaEditar(null)}
        onSalvar={handleSalvarEdicaoVisitante}
        listaVigilantes={listaVigilantes}
        listaMotivos={listaMotivos}
      />

      {/* MODAL DE BAIXA DE SAÍDA DO VISITANTE COM CAPTURA DE HORÁRIO E DESTINO */}
      {visitanteParaBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  statusSaidaCredencial === 'PERDIDO'
                    ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                    : statusSaidaCredencial === 'FURTADO'
                    ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {statusSaidaCredencial === 'PERDIDO' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : statusSaidaCredencial === 'FURTADO' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Registrar Saída do Visitante
                  </h3>
                  <p className="text-xs text-slate-400">
                    Captura automática do horário e validação de retorno da credencial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVisitanteParaBaixa(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Resumidas do Visitante */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Credencial:</span>
                <span className="font-mono font-bold text-emerald-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{visitanteParaBaixa.cartao}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Visitante:</span>
                <span className="font-bold text-slate-200 truncate max-w-[260px]">{visitanteParaBaixa.visitante}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Anfitrião:</span>
                <span className="font-semibold text-emerald-400 truncate max-w-[260px]">{visitanteParaBaixa.anfitriao} ({visitanteParaBaixa.anfitriaoSetor})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Entrada:</span>
                <span className="text-slate-300 font-mono">
                  {formatarDataBr(visitanteParaBaixa.dataEntrada)} às {visitanteParaBaixa.horaEntrada}
                </span>
              </div>
            </div>

            {/* SELEÇÃO OBRIGATÓRIA: DESTINO / STATUS DA CREDENCIAL */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Destino / Status da Credencial <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Devolvido */}
                <button
                  type="button"
                  onClick={() => setStatusSaidaCredencial('DEVOLVIDO')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    statusSaidaCredencial === 'DEVOLVIDO'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/50 text-white shadow-sm shadow-emerald-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CheckCircle2 className={`w-4 h-4 ${statusSaidaCredencial === 'DEVOLVIDO' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    {statusSaidaCredencial === 'DEVOLVIDO' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </div>
                  <p className="font-bold text-xs text-slate-200 leading-tight">Devolvido</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Escaninho</p>
                </button>

                {/* 2. Perdido / Extraviado */}
                <button
                  type="button"
                  onClick={() => setStatusSaidaCredencial('PERDIDO')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    statusSaidaCredencial === 'PERDIDO'
                      ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/50 text-white shadow-sm shadow-amber-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <AlertTriangle className={`w-4 h-4 ${statusSaidaCredencial === 'PERDIDO' ? 'text-amber-400' : 'text-slate-500'}`} />
                    {statusSaidaCredencial === 'PERDIDO' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                  </div>
                  <p className="font-bold text-xs text-slate-200 leading-tight">Perdido</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">A Cobrar</p>
                </button>

                {/* 3. Furtado / Isento */}
                <button
                  type="button"
                  onClick={() => setStatusSaidaCredencial('FURTADO')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    statusSaidaCredencial === 'FURTADO'
                      ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/50 text-white shadow-sm shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ShieldCheck className={`w-4 h-4 ${statusSaidaCredencial === 'FURTADO' ? 'text-cyan-400' : 'text-slate-500'}`} />
                    {statusSaidaCredencial === 'FURTADO' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    )}
                  </div>
                  <p className="font-bold text-xs text-slate-200 leading-tight">Furtado</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Isento B.O.</p>
                </button>
              </div>
            </div>

            {/* Painel Condicional: FURTADO / ISENTO COM B.O. */}
            {statusSaidaCredencial === 'FURTADO' && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Isenção de Cobrança por Boletim de Ocorrência</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Com a apresentação do B.O., a credencial é encerrada com <strong>isenção formal de penalidade ou taxa de 2ª via</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                      Nº do Boletim (B.O.) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2026/048123-1"
                      value={numeroBO}
                      onChange={(e) => setNumeroBO(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-800/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 font-mono uppercase font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                      Data do B.O.
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

            {/* Painel Condicional: PERDIDO / EXTRAVIADO */}
            {statusSaidaCredencial === 'PERDIDO' && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Lançamento em Cobrança de 2ª Via</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  A credencial será marcada como <strong>PERDIDO</strong> e entrará na fila de ressarcimento (<strong>a cobrar</strong>) no painel superior.
                </p>
              </div>
            )}

            {/* Data e Hora de Saída */}
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
                {listaVigilantes.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* REFINAMENTO VISUAL DOS BOTÕES INFERIORES */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setStatusSaidaCredencial(prev => prev === 'PERDIDO' ? 'DEVOLVIDO' : 'PERDIDO')}
                className={`h-[38px] px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  statusSaidaCredencial === 'PERDIDO'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/80 ring-1 ring-amber-500/50 shadow-sm'
                    : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800/60'
                }`}
                title="Marcar status como Extravio / Perda para cobrança"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Extravio / Perda</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisitanteParaBaixa(null)}
                  className="h-[38px] px-3.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarSaida}
                  className={`h-[38px] px-4 rounded-lg text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusSaidaCredencial === 'PERDIDO'
                      ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-950/50'
                      : statusSaidaCredencial === 'FURTADO'
                      ? 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 shadow-cyan-950/50'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-950/50'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>
                    {statusSaidaCredencial === 'PERDIDO'
                      ? 'Confirmar Perda & Horário'
                      : statusSaidaCredencial === 'FURTADO'
                      ? 'Confirmar Isenção & Horário'
                      : 'Confirmar Baixa & Horário'}
                  </span>
                </button>
              </div>
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
