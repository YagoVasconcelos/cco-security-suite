import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  CreditCard, 
  UserCheck, 
  Building, 
  Car, 
  Clock, 
  Calendar, 
  Shield, 
  Check, 
  Users, 
  Phone,
  FileText
} from 'lucide-react';
import AutocompleteInput from '../../components/common/AutocompleteInput';

export default function EditarVisitanteModal({
  isOpen,
  visitante,
  onClose,
  onSalvar,
  listaVigilantes = [],
  listaMotivos = []
}) {
  const [form, setForm] = useState({
    cartao: '',
    portaria: 'P1',
    visitante: '',
    documento: '',
    empresa: '',
    placaVeiculo: '',
    anfitriao: '',
    anfitriaoSetor: '',
    anfitriaoRamal: '',
    motivo: 'REUNIÃO',
    dataEntrada: '',
    horaEntrada: '',
    dataSaida: '',
    horaSaida: '',
    situacao: 'NÃO DEVOLVIDO',
    vigilanteEntrada: '',
    vigilanteSaida: ''
  });

  useEffect(() => {
    if (visitante) {
      setForm({
        cartao: visitante.cartao || '',
        portaria: visitante.portaria || 'P1',
        visitante: visitante.visitante || '',
        documento: visitante.documento || '',
        empresa: visitante.empresa === 'VISITA PARTICULAR' ? '' : (visitante.empresa || ''),
        placaVeiculo: visitante.placaVeiculo === 'N/A' ? '' : (visitante.placaVeiculo || ''),
        anfitriao: visitante.anfitriao || '',
        anfitriaoSetor: visitante.anfitriaoSetor === 'GERAL' ? '' : (visitante.anfitriaoSetor || ''),
        anfitriaoRamal: visitante.anfitriaoRamal === 'N/A' ? '' : (visitante.anfitriaoRamal || ''),
        motivo: visitante.motivo || 'REUNIÃO',
        dataEntrada: visitante.dataEntrada || '',
        horaEntrada: visitante.horaEntrada || '',
        dataSaida: visitante.dataSaida || '',
        horaSaida: visitante.horaSaida || '',
        situacao: visitante.situacao || 'NÃO DEVOLVIDO',
        vigilanteEntrada: visitante.vigilanteEntrada || (listaVigilantes[0] || 'Vigilante Portaria 1'),
        vigilanteSaida: visitante.vigilanteSaida || (listaVigilantes[0] || 'Vigilante Portaria 1')
      });
    }
  }, [visitante, listaVigilantes]);

  // Blindagem de lista de vigilantes: preserva valor mesmo se inativo ou ausente
  const opcoesVigilantesEntrada = useMemo(() => {
    const base = Array.isArray(listaVigilantes) ? [...listaVigilantes] : [];
    if (form.vigilanteEntrada && !base.includes(form.vigilanteEntrada)) {
      base.unshift(form.vigilanteEntrada);
    }
    return base;
  }, [listaVigilantes, form.vigilanteEntrada]);

  const opcoesVigilantesSaida = useMemo(() => {
    const base = Array.isArray(listaVigilantes) ? [...listaVigilantes] : [];
    if (form.vigilanteSaida && !base.includes(form.vigilanteSaida)) {
      base.unshift(form.vigilanteSaida);
    }
    return base;
  }, [listaVigilantes, form.vigilanteSaida]);

  if (!isOpen || !visitante) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.visitante || !form.visitante.trim()) {
      alert('O nome do visitante é obrigatório.');
      return;
    }
    if (!form.anfitriao || !form.anfitriao.trim()) {
      alert('O nome do anfitrião solicitante é obrigatório para conformidade de acesso.');
      return;
    }

    onSalvar({
      ...visitante,
      cartao: form.cartao.trim().toUpperCase(),
      portaria: form.portaria,
      visitante: form.visitante.trim().toUpperCase(),
      documento: form.documento.trim() || 'N/A',
      empresa: form.empresa.trim().toUpperCase() || 'VISITA PARTICULAR',
      placaVeiculo: form.placaVeiculo.trim().toUpperCase() || 'N/A',
      anfitriao: form.anfitriao.trim().toUpperCase(),
      anfitriaoSetor: form.anfitriaoSetor.trim().toUpperCase() || 'GERAL',
      anfitriaoRamal: form.anfitriaoRamal.trim() || 'N/A',
      motivo: form.motivo,
      dataEntrada: form.dataEntrada,
      horaEntrada: form.horaEntrada,
      dataSaida: form.situacao === 'DEVOLVIDO' ? (form.dataSaida || form.dataEntrada) : null,
      horaSaida: form.situacao === 'DEVOLVIDO' ? (form.horaSaida || form.horaEntrada) : null,
      situacao: form.situacao,
      vigilanteEntrada: form.vigilanteEntrada,
      vigilanteSaida: form.situacao === 'DEVOLVIDO' ? form.vigilanteSaida : null
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
                Editar Registro de Visitante
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste cadastral de dados do visitante, empresa, anfitrião e horários
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
                Número do Crachá / Cartão <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-blue-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.cartao}
                  onChange={(e) => setForm({ ...form, cartao: e.target.value })}
                  placeholder="Ex: 01/P1, 08/P1..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono font-bold uppercase focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Portaria de Acesso <span className="text-red-400">*</span>
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

          {/* Dados do Visitante */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div>
              <AutocompleteInput
                tipo="pessoa"
                label="Nome Completo do Visitante"
                placeholder="Digite o nome do visitante..."
                value={form.visitante}
                onChange={(val) => setForm({ ...form, visitante: val })}
                onSelect={(pessoa) => {
                  setForm(prev => ({
                    ...prev,
                    visitante: pessoa.nome,
                    empresa: pessoa.empresa && pessoa.empresa !== 'ESTOQUE CCO' && pessoa.empresa !== 'VISITA PARTICULAR' ? pessoa.empresa : prev.empresa,
                    documento: pessoa.documento || prev.documento
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Documento (RG / CPF)
                </label>
                <input
                  type="text"
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                  placeholder="Ex: 12.345.678-9 ou CPF..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <AutocompleteInput
                  tipo="empresa"
                  label="Empresa / Procedência"
                  placeholder="Ex: PRESTADORA LTDA..."
                  value={form.empresa}
                  onChange={(val) => setForm({ ...form, empresa: val })}
                  onSelect={(emp) => setForm(prev => ({ ...prev, empresa: typeof emp === 'string' ? emp : emp.empresa || emp }))}
                />
              </div>
            </div>

            {/* Placa do Veículo e Motivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Placa do Veículo (Opcional)
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.placaVeiculo}
                    onChange={(e) => setForm({ ...form, placaVeiculo: e.target.value })}
                    placeholder="Ex: ABC-1234 ou ABC1D23"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Motivo da Visita
                </label>
                <select
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none cursor-pointer"
                >
                  {listaMotivos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vínculo Obrigatório: Anfitrião Solicitante */}
          <div className="space-y-3 pt-1 border-t border-slate-800 bg-slate-950/40 p-3 rounded-xl border">
            <div>
              <AutocompleteInput
                tipo="pessoa"
                label="Anfitrião (Responsável Interno da Planta)"
                placeholder="Digite o nome do anfitrião solicitante..."
                value={form.anfitriao}
                onChange={(val) => setForm({ ...form, anfitriao: val })}
                onSelect={(pessoa) => {
                  setForm(prev => ({
                    ...prev,
                    anfitriao: pessoa.nome,
                    anfitriaoSetor: pessoa.setor || pessoa.cargo || prev.anfitriaoSetor
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Setor / Departamento do Anfitrião
                </label>
                <input
                  type="text"
                  value={form.anfitriaoSetor}
                  onChange={(e) => setForm({ ...form, anfitriaoSetor: e.target.value })}
                  placeholder="Ex: TI, Manutenção, RH..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Ramal / Telefone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.anfitriaoRamal}
                    onChange={(e) => setForm({ ...form, anfitriaoRamal: e.target.value })}
                    placeholder="Ex: 4501 / (11) 9..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg pl-8 pr-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Horários de Entrada & Situação */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Data de Entrada <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={form.dataEntrada}
                    onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Horário de Entrada <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="time"
                    value={form.horaEntrada}
                    onChange={(e) => setForm({ ...form, horaEntrada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Situação e Vigilante Entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Situação / Status da Visita
                </label>
                <select
                  value={form.situacao}
                  onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 font-bold focus:outline-none cursor-pointer ${
                    form.situacao === 'NÃO DEVOLVIDO'
                      ? 'border-emerald-500/50 text-emerald-400'
                      : form.situacao === 'DEVOLVIDO'
                      ? 'border-slate-700 text-slate-300'
                      : form.situacao === 'PERDIDO'
                      ? 'border-amber-500/50 text-amber-400'
                      : form.situacao === 'FURTADO' || form.situacao === 'ISENTO_BO'
                      ? 'border-cyan-500/50 text-cyan-400'
                      : 'border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  <option value="NÃO DEVOLVIDO">NÃO DEVOLVIDO (No Site / Em Andamento)</option>
                  <option value="DEVOLVIDO">DEVOLVIDO (Encerrado / Baixado)</option>
                  <option value="PERDIDO">PERDIDO / EXTRAVIADO (A Cobrar)</option>
                  <option value="FURTADO">FURTADO / SINISTRO</option>
                  <option value="ISENTO_BO">ISENTO POR B.O.</option>
                  <option value="PAGO">PAGO (Ressarcido / Quitado)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Vigilante de Entrada
                </label>
                <select
                  value={form.vigilanteEntrada}
                  onChange={(e) => setForm({ ...form, vigilanteEntrada: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none cursor-pointer"
                >
                  {opcoesVigilantesEntrada.map((v) => (
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
                  Dados da Saída / Devolução da Credencial
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Data de Saída
                    </label>
                    <input
                      type="date"
                      value={form.dataSaida}
                      onChange={(e) => setForm({ ...form, dataSaida: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Hora de Saída
                    </label>
                    <input
                      type="time"
                      value={form.horaSaida}
                      onChange={(e) => setForm({ ...form, horaSaida: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Vigilante de Saída
                    </label>
                    <select
                      value={form.vigilanteSaida}
                      onChange={(e) => setForm({ ...form, vigilanteSaida: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none cursor-pointer"
                    >
                      {opcoesVigilantesSaida.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
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
