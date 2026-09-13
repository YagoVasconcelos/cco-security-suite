// Processo Principal do Electron - CCO Security Suite
// Janela Nativa Corporativa, Sem Aparência de Navegador, Maximizada por Padrão
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server.cjs');

let mainWindow = null;
let embeddedServer = null;

// Handlers IPC para Diálogos Nativos do Windows (Seleção de Pasta e Abertura no Explorer)
const handleOpenDirectory = async (event, currentPath) => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    const documents = app.getPath('documents');
    const defaultDir = (currentPath && typeof currentPath === 'string' && fs.existsSync(currentPath))
      ? currentPath
      : documents;

    const dialogOptions = {
      title: 'Selecionar Diretório para Salvamento de Relatórios e Ocorrências',
      defaultPath: defaultDir,
      buttonLabel: 'Selecionar Pasta',
      properties: ['openDirectory', 'createDirectory']
    };

    const result = win
      ? await dialog.showOpenDialog(win, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  } catch (err) {
    console.error('[Electron IPC] Erro ao abrir diálogo de seleção de pasta:', err);
    return null;
  }
};

ipcMain.handle('dialog:openDirectory', handleOpenDirectory);
ipcMain.handle('dialog:selecionarPasta', handleOpenDirectory);

// Handler nativo do Electron para salvar arquivo de backup com dialog.showSaveDialog
ipcMain.handle('dialog:salvarArquivoBackup', async (event, { conteudoJson, nomeSugerido }) => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    const documents = app.getPath('documents');
    const defaultName = nomeSugerido || `backup_cco_${new Date().toISOString().slice(0, 10)}.json`;
    const defaultPath = path.join(documents, 'CCO Security Suite', defaultName);

    const dialogOptions = {
      title: 'Salvar Arquivo de Backup Completo - CCO Security Suite',
      defaultPath,
      buttonLabel: 'Salvar Backup',
      filters: [
        { name: 'Arquivo de Backup CCO (*.json)', extensions: ['json'] },
        { name: 'Todos os Arquivos (*.*)', extensions: ['*'] }
      ]
    };

    const result = win
      ? await dialog.showSaveDialog(win, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions);

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    const payload = typeof conteudoJson === 'string' ? conteudoJson : JSON.stringify(conteudoJson, null, 2);
    fs.writeFileSync(result.filePath, payload, 'utf-8');
    return { canceled: false, filePath: result.filePath };
  } catch (err) {
    console.error('[Electron IPC] Erro ao salvar arquivo de backup:', err);
    return { canceled: false, error: err.message };
  }
});

// Handler nativo do Electron para selecionar e ler arquivo de backup com dialog.showOpenDialog
ipcMain.handle('dialog:selecionarArquivoBackup', async () => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    const documents = app.getPath('documents');
    const defaultPath = path.join(documents, 'CCO Security Suite');

    const dialogOptions = {
      title: 'Selecionar Arquivo de Backup para Restauração - CCO Security Suite',
      defaultPath: fs.existsSync(defaultPath) ? defaultPath : documents,
      buttonLabel: 'Carregar Backup',
      filters: [
        { name: 'Arquivo de Backup CCO (*.json)', extensions: ['json'] },
        { name: 'Todos os Arquivos (*.*)', extensions: ['*'] }
      ],
      properties: ['openFile']
    };

    const result = win
      ? await dialog.showOpenDialog(win, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return { canceled: false, filePath, content };
  } catch (err) {
    console.error('[Electron IPC] Erro ao abrir arquivo de backup:', err);
    return { canceled: false, error: err.message };
  }
});

ipcMain.handle('app:obterDiretoriosPadrao', () => {
  const documents = app.getPath('documents');
  const userData = app.getPath('userData');
  const defaultExport = path.join(documents, 'CCO Security Suite', 'exports');
  return {
    documents,
    userData,
    defaultExport
  };
});

// Handler nativo para exportação em PDF idêntica à impressão via Chromium printToPDF
ipcMain.handle('app:salvarPdfNativo', async (event, { nomeSugerido, paisagem = true } = {}) => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (!win) throw new Error('Janela do aplicativo não encontrada');

    const pdfBuffer = await win.webContents.printToPDF({
      landscape: paisagem,
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4'
    });

    const documents = app.getPath('documents');
    const exportsDir = path.join(documents, 'CCO Security Suite', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const defaultName = nomeSugerido || `Dashboard_Executivo_CCO_${new Date().toISOString().slice(0, 10)}.pdf`;
    const destPath = path.join(exportsDir, defaultName);
    fs.writeFileSync(destPath, pdfBuffer);

    return { sucesso: true, caminho: destPath, nomeArquivo: defaultName };
  } catch (err) {
    console.error('[Electron IPC] Erro ao gerar PDF nativo via printToPDF:', err);
    return { sucesso: false, error: err.message };
  }
});

ipcMain.handle('shell:abrirPasta', async (event, folderPath) => {
  try {
    const documents = app.getPath('documents');
    const defaultExports = path.join(documents, 'CCO Security Suite', 'exports');
    const targetDir = (folderPath && typeof folderPath === 'string' && folderPath.trim())
      ? (path.isAbsolute(folderPath.trim())
          ? folderPath.trim()
          : path.join(documents, 'CCO Security Suite', folderPath.trim()))
      : defaultExports;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    await shell.openPath(targetDir);
    return true;
  } catch (err) {
    console.warn('[Electron] Erro ao abrir pasta no Windows Explorer:', err.message);
    return false;
  }
});


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
      const documentsDir = app.getPath('documents');
      const userDataDir = app.getPath('userData');
      const { port } = await startServer({
        port: 3000,
        staticDir,
        rootDir,
        documentsDir,
        userDataDir
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
