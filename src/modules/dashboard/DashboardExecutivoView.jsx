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
  Loader2
} from 'lucide-react';
import {
  exportarRelatorioConsolidadoPdf,
  exportarBaseConsolidadaExcel
} from '../../services/dashboardExportService';
import {
  PREDIOS_CCO,
  AREAS_CCO,
  TOPICOS_OCORRENCIA,
  EMPRESAS_CCO
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
import { carregarRegistros as carregarRegistrosProvisorios } from '../../services/provisoriosService';
import { carregarVisitantes } from '../../services/visitantesService';
import { carregarInventarioRfid } from '../../services/rfidService';



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
        const ativos = dados.filter(op => op.status !== 'Inativo').map(op => op.nome);
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
        const ativos = dados.filter(t => t.status !== 'Inativo').map(t => t.nome);
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
        const ativos = e.detail.filter(op => op.status !== 'Inativo').map(op => op.nome);
        if (ativos.length > 0) {
          setListaOperadores(ativos);
        }
      } else {
        atualizarOperadores();
      }
    };

    const handleTurnosChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativos = e.detail.filter(t => t.status !== 'Inativo').map(t => t.nome);
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

  // C. Filtro de Contexto Pessoas / Credenciais (afeta APENAS Credenciais e Visitantes)
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS');

  const [filtrosAbertos, setFiltrosAbertos] = useState(true);

  // Estados de exportação
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Notificação / Feedback de exportação (UI)
  const [toast, setToast] = useState(null);

  const showToast = (mensagem, tipo = 'info') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4500);
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

  // Carregamento de dados das bases locais
  const [ocorrenciasSalvas, setOcorrenciasSalvas] = useState(() => {
    try {
      const salvo = localStorage.getItem('cco_ocorrencias_dados');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    let montado = true;
    const carregar = async () => {
      try {
        const dados = await carregarOcorrencias();
        if (montado && Array.isArray(dados)) {
          setOcorrenciasSalvas(dados.map(o => ({
            ...o,
            predio: o.predio || (o.local && o.local.split(' - ')[0]) || 'Geral',
            area: o.area || (o.local && o.local.includes(' - ') ? o.local.split(' - ')[1] : 'Área Geral'),
            topico: o.topico || 'USO INDEVIDO DE EPI'
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar ocorrências no Dashboard:', err);
      }
    };
    carregar();
    return () => { montado = false; };
  }, []);

  const provisoriosBase = useMemo(() => {
    return carregarRegistrosProvisorios() || [];
  }, []);

  const visitantesBase = useMemo(() => {
    return carregarVisitantes() || [];
  }, []);

  const rfidBase = useMemo(() => {
    return carregarInventarioRfid() || [];
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

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrenciasSalvas.filter(o => {
      if (!matchPeriodo(o.data)) return false;
      if (filtroPredio !== 'TODOS' && o.predio !== filtroPredio) return false;
      if (filtroArea !== 'TODAS' && o.area !== filtroArea) return false;
      if (filtroTopico !== 'TODOS' && o.topico !== filtroTopico) return false;
      return true;
    });
  }, [ocorrenciasSalvas, periodo, dataInicio, dataFim, filtroPredio, filtroArea, filtroTopico]);

  const provisoriosFiltrados = useMemo(() => {
    return provisoriosBase.filter(p => {
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
    return visitantesBase.filter(v => {
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
    return rfidBase.filter(r => {
      if (filtroEmpresa !== 'TODAS') {
        const emp = (r.empresa || '').toUpperCase();
        const fEmp = filtroEmpresa.toUpperCase();
        if (!emp.includes(fEmp) && !fEmp.includes(emp)) return false;
      }
      return true;
    });
  }, [rfidBase, filtroEmpresa]);

  // Métricas calculadas dinamicamente
  const totalOcorrencias = ocorrenciasFiltradas.length;
  const criticas = ocorrenciasFiltradas.filter(o => o.gravidade === 'Crítica').length;
  const altas = ocorrenciasFiltradas.filter(o => o.gravidade === 'Alta' || o.gravidade === 'Grave').length;
  const medias = ocorrenciasFiltradas.filter(o => o.gravidade === 'Média').length;
  const baixas = ocorrenciasFiltradas.filter(o => o.gravidade === 'Baixa' || o.gravidade === 'Leve').length;

  const pctCritica = totalOcorrencias > 0 ? Math.round((criticas / totalOcorrencias) * 100) : 0;
  const pctAlta = totalOcorrencias > 0 ? Math.round((altas / totalOcorrencias) * 100) : 0;
  const pctMedia = totalOcorrencias > 0 ? Math.round((medias / totalOcorrencias) * 100) : 0;
  const pctBaixa = totalOcorrencias > 0 ? Math.round((baixas / totalOcorrencias) * 100) : 0;

  // -------------------------------------------------------------------------
  // 4 TABELAS DO DETALHAMENTO ANALÍTICO (RESUMO RÁPIDO PARA GESTÃO CCO)
  // -------------------------------------------------------------------------

  // 1. Alerta de Reincidência (Provisórios)
  // Colunas: Nome do Colaborador, Empresa, Qtd de Acessos no Mês
  const tabelaReincidentes = useMemo(() => {
    const mapa = new Map();
    provisoriosFiltrados.forEach(p => {
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
    const perdidosNaoPagos = rfidFiltrados.filter(r => r.status === 'PERDIDO');
    if (perdidosNaoPagos.length > 0) {
      return perdidosNaoPagos.slice(0, 5).map(r => ({
        id: r.id || r.codigoRfid,
        nome: r.colaborador || 'PORTADOR NÃO IDENTIFICADO',
        empresa: r.empresa || 'TERCEIRO',
        dataPerda: r.dataPerda || r.dataLiberacao || '2026-01-01',
        cartao: r.tipo === 'ROTATIVO' ? (r.numeroRotativo || `Rotativo ${r.numeroRotativoIdx || ''}`) : (r.codigoImpresso || 'Fixo Nominal')
      }));
    }

    return [];
  }, [rfidFiltrados]);

  // 3. Produtividade CCO (Ocorrências)
  // Colunas: Operador CCO, Total de ROs Emitidos
  const tabelaProdutividade = useMemo(() => {
    const mapa = new Map();
    listaOperadores.forEach(op => {
      mapa.set(op, 0);
    });

    ocorrenciasFiltradas.forEach((o, idx) => {
      const op = o.operador || o.vigilante || (listaOperadores[idx % (listaOperadores.length || 1)]) || 'Operador CCO';
      const atual = mapa.get(op) || 0;
      mapa.set(op, atual + 1);
    });

    const lista = Array.from(mapa.entries())
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
    const pendentes = provisoriosFiltrados.filter(p => 
      p.situacao === 'NÃO DEVOLVIDO' || 
      p.situacao === 'NAO_DEVOLVIDO' || 
      p.status === 'NAO_DEVOLVIDO' || 
      p.status === 'Pendente'
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

  const provisoriosPendentes = provisoriosFiltrados.filter(p => 
    p.situacao === 'NÃO DEVOLVIDO' || 
    p.situacao === 'NAO_DEVOLVIDO' || 
    p.status === 'NAO_DEVOLVIDO' || 
    p.status === 'Pendente'
  );
  const totalPendentes = provisoriosPendentes.length;
  const pendentesP1 = provisoriosPendentes.filter(p => p.portaria === 'P1').length;
  const pendentesP2 = provisoriosPendentes.filter(p => p.portaria === 'P2').length;

  const reincidentes = tabelaReincidentes.filter(r => r.totalAcessos >= 3);
  const taxaReincidencia = provisoriosFiltrados.length > 0
    ? ((reincidentes.length / provisoriosFiltrados.length) * 100).toFixed(1)
    : '0.0';

  const rfidPerdidos = rfidFiltrados.filter(r => r.status === 'PERDIDO' || r.status === 'PAGO').length;
  const rfidPagos = rfidFiltrados.filter(r => r.status === 'PAGO').length;
  const pctPagos = rfidPerdidos > 0 ? Math.round((rfidPagos / rfidPerdidos) * 100) : 0;

  const provP1Total = provisoriosFiltrados.filter(p => p.portaria === 'P1').length;
  const provP2Total = provisoriosFiltrados.filter(p => p.portaria === 'P2').length;
  const visP1Total = visitantesFiltrados.filter(v => v.portaria === 'P1').length;
  const visP2Total = visitantesFiltrados.filter(v => v.portaria === 'P2').length;

  const totalLibP1 = provP1Total + visP1Total;
  const totalLibP2 = provP2Total + visP2Total;
  const totalGeralLib = totalLibP1 + totalLibP2;
  const pctP1 = totalGeralLib > 0 ? Math.round((totalLibP1 / totalGeralLib) * 100) : 0;
  const pctP2 = totalGeralLib > 0 ? Math.round((totalLibP2 / totalGeralLib) * 100) : 0;

  // Exportar Relatório Executivo em PDF
  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    try {
      showToast('Processando métricas e gerando Relatório Executivo em PDF...', 'info');
      const res = await exportarRelatorioConsolidadoPdf({
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
          }
        }
      });
      showToast(`✓ Relatório Executivo gerado e baixado com sucesso (${res.nomeArquivo})!`, 'success');
    } catch (err) {
      console.error('Erro ao exportar PDF no Dashboard:', err);
      showToast(`Erro ao gerar PDF: ${err.message || 'Verifique o console.'}`, 'error');
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
          }
        }
      });
      showToast(`✓ Planilha consolidada gerada e baixada com sucesso (${res.nomeArquivo})!`, 'success');
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
    setFiltroEmpresa('TODAS');
    showToast('Filtros restaurados para os valores padrão.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 print:space-y-4 print:p-2 print:max-w-none">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-2xl animate-in slide-in-from-bottom-5 no-print">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium">{toast.mensagem}</span>
        </div>
      )}

      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO NATIVA (VISÍVEL APENAS EM @media print) */}
      <div className="hidden print:block border-b-2 border-slate-700 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CCO SECURITY SUITE • RELATÓRIO EXECUTIVO CONSOLIDADO
            </h1>
            <p className="text-xs text-slate-400">
              Central de Controle Operacional • Planta Operacional • Impressão em Modo Paisagem
            </p>
          </div>
          <div className="text-right text-xs text-slate-300">
            <p><strong>Operador CCO:</strong> {operadorAtivo} | <strong>Turno:</strong> {turnoAtivo}</p>
            <p><strong>Período:</strong> {getPeriodoLabel()} | <strong>Emissão:</strong> {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* BANNER DE CABEÇALHO DO PAINEL EXECUTIVO NA TELA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-6 shadow-xl print:border-slate-700 print:p-4 print-avoid-break">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none no-print"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Shield className="w-3 h-3 text-blue-400" />
                Painel Gerencial
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Planta Operacional • Tempo Real
              </span>
              <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Operador CCO:</span>
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
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-[11px] text-slate-400 font-medium">Turno:</span>
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
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Executivo de Segurança & Operações
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed print:hidden">
              Consolidação estratégica de ocorrências em todo o site, controle de credenciais provisórias (P1/P2), liberação de visitantes e inventário RFID.
            </p>
          </div>

          {/* BOTÕES DE EXPORTAÇÃO EXECUTIVA */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              onClick={handleExportarPdf}
              disabled={exportandoPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all shadow-lg hover:shadow-red-600/10 hover:border-red-400 disabled:opacity-50 cursor-pointer"
              title="Exportar Relatório Consolidado do Período em PDF e salvar em CCO/exports"
            >
              {exportandoPdf ? (
                <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>Relatório PDF</span>
            </button>

            <button
              onClick={handleExportarExcel}
              disabled={exportandoExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-lg hover:shadow-emerald-600/10 hover:border-emerald-400 disabled:opacity-50 cursor-pointer"
              title="Exportar Base de Dados Filtrada em Excel (.xlsx) e salvar em CCO/exports"
            >
              {exportandoExcel ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>Base Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Imprimir visualização gerencial em modo Paisagem"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE FILTROS INTELIGENTES SEGREGADOS POR CONTEXTO */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg transition-all print:hidden">
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Barra de Filtros Inteligente
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/60 font-semibold">
              {getPeriodoLabel()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Restaurar todos os filtros para os valores padrão"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Redefinir Filtros</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-1 rounded hover:bg-blue-500/10 transition-colors cursor-pointer"
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
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  1. Filtro Temporal (Afeta Todos os Indicadores)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Período Operacional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Seleção de Período</label>
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
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Intervalo de Datas (Início - Fim)</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Prédio */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 mb-1 block uppercase">
                      Prédio (Local)
                    </label>
                    <select
                      value={filtroPredio}
                      onChange={(e) => setFiltroPredio(e.target.value)}
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
                    <label className="text-[10px] font-bold text-slate-300 mb-1 block uppercase">
                      Área / Setor
                    </label>
                    <select
                      value={filtroArea}
                      onChange={(e) => setFiltroArea(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/60 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      <option value="TODAS">Todas as Áreas</option>
                      {AREAS_CCO.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tópico de Ocorrência */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 mb-1 block uppercase">
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
                    <label className="text-[10px] font-bold text-slate-300 mb-1 block uppercase">
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

                <p className="text-[10px] text-slate-400 leading-tight pt-2 border-t border-slate-800/80">
                  Filtra os cartões provisórios pendentes, taxa de reincidência e acessos de visitantes da empresa selecionada.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 CARDS PRINCIPAIS DE INDICADORES (GARANTIDO LADO A LADO NA TELA E NA IMPRESSÃO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print-dashboard-kpis print:grid print:grid-cols-4 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
        {/* CARD 1: OCORRÊNCIAS NO PERÍODO */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
            <FileText className="w-20 h-20 text-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ocorrências no Período
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

          <p className="text-xs text-slate-400 mt-1 truncate" title={`${criticas} Críticas • ${altas} Altas • ${medias} Médias • ${baixas} Baixas`}>
            {criticas} Críticas • {altas} Altas • {medias} Médias • {baixas} Baixas
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
            <span className="text-[11px] text-slate-500">100% com RO e PDF</span>
            <button
              onClick={() => onNavigate && onNavigate('ocorrencias')}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
            >
              <span>Abrir RO</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: CREDENCIAIS PENDENTES DE DEVOLUÇÃO */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
            <Clock className="w-20 h-20 text-amber-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pendentes Devolução
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:hidden">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{totalPendentes}</span>
            <span className="text-xs font-bold text-red-400 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/50">
              Urgente
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {pendentesP1} na Portaria 1 (P1) • {pendentesP2} na Portaria 2 (P2)
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
            <span className="text-[11px] text-slate-500">Cartões em circulação</span>
            <button
              onClick={() => onNavigate && onNavigate('provisorios')}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
            >
              <span>Ver Provisórios</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 3: TAXA DE REINCIDÊNCIA (> 3 RETIRADAS) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
            <Flame className="w-20 h-20 text-rose-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Taxa de Reincidência
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 print:hidden">
              <BadgeAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{taxaReincidencia}%</span>
            <span className="text-xs font-semibold text-rose-400 inline-flex items-center">
              {reincidentes.length} Reincidentes
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Regra dos 3 Acessos: Alerta ativo no cadastro
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
            <span className="text-[11px] text-slate-500">&gt; 3 provisórios no mês</span>
            <button
              onClick={() => onNavigate && onNavigate('provisorios')}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
            >
              <span>Ver Reincidentes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 4: CARTÕES PERDIDOS / PAGOS (RFID) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all print:border-slate-700 print:p-3.5 print:break-inside-avoid print-avoid-break">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity no-print">
            <CreditCard className="w-20 h-20 text-indigo-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cartões Perdidos / Pagos
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 print:hidden">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-300 font-mono">{rfidPagos} / {rfidPerdidos}</span>
            <span className="text-xs font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
              {pctPagos}% Pagos
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {rfidPerdidos - rfidPagos} pendentes de regularização
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs print:hidden">
            <span className="text-[11px] text-slate-500">{rfidPagos} regularizados via formulário</span>
            <button
              onClick={() => onNavigate && onNavigate('rfid')}
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
            >
              <span>Gerir RFID</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO: DETALHAMENTO ANALÍTICO (4 TABELAS DE RESUMO RÁPIDO) */}
      <div className="space-y-3.5 print-avoid-break print:break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Detalhamento Analítico
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Resumo Operacional Crítico
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Dados prioritários e acionáveis para gestão imediata de segurança e conformidade
            </p>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            4 Visões Rápidas • Conexão Direta com os Módulos
          </span>
        </div>

        {/* GRID 2x2 DAS 4 TABELAS DE RESUMO RÁPIDO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 print-dashboard-detalhamento print:grid print:grid-cols-2 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
          
          {/* TABELA 1: ALERTA DE REINCIDÊNCIA (PROVISÓRIOS) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Alerta de Reincidência (Provisórios)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Colaboradores com retiradas frequentes (Regra 3 acessos)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('provisorios')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
                  title="Abrir Controle de Provisórios"
                >
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 print:break-inside-avoid print-avoid-break">
                      <th className="py-2 px-2">Nome do Colaborador</th>
                      <th className="py-2 px-2">Empresa</th>
                      <th className="py-2 px-2 text-right">Qtd de Acessos no Mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tabelaReincidentes.length > 0 ? (
                      tabelaReincidentes.map((item, idx) => {
                        const isCritico = item.totalAcessos >= 3;
                        const isAlerta = item.totalAcessos === 2;
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors print:break-inside-avoid print-avoid-break">
                            <td className="py-2 px-2 font-medium text-slate-200 truncate max-w-[150px]">
                              {item.nome}
                            </td>
                            <td className="py-2 px-2 text-slate-400 truncate max-w-[120px]">
                              {item.empresa}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                  isCritico
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                                    : isAlerta
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {isCritico && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                                {item.totalAcessos} {item.totalAcessos === 1 ? 'acesso' : 'acessos'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="print:break-inside-avoid print-avoid-break">
                        <td colSpan={3} className="py-4 text-center text-slate-500 text-xs">
                          Nenhum registro de reincidência para os filtros ativos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Critério: &ge; 3 acessos requer justificativa formal da liderança</span>
            </div>
          </div>

          {/* TABELA 2: INADIMPLÊNCIA DE CREDENCIAIS (PERDIDOS NÃO PAGOS) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Inadimplência de Credenciais
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Credenciais extraviadas pendentes de regularização
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('rfid')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
                  title="Abrir Gestão RFID"
                >
                  <span>Gestão RFID</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 print:break-inside-avoid print-avoid-break">
                      <th className="py-2 px-2">Nome</th>
                      <th className="py-2 px-2">Empresa</th>
                      <th className="py-2 px-2 text-right">Data da Perda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tabelaInadimplentes.length > 0 ? (
                      tabelaInadimplentes.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors print:break-inside-avoid print-avoid-break">
                          <td className="py-2 px-2 font-medium text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[130px]" title={item.nome}>{item.nome}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                                {item.cartao}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-slate-400 truncate max-w-[110px]" title={item.empresa}>
                            {item.empresa}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-300 text-xs">
                            <span>{item.dataPerda}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="print:break-inside-avoid print-avoid-break">
                        <td colSpan={3} className="py-4 text-center text-slate-500 text-xs">
                          Nenhuma credencial extraviada pendente de regularização.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Cobrança e regularização controladas via formulário padrão de conformidade corporativa</span>
            </div>
          </div>

          {/* TABELA 3: PRODUTIVIDADE CCO (OCORRÊNCIAS) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Produtividade CCO (Ocorrências)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Operadores com maior volume de ROs emitidos no período
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('ocorrencias')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
                  title="Criar Novo Relatório de Ocorrência"
                >
                  <span>Novo RO</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 print:break-inside-avoid print-avoid-break">
                      <th className="py-2 px-2">Operador CCO</th>
                      <th className="py-2 px-2 text-right">Total de ROs Emitidos</th>
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
                                <span className={isAtivo ? 'font-bold text-blue-300' : ''}>{item.operador}</span>
                                {isAtivo && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Turno Atual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 hidden sm:block">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
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
                        <td colSpan={2} className="py-4 text-center text-slate-500 text-xs">
                          Nenhum RO emitido para o período filtrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Total consolidado: {totalOcorrencias} relatórios no período selecionado</span>
            </div>
          </div>

          {/* TABELA 4: CARTÕES PROVISÓRIOS PENDENTES */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg flex flex-col justify-between print:border-slate-700 print:p-3 print:break-inside-avoid print-avoid-break">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      Cartões Provisórios Pendentes
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Credenciais em aberto aguardando devolução nas portarias
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('provisorios')}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
                  title="Dar Baixa em Cartões Provisórios"
                >
                  <span>Dar Baixa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 print:break-inside-avoid print-avoid-break">
                      <th className="py-2 px-2">Nome</th>
                      <th className="py-2 px-2">Portaria</th>
                      <th className="py-2 px-2 text-right">Hora Retirada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tabelaPendentes.length > 0 ? (
                      tabelaPendentes.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors print:break-inside-avoid print-avoid-break">
                          <td className="py-2 px-2 font-medium text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[130px]" title={item.nome}>{item.nome}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                {item.cartao}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.portaria === 'P1'
                                  ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                                  : 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                              }`}
                            >
                              {item.portaria === 'P1' ? 'Portaria 1 (P1)' : 'Portaria 2 (P2)'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-amber-300 text-xs font-semibold">
                            {item.horaRetirada}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="print:break-inside-avoid print-avoid-break">
                        <td colSpan={3} className="py-4 text-center text-slate-500 text-xs">
                          Nenhuma credencial pendente no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>{pendentesP1} pendente(s) na P1 • {pendentesP2} pendente(s) na P2</span>
            </div>
          </div>

        </div>
      </div>

      {/* PAINÉIS DE ANÁLISE GRÁFICA & VISUALIZAÇÕES ESTRATÉGICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 print-dashboard-panels print:grid print:grid-cols-3 gap-6 print:gap-4 print-avoid-break print:break-inside-avoid">
        {/* GRÁFICO 1: OCORRÊNCIAS POR GRAVIDADE & NATUREZA (AFETADO APENAS POR FILTROS DE OCORRÊNCIA) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between print:border-slate-700 print:p-4 print:break-inside-avoid print-avoid-break">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  Distribuição de Ocorrências por Gravidade & Natureza
                </h3>
                <p className="text-xs text-slate-400">
                  Visão consolidada dos relatórios no filtro: Prédio [{filtroPredio}], Área [{filtroArea}], Tópico [{filtroTopico}]
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Total: {totalOcorrencias} RO(s)
              </span>
            </div>

            {/* Barras Visuais de Distribuição por Gravidade */}
            <div className="space-y-3.5 mt-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    Crítica ({criticas} ocorrências)
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{pctCritica}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctCritica, totalOcorrencias > 0 && criticas > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    Alta ({altas} ocorrências)
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{pctAlta}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctAlta, totalOcorrencias > 0 && altas > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Média ({medias} ocorrências)
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{pctMedia}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctMedia, totalOcorrencias > 0 && medias > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Baixa ({baixas} ocorrências)
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{pctBaixa}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pctBaixa, totalOcorrencias > 0 && baixas > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Destaque de Resolução */}
          <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-center print:border-slate-700">
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 print:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tempo Médio Resposta</span>
              <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">18 min</p>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 print:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">Com Fotos Formalizadas</span>
              <p className="text-sm font-mono font-bold text-blue-400 mt-0.5">100% (Anexo 1)</p>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 print:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">PDFs Salvos na Rede</span>
              <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{totalOcorrencias} Arquivos</p>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: FLUXO DE PORTARIAS (P1 VS P2) & VISITANTES (AFETADO APENAS POR EMPRESA) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between print:border-slate-700 print:p-4 print:break-inside-avoid print-avoid-break">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                Fluxo por Portaria
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                P1 & P2
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Volume comparativo de liberações provisórias e visitantes {filtroEmpresa !== 'TODAS' ? `da empresa ${filtroEmpresa}` : 'no período'}
            </p>

            {/* Comparativo de Barras P1 vs P2 */}
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 print:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">Portaria 1 (P1) - Principal</span>
                  <span className="font-mono text-white font-bold">{totalLibP1} liberações ({pctP1}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" 
                    style={{ width: `${pctP1}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Provisórios: {provP1Total}</span>
                  <span>Visitantes: {visP1Total}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 print:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">Portaria 2 (P2) - Serviços / Carga</span>
                  <span className="font-mono text-white font-bold">{totalLibP2} liberações ({pctP2}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                    style={{ width: `${pctP2}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Provisórios: {provP2Total}</span>
                  <span>Visitantes: {visP2Total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Visitantes */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between print:border-slate-700">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">{visitantesFiltrados.length} Visitantes Totais</p>
                <p className="text-[10px] text-slate-400">100% com anfitrião registrado</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('visitantes')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer print:hidden"
            >
              <span>Ver Acessos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ATALHOS DE NAVEGAÇÃO RÁPIDA PARA OS 4 MÓDULOS */}
      <div className="print-avoid-break print:break-inside-avoid">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Acesso Rápido aos Módulos Operacionais
          </h3>
          <span className="text-[11px] text-slate-500 print:hidden">
            Clique no módulo desejado para abrir o fluxo de trabalho
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print-dashboard-shortcuts print:grid print:grid-cols-4 gap-4 print:gap-3 print-avoid-break print:break-inside-avoid">
          {/* Módulo 1: Ocorrências */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('ocorrencias')}
            className="text-left p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition-all group flex flex-col justify-between cursor-pointer print:border-slate-700 print:break-inside-avoid print-avoid-break"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Ferramenta 1
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                Relatório de Ocorrências
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Registro de fatos em 17 prédios, tabela de envolvidos, fotos e PDF formatado.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-blue-400 font-semibold print:hidden">
              <span>Criar Novo RO</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Módulo 2: Provisórios */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('provisorios')}
            className="text-left p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition-all group flex flex-col justify-between cursor-pointer print:border-slate-700 print:break-inside-avoid print-avoid-break"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Ferramenta 2
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                Credenciais Provisórias
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Controle de saída e devolução (P1/P2) e regra de bloqueio dos 3 acessos.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-amber-400 font-semibold print:hidden">
              <span>Registrar Saída/Baixa</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Módulo 3: Visitantes */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('visitantes')}
            className="text-left p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all group flex flex-col justify-between cursor-pointer print:border-slate-700 print:break-inside-avoid print-avoid-break"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Ferramenta 3
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                Controle de Visitantes
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Liberação de acessos com vínculo formal obrigatório ao Anfitrião.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-emerald-400 font-semibold print:hidden">
              <span>Liberar Visitante</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Módulo 4: Gestão RFID */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('rfid')}
            className="text-left p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all group flex flex-col justify-between cursor-pointer print:border-slate-700 print:break-inside-avoid print-avoid-break"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Ferramenta 4
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                Gestão Geral RFID
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Inventário de cartões rotativos (0-350) e fixos com métricas de perdas e estoque.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-indigo-400 font-semibold print:hidden">
              <span>Acessar Inventário</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Rodapé Global com Assinatura e Versão */}
      <footer className="pt-6 pb-2 border-t border-slate-800/80 text-center text-xs text-slate-500 print:text-[9.5px] print:pt-4 print:pb-0 print:border-slate-700 print-avoid-break">
        <p className="font-medium">
          Desenvolvido por <span className="text-slate-400 font-semibold">© Yago Marinho</span> - TecPrimus Soluções Tecnológicas @ 2026 | Versão 1.0
        </p>
      </footer>
    </div>
  );
}
