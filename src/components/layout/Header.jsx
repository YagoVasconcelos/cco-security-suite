import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Maximize2,
  FolderOpen
} from 'lucide-react';

export default function Header({ title = 'CCO Security Suite', activeModule = 'dashboard' }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const renderBreadcrumb = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <>
            <span className="text-slate-500">Painel Geral</span>
            <span className="text-slate-700">/</span>
            <span className="text-blue-400 font-semibold">Dashboard Executivo</span>
          </>
        );
      case 'ocorrencias':
        return (
          <>
            <span className="text-slate-500">Ferramenta 1</span>
            <span className="text-slate-700">/</span>
            <span className="text-blue-400 font-semibold">Relatório de Ocorrências (RO)</span>
          </>
        );
      case 'provisorios':
        return (
          <>
            <span className="text-slate-500">Ferramenta 2</span>
            <span className="text-slate-700">/</span>
            <span className="text-amber-400 font-semibold">Credenciais Provisórias</span>
          </>
        );
      case 'visitantes':
        return (
          <>
            <span className="text-slate-500">Ferramenta 3</span>
            <span className="text-slate-700">/</span>
            <span className="text-emerald-400 font-semibold">Controle de Visitantes</span>
          </>
        );
      case 'rfid':
        return (
          <>
            <span className="text-slate-500">Ferramenta 4</span>
            <span className="text-slate-700">/</span>
            <span className="text-indigo-400 font-semibold">Gestão Geral RFID</span>
          </>
        );
      default:
        return <span className="text-blue-400 font-semibold">Operações</span>;
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 print:hidden">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Central de Segurança</span>
          <span className="text-slate-600">/</span>
          {renderBreadcrumb()}
        </div>
        <h2 className="text-base font-bold text-white tracking-tight leading-tight">
          {title}
        </h2>
      </div>

      {/* Live System Info */}
      <div className="flex items-center gap-4">
        {/* Clock & Date Badge */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-950/70 border border-slate-800/90 px-3 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="h-3 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Network & Save Target Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-800/40 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Destino:</span>
          <span className="font-mono text-[11px] text-slate-200">CCO/exports</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium">Sistema Operante</span>
        </div>
      </div>
    </header>
  );
}
