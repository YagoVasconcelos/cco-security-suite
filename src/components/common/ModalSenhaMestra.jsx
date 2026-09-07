import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, X, ArrowRight } from 'lucide-react';
import { validarSenhaMestra } from '../../services/segurancaService';

export default function ModalSenhaMestra({ isOpen, onClose, onSuccess }) {
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [validando, setValidando] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSenha('');
      setErro('');
      setValidando(false);
      setMostrarSenha(false);
      // Auto-foco no input após renderização
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!senha.trim()) {
      setErro('Por favor, informe a Senha Mestra.');
      return;
    }

    setValidando(true);
    setErro('');

    try {
      const isValid = await validarSenhaMestra(senha);
      if (isValid) {
        onSuccess();
      } else {
        setErro('Senha Mestra incorreta. Acesso negado à área de configurações.');
        setSenha('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      setErro('Erro ao validar senha. Tente novamente.');
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-seguranca"
      >
        {/* Glow decorativo de fundo */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="titulo-modal-seguranca" className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                <span>Acesso Administrativo Restrito</span>
              </h3>
              <p className="text-xs text-slate-400">
                Área de Configurações & Efetivo CCO
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Fechar e cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descrição informativa */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed relative z-10">
          Para acessar ou modificar os parâmetros do sistema e a lista de operadores, digite a <strong className="text-amber-300 font-semibold">Senha Mestra</strong> cadastrada.
        </div>

        {/* Mensagem de Erro com Alerta */}
        {erro && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-xs text-red-200 flex items-start gap-2.5 animate-in slide-in-from-top-2 relative z-10">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{erro}</span>
          </div>
        )}

        {/* Formulário de Senha */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block font-bold text-slate-300 text-xs mb-1.5 uppercase tracking-wider">
              Senha Mestra
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (erro) setErro('');
                }}
                placeholder="Digite a senha mestra..."
                disabled={validando}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 font-mono tracking-wider focus:outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Padrão inicial de fábrica: <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded font-mono">admin123</code></span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={validando}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-300 font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={validando || !senha.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {validando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Desbloquear Acesso</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
