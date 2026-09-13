import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  User, 
  Building, 
  Briefcase, 
  Clock, 
  Calendar, 
  Shield, 
  Check, 
  Search, 
  Car, 
  Phone, 
  FileText,
  BadgeAlert,
  HelpCircle,
  Users
} from 'lucide-react';

import { 
  carregarObservacoes, 
  obterNomesObservacoesAtivas 
} from '../../services/observacoesService';
import { 
  carregarVigilantes, 
  obterNomesVigilantesAtivos 
} from '../../services/vigilantesService';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import { salvarPessoaUnificada } from '../../services/baseUnificadaService';

const MOTIVOS_INICIAIS = [
  'REUNIÃO',
  'PRESTAÇÃO DE SERVIÇO',
  'ENTREGA DE MERCADORIA / CARGA',
  'MANUTENÇÃO PREDIAL / INDUSTRIAL',
  'VISITA TÉCNICA',
  'AUDITORIA / FISCALIZAÇÃO',
  'ENTREVISTA / PROCESSO SELETIVO',
  'PARTICULAR / FAMILIAR'
];

export default function NovoVisitanteModal({
  isOpen,
  onClose,
  onSalvar,
  cartoesOcupados = []
}) {
  const [portaria, setPortaria] = useState('P1');
  const [numeroCartao, setNumeroCartao] = useState('');

  // Dados do Visitante
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [documento, setDocumento] = useState('');
  const [empresaVisitante, setEmpresaVisitante] = useState('');
  const [placaVeiculo, setPlacaVeiculo] = useState('');

  // DIFERENCIAL OBRIGATÓRIO: Anfitrião (Solicitante da Visita)
  const [anfitriaoNome, setAnfitriaoNome] = useState('');
  const [anfitriaoSetor, setAnfitriaoSetor] = useState('');
  const [anfitriaoRamal, setAnfitriaoRamal] = useState('');

  // Motivo & Observações Dinâmicas
  const [listaMotivos, setListaMotivos] = useState(() => {
    const ativas = obterNomesObservacoesAtivas();
    return Array.from(new Set([...MOTIVOS_INICIAIS, ...ativas]));
  });
  const [motivo, setMotivo] = useState('REUNIÃO');
  const [motivoOutros, setMotivoOutros] = useState('');

  // Vigilantes de Posto (Campo) Dinâmicos
  const [listaVigilantes, setListaVigilantes] = useState(() => {
    const ativas = obterNomesVigilantesAtivos();
    return ativas.length > 0 ? ativas : ['Vigilante Portaria 1', 'Vigilante Portaria 2', 'Vigilante Ronda'];
  });
  const [vigilante, setVigilante] = useState(() => {
    const ativas = obterNomesVigilantesAtivos();
    return ativas[0] || 'Vigilante Portaria 1';
  });
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [horaEntrada, setHoraEntrada] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));

  // Atualiza data, hora, observações e vigilantes dinâmicos
  useEffect(() => {
    const atualizar = async () => {
      try {
        const dados = await carregarObservacoes();
        const lista = Array.isArray(dados) ? dados : [];
        const ativas = lista.filter(o => o && o.status !== 'Inativo').map(o => o.nome);
        setListaMotivos(Array.from(new Set([...MOTIVOS_INICIAIS, ...ativas])));
      } catch (e) {}
    };

    const atualizarVigs = async () => {
      try {
        const vigDados = await carregarVigilantes();
        const listaVigs = Array.isArray(vigDados) ? vigDados : [];
        const ativas = listaVigs.filter(v => v && v.status !== 'Inativo').map(v => v.nome);
        if (ativas.length > 0) {
          setListaVigilantes(ativas);
          setVigilante(prev => (ativas.includes(prev) ? prev : ativas[0]));
        }
      } catch (e) {}
    };

    atualizar();
    atualizarVigs();

    const handleObs = () => atualizar();
    const handleVigs = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const ativas = e.detail.filter(v => v && v.status !== 'Inativo').map(v => v.nome);
        if (ativas.length > 0) {
          setListaVigilantes(ativas);
          setVigilante(prev => (ativas.includes(prev) ? prev : ativas[0]));
        }
      } else {
        atualizarVigs();
      }
    };

    window.addEventListener('cco_observacoes_changed', handleObs);
    window.addEventListener('cco_vigilantes_changed', handleVigs);
    return () => {
      window.removeEventListener('cco_observacoes_changed', handleObs);
      window.removeEventListener('cco_vigilantes_changed', handleVigs);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const agora = new Date();
      setDataEntrada(agora.toISOString().split('T')[0]);
      setHoraEntrada(agora.toTimeString().split(' ')[0].substring(0, 5));
    }
  }, [isOpen]);

  // Se trocar a portaria, limpa o cartão selecionado
  useEffect(() => {
    setNumeroCartao('');
  }, [portaria]);

  if (!isOpen) return null;

  // Cartões disponíveis: P1 (01-20) | P2 (21-40)
  const cartoesDisponiveis = (portaria === 'P1'
    ? Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0'))
    : Array.from({ length: 20 }, (_, i) => String(i + 21).padStart(2, '0'))
  ).map(num => {
    const fullId = `VIS-${num}/${portaria}`;
    const ocupado = cartoesOcupados.some(c => c.cartao === fullId || c.cartao === `${num}/${portaria}`);
    return { numero: num, fullId, ocupado };
  });



  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numeroCartao) {
      alert('Selecione o número da credencial de visitante.');
      return;
    }
    if (!nomeVisitante.trim()) {
      alert('Informe o nome completo do visitante.');
      return;
    }
    if (!documento.trim()) {
      alert('Informe o documento (RG ou CPF) do visitante.');
      return;
    }
    if (!anfitriaoNome.trim()) {
      alert('O campo "Anfitrião (Solicitante)" é obrigatório! Informe qual colaborador interno autorizou a entrada.');
      return;
    }

    const motivoFinal = motivo === 'OUTROS' ? motivoOutros : motivo;

    const novoVisitante = {
      id: Date.now(),
      cartao: `VIS-${numeroCartao}/${portaria}`,
      portaria,
      visitante: nomeVisitante.trim().toUpperCase(),
      documento: documento.trim(),
      empresa: empresaVisitante.trim().toUpperCase() || 'VISITA PARTICULAR',
      placaVeiculo: placaVeiculo.trim().toUpperCase() || 'N/A',
      // Campo Obrigatório
      anfitriao: anfitriaoNome.trim().toUpperCase(),
      anfitriaoSetor: anfitriaoSetor.trim().toUpperCase() || 'GERAL',
      anfitriaoRamal: anfitriaoRamal.trim() || 'N/A',
      motivo: motivoFinal,
      dataEntrada,
      horaEntrada,
      dataSaida: null,
      horaSaida: null,
      tempoPermanencia: null,
      situacao: 'NÃO DEVOLVIDO',
      vigilanteEntrada: vigilante,
      vigilanteSaida: null
    };

    salvarPessoaUnificada({
      nome: nomeVisitante.trim(),
      empresa: empresaVisitante.trim(),
      documento: documento.trim(),
      placaVeiculo: placaVeiculo.trim()
    });

    if (anfitriaoNome && anfitriaoNome.trim()) {
      salvarPessoaUnificada({
        nome: anfitriaoNome.trim(),
        cargo: anfitriaoSetor.trim() || 'COLABORADOR',
        empresa: 'INTERNO'
      });
    }

    onSalvar(novoVisitante);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Liberação de Credencial para Visitante
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Módulo 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cadastro obrigatório do Anfitrião solicitante e controle de tempo de permanência
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
          {/* 1. SELEÇÃO DE PORTARIA E CREDENCIAL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Portaria & Credencial de Visitante <span className="text-red-400">*</span>
              </label>
              {/* Portaria Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortaria('P1')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    portaria === 'P1'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portaria 1 (01 a 20)
                </button>
                <button
                  type="button"
                  onClick={() => setPortaria('P2')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    portaria === 'P2'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portaria 2 (21 a 40)
                </button>
              </div>
            </div>

            {/* Cartões Grid Selector */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto pr-1">
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
                          ? 'bg-emerald-600 border-emerald-400 text-white font-bold ring-2 ring-emerald-500/40'
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
                <Check className="w-3.5 h-3.5" /> Cartão selecionado: <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">VIS-{numeroCartao}/{portaria}</span>
              </p>
            )}
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 2. DADOS DO VISITANTE */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Dados do Visitante <span className="text-red-400">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <AutocompleteInput
                  tipo="pessoa"
                  label="Nome Completo do Visitante"
                  required
                  placeholder="Nome do visitante (busca global)..."
                  value={nomeVisitante}
                  onChange={(val) => setNomeVisitante(val)}
                  onSelect={(pessoa) => {
                    setNomeVisitante(pessoa.nome);
                    if (pessoa.documento) setDocumento(pessoa.documento);
                    if (pessoa.empresa && pessoa.empresa !== 'VISITA PARTICULAR' && pessoa.empresa !== 'ESTOQUE CCO') {
                      setEmpresaVisitante(pessoa.empresa);
                    }
                    if (pessoa.placaVeiculo && pessoa.placaVeiculo !== 'N/A') {
                      setPlacaVeiculo(pessoa.placaVeiculo);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Documento de Identidade (RG ou CPF) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nº do RG ou CPF do visitante..."
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <AutocompleteInput
                  tipo="empresa"
                  label="Empresa / Origem do Visitante"
                  placeholder="Ex: Prestador XYZ, Visita Particular..."
                  value={empresaVisitante}
                  onChange={(val) => setEmpresaVisitante(val)}
                  onSelect={(emp) => setEmpresaVisitante(typeof emp === 'string' ? emp : emp.empresa || emp)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Car className="w-3 h-3 text-slate-400" />
                  Placa do Veículo (se houver)
                </label>
                <input
                  type="text"
                  placeholder="Ex: ABC-1234 ou ABC1D23"
                  value={placaVeiculo}
                  onChange={(e) => setPlacaVeiculo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 3. CAMPO OBRIGATÓRIO: ANFITRIÃO (SOLICITANTE INTERNO) */}
          <div className="bg-emerald-950/20 border-2 border-emerald-500/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  3. Anfitrião (Solicitante da Visita) • Obrigatório
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
                Colaborador Interno Responsável
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Informe o nome e setor do colaborador interno da empresa que autorizou e solicitou a credencial para o visitante.
            </p>

            <div>
              <AutocompleteInput
                tipo="pessoa"
                label="Nome do Anfitrião (Colaborador que autorizou)"
                required
                placeholder="Digite o nome do anfitrião (busca global na suíte)..."
                value={anfitriaoNome}
                onChange={(val) => setAnfitriaoNome(val)}
                onSelect={(colab) => {
                  setAnfitriaoNome(colab.nome);
                  if (colab.cargo) {
                    setAnfitriaoSetor(colab.cargo);
                  } else if (colab.empresa && colab.empresa !== 'INTERNO' && colab.empresa !== 'VISITANTES') {
                    setAnfitriaoSetor(colab.empresa);
                  }
                }}
                icon={Users}
                inputClassName="border-emerald-500/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Área / Setor do Anfitrião
                </label>
                <input
                  type="text"
                  placeholder="Ex: Operações, RH, Gerência, Manutenção"
                  value={anfitriaoSetor}
                  onChange={(e) => setAnfitriaoSetor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Ramal / Contato Interno
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ramal 2045 ou (11) 9..."
                  value={anfitriaoRamal}
                  onChange={(e) => setAnfitriaoRamal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 4. MOTIVO DA VISITA & OBSERVAÇÕES */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              4. Motivo do Acesso <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {listaMotivos.map((mot, i) => (
                    <option key={i} value={mot}>{mot}</option>
                  ))}
                </select>
              </div>

              {motivo === 'OUTROS' && (
                <div className="animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Especifique o motivo da visita..."
                    value={motivoOutros}
                    onChange={(e) => setMotivoOutros(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 5. VIGILANTE OPERACIONAL & TIMESTAMPS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Vigilante que Liberou Entrada
              </label>
              <select
                value={vigilante}
                onChange={(e) => setVigilante(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {listaVigilantes.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Data de Entrada
              </label>
              <input
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Hora de Entrada
              </label>
              <input
                type="time"
                step="1"
                value={horaEntrada}
                onChange={(e) => setHoraEntrada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-300"
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Liberação de Visitante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
