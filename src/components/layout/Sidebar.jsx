import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  CreditCard, 
  UserCheck, 
  Radio, 
  LayoutDashboard, 
  Settings,
  HelpCircle,
  Clock,
  ChevronRight,
  Layers,
  UserCheck2
} from 'lucide-react';
import { 
  carregarOperadores, 
  obterNomesOperadoresAtivos 
} from '../../services/operadoresService';

export default function Sidebar({ 
  activeModule = 'dashboard', 
  onSelectModule,
  operadorAtivo = 'Op. Operador 01',
  onChangeOperador,
  onOpenSobre
}) {
  const [listaOperadores, setListaOperadores] = useState(() => {
    return obterNomesOperadoresAtivos();
  });

  useEffect(() => {
    // Carrega operadores atualizados do backend local
    const atualizarOperadores = async () => {
      try {
        const dados = await carregarOperadores();
        const ativos = dados.filter(op => op.status !== 'Inativo').map(op => op.nome);
        if (ativos.length > 0) {
          setListaOperadores(ativos);
        }
      } catch (e) {
        console.error('Erro ao buscar operadores no Sidebar:', e);
      }
    };

    atualizarOperadores();

    // Ouve eventos de alteração de operadores disparados pelo CRUD de Configurações
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

  const principalItem = {
    id: 'dashboard',
    label: 'Dashboard Principal',
    description: 'Painel Executivo & Indicadores',
    icon: LayoutDashboard,
    badge: 'Início',
    activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40',
  };

  const modulosOperacionais = [
    {
      id: 'ocorrencias',
      label: 'Relatório de Ocorrências',
      description: 'Registro RO, Fotos e PDF',
      short: 'RO',
      icon: FileText,
      badge: 'F1',
      activeColor: 'bg-blue-600 text-white shadow-md shadow-blue-500/25',
    },
    {
      id: 'provisorios',
      label: 'Credenciais Provisórias',
      description: 'Controle P1/P2 & Regra dos 3',
      short: 'P1/P2',
      icon: CreditCard,
      badge: 'F2',
      activeColor: 'bg-amber-600 text-white shadow-md shadow-amber-500/25',
    },
    {
      id: 'visitantes',
      label: 'Controle de Visitantes',
      description: 'Acessos & Vínculo com Anfitrião',
      short: 'Visitas',
      icon: UserCheck,
      badge: 'F3',
      activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25',
    },
    {
      id: 'rfid',
      label: 'Gestão Geral RFID',
      description: 'Rotativos (0-350) & Fixos',
      short: 'RFID',
      icon: Radio,
      badge: 'F4',
      activeColor: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25',
    }
  ];

  const moduloConfiguracoes = {
    id: 'configuracoes',
    label: 'Configurações',
    description: 'Efetivo CCO & Parâmetros',
    icon: Settings,
    badge: 'Admin',
    activeColor: 'bg-slate-700 text-white shadow-md shadow-slate-700/40 ring-1 ring-slate-500/40',
  };

  const moduloSobre = {
    id: 'sobre',
    label: 'Sobre o Sistema',
    description: 'Autoria & Licença v1.0',
    icon: HelpCircle,
    badge: 'v1.0',
  };

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 min-h-screen select-none print:hidden">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3.5 bg-slate-950/60">
        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight text-white font-sans">
              CCO Security
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Suite
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Central de Controle Operacional</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {/* Item Principal: Dashboard */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              Visão Estratégica
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectModule && onSelectModule(principalItem.id)}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all group cursor-pointer ${
              activeModule === principalItem.id
                ? `${principalItem.activeColor} font-bold`
                : 'text-slate-300 hover:text-white hover:bg-slate-900/90 border border-transparent hover:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-1.5 rounded-lg transition-colors ${
                activeModule === principalItem.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-900 text-blue-400 group-hover:bg-slate-800'
              }`}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
              </div>
              <div className="text-left truncate">
                <p className="font-bold truncate">{principalItem.label}</p>
                <p className={`text-[10px] truncate ${
                  activeModule === principalItem.id ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {principalItem.description}
                </p>
              </div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
              activeModule === principalItem.id 
                ? 'bg-white/20 text-white' 
                : 'bg-blue-950/80 text-blue-400 border border-blue-800/50'
            }`}>
              {principalItem.badge}
            </span>
          </button>
        </div>

        {/* 4 Módulos Operacionais */}
        <div className="space-y-1 pt-2 border-t border-slate-800/80">
          <div className="px-3 pb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              4 Ferramentas Operacionais
            </p>
            <span className="text-[10px] font-mono text-slate-600">4 de 4</span>
          </div>

          {modulosOperacionais.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule && onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group cursor-pointer ${
                  isActive 
                    ? `${item.activeColor} font-bold` 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <div className="text-left truncate">
                    <p className="font-semibold truncate">{item.label}</p>
                    <p className={`text-[10px] truncate ${
                      isActive ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seção de Administração e Configurações */}
        <div className="space-y-1 pt-2 border-t border-slate-800/80">
          <div className="px-3 pb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              Gestão & Parâmetros
            </p>
          </div>

          {/* Configurações (Acesso Restrito) */}
          <button
            type="button"
            onClick={() => onSelectModule && onSelectModule(moduloConfiguracoes.id)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group cursor-pointer ${
              activeModule === moduloConfiguracoes.id 
                ? `${moduloConfiguracoes.activeColor} font-bold` 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:rotate-45 ${
                activeModule === moduloConfiguracoes.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              <div className="text-left truncate">
                <p className="font-semibold truncate">{moduloConfiguracoes.label}</p>
                <p className={`text-[10px] truncate ${
                  activeModule === moduloConfiguracoes.id ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {moduloConfiguracoes.description}
                </p>
              </div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
              activeModule === moduloConfiguracoes.id ? 'bg-white/20 text-white' : 'bg-slate-800/80 text-slate-400'
            }`}>
              {moduloConfiguracoes.badge}
            </span>
          </button>

          {/* Sobre o Sistema (Apresentação & Autoria) */}
          <button
            type="button"
            onClick={() => onOpenSobre && onOpenSobre()}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group text-slate-400 hover:text-blue-300 hover:bg-slate-900/90 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <HelpCircle className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <div className="text-left truncate">
                <p className="font-semibold truncate">{moduloSobre.label}</p>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate">
                  {moduloSobre.description}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 bg-blue-950/80 text-blue-400 border border-blue-900/60">
              {moduloSobre.badge}
            </span>
          </button>
        </div>
      </div>

      {/* OPERADOR EM TURNO: IDENTIFICAÇÃO DINÂMICA EDITÁVEL / SELETOR */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs shadow-inner space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operador CCO em Turno
            </span>
            <span className="text-[10px] text-blue-400 font-mono font-bold">Efetivo Real</span>
          </div>

          {/* Campo de Seleção Restrito aos Operadores da CCO Dinâmicos */}
          <div className="relative">
            <select
              value={operadorAtivo}
              onChange={(e) => onChangeOperador && onChangeOperador(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/60 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
            >
              {listaOperadores.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>Turno 12x36</span>
            </div>
            <span className="text-slate-500 font-mono">Planta Operacional</span>
          </div>
        </div>
      </div>

      {/* RODAPÉ GLOBAL MINIMALISTA: ASSINATURA E VERSÃO */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950 text-center">
        <button
          type="button"
          onClick={() => onOpenSobre && onOpenSobre()}
          className="w-full text-left sm:text-center text-[10px] text-slate-500 hover:text-blue-400 transition-colors leading-relaxed font-medium select-none group cursor-pointer block"
          title="Clique para ver detalhes do sistema e autoria"
        >
          <p className="truncate">
            Desenvolvido por <span className="text-slate-400 group-hover:text-blue-300 font-semibold">© Yago Marinho</span>
          </p>
          <p className="text-[9px] text-slate-600 group-hover:text-slate-400 truncate">
            TecPrimus Soluções Tecnológicas @ 2026 | Versão 1.0
          </p>
        </button>
      </div>
    </aside>
  );
}
