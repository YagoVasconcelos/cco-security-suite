import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardExecutivoView from './modules/dashboard/DashboardExecutivoView';
import RelatorioOcorrenciaForm from './modules/ocorrencias/RelatorioOcorrenciaForm';
import ControleProvisoriosView from './modules/provisorios/ControleProvisoriosView';
import ControleVisitantesView from './modules/visitantes/ControleVisitantesView';
import GestaoRfidView from './modules/rfid/GestaoRfidView';
import ConfiguracoesView from './modules/configuracoes/ConfiguracoesView';
import ModalSenhaMestra from './components/common/ModalSenhaMestra';
import ModalSobre from './components/common/ModalSobre';
import { Shield, Construction } from 'lucide-react';
import { 
  obterNomesOperadoresAtivos, 
  carregarOperadores 
} from './services/operadoresService';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isConfigAutenticado, setIsConfigAutenticado] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [modalSobreAberto, setModalSobreAberto] = useState(false);
  const [operadorAtivo, setOperadorAtivo] = useState(() => {
    const salvo = localStorage.getItem('cco_operador_ativo');
    const nomesAtivos = obterNomesOperadoresAtivos();
    if (salvo && nomesAtivos.includes(salvo)) {
      return salvo;
    }
    return nomesAtivos[0] || 'Op. Operador 01';
  });

  useEffect(() => {
    // Sincroniza operador ativo se houver mudanças no efetivo cadastrado
    const handleOperadoresChanged = (e) => {
      const lista = e.detail && Array.isArray(e.detail) ? e.detail : [];
      const nomesAtivos = lista.filter(op => op.status !== 'Inativo').map(op => op.nome);
      if (nomesAtivos.length > 0) {
        if (!nomesAtivos.includes(operadorAtivo)) {
          const primeiro = nomesAtivos[0];
          setOperadorAtivo(primeiro);
          localStorage.setItem('cco_operador_ativo', primeiro);
        }
      }
    };

    window.addEventListener('cco_operadores_changed', handleOperadoresChanged);
    return () => window.removeEventListener('cco_operadores_changed', handleOperadoresChanged);
  }, [operadorAtivo]);

  const handleTrocarOperador = (novoNome) => {
    setOperadorAtivo(novoNome);
    localStorage.setItem('cco_operador_ativo', novoNome);
  };

  // Interceptador de navegação para proteger módulo restrito de Configurações
  const handleSelectModule = (moduleId) => {
    if (moduleId === 'sobre') {
      setModalSobreAberto(true);
      return;
    }

    if (moduleId === 'configuracoes') {
      if (isConfigAutenticado) {
        setActiveModule('configuracoes');
      } else {
        setModalSenhaAberto(true);
      }
    } else {
      setActiveModule(moduleId);
    }
  };

  const handleSenhaSucesso = () => {
    setIsConfigAutenticado(true);
    setModalSenhaAberto(false);
    setActiveModule('configuracoes');
  };

  const handleBloquearConfig = () => {
    setIsConfigAutenticado(false);
    setActiveModule('dashboard');
  };

  // Retorna o título para o Header de acordo com o módulo selecionado
  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Dashboard Executivo & Indicadores Estratégicos';
      case 'ocorrencias':
        return 'Gerador de Relatório de Ocorrências (RO)';
      case 'provisorios':
        return 'Controle de Credenciais Provisórias (P1 / P2)';
      case 'visitantes':
        return 'Controle de Liberação de Visitantes';
      case 'rfid':
        return 'Gestão Geral de Credenciais RFID (Fixos / Rotativos)';
      case 'configuracoes':
        return 'Configurações do Sistema & Efetivo CCO';
      default:
        return 'CCO Security Suite';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased print:h-auto print:overflow-visible print:bg-transparent print:w-full print:m-0 print:p-0">
      {/* Modal de Senha Mestra (Acesso Restrito) */}
      <ModalSenhaMestra
        isOpen={modalSenhaAberto}
        onClose={() => setModalSenhaAberto(false)}
        onSuccess={handleSenhaSucesso}
      />

      {/* Modal Sobre o Sistema (Autoria & Licença Rev 1.0) */}
      <ModalSobre
        isOpen={modalSobreAberto}
        onClose={() => setModalSobreAberto(false)}
      />

      {/* Sidebar de Navegação Corporativa */}
      <Sidebar 
        activeModule={activeModule} 
        onSelectModule={handleSelectModule} 
        operadorAtivo={operadorAtivo}
        onChangeOperador={handleTrocarOperador}
        onOpenSobre={() => setModalSobreAberto(true)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:w-full print:m-0 print:p-0 print:bg-transparent">
        {/* Header Superior Fixo com relógio ao vivo e status */}
        <Header 
          title={getModuleTitle()} 
          activeModule={activeModule}
        />

        {/* Viewport dos Módulos com Rolagem Suave */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/80 print:p-0 print:m-0 print:w-full print:overflow-visible print:bg-transparent">
          {activeModule === 'dashboard' && (
            <DashboardExecutivoView 
              onNavigate={handleSelectModule} 
              operadorAtivo={operadorAtivo}
              onChangeOperador={handleTrocarOperador}
            />
          )}
          {activeModule === 'ocorrencias' && <RelatorioOcorrenciaForm />}
          {activeModule === 'provisorios' && <ControleProvisoriosView />}
          {activeModule === 'visitantes' && <ControleVisitantesView />}
          {activeModule === 'rfid' && <GestaoRfidView />}
          {activeModule === 'configuracoes' && (
            <ConfiguracoesView onBloquear={handleBloquearConfig} />
          )}
          {activeModule !== 'dashboard' && activeModule !== 'ocorrencias' && activeModule !== 'provisorios' && activeModule !== 'visitantes' && activeModule !== 'rfid' && activeModule !== 'configuracoes' && (
            /* Placeholder amigável para módulos extras */
            <div className="max-w-xl mx-auto mt-16 p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Construction className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Módulo em Estruturação
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este módulo foi pré-configurado na estrutura de pastas e será implementado nas próximas etapas de acordo com as especificações.
              </p>
              <button
                onClick={() => setActiveModule('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <Shield className="w-4 h-4" />
                <span>Voltar ao Dashboard</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
