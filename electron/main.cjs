// Processo Principal do Electron - CCO Security Suite
// Janela Nativa Corporativa, Sem Aparência de Navegador, Maximizada por Padrão
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server.cjs');

let mainWindow = null;
let embeddedServer = null;

// Garante que apenas uma instância do aplicativo seja executada por vez
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Remove o menu de navegador padrão do Electron
Menu.setApplicationMenu(null);

async function createWindow() {
  const appIconPath = fs.existsSync(path.join(__dirname, '../public/shield.ico'))
    ? path.join(__dirname, '../public/shield.ico')
    : (fs.existsSync(path.join(__dirname, '../build/icon.ico'))
        ? path.join(__dirname, '../build/icon.ico')
        : (fs.existsSync(path.join(__dirname, '../public/icon.ico'))
            ? path.join(__dirname, '../public/icon.ico')
            : path.join(__dirname, '../public/shield.svg')));

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'CCO Security Suite',
    icon: appIconPath,
    backgroundColor: '#020617', // Slate 950
    autoHideMenuBar: true,
    show: false, // Exibe apenas quando estiver renderizado para evitar flash branco
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: !app.isPackaged
    }
  });

  // Janela Maximizado por Padrão conforme requisito operacional
  mainWindow.maximize();

  // Intercepta e abre links externos (LinkedIn, GitHub, Email) no navegador padrão do Windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (url !== currentUrl && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Gerenciamento de inicialização em Desenvolvimento vs. Produção
  const isDev = !app.isPackaged && (process.env.NODE_ENV === 'development' || process.argv.includes('--dev'));

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    console.log(`[Electron Dev] Carregando interface Vite em: ${devUrl}`);
    await mainWindow.loadURL(devUrl);
  } else {
    // Modo de Produção: Inicia servidor local embutido para servir o dist compilado e a API de arquivos
    const staticDir = fs.existsSync(path.join(__dirname, '../dist-react'))
      ? path.join(__dirname, '../dist-react')
      : path.join(__dirname, '../dist');
    let rootDir = path.join(__dirname, '..');
    if (app.isPackaged) {
      const exeDir = path.dirname(app.getPath('exe'));
      try {
        const testFile = path.join(exeDir, '.write-test');
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        rootDir = exeDir;
      } catch (e) {
        rootDir = path.join(app.getPath('userData'), 'database');
      }
    }

    try {
      const { port } = await startServer({
        port: 3000,
        staticDir,
        rootDir
      });
      console.log(`[Electron Prod] Servidor embutido ativo na porta ${port}`);
      await mainWindow.loadURL(`http://127.0.0.1:${port}`);
    } catch (err) {
      console.error('[Electron Prod] Erro ao iniciar servidor embutido, tentando fallback para arquivo:', err);
      await mainWindow.loadFile(path.join(staticDir, 'index.html'));
    }
  }

  // Exibe a janela quando estiver pronta para visualização limpa
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
