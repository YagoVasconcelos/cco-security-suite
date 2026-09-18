import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Upload,
  X,
  Plus,
  UserX,
  Trash2,
  Eye,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Save,
  FileDown,
  Users,
  Image as ImageIcon,
  ShieldAlert,
  Info,
  Edit3,
  Settings,
  Check,
  HardDrive,
  Loader2,
  CheckCircle2,
  FolderCheck,
  History,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  salvarRelatorioOcorrenciaCompleto,
  carregarOcorrencias,
  fileToDataUrl
} from '../../services/ocorrenciasService';
import RelatorioOcorrenciaOficialDocumento from './RelatorioOcorrenciaOficialDocumento';
import {
  PREDIOS_CCO,
  AREAS_CCO,
  TOPICOS_OCORRENCIA,
  obterAreasDoPredio,
  obterPrediosAtivos,
  MAPEAMENTO_PREDIO_AREAS_CCO,
  normalizarGravidade
} from '../../constants/taxonomiaCco';
import {
  carregarOperadores,
  obterNomesOperadoresAtivos
} from '../../services/operadoresService';
import {
  carregarResponsaveis,
  obterResponsaveisSincrono
} from '../../services/responsaveisService';

export default function RelatorioOcorrenciaForm() {
  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  // Current time HH:MM
  const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);

  const [listaOperadores, setListaOperadores] = useState(() => {
    return obterNomesOperadoresAtivos();
  });
  const [listaPredios, setListaPredios] = useState(() => {
    return obterPrediosAtivos();
  });

  // 1. Dados Gerais com Taxonomia Oficial CCO
  const [formData, setFormData] = useState(() => {
    const operadorSalvo = localStorage.getItem('cco_operador_ativo');
    const nomes = obterNomesOperadoresAtivos();
    const opInicial = (operadorSalvo && nomes.includes(operadorSalvo)) ? operadorSalvo : (nomes[0] || 'Op. Operador 01');

    return {
      numeroRO: `RO-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      data: todayStr,
      hora: timeStr,
      predio: PREDIOS_CCO[0], // 'PORTARIA 1 (P1)'
      area: '',     // Inicia vazio para forçar operador a selecionar área correspondente ao prédio
      topico: TOPICOS_OCORRENCIA[0], // 'USO INDEVIDO DE EPI'
      local: PREDIOS_CCO[0],
      gravidade: 'Média',
      titulo: '',
      descricao: '',
      operador: opInicial
    };
  });

  // Blindagem da lista de operadores: garante que o operador selecionado nunca desapareça da lista
  const opcoesOperadores = useMemo(() => {
    const base = Array.isArray(listaOperadores) ? [...listaOperadores] : [];
    if (formData.operador && !base.includes(formData.operador)) {
      base.unshift(formData.operador);
    }
    return base;
  }, [listaOperadores, formData.operador]);

  // 2. Tabela de Envolvidos
  const [envolvidos, setEnvolvidos] = useState([
    {
      id: 1,
      nome: '',
      funcao: '',
      empresa: '',
      matricula: '',
      naoIdentificado: false
    }
  ]);

  // 3. Upload de Imagens
  const [fotos, setFotos] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // 4. Parâmetros Institucionais / Responsáveis do Site (Carregados da Base Restrita)
  const [responsaveis, setResponsaveis] = useState(() => obterResponsaveisSincrono());

  // Feedback de salvamento temporário
  const [alertaStatus, setAlertaStatus] = useState(null);

  // Estados da lógica de salvamento e exportação de PDF
  const [isSalvando, setIsSalvando] = useState(false);
  const [relatorioSalvoSucesso, setRelatorioSalvoSucesso] = useState(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [historicoOcorrencias, setHistoricoOcorrencias] = useState([]);

  // Modo de visualização: 'edicao' (formulário interativo) ou 'relatorio' (RO formal executivo)
  const [modoVisualizacao, setModoVisualizacao] = useState('edicao');

  // Ocorrência selecionada especificamente para impressão/visualização (null = ocorrência ativa do formulário)
  const [ocorrenciaSelecionadaParaImpressao, setOcorrenciaSelecionadaParaImpressao] = useState(null);

  // Filtros de busca no modal de seleção e histórico de ROs
  const [filtroNumeroRO, setFiltroNumeroRO] = useState('');
  const [filtroDataRO, setFiltroDataRO] = useState('');

  // Ordenação dinâmica das colunas do histórico de ROs
  // Padrão inicial: dataHora decrescente (mais recentes primeiro)
  const [sortField, setSortField] = useState('dataHora'); // 'dataHora' | 'protocolo' | 'predioArea' | 'titulo' | 'gravidade'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
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
      <span className="inline-flex items-center text-blue-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowDown className="w-3 h-3" />
      </span>
    ) : (
      <span className="inline-flex items-center text-blue-400 font-bold ml-1 animate-in fade-in zoom-in duration-150">
        <ArrowUp className="w-3 h-3" />
      </span>
    );
  };

  // Formatador de data brasileira para o documento formal
  const formatarDataBr = (dataIso) => {
    if (!dataIso) return '--/--/----';
    if (dataIso.includes('-')) {
      const p = dataIso.split('-');
      if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    }
    return dataIso;
  };

  // Ocorrências filtradas e ordenadas dinamicamente
  const ocorrenciasFiltradas = useMemo(() => {
    const lista = (Array.isArray(historicoOcorrencias) ? historicoOcorrencias : []).filter(oc => {
      if (!oc) return false;
      // Filtro por número de RO ou texto do título
      if (filtroNumeroRO.trim()) {
        const termo = filtroNumeroRO.toLowerCase().trim();
        const bateRO = oc.numeroRO && oc.numeroRO.toLowerCase().includes(termo);
        const bateTitulo = oc.titulo && oc.titulo.toLowerCase().includes(termo);
        const bateTopico = oc.topico && oc.topico.toLowerCase().includes(termo);
        if (!bateRO && !bateTitulo && !bateTopico) return false;
      }
      // Filtro por Data
      if (filtroDataRO.trim()) {
        if (oc.data !== filtroDataRO) return false;
      }
      return true;
    });

    return [...lista].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'dataHora') {
        // Ordenação cronológica real combinando Data e Hora
        const dataA = a.data || '1970-01-01';
        const horaA = a.hora ? (a.hora.length === 5 ? `${a.hora}:00` : a.hora) : '00:00:00';
        const dataB = b.data || '1970-01-01';
        const horaB = b.hora ? (b.hora.length === 5 ? `${b.hora}:00` : b.hora) : '00:00:00';
        const timeA = new Date(`${dataA}T${horaA}`).getTime() || 0;
        const timeB = new Date(`${dataB}T${horaB}`).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'protocolo') {
        const protoA = String(a.numeroRO || '').toLowerCase();
        const protoB = String(b.numeroRO || '').toLowerCase();
        comparison = protoA.localeCompare(protoB, 'pt-BR', { numeric: true });
      } else if (sortField === 'predioArea') {
        const pA = String(a.predio || (a.local ? a.local.split(' - ')[0] : '') || '');
        const aA = String(a.area || (a.local && a.local.includes(' - ') ? a.local.split(' - ')[1] : '') || '');
        const pB = String(b.predio || (b.local ? b.local.split(' - ')[0] : '') || '');
        const aB = String(b.area || (b.local && b.local.includes(' - ') ? b.local.split(' - ')[1] : '') || '');
        const compPredio = pA.localeCompare(pB, 'pt-BR', { sensitivity: 'base' });
        comparison = compPredio !== 0 ? compPredio : aA.localeCompare(aB, 'pt-BR', { sensitivity: 'base' });
      } else if (sortField === 'titulo') {
        const tA = String(a.titulo || a.topico || '').toLowerCase();
        const tB = String(b.titulo || b.topico || '').toLowerCase();
        comparison = tA.localeCompare(tB, 'pt-BR', { sensitivity: 'base' });
      } else if (sortField === 'gravidade') {
        const gravidadePeso = { 'Crítica': 5, 'Alta': 4, 'Média': 3, 'Baixa': 1 };
        const pesoA = gravidadePeso[normalizarGravidade(a.gravidade)] || 0;
        const pesoB = gravidadePeso[normalizarGravidade(b.gravidade)] || 0;
        comparison = pesoA - pesoB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [historicoOcorrencias, filtroNumeroRO, filtroDataRO, sortField, sortOrder]);

  // Dados consolidados do documento para impressão (selecionado do histórico ou ativo do form)
  const dadosDocumento = useMemo(() => {
    return ocorrenciaSelecionadaParaImpressao ? {
      id: ocorrenciaSelecionadaParaImpressao.id,
      numeroRO: ocorrenciaSelecionadaParaImpressao.numeroRO || 'RO-2026',
      data: ocorrenciaSelecionadaParaImpressao.data,
      hora: ocorrenciaSelecionadaParaImpressao.hora,
      predio: ocorrenciaSelecionadaParaImpressao.predio || (ocorrenciaSelecionadaParaImpressao.local ? ocorrenciaSelecionadaParaImpressao.local.split(' - ')[0] : 'Site'),
      area: ocorrenciaSelecionadaParaImpressao.area || (ocorrenciaSelecionadaParaImpressao.local && ocorrenciaSelecionadaParaImpressao.local.includes(' - ') ? ocorrenciaSelecionadaParaImpressao.local.split(' - ')[1] : ''),
      topico: ocorrenciaSelecionadaParaImpressao.topico || 'Geral',
      gravidade: ocorrenciaSelecionadaParaImpressao.gravidade || 'Média',
      titulo: ocorrenciaSelecionadaParaImpressao.titulo || '',
      descricao: ocorrenciaSelecionadaParaImpressao.descricao || '',
      operador: ocorrenciaSelecionadaParaImpressao.operador || (ocorrenciaSelecionadaParaImpressao.responsaveis && ocorrenciaSelecionadaParaImpressao.responsaveis.operador) || formData.operador,
      envolvidos: Array.isArray(ocorrenciaSelecionadaParaImpressao.envolvidos) ? ocorrenciaSelecionadaParaImpressao.envolvidos : [],
      fotos: Array.isArray(ocorrenciaSelecionadaParaImpressao.fotos)
        ? ocorrenciaSelecionadaParaImpressao.fotos.map(f => ({ ...f, url: f.url || f.base64 || '' }))
        : [],
      responsaveis: ocorrenciaSelecionadaParaImpressao.responsaveis || responsaveis,
      isHistorico: true
    } : {
      id: formData.id,
      numeroRO: formData.numeroRO || 'RO-2026',
      data: formData.data,
      hora: formData.hora,
      predio: formData.predio,
      area: formData.area,
      topico: formData.topico,
      gravidade: formData.gravidade,
      titulo: formData.titulo,
      descricao: formData.descricao,
      operador: formData.operador || responsaveis?.operador || 'Operador CCO',
      envolvidos: Array.isArray(envolvidos) ? envolvidos : [],
      fotos: Array.isArray(fotos) ? fotos.map(f => ({ ...f, url: f.url || f.base64 || '' })) : [],
      responsaveis: responsaveis,
      isHistorico: false
    };
  }, [ocorrenciaSelecionadaParaImpressao, formData, envolvidos, fotos, responsaveis]);

  // Gerador de Hash de Integridade para auditoria formal
  const gerarHashDocumento = (roObj = dadosDocumento) => {
    const seed = `${roObj?.numeroRO || 'RO'}-${roObj?.data || ''}-${roObj?.hora || ''}-${roObj?.titulo || ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  };

  // Dispara a impressão exclusiva do Relatório Oficial Executivo para uma ocorrência (ou a atual)
  const handleImprimirOcorrencia = (oc = null) => {
    setOcorrenciaSelecionadaParaImpressao(oc);
    setHistoricoModalOpen(false);
    setModoVisualizacao('relatorio');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Abre a visualização formal de uma ocorrência específica ou da atual
  const handleVisualizarFormal = (oc = null) => {
    setOcorrenciaSelecionadaParaImpressao(oc);
    setHistoricoModalOpen(false);
    setModoVisualizacao('relatorio');
  };

  // Carrega histórico existente de ocorrências ao montar
  useEffect(() => {
    carregarHistorico();
  }, []);

  // Sincroniza parâmetros institucionais / responsáveis do site (Configurações Restritas)
  useEffect(() => {
    const sincronizarResponsaveis = async () => {
      try {
        const dados = await carregarResponsaveis();
        if (dados) setResponsaveis(dados);
      } catch (e) {
        console.warn('Erro ao sincronizar responsáveis do site na Ferramenta 1:', e);
      }
    };

    sincronizarResponsaveis();

    const handleResponsaveisChanged = (e) => {
      if (e.detail) {
        setResponsaveis(e.detail);
      } else {
        sincronizarResponsaveis();
      }
    };

    window.addEventListener('cco_responsaveis_changed', handleResponsaveisChanged);
    return () => window.removeEventListener('cco_responsaveis_changed', handleResponsaveisChanged);
  }, []);

  // Carrega e sincroniza lista dinâmica de operadores CCO
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
        console.error('Erro ao buscar operadores na Ferramenta 1:', e);
      }
    };

    atualizarOperadores();

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

    const handleTaxonomiaChanged = () => {
      setListaPredios(obterPrediosAtivos());
    };

    window.addEventListener('cco_operadores_changed', handleOperadoresChanged);
    window.addEventListener('cco_taxonomia_changed', handleTaxonomiaChanged);
    return () => {
      window.removeEventListener('cco_operadores_changed', handleOperadoresChanged);
      window.removeEventListener('cco_taxonomia_changed', handleTaxonomiaChanged);
    };
  }, []);

  const carregarHistorico = async () => {
    try {
      const dados = await carregarOcorrencias();
      setHistoricoOcorrencias(dados);
    } catch (e) {
      console.error('Erro ao buscar histórico:', e);
    }
  };

  // Manipuladores de Dados Gerais
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePredioChange = (novoPredio) => {
    setFormData(prev => ({
      ...prev,
      predio: novoPredio,
      area: '', // Limpa automaticamente ao mudar prédio para forçar escolha de opção válida do novo escopo
      local: novoPredio
    }));
  };

  const handleAreaChange = (novaArea) => {
    setFormData(prev => ({
      ...prev,
      area: novaArea,
      local: prev.predio ? `${prev.predio} - ${novaArea}` : novaArea
    }));
  };

  // Lista dinâmica e estrita de áreas baseada no prédio selecionado (Planilha Oficial)
  const areasDisponiveis = useMemo(() => {
    if (!formData.predio) return [];
    const lista = obterAreasDoPredio(formData.predio);
    // Preserva área histórica caso esteja visualizando/editando RO anterior com área válida
    if (formData.area && !lista.includes(formData.area)) {
      return [...lista, formData.area];
    }
    return lista;
  }, [formData.predio, formData.area, listaPredios]);

  const handleTopicoChange = (novoTopico) => {
    setFormData(prev => ({
      ...prev,
      topico: novoTopico,
      titulo: prev.titulo ? prev.titulo : novoTopico
    }));
  };

  // Manipuladores de Envolvidos
  const adicionarEnvolvido = (isUnidentified = false) => {
    const novo = {
      id: Date.now(),
      nome: isUnidentified ? '(Não identificado)' : '',
      funcao: isUnidentified ? '(Não identificado)' : '',
      empresa: isUnidentified ? '(Não identificado)' : '',
      matricula: isUnidentified ? 'N/A' : '',
      naoIdentificado: isUnidentified
    };
    setEnvolvidos(prev => [...prev, novo]);
  };

  const atualizarEnvolvido = (id, field, value) => {
    setEnvolvidos(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const alternarNaoIdentificado = (id) => {
    setEnvolvidos(prev => prev.map(item => {
      if (item.id === id) {
        const novoStatus = !item.naoIdentificado;
        return {
          ...item,
          naoIdentificado: novoStatus,
          nome: novoStatus ? '(Não identificado)' : '',
          funcao: novoStatus ? '(Não identificado)' : '',
          empresa: novoStatus ? '(Não identificado)' : '',
          matricula: novoStatus ? 'N/A' : ''
        };
      }
      return item;
    }));
  };

  const removerEnvolvido = (id) => {
    if (envolvidos.length === 1) {
      // Se tiver apenas 1, limpa os campos ao invés de remover a linha
      setEnvolvidos([{
        id: Date.now(),
        nome: '',
        funcao: '',
        empresa: '',
        matricula: '',
        naoIdentificado: false
      }]);
      return;
    }
    setEnvolvidos(prev => prev.filter(item => item.id !== id));
  };

  // Manipuladores de Fotos com conversão imediata para Base64
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const novasFotosPromessas = files.map(async (file, idx) => {
      let base64 = '';
      try {
        base64 = await fileToDataUrl(file);
      } catch (err) {
        console.warn('Falha na conversão de imagem para base64:', err);
      }

      return {
        id: `${Date.now()}-${idx}`,
        file,
        url: base64 || URL.createObjectURL(file),
        base64: base64,
        nomeArquivo: file.name,
        tamanho: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        legenda: `Anexo ${fotos.length + idx + 1} - Registro fotográfico da ocorrência`
      };
    });

    const novasFotos = await Promise.all(novasFotosPromessas);
    setFotos(prev => [...prev, ...novasFotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removerFoto = (id) => {
    setFotos(prev => {
      const target = prev.find(f => f.id === id);
      if (target && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const atualizarLegendaFoto = (id, novaLegenda) => {
    setFotos(prev => prev.map(f => f.id === id ? { ...f, legenda: novaLegenda } : f));
  };

  // Carrega uma ocorrência do histórico diretamente no formulário
  const carregarOcorrenciaNoFormulario = (oc) => {
    const predioCarregado = oc.predio || (oc.local && oc.local.includes(' - ') ? oc.local.split(' - ')[0] : (oc.local || PREDIOS_CCO[0]));
    const areaCarregada = oc.area || (oc.local && oc.local.includes(' - ') ? oc.local.split(' - ')[1] : AREAS_CCO[0]);
    const topicoCarregado = oc.topico || TOPICOS_OCORRENCIA[0];

    setFormData({
      id: oc.id,
      numeroRO: oc.numeroRO,
      data: oc.data,
      hora: oc.hora,
      predio: predioCarregado,
      area: areaCarregada,
      topico: topicoCarregado,
      local: oc.local || `${predioCarregado} - ${areaCarregada}`,
      gravidade: oc.gravidade || 'Média',
      titulo: oc.titulo || '',
      descricao: oc.descricao || '',
      operador: oc.operador || (oc.responsaveis && oc.responsaveis.operador) || listaOperadores[0] || 'Op. Operador 01'
    });
    setEnvolvidos(oc.envolvidos && oc.envolvidos.length > 0 ? oc.envolvidos : [{
      id: Date.now(),
      nome: '',
      funcao: '',
      empresa: '',
      matricula: '',
      naoIdentificado: false
    }]);
    setFotos((oc.fotos || []).map(f => ({
      ...f,
      url: f.base64 || f.url || ''
    })));
    if (oc.responsaveis) {
      setResponsaveis(oc.responsaveis);
    }
    setHistoricoModalOpen(false);
    mostrarNotificacao(`Ocorrência ${oc.numeroRO} carregada no formulário.`, 'info');
  };

  // Ações de Botões
  const limparFormulario = () => {
    if (window.confirm('Deseja realmente limpar todos os campos preenchidos?')) {
      const opAtual = localStorage.getItem('cco_operador_ativo') || listaOperadores[0] || 'Op. Operador 01';
      setFormData({
        numeroRO: `RO-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        data: todayStr,
        hora: timeStr,
        predio: PREDIOS_CCO[0],
        area: '',
        topico: TOPICOS_OCORRENCIA[0],
        local: PREDIOS_CCO[0],
        gravidade: 'Média',
        titulo: '',
        descricao: '',
        operador: opAtual
      });
      setEnvolvidos([{
        id: Date.now(),
        nome: '',
        funcao: '',
        empresa: '',
        matricula: '',
        naoIdentificado: false
      }]);
      setFotos([]);
      setOcorrenciaSelecionadaParaImpressao(null);
      mostrarNotificacao('Formulário redefinido com sucesso.', 'info');
    }
  };

  const salvarRascunho = () => {
    mostrarNotificacao(`Rascunho da ocorrência ${formData.numeroRO} salvo localmente.`, 'success');
  };

  // REGRA DE NEGÓCIO: Salva os dados no banco de dados local (JSON/Excel) e gera o PDF em CCO/exports
  const handleSalvarRelatorio = async () => {
    if (!formData.data) {
      alert('Por favor, informe a Data do fato.');
      return;
    }
    if (!formData.hora) {
      alert('Por favor, informe o Horário do fato.');
      return;
    }
    if (!formData.predio) {
      alert('Por favor, selecione o Prédio (Estrutural).');
      return;
    }
    if (!formData.area) {
      alert('Por favor, selecione a Área / Setor correspondente ao prédio selecionado.');
      return;
    }
    if (!formData.titulo.trim()) {
      alert('Por favor, informe o Título da ocorrência.');
      return;
    }
    if (!formData.descricao.trim()) {
      alert('Por favor, preencha a Descrição Detalhada dos fatos.');
      return;
    }

    setIsSalvando(true);
    try {
      const operadorResponsavel = formData.operador || localStorage.getItem('cco_operador_ativo') || listaOperadores[0] || 'Op. Operador 01';
      const resultado = await salvarRelatorioOcorrenciaCompleto({
        formData: {
          ...formData,
          operador: operadorResponsavel
        },
        envolvidos,
        fotos,
        responsaveis: {
          ...responsaveis,
          operador: operadorResponsavel
        }
      });

      setRelatorioSalvoSucesso(resultado);
      await carregarHistorico();
      mostrarNotificacao(`✓ Relatório ${formData.numeroRO} salvo no banco de dados e exportado para CCO/exports com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao salvar relatório e gerar PDF:', err);
      alert('Falha ao processar relatório: ' + err.message);
    } finally {
      setIsSalvando(false);
    }
  };

  const iniciarNovoRelatorio = () => {
    const opAtual = localStorage.getItem('cco_operador_ativo') || listaOperadores[0] || 'Op. Operador 01';
    setFormData({
      numeroRO: `RO-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      data: todayStr,
      hora: timeStr,
      predio: PREDIOS_CCO[0],
      area: '',
      topico: TOPICOS_OCORRENCIA[0],
      local: PREDIOS_CCO[0],
      gravidade: 'Média',
      titulo: '',
      descricao: '',
      operador: opAtual
    });
    setEnvolvidos([{
      id: Date.now(),
      nome: '',
      funcao: '',
      empresa: '',
      matricula: '',
      naoIdentificado: false
    }]);
    setFotos([]);
    setRelatorioSalvoSucesso(null);
    mostrarNotificacao('Novo formulário pronto para preenchimento.', 'info');
  };

  const mostrarNotificacao = (msg, tipo) => {
    setAlertaStatus({ msg, tipo });
    setTimeout(() => setAlertaStatus(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 print:max-w-full print:p-0 print:space-y-4 print:pb-0">
      {/* Regra de Impressão Nativa do Relatório de Ocorrências em Modo Retrato A4 */}
      <style>{`
        @page {
          size: portrait !important;
          margin: 8mm 8mm 12mm 8mm !important;
        }
      `}</style>
      {/* Toast Notification */}
      {alertaStatus && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-xl animate-in fade-in slide-in-from-top-3 ${alertaStatus.tipo === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
          }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{alertaStatus.msg}</span>
          </div>
          <button onClick={() => setAlertaStatus(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Header Card - Estruturado em 2 Camadas Dedicadas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-5 w-full print:hidden mb-6">
        {/* CAMADA SUPERIOR: Bloco de Título e Identificação com Largura 100% Livre */}
        <div className="flex items-start gap-4 w-full">
          <div className="p-3.5 bg-blue-600/15 border border-blue-500/30 text-blue-400 rounded-2xl shrink-0 shadow-inner mt-0.5">
            <FileText className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {/* Linha de Badges e Protocolo do RO */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-lg bg-blue-950/90 border border-blue-500/50 text-blue-300 shadow-sm shrink-0 tracking-wider">
                {formData.numeroRO}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Em Digitação / Rascunho
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 shrink-0 font-semibold">
                Módulo 1 • Ocorrências
              </span>
            </div>

            {/* Título Principal com Largura Total Livre */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase leading-tight">
              CENTRAL DE CONTROLE OPERACIONAL
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Registro de Relatório de Ocorrência (RO) • CCO Security Suite • Gestão de Incidentes Patrimoniais
            </p>
          </div>
        </div>

        {/* CAMADA INFERIOR: Barra de Ações Operacionais em Linha Única (flex-row flex-nowrap) */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-row flex-nowrap items-center gap-2 sm:gap-2.5 w-full overflow-x-auto pb-1 scrollbar-thin">
          {/* 1. Histórico */}
          <button
            type="button"
            onClick={() => setHistoricoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            title="Ver histórico de ocorrências registradas"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Histórico ({historicoOcorrencias.length})</span>
          </button>

          {/* 2. Limpar */}
          <button
            type="button"
            onClick={limparFormulario}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            title="Limpar todos os campos do formulário"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Limpar</span>
          </button>

          {/* 3. Rascunho */}
          <button
            type="button"
            onClick={salvarRascunho}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            title="Salvar rascunho temporário"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span>Rascunho</span>
          </button>

          {/* 4. Imprimir / Selecionar RO */}
          <button
            type="button"
            onClick={() => setHistoricoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-300 text-xs font-bold border border-blue-500/40 hover:border-blue-500/60 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            title="Selecionar ocorrência por número de RO ou data para impressão oficial"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Imprimir / Selecionar RO</span>
          </button>

          {/* 5. Visualizar RO Formal */}
          <button
            type="button"
            onClick={() => {
              if (modoVisualizacao === 'relatorio') {
                setModoVisualizacao('edicao');
              } else {
                handleVisualizarFormal(null);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap ${
              modoVisualizacao === 'relatorio'
                ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-blue-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
            title={modoVisualizacao === 'relatorio' ? 'Voltar para o formulário de edição' : 'Visualizar Modelo de Relatório Oficial na tela'}
          >
            {modoVisualizacao === 'relatorio' ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Voltar à Edição</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Visualizar RO Formal</span>
              </>
            )}
          </button>

          {/* 6. Salvar Relatório & Gerar PDF */}
          <button
            type="button"
            onClick={handleSalvarRelatorio}
            disabled={isSalvando}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            title="Salvar registro no banco de dados local e exportar PDF em CCO/exports"
          >
            {isSalvando ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gerando PDF & Salvando...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Salvar Relatório & Gerar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* BANNER DE CONTROLE QUANDO EM MODO VISUALIZAÇÃO FORMAL NA TELA */}
      {modoVisualizacao === 'relatorio' && (
        <div className="ro-controls-banner bg-slate-900 border border-blue-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                Visualização do Modelo Oficial de Ocorrência (RO Executivo)
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  {dadosDocumento.numeroRO}
                </span>
                {dadosDocumento.isHistorico && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                    Registro do Histórico
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400">
                Documento formatado estritamente para impressão corporativa limpa sem caixas ou campos de edição.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor rápido de Ocorrência */}
            {historicoOcorrencias.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400 text-[11px] font-semibold">Exibindo:</span>
                <select
                  value={ocorrenciaSelecionadaParaImpressao ? (ocorrenciaSelecionadaParaImpressao.id || ocorrenciaSelecionadaParaImpressao.numeroRO) : 'atual'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'atual') {
                      setOcorrenciaSelecionadaParaImpressao(null);
                    } else {
                      const achou = historicoOcorrencias.find(oc => String(oc.id || oc.numeroRO) === String(val));
                      if (achou) setOcorrenciaSelecionadaParaImpressao(achou);
                    }
                  }}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[210px] truncate"
                >
                  <option value="atual" className="bg-slate-900 text-white">
                    Formulário Atual ({formData.numeroRO})
                  </option>
                  {historicoOcorrencias.map(oc => (
                    <option key={oc.id || oc.numeroRO} value={oc.id || oc.numeroRO} className="bg-slate-900 text-white">
                      {oc.numeroRO} - {formatarDataBr(oc.data)} ({oc.titulo ? oc.titulo.substring(0, 20) : oc.topico || 'RO'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setHistoricoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Abrir seleção de ocorrências por número de RO ou Data"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Selecionar Outro RO</span>
            </button>

            <button
              type="button"
              onClick={() => setModoVisualizacao('edicao')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Voltar à Edição</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>
      )}

      {/* FORM CONTAINER - OCULTADO AUTOMATICAMENTE NA IMPRESSÃO (@media print) E NO MODO RELATÓRIO */}
      <div className={`ro-editor-container print:hidden ${modoVisualizacao === 'relatorio' ? 'hidden' : 'block'}`}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

        {/* ========================================================= */}
        {/* SEÇÃO 1: DADOS GERAIS                                     */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-sm print:bg-slate-900 print:border-slate-700 print:p-4 print-avoid-break print:break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 text-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                1
              </span>
              <h4 className="font-bold text-base text-white">Dados Gerais da Ocorrência</h4>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Preencha os dados do fato operacional
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Data */}
            <div>
              <label htmlFor="data-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Data do Fato <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="data-ocorrencia"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Hora */}
            <div>
              <label htmlFor="hora-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Horário Estimado <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="hora-ocorrencia"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => handleInputChange('hora', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Prédio (Taxonomia Oficial) */}
            <div>
              <label htmlFor="predio-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Prédio (Estrutural) <span className="text-red-400">*</span>
              </label>
              <select
                id="predio-ocorrencia"
                value={formData.predio}
                onChange={(e) => handlePredioChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer truncate"
              >
                <option value="">Selecione o Prédio...</option>
                {listaPredios.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Área / Setor (Relacionamento Dinâmico em Cascata) */}
            <div>
              <label htmlFor="area-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Área / Setor <span className="text-red-400">*</span></span>
                {formData.predio && (
                  <span className="text-[10px] text-blue-400 font-mono lowercase">
                    ({areasDisponiveis.length} {areasDisponiveis.length === 1 ? 'área' : 'áreas'})
                  </span>
                )}
              </label>
              <select
                id="area-ocorrencia"
                value={formData.area}
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={!formData.predio}
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer truncate transition-all ${
                  !formData.predio 
                    ? 'border-slate-800 text-slate-500 opacity-60 cursor-not-allowed bg-slate-900/50' 
                    : 'border-slate-700 hover:border-blue-500/60'
                }`}
              >
                <option value="">
                  {formData.predio ? 'Selecione a Área / Setor...' : 'Selecione primeiro o Prédio...'}
                </option>
                {areasDisponiveis.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tópico de Ocorrência (Taxonomia Oficial) */}
            <div>
              <label htmlFor="topico-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Tópico da Ocorrência <span className="text-red-400">*</span>
              </label>
              <select
                id="topico-ocorrencia"
                value={formData.topico}
                onChange={(e) => handleTopicoChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer truncate"
              >
                {TOPICOS_OCORRENCIA.map((top) => (
                  <option key={top} value={top}>{top}</option>
                ))}
              </select>
            </div>

            {/* Nível de Gravidade */}
            <div>
              <label htmlFor="gravidade-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Classificação de Gravidade <span className="text-red-400">*</span>
              </label>
              <select
                id="gravidade-ocorrencia"
                value={formData.gravidade}
                onChange={(e) => handleInputChange('gravidade', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="Baixa">Baixa / Notificação Simples</option>
                <option value="Média">Média / Ocorrência Padrão</option>
                <option value="Alta">Alta / Requer Apuração</option>
                <option value="Grave">Grave / Incidente Operacional</option>
                <option value="Crítica">Crítica / Incidente Imediato</option>
              </select>
            </div>

            {/* Operador CCO Responsável (Dinâmico) */}
            <div>
              <label htmlFor="operador-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Operador CCO (Registro) <span className="text-red-400">*</span>
              </label>
              <select
                id="operador-ocorrencia"
                value={formData.operador}
                onChange={(e) => handleInputChange('operador', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer truncate"
              >
                {opcoesOperadores.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Título da Ocorrência com Sugestões de Atalho dos Tópicos */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1 print:hidden">
              <label htmlFor="titulo-ocorrencia" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Título do Fato / Assunto Principal <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-blue-400 font-semibold">Clique no tópico abaixo para preencher rapidamente:</span>
            </div>

            {/* Input de Edição na Tela */}
            <input
              id="titulo-ocorrencia"
              type="text"
              placeholder="Ex: Não utilização de EPI na Linha de Produção"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium print:hidden"
            />

            {/* Bloco Exclusivo de Impressão para o Título (Layout Estável sem sobreposição) */}
            <div className="hidden print:block w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm font-bold text-slate-100 uppercase tracking-wide">
              TÍTULO: {formData.titulo || 'Ocorrência Operacional sem título'}
            </div>

            {/* Badges de sugestões rápidas a partir de TOPICOS_OCORRENCIA */}
            <div className="flex flex-wrap gap-1.5 mt-2.5 print:hidden">
              {TOPICOS_OCORRENCIA.map((top, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    handleTopicoChange(top);
                    handleInputChange('titulo', top);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${formData.topico === top
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm shadow-blue-500/30'
                      : 'bg-slate-800 hover:bg-blue-900/40 hover:text-blue-300 text-slate-300 border-slate-700/80'
                    }`}
                >
                  + {top}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição Detalhada / Relato Cronológico com Separação Explícita de Bloco */}
          <div className="mt-5 pt-2 border-t border-slate-800/80 print:border-none print:mt-4 print:pt-0 print-avoid-break print:break-inside-avoid flex flex-col space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="descricao-ocorrencia" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                RELATO CRONOLÓGICO DOS FATOS: <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono print:hidden">
                {formData.descricao.length} caracteres
              </span>
            </div>
            {/* Visível na tela (Modo Edição) */}
            <textarea
              id="descricao-ocorrencia"
              name="descricao-ocorrencia"
              rows={6}
              placeholder="Relate cronologicamente os fatos observados, ações tomadas pela equipe de segurança, medidas de contenção e orientações transmitidas..."
              value={formData.descricao || ''}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans print:hidden relative z-20 pointer-events-auto cursor-text select-text"
              style={{ minHeight: '130px', resize: 'vertical' }}
            />
            {/* Visível exclusivamente na impressão - expansível, fluido sem alturas fixas nem sobreposição */}
            <div className="hidden print:block w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-wrap break-words min-h-[100px] print:overflow-visible">
              {formData.descricao || 'Sem descrição detalhada registrada.'}
            </div>
          </div>
        </div>


        {/* ========================================================= */}
        {/* SEÇÃO 2: TABELA DE ENVOLVIDOS / IDENTIFICAÇÃO DE PESSOAS  */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm print:bg-slate-900 print:border-slate-700 print:p-4 print-avoid-break print:break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                2
              </span>
              <div>
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  Tabela 1 - Envolvidos / Identificação de Pessoas
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {envolvidos.length} {envolvidos.length === 1 ? 'registro' : 'registros'}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Cadastre colaboradores, terceiros, visitantes ou registre como não identificado.
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => adicionarEnvolvido(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
                title="Atalho: Adicionar linha pré-preenchida como (Não identificado)"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Adicionar Não Identificado</span>
              </button>

              <button
                type="button"
                onClick={() => adicionarEnvolvido(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Envolvido</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[220px]">Nome Completo</th>
                  <th className="py-3 px-4 min-w-[170px]">Função / Cargo</th>
                  <th className="py-3 px-4 min-w-[170px]">Empresa</th>
                  <th className="py-3 px-4 min-w-[130px]">Matrícula</th>
                  <th className="py-3 px-3 text-center min-w-[140px]">Atalho / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {envolvidos.map((pessoa, index) => (
                  <tr
                    key={pessoa.id}
                    className={`transition-colors ${pessoa.naoIdentificado
                        ? 'bg-amber-950/20 hover:bg-amber-950/30'
                        : 'hover:bg-slate-850/50'
                      }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>

                    {/* Nome Completo */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        disabled={pessoa.naoIdentificado}
                        placeholder="Nome da pessoa envolvida"
                        value={pessoa.nome}
                        onChange={(e) => atualizarEnvolvido(pessoa.id, 'nome', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${pessoa.naoIdentificado
                            ? 'border-amber-700/50 text-amber-300 font-semibold italic bg-amber-950/40'
                            : 'border-slate-700'
                          }`}
                      />
                    </td>

                    {/* Função / Cargo */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        disabled={pessoa.naoIdentificado}
                        placeholder="Ex: Operador, Motorista"
                        value={pessoa.funcao}
                        onChange={(e) => atualizarEnvolvido(pessoa.id, 'funcao', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${pessoa.naoIdentificado
                            ? 'border-amber-700/50 text-amber-300/80 italic bg-amber-950/40'
                            : 'border-slate-700'
                          }`}
                      />
                    </td>

                    {/* Empresa */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        disabled={pessoa.naoIdentificado}
                        placeholder="Ex: Prestador de Serviços, Logística ABC"
                        value={pessoa.empresa}
                        onChange={(e) => atualizarEnvolvido(pessoa.id, 'empresa', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${pessoa.naoIdentificado
                            ? 'border-amber-700/50 text-amber-300/80 italic bg-amber-950/40'
                            : 'border-slate-700'
                          }`}
                      />
                    </td>

                    {/* Matrícula */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        disabled={pessoa.naoIdentificado}
                        placeholder="Nº Matrícula ou RG"
                        value={pessoa.matricula}
                        onChange={(e) => atualizarEnvolvido(pessoa.id, 'matricula', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${pessoa.naoIdentificado
                            ? 'border-amber-700/50 text-amber-300/80 italic bg-amber-950/40'
                            : 'border-slate-700'
                          }`}
                      />
                    </td>

                    {/* Ações / Toggle Não Identificado */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => alternarNaoIdentificado(pessoa.id)}
                          className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${pessoa.naoIdentificado
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300 hover:border-amber-500/30'
                            }`}
                          title="Alternar entre (Não identificado) e preenchimento manual"
                        >
                          {pessoa.naoIdentificado ? 'Desmarcar' : 'Não Ident.'}
                        </button>

                        <button
                          type="button"
                          onClick={() => removerEnvolvido(pessoa.id)}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"
                          title="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>* Se a pessoa não tiver identificação confirmada, utilize o atalho "Não Ident.".</span>
            <span>Total de registros: {envolvidos.length}</span>
          </div>
        </div>


        {/* ========================================================= */}
        {/* SEÇÃO 3: UPLOAD DE IMAGENS DA OCORRÊNCIA                 */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm print:bg-slate-900 print:border-slate-700 print:p-4 print-avoid-break print:break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                3
              </span>
              <div>
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  Registro Fotográfico / Anexo de Imagens
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {fotos.length} {fotos.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Fotos com prévia imediata que serão organizadas automaticamente no relatório final.
                </p>
              </div>
            </div>

            {fotos.length > 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors print:hidden"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Adicionar mais fotos</span>
              </button>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70 group print:hidden"
          >
            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-colors mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white mb-1">
              Clique para selecionar as fotos da ocorrência
            </p>
            <p className="text-xs text-slate-400 max-w-md">
              Suporta múltiplos arquivos PNG, JPG ou JPEG. As imagens serão dimensionadas proporcionalmente na geração do documento.
            </p>
          </div>

          {/* Image Previews Grid */}
          {fotos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {fotos.map((foto, index) => (
                <div
                  key={foto.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col print-avoid-break print:break-inside-avoid print:border-slate-700"
                >
                  {/* Photo Preview with Hover Overlay */}
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={foto.url}
                      alt={foto.legenda}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] font-mono text-slate-300 border border-slate-800">
                      Foto #{index + 1}
                    </div>

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(foto);
                        }}
                        className="p-2 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500 transition-colors"
                        title="Ver em tamanho ampliado"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removerFoto(foto.id);
                        }}
                        className="p-2 rounded-lg bg-red-950/90 text-red-300 hover:text-white border border-red-800/80 hover:border-red-600 transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Photo Details & Caption Editor */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-mono">
                        <span className="truncate max-w-[180px]">{foto.nomeArquivo}</span>
                        <span>{foto.tamanho}</span>
                      </div>
                      <input
                        type="text"
                        value={foto.legenda}
                        onChange={(e) => atualizarLegendaFoto(foto.id, e.target.value)}
                        placeholder="Digite a legenda da foto..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        </form>
      </div>

      {/* ========================================================================= */}
      {/* MODELO UNIFICADO DE RELATÓRIO OFICIAL DE OCORRÊNCIA (RO FORMAL EXECUTIVO) */}
      {/* ========================================================================= */}
      <div className={`ro-formal-document ${modoVisualizacao === 'relatorio' ? 'block' : 'hidden print:block'}`}>
        <RelatorioOcorrenciaOficialDocumento
          dadosDocumento={dadosDocumento}
          responsaveis={dadosDocumento.responsaveis || responsaveis}
          gerarHashDocumento={gerarHashDocumento}
        />
      </div>

      {/* ========================================================= */}
      {/* MODAL DE SUCESSO DO SALVAMENTO & EXPORTAÇÃO DE PDF        */}
      {/* ========================================================= */}
      {relatorioSalvoSucesso && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Relatório Salvo & PDF Exportado!
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ocorrência registrada no banco de dados e arquivo gerado com sucesso.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRelatorioSalvoSucesso(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detalhes do Arquivo */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Protocolo do RO:</span>
                <span className="font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                  {relatorioSalvoSucesso.numeroRO}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Nome do Arquivo:</span>
                <span className="font-bold text-slate-200 truncate max-w-[260px]" title={relatorioSalvoSucesso.nomeArquivo}>
                  {relatorioSalvoSucesso.nomeArquivo}
                </span>
              </div>

              <div className="pt-1">
                <p className="text-slate-400 text-[11px] mb-1.5 flex items-center gap-1">
                  <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Locais Confirmados no Disco:
                </p>
                <ul className="space-y-1 text-[11px] text-emerald-300/90 pl-2 list-disc list-inside font-mono">
                  {relatorioSalvoSucesso.caminhosSalvos && relatorioSalvoSucesso.caminhosSalvos.length > 0 ? (
                    relatorioSalvoSucesso.caminhosSalvos.map((p, idx) => (
                      <li key={idx} className="truncate" title={p}>
                        {p}
                      </li>
                    ))
                  ) : (
                    <>
                      <li>Documentos\CCO Security Suite\exports\{relatorioSalvoSucesso.nomeArquivo}</li>
                      <li>data\ocorrencias.json (Banco de Dados)</li>
                    </>
                  )}
                </ul>
              </div>

              {relatorioSalvoSucesso.avisos && relatorioSalvoSucesso.avisos.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-[11px] text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Aviso de Diretório Secundário:</span>
                  </div>
                  {relatorioSalvoSucesso.avisos.map((aviso, idx) => (
                    <p key={idx} className="text-amber-300/90 leading-relaxed font-sans">{aviso}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/40 text-xs text-blue-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400 shrink-0" />
                <span>O download do PDF também foi iniciado automaticamente.</span>
              </div>
              {window.electronAPI?.abrirPasta && (
                <button
                  type="button"
                  onClick={() => window.electronAPI.abrirPasta('')}
                  className="px-2.5 py-1 rounded bg-blue-800/60 hover:bg-blue-750 text-blue-200 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Abrir Pasta
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRelatorioSalvoSucesso(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={iniciarNovoRelatorio}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CORPORATIVO DE SELEÇÃO & IMPRESSÃO DE OCORRÊNCIAS (HISTÓRICO / PRINT) */}
      {/* ========================================================================= */}
      {historicoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay print:hidden fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2 flex-wrap">
                    Seleção & Impressão de Relatórios de Ocorrência (RO)
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                      {historicoOcorrencias.length} salvos
                    </span>
                    {(filtroNumeroRO || filtroDataRO) && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                        {ocorrenciasFiltradas.length} encontrados
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione uma ocorrência por número de RO ou data para carregar e imprimir estritamente o Layout Executivo Oficial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoricoModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CARD DESTACADO: Ocorrência Ativa no Formulário (Em Edição/Rascunho) */}
            <div className="bg-slate-950/90 border border-blue-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Ocorrência Ativa no Formulário
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                    {formData.numeroRO}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatarDataBr(formData.data)} às {formData.hora || '--:--'}
                  </span>
                  <span className="text-xs text-slate-400">
                    • {formData.predio || 'Site'} ({formData.area || 'Área'})
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 truncate max-w-xl" title={formData.titulo || '(Sem título preenchido)'}>
                  {formData.titulo ? formData.titulo : <span className="text-slate-500 italic">(Sem título preenchido no formulário)</span>}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleVisualizarFormal(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Visualizar modelo formal executivo na tela"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Visualizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImprimirOcorrencia(null)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  title="Imprimir layout executivo oficial da ocorrência ativa no formulário"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir RO Atual</span>
                </button>
              </div>
            </div>

            {/* BARRA DE FILTROS: Busca por RO/Texto e Filtro por Data */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              {/* Filtro por Número de RO / Título */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por número de RO (ex: RO-2026-986), título ou tópico..."
                  value={filtroNumeroRO}
                  onChange={(e) => setFiltroNumeroRO(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Filtro por Data */}
              <div className="sm:col-span-4 relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={filtroDataRO}
                  onChange={(e) => setFiltroDataRO(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  title="Filtrar por data do fato"
                />
              </div>

              {/* Botão Limpar Filtros e Indicador de Ordenação Ativa */}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2">
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Ordem:</span>
                  <strong className="text-blue-300">
                    {sortField === 'dataHora' ? 'Data / Hora' :
                     sortField === 'protocolo' ? 'Protocolo' :
                     sortField === 'predioArea' ? 'Prédio / Área' :
                     sortField === 'titulo' ? 'Título' : 'Gravidade'}
                  </strong>
                  <span className="text-blue-400 font-bold text-[10px]">
                    {sortOrder === 'desc' ? '▼' : '▲'}
                  </span>
                </div>
                {(filtroNumeroRO || filtroDataRO) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroNumeroRO('');
                      setFiltroDataRO('');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 font-mono">
                    {ocorrenciasFiltradas.length} registro(s)
                  </div>
                )}
              </div>
            </div>

            {/* TABELA DO HISTÓRICO COM BOTÕES DIRETOS DE IMPRESSÃO (LARGURA TOTAL FLUIDA SEM ROLAGEM LATERAL) */}
            <div className="w-full overflow-y-auto overflow-x-hidden flex-1 border border-slate-800 rounded-xl min-h-[220px]">
              <table className="w-full text-left border-collapse text-xs table-auto">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 select-none">
                    {/* Protocolo */}
                    <th
                      onClick={() => handleSort('protocolo')}
                      className="py-2.5 px-2.5 w-[14%] whitespace-nowrap cursor-pointer hover:text-white hover:bg-slate-900/90 transition-colors group"
                      title="Clique para ordenar por Protocolo"
                    >
                      <div className="flex items-center gap-1">
                        <span>Protocolo</span>
                        {renderSortIndicator('protocolo')}
                      </div>
                    </th>

                    {/* Data / Hora */}
                    <th
                      onClick={() => handleSort('dataHora')}
                      className="py-2.5 px-2.5 w-[14%] whitespace-nowrap cursor-pointer hover:text-white hover:bg-slate-900/90 transition-colors group"
                      title="Clique para ordenar cronologicamente por Data e Hora"
                    >
                      <div className="flex items-center gap-1">
                        <span>Data / Hora</span>
                        {renderSortIndicator('dataHora')}
                      </div>
                    </th>

                    {/* Prédio / Área */}
                    <th
                      onClick={() => handleSort('predioArea')}
                      className="py-2.5 px-2.5 w-[17%] cursor-pointer hover:text-white hover:bg-slate-900/90 transition-colors group"
                      title="Clique para ordenar por Prédio e Área"
                    >
                      <div className="flex items-center gap-1">
                        <span>Prédio / Área</span>
                        {renderSortIndicator('predioArea')}
                      </div>
                    </th>

                    {/* Tópico & Título do Fato */}
                    <th
                      onClick={() => handleSort('titulo')}
                      className="py-2.5 px-3 w-auto min-w-0 cursor-pointer hover:text-white hover:bg-slate-900/90 transition-colors group"
                      title="Clique para ordenar por Tópico e Título"
                    >
                      <div className="flex items-center gap-1">
                        <span>Tópico & Título do Fato</span>
                        {renderSortIndicator('titulo')}
                      </div>
                    </th>

                    {/* Gravidade */}
                    <th
                      onClick={() => handleSort('gravidade')}
                      className="py-2.5 px-2 text-center w-[10%] whitespace-nowrap cursor-pointer hover:text-white hover:bg-slate-900/90 transition-colors group"
                      title="Clique para ordenar por Gravidade"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Gravidade</span>
                        {renderSortIndicator('gravidade')}
                      </div>
                    </th>

                    {/* Envolvidos */}
                    <th className="py-2.5 px-1.5 text-center w-[6%] whitespace-nowrap" title="Pessoas Envolvidas">Env.</th>

                    {/* Ações */}
                    <th className="py-2.5 px-2 text-center w-[22%] whitespace-nowrap">Ações de Impressão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {historicoOcorrencias.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        Nenhum relatório de ocorrência salvo no histórico local. Utilize a ocorrência do formulário ativo acima.
                      </td>
                    </tr>
                  ) : ocorrenciasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Filter className="w-6 h-6 text-slate-600" />
                          <p className="text-xs text-slate-400">
                            Nenhum relatório encontrado para os filtros informados.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setFiltroNumeroRO('');
                              setFiltroDataRO('');
                            }}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Limpar filtros de busca
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    ocorrenciasFiltradas.map((oc) => (
                      <tr key={oc.id || oc.numeroRO} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 inline-block">
                            {oc.numeroRO}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                          <span>{formatarDataBr(oc.data)}</span>
                          <span className="text-slate-400 text-[10px] ml-1">{oc.hora}</span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-300 min-w-0" title={oc.local || `${oc.predio} - ${oc.area}`}>
                          <div className="font-bold text-white text-[11px] truncate max-w-[130px]">{oc.predio || (oc.local ? oc.local.split(' - ')[0] : 'Site')}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{oc.area || (oc.local && oc.local.includes(' - ') ? oc.local.split(' - ')[1] : '')}</div>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-100 min-w-0">
                          {oc.topico && (
                            <span className="inline-block text-[9px] font-bold text-blue-400 bg-blue-950/70 border border-blue-800/50 px-1.5 py-0.2 rounded mb-0.5 mr-1">
                              {oc.topico}
                            </span>
                          )}
                          <p className="truncate text-xs text-slate-200" title={oc.titulo}>{oc.titulo || '(Sem título)'}</p>
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          {(() => {
                            const grav = normalizarGravidade(oc.gravidade);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                grav === 'Crítica' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                grav === 'Alta' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                grav === 'Média' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {grav}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-2 px-1.5 text-center text-slate-400 font-mono text-xs">
                          {oc.envolvidos?.length || 0}
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 flex-nowrap">
                            {/* Botão Primário: Imprimir Formal */}
                            <button
                              type="button"
                              onClick={() => handleImprimirOcorrencia(oc)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer shrink-0"
                              title="Carregar layout executivo oficial deste RO e disparar impressão limpa"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Imprimir</span>
                            </button>

                            {/* Botão: Visualizar Modelo Formal */}
                            <button
                              type="button"
                              onClick={() => handleVisualizarFormal(oc)}
                              className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer shrink-0"
                              title="Exibir o modelo formal executivo deste RO na tela"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </button>

                            {/* Botão: Baixar PDF */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await salvarRelatorioOcorrenciaCompleto({
                                    formData: oc,
                                    envolvidos: oc.envolvidos || [],
                                    fotos: oc.fotos || [],
                                    responsaveis: oc.responsaveis || responsaveis
                                  });
                                  mostrarNotificacao(`PDF do ${oc.numeroRO} gerado com sucesso!`, 'success');
                                } catch (e) {
                                  alert('Erro ao gerar PDF: ' + e.message);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-[11px] font-medium border border-slate-700 transition-colors shrink-0"
                              title="Gerar e baixar arquivo PDF desta ocorrência"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>

                            {/* Botão: Carregar no Formulário de Edição */}
                            <button
                              type="button"
                              onClick={() => carregarOcorrenciaNoFormulario(oc)}
                              className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors shrink-0"
                              title="Abrir dados no formulário de edição"
                            >
                              <Edit3 className="w-3 h-3 text-amber-400" />
                              <span>Editar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-400">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Base sincronizada em <code className="text-slate-300 font-mono">ocorrencias.json</code> e <code className="text-slate-300 font-mono">ocorrencias.xlsx</code></span>
              </span>
              <button
                type="button"
                onClick={() => setHistoricoModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE ZOOM / PREVIEW DE FOTO AMPLIADA                  */}
      {/* ========================================================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm text-white">{previewImage.legenda}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 p-2">
              <img
                src={previewImage.url}
                alt={previewImage.legenda}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Arquivo: {previewImage.nomeArquivo}</span>
              <span>Tamanho: {previewImage.tamanho}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
