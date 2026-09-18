import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  CreditCard, 
  User, 
  Building2, 
  BadgeCheck, 
  Clock, 
  Calendar, 
  Shield, 
  Check, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import AutocompleteInput from '../../components/common/AutocompleteInput';

export default function EditarProvisorioModal({
  isOpen,
  registro,
  onClose,
  onSalvar,
  listaVigilantes = [],
  listaObservacoes = []
}) {
  const [form, setForm] = useState({
    cartao: '',
    portaria: 'P1',
    colaborador: '',
    empresa: '',
    matricula: '',
    cargo: '',
    dataRetirada: '',
    horaRetirada: '',
    dataDevolucao: '',
    horaDevolucao: '',
    situacao: 'NÃO DEVOLVIDO',
    observacao: 'ESQUECEU',
    justificativa: '',
    vigilante: '',
    vigilanteDevolucao: ''
  });

  useEffect(() => {
    if (registro) {
      setForm({
        cartao: registro.cartao || '',
        portaria: registro.portaria || 'P1',
        colaborador: registro.colaborador || '',
        empresa: registro.empresa || '',
        matricula: registro.matricula === 'N/A' ? '' : (registro.matricula || ''),
        cargo: registro.cargo === 'NÃO INFORMADO' ? '' : (registro.cargo || ''),
        dataRetirada: registro.dataRetirada || '',
        horaRetirada: registro.horaRetirada || '',
        dataDevolucao: registro.dataDevolucao || '',
        horaDevolucao: registro.horaDevolucao || '',
        situacao: registro.situacao || 'NÃO DEVOLVIDO',
        observacao: registro.observacao || 'ESQUECEU',
        justificativa: registro.justificativa || '',
        vigilante: registro.vigilante || (listaVigilantes[0] || 'Vigilante Portaria 1'),
        vigilanteDevolucao: registro.vigilanteDevolucao || (listaVigilantes[0] || 'Vigilante Portaria 1')
      });
    }
  }, [registro, listaVigilantes]);

  // Blindagem de lista de vigilantes: preserva valor mesmo se inativo ou ausente
  const opcoesVigilantes = useMemo(() => {
    const base = Array.isArray(listaVigilantes) ? [...listaVigilantes] : [];
    if (form.vigilante && !base.includes(form.vigilante)) {
      base.unshift(form.vigilante);
    }
    return base;
  }, [listaVigilantes, form.vigilante]);

  const opcoesVigilantesDevolucao = useMemo(() => {
    const base = Array.isArray(listaVigilantes) ? [...listaVigilantes] : [];
    if (form.vigilanteDevolucao && !base.includes(form.vigilanteDevolucao)) {
      base.unshift(form.vigilanteDevolucao);
    }
    return base;
  }, [listaVigilantes, form.vigilanteDevolucao]);

  if (!isOpen || !registro) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.colaborador || !form.colaborador.trim()) {
      alert('O nome do colaborador é obrigatório.');
      return;
    }

    const isDevolvido = form.situacao === 'DEVOLVIDO';
    const dataDevolucaoFinal = isDevolvido
      ? (form.dataDevolucao || form.dataRetirada || new Date().toISOString().split('T')[0])
      : null;
    const horaDevolucaoFinal = isDevolvido
      ? (form.horaDevolucao || form.horaRetirada || new Date().toTimeString().split(' ')[0].substring(0, 5))
      : null;
    const situacaoFinal = isDevolvido
      ? 'DEVOLVIDO'
      : (form.situacao === 'PERDIDO' ? 'PERDIDO' : (form.situacao === 'PAGO' ? 'PAGO' : 'NÃO DEVOLVIDO'));

    onSalvar({
      ...registro,
      cartao: form.cartao.trim().toUpperCase(),
      portaria: form.portaria,
      colaborador: form.colaborador.trim().toUpperCase(),
      empresa: form.empresa.trim().toUpperCase() || 'NÃO INFORMADA',
      matricula: form.matricula.trim().toUpperCase() || 'N/A',
      cargo: form.cargo.trim().toUpperCase() || 'NÃO INFORMADO',
      dataRetirada: form.dataRetirada,
      horaRetirada: form.horaRetirada,
      dataDevolucao: dataDevolucaoFinal,
      horaDevolucao: horaDevolucaoFinal,
      situacao: situacaoFinal,
      observacao: form.observacao,
      justificativa: form.justificativa.trim(),
      vigilante: form.vigilante,
      vigilanteDevolucao: isDevolvido ? (form.vigilanteDevolucao || form.vigilante) : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Editar Credencial Provisória
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste cadastral de dados, portador, horários e situação da credencial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Identificação do Cartão & Portaria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Número do Cartão <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-blue-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.cartao}
                  onChange={(e) => setForm({ ...form, cartao: e.target.value })}
                  placeholder="Ex: 01/P1, 05/P2"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono font-bold uppercase focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Portaria de Liberação <span className="text-red-400">*</span>
              </label>
              <select
                value={form.portaria}
                onChange={(e) => setForm({ ...form, portaria: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="P1">Portaria 1 (P1)</option>
                <option value="P2">Portaria 2 (P2)</option>
                <option value="Caldeira">Caldeira</option>
                <option value="Cobertura">Cobertura</option>
                {form.portaria && !['P1', 'P2', 'Caldeira', 'Cobertura'].includes(form.portaria) && (
                  <option value={form.portaria}>{form.portaria}</option>
                )}
              </select>
            </div>
          </div>

          {/* Colaborador (Autocomplete Integrado) */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div>
              <AutocompleteInput
                tipo="pessoa"
                label="Colaborador (Portador da Credencial)"
                placeholder="Digite o nome completo do colaborador..."
                value={form.colaborador}
                onChange={(val) => setForm({ ...form, colaborador: val })}
                onSelect={(pessoa) => {
                  setForm(prev => ({
                    ...prev,
                    colaborador: pessoa.nome,
                    empresa: pessoa.empresa || prev.empresa,
                    matricula: pessoa.matricula || prev.matricula,
                    cargo: pessoa.cargo || prev.cargo
                  }));
                }}
              />
            </div>

            {/* Empresa e Matrícula */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <AutocompleteInput
                  tipo="empresa"
                  label="Empresa Vinculada"
                  placeholder="Ex: SERVIS, PRESTADOR..."
                  value={form.empresa}
                  onChange={(val) => setForm({ ...form, empresa: val })}
                  onSelect={(emp) => setForm(prev => ({ ...prev, empresa: typeof emp === 'string' ? emp : emp.empresa || emp }))}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Matrícula Funcional
                </label>
                <input
                  type="text"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  placeholder="Ex: MAT-1029..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Cargo e Motivo / Observação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Operador, Analista..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Motivo da Liberação
                </label>
                <select
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none cursor-pointer"
                >
                  {listaObservacoes.map((obs) => (
                    <option key={obs} value={obs}>{obs}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Horários de Retirada */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Data da Retirada <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={form.dataRetirada}
                    onChange={(e) => setForm({ ...form, dataRetirada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Horário da Retirada <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="time"
                    value={form.horaRetirada}
                    onChange={(e) => setForm({ ...form, horaRetirada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Situação e Vigilante de Saída */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Situação / Status da Credencial
                </label>
                <select
                  value={form.situacao}
                  onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 font-bold focus:outline-none cursor-pointer ${
                    form.situacao === 'NÃO DEVOLVIDO'
                      ? 'border-red-500/50 text-red-400'
                      : form.situacao === 'DEVOLVIDO'
                      ? 'border-emerald-500/50 text-emerald-400'
                      : form.situacao === 'PERDIDO'
                      ? 'border-amber-500/50 text-amber-400'
                      : 'border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  <option value="NÃO DEVOLVIDO">NÃO DEVOLVIDO (Em Aberto)</option>
                  <option value="DEVOLVIDO">DEVOLVIDO (Baixado)</option>
                  <option value="PERDIDO">PERDIDO / EXTRAVIADO (À Pagar)</option>
                  <option value="PAGO">PAGO (Ressarcido / Quitado)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Vigilante que Liberou
                </label>
                <select
                  value={form.vigilante}
                  onChange={(e) => setForm({ ...form, vigilante: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none cursor-pointer"
                >
                  {opcoesVigilantes.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campos Específicos se DEVOLVIDO */}
            {form.situacao === 'DEVOLVIDO' && (
              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3 space-y-3 animate-in fade-in">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Dados da Devolução / Baixa
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Data Devolução
                    </label>
                    <input
                      type="date"
                      value={form.dataDevolucao}
                      onChange={(e) => setForm({ ...form, dataDevolucao: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Hora Devolução
                    </label>
                    <input
                      type="time"
                      value={form.horaDevolucao}
                      onChange={(e) => setForm({ ...form, horaDevolucao: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Vigilante Recebedor
                    </label>
                    <select
                      value={form.vigilanteDevolucao}
                      onChange={(e) => setForm({ ...form, vigilanteDevolucao: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none cursor-pointer"
                    >
                      {opcoesVigilantesDevolucao.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Justificativa / Observações Adicionais */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Justificativa / Observações do Registro
              </label>
              <textarea
                rows={2}
                value={form.justificativa}
                onChange={(e) => setForm({ ...form, justificativa: e.target.value })}
                placeholder="Observações complementares ou justificativa de reincidência..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
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
  );
}
