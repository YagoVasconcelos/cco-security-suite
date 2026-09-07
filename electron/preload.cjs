// Preload Script - CCO Security Suite
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  plataforma: process.platform,
  versao: '1.0.0',
  autor: 'TecPrimus Soluções Tecnológicas'
});
