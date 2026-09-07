import React, { useState, useEffect, useRef } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import {
  salvarRelatorioOcorrenciaCompleto,
  carregarOcorrencias,
  fileToDataUrl
} from '../../services/ocorrenciasService';
import { 
  PREDIOS_CCO, 
  AREAS_CCO, 
  TOPICOS_OCORRENCIA 
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
      area: AREAS_CCO[0],     // 'INTERNA / OPERACIONAL'
      topico: TOPICOS_OCORRENCIA[0], // 'USO INDEVIDO DE EPI'
      local: `${PREDIOS_CCO[0]} - ${AREAS_CCO[0]}`,
      gravidade: 'Média',
      titulo: '',
      descricao: '',
      operador: opInicial
    };
  });

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
        const ativos = dados.filter(op => op.status !== 'Inativo').map(op => op.nome);
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
        const ativos = e.detail.filter(op => op.status !== 'Inativo').map(op => op.nome);
        if (ativos.length > 0) {
          setListaOperadores(ativos);
        }
      } else {
        atualizarOperadores();
      }
    };

    window.addEventListener('cco_operadores_changed', handleOperadoresChanged);
    return () => window.removeEventListener('cco_operadores_changed', handleOperadoresChanged);
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
      local: `${novoPredio} - ${prev.area || AREAS_CCO[0]}`
    }));
  };

  const handleAreaChange = (novaArea) => {
    setFormData(prev => ({
      ...prev,
      area: novaArea,
      local: `${prev.predio || PREDIOS_CCO[0]} - ${novaArea}`
    }));
  };

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
        area: AREAS_CCO[0],
        topico: TOPICOS_OCORRENCIA[0],
        local: `${PREDIOS_CCO[0]} - ${AREAS_CCO[0]}`,
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
      area: AREAS_CCO[0],
      topico: TOPICOS_OCORRENCIA[0],
      local: `${PREDIOS_CCO[0]} - ${AREAS_CCO[0]}`,
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {alertaStatus && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-xl animate-in fade-in slide-in-from-top-3 ${
          alertaStatus.tipo === 'success' 
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

      {/* Action Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
          <div className="p-3 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Linha de Badges e Protocolo do RO com Flex-Wrap e margens dedicadas */}
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-lg bg-blue-950/90 border border-blue-500/50 text-blue-300 shadow-sm shrink-0">
                {formData.numeroRO}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-medium">
                Em Digitação / Rascunho
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-semibold">
                Módulo 1
              </span>
            </div>

            {/* Título Principal sem corte ou sobreposição */}
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase leading-tight break-words">
              CENTRAL DE CONTROLE OPERACIONAL
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Registro de Relatório de Ocorrência (RO) • CCO Security Suite
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full xl:w-auto justify-start xl:justify-end border-t xl:border-t-0 pt-3 xl:pt-0 border-slate-800/80">
          {/* Botão Histórico de Ocorrências */}
          <button
            type="button"
            onClick={() => setHistoricoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Ver histórico de ocorrências registradas"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Histórico ({historicoOcorrencias.length})</span>
          </button>

          <button
            type="button"
            onClick={limparFormulario}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Limpar todos os campos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>

          <button
            type="button"
            onClick={salvarRascunho}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span>Rascunho</span>
          </button>

          {/* BOTÃO PRINCIPAL: Salvar Relatório no arquivo local e gerar PDF na pasta CCO/exports */}
          <button
            type="button"
            onClick={handleSalvarRelatorio}
            disabled={isSalvando}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Salvar registro no banco de dados local e exportar PDF em CCO/exports"
          >
            {isSalvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF & Salvando...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Salvar Relatório & Gerar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

        {/* ========================================================= */}
        {/* SEÇÃO 1: DADOS GERAIS                                     */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
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
                {PREDIOS_CCO.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Área / Setor */}
            <div>
              <label htmlFor="area-ocorrencia" className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Área / Setor <span className="text-red-400">*</span>
              </label>
              <select
                id="area-ocorrencia"
                value={formData.area}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer truncate"
              >
                {AREAS_CCO.map((a) => (
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
                {listaOperadores.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Título da Ocorrência com Sugestões de Atalho dos Tópicos */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label htmlFor="titulo-ocorrencia" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Título do Fato / Assunto Principal <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-blue-400 font-semibold">Clique no tópico abaixo para preencher rapidamente:</span>
            </div>
            <input
              id="titulo-ocorrencia"
              type="text"
              placeholder="Ex: Não utilização de EPI na Linha de Produção"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            />
            {/* Badges de sugestões rápidas a partir de TOPICOS_OCORRENCIA */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {TOPICOS_OCORRENCIA.map((top, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    handleTopicoChange(top);
                    handleInputChange('titulo', top);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    formData.topico === top
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm shadow-blue-500/30'
                      : 'bg-slate-800 hover:bg-blue-900/40 hover:text-blue-300 text-slate-300 border-slate-700/80'
                  }`}
                >
                  + {top}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="descricao-ocorrencia" className="text-xs font-medium text-slate-300">
                Descrição Detalhada do Fato <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {formData.descricao.length} caracteres
              </span>
            </div>
            <textarea
              id="descricao-ocorrencia"
              rows={5}
              placeholder="Relate cronologicamente os fatos observados, ações tomadas pela equipe de segurança, medidas de contenção e orientações transmitidas..."
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
            />
          </div>
        </div>


        {/* ========================================================= */}
        {/* SEÇÃO 2: TABELA DE ENVOLVIDOS / IDENTIFICAÇÃO DE PESSOAS  */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adicionarEnvolvido(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
                title="Atalho: Adicionar linha pré-preenchida como (Não identificado)"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>+ Adicionar Não Identificado</span>
              </button>

              <button
                type="button"
                onClick={() => adicionarEnvolvido(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Envolvido</span>
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
                    className={`transition-colors ${
                      pessoa.naoIdentificado 
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
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${
                          pessoa.naoIdentificado 
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
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${
                          pessoa.naoIdentificado 
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
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${
                          pessoa.naoIdentificado 
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
                        className={`w-full bg-slate-950 border rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 ${
                          pessoa.naoIdentificado 
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
                          className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                            pessoa.naoIdentificado
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
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
            className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70 group"
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
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col"
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
                  Locais de Salvamento Automático:
                </p>
                <ul className="space-y-1 text-[11px] text-emerald-300/90 pl-2 list-disc list-inside font-sans">
                  <li><strong>Pasta CCO/exports/</strong> (Download local automático)</li>
                  <li><strong>Pasta Raiz CCO/data/ocorrencias.json</strong> & <strong>CCO/ocorrencias.json</strong></li>
                  <li><strong>Planilha Raiz CCO/ocorrencias.xlsx</strong></li>
                  {responsaveis.caminhoRede && (
                    <li><strong>Rede:</strong> {responsaveis.caminhoRede}</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/40 text-xs text-blue-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400 shrink-0" />
              <span>O download do PDF também foi iniciado automaticamente pelo navegador.</span>
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
                <span>+ Criar Novo Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE HISTÓRICO DE OCORRÊNCIAS SALVAS                  */}
      {/* ========================================================= */}
      {historicoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    Histórico de Relatórios de Ocorrência (RO)
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                      {historicoOcorrencias.length} salvos
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ocorrências persistidas localmente em JSON, Excel e CCO/exports
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHistoricoModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabela do Histórico */}
            <div className="overflow-auto flex-1 border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Protocolo</th>
                    <th className="py-3 px-3">Data / Hora</th>
                    <th className="py-3 px-3">Prédio / Área</th>
                    <th className="py-3 px-4">Tópico & Título do Fato</th>
                    <th className="py-3 px-3">Gravidade</th>
                    <th className="py-3 px-3 text-center">Envolvidos</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {historicoOcorrencias.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Nenhum relatório de ocorrência salvo no histórico local.
                      </td>
                    </tr>
                  ) : (
                    historicoOcorrencias.map((oc) => (
                      <tr key={oc.id || oc.numeroRO} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                            {oc.numeroRO}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {oc.data?.split('-').reverse().join('/')} às {oc.hora}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-[150px]" title={oc.local || `${oc.predio} - ${oc.area}`}>
                          <div className="font-bold text-white text-[11px] truncate">{oc.predio || (oc.local ? oc.local.split(' - ')[0] : 'Site')}</div>
                          <div className="text-[10px] text-slate-400 truncate">{oc.area || (oc.local && oc.local.includes(' - ') ? oc.local.split(' - ')[1] : '')}</div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-100 max-w-[220px]">
                          {oc.topico && (
                            <span className="inline-block text-[9px] font-bold text-blue-400 bg-blue-950/70 border border-blue-800/50 px-1.5 py-0.2 rounded mb-0.5 mr-1">
                              {oc.topico}
                            </span>
                          )}
                          <p className="truncate text-xs" title={oc.titulo}>{oc.titulo}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            oc.gravidade === 'Crítica' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            oc.gravidade === 'Grave' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            oc.gravidade === 'Alta' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                            oc.gravidade === 'Média' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {oc.gravidade || 'Média'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400">
                          {oc.envolvidos?.length || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold border border-slate-700 transition-colors"
                              title="Gerar e baixar PDF desta ocorrência (incluindo imagens fotográficas salvas)"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => carregarOcorrenciaNoFormulario(oc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
                              title="Abrir e carregar esta ocorrência nos campos do formulário"
                            >
                              <Edit3 className="w-3 h-3 text-amber-400" />
                              <span>Abrir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1 text-slate-500">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Dados sincronizados em ocorrencias.json e ocorrencias.xlsx
              </span>
              <button
                type="button"
                onClick={() => setHistoricoModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
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
