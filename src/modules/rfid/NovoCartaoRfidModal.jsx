import React, { useState, useEffect } from 'react';
import { 
  X, 
  Radio, 
  CreditCard, 
  User, 
  Building, 
  Calendar, 
  Hash, 
  KeyRound, 
  Check, 
  HelpCircle, 
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import { salvarPessoaUnificada } from '../../services/baseUnificadaService';

export default function NovoCartaoRfidModal({ isOpen, onClose, onSalvar, rfidExistentes = [] }) {
  const [tipoCartao, setTipoCartao] = useState('FIXO'); // 'FIXO' ou 'ROTATIVO'
  
  // Campos obrigatórios da especificação
  const [codigoRfid, setCodigoRfid] = useState('');
  const [codigoImpresso, setCodigoImpresso] = useState('');
  const [nomeColaborador, setNomeColaborador] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [dataLiberacao, setDataLiberacao] = useState(new Date().toISOString().split('T')[0]);
  
  // Campos complementares para rotativo / status
  const [numeroRotativo, setNumeroRotativo] = useState('');
  const [status, setStatus] = useState('ATIVO');
  const [observacoes, setObservacoes] = useState('');

  // Limpa campos ao abrir
  useEffect(() => {
    if (isOpen) {
      setCodigoRfid('');
      setCodigoImpresso('');
      setNomeColaborador('');
      setEmpresa('');
      setDataLiberacao(new Date().toISOString().split('T')[0]);
      setNumeroRotativo('');
      setStatus('ATIVO');
      setObservacoes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validação do código RFID (6 a 10 dígitos)
  const isRfidValido = codigoRfid.trim().length >= 6 && codigoRfid.trim().length <= 10;
  // Validação do código impresso (5 dígitos)
  const isImpressoValido = codigoImpresso.trim().length === 5;
  // Unicidade do RFID
  const isRfidDuplicado = rfidExistentes.some(r => r.codigoRfid.toUpperCase() === codigoRfid.trim().toUpperCase());

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!codigoRfid.trim()) {
      alert('Informe o Código RFID do cartão (Chave Primária).');
      return;
    }
    if (!isRfidValido) {
      alert('O Código RFID deve conter entre 6 e 10 dígitos alfa-numéricos.');
      return;
    }
    if (isRfidDuplicado) {
      alert(`O Código RFID "${codigoRfid}" já está cadastrado no inventário! O código RFID deve ser único.`);
      return;
    }
    if (!isImpressoValido) {
      alert('O Código Impresso no verso deve conter exatamente 5 dígitos numéricos.');
      return;
    }
    let rotativoIdxNum = null;
    if (tipoCartao === 'ROTATIVO') {
      if (numeroRotativo !== '') {
        const n = parseInt(numeroRotativo, 10);
        if (isNaN(n) || n < 0 || n > 350) {
          alert('O número do cartão de Serviços deve estar entre 0 e 350.');
          return;
        }
        rotativoIdxNum = n;
      }
    }

    const temColaborador = Boolean(nomeColaborador && nomeColaborador.trim());

    if (temColaborador) {
      salvarPessoaUnificada({
        nome: nomeColaborador.trim(),
        empresa: empresa.trim()
      });
    }

    // Se não informou colaborador, o status deve ser DISPONIVEL (Estoque)
    let statusFinal = status;
    if (!temColaborador) {
      statusFinal = 'DISPONIVEL';
    }

    const novoCartao = {
      codigoRfid: codigoRfid.trim().toUpperCase(),
      codigoImpresso: codigoImpresso.trim(),
      tipo: tipoCartao,
      numeroRotativoIdx: rotativoIdxNum,
      numeroRotativo: tipoCartao === 'ROTATIVO' ? (rotativoIdxNum !== null ? `Serviços ${String(rotativoIdxNum).padStart(2, '0')}` : 'Serviços') : null,
      colaborador: temColaborador ? nomeColaborador.trim().toUpperCase() : (tipoCartao === 'ROTATIVO' ? 'DISPONÍVEL NO ESTOQUE' : 'ESTOQUE / A VINCULAR'),
      empresa: temColaborador && empresa.trim() ? empresa.trim().toUpperCase() : 'ESTOQUE CCO',
      dataLiberacao: temColaborador ? (dataLiberacao || new Date().toISOString().split('T')[0]) : '',
      status: statusFinal,
      observacoes: observacoes.trim() || 'Cadastrado no inventário CCO'
    };

    onSalvar(novoCartao);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Cadastrar Nova Credencial RFID
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  Módulo 4
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Chave Primária de 6 a 10 dígitos e código de verso de 5 dígitos
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
          {/* 1. SELEÇÃO DO TIPO DE CARTÃO (FIXO VS ROTATIVO) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Tipo de Credencial <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Opção Fixo */}
              <button
                type="button"
                onClick={() => {
                  setTipoCartao('FIXO');
                  setStatus('ATIVO');
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  tipoCartao === 'FIXO'
                    ? 'bg-blue-600/15 border-blue-500/70 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className={`w-5 h-5 shrink-0 mt-0.5 ${tipoCartao === 'FIXO' ? 'text-blue-400' : 'text-slate-500'}`} />
                <div>
                  <p className="font-bold text-xs text-slate-100">Cartão Fixo Nominal</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vinculado permanentemente a um colaborador da empresa.
                  </p>
                </div>
              </button>

              {/* Opção Rotativo / Serviços */}
              <button
                type="button"
                onClick={() => {
                  setTipoCartao('ROTATIVO');
                  setStatus('DISPONIVEL');
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  tipoCartao === 'ROTATIVO'
                    ? 'bg-indigo-600/15 border-indigo-500/70 text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Layers className={`w-5 h-5 shrink-0 mt-0.5 ${tipoCartao === 'ROTATIVO' ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div>
                  <p className="font-bold text-xs text-slate-100">Cartão de Serviços (Rotativo)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Inventário de Serviços 01 a 350 para circulação e reutilização contínua.
                  </p>
                </div>
              </button>
            </div>

            {/* Se for rotativo, exibe campo do número 0 a 350 */}
            {tipoCartao === 'ROTATIVO' && (
              <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <label className="text-xs font-semibold text-indigo-300 block">
                    Número do Cartão de Serviços (0 a 350):
                  </label>
                  <span className="text-[11px] text-slate-400">Ex: 01, 02, 15, 350</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-300">Serviços</span>
                  <input
                    type="number"
                    min="0"
                    max="350"
                    placeholder="01"
                    value={numeroRotativo}
                    onChange={(e) => setNumeroRotativo(e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 2. CHAVES DO CARTÃO (RFID & IMPRESSO) */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Identificadores do Cartão RFID <span className="text-red-400">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Código RFID (6 a 10 dígitos) - Chave Primária */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    Código Interno RFID <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    6 a 10 dígitos ({codigoRfid.length})
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Ex: 2918406682 ou E6CEC73A"
                  value={codigoRfid}
                  onChange={(e) => setCodigoRfid(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none uppercase ${
                    codigoRfid && !isRfidValido 
                      ? 'border-amber-500/80 text-amber-300' 
                      : isRfidDuplicado
                        ? 'border-red-500 text-red-300'
                        : 'border-slate-700 focus:border-indigo-500'
                  }`}
                  required
                />
                {isRfidDuplicado && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Este código RFID já existe no inventário.
                  </p>
                )}
                {codigoRfid && !isRfidValido && !isRfidDuplicado && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    O código deve possuir entre 6 e 10 dígitos.
                  </p>
                )}
              </div>

              {/* Código Impresso Verso (5 dígitos) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    Código Impresso Verso <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    5 dígitos ({codigoImpresso.length}/5)
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="Ex: 04821"
                  value={codigoImpresso}
                  onChange={(e) => setCodigoImpresso(e.target.value.replace(/\D/g, ''))}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none ${
                    codigoImpresso && !isImpressoValido
                      ? 'border-amber-500/80 text-amber-300'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                  required
                />
                {codigoImpresso && !isImpressoValido && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    Deve ter exatamente 5 dígitos numéricos.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 3. DADOS DE VÍNCULO & LIBERAÇÃO (TOTALMENTE OPCIONAIS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                3. Dados de Vínculo & Liberação
              </label>
              <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                Opcional - Inventário Inicial
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Você pode cadastrar e salvar cartões novos no inventário primeiro. O vínculo com colaborador ou empresa pode ser feito posteriormente se houver necessidade.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome do Colaborador com Autocomplete Inteligente */}
              <div className="sm:col-span-2">
                <AutocompleteInput
                  tipo="pessoa"
                  label="Nome Completo do Colaborador (Opcional)"
                  placeholder="Digite o nome (ou selecione da base global unificada)..."
                  value={nomeColaborador}
                  onChange={(val) => setNomeColaborador(val)}
                  onSelect={(pessoa) => {
                    setNomeColaborador(pessoa.nome);
                    if (pessoa.empresa && pessoa.empresa !== 'ESTOQUE CCO' && pessoa.empresa !== 'VISITA PARTICULAR') {
                      setEmpresa(pessoa.empresa);
                    }
                  }}
                />
              </div>

              {/* Empresa com Autocomplete Inteligente */}
              <div>
                <AutocompleteInput
                  tipo="empresa"
                  label="Empresa Vinculada (Opcional)"
                  placeholder="Ex: PRESTADOR, TERCEIRO, ESTOQUE CCO..."
                  value={empresa}
                  onChange={(val) => setEmpresa(val)}
                  onSelect={(emp) => setEmpresa(typeof emp === 'string' ? emp : emp.empresa || emp)}
                />
              </div>

              {/* Data de Liberação / Ativação */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Data de Liberação / Ativação <span className="text-slate-500">(Opcional)</span>
                </label>
                <input
                  type="date"
                  value={dataLiberacao}
                  onChange={(e) => setDataLiberacao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          {/* 4. SITUAÇÃO / CICLO DE VIDA DO CARTÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Status Inicial no Inventário
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="ATIVO">🟢 Ativo / Em Uso</option>
                <option value="DISPONIVEL">🔵 Disponível no Estoque</option>
                <option value="PERDIDO">🔴 Perdido / Extraviado (Cobrança)</option>
                <option value="PAGO">🟡 Pago / Ressarcido</option>
                <option value="BLOQUEADO">⚪ Bloqueado / Defeito</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Observações Operacionais
              </label>
              <input
                type="text"
                placeholder="Ex: Lote inicial 2026, 2ª via..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Credencial no Inventário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
