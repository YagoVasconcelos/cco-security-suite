import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  User, 
  Building2, 
  BadgeCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Calendar, 
  Shield, 
  Check, 
  Search,
  FileText,
  History,
  AlertCircle
} from 'lucide-react';
import { verificarRegraTresAcessos, formatarDataBr } from '../../services/provisoriosService';

const VIGILANTES_PADRAO = [
  'Vigilante Portaria 1',
  'Vigilante Portaria 2',
  'Vigilante Ronda',
  'Operador CCO'
];

import { 
  carregarObservacoes, 
  obterNomesObservacoesAtivas 
} from '../../services/observacoesService';

export default function NovaSaidaModal({ 
  isOpen, 
  onClose, 
  onSalvar, 
  cartoesOcupados = [],
  registrosExistentes = [] 
}) {
  const [portaria, setPortaria] = useState('P1');
  const [numeroCartao, setNumeroCartao] = useState('');
  
  // Colaborador
  const [buscaNome, setBuscaNome] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [empresa, setEmpresa] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cargo, setCargo] = useState('');

  // Observações Dinâmicas
  const [listaObservacoes, setListaObservacoes] = useState(() => obterNomesObservacoesAtivas());
  const [observacao, setObservacao] = useState(() => {
    const ativas = obterNomesObservacoesAtivas();
    return ativas[0] || 'ESQUECEU';
  });
  const [observacaoOutros, setObservacaoOutros] = useState('');

  useEffect(() => {
    const atualizarObs = async () => {
      try {
        const dados = await carregarObservacoes();
        const ativas = dados.filter(o => o.status !== 'Inativo').map(o => o.nome);
        if (ativas.length > 0) {
          setListaObservacoes(ativas);
          if (!ativas.includes(observacao)) {
            setObservacao(ativas[0]);
          }
        }
      } catch (e) {}
    };

    atualizarObs();

    const handleObsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativas = e.detail.filter(o => o.status !== 'Inativo').map(o => o.nome);
        if (ativas.length > 0) {
          setListaObservacoes(ativas);
          if (!ativas.includes(observacao)) {
            setObservacao(ativas[0]);
          }
        }
      } else {
        atualizarObs();
      }
    };

    window.addEventListener('cco_observacoes_changed', handleObsChanged);
    return () => window.removeEventListener('cco_observacoes_changed', handleObsChanged);
  }, [observacao]);

  // Justificativa para reincidência (> 3 retiradas)
  const [justificativaReincidencia, setJustificativaReincidencia] = useState('');

  // Vigilante
  const [vigilante, setVigilante] = useState(VIGILANTES_PADRAO[0]);

  // Timestamps automáticos (Data e Hora em tempo real)
  const [dataRetirada, setDataRetirada] = useState(new Date().toISOString().split('T')[0]);
  const [horaRetirada, setHoraRetirada] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));

  // Validação dinâmica da Regra dos 3 Acessos
  const validacaoRegra = verificarRegraTresAcessos(registrosExistentes, buscaNome, dataRetirada);
  const isReincidente = validacaoRegra.ultrapassouLimite;

  // Atualiza data e hora automática ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      const agora = new Date();
      setDataRetirada(agora.toISOString().split('T')[0]);
      setHoraRetirada(agora.toTimeString().split(' ')[0].substring(0, 5));
    }
  }, [isOpen]);

  // Cartões disponíveis para a portaria selecionada
  const cartoesDisponiveis = (portaria === 'P1'
    ? Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'))
    : Array.from({ length: 10 }, (_, i) => String(i + 11).padStart(2, '0'))
  ).map(num => {
    const fullId = `${num}/${portaria}`;
    const ocupado = cartoesOcupados.some(c => c.cartao === fullId);
    return { numero: num, fullId, ocupado };
  });

  // Autocomplete inteligente extraindo colaboradores da base histórica
  const handleNomeChange = (val) => {
    setBuscaNome(val);
    if (val.trim().length >= 2) {
      // Extrai colaboradores únicos dos registros existentes
      const mapaColab = new Map();
      registrosExistentes.forEach(r => {
        const nomeChave = r.colaborador.toUpperCase().trim();
        if (nomeChave.includes(val.toUpperCase().trim()) && !mapaColab.has(nomeChave)) {
          const valRegra = verificarRegraTresAcessos(registrosExistentes, r.colaborador, dataRetirada);
          mapaColab.set(nomeChave, {
            nome: r.colaborador,
            empresa: r.empresa,
            matricula: r.matricula,
            cargo: r.cargo,
            retiradasMes: valRegra.totalAcessosMes
          });
        }
      });
      setSugestoes(Array.from(mapaColab.values()).slice(0, 6));
    } else {
      setSugestoes([]);
    }
  };

  const selecionarColaborador = (colab) => {
    setBuscaNome(colab.nome);
    setEmpresa(colab.empresa);
    setMatricula(colab.matricula);
    setCargo(colab.cargo);
    setSugestoes([]);
  };

  // Se mudar a portaria, limpa o cartão se ele não for compatível
  useEffect(() => {
    setNumeroCartao('');
  }, [portaria]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numeroCartao) {
      alert('Selecione o número do cartão provisório disponível.');
      return;
    }
    if (!buscaNome.trim()) {
      alert('Informe o nome do colaborador.');
      return;
    }
    if (isReincidente && !justificativaReincidencia.trim()) {
      alert('⚠️ ATENÇÃO: A REGRA DOS 3 ACESSOS FOI EXCEDIDA!\n\nEste colaborador já atingiu ' + validacaoRegra.totalAcessosMes + ' retiradas no mês. É obrigatório registrar a justificativa formal para liberação.');
      return;
    }

    const obsFinal = observacao === 'OUTROS' ? observacaoOutros : observacao;

    const dadosRegistro = {
      cartao: `${numeroCartao}/${portaria}`,
      portaria,
      colaborador: buscaNome,
      empresa,
      matricula,
      cargo,
      dataRetirada,
      horaRetirada,
      observacao: obsFinal,
      vigilante,
      justificativa: isReincidente ? justificativaReincidencia : null
    };

    onSalvar(dadosRegistro);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Registrar Saída de Credencial Provisória
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  Timestamp Ativo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Registro automático de horário e verificação imediata da regra dos 3 acessos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* 1. SELEÇÃO DE PORTARIA E CARTÃO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Portaria & Cartão Físico <span className="text-red-400">*</span>
              </label>
              {/* Portaria Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortaria('P1')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    portaria === 'P1'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portaria 1 (01 a 10)
                </button>
                <button
                  type="button"
                  onClick={() => setPortaria('P2')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    portaria === 'P2'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portaria 2 (11 a 20)
                </button>
              </div>
            </div>

            {/* Cartões Grid Selector */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {cartoesDisponiveis.map(({ numero, fullId, ocupado }) => {
                const isSelected = numeroCartao === numero;
                return (
                  <button
                    key={fullId}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setNumeroCartao(numero)}
                    className={`py-2 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      ocupado 
                        ? 'bg-red-950/30 border-red-900/50 text-red-400 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'bg-amber-600 border-amber-400 text-white font-bold ring-2 ring-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-850'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">{numero}</span>
                    <span className="text-[9px] uppercase font-semibold opacity-75">{portaria}</span>
                  </button>
                );
              })}
            </div>
            {numeroCartao && (
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Cartão selecionado: <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{numeroCartao}/{portaria}</span>
              </p>
            )}
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 2. DADOS DO COLABORADOR COM AUTOCOMPLETE & REGRA DOS 3 ACESSOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                2. Identificação do Colaborador <span className="text-red-400">*</span>
              </label>
              {buscaNome.trim().length >= 2 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isReincidente 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {validacaoRegra.totalAcessosMes} acessos no mês {dataRetirada.substring(0, 7)}
                </span>
              )}
            </div>

            {/* Input Nome com Autocomplete Dropdown */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite o nome completo do colaborador..."
                  value={buscaNome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium ${
                    isReincidente 
                      ? 'border-red-500/80 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>

              {/* Suggestions dropdown */}
              {sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800">
                  <div className="px-3 py-1.5 bg-slate-950 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Colaboradores Encontrados (Clique para autocompletar)
                  </div>
                  {sugestoes.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selecionarColaborador(item)}
                      className="w-full text-left p-3 hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                          {item.nome}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.empresa} • Matrícula: {item.matricula}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        item.retiradasMes >= 3 
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {item.retiradasMes} retiradas no mês
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campos complementares */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Empresa do Colaborador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Prestador, Fornecedor..."
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nº Matrícula
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12345"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Função / Cargo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Operador Logístico"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* ALERTA CRÍTICO: REGRA DOS 3 ACESSOS EXCEDIDA */}
            {isReincidente && (
              <div className="bg-red-950/50 border-2 border-red-500 rounded-xl p-4 text-xs space-y-3 animate-in fade-in shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-600/30 border border-red-500/50 rounded-lg text-red-400 shrink-0">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-red-300 uppercase tracking-wide">
                        ALERTA: LIMITE DE 3 ACESSOS NO MÊS EXCEDIDO!
                      </span>
                      <span className="px-2 py-0.5 bg-red-600 text-white font-black rounded text-[10px]">
                        {validacaoRegra.proximoAcessoNumero}ª RETIRADA NO MÊS
                      </span>
                    </div>
                    <p className="text-red-200/90 mt-1 leading-relaxed">
                      O colaborador <strong>{buscaNome}</strong> já realizou <strong>{validacaoRegra.totalAcessosMes} retiradas de credenciais provisórias</strong> neste mês ({dataRetirada.substring(0, 7)}). 
                      Conforme norma do CCO, novas liberações exigem justificativa formal do posto.
                    </p>
                  </div>
                </div>

                {/* Histórico das retiradas anteriores no mês */}
                {validacaoRegra.historicoMes.length > 0 && (
                  <div className="bg-slate-950/80 border border-red-900/60 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-red-300 font-semibold text-[11px]">
                      <History className="w-3.5 h-3.5" />
                      <span>Retiradas Anteriores no Mês:</span>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {validacaoRegra.historicoMes.map((h, i) => (
                        <div key={i} className="py-1 flex items-center justify-between text-[11px] text-slate-300">
                          <span>
                            #{i+1} • {formatarDataBr(h.dataRetirada)} às {h.horaRetirada} ({h.cartao})
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Motivo: {h.observacao}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-red-300 mb-1">
                    Justificativa Obrigatória da Liberação Excepcional <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descreva o motivo da liberação extraordinária (ex: Autorizado por Coordenação / Aguardando confecção de crachá definitivo)..."
                    value={justificativaReincidencia}
                    onChange={(e) => setJustificativaReincidencia(e.target.value)}
                    className="w-full bg-slate-950 border border-red-500/60 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-400"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 3. OBSERVAÇÕES PADRÃO & MOTIVO */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Motivo da Retirada (Observação Padrão) <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {listaObservacoes.map((obs, i) => (
                    <option key={i} value={obs}>{obs}</option>
                  ))}
                </select>
              </div>

              {/* Campo para OUTROS */}
              {observacao === 'OUTROS' && (
                <div className="animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Especifique o motivo da retirada..."
                    value={observacaoOutros}
                    onChange={(e) => setObservacaoOutros(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 4. VIGILANTE OPERACIONAL & TIMESTAMPS AUTOMÁTICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Vigilante que Entregou
              </label>
              <select
                value={vigilante}
                onChange={(e) => setVigilante(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {VIGILANTES_PADRAO.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>Data de Retirada</span>
                <span className="text-[10px] text-emerald-400 font-mono">Automático</span>
              </label>
              <input
                type="date"
                value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>Hora de Retirada</span>
                <span className="text-[10px] text-emerald-400 font-mono">Automático</span>
              </label>
              <input
                type="time"
                step="1"
                value={horaRetirada}
                onChange={(e) => setHoraRetirada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-300"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Registro de Saída</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
