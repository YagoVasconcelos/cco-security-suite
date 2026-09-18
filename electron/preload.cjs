// Preload Script - CCO Security Suite
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  plataforma: process.platform,
  versao: '1.2.0',
  autor: 'TecPrimus Soluções Tecnológicas',
  selectDirectory: (caminhoAtual) => ipcRenderer.invoke('dialog:openDirectory', caminhoAtual),
  selecionarPasta: (caminhoAtual) => ipcRenderer.invoke('dialog:selecionarPasta', caminhoAtual),
  obterDiretoriosPadrao: () => ipcRenderer.invoke('app:obterDiretoriosPadrao'),
  abrirPasta: (caminho) => ipcRenderer.invoke('shell:abrirPasta', caminho),
  salvarArquivoBackup: (conteudoJson, nomeSugerido) => ipcRenderer.invoke('dialog:salvarArquivoBackup', { conteudoJson, nomeSugerido }),
  selecionarArquivoBackup: () => ipcRenderer.invoke('dialog:selecionarArquivoBackup'),
  salvarPdfNativo: (opcoes) => ipcRenderer.invoke('app:salvarPdfNativo', opcoes),
  validarSenhaMestra: (senha) => ipcRenderer.invoke('seguranca:validarSenha', senha),
  alterarSenhaMestra: (senhaAtual, novaSenha) => ipcRenderer.invoke('seguranca:salvarSenha', { senhaAtual, novaSenha }),
  obterStatusSeguranca: () => ipcRenderer.invoke('seguranca:obterStatus')
});

