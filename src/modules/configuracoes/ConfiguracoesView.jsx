import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  FileSpreadsheet,
  RotateCcw,
  Shield,
  Clock,
  KeyRound,
  AlertTriangle,
  X,
  Plus,
  Save,
  HardDrive,
  BadgeAlert,
  Sparkles,
  ChevronDown,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Check,
  Tag,
  Layers,
  Building2,
  Folder,
  ExternalLink,
  MapPin,
  Database,
  ArrowRight,
  Loader2
} from 'lucide-react';
import PainelBackupRestauracao from './PainelBackupRestauracao';
import SortableHeader, { compararValores } from '../../components/common/SortableHeader';
import {
  carregarOperadores,
  salvarOperadores,
  adicionarOperador,
  editarOperador,
  excluirOperador,
  alternarStatusOperador,
  restaurarOperadoresPadrao,
  exportarOperadoresDownloadExcel
} from '../../services/operadoresService';
import {
  carregarVigilantes,
  salvarVigilantes,
  adicionarVigilante,
  editarVigilante,
  excluirVigilante,
  alternarStatusVigilante,
  restaurarVigilantesPadrao,
  exportarVigilantesDownloadExcel
} from '../../services/vigilantesService';
import {
  alterarSenhaMestra,
  obterSenhaMestra
} from '../../services/segurancaService';
import {
  carregarTurnos,
  adicionarTurno,
  editarTurno,
  excluirTurno,
  alternarStatusTurno,
  restaurarTurnosPadrao,
  obterNomesTurnosAtivos
} from '../../services/turnosService';
import {
  carregarObservacoes,
  adicionarObservacao,
  editarObservacao,
  excluirObservacao,
  alternarStatusObservacao,
  restaurarObservacoesPadrao,
  obterNomesObservacoesAtivas
} from '../../services/observacoesService';
import {
  carregarResponsaveis,
  salvarResponsaveis,
  restaurarResponsaveisPadrao,
  PADRAO_RESPONSAVEIS
} from '../../services/responsaveisService';
import {
  carregarCargos,
  adicionarCargo,
  editarCargo,
  excluirCargo,
  alternarStatusCargo,
  restaurarCargosPadrao,
  carregarSugestoesObservacoes,
  adicionarSugestaoObservacao,
  editarSugestaoObservacao,
  excluirSugestaoObservacao,
  alternarStatusSugestaoObservacao,
  restaurarSugestoesObservacoesPadrao,
  obterCargosSincrono,
  obterSugestoesSincrono,
  CARGOS_PADRAO,
  SUGESTOES_OBS_PADRAO
} from '../../services/cargosService';
import {
  carregarTaxonomia,
  adicionarPredioArea,
  editarPredioArea,
  excluirPredioArea,
  alternarStatusPredioArea,
  restaurarTaxonomiaPadrao,
  obterTaxonomiaSincrona
} from '../../services/taxonomiaService';

export default function ConfiguracoesView({ onBloquear }) {
  // Controle da Aba Ativa
  const [abaAtiva, setAbaAtiva] = useState('operadores'); // 'operadores' | 'vigilantes' | 'turnos' | 'observacoes' | 'responsaveis' | 'seguranca' | 'backup'

  // Toast Feedback Global
  const [toast, setToast] = useState(null);
  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // =========================================================================
  // 1. ESTADOS E CRUD: OPERADORES DO SISTEMA CCO
  // =========================================================================
  const [operadores, setOperadores] = useState([]);
  const [loadingOperadores, setLoadingOperadores] = useState(true);
  const [buscaOperadores, setBuscaOperadores] = useState('');
  const [filtroStatusOperador, setFiltroStatusOperador] = useState('TODOS');
  const [filtroTurnoOperador, setFiltroTurnoOperador] = useState('TODOS');

  const [modalOperadorAberto, setModalOperadorAberto] = useState(false);
  const [operadorEditando, setOperadorEditando] = useState(null);
  const [salvandoOperador, setSalvandoOperador] = useState(false);
  const [excluindoOperador, setExcluindoOperador] = useState(false);
  const [formOperador, setFormOperador] = useState({
    nome: '',
    matricula: '',
    cargo: 'Operador CCO',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: ''
  });
  const [erroFormOperador, setErroFormOperador] = useState('');
  const [operadorExcluindo, setOperadorExcluindo] = useState(null);

  // =========================================================================
  // 1.1. ESTADOS E CRUD: EQUIPE DE VIGILÂNCIA (POSTOS / PORTARIAS / RONDA)
  // =========================================================================
  const [vigilantes, setVigilantes] = useState([]);
  const [loadingVigilantes, setLoadingVigilantes] = useState(true);
  const [buscaVigilantes, setBuscaVigilantes] = useState('');
  const [filtroStatusVigilante, setFiltroStatusVigilante] = useState('TODOS');
  const [filtroPostoVigilante, setFiltroPostoVigilante] = useState('TODOS');

  const [modalVigilanteAberto, setModalVigilanteAberto] = useState(false);
  const [vigilanteEditando, setVigilanteEditando] = useState(null);
  const [salvandoVigilante, setSalvandoVigilante] = useState(false);
  const [excluindoVigilante, setExcluindoVigilante] = useState(false);
  const [formVigilante, setFormVigilante] = useState({
    nome: '',
    matricula: '',
    posto: 'Portaria 1',
    cargo: 'Vigilante Portaria 1',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: ''
  });
  const [erroFormVigilante, setErroFormVigilante] = useState('');
  const [vigilanteExcluindo, setVigilanteExcluindo] = useState(null);

  // =========================================================================
  // 2. ESTADOS E CRUD: TURNOS OPERACIONAIS
  // =========================================================================
  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [buscaTurnos, setBuscaTurnos] = useState('');
  const [filtroStatusTurno, setFiltroStatusTurno] = useState('TODOS');

  const [modalTurnoAberto, setModalTurnoAberto] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [formTurno, setFormTurno] = useState({
    nome: '',
    descricao: '',
    status: 'Ativo'
  });
  const [erroFormTurno, setErroFormTurno] = useState('');
  const [turnoExcluindo, setTurnoExcluindo] = useState(null);

  // =========================================================================
  // 3. ESTADOS E CRUD: OBSERVAÇÕES PADRÃO
  // =========================================================================
  const [observacoes, setObservacoes] = useState([]);
  const [loadingObservacoes, setLoadingObservacoes] = useState(true);
  const [buscaObs, setBuscaObs] = useState('');
  const [filtroStatusObs, setFiltroStatusObs] = useState('TODOS');

  const [modalObsAberto, setModalObsAberto] = useState(false);
  const [obsEditando, setObsEditando] = useState(null);
  const [formObs, setFormObs] = useState({
    nome: '',
    descricao: '',
    status: 'Ativo'
  });
  const [erroFormObs, setErroFormObs] = useState('');
  const [obsExcluindo, setObsExcluindo] = useState(null);

  // =========================================================================
  // 3.1. ESTADOS E CRUD: CARGOS (OPERADORES & VIGILANTES)
  // =========================================================================
  const [cargos, setCargos] = useState(() => obterCargosSincrono());
  const [loadingCargos, setLoadingCargos] = useState(true);
  const [buscaCargo, setBuscaCargo] = useState('');
  const [filtroTipoCargo, setFiltroTipoCargo] = useState('TODOS');
  const [filtroStatusCargo, setFiltroStatusCargo] = useState('TODOS');

  const [modalCargoAberto, setModalCargoAberto] = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [formCargo, setFormCargo] = useState({
    nome: '',
    tipo: 'OPERADOR', // 'OPERADOR' | 'VIGILANTE'
    status: 'Ativo'
  });
  const [erroFormCargo, setErroFormCargo] = useState('');
  const [cargoExcluindo, setCargoExcluindo] = useState(null);

  // =========================================================================
  // 3.2. ESTADOS E CRUD: SUGESTÕES RÁPIDAS DE OBSERVAÇÕES
  // =========================================================================
  const [sugestoesObs, setSugestoesObs] = useState(() => obterSugestoesSincrono());
  const [loadingSugestoes, setLoadingSugestoes] = useState(true);
  const [buscaSugestao, setBuscaSugestao] = useState('');
  const [filtroTipoSugestao, setFiltroTipoSugestao] = useState('TODOS');
  const [filtroStatusSugestao, setFiltroStatusSugestao] = useState('TODOS');

  const [modalSugestaoAberto, setModalSugestaoAberto] = useState(false);
  const [sugestaoEditando, setSugestaoEditando] = useState(null);
  const [formSugestao, setFormSugestao] = useState({
    texto: '',
    tipo: 'OPERADOR', // 'OPERADOR' | 'VIGILANTE'
    status: 'Ativo'
  });
  const [erroFormSugestao, setErroFormSugestao] = useState('');
  const [sugestaoExcluindo, setSugestaoExcluindo] = useState(null);

  // =========================================================================
  // 3.3. ESTADOS E CRUD: MAPEAMENTO DE PRÉDIOS E ÁREAS (OCORRÊNCIAS)
  // =========================================================================
  const [taxonomia, setTaxonomia] = useState(() => obterTaxonomiaSincrona());
  const [loadingTaxonomia, setLoadingTaxonomia] = useState(true);
  const [buscaTaxonomia, setBuscaTaxonomia] = useState('');
  const [filtroPredioTaxonomia, setFiltroPredioTaxonomia] = useState('TODOS');
  const [filtroStatusTaxonomia, setFiltroStatusTaxonomia] = useState('TODOS');
  const [sortTaxonomia, setSortTaxonomia] = useState({ field: 'predio', order: 'asc' });

  const [modalTaxonomiaAberto, setModalTaxonomiaAberto] = useState(false);
  const [itemTaxonomiaEditando, setItemTaxonomiaEditando] = useState(null);
  const [formTaxonomia, setFormTaxonomia] = useState({
    predio: '',
    area: '',
    status: 'Ativo'
  });
  const [erroFormTaxonomia, setErroFormTaxonomia] = useState('');
  const [itemTaxonomiaExcluindo, setItemTaxonomiaExcluindo] = useState(null);
  const [modoNovoPredio, setModoNovoPredio] = useState(false);

  // =========================================================================
  // 4. ESTADOS: SEGURANÇA DO SISTEMA (SENHA MESTRA)
  // =========================================================================
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [dataAtualizacaoSenha, setDataAtualizacaoSenha] = useState('');

  // =========================================================================
  // 5. ESTADOS: RESPONSÁVEIS DO SITE & DIRETÓRIO DE REDE (PDF RO)
  // =========================================================================
  const [responsaveis, setResponsaveis] = useState(PADRAO_RESPONSAVEIS);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(true);
  const [salvandoResponsaveis, setSalvandoResponsaveis] = useState(false);
  const [formResponsaveis, setFormResponsaveis] = useState(PADRAO_RESPONSAVEIS);
  const [houveAlteracaoResponsaveis, setHouveAlteracaoResponsaveis] = useState(false);

  // =========================================================================
  // ESTADOS DE ORDENAÇÃO DINÂMICA DAS TABELAS (SORTABLE HEADERS)
  // =========================================================================
  const [sortOperadores, setSortOperadores] = useState({ field: 'nome', order: 'asc' });
  const [sortVigilantes, setSortVigilantes] = useState({ field: 'nome', order: 'asc' });
  const [sortTurnos, setSortTurnos] = useState({ field: 'nome', order: 'asc' });
  const [sortObs, setSortObs] = useState({ field: 'nome', order: 'asc' });
  const [sortCargos, setSortCargos] = useState({ field: 'nome', order: 'asc' });
  const [sortSugestoes, setSortSugestoes] = useState({ field: 'texto', order: 'asc' });

  const handleSortOperadores = (field) => setSortOperadores(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
  const handleSortVigilantes = (field) => setSortVigilantes(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
  const handleSortTurnos = (field) => setSortTurnos(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
  const handleSortObs = (field) => setSortObs(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
  const handleSortCargos = (field) => setSortCargos(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
  const handleSortSugestoes = (field) => setSortSugestoes(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));

  // =========================================================================
  // INICIALIZAÇÃO & LISTENERS GLOBAIS
  // =========================================================================
  useEffect(() => {
    carregarTodosOsDados();

    const handleOperadoresChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setOperadores(e.detail);
      } else {
        carregarListaOperadores(false);
      }
    };
    const handleVigilantesChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setVigilantes(e.detail);
      } else {
        carregarListaVigilantes(false);
      }
    };
    const handleTurnosChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setTurnos(e.detail);
      } else {
        carregarListaTurnos(false);
      }
    };
    const handleObservacoesChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setObservacoes(e.detail);
      } else {
        carregarListaObservacoes(false);
      }
    };
    const handleSenhaChanged = () => carregarInfoSeguranca();
    const handleResponsaveisChanged = (e) => {
      if (e && e.detail && typeof e.detail === 'object') {
        setResponsaveis(e.detail);
        setFormResponsaveis(e.detail);
        setHouveAlteracaoResponsaveis(false);
      } else {
        carregarDadosResponsaveis(false);
      }
    };
    const handleCargosChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setCargos(e.detail);
      } else {
        carregarListaCargos(false);
      }
    };
    const handleSugestoesObsChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setSugestoesObs(e.detail);
      } else {
        carregarListaSugestoesObs(false);
      }
    };

    window.addEventListener('cco_operadores_changed', handleOperadoresChanged);
    window.addEventListener('cco_vigilantes_changed', handleVigilantesChanged);
    window.addEventListener('cco_turnos_changed', handleTurnosChanged);
    window.addEventListener('cco_observacoes_changed', handleObservacoesChanged);
    window.addEventListener('cco_senha_changed', handleSenhaChanged);
    window.addEventListener('cco_responsaveis_changed', handleResponsaveisChanged);
    window.addEventListener('cco_cargos_changed', handleCargosChanged);
    window.addEventListener('cco_sugestoes_obs_changed', handleSugestoesObsChanged);
    const handleTaxonomiaChanged = (e) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setTaxonomia(e.detail);
      } else {
        carregarListaTaxonomia(false);
      }
    };
    window.addEventListener('cco_taxonomia_changed', handleTaxonomiaChanged);

    return () => {
      window.removeEventListener('cco_operadores_changed', handleOperadoresChanged);
      window.removeEventListener('cco_vigilantes_changed', handleVigilantesChanged);
      window.removeEventListener('cco_turnos_changed', handleTurnosChanged);
      window.removeEventListener('cco_observacoes_changed', handleObservacoesChanged);
      window.removeEventListener('cco_senha_changed', handleSenhaChanged);
      window.removeEventListener('cco_responsaveis_changed', handleResponsaveisChanged);
      window.removeEventListener('cco_cargos_changed', handleCargosChanged);
      window.removeEventListener('cco_sugestoes_obs_changed', handleSugestoesObsChanged);
      window.removeEventListener('cco_taxonomia_changed', handleTaxonomiaChanged);
    };
  }, []);

  const carregarTodosOsDados = async () => {
    await Promise.all([
      carregarListaOperadores(),
      carregarListaVigilantes(),
      carregarListaTurnos(),
      carregarListaObservacoes(),
      carregarListaCargos(),
      carregarListaSugestoesObs(),
      carregarListaTaxonomia(),
      carregarInfoSeguranca(),
      carregarDadosResponsaveis()
    ]);
  };

  const carregarDadosResponsaveis = async (comLoading = true) => {
    if (comLoading) setLoadingResponsaveis(true);
    try {
      const dados = await carregarResponsaveis();
      setResponsaveis(dados);
      setFormResponsaveis(dados);
      setHouveAlteracaoResponsaveis(false);
    } catch (e) {
      console.error('Erro ao carregar responsáveis do site:', e);
      showToast('Erro ao carregar responsáveis do site.', 'error');
    } finally {
      if (comLoading) setLoadingResponsaveis(false);
    }
  };

  const handleSelecionarPastaNativa = async () => {
    const api = typeof window !== 'undefined' ? window.electronAPI : null;
    const selectFn = api?.selectDirectory || api?.selecionarPasta;

    if (typeof selectFn === 'function') {
      try {
        const resultado = await selectFn(formResponsaveis.caminhoRede);
        const pastaEscolhida = typeof resultado === 'string'
          ? resultado
          : (resultado && !resultado.canceled && Array.isArray(resultado.filePaths) && resultado.filePaths[0])
            ? resultado.filePaths[0]
            : null;

        if (pastaEscolhida) {
          setFormResponsaveis(prev => ({ ...prev, caminhoRede: pastaEscolhida }));
          setHouveAlteracaoResponsaveis(true);
          showToast(`Pasta selecionada no computador: ${pastaEscolhida}`, 'info');
        }
      } catch (err) {
        console.error('Erro ao selecionar pasta nativa no Electron:', err);
        showToast('Falha ao abrir seletor de pastas: ' + err.message, 'error');
      }
    } else {
      showToast(
        'Ambiente Web: O seletor nativo de pastas do Windows está ativo no aplicativo Desktop. Você pode digitar ou colar o caminho diretamente no campo.',
        'info'
      );
    }
  };

  const handleAbrirPastaExportacoes = async () => {
    if (window.electronAPI?.abrirPasta) {
      try {
        const ok = await window.electronAPI.abrirPasta(formResponsaveis.caminhoRede || '');
        if (ok) {
          showToast('Pasta aberta com sucesso no Windows Explorer.', 'success');
        } else {
          showToast('Não foi possível abrir o diretório no Windows Explorer.', 'error');
        }
      } catch (err) {
        showToast('Erro ao abrir pasta: ' + err.message, 'error');
      }
    } else {
      showToast('Abertura de pastas disponível na versão desktop do aplicativo.', 'info');
    }
  };

  const handleSalvarResponsaveis = async (e) => {
    if (e) e.preventDefault();
    setSalvandoResponsaveis(true);
    try {
      const caminho = (formResponsaveis.caminhoRede || '').trim();
      // Validação amigável para caracteres proibidos no Windows
      if (caminho && /[?*"<>|]/.test(caminho)) {
        throw new Error('O caminho especificado contém caracteres inválidos para o Windows (? * " < > |).');
      }

      const salvos = await salvarResponsaveis(formResponsaveis);
      setResponsaveis(salvos);
      setFormResponsaveis(salvos);
      setHouveAlteracaoResponsaveis(false);
      showToast('✓ Responsáveis e diretório de salvamento atualizados com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar responsáveis:', err);
      showToast('Erro ao salvar diretório ou responsáveis: ' + err.message, 'error');
    } finally {
      setSalvandoResponsaveis(false);
    }
  };

  const handleRestaurarResponsaveisPadrao = async () => {
    if (window.confirm('Deseja restaurar os Responsáveis do Site e Diretório de Rede para os valores originais de fábrica?')) {
      setSalvandoResponsaveis(true);
      try {
        const padrao = await restaurarResponsaveisPadrao();
        setResponsaveis(padrao);
        setFormResponsaveis(padrao);
        setHouveAlteracaoResponsaveis(false);
        showToast('✓ Parâmetros de responsáveis restaurados para o padrão de fábrica!');
      } catch (err) {
        showToast('Erro ao restaurar responsáveis: ' + err.message, 'error');
      } finally {
        setSalvandoResponsaveis(false);
      }
    }
  };

  const carregarListaOperadores = async (comLoading = true) => {
    if (comLoading) setLoadingOperadores(true);
    try {
      const dados = await carregarOperadores();
      setOperadores(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar operadores:', err);
      showToast('Erro ao carregar lista de operadores.', 'error');
    } finally {
      if (comLoading) setLoadingOperadores(false);
    }
  };

  const carregarListaVigilantes = async (comLoading = true) => {
    if (comLoading) setLoadingVigilantes(true);
    try {
      const dados = await carregarVigilantes();
      setVigilantes(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar vigilantes:', err);
      showToast('Erro ao carregar lista de vigilantes.', 'error');
    } finally {
      if (comLoading) setLoadingVigilantes(false);
    }
  };

  const carregarListaTurnos = async (comLoading = true) => {
    if (comLoading) setLoadingTurnos(true);
    try {
      const dados = await carregarTurnos();
      setTurnos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar turnos:', err);
      showToast('Erro ao carregar lista de turnos.', 'error');
    } finally {
      if (comLoading) setLoadingTurnos(false);
    }
  };

  const carregarListaObservacoes = async (comLoading = true) => {
    if (comLoading) setLoadingObservacoes(true);
    try {
      const dados = await carregarObservacoes();
      setObservacoes(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar observações:', err);
      showToast('Erro ao carregar lista de observações.', 'error');
    } finally {
      if (comLoading) setLoadingObservacoes(false);
    }
  };

  const carregarInfoSeguranca = async () => {
    try {
      const info = await obterSenhaMestra();
      if (info && info.dataAtualizacao) {
        setDataAtualizacaoSenha(info.dataAtualizacao);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados de segurança:', e);
    }
  };

  // =========================================================================
  // MÉTODOS OPERADORES
  // =========================================================================
  const statsOperadores = useMemo(() => {
    const lista = Array.isArray(operadores) ? operadores : [];
    const total = lista.length;
    const ativos = lista.filter(o => o && o.status === 'Ativo').length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [operadores]);

  const operadoresFiltrados = useMemo(() => {
    const lista = Array.isArray(operadores) ? operadores : [];
    const filtrados = lista.filter(op => {
      if (!op) return false;
      const matchBusca =
        (op.nome || '').toLowerCase().includes(buscaOperadores.toLowerCase()) ||
        op.matricula?.toLowerCase().includes(buscaOperadores.toLowerCase()) ||
        op.cargo?.toLowerCase().includes(buscaOperadores.toLowerCase()) ||
        op.observacoes?.toLowerCase().includes(buscaOperadores.toLowerCase());

      const matchStatus =
        filtroStatusOperador === 'TODOS' || op.status === filtroStatusOperador;

      const matchTurno =
        filtroTurnoOperador === 'TODOS' || op.turno === filtroTurnoOperador;

      return matchBusca && matchStatus && matchTurno;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortOperadores.field, sortOperadores.order));
  }, [operadores, buscaOperadores, filtroStatusOperador, filtroTurnoOperador, sortOperadores]);

  const turnosDisponiveisOperador = useMemo(() => {
    const lista = Array.isArray(turnos) ? turnos : [];
    const ativos = lista.filter(t => t && t.status === 'Ativo').map(t => t.nome);
    if (ativos.length > 0) return ativos;
    return ['12x36 Diurno', '12x36 Noturno', 'Administrativo'];
  }, [turnos]);

  const abrirModalNovoOperador = () => {
    setOperadorEditando(null);
    carregarListaCargos(false);
    carregarListaSugestoesObs(false);
    const cargoPadrao = (cargosOperadoresAtivos && cargosOperadoresAtivos.length > 0)
      ? cargosOperadoresAtivos[0]
      : 'Op. Central de Segurança';
    setFormOperador({
      nome: '',
      matricula: `CCO-${Math.floor(1000 + Math.random() * 9000)}`,
      cargo: cargoPadrao,
      turno: turnosDisponiveisOperador[0] || '12x36 Diurno',
      status: 'Ativo',
      observacoes: ''
    });
    setErroFormOperador('');
    setModalOperadorAberto(true);
  };

  const abrirModalEditarOperador = (op) => {
    setOperadorEditando(op);
    carregarListaCargos(false);
    carregarListaSugestoesObs(false);
    setFormOperador({
      nome: op.nome || '',
      matricula: op.matricula || '',
      cargo: op.cargo || (cargosOperadoresAtivos[0] || 'Op. Central de Segurança'),
      turno: op.turno || turnosDisponiveisOperador[0] || '12x36 Diurno',
      status: op.status || 'Ativo',
      observacoes: op.observacoes || ''
    });
    setErroFormOperador('');
    setModalOperadorAberto(true);
  };

  const handleSalvarOperador = async (e) => {
    e.preventDefault();
    const nomeLimpo = (formOperador.nome || '').trim();
    if (!nomeLimpo) {
      setErroFormOperador('Por favor, informe o Nome Completo do Operador do Sistema CCO.');
      return;
    }

    setSalvandoOperador(true);
    setErroFormOperador('');
    try {
      if (operadorEditando) {
        await editarOperador(operadorEditando.id, {
          ...formOperador,
          nome: nomeLimpo
        });
        showToast(`Cadastro do operador "${nomeLimpo}" atualizado com sucesso!`);
      } else {
        await adicionarOperador({
          ...formOperador,
          nome: nomeLimpo
        });
        showToast(`Cadastro do operador "${nomeLimpo}" adicionado com sucesso!`);
      }
      setModalOperadorAberto(false);
      await carregarListaOperadores(false);
    } catch (err) {
      setErroFormOperador(err.message || 'Erro ao salvar operador.');
    } finally {
      setSalvandoOperador(false);
    }
  };

  const handleAlternarStatusOperador = async (id, nomeAtual, statusAtual) => {
    try {
      await alternarStatusOperador(id);
      const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
      showToast(`Status do operador "${nomeAtual}" alterado para ${novoStatus}.`);
      await carregarListaOperadores(false);
    } catch (err) {
      showToast('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoOperador = async () => {
    if (!operadorExcluindo) return;
    const nome = operadorExcluindo.nome;
    setExcluindoOperador(true);
    try {
      await excluirOperador(operadorExcluindo.id);
      showToast(`Operador "${nome}" excluído com sucesso.`);
      setOperadorExcluindo(null);
      await carregarListaOperadores(false);
    } catch (err) {
      showToast('Erro ao excluir operador: ' + err.message, 'error');
    } finally {
      setExcluindoOperador(false);
      setOperadorExcluindo(null);
    }
  };

  const handleRestaurarOperadoresPadrao = async () => {
    if (window.confirm('Deseja realmente restaurar a lista padrão de operadores da CCO? Suas edições atuais serão substituídas pelo efetivo base.')) {
      try {
        await restaurarOperadoresPadrao();
        showToast('Efetivo padrão de operadores CCO restaurado com sucesso!');
        await carregarListaOperadores(false);
      } catch (err) {
        showToast('Erro ao restaurar padrão: ' + err.message, 'error');
      }
    }
  };

  const handleExportarExcelOperadores = () => {
    try {
      const fileName = exportarOperadoresDownloadExcel(operadores);
      showToast(`Planilha ${fileName} baixada com sucesso!`);
    } catch (err) {
      showToast('Erro ao exportar planilha.', 'error');
    }
  };

  // =========================================================================
  // MÉTODOS EQUIPE DE VIGILÂNCIA (POSTOS / PORTARIAS / RONDA)
  // =========================================================================
  const statsVigilantes = useMemo(() => {
    const lista = Array.isArray(vigilantes) ? vigilantes : [];
    const total = lista.length;
    const ativos = lista.filter(v => v && v.status === 'Ativo').length;
    const inativos = total - ativos;
    const postosUnicos = Array.from(new Set(lista.map(v => v.posto || v.cargo).filter(Boolean))).length;
    return { total, ativos, inativos, postosUnicos };
  }, [vigilantes]);

  const vigilantesFiltrados = useMemo(() => {
    const lista = Array.isArray(vigilantes) ? vigilantes : [];
    const filtrados = lista.filter(v => {
      if (!v) return false;
      const matchBusca =
        (v.nome || '').toLowerCase().includes(buscaVigilantes.toLowerCase()) ||
        v.matricula?.toLowerCase().includes(buscaVigilantes.toLowerCase()) ||
        v.posto?.toLowerCase().includes(buscaVigilantes.toLowerCase()) ||
        v.cargo?.toLowerCase().includes(buscaVigilantes.toLowerCase()) ||
        v.observacoes?.toLowerCase().includes(buscaVigilantes.toLowerCase());

      const matchStatus =
        filtroStatusVigilante === 'TODOS' || v.status === filtroStatusVigilante;

      const matchPosto =
        filtroPostoVigilante === 'TODOS' || (v.posto || v.cargo) === filtroPostoVigilante;

      return matchBusca && matchStatus && matchPosto;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortVigilantes.field, sortVigilantes.order));
  }, [vigilantes, buscaVigilantes, filtroStatusVigilante, filtroPostoVigilante, sortVigilantes]);

  const postosDisponiveisVigilantes = useMemo(() => {
    const lista = Array.isArray(vigilantes) ? vigilantes : [];
    const postos = lista.map(v => v.posto || v.cargo).filter(Boolean);
    return Array.from(new Set(['Portaria 1', 'Portaria 2', 'Caldeira', 'Cobertura', ...postos]));
  }, [vigilantes]);

  const abrirModalNovoVigilante = () => {
    setVigilanteEditando(null);
    carregarListaCargos(false);
    carregarListaSugestoesObs(false);
    const cargoPadrao = (cargosVigilantesAtivos && cargosVigilantesAtivos.length > 0)
      ? cargosVigilantesAtivos[0]
      : 'Vigilante Portaria 1';
    setFormVigilante({
      nome: '',
      matricula: `VIG-${Math.floor(1000 + Math.random() * 9000)}`,
      posto: 'Portaria 1',
      cargo: cargoPadrao,
      turno: turnosDisponiveisOperador[0] || '12x36 Diurno',
      status: 'Ativo',
      observacoes: ''
    });
    setErroFormVigilante('');
    setModalVigilanteAberto(true);
  };

  const abrirModalEditarVigilante = (v) => {
    setVigilanteEditando(v);
    carregarListaCargos(false);
    carregarListaSugestoesObs(false);
    setFormVigilante({
      nome: v.nome || '',
      matricula: v.matricula || '',
      posto: v.posto || 'Portaria 1',
      cargo: v.cargo || (cargosVigilantesAtivos[0] || 'Vigilante Portaria 1'),
      turno: v.turno || turnosDisponiveisOperador[0] || '12x36 Diurno',
      status: v.status || 'Ativo',
      observacoes: v.observacoes || ''
    });
    setErroFormVigilante('');
    setModalVigilanteAberto(true);
  };

  const handleSalvarVigilante = async (e) => {
    e.preventDefault();
    const nomeLimpo = (formVigilante.nome || '').trim();
    if (!nomeLimpo) {
      setErroFormVigilante('Por favor, informe o Nome Completo do Vigilante de Posto.');
      return;
    }

    setSalvandoVigilante(true);
    setErroFormVigilante('');
    try {
      if (vigilanteEditando) {
        await editarVigilante(vigilanteEditando.id, {
          ...formVigilante,
          nome: nomeLimpo
        });
        showToast(`Cadastro do vigilante "${nomeLimpo}" atualizado com sucesso!`);
      } else {
        await adicionarVigilante({
          ...formVigilante,
          nome: nomeLimpo
        });
        showToast(`Cadastro do vigilante "${nomeLimpo}" adicionado com sucesso!`);
      }
      setModalVigilanteAberto(false);
      await carregarListaVigilantes(false);
    } catch (err) {
      setErroFormVigilante(err.message || 'Erro ao salvar vigilante.');
    } finally {
      setSalvandoVigilante(false);
    }
  };

  const handleAlternarStatusVigilante = async (id, nomeAtual, statusAtual) => {
    try {
      await alternarStatusVigilante(id);
      const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
      showToast(`Status do vigilante "${nomeAtual}" alterado para ${novoStatus}.`);
      await carregarListaVigilantes(false);
    } catch (err) {
      showToast('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoVigilante = async () => {
    if (!vigilanteExcluindo) return;
    const nome = vigilanteExcluindo.nome;
    setExcluindoVigilante(true);
    try {
      await excluirVigilante(vigilanteExcluindo.id);
      showToast(`Vigilante "${nome}" excluído com sucesso.`);
      setVigilanteExcluindo(null);
      await carregarListaVigilantes(false);
    } catch (err) {
      showToast('Erro ao excluir vigilante: ' + err.message, 'error');
    } finally {
      setExcluindoVigilante(false);
      setVigilanteExcluindo(null);
    }
  };

  const handleRestaurarVigilantesPadrao = async () => {
    if (window.confirm('Deseja realmente restaurar a lista padrão de vigilantes de posto? (Portaria 1, Portaria 2 e Ronda)')) {
      try {
        await restaurarVigilantesPadrao();
        showToast('Efetivo de vigilantes padrão restaurado com sucesso!');
        await carregarListaVigilantes(false);
      } catch (err) {
        showToast('Erro ao restaurar padrão: ' + err.message, 'error');
      }
    }
  };

  const handleExportarExcelVigilantes = () => {
    try {
      const fileName = exportarVigilantesDownloadExcel(vigilantes);
      showToast(`Planilha ${fileName} baixada com sucesso!`);
    } catch (err) {
      showToast('Erro ao exportar planilha.', 'error');
    }
  };

  // =========================================================================
  // MÉTODOS TURNOS OPERACIONAIS
  // =========================================================================
  const statsTurnos = useMemo(() => {
    const lista = Array.isArray(turnos) ? turnos : [];
    const total = lista.length;
    const ativos = lista.filter(t => t && t.status === 'Ativo').length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [turnos]);

  const turnosFiltrados = useMemo(() => {
    const lista = Array.isArray(turnos) ? turnos : [];
    const filtrados = lista.filter(t => {
      if (!t) return false;
      const matchBusca =
        (t.nome || '').toLowerCase().includes(buscaTurnos.toLowerCase()) ||
        t.descricao?.toLowerCase().includes(buscaTurnos.toLowerCase());

      const matchStatus =
        filtroStatusTurno === 'TODOS' || t.status === filtroStatusTurno;

      return matchBusca && matchStatus;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortTurnos.field, sortTurnos.order));
  }, [turnos, buscaTurnos, filtroStatusTurno, sortTurnos]);

  const abrirModalNovoTurno = () => {
    setTurnoEditando(null);
    setFormTurno({
      nome: '',
      descricao: '',
      status: 'Ativo'
    });
    setErroFormTurno('');
    setModalTurnoAberto(true);
  };

  const abrirModalEditarTurno = (t) => {
    setTurnoEditando(t);
    setFormTurno({
      nome: t.nome || '',
      descricao: t.descricao || '',
      status: t.status || 'Ativo'
    });
    setErroFormTurno('');
    setModalTurnoAberto(true);
  };

  const handleSalvarTurno = async (e) => {
    e.preventDefault();
    if (!formTurno.nome.trim()) {
      setErroFormTurno('Por favor, informe o nome do turno.');
      return;
    }

    try {
      if (turnoEditando) {
        await editarTurno(turnoEditando.id, formTurno);
        showToast(`Turno "${formTurno.nome}" atualizado com sucesso!`);
      } else {
        await adicionarTurno(formTurno);
        showToast(`Turno "${formTurno.nome}" cadastrado com sucesso!`);
      }
      setModalTurnoAberto(false);
      await carregarListaTurnos(false);
    } catch (err) {
      setErroFormTurno(err.message || 'Erro ao salvar turno.');
    }
  };

  const handleAlternarStatusTurno = async (id, nomeAtual, statusAtual) => {
    try {
      await alternarStatusTurno(id);
      const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
      showToast(`Status do turno "${nomeAtual}" alterado para ${novoStatus}.`);
      await carregarListaTurnos(false);
    } catch (err) {
      showToast('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoTurno = async () => {
    if (!turnoExcluindo) return;
    try {
      await excluirTurno(turnoExcluindo.id);
      showToast(`Turno "${turnoExcluindo.nome}" excluído com sucesso.`);
      setTurnoExcluindo(null);
      await carregarListaTurnos(false);
    } catch (err) {
      showToast('Erro ao excluir turno: ' + err.message, 'error');
    }
  };

  const handleRestaurarTurnosPadrao = async () => {
    if (window.confirm('Deseja restaurar os turnos padrão de fábrica? (12x36 Diurno, 12x36 Noturno e Administrativo)')) {
      try {
        await restaurarTurnosPadrao();
        showToast('Turnos padrão restaurados com sucesso!');
        await carregarListaTurnos(false);
      } catch (err) {
        showToast('Erro ao restaurar turnos: ' + err.message, 'error');
      }
    }
  };

  // =========================================================================
  // MÉTODOS OBSERVAÇÕES PADRÃO
  // =========================================================================
  const statsObservacoes = useMemo(() => {
    const lista = Array.isArray(observacoes) ? observacoes : [];
    const total = lista.length;
    const ativas = lista.filter(o => o && o.status === 'Ativo').length;
    const inativas = total - ativas;
    return { total, ativas, inativas };
  }, [observacoes]);

  const observacoesFiltradas = useMemo(() => {
    const lista = Array.isArray(observacoes) ? observacoes : [];
    const filtrados = lista.filter(o => {
      if (!o) return false;
      const matchBusca =
        (o.nome || '').toLowerCase().includes(buscaObs.toLowerCase()) ||
        o.descricao?.toLowerCase().includes(buscaObs.toLowerCase());

      const matchStatus =
        filtroStatusObs === 'TODOS' || o.status === filtroStatusObs;

      return matchBusca && matchStatus;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortObs.field, sortObs.order));
  }, [observacoes, buscaObs, filtroStatusObs, sortObs]);

  const abrirModalNovaObs = () => {
    setObsEditando(null);
    setFormObs({
      nome: '',
      descricao: '',
      status: 'Ativo'
    });
    setErroFormObs('');
    setModalObsAberto(true);
  };

  const abrirModalEditarObs = (o) => {
    setObsEditando(o);
    setFormObs({
      nome: o.nome || '',
      descricao: o.descricao || '',
      status: o.status || 'Ativo'
    });
    setErroFormObs('');
    setModalObsAberto(true);
  };

  const handleSalvarObs = async (e) => {
    e.preventDefault();
    if (!formObs.nome.trim()) {
      setErroFormObs('Por favor, informe o identificador da observação.');
      return;
    }

    try {
      if (obsEditando) {
        await editarObservacao(obsEditando.id, formObs);
        showToast(`Observação "${formObs.nome.toUpperCase()}" atualizada com sucesso!`);
      } else {
        await adicionarObservacao(formObs);
        showToast(`Observação "${formObs.nome.toUpperCase()}" cadastrada com sucesso!`);
      }
      setModalObsAberto(false);
      await carregarListaObservacoes(false);
    } catch (err) {
      setErroFormObs(err.message || 'Erro ao salvar observação.');
    }
  };

  const handleAlternarStatusObs = async (id, nomeAtual, statusAtual) => {
    try {
      await alternarStatusObservacao(id);
      const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
      showToast(`Status da observação "${nomeAtual}" alterado para ${novoStatus}.`);
      await carregarListaObservacoes(false);
    } catch (err) {
      showToast('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoObs = async () => {
    if (!obsExcluindo) return;
    try {
      await excluirObservacao(obsExcluindo.id);
      showToast(`Observação "${obsExcluindo.nome}" excluída com sucesso.`);
      setObsExcluindo(null);
      await carregarListaObservacoes(false);
    } catch (err) {
      showToast('Erro ao excluir observação: ' + err.message, 'error');
    }
  };

  const handleRestaurarObsPadrao = async () => {
    if (window.confirm('Deseja restaurar as observações padrão de fábrica? (ESQUECEU, PERDEU, COM DEFEITO, etc.)')) {
      try {
        await restaurarObservacoesPadrao();
        showToast('Observações padrão restauradas com sucesso!');
        await carregarListaObservacoes(false);
      } catch (err) {
        showToast('Erro ao restaurar observações: ' + err.message, 'error');
      }
    }
  };

  // =========================================================================
  // MÉTODOS E CARREGAMENTO DE CARGOS & SUGESTÕES DE OBSERVAÇÃO
  // =========================================================================
  const carregarListaCargos = async (comLoading = true) => {
    if (comLoading) setLoadingCargos(true);
    try {
      const dados = await carregarCargos();
      setCargos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar cargos:', err);
    } finally {
      if (comLoading) setLoadingCargos(false);
    }
  };

  const carregarListaSugestoesObs = async (comLoading = true) => {
    if (comLoading) setLoadingSugestoes(true);
    try {
      const dados = await carregarSugestoesObservacoes();
      setSugestoesObs(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar sugestões de observação:', err);
    } finally {
      if (comLoading) setLoadingSugestoes(false);
    }
  };

  const cargosOperadoresAtivos = useMemo(() => {
    const lista = Array.isArray(cargos) ? cargos : [];
    const ativos = lista.filter(c => c && c.status === 'Ativo' && (c.tipo === 'OPERADOR' || c.tipo === 'AMBOS' || !c.tipo)).map(c => c.nome);
    return ativos.length > 0 ? ativos : ['Op. Central de Segurança', 'Operador CCO', 'Operador CCO Líder', 'Supervisor CCO', 'Administrador / Gestor CCO'];
  }, [cargos]);

  const cargosVigilantesAtivos = useMemo(() => {
    const lista = Array.isArray(cargos) ? cargos : [];
    const ativos = lista.filter(c => c && c.status === 'Ativo' && (c.tipo === 'VIGILANTE' || c.tipo === 'AMBOS' || !c.tipo)).map(c => c.nome);
    return ativos.length > 0 ? ativos : ['Vigilante Portaria 1', 'Vigilante Portaria 2', 'Vigilante Caldeira', 'Vigilante CFTV Campo', 'Inspetor de Segurança de Campo'];
  }, [cargos]);

  const cargosFiltrados = useMemo(() => {
    const lista = Array.isArray(cargos) ? cargos : [];
    const filtrados = lista.filter(c => {
      if (!c) return false;
      const matchBusca = (c.nome || '').toLowerCase().includes(buscaCargo.toLowerCase());
      const matchTipo = filtroTipoCargo === 'TODOS' || c.tipo === filtroTipoCargo;
      const matchStatus = filtroStatusCargo === 'TODOS' || c.status === filtroStatusCargo;
      return matchBusca && matchTipo && matchStatus;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortCargos.field, sortCargos.order));
  }, [cargos, buscaCargo, filtroTipoCargo, filtroStatusCargo, sortCargos]);

  const abrirModalNovoCargo = () => {
    setCargoEditando(null);
    setFormCargo({
      nome: '',
      tipo: 'OPERADOR',
      status: 'Ativo'
    });
    setErroFormCargo('');
    setModalCargoAberto(true);
  };

  const abrirModalEditarCargo = (cargo) => {
    setCargoEditando(cargo);
    setFormCargo({
      nome: cargo.nome || '',
      tipo: cargo.tipo || 'OPERADOR',
      status: cargo.status || 'Ativo'
    });
    setErroFormCargo('');
    setModalCargoAberto(true);
  };

  const handleSalvarCargo = async (e) => {
    e.preventDefault();
    if (!formCargo.nome.trim()) {
      setErroFormCargo('Por favor, informe o nome do cargo ou função.');
      return;
    }
    try {
      if (cargoEditando) {
        await editarCargo(cargoEditando.id, formCargo);
        showToast(`Cargo "${formCargo.nome}" atualizado com sucesso!`);
      } else {
        await adicionarCargo(formCargo);
        showToast(`Cargo "${formCargo.nome}" cadastrado com sucesso!`);
      }
      setModalCargoAberto(false);
      await carregarListaCargos(false);
    } catch (err) {
      setErroFormCargo(err.message || 'Erro ao salvar cargo.');
    }
  };

  const handleAlternarStatusCargo = async (id, nomeAtual, statusAtual) => {
    try {
      await alternarStatusCargo(id);
      const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
      showToast(`Status do cargo "${nomeAtual}" alterado para ${novoStatus}.`);
      await carregarListaCargos(false);
    } catch (err) {
      showToast('Erro ao alterar status do cargo: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoCargo = async () => {
    if (!cargoExcluindo) return;
    try {
      await excluirCargo(cargoExcluindo.id);
      showToast(`Cargo "${cargoExcluindo.nome}" excluído com sucesso.`);
      setCargoExcluindo(null);
      await carregarListaCargos(false);
    } catch (err) {
      showToast('Erro ao excluir cargo: ' + err.message, 'error');
    }
  };

  const handleRestaurarCargosPadrao = async () => {
    if (window.confirm('Deseja restaurar os cargos e funções padrão para Operadores e Vigilantes?')) {
      try {
        await restaurarCargosPadrao();
        showToast('Cargos padrão restaurados com sucesso!');
        await carregarListaCargos(false);
      } catch (err) {
        showToast('Erro ao restaurar cargos: ' + err.message, 'error');
      }
    }
  };

  const sugestoesOperadoresAtivas = useMemo(() => {
    const lista = Array.isArray(sugestoesObs) ? sugestoesObs : [];
    const ativas = lista.filter(s => s && s.status === 'Ativo' && (s.tipo === 'OPERADOR' || s.tipo === 'AMBOS' || !s.tipo)).map(s => s.texto);
    if (ativas.length > 0) return ativas;
    return SUGESTOES_OBS_PADRAO.filter(s => s.tipo === 'OPERADOR' || s.tipo === 'AMBOS').map(s => s.texto);
  }, [sugestoesObs]);

  const sugestoesVigilantesAtivas = useMemo(() => {
    const lista = Array.isArray(sugestoesObs) ? sugestoesObs : [];
    const ativas = lista.filter(s => s && s.status === 'Ativo' && (s.tipo === 'VIGILANTE' || s.tipo === 'AMBOS' || !s.tipo)).map(s => s.texto);
    if (ativas.length > 0) return ativas;
    return SUGESTOES_OBS_PADRAO.filter(s => s.tipo === 'VIGILANTE' || s.tipo === 'AMBOS').map(s => s.texto);
  }, [sugestoesObs]);

  const sugestoesFiltradas = useMemo(() => {
    const lista = Array.isArray(sugestoesObs) ? sugestoesObs : [];
    const filtrados = lista.filter(s => {
      if (!s) return false;
      const matchBusca = (s.texto || '').toLowerCase().includes(buscaSugestao.toLowerCase());
      const matchTipo = filtroTipoSugestao === 'TODOS' || s.tipo === filtroTipoSugestao;
      const matchStatus = filtroStatusSugestao === 'TODOS' || s.status === filtroStatusSugestao;
      return matchBusca && matchTipo && matchStatus;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortSugestoes.field, sortSugestoes.order));
  }, [sugestoesObs, buscaSugestao, filtroTipoSugestao, filtroStatusSugestao, sortSugestoes]);

  const abrirModalNovaSugestao = () => {
    setSugestaoEditando(null);
    setFormSugestao({
      texto: '',
      tipo: 'OPERADOR',
      status: 'Ativo'
    });
    setErroFormSugestao('');
    setModalSugestaoAberto(true);
  };

  const abrirModalEditarSugestao = (sug) => {
    setSugestaoEditando(sug);
    setFormSugestao({
      texto: sug.texto || '',
      tipo: sug.tipo || 'OPERADOR',
      status: sug.status || 'Ativo'
    });
    setErroFormSugestao('');
    setModalSugestaoAberto(true);
  };

  const handleSalvarSugestao = async (e) => {
    e.preventDefault();
    if (!formSugestao.texto.trim()) {
      setErroFormSugestao('Por favor, informe o texto da sugestão de observação.');
      return;
    }
    try {
      if (sugestaoEditando) {
        await editarSugestaoObservacao(sugestaoEditando.id, formSugestao);
        showToast(`Sugestão atualizada com sucesso!`);
      } else {
        await adicionarSugestaoObservacao(formSugestao);
        showToast(`Sugestão cadastrada com sucesso!`);
      }
      setModalSugestaoAberto(false);
      await carregarListaSugestoesObs(false);
    } catch (err) {
      setErroFormSugestao(err.message || 'Erro ao salvar sugestão.');
    }
  };

  const handleAlternarStatusSugestao = async (id, statusAtual) => {
    try {
      await alternarStatusSugestaoObservacao(id);
      const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
      showToast(`Status da sugestão alterado para ${novoStatus}.`);
      await carregarListaSugestoesObs(false);
    } catch (err) {
      showToast('Erro ao alterar status da sugestão: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoSugestao = async () => {
    if (!sugestaoExcluindo) return;
    try {
      await excluirSugestaoObservacao(sugestaoExcluindo.id);
      showToast(`Sugestão excluída com sucesso.`);
      setSugestaoExcluindo(null);
      await carregarListaSugestoesObs(false);
    } catch (err) {
      showToast('Erro ao excluir sugestão: ' + err.message, 'error');
    }
  };

  const handleRestaurarSugestoesPadrao = async () => {
    if (window.confirm('Deseja restaurar as sugestões de observação padrão para Operadores e Vigilantes?')) {
      try {
        await restaurarSugestoesObservacoesPadrao();
        showToast('Sugestões de observação padrão restauradas com sucesso!');
        await carregarListaSugestoesObs(false);
      } catch (err) {
        showToast('Erro ao restaurar sugestões: ' + err.message, 'error');
      }
    }
  };

  // =========================================================================
  // MÉTODOS TAXONOMIA: PRÉDIOS E ÁREAS DE OCORRÊNCIA
  // =========================================================================
  const carregarListaTaxonomia = async (comLoading = true) => {
    if (comLoading) setLoadingTaxonomia(true);
    try {
      const dados = await carregarTaxonomia();
      setTaxonomia(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar taxonomia de prédios e áreas:', err);
      showToast('Erro ao carregar lista de prédios e áreas.', 'error');
    } finally {
      if (comLoading) setLoadingTaxonomia(false);
    }
  };

  const handleSortTaxonomia = (field) => {
    setSortTaxonomia(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const statsTaxonomia = useMemo(() => {
    const lista = Array.isArray(taxonomia) ? taxonomia : [];
    const total = lista.length;
    const prediosUnicos = new Set(lista.map(i => i.predio).filter(Boolean)).size;
    const ativas = lista.filter(i => i && i.status === 'Ativo').length;
    const inativas = total - ativas;
    return { total, prediosUnicos, ativas, inativas };
  }, [taxonomia]);

  const prediosDisponiveisTaxonomia = useMemo(() => {
    const lista = Array.isArray(taxonomia) ? taxonomia : [];
    const predios = lista.map(i => i.predio).filter(Boolean);
    return Array.from(new Set(predios)).sort();
  }, [taxonomia]);

  const taxonomiaFiltrada = useMemo(() => {
    const lista = Array.isArray(taxonomia) ? taxonomia : [];
    const termo = buscaTaxonomia.toLowerCase().trim();

    const filtrados = lista.filter(item => {
      if (!item) return false;
      const matchBusca = !termo ||
        (item.predio || '').toLowerCase().includes(termo) ||
        (item.area || '').toLowerCase().includes(termo);

      const matchPredio = filtroPredioTaxonomia === 'TODOS' || item.predio === filtroPredioTaxonomia;
      const matchStatus = filtroStatusTaxonomia === 'TODOS' || item.status === filtroStatusTaxonomia;

      return matchBusca && matchPredio && matchStatus;
    });

    return [...filtrados].sort((a, b) => compararValores(a, b, sortTaxonomia.field, sortTaxonomia.order));
  }, [taxonomia, buscaTaxonomia, filtroPredioTaxonomia, filtroStatusTaxonomia, sortTaxonomia]);

  const abrirModalNovoTaxonomia = () => {
    setItemTaxonomiaEditando(null);
    setModoNovoPredio(false);
    setFormTaxonomia({
      predio: prediosDisponiveisTaxonomia[0] || 'RESTAURANTE (SODEXO)',
      area: '',
      status: 'Ativo'
    });
    setErroFormTaxonomia('');
    setModalTaxonomiaAberto(true);
  };

  const abrirModalEditarTaxonomia = (item) => {
    setItemTaxonomiaEditando(item);
    setModoNovoPredio(false);
    setFormTaxonomia({
      predio: item.predio || '',
      area: item.area || '',
      status: item.status || 'Ativo'
    });
    setErroFormTaxonomia('');
    setModalTaxonomiaAberto(true);
  };

  const handleSalvarTaxonomia = async (e) => {
    e.preventDefault();
    setErroFormTaxonomia('');
    if (!formTaxonomia.predio || !formTaxonomia.predio.trim()) {
      setErroFormTaxonomia('Por favor, informe ou selecione o Prédio.');
      return;
    }
    if (!formTaxonomia.area || !formTaxonomia.area.trim()) {
      setErroFormTaxonomia('Por favor, informe o nome da Área / Setor.');
      return;
    }

    try {
      if (itemTaxonomiaEditando) {
        await editarPredioArea(itemTaxonomiaEditando.id, formTaxonomia);
        showToast(`Área "${formTaxonomia.area.toUpperCase()}" atualizada com sucesso!`);
      } else {
        await adicionarPredioArea(formTaxonomia);
        showToast(`Área "${formTaxonomia.area.toUpperCase()}" cadastrada com sucesso!`);
      }
      setModalTaxonomiaAberto(false);
      await carregarListaTaxonomia(false);
    } catch (err) {
      setErroFormTaxonomia(err.message || 'Erro ao salvar área/prédio.');
    }
  };

  const handleAlternarStatusTaxonomia = async (id, statusAtual) => {
    try {
      const novoStatus = await alternarStatusPredioArea(id);
      showToast(`Status alterado para ${novoStatus}.`);
      await carregarListaTaxonomia(false);
    } catch (err) {
      showToast('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  const handleConfirmarExclusaoTaxonomia = async () => {
    if (!itemTaxonomiaExcluindo) return;
    try {
      await excluirPredioArea(itemTaxonomiaExcluindo.id);
      showToast(`Área "${itemTaxonomiaExcluindo.area}" excluída com sucesso.`);
      setItemTaxonomiaExcluindo(null);
      await carregarListaTaxonomia(false);
    } catch (err) {
      showToast('Erro ao excluir: ' + err.message, 'error');
    }
  };

  const handleRestaurarTaxonomiaPadrao = async () => {
    if (window.confirm('Deseja restaurar a matriz oficial de Prédios e Áreas de Ocorrência para o padrão de fábrica?')) {
      try {
        await restaurarTaxonomiaPadrao();
        showToast('Prédios e áreas restaurados para o padrão de fábrica!');
        await carregarListaTaxonomia(false);
      } catch (err) {
        showToast('Erro ao restaurar: ' + err.message, 'error');
      }
    }
  };

  // =========================================================================
  // MÉTODOS SEGURANÇA
  // =========================================================================
  const handleAlterarSenha = async (e) => {
    if (e) e.preventDefault();
    setErroSenha('');
    setSucessoSenha('');

    if (!senhaAtual) {
      setErroSenha('Informe a senha mestra atual.');
      return;
    }
    if (!novaSenha) {
      setErroSenha('Informe a nova senha mestra.');
      return;
    }
    if (novaSenha.length < 4) {
      setErroSenha('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('A nova senha e a confirmação não conferem.');
      return;
    }

    setSalvandoSenha(true);
    try {
      const res = await alterarSenhaMestra(senhaAtual, novaSenha);
      setSucessoSenha(res.message || 'Senha mestra alterada com sucesso!');
      showToast('Senha mestra alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      await carregarInfoSeguranca();
    } catch (err) {
      setErroSenha(err.message || 'Erro ao alterar a senha mestra.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-white shadow-2xl animate-in slide-in-from-bottom-5 ${toast.tipo === 'error' ? 'bg-red-950/90 border-red-800' : 'bg-slate-900 border-slate-700'
          }`}>
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium">{toast.mensagem}</span>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Settings className="w-3 h-3 text-blue-400" />
                Painel Administrativo Restrito
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Base Local de Dados (JSON / Excel)
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Configurações do Sistema CCO
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Gerenciamento centralizado do efetivo operacional, escalas de turnos, listas de observações padrão e parâmetros de segurança da Central.
            </p>
          </div>

          {/* Botão de Bloquear Módulo Agora (Visível Sempre no Cabeçalho) */}
          {onBloquear && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={onBloquear}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800/60 text-xs font-semibold transition-all cursor-pointer shadow-md"
                title="Encerrar sessão administrativa e bloquear a tela imediatamente"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Bloquear Módulo Agora</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* BARRA DE NAVEGAÇÃO DE ABAS CORPORATIVAS                   */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setAbaAtiva('operadores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'operadores'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Operadores do Sistema (CCO)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${abaAtiva === 'operadores' ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
            }`}>
            {statsOperadores.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('vigilantes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'vigilantes'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Equipe de Vigilância (Postos/Ronda)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${abaAtiva === 'vigilantes' ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-800 text-slate-400'
            }`}>
            {statsVigilantes.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('turnos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'turnos'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>Turnos Operacionais</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${abaAtiva === 'turnos' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}>
            {statsTurnos.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('observacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'observacoes'
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <Tag className="w-4 h-4" />
          <span>Observações Padrão</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${abaAtiva === 'observacoes' ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-slate-400'
            }`}>
            {statsObservacoes.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('responsaveis')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'responsaveis'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Responsáveis & Rede</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${abaAtiva === 'responsaveis' ? 'bg-purple-700 text-purple-100' : 'bg-slate-800 text-slate-400'
            }`}>
            RO
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('seguranca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'seguranca'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Segurança & Senha Mestra</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${abaAtiva === 'seguranca' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
            }`}>
            Ativo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${abaAtiva === 'backup'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Restauração</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${abaAtiva === 'backup' ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
            }`}>
            Admin
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: OPERADORES DO SISTEMA CCO                           */}
      {/* ========================================================= */}
      {abaAtiva === 'operadores' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CARDS DE INDICADORES RÁPIDOS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total de Operadores</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">{statsOperadores.total}</p>
              <p className="text-[11px] text-slate-500 mt-1">Usuários com login no software</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Operadores Ativos</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{statsOperadores.ativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Disponíveis no login CCO</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Inativos / Bloqueados</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{statsOperadores.inativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Sem acesso ao software</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Turnos Vinculados</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-300 mt-2 font-mono">{statsTurnos.ativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Escalas da Central</p>
            </div>
          </div>

          {/* BARRA DE AÇÕES E BUSCA */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaOperadores}
                onChange={(e) => setBuscaOperadores(e.target.value)}
                placeholder="Buscar operador por nome, matrícula ou cargo..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
              <select
                value={filtroStatusOperador}
                onChange={(e) => setFiltroStatusOperador(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="TODOS">Todos Status</option>
                <option value="Ativo">Apenas Ativos</option>
                <option value="Inativo">Apenas Inativos</option>
              </select>

              <button
                type="button"
                onClick={handleExportarExcelOperadores}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                title="Baixar planilha de operadores em formato Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={handleRestaurarOperadoresPadrao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Restaurar lista padrão de operadores CCO"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Padrão</span>
              </button>

              <button
                type="button"
                onClick={abrirModalNovoOperador}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Operador CCO</span>
              </button>
            </div>
          </div>

          {/* TABELA DE OPERADORES CCO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Operadores com Acesso ao Software CCO ({operadoresFiltrados.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Sincronizado em data/operadores.json
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortOperadores.field} currentOrder={sortOperadores.order} onSort={handleSortOperadores} activeColor="text-blue-400" className="py-3 px-4 w-28" />
                    <SortableHeader as="th" field="nome" label="Nome do Operador" currentField={sortOperadores.field} currentOrder={sortOperadores.order} onSort={handleSortOperadores} activeColor="text-blue-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="matricula" label="Matrícula" currentField={sortOperadores.field} currentOrder={sortOperadores.order} onSort={handleSortOperadores} activeColor="text-blue-400" className="py-3 px-4 w-32" />
                    <SortableHeader as="th" field="cargo" label="Cargo / Função CCO" currentField={sortOperadores.field} currentOrder={sortOperadores.order} onSort={handleSortOperadores} activeColor="text-blue-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="turno" label="Turno" currentField={sortOperadores.field} currentOrder={sortOperadores.order} onSort={handleSortOperadores} activeColor="text-blue-400" className="py-3 px-4 w-36" />
                    <SortableHeader as="th" field="observacoes" label="Observações" currentField={sortOperadores.field} currentOrder={sortOperadores.order} onSort={handleSortOperadores} activeColor="text-blue-400" className="py-3 px-4" />
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {operadoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Nenhum operador CCO encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    operadoresFiltrados.map((op) => {
                      const isAtivo = op.status === 'Ativo';
                      return (
                        <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusOperador(op.id, op.nome, op.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{op.status}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {op.nome.replace('Op. ', '').charAt(0)}
                              </div>
                              <span className="font-bold text-slate-100">{op.nome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                            {op.matricula || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[11px] font-semibold">
                              {op.cargo || 'Operador CCO'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px] font-medium">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {op.turno || '12x36 Diurno'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]" title={op.observacoes}>
                            {op.observacoes || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarOperador(op)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar dados do operador"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setOperadorExcluindo(op)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir operador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: EQUIPE DE VIGILÂNCIA DE CAMPO (POSTOS E RONDAS)     */}
      {/* ========================================================= */}
      {abaAtiva === 'vigilantes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CARDS DE INDICADORES RÁPIDOS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Efetivo de Campo</span>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">{statsVigilantes.total}</p>
              <p className="text-[11px] text-slate-500 mt-1">Profissionais de Portaria / Ronda</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Vigilantes Ativos</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{statsVigilantes.ativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Disponíveis nas entregas/baixas</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Inativos / Afastados</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{statsVigilantes.inativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Ocultados dos formulários</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Postos Físicos</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-300 mt-2 font-mono">{statsVigilantes.postosUnicos}</p>
              <p className="text-[11px] text-slate-500 mt-1">P1, P2 e Rondas</p>
            </div>
          </div>

          {/* BARRA DE AÇÕES E BUSCA */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaVigilantes}
                onChange={(e) => setBuscaVigilantes(e.target.value)}
                placeholder="Buscar vigilante por nome, posto ou matrícula..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
              <select
                value={filtroStatusVigilante}
                onChange={(e) => setFiltroStatusVigilante(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="TODOS">Todos Status</option>
                <option value="Ativo">Apenas Ativos</option>
                <option value="Inativo">Apenas Inativos</option>
              </select>

              <select
                value={filtroPostoVigilante}
                onChange={(e) => setFiltroPostoVigilante(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="TODOS">Todos os Postos</option>
                {postosDisponiveisVigilantes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportarExcelVigilantes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                title="Baixar planilha de vigilantes em formato Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={handleRestaurarVigilantesPadrao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Restaurar efetivo padrão de vigilantes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Padrão</span>
              </button>

              <button
                type="button"
                onClick={abrirModalNovoVigilante}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Vigilante</span>
              </button>
            </div>
          </div>

          {/* TABELA DE VIGILANTES DE POSTO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Efetivo de Posto / Campo ({vigilantesFiltrados.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Sincronizado em data/vigilantes.json
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4 w-28" />
                    <SortableHeader as="th" field="nome" label="Nome do Vigilante" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="matricula" label="Matrícula" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4 w-32" />
                    <SortableHeader as="th" field="posto" label="Posto Físico" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="cargo" label="Função" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="turno" label="Turno" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4 w-36" />
                    <SortableHeader as="th" field="observacoes" label="Observações" currentField={sortVigilantes.field} currentOrder={sortVigilantes.order} onSort={handleSortVigilantes} activeColor="text-cyan-400" className="py-3 px-4" />
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {vigilantesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Nenhum vigilante de posto encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    vigilantesFiltrados.map((v) => {
                      const isAtivo = v.status === 'Ativo';
                      return (
                        <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusVigilante(v.id, v.nome, v.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{v.status}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {v.nome.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-100">{v.nome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                            {v.matricula || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[11px] font-semibold">
                              <MapPin className="w-3 h-3 text-blue-400" />
                              {v.posto || 'Portaria'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {v.cargo || 'Vigilante'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px] font-medium">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {v.turno || '12x36 Diurno'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-[180px]" title={v.observacoes}>
                            {v.observacoes || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarVigilante(v)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar dados do vigilante"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setVigilanteExcluindo(v)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir vigilante"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: TURNOS OPERACIONAIS (CRUD COMPLETO)                */}
      {/* ========================================================= */}
      {abaAtiva === 'turnos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CARDS DE INDICADORES RÁPIDOS DE TURNOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total de Turnos</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">{statsTurnos.total}</p>
              <p className="text-[11px] text-slate-500 mt-1">Escalas cadastradas</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Turnos Ativos</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{statsTurnos.ativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Disponíveis no Dashboard e Efetivo</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Turnos Inativos</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{statsTurnos.inativos}</p>
              <p className="text-[11px] text-slate-500 mt-1">Ocultados da seleção</p>
            </div>
          </div>

          {/* BARRA DE AÇÕES E BUSCA DE TURNOS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaTurnos}
                onChange={(e) => setBuscaTurnos(e.target.value)}
                placeholder="Buscar turno por nome ou descrição..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
              <select
                value={filtroStatusTurno}
                onChange={(e) => setFiltroStatusTurno(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="TODOS">Todos Status</option>
                <option value="Ativo">Apenas Ativos</option>
                <option value="Inativo">Apenas Inativos</option>
              </select>

              <button
                type="button"
                onClick={handleRestaurarTurnosPadrao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Restaurar turnos padrão (12x36 Diurno, 12x36 Noturno e Administrativo)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={abrirModalNovoTurno}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Turno</span>
              </button>
            </div>
          </div>

          {/* TABELA DE TURNOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Turnos Operacionais Cadastrados ({turnosFiltrados.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Sincronizado em data/turnos.json
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortTurnos.field} currentOrder={sortTurnos.order} onSort={handleSortTurnos} activeColor="text-indigo-400" className="py-3 px-4 w-28" />
                    <SortableHeader as="th" field="nome" label="Identificador do Turno" currentField={sortTurnos.field} currentOrder={sortTurnos.order} onSort={handleSortTurnos} activeColor="text-indigo-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="descricao" label="Descrição da Escala / Horário" currentField={sortTurnos.field} currentOrder={sortTurnos.order} onSort={handleSortTurnos} activeColor="text-indigo-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="dataCadastro" label="Data Cadastro" currentField={sortTurnos.field} currentOrder={sortTurnos.order} onSort={handleSortTurnos} activeColor="text-indigo-400" className="py-3 px-4 w-32" />
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {turnosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Nenhum turno encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    turnosFiltrados.map((t) => {
                      const isAtivo = t.status === 'Ativo';
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusTurno(t.id, t.nome, t.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{t.status}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono text-xs">{t.nome}</span>
                              {['12x36 Diurno', '12x36 Noturno', 'Administrativo'].includes(t.nome) && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                                  Padrão
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {t.descricao || 'Sem descrição cadastrada'}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {t.dataCadastro || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarTurno(t)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar turno"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTurnoExcluindo(t)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir turno"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: OBSERVAÇÕES PADRÃO (CRUD COMPLETO)                 */}
      {/* ========================================================= */}
      {abaAtiva === 'observacoes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CARDS DE INDICADORES RÁPIDOS DE OBSERVAÇÕES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total de Observações</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">{statsObservacoes.total}</p>
              <p className="text-[11px] text-slate-500 mt-1">Opções configuradas</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Observações Ativas</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{statsObservacoes.ativas}</p>
              <p className="text-[11px] text-slate-500 mt-1">Disponíveis em Provisórios e Visitantes</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Inativas</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{statsObservacoes.inativas}</p>
              <p className="text-[11px] text-slate-500 mt-1">Ocultadas dos seletores</p>
            </div>
          </div>

          {/* BARRA DE AÇÕES E BUSCA DE OBSERVAÇÕES */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaObs}
                onChange={(e) => setBuscaObs(e.target.value)}
                placeholder="Buscar observação por texto ou aplicação..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
              <select
                value={filtroStatusObs}
                onChange={(e) => setFiltroStatusObs(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="TODOS">Todos Status</option>
                <option value="Ativo">Apenas Ativos</option>
                <option value="Inativo">Apenas Inativos</option>
              </select>

              <button
                type="button"
                onClick={handleRestaurarObsPadrao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Restaurar observações padrão de fábrica (ESQUECEU, PERDEU, etc.)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={abrirModalNovaObs}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Observação</span>
              </button>
            </div>
          </div>

          {/* TABELA DE OBSERVAÇÕES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Observações / Motivos Cadastrados ({observacoesFiltradas.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Sincronizado em data/observacoes.json
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortObs.field} currentOrder={sortObs.order} onSort={handleSortObs} activeColor="text-amber-400" className="py-3 px-4 w-28" />
                    <SortableHeader as="th" field="nome" label="Texto / Rótulo da Observação" currentField={sortObs.field} currentOrder={sortObs.order} onSort={handleSortObs} activeColor="text-amber-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="descricao" label="Descrição / Aplicação Operacional" currentField={sortObs.field} currentOrder={sortObs.order} onSort={handleSortObs} activeColor="text-amber-400" className="py-3 px-4" />
                    <SortableHeader as="th" field="dataCadastro" label="Data Cadastro" currentField={sortObs.field} currentOrder={sortObs.order} onSort={handleSortObs} activeColor="text-amber-400" className="py-3 px-4 w-32" />
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {observacoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Nenhuma observação encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    observacoesFiltradas.map((obs) => {
                      const isAtivo = obs.status === 'Ativo';
                      return (
                        <tr key={obs.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusObs(obs.id, obs.nome, obs.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{obs.status}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-amber-300 font-mono tracking-wider text-xs">
                              {obs.nome}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {obs.descricao || 'Sem descrição'}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {obs.dataCadastro || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarObs(obs)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar observação"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setObsExcluindo(obs)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir observação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEÇÃO 2: CARGOS CADASTRADOS (OPERADORES & VIGILANTES)     */}
          {/* ========================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Cargos e Funções Cadastradas</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {cargosFiltrados.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Alimenta automaticamente a lista de sugestões nos cadastros de Operadores da Central e Vigilantes de Posto.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaCargo}
                    onChange={(e) => setBuscaCargo(e.target.value)}
                    placeholder="Buscar cargo..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filtroTipoCargo}
                  onChange={(e) => setFiltroTipoCargo(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="TODOS">Todos Destinos</option>
                  <option value="OPERADOR">Operadores CCO</option>
                  <option value="VIGILANTE">Vigilantes de Posto</option>
                </select>

                <select
                  value={filtroStatusCargo}
                  onChange={(e) => setFiltroStatusCargo(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="TODOS">Todos Status</option>
                  <option value="Ativo">Apenas Ativos</option>
                  <option value="Inativo">Apenas Inativos</option>
                </select>

                <button
                  type="button"
                  onClick={handleRestaurarCargosPadrao}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Restaurar lista padrão de cargos"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  onClick={abrirModalNovoCargo}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Cargo</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortCargos.field} currentOrder={sortCargos.order} onSort={handleSortCargos} activeColor="text-blue-400" className="py-2.5 px-4 w-28" />
                    <SortableHeader as="th" field="nome" label="Nome do Cargo / Função" currentField={sortCargos.field} currentOrder={sortCargos.order} onSort={handleSortCargos} activeColor="text-blue-400" className="py-2.5 px-4" />
                    <SortableHeader as="th" field="tipo" label="Categoria / Destino" currentField={sortCargos.field} currentOrder={sortCargos.order} onSort={handleSortCargos} activeColor="text-blue-400" className="py-2.5 px-4 w-44" />
                    <SortableHeader as="th" field="dataCadastro" label="Data Cadastro" currentField={sortCargos.field} currentOrder={sortCargos.order} onSort={handleSortCargos} activeColor="text-blue-400" className="py-2.5 px-4 w-32" />
                    <th className="py-2.5 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {cargosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Nenhum cargo encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    cargosFiltrados.map((c) => {
                      const isAtivo = c.status === 'Ativo';
                      const isOperador = c.tipo === 'OPERADOR';
                      return (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusCargo(c.id, c.nome, c.status)}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{c.status}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-100">
                            {c.nome}
                          </td>
                          <td className="py-2.5 px-4">
                            {isOperador ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                <Briefcase className="w-3 h-3 text-blue-400" />
                                Operador CCO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <Shield className="w-3 h-3 text-emerald-400" />
                                Vigilante de Posto / Ronda
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {c.dataCadastro || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarCargo(c)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar cargo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCargoExcluindo(c)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir cargo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEÇÃO 3: SUGESTÕES RÁPIDAS DE OBSERVAÇÕES & PERFIS        */}
          {/* ========================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Sugestões Rápidas de Observações & Perfis</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {sugestoesFiltradas.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Frases pré-definidas exibidas como botões rápidos nos formulários de Operadores e Vigilantes para reduzir o tempo de digitação.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaSugestao}
                    onChange={(e) => setBuscaSugestao(e.target.value)}
                    placeholder="Buscar texto..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={filtroTipoSugestao}
                  onChange={(e) => setFiltroTipoSugestao(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="TODOS">Todos Destinos</option>
                  <option value="OPERADOR">Operadores CCO</option>
                  <option value="VIGILANTE">Vigilantes de Posto</option>
                </select>

                <select
                  value={filtroStatusSugestao}
                  onChange={(e) => setFiltroStatusSugestao(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="TODOS">Todos Status</option>
                  <option value="Ativo">Apenas Ativos</option>
                  <option value="Inativo">Apenas Inativos</option>
                </select>

                <button
                  type="button"
                  onClick={handleRestaurarSugestoesPadrao}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Restaurar lista padrão de sugestões"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  onClick={abrirModalNovaSugestao}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Sugestão</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortSugestoes.field} currentOrder={sortSugestoes.order} onSort={handleSortSugestoes} activeColor="text-purple-400" className="py-2.5 px-4 w-28" />
                    <SortableHeader as="th" field="texto" label="Texto da Sugestão / Observação" currentField={sortSugestoes.field} currentOrder={sortSugestoes.order} onSort={handleSortSugestoes} activeColor="text-purple-400" className="py-2.5 px-4" />
                    <SortableHeader as="th" field="tipo" label="Destinado Para" currentField={sortSugestoes.field} currentOrder={sortSugestoes.order} onSort={handleSortSugestoes} activeColor="text-purple-400" className="py-2.5 px-4 w-44" />
                    <SortableHeader as="th" field="dataCadastro" label="Data Cadastro" currentField={sortSugestoes.field} currentOrder={sortSugestoes.order} onSort={handleSortSugestoes} activeColor="text-purple-400" className="py-2.5 px-4 w-32" />
                    <th className="py-2.5 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {sugestoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Nenhuma sugestão encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    sugestoesFiltradas.map((sug) => {
                      const isAtivo = sug.status === 'Ativo';
                      const isOperador = sug.tipo === 'OPERADOR';
                      return (
                        <tr key={sug.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusSugestao(sug.id, sug.status)}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{sug.status}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-slate-200 font-medium">
                            {sug.texto}
                          </td>
                          <td className="py-2.5 px-4">
                            {isOperador ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                Operadores CCO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <Shield className="w-3 h-3 text-emerald-400" />
                                Vigilantes de Posto
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {sug.dataCadastro || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarSugestao(sug)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar sugestão"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSugestaoExcluindo(sug)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir sugestão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEÇÃO 4: TAXONOMIA DE PRÉDIOS E ÁREAS (OCORRÊNCIAS / RO)  */}
          {/* ========================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Prédios e Áreas / Setores das Ocorrências</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {taxonomiaFiltrada.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gerencie a lista oficial de Prédios e suas Áreas/Setores específicos para preenchimento de Ocorrências (RO) e Dashboards em tempo real.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaTaxonomia}
                    onChange={(e) => setBuscaTaxonomia(e.target.value)}
                    placeholder="Buscar Prédio ou Área..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={filtroPredioTaxonomia}
                  onChange={(e) => setFiltroPredioTaxonomia(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
                >
                  <option value="TODOS">Todos os Prédios</option>
                  {prediosDisponiveisTaxonomia.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  value={filtroStatusTaxonomia}
                  onChange={(e) => setFiltroStatusTaxonomia(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="TODOS">Todos Status</option>
                  <option value="Ativo">Apenas Ativos</option>
                  <option value="Inativo">Apenas Inativos</option>
                </select>

                <button
                  type="button"
                  onClick={handleRestaurarTaxonomiaPadrao}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Restaurar lista canônica padrão de Prédios e Áreas"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  onClick={abrirModalNovoTaxonomia}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Prédio / Área</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <SortableHeader as="th" field="status" label="Status" currentField={sortTaxonomia.field} currentOrder={sortTaxonomia.order} onSort={handleSortTaxonomia} activeColor="text-indigo-400" className="py-2.5 px-4 w-28" />
                    <SortableHeader as="th" field="predio" label="Prédio / Instalação" currentField={sortTaxonomia.field} currentOrder={sortTaxonomia.order} onSort={handleSortTaxonomia} activeColor="text-indigo-400" className="py-2.5 px-4 w-64" />
                    <SortableHeader as="th" field="area" label="Área / Setor Específico" currentField={sortTaxonomia.field} currentOrder={sortTaxonomia.order} onSort={handleSortTaxonomia} activeColor="text-indigo-400" className="py-2.5 px-4" />
                    <SortableHeader as="th" field="dataCadastro" label="Data Cadastro" currentField={sortTaxonomia.field} currentOrder={sortTaxonomia.order} onSort={handleSortTaxonomia} activeColor="text-indigo-400" className="py-2.5 px-4 w-32" />
                    <th className="py-2.5 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {taxonomiaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Nenhum prédio ou área encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    taxonomiaFiltrada.map((item) => {
                      const isAtivo = item.status === 'Ativo';
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusTaxonomia(item.id, item.status)}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                }`}
                              title={`Clique para ${isAtivo ? 'desativar' : 'ativar'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{item.status}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="truncate">{item.predio}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-200 font-semibold">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.area}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {item.dataCadastro || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => abrirModalEditarTaxonomia(item)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
                                title="Editar prédio/área"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemTaxonomiaExcluindo(item)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                                title="Excluir prédio/área"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 4: SEGURANÇA DO SISTEMA (SENHA MESTRA) & BACKUP       */}
      {/* ========================================================= */}
      {abaAtiva === 'seguranca' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Segurança do Sistema & Controle de Acesso
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Proteção Ativa
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Defina a Senha Mestra para restringir a entrada a este módulo e proteger o gerenciamento do efetivo, turnos e opções do sistema.
                  </p>
                </div>
              </div>

              {onBloquear && (
                <button
                  type="button"
                  onClick={onBloquear}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800/50 text-xs font-semibold transition-all cursor-pointer shadow-sm self-start md:self-auto"
                  title="Encerrar sessão de administrador e bloquear o módulo de configurações imediatamente"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Bloquear Módulo Agora</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
              {/* Formulário de Alteração de Senha Mestra */}
              <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Alterar Senha Mestra
                  </h3>
                </div>

                {erroSenha && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-800/80 text-xs text-red-200 flex items-start gap-2 animate-in fade-in">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{erroSenha}</span>
                  </div>
                )}

                {sucessoSenha && (
                  <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-xs text-emerald-200 flex items-start gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{sucessoSenha}</span>
                  </div>
                )}

                <form onSubmit={handleAlterarSenha} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                      Senha Mestra Atual <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaAtual ? 'text' : 'password'}
                        value={senhaAtual}
                        onChange={(e) => {
                          setSenhaAtual(e.target.value);
                          if (erroSenha) setErroSenha('');
                        }}
                        placeholder="Digite a senha mestra atual..."
                        disabled={salvandoSenha}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 pr-9 text-slate-100 placeholder:text-slate-500 font-mono tracking-wider focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                      >
                        {mostrarSenhaAtual ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                        Nova Senha <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={mostrarNovaSenha ? 'text' : 'password'}
                          value={novaSenha}
                          onChange={(e) => {
                            setNovaSenha(e.target.value);
                            if (erroSenha) setErroSenha('');
                          }}
                          placeholder="Mínimo 4 caracteres..."
                          disabled={salvandoSenha}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 pr-9 text-slate-100 placeholder:text-slate-500 font-mono tracking-wider focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        >
                          {mostrarNovaSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                        Confirmar Nova Senha <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={mostrarConfirmarSenha ? 'text' : 'password'}
                          value={confirmarSenha}
                          onChange={(e) => {
                            setConfirmarSenha(e.target.value);
                            if (erroSenha) setErroSenha('');
                          }}
                          placeholder="Repita a nova senha..."
                          disabled={salvandoSenha}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 pr-9 text-slate-100 placeholder:text-slate-500 font-mono tracking-wider focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        >
                          {mostrarConfirmarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={salvandoSenha || !senhaAtual || !novaSenha || !confirmarSenha}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {salvandoSenha ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Salvando Senha...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Nova Senha Mestra</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Cartão Informativo de Auditoria */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Persistência & Diretrizes
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Armazenamento:</span>
                        <span className="font-mono text-emerald-400 font-semibold">data/seguranca.json (Blindado)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Criptografia Ativa:</span>
                        <span className="font-mono text-emerald-300 font-semibold">PBKDF2-SHA512 + safeStorage</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Entropia / Salt:</span>
                        <span className="font-mono text-slate-300">100.000 iterações / Salt 32B</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Última Modificação:</span>
                        <span className="text-slate-200">
                          {dataAtualizacaoSenha ? new Date(dataAtualizacaoSenha).toLocaleString('pt-BR') : 'Padrão blindado'}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-[11px] text-slate-400">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>As credenciais são gravadas exclusivamente como hash criptográfico irreversível com salt aleatório.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Nenhuma senha trafega pela rede ou é exposta no navegador em texto plano.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Ao clicar em "Bloquear Módulo Agora" ou fechar a janela, o acesso restrito é bloqueado imediatamente.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-300 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Proteção corporativa ativa padrão CCO Security Suite.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Acesso Rápido a Backup & Restauração ao final da aba Segurança */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Backup e Restauração de Dados</h4>
                <p className="text-[11px] text-slate-400">Proteja a base consolidada ou restaure cadastros com o algoritmo de Merge Inteligente.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbaAtiva('backup')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
            >
              <span>Acessar Painel de Backup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 5: RESPONSÁVEIS DO SITE & DIRETÓRIO DE REDE (PDF RO)  */}
      {/* ========================================================= */}
      {abaAtiva === 'responsaveis' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* BANNER INSTITUCIONAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 uppercase tracking-wider">
                      Parâmetros Institucionais
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Relatórios de Ocorrência (RO) & Arquivamento
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Responsáveis do Site & Diretório de Rede
                  </h2>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                    Configure os titulares responsáveis pelas assinaturas de conformidade no cabeçalho e rodapé dos relatórios em PDF gerados pela <strong>Ferramenta 1 (Relatório de Ocorrências)</strong>, bem como o caminho de rede padrão onde os arquivos são armazenados automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleRestaurarResponsaveisPadrao}
                  disabled={salvandoResponsaveis}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Restaurar nomes e diretório para os valores padrão de fábrica"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>
                <button
                  type="button"
                  onClick={handleSalvarResponsaveis}
                  disabled={salvandoResponsaveis}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {salvandoResponsaveis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Parâmetros</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO / GRID DE CAMPOS */}
          <form onSubmit={handleSalvarResponsaveis} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Gerente de Site */}
            <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Gerente de Operações / Site</h3>
                    <p className="text-[11px] text-slate-400">Aprovação Executiva Máxima</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  Rodapé PDF (Col 1)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome Completo do(a) Gerente
                </label>
                <input
                  type="text"
                  value={formResponsaveis.gerenteSite}
                  onChange={(e) => {
                    setFormResponsaveis({ ...formResponsaveis, gerenteSite: e.target.value });
                    setHouveAlteracaoResponsaveis(true);
                  }}
                  placeholder="Ex: Nome do(a) Gerente Responsável"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none transition-colors"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Este nome é inserido automaticamente no bloco de assinaturas executivas na primeira coluna de todos os relatórios emitidos.
              </p>
            </div>

            {/* Card 2: Coordenação de Segurança */}
            <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Coordenação de Segurança</h3>
                    <p className="text-[11px] text-slate-400">Coord. Local da Prestadora de Serviços</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  Rodapé PDF (Col 2)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome e Cargo / Empresa
                </label>
                <input
                  type="text"
                  value={formResponsaveis.coordenacao}
                  onChange={(e) => {
                    setFormResponsaveis({ ...formResponsaveis, coordenacao: e.target.value });
                    setHouveAlteracaoResponsaveis(true);
                  }}
                  placeholder="Ex: Nome do(a) Coordenador(a) de Segurança"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none transition-colors"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Identificação do coordenador operacional da contratada encarregado pelo controle do efetivo e providências do plantão.
              </p>
            </div>

            {/* Card 3: Fiscal de Contrato */}
            <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Fiscal de Contrato</h3>
                    <p className="text-[11px] text-slate-400">Fiscalização e Auditoria Operacional</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  Rodapé PDF (Col 3)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome do(a) Fiscal
                </label>
                <input
                  type="text"
                  value={formResponsaveis.fiscalContrato}
                  onChange={(e) => {
                    setFormResponsaveis({ ...formResponsaveis, fiscalContrato: e.target.value });
                    setHouveAlteracaoResponsaveis(true);
                  }}
                  placeholder="Ex: Nome do(a) Fiscal de Contrato"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none transition-colors"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Responsável técnico pela conferência das obrigações contratuais e arquivamento formal dos relatórios emitidos.
              </p>
            </div>

            {/* Card 4: Caminho de Salvamento / Rede Padrão */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Local de Salvamento / Diretório de Rede</h3>
                    <p className="text-[11px] text-slate-400">Diretório do Windows ou Compartilhamento UNC</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Salvamento Automático
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Caminho do Diretório (Local ou Rede)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formResponsaveis.caminhoRede}
                    onChange={(e) => {
                      setFormResponsaveis({ ...formResponsaveis, caminhoRede: e.target.value });
                      setHouveAlteracaoResponsaveis(true);
                    }}
                    placeholder="Ex: C:\RelatoriosCCO ou \\servidor\compartilhamento ou MAPA DE CALOR/2026/09.SETEMBRO"
                    className="flex-1 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none transition-colors"
                    required
                  />

                  <button
                    type="button"
                    onClick={handleSelecionarPastaNativa}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-all cursor-pointer shrink-0"
                    title="Abrir janela do Windows para selecionar a pasta no disco"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Procurar Pasta</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAbrirPastaExportacoes}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer shrink-0"
                    title="Abrir diretório de exportações no Windows Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1 text-[11px]">
                <p className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Garantia Desktop:</strong> Cópias sempre seguras na pasta <em>Documentos\CCO Security Suite\exports</em>.</span>
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Caminhos relativos são resolvidos automaticamente dentro de Documentos, evitando falhas de permissão em pastas protegidas do sistema.
                </p>
              </div>
            </div>

            {/* BOTÃO SALVAR INFERIOR */}
            <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Dados persistidos em <code className="text-emerald-400 font-mono">data/responsaveis.json</code>
              </span>

              <button
                type="submit"
                disabled={salvandoResponsaveis}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {salvandoResponsaveis ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gravando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações Institucionais</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Card de Acesso Rápido a Backup & Restauração ao final da página de parâmetros */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Backup e Restauração de Dados</h4>
                <p className="text-[11px] text-slate-400">Proteja a base consolidada ou restaure cadastros com o algoritmo de Merge Inteligente.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbaAtiva('backup')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
            >
              <span>Acessar Painel de Backup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 7: BACKUP & RESTAURAÇÃO DE DADOS (DEDICADA)           */}
      {/* ========================================================= */}
      {abaAtiva === 'backup' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <PainelBackupRestauracao onToast={showToast} />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADICIONAR / EDITAR OPERADOR DO SISTEMA CCO       */}
      {/* ========================================================= */}
      {modalOperadorAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  {operadorEditando ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {operadorEditando ? 'Editar Operador do Sistema CCO' : 'Cadastrar Novo Operador CCO'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acesso restrito a profissionais autorizados a operar e logar no software da Central de Controle Operacional.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !salvandoOperador && setModalOperadorAberto(false)}
                disabled={salvandoOperador}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroFormOperador && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroFormOperador}</span>
              </div>
            )}

            <form onSubmit={handleSalvarOperador} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nome Completo do Operador CCO <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formOperador.nome}
                  onChange={(e) => setFormOperador({ ...formOperador, nome: e.target.value })}
                  placeholder="Ex: Op. Operador 01, Líder CCO, Supervisor CCO..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Informe o nome do profissional autorizado a operar a Central de Controle Operacional.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Matrícula / ID
                  </label>
                  <input
                    type="text"
                    value={formOperador.matricula}
                    onChange={(e) => setFormOperador({ ...formOperador, matricula: e.target.value })}
                    placeholder="Ex: CCO-001 ou MAT-2024"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Função / Perfil CCO <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formOperador.cargo}
                    onChange={(e) => setFormOperador({ ...formOperador, cargo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Selecione o Cargo / Perfil CCO --</option>
                    {cargosOperadoresAtivos.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {formOperador.cargo && !cargosOperadoresAtivos.includes(formOperador.cargo) && (
                      <option value={formOperador.cargo}>{formOperador.cargo}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Status Operacional
                  </label>
                  <select
                    value={formOperador.status}
                    onChange={(e) => setFormOperador({ ...formOperador, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Ativo">Ativo (Habilitado para Login e Emissão de RO)</option>
                    <option value="Inativo">Inativo (Acesso Desabilitado)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Turno Operacional
                  </label>
                  <select
                    value={formOperador.turno}
                    onChange={(e) => setFormOperador({ ...formOperador, turno: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {turnosDisponiveisOperador.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Observações / Perfil de Acesso
                </label>
                <select
                  value={formOperador.observacoes}
                  onChange={(e) => setFormOperador({ ...formOperador, observacoes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Selecione uma observação / sugestão --</option>
                  {sugestoesOperadoresAtivas.map((sug, i) => (
                    <option key={i} value={sug}>{sug}</option>
                  ))}
                  {formOperador.observacoes && !sugestoesOperadoresAtivas.includes(formOperador.observacoes) && (
                    <option value={formOperador.observacoes}>{formOperador.observacoes}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={salvandoOperador}
                  onClick={() => setModalOperadorAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoOperador}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {salvandoOperador ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{operadorEditando ? 'Salvar Alterações' : 'Cadastrar Operador CCO'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRMAÇÃO DE EXCLUSÃO DE OPERADOR CCO          */}
      {/* ========================================================= */}
      {operadorExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Operador CCO</h3>
                <p className="text-xs text-slate-400">Esta ação removerá o operador do sistema CCO.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o cadastro de <strong className="text-white">{operadorExcluindo.nome}</strong> (Matrícula: {operadorExcluindo.matricula || 'N/A'}, Função: {operadorExcluindo.cargo || 'Operador CCO'})? Ele deixará de constar no controle de login e emissão de RO da central.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                disabled={excluindoOperador}
                onClick={() => setOperadorExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindoOperador}
                onClick={handleConfirmarExclusaoOperador}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {excluindoOperador ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1.1: ADICIONAR / EDITAR VIGILANTE DE POSTO / CAMPO  */}
      {/* ========================================================= */}
      {modalVigilanteAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  {vigilanteEditando ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {vigilanteEditando ? 'Editar Vigilante de Posto / Ronda' : 'Cadastrar Vigilante de Posto / Ronda'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastro dedicado aos profissionais de campo (Portarias 1 e 2, Ronda). Alimenta exclusivamente os formulários operacionais.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !salvandoVigilante && setModalVigilanteAberto(false)}
                disabled={salvandoVigilante}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroFormVigilante && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroFormVigilante}</span>
              </div>
            )}

            <form onSubmit={handleSalvarVigilante} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nome Completo do Vigilante <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formVigilante.nome}
                  onChange={(e) => setFormVigilante({ ...formVigilante, nome: e.target.value })}
                  placeholder="Ex: Vigilante Portaria 1, Carlos Silva, Vigilante Ronda..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Identificação do profissional que atua fisicamente no posto de serviço.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Matrícula / ID Operacional
                  </label>
                  <input
                    type="text"
                    value={formVigilante.matricula}
                    onChange={(e) => setFormVigilante({ ...formVigilante, matricula: e.target.value })}
                    placeholder="Ex: VIG-2001"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Posto de Atuação Física
                  </label>
                  <select
                    value={formVigilante.posto}
                    onChange={(e) => setFormVigilante({ ...formVigilante, posto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Portaria 1">Portaria 1</option>
                    <option value="Portaria 2">Portaria 2</option>
                    <option value="Caldeira">Caldeira</option>
                    <option value="Cobertura">Cobertura</option>
                    {formVigilante.posto && !['Portaria 1', 'Portaria 2', 'Caldeira', 'Cobertura'].includes(formVigilante.posto) && (
                      <option value={formVigilante.posto}>{formVigilante.posto}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Função / Cargo <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={formVigilante.cargo}
                    onChange={(e) => setFormVigilante({ ...formVigilante, cargo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Selecione o Cargo / Posto --</option>
                    {cargosVigilantesAtivos.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {formVigilante.cargo && !cargosVigilantesAtivos.includes(formVigilante.cargo) && (
                      <option value={formVigilante.cargo}>{formVigilante.cargo}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Turno Operacional
                  </label>
                  <select
                    value={formVigilante.turno}
                    onChange={(e) => setFormVigilante({ ...formVigilante, turno: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {turnosDisponiveisOperador.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Status Operacional
                </label>
                <select
                  value={formVigilante.status}
                  onChange={(e) => setFormVigilante({ ...formVigilante, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Ativo">Ativo (Disponível nos Dropdowns de Entrega e Devolução)</option>
                  <option value="Inativo">Inativo (Ocultado dos Formulários Operacionais)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Observações / Rádio HT / Detalhes do Posto
                </label>
                <select
                  value={formVigilante.observacoes}
                  onChange={(e) => setFormVigilante({ ...formVigilante, observacoes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Selecione uma observação / posto --</option>
                  {sugestoesVigilantesAtivas.map((sug, i) => (
                    <option key={i} value={sug}>{sug}</option>
                  ))}
                  {formVigilante.observacoes && !sugestoesVigilantesAtivas.includes(formVigilante.observacoes) && (
                    <option value={formVigilante.observacoes}>{formVigilante.observacoes}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={salvandoVigilante}
                  onClick={() => setModalVigilanteAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoVigilante}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {salvandoVigilante ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{vigilanteEditando ? 'Salvar Alterações' : 'Cadastrar Vigilante de Posto'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2.1: CONFIRMAÇÃO DE EXCLUSÃO DE VIGILANTE DE POSTO  */}
      {/* ========================================================= */}
      {vigilanteExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Vigilante de Posto</h3>
                <p className="text-xs text-slate-400">Esta ação removerá o profissional da escala de campo.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o cadastro de <strong className="text-white">{vigilanteExcluindo.nome}</strong> (Matrícula: {vigilanteExcluindo.matricula || 'N/A'}, Posto: {vigilanteExcluindo.posto || 'Posto de Campo'})? Ele deixará de constar nos seletores de entrega e devolução de crachás.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                disabled={excluindoVigilante}
                onClick={() => setVigilanteExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindoVigilante}
                onClick={handleConfirmarExclusaoVigilante}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {excluindoVigilante ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADICIONAR / EDITAR TURNO                         */}
      {/* ========================================================= */}
      {modalTurnoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  {turnoEditando ? <Edit3 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {turnoEditando ? 'Editar Turno Operacional' : 'Cadastrar Novo Turno'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    O turno ficará disponível para seleção no Dashboard e no efetivo de operadores.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTurnoAberto(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroFormTurno && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroFormTurno}</span>
              </div>
            )}

            <form onSubmit={handleSalvarTurno} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nome do Turno <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formTurno.nome}
                  onChange={(e) => setFormTurno({ ...formTurno, nome: e.target.value })}
                  placeholder="Ex: 12x36 Diurno, 12x36 Noturno, Administrativo..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Status Operacional
                </label>
                <select
                  value={formTurno.status}
                  onChange={(e) => setFormTurno({ ...formTurno, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Ativo">Ativo (Visível no Dashboard e Efetivo)</option>
                  <option value="Inativo">Inativo (Ocultado dos Seletores)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Descrição da Escala / Horário
                </label>
                <textarea
                  rows={2}
                  value={formTurno.descricao}
                  onChange={(e) => setFormTurno({ ...formTurno, descricao: e.target.value })}
                  placeholder="Ex: Escala de 12 horas diurnas (06:00 às 18:00 / 07:00 às 19:00)..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTurnoAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{turnoEditando ? 'Salvar Alterações' : 'Cadastrar Turno'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO DE TURNO                 */}
      {/* ========================================================= */}
      {turnoExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Turno</h3>
                <p className="text-xs text-slate-400">Esta ação removerá o turno da base de dados.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o turno <strong className="text-white">{turnoExcluindo.nome}</strong>? Ele deixará de ser listado nos seletores do sistema.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTurnoExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoTurno}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: ADICIONAR / EDITAR OBSERVAÇÃO                    */}
      {/* ========================================================= */}
      {modalObsAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
                  {obsEditando ? <Edit3 className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {obsEditando ? 'Editar Observação Padrão' : 'Cadastrar Nova Observação'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    A observação ficará disponível nos menus suspensos de Credenciais Provisórias e Visitantes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalObsAberto(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroFormObs && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroFormObs}</span>
              </div>
            )}

            <form onSubmit={handleSalvarObs} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Identificador / Rótulo da Observação <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formObs.nome}
                  onChange={(e) => setFormObs({ ...formObs, nome: e.target.value.toUpperCase() })}
                  placeholder="Ex: ESQUECEU, PERDEU, COM DEFEITO..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold uppercase focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Recomenda-se preencher em letras maiúsculas para manter a padronização dos relatórios.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Status da Opção
                </label>
                <select
                  value={formObs.status}
                  onChange={(e) => setFormObs({ ...formObs, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Ativo">Ativo (Visível nos Seletores)</option>
                  <option value="Inativo">Inativo (Ocultado dos Seletores)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Descrição / Aplicação Operacional
                </label>
                <textarea
                  rows={2}
                  value={formObs.descricao}
                  onChange={(e) => setFormObs({ ...formObs, descricao: e.target.value })}
                  placeholder="Ex: Utilizado quando o colaborador esquece o documento na residência..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalObsAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{obsEditando ? 'Salvar Alterações' : 'Cadastrar Observação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CONFIRMAÇÃO DE EXCLUSÃO DE OBSERVAÇÃO            */}
      {/* ========================================================= */}
      {obsExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Observação</h3>
                <p className="text-xs text-slate-400">Esta ação removerá a opção do sistema.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir a observação <strong className="text-white font-mono">{obsExcluindo.nome}</strong>? Ela deixará de aparecer nos menus suspensos das portarias.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setObsExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoObs}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: ADICIONAR / EDITAR CARGO OU FUNÇÃO               */}
      {/* ========================================================= */}
      {modalCargoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {cargoEditando ? 'Editar Cargo ou Função' : 'Cadastrar Novo Cargo'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    O cargo configurado estará disponível na lista rápida dos cadastros.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCargoAberto(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroFormCargo && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroFormCargo}</span>
              </div>
            )}

            <form onSubmit={handleSalvarCargo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nome do Cargo / Função <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formCargo.nome}
                  onChange={(e) => setFormCargo({ ...formCargo, nome: e.target.value })}
                  placeholder="Ex: Operador CCO, Vigilante Portaria 1, Fiscal de Pátio..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Destinado a
                  </label>
                  <select
                    value={formCargo.tipo}
                    onChange={(e) => setFormCargo({ ...formCargo, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="OPERADOR">Operadores CCO (Central)</option>
                    <option value="VIGILANTE">Vigilantes de Posto (Campo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formCargo.status}
                    onChange={(e) => setFormCargo({ ...formCargo, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Ativo">Ativo (Visível nas Sugestões)</option>
                    <option value="Inativo">Inativo (Oculto)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCargoAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{cargoEditando ? 'Salvar Alterações' : 'Cadastrar Cargo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: CONFIRMAÇÃO DE EXCLUSÃO DE CARGO                 */}
      {/* ========================================================= */}
      {cargoExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Cargo</h3>
                <p className="text-xs text-slate-400">Esta ação removerá o cargo da base de opções.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o cargo <strong className="text-white">{cargoExcluindo.nome}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCargoExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoCargo}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: ADICIONAR / EDITAR SUGESTÃO DE OBSERVAÇÃO        */}
      {/* ========================================================= */}
      {modalSugestaoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {sugestaoEditando ? 'Editar Sugestão de Observação' : 'Cadastrar Nova Sugestão'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    O texto aparecerá como um botão de clique rápido no formulário do profissional.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalSugestaoAberto(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroFormSugestao && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroFormSugestao}</span>
              </div>
            )}

            <form onSubmit={handleSalvarSugestao} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Texto da Sugestão / Observação <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formSugestao.texto}
                  onChange={(e) => setFormSugestao({ ...formSugestao, texto: e.target.value })}
                  placeholder="Ex: Responsável pelo plantão A; Portaria Principal; HT canal 01..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Destinado a
                  </label>
                  <select
                    value={formSugestao.tipo}
                    onChange={(e) => setFormSugestao({ ...formSugestao, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="OPERADOR">Operadores CCO (Central)</option>
                    <option value="VIGILANTE">Vigilantes de Posto (Campo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formSugestao.status}
                    onChange={(e) => setFormSugestao({ ...formSugestao, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Ativo">Ativo (Visível nos Botões)</option>
                    <option value="Inativo">Inativo (Oculto)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalSugestaoAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{sugestaoEditando ? 'Salvar Alterações' : 'Cadastrar Sugestão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 10: CONFIRMAÇÃO DE EXCLUSÃO DE SUGESTÃO             */}
      {/* ========================================================= */}
      {sugestaoExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Sugestão</h3>
                <p className="text-xs text-slate-400">Esta ação removerá a sugestão rápida.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir a sugestão <strong className="text-white">"{sugestaoExcluindo.texto}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSugestaoExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoSugestao}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 11: ADICIONAR / EDITAR PRÉDIO E ÁREA                */}
      {/* ========================================================= */}
      {modalTaxonomiaAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {itemTaxonomiaEditando ? 'Editar Área / Prédio' : 'Cadastrar Nova Área / Prédio'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    A área ficará disponível no menu suspenso de Ocorrências (RO) do prédio correspondente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTaxonomiaAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarTaxonomia} className="space-y-4 text-xs">
              {erroFormTaxonomia && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{erroFormTaxonomia}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider">
                    Prédio Estrutural <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setModoNovoPredio(!modoNovoPredio)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    {modoNovoPredio ? 'Selecionar prédio existente' : '+ Digitar novo prédio'}
                  </button>
                </div>

                {modoNovoPredio ? (
                  <input
                    type="text"
                    value={formTaxonomia.predio}
                    onChange={(e) => setFormTaxonomia({ ...formTaxonomia, predio: e.target.value.toUpperCase() })}
                    placeholder="Ex: RESTAURANTE (SODEXO), PORTARIA 1, GDM 1..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none uppercase"
                    required
                    autoFocus
                  />
                ) : (
                  <select
                    value={formTaxonomia.predio}
                    onChange={(e) => setFormTaxonomia({ ...formTaxonomia, predio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Selecione o Prédio --</option>
                    {prediosDisponiveisTaxonomia.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    {formTaxonomia.predio && !prediosDisponiveisTaxonomia.includes(formTaxonomia.predio) && (
                      <option value={formTaxonomia.predio}>{formTaxonomia.predio}</option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nome da Área / Setor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formTaxonomia.area}
                  onChange={(e) => setFormTaxonomia({ ...formTaxonomia, area: e.target.value.toUpperCase() })}
                  placeholder="Ex: CATRACA RESTAURANTE, MESAS REFEITORIO, GUARITA..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={formTaxonomia.status}
                  onChange={(e) => setFormTaxonomia({ ...formTaxonomia, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Ativo">Ativo (Disponível nos Relatórios de Ocorrência)</option>
                  <option value="Inativo">Inativo (Oculto no formulário de RO)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTaxonomiaAberto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{itemTaxonomiaEditando ? 'Salvar Alterações' : 'Cadastrar Área / Prédio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 12: CONFIRMAÇÃO DE EXCLUSÃO DE PRÉDIO / ÁREA         */}
      {/* ========================================================= */}
      {itemTaxonomiaExcluindo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Excluir Área / Prédio</h3>
                <p className="text-xs text-slate-400">Esta ação removerá a área do prédio.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir a área <strong className="text-white">"{itemTaxonomiaExcluindo.area}"</strong> do prédio <strong className="text-indigo-400">"{itemTaxonomiaExcluindo.predio}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setItemTaxonomiaExcluindo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoTaxonomia}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
