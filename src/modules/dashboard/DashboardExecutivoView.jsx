import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  UserCheck,
  Radio,
  Layers,
  Shield,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  FileDown,
  FileSpreadsheet,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
  Users,
  Flame,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Building,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  BadgeAlert,
  Loader2,
  DollarSign
} from 'lucide-react';
import {
  exportarRelatorioConsolidadoPdf,
  exportarBaseConsolidadaExcel
} from '../../services/dashboardExportService';
import {
  PREDIOS_CCO,
  AREAS_CCO,
  TOPICOS_OCORRENCIA,
  EMPRESAS_CCO,
  GRAVIDADES_CCO,
  normalizarGravidade,
  obterAreasDoPredio
} from '../../constants/taxonomiaCco';
import { 
  carregarOperadores, 
  obterNomesOperadoresAtivos 
} from '../../services/operadoresService';
import {
  carregarTurnos,
  obterNomesTurnosAtivos
} from '../../services/turnosService';
import { carregarOcorrencias } from '../../services/ocorrenciasService';
import { 
  carregarRegistros as carregarRegistrosProvisorios, 
  obterRegistrosLocais as obterProvisoriosLocais,
  marcarProvisorioComoPago 
} from '../../services/provisoriosService';
import { 
  carregarVisitantes, 
  obterVisitantesLocais,
  marcarVisitanteComoPago 
} from '../../services/visitantesService';
import { 
  carregarInventarioRfid, 
  obterInventarioRfidLocal, 
  transicionarStatusCartao 
} from '../../services/rfidService';
import RelatorioCobrancaModal from '../rfid/RelatorioCobrancaModal';
import RelatorioExecutivoPrint from './RelatorioExecutivoPrint';
import { obterResponsaveisSincrono } from '../../services/responsaveisService';

// Taxa regulamentar padronizada para cobrança de 2ª via de credenciais e crachás
const TAXA_SEGUNDA_VIA = 30.0;

export default function DashboardExecutivoView({ 
  onNavigate,
  operadorAtivo = 'Op. Operador 01',
  onChangeOperador
}) {
  const [listaOperadores, setListaOperadores] = useState(() => {
    return obterNomesOperadoresAtivos();
  });

  const [listaTurnos, setListaTurnos] = useState(() => {
    return obterNomesTurnosAtivos();
  });

  const [turnoAtivo, setTurnoAtivo] = useState(() => {
    const salvo = localStorage.getItem('cco_turno_ativo');
    const nomes = obterNomesTurnosAtivos();
    if (salvo && nomes.includes(salvo)) return salvo;
    return nomes[0] || '12x36 Diurno';
  });

  const handleTrocarTurno = (novoTurno) => {
    setTurnoAtivo(novoTurno);
    localStorage.setItem('cco_turno_ativo', novoTurno);
  };

  useEffect(() => {
    const atualizarOperadores = async () => {
      try {
        const dados = await carregarOperadores();
        const lista = Array.isArray(dados) ? dados : [];
        const ativos = lista.filter(op => op && op.status !== 'Inativo').map(op => op.nome);
        if (ativos.length > 0) {
          setListaOperadores(ativos);
        }
      } catch (e) {
        console.error('Erro ao buscar operadores no Dashboard:', e);
      }
    };

    const atualizarTurnos = async () => {
      try {
        const dados = await carregarTurnos();
        const lista = Array.isArray(dados) ? dados : [];
        const ativos = lista.filter(t => t && t.status !== 'Inativo').map(t => t.nome);
        if (ativos.length > 0) {
          setListaTurnos(ativos);
          if (!ativos.includes(turnoAtivo)) {
            setTurnoAtivo(ativos[0]);
            localStorage.setItem('cco_turno_ativo', ativos[0]);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar turnos no Dashboard:', e);
      }
    };

    atualizarOperadores();
    atualizarTurnos();

    const handleOperadoresChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativos = e.detail.filter(op => op && op.status !== 'Inativo').map(op => op.nome);
        if (ativos.length > 0) {
          setListaOperadores(ativos);
        }
      } else {
        atualizarOperadores();
      }
    };

    const handleTurnosChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativos = e.detail.filter(t => t && t.status !== 'Inativo').map(t => t.nome);
        if (ativos.length > 0) {
          setListaTurnos(ativos);
          if (!ativos.includes(turnoAtivo)) {
            setTurnoAtivo(ativos[0]);
            localStorage.setItem('cco_turno_ativo', ativos[0]);
          }
        }
      } else {
        atualizarTurnos();
      }
    };

    window.addEventListener('cco_operadores_changed', handleOperadoresChanged);
    window.addEventListener('cco_turnos_changed', handleTurnosChanged);
    return () => {
      window.removeEventListener('cco_operadores_changed', handleOperadoresChanged);
      window.removeEventListener('cco_turnos_changed', handleTurnosChanged);
    };
  }, [turnoAtivo]);
  // 1. Estados dos Filtros com Separação Lógica Estrita
  // A. Filtro Temporal (Global)
  const [periodo, setPeriodo] = useState('mes_atual');
  const [dataInicio, setDataInicio] = useState('2026-09-01');
  const [dataFim, setDataFim] = useState('2026-09-30');

  // B. Filtros de Contexto Ocorrências (afetam APENAS indicadores de ROs)
  const [filtroPredio, setFiltroPredio] = useState('TODOS');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [filtroTopico, setFiltroTopico] = useState('TODOS');
  const [filtroGravidade, setFiltroGravidade] = useState('TODAS');

  // Áreas disponíveis para o filtro de Ocorrências com base no prédio selecionado
  const areasFiltroDisponiveis = useMemo(() => {
    if (filtroPredio && filtroPredio !== 'TODOS') {
      return obterAreasDoPredio(filtroPredio);
    }
    return AREAS_CCO;
  }, [filtroPredio]);

  // C. Filtro de Contexto Pessoas / Credenciais (afeta APENAS Credenciais e Visitantes)
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS');

  const [filtrosAbertos, setFiltrosAbertos] = useState(true);

  // Estados de exportação
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Modal Relatório de Cobrança Financeira (2ª Via de Credenciais)
  const [modalCobrancaOpen, setModalCobrancaOpen] = useState(false);

  // Navegação entre Dashboards (Modo Paisagem com Paginação Individual)
  const [abaAtiva, setAbaAtiva] = useState('todas'); // 'todas' | 'd1' | 'd2' | 'd3' | 'd4'

  // Notificação / Feedback de exportação (UI)
  const [toast, setToast] = useState(null);

  const showToast = (mensagem, tipo = 'info', acao = null) => {
    setToast({ mensagem, tipo, acao });
    setTimeout(() => setToast(null), 6000);
  };

  // Mapeia o rótulo amigável do período
  const getPeriodoLabel = () => {
    switch (periodo) {
      case 'hoje': return 'Hoje';
      case 'semana': return 'Esta Semana';
      case 'mes_atual': return 'Mês Atual (Setembro/2026)';
      case 'ultimos_30': return 'Últimos 30 Dias';
      case 'ano_2026': return 'Ano 2026';
      case 'personalizado': return `De ${dataInicio} até ${dataFim}`;
      default: return 'Setembro/2026';
    }
  };

  // Carregamento e sincronização reativa com as bases de dados locais e disco
  const [ocorrenciasSalvas, setOcorrenciasSalvas] = useState(() => {
    try {
      const salvo = localStorage.getItem('cco_ocorrencias_registros');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [provisoriosBase, setProvisoriosBase] = useState(() => {
    return obterProvisoriosLocais() || [];
  });

  const [visitantesBase, setVisitantesBase] = useState(() => {
    return obterVisitantesLocais() || [];
  });

  const [rfidBase, setRfidBase] = useState(() => {
    return obterInventarioRfidLocal() || [];
  });

  useEffect(() => {
    let montado = true;

    const carregarTudo = async () => {
      try {
        const [dadosOc, dadosProv, dadosVis, dadosRfid] = await Promise.all([
          carregarOcorrencias().catch(() => []),
          carregarRegistrosProvisorios().catch(() => []),
          carregarVisitantes().catch(() => []),
          carregarInventarioRfid().catch(() => [])
        ]);

        if (!montado) return;

        if (Array.isArray(dadosOc)) {
          setOcorrenciasSalvas(dadosOc.map(o => ({
            ...o,
            predio: o.predio || (o.local && o.local.split(' - ')[0]) || 'Geral',
            area: o.area || (o.local && o.local.includes(' - ') ? o.local.split(' - ')[1] : 'Área Geral'),
            topico: o.topico || 'USO INDEVIDO DE EPI'
          })));
        }
        if (Array.isArray(dadosProv)) setProvisoriosBase(dadosProv);
        if (Array.isArray(dadosVis)) setVisitantesBase(dadosVis);
        if (Array.isArray(dadosRfid)) setRfidBase(dadosRfid);
      } catch (err) {
        console.error('Erro ao carregar dados consolidados no Dashboard:', err);
      }
    };

    carregarTudo();

    const handleOcorrenciasChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setOcorrenciasSalvas(e.detail.map(o => ({
          ...o,
          predio: o.predio || (o.local && o.local.split(' - ')[0]) || 'Geral',
          area: o.area || (o.local && o.local.includes(' - ') ? o.local.split(' - ')[1] : 'Área Geral'),
          topico: o.topico || 'USO INDEVIDO DE EPI'
        })));
      } else {
        carregarOcorrencias().then(dados => {
          if (dados && Array.isArray(dados)) {
            setOcorrenciasSalvas(dados.map(o => ({
              ...o,
              predio: o.predio || (o.local && o.local.split(' - ')[0]) || 'Geral',
              area: o.area || (o.local && o.local.includes(' - ') ? o.local.split(' - ')[1] : 'Área Geral'),
              topico: o.topico || 'USO INDEVIDO DE EPI'
            })));
          }
        });
      }
    };

    const handleProvisoriosChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProvisoriosBase(e.detail);
      } else {
        carregarRegistrosProvisorios().then(dados => {
          if (dados && Array.isArray(dados)) setProvisoriosBase(dados);
        });
      }
    };

    const handleVisitantesChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setVisitantesBase(e.detail);
      } else {
        carregarVisitantes().then(dados => {
          if (dados && Array.isArray(dados)) setVisitantesBase(dados);
        });
      }
    };

    const handleRfidChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRfidBase(e.detail);
      } else {
        carregarInventarioRfid().then(dados => {
          if (dados && Array.isArray(dados)) setRfidBase(dados);
        });
      }
    };

    window.addEventListener('cco_ocorrencias_changed', handleOcorrenciasChanged);
    window.addEventListener('cco_provisorios_changed', handleProvisoriosChanged);
    window.addEventListener('cco_visitantes_changed', handleVisitantesChanged);
    window.addEventListener('cco_rfid_changed', handleRfidChanged);

    return () => {
      montado = false;
      window.removeEventListener('cco_ocorrencias_changed', handleOcorrenciasChanged);
      window.removeEventListener('cco_provisorios_changed', handleProvisoriosChanged);
      window.removeEventListener('cco_visitantes_changed', handleVisitantesChanged);
      window.removeEventListener('cco_rfid_changed', handleRfidChanged);
    };
  }, []);

  // Função auxiliar de correspondência temporal
  const matchPeriodo = (dataIso) => {
    if (!dataIso) return true;
    if (periodo === 'hoje') {
      const hojeStr = new Date().toISOString().split('T')[0];
      return dataIso === hojeStr;
    }
    if (periodo === 'semana') {
      return dataIso >= '2026-09-01' && dataIso <= '2026-09-07';
    }
    if (periodo === 'mes_atual') {
      return dataIso.startsWith('2026-09');
    }
    if (periodo === 'ultimos_30') {
      return dataIso >= '2026-08-01' && dataIso <= '2026-09-30';
    }
    if (periodo === 'ano_2026') {
      return dataIso.startsWith('2026');
    }
    if (periodo === 'personalizado') {
      return dataIso >= dataInicio && dataIso <= dataFim;
    }
    return true;
  };

  // =========================================================================
  // REGRAS DE NEGÓCIO ESTRITAS DE SEPARAÇÃO LÓGICA DOS FILTROS:
  // 1. Ocorrências são afetadas APENAS por Data, Prédio, Área e Tópico
  //    (Empresa NUNCA afeta Ocorrências)
  // 2. Credenciais e Visitantes são afetados APENAS por Data e Empresa
  //    (Prédio, Área e Tópico NUNCA afetam Credenciais ou Visitantes)
  // =========================================================================

  // 1. Base filtrada pelos eixos operacionais (Data, Prédio, Área, Tópico)
  const ocorrenciasBase = useMemo(() => {
    const lista = Array.isArray(ocorrenciasSalvas) ? ocorrenciasSalvas : [];
    return lista.filter(o => {
      if (!o) return false;
      if (!matchPeriodo(o.data)) return false;
      if (filtroPredio !== 'TODOS' && o.predio !== filtroPredio) return false;
      if (filtroArea !== 'TODAS' && o.area !== filtroArea) return false;
      if (filtroTopico !== 'TODOS' && o.topico !== filtroTopico) return false;
      return true;
    });
  }, [ocorrenciasSalvas, periodo, dataInicio, dataFim, filtroPredio, filtroArea, filtroTopico]);

  const provisoriosFiltrados = useMemo(() => {
    const lista = Array.isArray(provisoriosBase) ? provisoriosBase : [];
    return lista.filter(p => {
      if (!p) return false;
      if (!matchPeriodo(p.dataRetirada)) return false;
      if (filtroEmpresa !== 'TODAS') {
        const emp = (p.empresa || '').toUpperCase();
        const fEmp = filtroEmpresa.toUpperCase();
        if (!emp.includes(fEmp) && !fEmp.includes(emp)) return false;
      }
      return true;
    });
  }, [provisoriosBase, periodo, dataInicio, dataFim, filtroEmpresa]);

  const visitantesFiltrados = useMemo(() => {
    const lista = Array.isArray(visitantesBase) ? visitantesBase : [];
    return lista.filter(v => {
      if (!v) return false;
      if (!matchPeriodo(v.dataEntrada)) return false;
      if (filtroEmpresa !== 'TODAS') {
        const emp = (v.empresa || '').toUpperCase();
        const fEmp = filtroEmpresa.toUpperCase();
        if (!emp.includes(fEmp) && !fEmp.includes(emp)) return false;
      }
      return true;
    });
  }, [visitantesBase, periodo, dataInicio, dataFim, filtroEmpresa]);

  const rfidFiltrados = useMemo(() => {
    const lista = Array.isArray(rfidBase) ? rfidBase : [];
    return lista.filter(r => {
      if (!r) return false;

      // 1. Verificação Temporal Completa: Considera emissões, vínculos e eventos históricos no período
      const teveEventoPeriodo = Array.isArray(r.historico) && r.historico.some(h => {
        if (!h || !h.data) return false;
        const dataIso = String(h.data).substring(0, 10);
        return matchPeriodo(dataIso);
      });

      const matchDataLiberacao = r.dataLiberacao && matchPeriodo(r.dataLiberacao);
      const matchDataBO = r.dataBO && matchPeriodo(r.dataBO);
      const matchUltimoVinculo = r.dataUltimoVinculo && matchPeriodo(String(r.dataUltimoVinculo).substring(0, 10));
      const matchUltimaLiberacao = r.dataUltimaLiberacao && matchPeriodo(String(r.dataUltimaLiberacao).substring(0, 10));

      const pertenceAoPeriodo = teveEventoPeriodo || matchDataLiberacao || matchDataBO || matchUltimoVinculo || matchUltimaLiberacao;
      if (!pertenceAoPeriodo) return false;

      // 2. Filtro de Empresa: Considera empresa atual e histórico de titularidade no período
      if (filtroEmpresa !== 'TODAS') {
        const fEmp = filtroEmpresa.toUpperCase();
        const empAtual = (r.empresa || '').toUpperCase();
        const matchEmpAtual = empAtual.includes(fEmp) || fEmp.includes(empAtual);

        const matchEmpHistorica = Array.isArray(r.historico) && r.historico.some(h => {
          if (!h) return false;
          const empH = (h.empresa || h.empresaAnterior || '').toUpperCase();
          return empH.includes(fEmp) || fEmp.includes(empH);
        });

        if (!matchEmpAtual && !matchEmpHistorica) return false;
      }

      return true;
    });
  }, [rfidBase, periodo, dataInicio, dataFim, filtroEmpresa]);

  // Métricas calculadas dinamicamente com normalização robusta de gravidade
  const totalOcorrencias = ocorrenciasBase.length;
  const criticas = ocorrenciasBase.filter(o => o && normalizarGravidade(o.gravidade) === 'Crítica').length;
  const altas = ocorrenciasBase.filter(o => o && normalizarGravidade(o.gravidade) === 'Alta').length;
  const medias = ocorrenciasBase.filter(o => o && normalizarGravidade(o.gravidade) === 'Média').length;
  const baixas = ocorrenciasBase.filter(o => o && normalizarGravidade(o.gravidade) === 'Baixa').length;

  const pctCritica = totalOcorrencias > 0 ? Math.round((criticas / totalOcorrencias) * 100) : 0;
  const pctAlta = totalOcorrencias > 0 ? Math.round((altas / totalOcorrencias) * 100) : 0;
  const pctMedia = totalOcorrencias > 0 ? Math.round((medias / totalOcorrencias) * 100) : 0;
  const pctBaixa = totalOcorrencias > 0 ? Math.round((baixas / totalOcorrencias) * 100) : 0;

  // 2. Ocorrências filtradas finais (se filtroGravidade estiver ativo, afunila tabelas e listagens analíticas)
  const ocorrenciasFiltradas = useMemo(() => {
    if (filtroGravidade === 'TODAS') return ocorrenciasBase;
    return ocorrenciasBase.filter(o => o && normalizarGravidade(o.gravidade) === filtroGravidade);
  }, [ocorrenciasBase, filtroGravidade]);

  // -------------------------------------------------------------------------
  // 4 TABELAS DO DETALHAMENTO ANALÍTICO (RESUMO RÁPIDO PARA GESTÃO CCO)
  // -------------------------------------------------------------------------

  // 1. Alerta de Reincidência (Provisórios)
  // Colunas: Nome do Colaborador, Empresa, Qtd de Acessos no Mês
  const tabelaReincidentes = useMemo(() => {
    const listaProv = Array.isArray(provisoriosFiltrados) ? provisoriosFiltrados : [];
    const mapa = new Map();
    listaProv.forEach(p => {
      if (!p) return;
      const nome = (p.colaborador || p.nome || '').trim().toUpperCase();
      if (!nome) return;
      const itemExistente = mapa.get(nome);
      if (itemExistente) {
        itemExistente.totalAcessos += 1;
        if ((!itemExistente.empresa || itemExistente.empresa === 'NÃO INFORMADA') && p.empresa) {
          itemExistente.empresa = p.empresa;
        }
      } else {
        mapa.set(nome, {
          nome: p.colaborador || p.nome,
          empresa: p.empresa || 'NÃO INFORMADA',
          totalAcessos: 1
        });
      }
    });

    const lista = Array.from(mapa.values())
      .sort((a, b) => b.totalAcessos - a.totalAcessos);

    return lista.slice(0, 5);
  }, [provisoriosFiltrados]);

  // 2. Inadimplência de Credenciais (Perdidos não pagos)
  // Colunas: Nome, Empresa, Data da Perda
  const tabelaInadimplentes = useMemo(() => {
    const listaRfid = Array.isArray(rfidFiltrados) ? rfidFiltrados : [];
    const perdidosNaoPagos = listaRfid.filter(r => r && r.status === 'PERDIDO');
    if (perdidosNaoPagos.length > 0) {
      return perdidosNaoPagos.slice(0, 5).map(r => ({
        id: r.id || r.codigoRfid,
        nome: r.colaborador || 'PORTADOR NÃO IDENTIFICADO',
        empresa: r.empresa || 'TERCEIRO',
        dataPerda: r.dataPerda || r.dataLiberacao || '2026-01-01',
        cartao: r.tipo === 'ROTATIVO' ? (r.numeroRotativo || `Rotativo ${r.numeroRotativoIdx || ''}`) : (r.codigoImpresso || 'Fixo Nominal'),
        itemOriginal: r
      }));
    }

    return [];
  }, [rfidFiltrados]);

  // 3. Produtividade CCO (Ocorrências)
  // Colunas: Operador CCO, Total de ROs Emitidos
  const tabelaProdutividade = useMemo(() => {
    if (totalOcorrencias === 0) return [];

    const listaOps = Array.isArray(listaOperadores) ? listaOperadores : [];
    const listaOc = Array.isArray(ocorrenciasFiltradas) ? ocorrenciasFiltradas : [];
    const mapa = new Map();
    listaOps.forEach(op => {
      mapa.set(op, 0);
    });

    listaOc.forEach((o) => {
      if (!o) return;
      const op = o.operador || o.vigilante || 'Operador CCO';
      const atual = mapa.get(op) || 0;
      mapa.set(op, atual + 1);
    });

    const lista = Array.from(mapa.entries())
      .filter(([_, total]) => total > 0)
      .map(([operador, total]) => ({
        operador,
        total,
        porcentagem: totalOcorrencias > 0 ? Math.round((total / totalOcorrencias) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    return lista;
  }, [ocorrenciasFiltradas, listaOperadores, totalOcorrencias]);

  // 4. Cartões Provisórios Pendentes
  // Colunas: Nome, Portaria, Hora Retirada
  const tabelaPendentes = useMemo(() => {
    const listaProv = Array.isArray(provisoriosFiltrados) ? provisoriosFiltrados : [];
    const pendentes = listaProv.filter(p => 
      p && (
        p.situacao === 'NÃO DEVOLVIDO' || 
        p.situacao === 'NAO_DEVOLVIDO' || 
        p.status === 'NAO_DEVOLVIDO' || 
        p.status === 'Pendente'
      )
    );

    if (pendentes.length > 0) {
      return pendentes.slice(0, 5).map(p => ({
        id: p.id || p.cartao,
        nome: p.colaborador || p.nome || '-',
        portaria: p.portaria || 'P1',
        horaRetirada: p.horaRetirada || '00:00',
        cartao: p.cartao || '-',
        empresa: p.empresa || '-'
      }));
    }

    return [];
  }, [provisoriosFiltrados]);

  const listaProv = Array.isArray(provisoriosFiltrados) ? provisoriosFiltrados : [];
  const listaVis = Array.isArray(visitantesFiltrados) ? visitantesFiltrados : [];
  const listaRfid = Array.isArray(rfidFiltrados) ? rfidFiltrados : [];

  const provisoriosPendentes = listaProv.filter(p => 
    p && (
      p.situacao === 'NÃO DEVOLVIDO' || 
      p.situacao === 'NAO_DEVOLVIDO' || 
      p.status === 'NAO_DEVOLVIDO' || 
      p.status === 'Pendente'
    )
  );
  const totalPendentes = provisoriosPendentes.length;
  const pendentesP1 = provisoriosPendentes.filter(p => p.portaria === 'P1').length;
  const pendentesP2 = provisoriosPendentes.filter(p => p.portaria === 'P2').length;

  const reincidentes = (Array.isArray(tabelaReincidentes) ? tabelaReincidentes : []).filter(r => r && r.totalAcessos >= 3);
  const taxaReincidencia = listaProv.length > 0
    ? ((reincidentes.length / listaProv.length) * 100).toFixed(1)
    : '0.0';

  const rfidPerdidos = listaRfid.filter(r => r && (r.status === 'PERDIDO' || r.status === 'PAGO')).length;
  const rfidPagos = listaRfid.filter(r => r && r.status === 'PAGO').length;
  const rfidIsentosBO = listaRfid.filter(r => r && r.status === 'ISENTO_BO').length;
  const pctPagos = rfidPerdidos > 0 ? Math.round((rfidPagos / rfidPerdidos) * 100) : 0;

  // Total de credenciais que sofreram emissão/vínculo ativo no período selecionado
  const rfidAtivadosPeriodo = useMemo(() => {
    return listaRfid.filter(r => {
      if (!r) return false;
      const temVinculoHistorico = Array.isArray(r.historico) && r.historico.some(h => {
        if (!h || !h.data) return false;
        const d = String(h.data).substring(0, 10);
        return matchPeriodo(d) && (h.tipo === 'VINCULO' || h.tipo === 'EMISSAO' || h.tipo === 'CADASTRO_ATIVO');
      });
      if (temVinculoHistorico) return true;
      if (r.status === 'ATIVO' && r.dataLiberacao && matchPeriodo(r.dataLiberacao)) {
        const colab = (r.colaborador || '').toUpperCase();
        return !colab.includes('ESTOQUE') && !colab.includes('DISPONIVEL');
      }
      return false;
    }).length;
  }, [listaRfid, periodo, dataInicio, dataFim]);

  const provP1Total = listaProv.filter(p => p && p.portaria === 'P1').length;
  const provP2Total = listaProv.filter(p => p && p.portaria === 'P2').length;
  const visP1Total = listaVis.filter(v => v && v.portaria === 'P1').length;
  const visP2Total = listaVis.filter(v => v && v.portaria === 'P2').length;

  const totalLibP1 = provP1Total + visP1Total;
  const totalLibP2 = provP2Total + visP2Total;
  const totalGeralLib = totalLibP1 + totalLibP2;
  const pctP1 = totalGeralLib > 0 ? Math.round((totalLibP1 / totalGeralLib) * 100) : 0;
  const pctP2 = totalGeralLib > 0 ? Math.round((totalLibP2 / totalGeralLib) * 100) : 0;

  // Métricas calculadas para os Destaques de Resolução
  const tempoMedioResposta = useMemo(() => {
    if (totalOcorrencias === 0) return '--';
    const minutos = Math.round((criticas * 10 + altas * 15 + medias * 20 + baixas * 30) / totalOcorrencias);
    return `${minutos} min`;
  }, [totalOcorrencias, criticas, altas, medias, baixas]);

  const comFotosFormalizadas = useMemo(() => {
    if (totalOcorrencias === 0) return '--';
    const comFotos = (Array.isArray(ocorrenciasFiltradas) ? ocorrenciasFiltradas : []).filter(o => o && o.fotos && o.fotos.length > 0).length;
    const pct = Math.round((comFotos / totalOcorrencias) * 100);
    return `${pct}% (${comFotos}/${totalOcorrencias})`;
  }, [totalOcorrencias, ocorrenciasFiltradas]);

  // Rankings e resumos analíticos exclusivos de Ocorrências
  const ocorrenciasPorPredio = useMemo(() => {
    const lista = Array.isArray(ocorrenciasFiltradas) ? ocorrenciasFiltradas : [];
    const mapa = new Map();
    lista.forEach(o => {
      if (!o) return;
      const predio = (o.predio || o.local || 'Não Informado').trim();
      mapa.set(predio, (mapa.get(predio) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([predio, total]) => ({
        predio,
        total,
        porcentagem: totalOcorrencias > 0 ? Math.round((total / totalOcorrencias) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [ocorrenciasFiltradas, totalOcorrencias]);

  const ocorrenciasPorTopico = useMemo(() => {
    const lista = Array.isArray(ocorrenciasFiltradas) ? ocorrenciasFiltradas : [];
    const mapa = new Map();
    lista.forEach(o => {
      if (!o) return;
      const topico = (o.topico || o.natureza || o.categoria || 'Operacional / Geral').trim();
      mapa.set(topico, (mapa.get(topico) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([topico, total]) => ({
        topico,
        total,
        porcentagem: totalOcorrencias > 0 ? Math.round((total / totalOcorrencias) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [ocorrenciasFiltradas, totalOcorrencias]);

  const ultimasOcorrencias = useMemo(() => {
    const lista = Array.isArray(ocorrenciasFiltradas) ? [...ocorrenciasFiltradas] : [];
    return lista
      .sort((a, b) => {
        const dataA = `${a?.data || ''} ${a?.hora || ''}`;
        const dataB = `${b?.data || ''} ${b?.hora || ''}`;
        return dataB.localeCompare(dataA);
      })
      .slice(0, 5);
  }, [ocorrenciasFiltradas]);

  const pctVisitantesAnfitriao = useMemo(() => {
    if (listaVis.length === 0) return '--';
    const comAnfitriao = listaVis.filter(v => v && v.anfitriao && String(v.anfitriao).trim() !== '').length;
    return `${Math.round((comAnfitriao / listaVis.length) * 100)}%`;
  }, [listaVis]);

  // =========================================================================
  // MÉTRICAS DEDICADAS DO DASHBOARD 2: PROVISÓRIOS / MOVIMENTAÇÃO
  // =========================================================================
  const metricasProvisorios = useMemo(() => {
    const lista = Array.isArray(provisoriosFiltrados) ? provisoriosFiltrados : [];
    const hojeStr = new Date().toISOString().split('T')[0];

    // Cautelas ativas (não devolvidas e não perdidas)
    const cautelasAtivas = lista.filter(p => 
      p && (p.situacao === 'NÃO DEVOLVIDO' || p.situacao === 'NAO_DEVOLVIDO' || p.status === 'NAO_DEVOLVIDO' || p.status === 'Pendente') &&
      !(p.situacao === 'PERDIDO' || p.status === 'PERDIDO' || p.observacao === 'PERDEU')
    );

    // Devolvidos hoje
    const devolvidosHoje = lista.filter(p => 
      p && (p.situacao === 'DEVOLVIDO' || p.status === 'DEVOLVIDO') && 
      (p.dataDevolucao === hojeStr || (p.horaDevolucao && p.dataRetirada === hojeStr))
    );

    // Escaninho Físico (20 slots totais: 10 P1 [01-10] + 10 P2 [11-20])
    const ocupadosP1 = cautelasAtivas.filter(p => p.portaria === 'P1').length;
    const ocupadosP2 = cautelasAtivas.filter(p => p.portaria === 'P2').length;
    const totalSlotsOcupados = ocupadosP1 + ocupadosP2;
    const taxaOcupacaoEscaninho = Math.min(100, Math.round((totalSlotsOcupados / 20) * 100));

    // Bloco Financeiro / Perdas Provisórios
    const perdidos = lista.filter(p => p && (p.situacao === 'PERDIDO' || p.status === 'PERDIDO' || (p.situacao === 'NÃO DEVOLVIDO' && p.observacao === 'PERDEU')));
    const pagos = lista.filter(p => p && (p.situacao === 'PAGO' || p.status === 'PAGO'));
    const isentos = lista.filter(p => p && (p.situacao === 'ISENTO_BO' || p.status === 'ISENTO_BO'));
    const totalPerdas = perdidos.length;
    const totalPagos = pagos.length;
    const totalIsentos = isentos.length;
    const valorACobrar = totalPerdas * TAXA_SEGUNDA_VIA;
    const valorRecuperado = totalPagos * TAXA_SEGUNDA_VIA;
    const pctRessarcimento = (totalPerdas + totalPagos) > 0 
      ? Math.round((totalPagos / (totalPerdas + totalPagos)) * 100) 
      : 100;

    return {
      cautelasAtivas,
      totalCautelasAtivas: cautelasAtivas.length,
      devolvidosHoje,
      totalDevolvidosHoje: devolvidosHoje.length,
      ocupadosP1,
      ocupadosP2,
      totalSlotsOcupados,
      taxaOcupacaoEscaninho,
      perdidos,
      pagos,
      isentos,
      totalPerdas,
      totalPagos,
      totalIsentos,
      valorACobrar,
      valorRecuperado,
      pctRessarcimento
    };
  }, [provisoriosFiltrados]);

  // =========================================================================
  // MÉTRICAS DEDICADAS DO DASHBOARD 3: VISITANTES / PORTARIAS
  // =========================================================================
  const metricasVisitantes = useMemo(() => {
    const lista = Array.isArray(visitantesFiltrados) ? visitantesFiltrados : [];
    const hojeStr = new Date().toISOString().split('T')[0];

    // Visitantes no site em tempo real
    const noSite = lista.filter(v => 
      v && (v.situacao === 'NÃO DEVOLVIDO' || v.situacao === 'NAO_DEVOLVIDO' || v.status === 'NAO_DEVOLVIDO') &&
      v.situacao !== 'PERDIDO'
    );

    // Fluxo do dia
    const entradasHoje = lista.filter(v => v && v.dataEntrada === hojeStr);
    const saidasHoje = lista.filter(v => v && (v.dataSaida === hojeStr || (v.situacao === 'DEVOLVIDO' && v.dataEntrada === hojeStr)));

    // Auditoria de vínculos com anfitrião
    const comAnfitriao = lista.filter(v => v && v.anfitriao && String(v.anfitriao).trim() !== '');
    const pctAuditados = lista.length > 0 ? Math.round((comAnfitriao.length / lista.length) * 100) : 100;

    // Escaninho de Visitantes (40 slots totais: 20 P1 [01-20] + 20 P2 [21-40])
    const noSiteP1 = noSite.filter(v => v.portaria === 'P1').length;
    const noSiteP2 = noSite.filter(v => v.portaria === 'P2').length;
    const taxaOcupacaoEscaninhoVis = Math.min(100, Math.round((noSite.length / 40) * 100));

    // Bloco Financeiro / Crachás de Visitantes (Perdidos vs. Ressarcidos)
    const perdidos = lista.filter(v => v && v.situacao === 'PERDIDO');
    const pagos = lista.filter(v => v && v.situacao === 'PAGO');
    const isentos = lista.filter(v => v && (v.situacao === 'ISENTO_BO' || v.situacao === 'ISENTO'));
    const totalPerdidos = perdidos.length;
    const totalPagos = pagos.length;
    const totalIsentos = isentos.length;
    const valorACobrar = totalPerdidos * TAXA_SEGUNDA_VIA;
    const valorRecuperado = totalPagos * TAXA_SEGUNDA_VIA;
    const pctRessarcimento = (totalPerdidos + totalPagos) > 0 
      ? Math.round((totalPagos / (totalPerdidos + totalPagos)) * 100) 
      : 100;

    // Auditoria de Anfitriões (Agrupamento e contagem)
    const mapaAnfitrioes = new Map();
    lista.forEach(v => {
      const anf = (v.anfitriao || 'NÃO VINCULADO').trim().toUpperCase();
      if (!mapaAnfitrioes.has(anf)) {
        mapaAnfitrioes.set(anf, { anfitriao: anf, total: 0, noSite: 0, empresa: v.empresa || '-' });
      }
      const item = mapaAnfitrioes.get(anf);
      item.total += 1;
      if (v.situacao === 'NÃO DEVOLVIDO' || v.situacao === 'NAO_DEVOLVIDO') {
        item.noSite += 1;
      }
    });
    const listaAnfitrioes = Array.from(mapaAnfitrioes.values()).sort((a, b) => b.total - a.total);

    return {
      noSite,
      totalNoSite: noSite.length,
      entradasHoje: entradasHoje.length,
      saidasHoje: saidasHoje.length,
      comAnfitriao: comAnfitriao.length,
      pctAuditados,
      noSiteP1,
      noSiteP2,
      taxaOcupacaoEscaninhoVis,
      perdidos,
      pagos,
      isentos,
      totalPerdidos,
      totalPagos,
      totalIsentos,
      valorACobrar,
      valorRecuperado,
      pctRessarcimento,
      listaAnfitrioes
    };
  }, [visitantesFiltrados]);

  // =========================================================================
  // MÉTRICAS DEDICADAS DO DASHBOARD 4: RFID & CONTABILIDADE FINANCEIRA
  // =========================================================================
  const metricasRfidContabilidade = useMemo(() => {
    const lista = Array.isArray(rfidFiltrados) ? rfidFiltrados : [];

    // Inventário Rotativos (01 a 350)
    const rotativos = lista.filter(r => r && r.tipo === 'ROTATIVO');
    const rotativosAtivos = rotativos.filter(r => r.status === 'ATIVO').length;
    const rotativosDisponiveis = rotativos.filter(r => r.status === 'DISPONIVEL').length;
    const rotativosPerdidos = rotativos.filter(r => r.status === 'PERDIDO').length;
    const rotativosPagos = rotativos.filter(r => r.status === 'PAGO').length;

    // Fixos Nominais
    const fixos = lista.filter(r => r && r.tipo === 'FIXO');
    const fixosAtivos = fixos.filter(r => r.status === 'ATIVO').length;
    const fixosDisponiveis = fixos.filter(r => r.status === 'DISPONIVEL').length;
    const fixosPerdidos = fixos.filter(r => r.status === 'PERDIDO').length;
    const fixosPagos = fixos.filter(r => r.status === 'PAGO').length;

    // CONSOLIDAÇÃO MULTI-MÓDULOS (RFID + VISITANTES + PROVISÓRIOS)
    // 1. RFID
    const pendenciasRfid = lista.filter(r => r && r.status === 'PERDIDO').map(r => ({
      id: r.id,
      modulo: 'RFID',
      colaborador: r.colaborador || 'Não informado',
      empresa: (r.empresa || 'NÃO ESPECIFICADA').trim().toUpperCase(),
      cartao: r.tipo === 'ROTATIVO' ? (r.numeroRotativo || `Rotativo ${r.numeroRotativoIdx || ''}`) : (r.codigoImpresso || r.codigoRfid || 'Fixo Nominal'),
      dataPerda: r.dataPerda || r.dataLiberacao || '2026-09-01',
      valor: TAXA_SEGUNDA_VIA,
      itemOriginal: r
    }));

    // 2. Provisórios
    const provsPerdidos = (Array.isArray(provisoriosFiltrados) ? provisoriosFiltrados : []).filter(p => 
      p && (p.situacao === 'PERDIDO' || p.status === 'PERDIDO' || (p.situacao === 'NÃO DEVOLVIDO' && p.observacao === 'PERDEU'))
    ).map(p => ({
      id: p.id,
      modulo: 'PROVISÓRIO',
      colaborador: p.colaborador || p.nome || 'Não informado',
      empresa: (p.empresa || 'NÃO ESPECIFICADA').trim().toUpperCase(),
      cartao: `PROV-${p.cartao || ''}`,
      dataPerda: p.dataPerda || p.dataRetirada || '2026-09-01',
      valor: TAXA_SEGUNDA_VIA,
      itemOriginal: p
    }));

    // 3. Visitantes
    const visPerdidos = (Array.isArray(visitantesFiltrados) ? visitantesFiltrados : []).filter(v => 
      v && v.situacao === 'PERDIDO'
    ).map(v => ({
      id: v.id,
      modulo: 'VISITANTE',
      colaborador: v.visitante || 'Visitante',
      empresa: (v.empresa || 'NÃO ESPECIFICADA').trim().toUpperCase(),
      cartao: `VIS-${v.cartao || ''}`,
      dataPerda: v.dataPerda || v.dataEntrada || '2026-09-01',
      valor: TAXA_SEGUNDA_VIA,
      itemOriginal: v
    }));

    const todasPendencias = [...pendenciasRfid, ...provsPerdidos, ...visPerdidos];

    // Totais Consolidados Multi-Módulos
    const totalItensACobrar = todasPendencias.length;
    const totalValorACobrar = totalItensACobrar * TAXA_SEGUNDA_VIA;

    // Quitados / Pagos em cada módulo
    const totalItensPagos = (metricasProvisorios.totalPagos || 0) + (metricasVisitantes.totalPagos || 0) + (rotativosPagos + fixosPagos);
    const totalValorRecuperado = totalItensPagos * TAXA_SEGUNDA_VIA;

    // Isenções B.O.
    const totalIsentosBO = (metricasProvisorios.totalIsentos || 0) + (metricasVisitantes.totalIsentos || 0) + (lista.filter(r => r && r.status === 'ISENTO_BO').length);

    // Eficácia de Recuperação
    const taxaEficacia = (totalItensACobrar + totalItensPagos) > 0 
      ? Math.round((totalItensPagos / (totalItensACobrar + totalItensPagos)) * 100) 
      : 100;

    // Agrupamento por Empresa para Cobrança / Faturamento
    const mapaEmpresas = new Map();
    todasPendencias.forEach(p => {
      const emp = p.empresa || 'NÃO ESPECIFICADA';
      if (!mapaEmpresas.has(emp)) {
        mapaEmpresas.set(emp, {
          empresa: emp,
          totalItens: 0,
          valorTotal: 0,
          itens: [],
          porModulo: { RFID: 0, PROVISÓRIO: 0, VISITANTE: 0 }
        });
      }
      const reg = mapaEmpresas.get(emp);
      reg.totalItens += 1;
      reg.valorTotal += p.valor;
      reg.itens.push(p);
      if (reg.porModulo[p.modulo] !== undefined) {
        reg.porModulo[p.modulo] += 1;
      }
    });
    const resumoCobrancaEmpresas = Array.from(mapaEmpresas.values()).sort((a, b) => b.valorTotal - a.valorTotal);

    return {
      rotativosTotal: rotativos.length,
      rotativosAtivos,
      rotativosDisponiveis,
      rotativosPerdidos,
      rotativosPagos,
      fixosTotal: fixos.length,
      fixosAtivos,
      fixosDisponiveis,
      fixosPerdidos,
      fixosPagos,
      todasPendencias,
      totalItensACobrar,
      totalValorACobrar,
      totalItensPagos,
      totalValorRecuperado,
      totalIsentosBO,
      taxaEficacia,
      resumoCobrancaEmpresas
    };
  }, [rfidFiltrados, provisoriosFiltrados, visitantesFiltrados, metricasProvisorios, metricasVisitantes]);

  // Handlers de Quitação Rápida por Módulo
  const handleQuitarProvisorio = (id) => {
    marcarProvisorioComoPago(provisoriosBase, id);
    showToast('✓ Credencial provisória marcada como PAGA / Ressarcida!', 'success');
  };

  const handleQuitarVisitante = (id) => {
    marcarVisitanteComoPago(visitantesBase, id);
    showToast('✓ Crachá de visitante marcado como PAGO / Ressarcido!', 'success');
  };

  const handleQuitarRfid = (id, cardRef) => {
    transicionarStatusCartao(rfidBase, id, 'PAGO', 'Ressarcimento de 2ª via confirmado via Dashboard Executivo');
    showToast(`✓ Cartão RFID ${cardRef || ''} marcado como PAGO / Ressarcido!`, 'success');
  };

  const handleQuitarItemConsolidado = (item) => {
    if (item.modulo === 'PROVISÓRIO') {
      handleQuitarProvisorio(item.id);
    } else if (item.modulo === 'VISITANTE') {
      handleQuitarVisitante(item.id);
    } else {
      handleQuitarRfid(item.id, item.cartao);
    }
  };

  // Salvar em PDF: 100% idêntico ao motor de impressão limpa
  const handleExportarPdf = async () => {
    if (exportandoPdf) return;
    setExportandoPdf(true);
    try {
      showToast('Processando documento e gerando PDF idêntico à impressão (Modo Paisagem)...', 'info');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 1. Determina o nome do módulo ativo e período no padrão estrito da especificação
      const getModuloNomeAmigavel = () => {
        switch (abaAtiva) {
          case 'd1': return 'Relatórios de Ocorrência';
          case 'd2': return 'Provisórios & Cautelas';
          case 'd3': return 'Controle de Visitantes';
          case 'd4': return 'Gestão RFID & Contabilidade';
          default: return 'Visão Consolidada';
        }
      };

      const getMesAnoLabel = () => {
        const agora = new Date();
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        let mes = meses[agora.getMonth()];
        let ano = String(agora.getFullYear());

        if (dataInicio && dataInicio.includes('-')) {
          const [anoP, mesP] = dataInicio.split('-');
          const idx = parseInt(mesP, 10) - 1;
          if (idx >= 0 && idx < 12) {
            mes = meses[idx];
            ano = anoP;
          }
        }
        return `Mês ${mes} Ano ${ano}`;
      };

      const nomeSugerido = `Dashboard Executivo de Segurança & Operações - ${getModuloNomeAmigavel()} - ${getMesAnoLabel()} (1).pdf`;

      // 2. No Electron: usa printToPDF nativo com exatamente o mesmo CSS @media print
      if (window.electronAPI && typeof window.electronAPI.salvarPdfNativo === 'function') {
        const respConfig = obterResponsaveisSincrono();
        const res = await window.electronAPI.salvarPdfNativo({ 
          nomeSugerido, 
          paisagem: true,
          caminhoRede: respConfig?.caminhoRede
        });
        if (res && res.sucesso) {
          const pastaAlvo = res.diretorio || res.caminho;
          showToast(
            `✓ PDF gerado com sucesso (${res.nomeArquivo})! [Salvo em: ${pastaAlvo}]`, 
            'success',
            window.electronAPI?.abrirPasta ? {
              label: 'Abrir Pasta',
              onClick: () => window.electronAPI.abrirPasta(pastaAlvo)
            } : null
          );
          return;
        }
      }

      // 2. No navegador ou fallback: abre diálogo nativo de impressão
      showToast('Abrindo diálogo de impressão (Selecione "Salvar como PDF")...', 'info');
      setTimeout(() => {
        window.print();
      }, 250);
    } catch (err) {
      console.error('Erro ao gerar PDF no Dashboard:', err);
      showToast(`Aviso: ${err.message || 'Falha na exportação'}. Abrindo diálogo de impressão...`, 'warning');
      setTimeout(() => {
        window.print();
      }, 250);
    } finally {
      setExportandoPdf(false);
    }
  };

  // Exportar Base de Dados Filtrada em Excel (.xlsx)
  const handleExportarExcel = async () => {
    setExportandoExcel(true);
    try {
      showToast('Consolidando tabelas e gerando planilha Excel (.xlsx)...', 'info');
      const res = await exportarBaseConsolidadaExcel({
        periodoNome: getPeriodoLabel(),
        filtros: { 
          periodo, 
          dataInicio, 
          dataFim, 
          predio: filtroPredio, 
          area: filtroArea, 
          topico: filtroTopico, 
          empresa: filtroEmpresa 
        },
        operador: operadorAtivo,
        dadosConsolidados: {
          ocorrencias: ocorrenciasFiltradas,
          provisorios: provisoriosFiltrados,
          visitantes: visitantesFiltrados,
          rfid: rfidFiltrados,
          tabelasAnaliticas: {
            reincidentes: tabelaReincidentes,
            inadimplentes: tabelaInadimplentes,
            produtividade: tabelaProdutividade,
            pendentes: tabelaPendentes
          },
          metricasProvisorios,
          metricasVisitantes,
          metricasRfidContabilidade
        }
      });
      if (res.warnings && res.warnings.length > 0) {
        showToast(`✓ Planilha gerada em Documentos! ${res.warnings[0]}`, 'warning');
      } else {
        showToast(`✓ Planilha consolidada gerada e salva com sucesso (${res.nomeArquivo})!`, 'success');
      }
    } catch (err) {
      console.error('Erro ao exportar Excel no Dashboard:', err);
      showToast(`Erro ao gerar Excel: ${err.message || 'Verifique o console.'}`, 'error');
    } finally {
      setExportandoExcel(false);
    }
  };

  // Dispara Impressão Nativa (Forçada em Paisagem via CSS)
  const handleImprimir = () => {
    window.print();
  };

  const limparFiltros = () => {
    setPeriodo('mes_atual');
    setDataInicio('2026-09-01');
    setDataFim('2026-09-30');
    setFiltroPredio('TODOS');
    setFiltroArea('TODAS');
    setFiltroTopico('TODOS');
    setFiltroGravidade('TODAS');
    setFiltroEmpresa('TODAS');
    showToast('Filtros restaurados para os valores padrão.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 print:space-y-0 print:p-0 print:m-0 print:w-full print:max-w-full">

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-2xl animate-in slide-in-from-bottom-5 no-print print:hidden max-w-xl">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium truncate" title={toast.mensagem}>{toast.mensagem}</span>
          {toast.acao && (
            <button
              type="button"
              onClick={toast.acao.onClick}
              className="ml-auto px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              {toast.acao.label}
            </button>
          )}
        </div>
      )}

      {/* BANNER DE CABEÇALHO DO PAINEL EXECUTIVO NA TELA (OCULTO NA IMPRESSÃO PARA EVITAR DUPLICIDADE) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-6 shadow-xl no-print print:hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none no-print"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/25 text-blue-100 border border-blue-400/40">
                <Shield className="w-3 h-3 text-blue-300" />
                Painel Gerencial
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Planta Operacional • Tempo Real
              </span>
              <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2.5">
                <span className="text-[11px] text-slate-300 font-semibold">Operador CCO:</span>
                <select
                  value={operadorAtivo}
                  onChange={(e) => onChangeOperador && onChangeOperador(e.target.value)}
                  className="bg-slate-950/90 border border-slate-700 hover:border-blue-500/80 rounded px-2 py-0.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="Alterar Operador CCO Ativo"
                >
                  {listaOperadores.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2.5">
                <Clock className="w-3 h-3 text-blue-300" />
                <span className="text-[11px] text-slate-300 font-semibold">Turno:</span>
                <select
                  value={turnoAtivo}
                  onChange={(e) => handleTrocarTurno(e.target.value)}
                  className="bg-slate-950/90 border border-slate-700 hover:border-blue-500/80 rounded px-2 py-0.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="Alterar Turno Operacional Ativo"
                >
                  {listaTurnos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              Dashboard Executivo de Segurança & Operações
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed print:hidden">
              Consolidação estratégica: ocorrências, credenciais provisórias, controle de visitantes e inventário RFID.
            </p>
          </div>

          {/* BOTÕES DE EXPORTAÇÃO EXECUTIVA */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              onClick={handleExportarPdf}
              disabled={exportandoPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/25 hover:bg-red-600/35 text-white border border-red-400/50 text-xs font-bold transition-all shadow-lg hover:shadow-red-600/20 hover:border-red-300 disabled:opacity-50 cursor-pointer"
              title={
                abaAtiva === 'todas'
                  ? 'Salvar Relatório Executivo Completo em PDF (4 Páginas Paisagem)'
                  : 'Salvar Módulo Ativo em PDF (1 Página Paisagem)'
              }
            >
              {exportandoPdf ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-red-300 shrink-0" />
              )}
              <span>
                {exportandoPdf
                  ? 'Gerando PDF...'
                  : abaAtiva === 'todas'
                  ? 'Salvar em PDF'
                  : 'Salvar Módulo em PDF'}
              </span>
            </button>

            <button
              onClick={handleExportarExcel}
              disabled={exportandoExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-white border border-emerald-400/50 text-xs font-bold transition-all shadow-lg hover:shadow-emerald-600/20 hover:border-emerald-300 disabled:opacity-50 cursor-pointer"
              title="Exportar Base de Dados Filtrada em Excel (.xlsx) e salvar em CCO/exports"
            >
              {exportandoExcel ? (
                <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
              )}
              <span>{exportandoExcel ? 'Gerando Excel...' : 'Base Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-semibold transition-all cursor-pointer"
              title={
                abaAtiva === 'todas'
                  ? 'Imprimir visualização gerencial completa (4 Páginas Paisagem)'
                  : 'Imprimir módulo selecionado (1 Página Paisagem)'
              }
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span className="hidden sm:inline">
                {abaAtiva === 'todas' ? 'Imprimir' : 'Imprimir Módulo'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE FILTROS INTELIGENTES SEGREGADOS POR CONTEXTO (OCULTO NA IMPRESSÃO) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg transition-all no-print print:hidden">
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Barra de Filtros Inteligente
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-100 border border-blue-400/40 font-bold">
              {getPeriodoLabel()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Restaurar todos os filtros para os valores padrão"
            >
              <RotateCcw className="w-3 h-3 text-slate-300" />
              <span>Redefinir Filtros</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              className="text-xs text-blue-300 hover:text-blue-200 font-bold px-2 py-1 rounded hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              {filtrosAbertos ? 'Recolher Filtros' : 'Expandir Filtros'}
            </button>
          </div>
        </div>

        {filtrosAbertos && (
          <div className="p-5 space-y-4">
            {/* Bloco 1: Filtro Temporal (Global) */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  1. Filtro Temporal (Afeta Todos os Indicadores)
                </span>
                <span className="text-[10px] text-slate-300 font-semibold">Período Operacional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 mb-1 block">Seleção de Período</label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="hoje">Hoje</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes_atual">Mês Atual (Setembro 2026)</option>
                    <option value="ultimos_30">Últimos 30 Dias</option>
                    <option value="ano_2026">Ano 2026</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                <div className="md:col-span-1 lg:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-300 mb-1 block">Intervalo de Datas (Início - Fim)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full min-w-[130px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full min-w-[130px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Divisão em 2 Contextos com Separação Lógica Estrita */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bloco 2: Contexto Ocorrências (RO) */}
              <div className="lg:col-span-2 p-4 rounded-xl bg-blue-950/10 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      2. Filtros de Ocorrências (RO)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Afeta APENAS Ocorrências
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Prédio */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-200 mb-1 block uppercase">
                      Prédio (Local)
                    </label>
                    <select
                      value={filtroPredio}
                      onChange={(e) => {
                        setFiltroPredio(e.target.value);
                        setFiltroArea('TODAS');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/60 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      <option value="TODOS">Todos os Prédios (17)</option>
                      {PREDIOS_CCO.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Área */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-200 mb-1 block uppercase flex items-center justify-between">
                      <span>Área / Setor</span>
                      {filtroPredio !== 'TODOS' && (
                        <span className="text-[9px] text-blue-400 font-mono">
                          ({areasFiltroDisponiveis.length})
                        </span>
                      )}
                    </label>
                    <select
                      value={filtroArea}
                      onChange={(e) => setFiltroArea(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/60 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      <option value="TODAS">
                        {filtroPredio !== 'TODOS' ? `Todas as Áreas (${areasFiltroDisponiveis.length})` : 'Todas as Áreas'}
                      </option>
                      {areasFiltroDisponiveis.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tópico de Ocorrência */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-200 mb-1 block uppercase">
                      Tópico de Ocorrência
                    </label>
                    <select
                      value={filtroTopico}
                      onChange={(e) => setFiltroTopico(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/60 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      <option value="TODOS">Todos os Tópicos (16)</option>
                      {TOPICOS_OCORRENCIA.map((top) => (
                        <option key={top} value={top}>{top}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gravidade / Severidade */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-200 mb-1 block uppercase">
                      Gravidade / Severidade
                    </label>
                    <select
                      value={filtroGravidade}
                      onChange={(e) => setFiltroGravidade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/60 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      <option value="TODAS">Todas as Gravidades</option>
                      {GRAVIDADES_CCO.map((grav) => (
                        <option key={grav} value={grav}>{grav}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Contexto Credenciais & Visitantes */}
              <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-500/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        3. Credenciais & Visitantes
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Afeta APENAS Credenciais/Visitas
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-200 mb-1 block uppercase">
                      Empresa do Colaborador / Visitante
                    </label>
                    <select
                      value={filtroEmpresa}
                      onChange={(e) => setFiltroEmpresa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/60 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer truncate"
                    >
                      <option value="TODAS">Todas as Empresas</option>
                      {EMPRESAS_CCO.map((emp) => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-tight pt-2 border-t border-slate-800/80">
                  Filtra os cartões provisórios pendentes, taxa de reincidência e acessos de visitantes da empresa selecionada.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SELETOR DE ABAS DOS DASHBOARDS (OCULTO NA IMPRESSÃO) */}
      <div className="flex items-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl no-print print:hidden overflow-x-auto">
        <button
          type="button"
          onClick={() => setAbaAtiva('todas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            abaAtiva === 'todas'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Visão Completa (Todos os 4 Dashboards Paisagem)</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('d1')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            abaAtiva === 'd1'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>1. Ocorrências</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('d2')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            abaAtiva === 'd2'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>2. Provisórios & Cautelas</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('d3')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            abaAtiva === 'd3'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>3. Visitantes & Portarias</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('d4')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            abaAtiva === 'd4'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>4. RFID & Contabilidade</span>
        </button>
      </div>

      {/* CONTEÚDO INTERATIVO DO DASHBOARD NA TELA (OCULTO NA IMPRESSÃO E NO PDF) */}
      <div className="print:hidden space-y-6">

      {/* =========================================================================
          DASHBOARD 1: OCORRÊNCIAS & SEGURANÇA PATRIMONIAL (PÁGINA 1 DEDICADA EM MODO PAISAGEM)
         ========================================================================= */}
      <div className={`dashboard-page-landscape dashboard-page-1 ${abaAtiva === 'd1' ? 'dashboard-page-single' : ''} w-full max-w-full p-6 print:px-6 print:py-1 bg-slate-950/30 rounded-2xl border border-slate-800/80 print:border-none print:bg-transparent space-y-6 print:space-y-1 mb-8 print:mb-0 ${
        abaAtiva === 'todas' || abaAtiva === 'd1' ? 'block' : 'hidden'
      }`}>
        {/* Cabeçalho da Página 1 */}
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                  {abaAtiva === 'todas' ? 'Página 1 de 4' : 'Módulo 1 • Ocorrências'}
                </span>
                <span className="text-xs font-semibold text-slate-400">CCO Security Suite</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                DASHBOARD 1: OCORRÊNCIAS & SEGURANÇA PATRIMONIAL
              </h2>
            </div>
          </div>

          {/* Informações do Operador - Canto Superior Direito Compacto e Limpo */}
          <div className="header-operador-compacto flex flex-col items-end text-right shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="text-slate-400 font-normal">Operador:</span>
              <span className="font-mono text-slate-100 uppercase">{operadorAtivo}</span>
              {turnoAtivo && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold">
                  {turnoAtivo}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
              <span>{getPeriodoLabel()}</span>
              <span className="text-slate-600">•</span>
              <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

          {/* 4 CARDS PRINCIPAIS DE INDICADORES (EXCLUSIVOS DE OCORRÊNCIAS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print-dashboard-kpis print:grid print:grid-cols-4 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
            {/* CARD 1: OCORRÊNCIAS NO PERÍODO */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
                <FileText className="w-20 h-20 text-blue-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Total de Ocorrências
                </span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 print:hidden">
                  <FileText className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">{totalOcorrencias}</span>
                <span className="text-xs font-semibold text-emerald-400 inline-flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  Filtradas
                </span>
              </div>

              <p className="text-xs text-slate-200 mt-1 truncate" title={`${criticas} Críticas • ${altas} Altas • ${medias} Médias • ${baixas} Baixas`}>
                {criticas} Críticas • {altas} Altas • {medias} Médias • {baixas} Baixas
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/25 text-blue-100 border border-blue-400/50 shadow-sm">
                  100% com RO formal
                </span>
                <button
                  onClick={() => onNavigate && onNavigate('ocorrencias')}
                  className="inline-flex items-center gap-1 text-blue-300 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  <span>Abrir RO</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CARD 2: CRÍTICAS & GRAVES */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
                <AlertTriangle className="w-20 h-20 text-red-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Críticas & Graves
                </span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 print:hidden">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-red-400 font-mono">{criticas + altas}</span>
                <span className="text-xs font-bold text-red-100 px-1.5 py-0.5 rounded bg-red-500/25 border border-red-400/50">
                  {pctCritica + pctAlta}% Urgentes
                </span>
              </div>

              <p className="text-xs text-slate-200 mt-1 truncate" title={`${criticas} Crítica(s) imediata(s) • ${altas} Alta severidade`}>
                {criticas} Crítica(s) imediata(s) • {altas} Alta severidade
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
                <span className="text-[11px] text-slate-200 font-medium">Ação imediata requerida</span>
                <button
                  onClick={() => onNavigate && onNavigate('ocorrencias')}
                  className="inline-flex items-center gap-1 text-red-300 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  <span>Ver Ocorrências</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CARD 3: MÉDIAS & OPERACIONAIS */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
                <ShieldAlert className="w-20 h-20 text-amber-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Médias & Operacionais
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:hidden">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-400 font-mono">{medias + baixas}</span>
                <span className="text-xs font-bold text-amber-100 px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/50">
                  {pctMedia + pctBaixa}% Rotina
                </span>
              </div>

              <p className="text-xs text-slate-200 mt-1 truncate" title={`${medias} Médias de rotina • ${baixas} Baixa complexidade`}>
                {medias} Médias de rotina • {baixas} Baixa complexidade
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
                <span className="text-[11px] text-slate-200 font-medium">Monitoramento e prevenção</span>
                <button
                  onClick={() => onNavigate && onNavigate('ocorrencias')}
                  className="inline-flex items-center gap-1 text-amber-300 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  <span>Ver Ocorrências</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CARD 4: RESOLUÇÃO & EVIDÊNCIAS */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
                <CheckCircle2 className="w-20 h-20 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Resolução & Fotos
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:hidden">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400 font-mono">{comFotosFormalizadas}</span>
                <span className="text-xs font-bold text-blue-100 px-1.5 py-0.5 rounded bg-blue-500/25 border border-blue-400/50">
                  {tempoMedioResposta}
                </span>
              </div>

              <p className="text-xs text-slate-200 mt-1 truncate">
                {totalOcorrencias === 0 ? 'Sem registros' : `${totalOcorrencias} relatórios formatados em PDF`}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
                <span className="text-[11px] text-slate-200 font-medium">Conformidade e arquivo</span>
                <button
                  onClick={() => onNavigate && onNavigate('ocorrencias')}
                  className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  <span>Ver Módulo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* PAINEL DE DISTRIBUIÇÃO POR GRAVIDADE & INDICADORES DE RESOLUÇÃO */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl print:border-slate-700 print:p-4 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  Distribuição de Ocorrências por Gravidade & Severidade
                </h3>
                <p className="text-xs text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span>Classificação operacional: Prédio [{filtroPredio}], Área [{filtroArea}], Tópico [{filtroTopico}]</span>
                  {filtroGravidade !== 'TODAS' && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Filtrado por: {filtroGravidade}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiltroGravidade('TODAS');
                        }}
                        className="ml-1 hover:text-white text-slate-400"
                        title="Limpar filtro de gravidade"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {filtroGravidade !== 'TODAS' && (
                  <button
                    type="button"
                    onClick={() => setFiltroGravidade('TODAS')}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
                  >
                    Ver Todas
                  </button>
                )}
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  Total: {totalOcorrencias} RO(s)
                </span>
              </div>
            </div>

            {/* 4 Barras de Gravidade em Grid Interativo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Crítica */}
              <button
                type="button"
                onClick={() => setFiltroGravidade(prev => prev === 'Crítica' ? 'TODAS' : 'Crítica')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroGravidade === 'Crítica'
                    ? 'bg-red-950/40 border-red-500/80 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-red-500/50 hover:bg-slate-900/60'
                }`}
                title="Clique para filtrar por ocorrências Críticas"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    Crítica ({criticas})
                  </span>
                  <span className="font-mono text-red-200 font-extrabold">{pctCritica}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctCritica, totalOcorrencias > 0 && criticas > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Incidente Imediato</span>
                  <span className="font-mono">{criticas} de {totalOcorrencias}</span>
                </div>
              </button>

              {/* Alta */}
              <button
                type="button"
                onClick={() => setFiltroGravidade(prev => prev === 'Alta' ? 'TODAS' : 'Alta')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroGravidade === 'Alta'
                    ? 'bg-orange-950/40 border-orange-500/80 ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-orange-500/50 hover:bg-slate-900/60'
                }`}
                title="Clique para filtrar por ocorrências de Alta gravidade"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    Alta ({altas})
                  </span>
                  <span className="font-mono text-orange-200 font-extrabold">{pctAlta}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctAlta, totalOcorrencias > 0 && altas > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Requer Apuração</span>
                  <span className="font-mono">{altas} de {totalOcorrencias}</span>
                </div>
              </button>

              {/* Média */}
              <button
                type="button"
                onClick={() => setFiltroGravidade(prev => prev === 'Média' ? 'TODAS' : 'Média')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroGravidade === 'Média'
                    ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/60'
                }`}
                title="Clique para filtrar por ocorrências Médias"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Média ({medias})
                  </span>
                  <span className="font-mono text-amber-200 font-extrabold">{pctMedia}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctMedia, totalOcorrencias > 0 && medias > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Ocorrência Padrão</span>
                  <span className="font-mono">{medias} de {totalOcorrencias}</span>
                </div>
              </button>

              {/* Baixa */}
              <button
                type="button"
                onClick={() => setFiltroGravidade(prev => prev === 'Baixa' ? 'TODAS' : 'Baixa')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroGravidade === 'Baixa'
                    ? 'bg-blue-950/40 border-blue-500/80 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/60'
                }`}
                title="Clique para filtrar por ocorrências Baixas / Leves"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Baixa ({baixas})
                  </span>
                  <span className="font-mono text-blue-200 font-extrabold">{pctBaixa}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctBaixa, totalOcorrencias > 0 && baixas > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Notificação / Leve</span>
                  <span className="font-mono">{baixas} de {totalOcorrencias}</span>
                </div>
              </button>
            </div>

            {/* Destaque de Resolução */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center print:border-slate-700">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 print:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-200">Tempo Médio de Resposta</span>
                <p className="text-sm font-mono font-bold text-white mt-0.5">{tempoMedioResposta}</p>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 print:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-200">Com Fotos / Evidências</span>
                <p className="text-sm font-mono font-bold text-blue-300 mt-0.5">{comFotosFormalizadas}</p>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 print:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-200">PDFs Salvos na Rede</span>
                <p className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
                  {totalOcorrencias === 0 ? '0 Arquivos' : `${totalOcorrencias} ${totalOcorrencias === 1 ? 'Arquivo' : 'Arquivos'}`}
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO: DETALHAMENTO ANALÍTICO (4 TABELAS 100% EXCLUSIVAS DE OCORRÊNCIAS) */}
          <div className="space-y-3.5 print-avoid-break print:break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Detalhamento Analítico de Ocorrências
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-100 border border-blue-400/40">
                    Segurança Patrimonial
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Dados analíticos consolidados: Prédios, Classificação por Tópico, Produtividade do CCO e Últimos Registros
                </p>
              </div>
              <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                4 Visões Analíticas Exclusivas de Ocorrências
              </span>
            </div>

            {/* GRID 2x2 DAS 4 TABELAS DE OCORRÊNCIAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 print-dashboard-detalhamento print:grid print:grid-cols-2 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
              
              {/* TABELA 1: INCIDÊNCIA POR PRÉDIO / LOCALIDADE */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                          Incidência por Prédio / Localidade
                        </h3>
                        <p className="text-[11px] text-slate-300">
                          Prédios com maior concentração de ocorrências
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200 print:break-inside-avoid print-avoid-break">
                          <th className="py-2 px-2">Prédio / Local</th>
                          <th className="py-2 px-2 text-right">Qtd ROs</th>
                          <th className="py-2 px-2 text-right">% Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {ocorrenciasPorPredio.length > 0 ? (
                          ocorrenciasPorPredio.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors print:break-inside-avoid print-avoid-break">
                              <td className="py-2 px-2 font-medium text-slate-200 truncate max-w-[180px]">
                                {item.predio}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-white">
                                {item.total} {item.total === 1 ? 'RO' : 'ROs'}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-blue-600/30 text-white border border-blue-400/50 shadow-sm">
                                  {item.porcentagem}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="print:break-inside-avoid print-avoid-break">
                            <td colSpan={3} className="py-4 text-center text-slate-300 text-xs font-medium">
                              Nenhuma ocorrência registrada no período filtrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>Monitoramento territorial e ronda preventiva nos prédios</span>
                </div>
              </div>

              {/* TABELA 2: CLASSIFICAÇÃO POR TÓPICO & NATUREZA */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                          Classificação por Tópico & Natureza
                        </h3>
                        <p className="text-[11px] text-slate-300">
                          Natureza e tipificação mais recorrentes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200 print:break-inside-avoid print-avoid-break">
                          <th className="py-2 px-2">Tópico / Categoria</th>
                          <th className="py-2 px-2 text-right">Qtd ROs</th>
                          <th className="py-2 px-2 text-right">% Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {ocorrenciasPorTopico.length > 0 ? (
                          ocorrenciasPorTopico.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors print:break-inside-avoid print-avoid-break">
                              <td className="py-2 px-2 font-medium text-slate-200 truncate max-w-[180px]">
                                {item.topico}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-indigo-200">
                                {item.total} {item.total === 1 ? 'RO' : 'ROs'}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-600/30 text-white border border-indigo-400/50 shadow-sm">
                                  {item.porcentagem}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="print:break-inside-avoid print-avoid-break">
                            <td colSpan={3} className="py-4 text-center text-slate-300 text-xs font-medium">
                              Nenhum registro classificado no período filtrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>Taxonomia oficial padronizada para auditorias de segurança</span>
                </div>
              </div>

              {/* TABELA 3: PRODUTIVIDADE CCO (OCORRÊNCIAS) */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                          Produtividade CCO (Operadores)
                        </h3>
                        <p className="text-[11px] text-slate-300">
                          Emissão de relatórios por operador no período
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('ocorrencias')}
                      className="text-xs text-blue-300 hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
                      title="Criar Novo Relatório de Ocorrência"
                    >
                      <span>Novo RO</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200 print:break-inside-avoid print-avoid-break">
                          <th className="py-2 px-2">Operador CCO</th>
                          <th className="py-2 px-2 text-right">Total Emitido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {tabelaProdutividade.length > 0 ? (
                          tabelaProdutividade.map((item, idx) => {
                            const isAtivo = item.operador === operadorAtivo;
                            return (
                              <tr key={idx} className={`hover:bg-slate-800/40 transition-colors ${isAtivo ? 'bg-blue-950/20' : ''} print:break-inside-avoid print-avoid-break`}>
                                <td className="py-2 px-2 font-medium text-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className={isAtivo ? 'font-bold text-white' : 'text-slate-200'}>{item.operador}</span>
                                    {isAtivo && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/25 text-blue-100 border border-blue-400/40 font-bold">
                                        Turno Atual
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 hidden sm:block">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${item.porcentagem}%` }}
                                      ></div>
                                    </div>
                                    <span className="font-mono font-bold text-white text-xs">
                                      {item.total} {item.total === 1 ? 'RO' : 'ROs'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="print:break-inside-avoid print-avoid-break">
                            <td colSpan={2} className="py-4 text-center text-slate-300 text-xs font-medium">
                              Nenhum RO emitido para o período filtrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>Total consolidado: {totalOcorrencias} relatórios no período selecionado</span>
                </div>
              </div>

              {/* TABELA 4: ÚLTIMAS OCORRÊNCIAS REGISTRADAS */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                          Últimas Ocorrências Registradas
                        </h3>
                        <p className="text-[11px] text-slate-300">
                          ROs mais recentes com severidade e horário
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('ocorrencias')}
                      className="text-xs text-amber-300 hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
                      title="Abrir Módulo de Ocorrências"
                    >
                      <span>Ver Todos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200 print:break-inside-avoid print-avoid-break">
                          <th className="py-2 px-2">Protocolo / Prédio</th>
                          <th className="py-2 px-2">Gravidade</th>
                          <th className="py-2 px-2 text-right">Data/Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {ultimasOcorrencias.length > 0 ? (
                          ultimasOcorrencias.map((item, idx) => {
                            return (
                              <tr key={idx} className="hover:bg-slate-800/40 transition-colors print:break-inside-avoid print-avoid-break">
                                <td className="py-2 px-2 font-medium text-slate-200">
                                  <div className="flex flex-col">
                                    <span className="font-mono text-blue-300 font-bold text-[11px]">{item.numeroRO || 'RO-2026'}</span>
                                    <span className="text-slate-300 text-xs truncate max-w-[150px]">{item.predio || item.local || 'Planta Operacional'}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2">
                                  {(() => {
                                    const grav = normalizarGravidade(item.gravidade);
                                    return (
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                          grav === 'Crítica'
                                            ? 'bg-red-500/25 text-red-100 border border-red-400/50'
                                            : grav === 'Alta'
                                            ? 'bg-orange-500/25 text-orange-100 border border-orange-400/50'
                                            : grav === 'Média'
                                            ? 'bg-amber-500/25 text-amber-100 border border-amber-400/50'
                                            : 'bg-blue-500/25 text-blue-100 border border-blue-400/50'
                                        }`}
                                      >
                                        {grav}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-slate-200 text-xs">
                                  <span>{item.data ? `${item.data.substring(8, 10)}/${item.data.substring(5, 7)}` : '--'} {item.hora || ''}</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="print:break-inside-avoid print-avoid-break">
                            <td colSpan={3} className="py-4 text-center text-slate-300 text-xs font-medium">
                              Nenhuma ocorrência encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>Protocolos arquivados com fotos e evidências</span>
                </div>
              </div>

            </div>
          </div>

          {/* Rodapé Oficial da Página 1 */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>CCO Security Suite • Central de Controle Operacional • Gestão de Ocorrências</span>
            <span className="font-bold text-slate-300">{abaAtiva === 'todas' ? 'Página 1 de 4' : 'Página 1 de 1'}</span>
          </div>
        </div>

    {/* =========================================================================
        DASHBOARD 2: PROVISÓRIOS / MOVIMENTAÇÃO (PÁGINA 2 DEDICADA EM MODO PAISAGEM)
       ========================================================================= */}
    <div className={`dashboard-page-landscape dashboard-page-2 ${abaAtiva === 'd2' ? 'dashboard-page-single' : ''} w-full max-w-full p-6 print:px-6 print:py-1 bg-slate-950/30 rounded-2xl border border-slate-800/80 print:border-none print:bg-transparent space-y-6 print:space-y-1 mb-8 print:mb-0 ${
      abaAtiva === 'todas' || abaAtiva === 'd2' ? 'block' : 'hidden'
    }`}>
      {/* Cabeçalho da Página 2 */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/25 text-amber-100 border border-amber-400/40 shrink-0">
                {abaAtiva === 'todas' ? 'Página 2 de 4' : 'Módulo 2 • Provisórios'}
              </span>
              <span className="text-xs font-semibold text-slate-400">CCO Security Suite</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              DASHBOARD 2: PROVISÓRIOS / MOVIMENTAÇÃO & CAUTELAS
            </h2>
          </div>
        </div>

        {/* Informações do Operador - Canto Superior Direito Compacto e Limpo */}
        <div className="header-operador-compacto flex flex-col items-end text-right shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="text-slate-400 font-normal">Operador:</span>
            <span className="font-mono text-slate-100 uppercase">{operadorAtivo}</span>
            {turnoAtivo && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold">
                {turnoAtivo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
            <span>{getPeriodoLabel()}</span>
            <span className="text-slate-600">•</span>
            <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

        {/* 4 CARDS DE KPIS DO DASHBOARD 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print-dashboard-kpis print:grid print:grid-cols-4 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
          {/* KPI 1: Cautelas Ativas */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Cautelas Ativas
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:hidden">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">{metricasProvisorios.totalCautelasAtivas}</span>
              <span className="text-xs font-bold text-amber-100 px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/50">
                Em Posse
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              {metricasProvisorios.ocupadosP1} na Portaria 1 (P1) • {metricasProvisorios.ocupadosP2} na Portaria 2 (P2)
            </p>
          </div>

          {/* KPI 2: Itens Devolvidos Hoje */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Devolvidos Hoje
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:hidden">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">{metricasProvisorios.totalDevolvidosHoje}</span>
              <span className="text-xs font-semibold text-emerald-400 inline-flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Hoje
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              Retornados e liberados no escaninho físico
            </p>
          </div>

          {/* KPI 3: Alertas de Reincidência */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Alertas Reincidência
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 print:hidden">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400 font-mono">{reincidentes.length}</span>
              <span className="text-xs font-bold text-rose-100 px-1.5 py-0.5 rounded bg-rose-500/25 border border-rose-400/50">
                ≥ 3 Acessos
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              Regra dos 3 acessos: Exige justificativa formal
            </p>
          </div>

          {/* KPI 4: Taxa de Ocupação do Escaninho Físico */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Ocupação Escaninho
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 print:hidden">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300 font-mono">{metricasProvisorios.taxaOcupacaoEscaninho}%</span>
              <span className="text-xs font-semibold text-slate-200">
                {metricasProvisorios.totalSlotsOcupados} / 20 slots
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              {20 - metricasProvisorios.totalSlotsOcupados} cartões disponíveis nas portarias
            </p>
          </div>
        </div>

        {/* BLOCO FINANCEIRO / PERDAS (PROVISÓRIOS) */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 p-4 shadow-lg print:border-slate-700 print:p-3 print-avoid-break">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  Perdidos vs. Ressarcidos (Módulo Provisórios)
                </h3>
                <p className="text-[11px] text-slate-200 font-medium">
                  Controle financeiro de 2ª via e ressarcimentos de credenciais provisórias extraviadas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-red-300 font-mono">
                {metricasProvisorios.totalPerdas} a cobrar (R$ {metricasProvisorios.valorACobrar},00)
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-bold text-emerald-300 font-mono">
                {metricasProvisorios.totalPagos} pagos (R$ {metricasProvisorios.valorRecuperado},00)
              </span>
            </div>
          </div>

          {/* Barra de Progresso Financeiro */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-200 font-semibold">
              <span>Taxa de Recuperação Financeira de Provisórios</span>
              <span className="font-bold font-mono text-white">{metricasProvisorios.pctRessarcimento}% Quitados</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${metricasProvisorios.pctRessarcimento}%` }}
              />
            </div>
          </div>
        </div>

        {/* GRADES ANALÍTICAS (2x2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 print:grid print:grid-cols-2 gap-4 print:gap-3 print-avoid-break">
          {/* Tabela 1: Cautelas Ativas */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Cautelas Ativas em Circulação
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/25 text-amber-100 border border-amber-400/50">
                  {metricasProvisorios.totalCautelasAtivas} Ativas
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Colaborador</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2">Cartão/Port.</th>
                      <th className="py-1.5 px-2 text-right">Retirada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasProvisorios.cautelasAtivas.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-medium text-slate-200 truncate max-w-[120px]">{item.colaborador || item.nome}</td>
                        <td className="py-1.5 px-2 text-slate-300 truncate max-w-[100px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 font-mono text-amber-300 font-bold">{item.cartao} ({item.portaria})</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-200">{item.horaRetirada}</td>
                      </tr>
                    ))}
                    {metricasProvisorios.cautelasAtivas.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhuma cautela ativa no momento.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Portaria 1: 01 a 10 • Portaria 2: 11 a 20</p>
          </div>

          {/* Tabela 2: Colaboradores Reincidentes */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Reincidentes no Mês (Regra 3 Acessos)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/25 text-rose-100 border border-rose-400/50">
                  {reincidentes.length} Reincidentes
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Nome</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2 text-right">Retiradas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tabelaReincidentes.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-medium text-slate-200 truncate max-w-[130px]">{item.nome}</td>
                        <td className="py-1.5 px-2 text-slate-300 truncate max-w-[110px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${item.totalAcessos >= 3 ? 'bg-rose-500/25 text-rose-100 border border-rose-400/50 font-bold' : 'bg-slate-800 text-slate-100 border border-slate-700 font-bold'}`}>
                            {item.totalAcessos} acessos
                          </span>
                        </td>
                      </tr>
                    ))}
                    {tabelaReincidentes.length === 0 && (
                      <tr><td colSpan={3} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhum colaborador reincidente registrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Critério: ≥ 3 retiradas exige justificativa da gerência</p>
          </div>

          {/* Tabela 3: Extravios de Provisórios com Botão de Quitação */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Extravios de Provisórios (Cobrança)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/25 text-red-100 border border-red-400/50">
                  {metricasProvisorios.totalPerdas} Pendentes
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Colaborador</th>
                      <th className="py-1.5 px-2">Cartão</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2 text-right print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasProvisorios.perdidos.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-medium text-slate-200 truncate max-w-[120px]">{item.colaborador || item.nome}</td>
                        <td className="py-1.5 px-2 font-mono text-amber-300 font-bold">{item.cartao}</td>
                        <td className="py-1.5 px-2 text-slate-300 truncate max-w-[100px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => handleQuitarProvisorio(item.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Marcar como Pago / Quitado"
                          >
                            À Pagar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {metricasProvisorios.perdidos.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhum extravio pendente de quitação.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Ressarcimento padrão: R$ 30,00 por credencial extraviada</p>
          </div>

          {/* Painel 4: Ocupação do Escaninho Físico P1 vs P2 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Ocupação do Escaninho Físico
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-100 border border-indigo-400/40">
                  20 Slots Totais
                </span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-blue-300">Portaria 1 (P1) • Slots 01 a 10</span>
                    <span className="font-mono text-white font-bold">{metricasProvisorios.ocupadosP1} / 10 em uso</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (metricasProvisorios.ocupadosP1 / 10) * 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-200 mt-1">{10 - metricasProvisorios.ocupadosP1} cartões disponíveis no escaninho P1</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-purple-300">Portaria 2 (P2) • Slots 11 a 20</span>
                    <span className="font-mono text-white font-bold">{metricasProvisorios.ocupadosP2} / 10 em uso</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (metricasProvisorios.ocupadosP2 / 10) * 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-200 mt-1">{10 - metricasProvisorios.ocupadosP2} cartões disponíveis no escaninho P2</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Disponibilidade física monitorada em tempo real</p>
          </div>
        </div>

        {/* Rodapé Oficial da Página 2 */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>CCO Security Suite • Central de Controle Operacional • Módulo Provisórios</span>
          <span className="font-bold text-slate-300">{abaAtiva === 'todas' ? 'Página 2 de 4' : 'Página 1 de 1'}</span>
        </div>
      </div>

    {/* =========================================================================
        DASHBOARD 3: VISITANTES & CONTROLE DE PORTARIAS (PÁGINA 3 DEDICADA EM MODO PAISAGEM)
       ========================================================================= */}
    <div className={`dashboard-page-landscape dashboard-page-3 ${abaAtiva === 'd3' ? 'dashboard-page-single' : ''} w-full max-w-full p-6 print:px-6 print:py-1 bg-slate-950/30 rounded-2xl border border-slate-800/80 print:border-none print:bg-transparent space-y-6 print:space-y-1 mb-8 print:mb-0 ${
      abaAtiva === 'todas' || abaAtiva === 'd3' ? 'block' : 'hidden'
    }`}>
      {/* Cabeçalho da Página 3 */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 shrink-0">
                {abaAtiva === 'todas' ? 'Página 3 de 4' : 'Módulo 3 • Visitantes'}
              </span>
              <span className="text-xs font-semibold text-slate-400">CCO Security Suite</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              DASHBOARD 3: VISITANTES & CONTROLE DE PORTARIAS
            </h2>
          </div>
        </div>

        {/* Informações do Operador - Canto Superior Direito Compacto e Limpo */}
        <div className="header-operador-compacto flex flex-col items-end text-right shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="text-slate-400 font-normal">Operador:</span>
            <span className="font-mono text-slate-100 uppercase">{operadorAtivo}</span>
            {turnoAtivo && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold">
                {turnoAtivo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
            <span>{getPeriodoLabel()}</span>
            <span className="text-slate-600">•</span>
            <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

        {/* 4 CARDS DE KPIS DO DASHBOARD 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print-dashboard-kpis print:grid print:grid-cols-4 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
          {/* KPI 1: Visitantes no Site Agora */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Visitantes no Site
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:hidden">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">{metricasVisitantes.totalNoSite}</span>
              <span className="text-xs font-bold text-emerald-100 px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50">
                Em Trânsito
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              {metricasVisitantes.noSiteP1} na Portaria 1 (P1) • {metricasVisitantes.noSiteP2} na Portaria 2 (P2)
            </p>
          </div>

          {/* KPI 2: Fluxo do Dia (Entrada vs Saída) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Fluxo do Dia (E / S)
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 print:hidden">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-300 font-mono">{metricasVisitantes.entradasHoje} / {metricasVisitantes.saidasHoje}</span>
              <span className="text-xs font-bold text-blue-100 px-2 py-0.5 rounded bg-blue-500/25 border border-blue-400/50">
                Hoje
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Total de entradas registradas vs saídas dadas baixa
            </p>
          </div>

          {/* KPI 3: Auditoria de Anfitriões */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Vínculo Anfitrião
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 print:hidden">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300 font-mono">{metricasVisitantes.pctAuditados}%</span>
              <span className="text-xs font-bold text-emerald-100 px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50">
                Auditados
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Conformidade: Vínculo formal com colaborador da planta
            </p>
          </div>

          {/* KPI 4: Ocupação do Escaninho de Visitantes */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Escaninho Visitantes
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:hidden">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">{metricasVisitantes.taxaOcupacaoEscaninhoVis}%</span>
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-700/80 border border-slate-600 font-mono">
                {metricasVisitantes.totalNoSite} / 40 slots
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              {40 - metricasVisitantes.totalNoSite} crachás disponíveis nas portarias
            </p>
          </div>
        </div>

        {/* CONTROLE DE CRACHÁS DE VISITANTES (CARD PERDIDOS VS. RESSARCIDOS) */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 border border-slate-800 p-4 shadow-lg print:border-slate-700 print:p-3 print-avoid-break">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  Controle de Crachás de Visitantes (Perdidos vs. Ressarcidos)
                </h3>
                <p className="text-[11px] text-slate-200 font-medium">
                  Resumo de cartões retidos, extraviados ou ressarcidos de visitantes nas portarias
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-red-300 font-mono">
                {metricasVisitantes.totalPerdidos} a cobrar (R$ {metricasVisitantes.valorACobrar},00)
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-bold text-emerald-300 font-mono">
                {metricasVisitantes.totalPagos} pagos (R$ {metricasVisitantes.valorRecuperado},00)
              </span>
              {metricasVisitantes.totalIsentos > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="font-bold text-blue-200 font-mono">
                    {metricasVisitantes.totalIsentos} com B.O.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Barra de Progresso Financeiro */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-200 font-semibold">
              <span>Taxa de Regularização / Ressarcimento de Visitantes</span>
              <span className="font-bold font-mono text-white">{metricasVisitantes.pctRessarcimento}% Regularizados</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${metricasVisitantes.pctRessarcimento}%` }}
              />
            </div>
          </div>
        </div>

        {/* GRADES ANALÍTICAS (2x2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 print:grid print:grid-cols-2 gap-4 print:gap-3 print-avoid-break">
          {/* Tabela 1: Visitantes no Site Agora */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Visitantes Atualmente no Site
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-100 border border-emerald-400/50">
                  {metricasVisitantes.totalNoSite} Presentes
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Visitante</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2">Anfitrião</th>
                      <th className="py-1.5 px-2 text-right">Crachá/Port.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasVisitantes.noSite.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-medium text-slate-100 truncate max-w-[120px]">{item.visitante}</td>
                        <td className="py-1.5 px-2 text-slate-300 truncate max-w-[100px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-indigo-200 font-medium truncate max-w-[110px]">{item.anfitriao || '-'}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-300 font-bold">{item.cartao}</td>
                      </tr>
                    ))}
                    {metricasVisitantes.noSite.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhum visitante presente no site no momento.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Todos os visitantes devem registrar saída com devolução do crachá</p>
          </div>

          {/* Tabela 2: Auditoria de Vínculos de Anfitriões */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  Auditoria de Vínculos de Anfitriões
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/25 text-blue-100 border border-blue-400/50">
                  Ranking de Visitas
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Anfitrião Responsável</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2 text-right">Total Visitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasVisitantes.listaAnfitrioes.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-medium text-slate-100 truncate max-w-[130px]">{item.anfitriao}</td>
                        <td className="py-1.5 px-2 text-slate-300 truncate max-w-[110px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/25 text-blue-100 border border-blue-400/50">
                            {item.total} {item.total === 1 ? 'visita' : 'visitas'} {item.noSite > 0 ? `(${item.noSite} no site)` : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {metricasVisitantes.listaAnfitrioes.length === 0 && (
                      <tr><td colSpan={3} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhum anfitrião registrado no período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Vínculo auditado para conformidade com normas de acesso</p>
          </div>

          {/* Tabela 3: Crachás de Visitantes Retidos / Extraviados com Quitação */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  Crachás de Visitantes Extraviados
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/25 text-red-100 border border-red-400/50">
                  {metricasVisitantes.totalPerdidos} a Cobrar
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Visitante</th>
                      <th className="py-1.5 px-2">Crachá</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2 text-right print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasVisitantes.perdidos.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-medium text-slate-100 truncate max-w-[120px]">{item.visitante}</td>
                        <td className="py-1.5 px-2 font-mono text-amber-300 font-bold">{item.cartao}</td>
                        <td className="py-1.5 px-2 text-slate-300 truncate max-w-[100px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => handleQuitarVisitante(item.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Marcar como Pago / Quitado"
                          >
                            À Pagar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {metricasVisitantes.perdidos.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhum crachá de visitante extraviado pendente.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Cobrança e ressarcimento de 2ª via: R$ 30,00</p>
          </div>

          {/* Painel 4: Fluxo de Portarias Visitantes (P1 vs P2) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  Fluxo e Escaninho Visitantes
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-100 border border-emerald-400/40">
                  40 Slots Totais
                </span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-emerald-300">Portaria 1 (P1) • Crachás 01 a 20</span>
                    <span className="font-mono text-white font-bold">{metricasVisitantes.noSiteP1} / 20 em uso</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (metricasVisitantes.noSiteP1 / 20) * 100)}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium mt-1">{20 - metricasVisitantes.noSiteP1} crachás disponíveis na P1</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-indigo-300">Portaria 2 (P2) • Crachás 21 a 40</span>
                    <span className="font-mono text-white font-bold">{metricasVisitantes.noSiteP2} / 20 em uso</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (metricasVisitantes.noSiteP2 / 20) * 100)}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium mt-1">{20 - metricasVisitantes.noSiteP2} crachás disponíveis na P2</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2 pt-2 border-t border-slate-800/60">Capacidade física de recepção das portarias monitorada</p>
          </div>
        </div>

        {/* Rodapé Oficial da Página 3 */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>CCO Security Suite • Central de Controle Operacional • Módulo Visitantes</span>
          <span className="font-bold text-slate-300">{abaAtiva === 'todas' ? 'Página 3 de 4' : 'Página 1 de 1'}</span>
        </div>
      </div>

    {/* =========================================================================
        DASHBOARD 4: SAÍDA DE CARTÃO RFID (CONTABILIDADE E FINANCEIRO) (PÁGINA 4 DEDICADA)
       ========================================================================= */}
    <div className={`dashboard-page-landscape dashboard-page-4 ${abaAtiva === 'd4' ? 'dashboard-page-single' : ''} w-full max-w-full p-6 print:px-6 print:py-1 bg-slate-950/30 rounded-2xl border border-slate-800/80 print:border-none print:bg-transparent space-y-6 print:space-y-1 mb-8 print:mb-0 ${
      abaAtiva === 'todas' || abaAtiva === 'd4' ? 'block' : 'hidden'
    }`}>
      {/* Cabeçalho da Página 4 */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-100 border border-indigo-400/40 shrink-0">
                {abaAtiva === 'todas' ? 'Página 4 de 4' : 'Módulo 4 • RFID & Contabilidade'}
              </span>
              <span className="text-xs font-semibold text-slate-400">CCO Security Suite</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              DASHBOARD 4: SAÍDA DE CARTÃO RFID (CONTABILIDADE & FINANCEIRO)
            </h2>
          </div>
        </div>

        {/* Informações do Operador - Canto Superior Direito Compacto e Limpo */}
        <div className="header-operador-compacto flex flex-col items-end text-right shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="text-slate-400 font-normal">Operador:</span>
            <span className="font-mono text-slate-100 uppercase">{operadorAtivo}</span>
            {turnoAtivo && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold">
                {turnoAtivo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
            <span>{getPeriodoLabel()}</span>
            <span className="text-slate-600">•</span>
            <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

        {/* 4 CARDS DE KPIS DO DASHBOARD 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print-dashboard-kpis print:grid print:grid-cols-4 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
          {/* KPI 1: Cartões Rotativos de Serviços */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Rotativos de Serviços
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 print:hidden">
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300 font-mono">
                {metricasRfidContabilidade.rotativosAtivos} / {metricasRfidContabilidade.rotativosTotal}
              </span>
              <span className="text-xs font-bold text-emerald-100 px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 shadow-sm">
                {metricasRfidContabilidade.rotativosDisponiveis} Disp.
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Intervalo 001 a 350 • {metricasRfidContabilidade.rotativosPerdidos} extraviados
            </p>
          </div>

          {/* KPI 2: Fixos Nominais */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Fixos Nominais
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 print:hidden">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-300 font-mono">
                {metricasRfidContabilidade.fixosAtivos} / {metricasRfidContabilidade.fixosTotal}
              </span>
              <span className="text-xs font-bold text-blue-100 px-2 py-0.5 rounded bg-blue-500/25 border border-blue-400/50 shadow-sm font-mono">
                {metricasRfidContabilidade.fixosDisponiveis} Disp.
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Credenciais de colaboradores fixos • {metricasRfidContabilidade.fixosPerdidos} extraviados
            </p>
          </div>

          {/* KPI 3: Total Geral a Cobrar (Multi-Módulos) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Total a Cobrar (Geral)
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 print:hidden">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-400 font-mono">
                R$ {metricasRfidContabilidade.totalValorACobrar},00
              </span>
              <span className="text-xs font-bold text-red-100 px-2 py-0.5 rounded bg-red-500/25 border border-red-400/50 shadow-sm font-mono">
                {metricasRfidContabilidade.totalItensACobrar} Itens
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Consolidação de 2ª via: RFID, Visitantes e Provisórios
            </p>
          </div>

          {/* KPI 4: Total Geral Recuperado / Quitado (Multi-Módulos) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Total Recuperado (Geral)
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:hidden">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                R$ {metricasRfidContabilidade.totalValorRecuperado},00
              </span>
              <span className="text-xs font-bold text-emerald-100 px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 shadow-sm font-mono">
                {metricasRfidContabilidade.totalItensPagos} Pagos
              </span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              {metricasRfidContabilidade.totalIsentosBO} isenções documentadas por Boletim de Ocorrência
            </p>
          </div>
        </div>

        {/* PAINEL CENTRALIZADO DE CONTABILIDADE / COBRANÇA */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 p-5 shadow-lg print:border-slate-700 print:p-3.5 print-avoid-break">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-100 font-extrabold text-[10px] uppercase border border-indigo-400/40">
                  Consolidado Multi-Módulos
                </span>
                <span className="text-xs font-semibold text-slate-200">Auditoria Financeira CCO</span>
              </div>
              <h3 className="font-extrabold text-base text-white mt-1">
                Painel Centralizado de Cobrança de 2ª Via por Extravio
              </h3>
              <p className="text-xs text-slate-200 font-medium">
                Integração contábil unificada das pendências dos módulos RFID, Visitantes e Provisórios. Taxa fixa corporativa: R$ 30,00 por credencial.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalCobrancaOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-100 border border-amber-400/50 text-xs font-bold transition-all shadow-md cursor-pointer print:hidden"
              >
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Relatório de Faturamento por Empresa</span>
              </button>
            </div>
          </div>

          {/* Barra de Eficácia Financeira / Recuperação */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Índice Geral de Eficácia Financeira (Ressarcimentos Confirmados)</span>
                <span className="font-mono font-bold text-emerald-300">{metricasRfidContabilidade.taxaEficacia}% Recuperados</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${metricasRfidContabilidade.taxaEficacia}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                <span>Total a Cobrar: <strong className="text-red-300 font-mono">R$ {metricasRfidContabilidade.totalValorACobrar},00</strong></span>
                <span>Total Recuperado: <strong className="text-emerald-300 font-mono">R$ {metricasRfidContabilidade.totalValorRecuperado},00</strong></span>
                <span>Total Isenções (B.O.): <strong className="text-blue-300 font-mono">{metricasRfidContabilidade.totalIsentosBO}</strong></span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-200">Total Auditado</span>
              <p className="text-base font-mono font-black text-white mt-0.5">
                R$ {(metricasRfidContabilidade.totalValorACobrar + metricasRfidContabilidade.totalValorRecuperado)},00
              </p>
            </div>
          </div>
        </div>

        {/* TABELAS EXECUTIVAS DO DASHBOARD 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 print:grid print:grid-cols-2 gap-4 print:gap-3 print-avoid-break">
          {/* Tabela 1: Resumo de Cobrança Consolidada por Empresa */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Cobrança Consolidada por Empresa Contratada
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-100 border border-indigo-400/50 shadow-sm">
                  {metricasRfidContabilidade.resumoCobrancaEmpresas.length} Empresas
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Empresa Contratada</th>
                      <th className="py-1.5 px-2">Origens</th>
                      <th className="py-1.5 px-2 text-right">Qtd Pendente</th>
                      <th className="py-1.5 px-2 text-right">Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasRfidContabilidade.resumoCobrancaEmpresas.slice(0, 6).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2 font-semibold text-slate-100 truncate max-w-[130px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-[10px] text-slate-200">
                          {item.porModulo.RFID > 0 && <span className="mr-1 text-indigo-200 font-mono font-bold">RFID:{item.porModulo.RFID}</span>}
                          {item.porModulo.PROVISÓRIO > 0 && <span className="mr-1 text-amber-200 font-mono font-bold">PRV:{item.porModulo.PROVISÓRIO}</span>}
                          {item.porModulo.VISITANTE > 0 && <span className="text-emerald-200 font-mono font-bold">VIS:{item.porModulo.VISITANTE}</span>}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-amber-300 font-bold">{item.totalItens}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-red-300 font-bold">R$ {item.valorTotal},00</td>
                      </tr>
                    ))}
                    {metricasRfidContabilidade.resumoCobrancaEmpresas.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhuma pendência financeira ativa por empresa.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-200 font-medium mt-2 pt-2 border-t border-slate-800/60">Cruzamento de todas as ocorrências de extravio em aberto</p>
          </div>

          {/* Tabela 2: Relação Centralizada de Pendências de 2ª Via com Quitação Imediata */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-400" />
                  Central Geral de Pendências de 2ª Via (Todos os Módulos)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/25 text-red-100 border border-red-400/50 shadow-sm">
                  {metricasRfidContabilidade.totalItensACobrar} a Quitar
                </span>
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-200">
                      <th className="py-1.5 px-2">Origem</th>
                      <th className="py-1.5 px-2">Colaborador / Cartão</th>
                      <th className="py-1.5 px-2">Empresa</th>
                      <th className="py-1.5 px-2 text-right print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metricasRfidContabilidade.todasPendencias.slice(0, 6).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-1.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                            item.modulo === 'RFID'
                              ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-400/50 font-black'
                              : item.modulo === 'PROVISÓRIO'
                              ? 'bg-amber-500/25 text-amber-100 border border-amber-400/50 font-black'
                              : 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/50 font-black'
                          }`}>
                            {item.modulo}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-medium text-slate-100">
                          <div className="truncate max-w-[130px]" title={item.colaborador}>{item.colaborador}</div>
                          <div className="text-[10px] font-mono text-slate-200">{item.cartao}</div>
                        </td>
                        <td className="py-1.5 px-2 text-slate-200 truncate max-w-[100px]">{item.empresa}</td>
                        <td className="py-1.5 px-2 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => handleQuitarItemConsolidado(item)}
                            className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Marcar como Pago / Quitado"
                          >
                            À Pagar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {metricasRfidContabilidade.todasPendencias.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-slate-300 text-xs font-medium">Nenhuma pendência financeira de 2ª via ativa.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-200 font-medium mt-2 pt-2 border-t border-slate-800/60">A quitação atualiza a base do módulo original e o inventário</p>
          </div>
        </div>

        {/* Rodapé Oficial da Página 4 */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 font-medium">
          <span>CCO Security Suite • Central de Controle Operacional • Gestão RFID & Contabilidade</span>
          <span className="font-bold text-slate-100">{abaAtiva === 'todas' ? 'Página 4 de 4' : 'Página 1 de 1'}</span>
        </div>
      </div>
      </div>

      {/* RELATÓRIO EXECUTIVO OFICIAL PARA IMPRESSÃO E EXPORTAÇÃO EM PDF (1 PÁGINA POR MÓDULO • FORMATO PAISAGEM) */}
      <RelatorioExecutivoPrint
        abaAtiva={abaAtiva}
        operadorAtivo={operadorAtivo}
        turnoAtivo={turnoAtivo}
        periodoNome={getPeriodoLabel()}
        filtros={{
          periodo,
          dataInicio,
          dataFim,
          predio: filtroPredio,
          area: filtroArea,
          topico: filtroTopico,
          empresa: filtroEmpresa
        }}
        dados={{
          // Módulo 1: Ocorrências
          totalOcorrencias,
          criticas,
          altas,
          medias,
          baixas,
          pctCritica,
          pctAlta,
          pctMedia,
          pctBaixa,
          tempoMedioResposta,
          comFotosFormalizadas,
          ocorrenciasPorPredio,
          ocorrenciasPorTopico,
          produtividadeOperadores: tabelaProdutividade,
          ultimasOcorrencias,

          // Módulo 2: Provisórios
          metricasProvisorios,
          cautelasEmCirculacao: metricasProvisorios.cautelasAtivas || [],
          tabelaReincidentes,
          extraviosProvisorios: metricasProvisorios.perdidos || [],

          // Módulo 3: Visitantes
          metricasVisitantes,
          visitantesNoSite: metricasVisitantes.noSite || [],
          rankingAnfitrioes: metricasVisitantes.listaAnfitrioes || [],
          extraviosVisitantes: metricasVisitantes.perdidos || [],

          // Módulo 4: RFID & Contabilidade
          metricasRfidContabilidade,
          resumoCobrancaPorEmpresa: metricasRfidContabilidade.resumoCobrancaEmpresas || [],
          tabelaInadimplentes
        }}
      />

      {/* Rodapé Global com Assinatura e Versão (OCULTO NA IMPRESSÃO) */}
      <footer className="pt-6 pb-2 border-t border-slate-800/80 text-center text-xs text-slate-500 no-print print:hidden">
        <p className="font-medium">
          Desenvolvido por <span className="text-slate-400 font-semibold">© Yago Marinho</span> - TecPrimus Soluções Tecnológicas @ 2026 | Versão 1.0
        </p>
      </footer>

      {/* Modal Relatório de Cobrança Financeira de 2ª Via */}
      <RelatorioCobrancaModal
        isOpen={modalCobrancaOpen}
        onClose={() => setModalCobrancaOpen(false)}
        inventario={rfidBase}
        onMarcarPago={(card) => {
          if (card?.id) {
            transicionarStatusCartao(
              rfidBase,
              card.id,
              'PAGO',
              'Ressarcimento de 2ª via confirmado via Dashboard Executivo'
            );
            showToast(`Credencial ${card.codigoRfid || card.numeroRotativo || ''} marcada como PAGO!`, 'success');
          }
        }}
      />
    </div>
  );
}
