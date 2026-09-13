import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  ExternalLink, 
  Mail, 
  Building2, 
  User, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Copyright,
  FileCode2
} from 'lucide-react';

export default function ModalSobre({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 select-none text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-sobre"
      >
        {/* Glows Decorativos de Fundo */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="titulo-modal-sobre" className="text-lg font-bold text-white tracking-tight">
                  CCO Security Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase tracking-wider">
                  Rev 1.0 Produção
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Central de Controle Operacional & Inteligência de Segurança
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações Principais de Autoria */}
        <div className="space-y-3 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Desenvolvedor */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Desenvolvedor</span>
              </div>
              <p className="text-sm font-bold text-white">Yago Marinho</p>
              <p className="text-[11px] text-slate-400 font-medium">Engenharia & Arquitetura de Software</p>
            </div>

            {/* Empresa */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Empresa</span>
              </div>
              <p className="text-sm font-bold text-white">TecPrimus</p>
              <p className="text-[11px] text-slate-400 font-medium">Soluções Tecnológicas</p>
            </div>
          </div>

          {/* Versão e Status */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Versão do Sistema: 1.0</p>
                <p className="text-[11px] text-slate-400">Release Oficial Estável para Ambiente de Operação</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ativo
            </span>
          </div>
        </div>

        {/* Canais Oficiais & Contatos */}
        <div className="space-y-2 relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Canais de Contato & Portfólio
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/yago-marinho-b8a309141/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/80 hover:bg-blue-600/15 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-blue-300 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 fill-current text-blue-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 0 0-1.64 1.64 1.63 1.63 0 0 0 1.64 1.63 1.64 1.64 0 0 0 1.64-1.63c0-.9-.74-1.64-1.64-1.64Z"/>
                </svg>
                <span className="text-xs font-semibold">LinkedIn</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/YagoVasconcelos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 fill-current text-slate-300 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span className="text-xs font-semibold">GitHub</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </a>

            {/* Email */}
            <a
              href="mailto:tecprimus2021@outlook.com"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/80 hover:bg-emerald-600/15 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">E-mail</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </a>
          </div>

          <div className="px-1 text-[11px] text-slate-400 font-mono">
            <span>Email direto: </span>
            <span className="text-slate-200 font-semibold select-all">tecprimus2021@outlook.com</span>
          </div>
        </div>

        {/* Aviso Legal & Direitos Autorais */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Copyright className="w-4 h-4 shrink-0" />
            <span>Aviso Legal & Propriedade Intelectual (Copyright © 2026)</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed font-normal">
            Este software é protegido pelas leis de propriedade intelectual e direitos autorais internacionais (Copyright © 2026). 
            Desenvolvido por <strong>Yago Marinho</strong> para <strong>TecPrimus Soluções Tecnológicas</strong>. 
            Todos os direitos reservados. É estritamente vedada a reprodução, engenharia reversa ou comercialização não autorizada deste sistema.
          </p>
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-2 flex justify-end relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
