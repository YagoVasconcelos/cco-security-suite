// Processo Principal do Electron - CCO Security Suite
// Janela Nativa Corporativa, Sem Aparência de Navegador, Maximizada por Padrão
const { app, BrowserWindow, Menu, shell, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server.cjs');
const cryptoHelper = require('./cryptoHelper.cjs');
const licensingHelper = require('./licensingHelper.cjs');

let mainWindow = null;
let activationWindow = null;
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

// Handlers IPC Nativos de Segurança com safeStorage (DPAPI) e PBKDF2
ipcMain.handle('seguranca:validarSenha', async (event, senhaDigitada) => {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const dataDir = path.join(rootDir, 'data');
    const dataJsonPath = path.join(dataDir, 'seguranca.json');
    const rootJsonPath = path.join(rootDir, 'seguranca.json');

    const config = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath, safeStorage);
    const valido = cryptoHelper.verificarSenha(senhaDigitada, config);
    return { success: true, valido, message: valido ? 'Autorizado' : 'Senha incorreta' };
  } catch (err) {
    console.error('[Electron IPC] Erro ao validar senha:', err);
    return { success: false, valido: false, error: err.message };
  }
});

ipcMain.handle('seguranca:salvarSenha', async (event, { senhaAtual, novaSenha }) => {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const dataDir = path.join(rootDir, 'data');
    const dataJsonPath = path.join(dataDir, 'seguranca.json');
    const rootJsonPath = path.join(rootDir, 'seguranca.json');

    const config = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath, safeStorage);
    if (senhaAtual !== undefined) {
      const ok = cryptoHelper.verificarSenha(senhaAtual, config);
      if (!ok) {
        return { success: false, error: 'A senha mestra atual informada está incorreta.' };
      }
    }

    if (!novaSenha || typeof novaSenha !== 'string' || novaSenha.trim().length < 4) {
      return { success: false, error: 'A nova senha deve possuir pelo menos 4 caracteres.' };
    }

    const novo = cryptoHelper.gerarRegistroSeguro(novaSenha.trim(), safeStorage);
    cryptoHelper.salvarEmDisco(dataJsonPath, rootJsonPath, novo);
    return { success: true, message: 'Senha mestra alterada com sucesso!', dataAtualizacao: novo.dataAtualizacao };
  } catch (err) {
    console.error('[Electron IPC] Erro ao salvar senha:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('seguranca:obterStatus', async () => {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const dataDir = path.join(rootDir, 'data');
    const dataJsonPath = path.join(dataDir, 'seguranca.json');
    const rootJsonPath = path.join(rootDir, 'seguranca.json');

    const config = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath, safeStorage);
    return cryptoHelper.obterMetadadosPublicos(config);
  } catch (err) {
    return { success: false, error: err.message };
  }
});


function getResolvedConfiguredExportDir(caminhoRede) {
  const documents = app.getPath('documents');
  const userData = app.getPath('userData');
  const rootDir = path.resolve(__dirname, '..');

  let configured = caminhoRede;
  if (!configured || typeof configured !== 'string' || !configured.trim()) {
    const possiblePaths = [
      path.join(rootDir, 'data', 'responsaveis.json'),
      path.join(userData, 'data', 'responsaveis.json'),
      path.join(userData, 'responsaveis.json'),
      path.join(userData, 'database', 'data', 'responsaveis.json'),
      path.join(userData, 'database', 'responsaveis.json'),
      path.join(path.dirname(app.getPath('exe')), 'data', 'responsaveis.json')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const resp = JSON.parse(fs.readFileSync(p, 'utf-8'));
          if (resp && resp.caminhoRede) {
            configured = resp.caminhoRede;
            break;
          }
        } catch (e) {}
      }
    }
  }

  const agora = new Date();
  const ano = String(agora.getFullYear());
  const mesNum = String(agora.getMonth() + 1).padStart(2, '0');
  const mesesNomes = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  const mesNome = mesesNomes[agora.getMonth()];
  const periodoSubpasta = path.join(ano, `${mesNum}.${mesNome}`);

  let baseDir = '';
  if (configured && typeof configured === 'string' && configured.trim()) {
    let trimmed = configured.trim();
    // Suporte a placeholders se existirem
    trimmed = trimmed
      .replace(/\{ANO\}/gi, ano)
      .replace(/\{MES\}/gi, mesNum)
      .replace(/\{MES_NOME\}/gi, mesNome);

    if (path.isAbsolute(trimmed) || trimmed.startsWith('\\\\')) {
      baseDir = trimmed;
    } else {
      baseDir = path.join(documents, 'CCO Security Suite', trimmed);
    }
  } else {
    baseDir = path.join(documents, 'CCO Security Suite', 'MAPA DE CALOR');
  }

  // Se o caminho configurado for uma pasta geral (não contiver ano nem o mês corrente), organiza em subpasta Ano/Mês
  const baseNormalized = baseDir.toUpperCase();
  if (!baseNormalized.includes(ano) && !baseNormalized.includes(mesNome)) {
    baseDir = path.join(baseDir, periodoSubpasta);
  }

  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return baseDir;
  } catch (err) {
    console.warn('[Electron] Falha ao criar diretório configurado, usando exports padrão:', err.message);
    const fallbackDir = path.join(documents, 'CCO Security Suite', 'exports');
    if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
    return fallbackDir;
  }
}

function getNonConflictingPath(targetDir, filename) {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext);

  let counter = 1;
  const matchSuffix = base.match(/^(.*)\s*\((\d+)\)$/);
  if (matchSuffix) {
    base = matchSuffix[1].trim();
    counter = parseInt(matchSuffix[2], 10);
  }

  // Verifica se o arquivo com o nome exato passado existe
  const directPath = path.join(targetDir, filename);
  if (!fs.existsSync(directPath)) {
    return { finalPath: directPath, finalFilename: filename };
  }

  // Se já existe, procura o próximo índice sequencial (counter + 1, ...)
  while (true) {
    counter++;
    const candidateFilename = `${base} (${counter})${ext}`;
    const candidatePath = path.join(targetDir, candidateFilename);
    if (!fs.existsSync(candidatePath)) {
      return { finalPath: candidatePath, finalFilename: candidateFilename };
    }
  }
}

// Handler nativo para exportação em PDF idêntica à impressão via Chromium printToPDF
ipcMain.handle('app:salvarPdfNativo', async (event, { nomeSugerido, paisagem = true, caminhoRede } = {}) => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (!win) throw new Error('Janela do aplicativo não encontrada');

    const pdfBuffer = await win.webContents.printToPDF({
      landscape: paisagem,
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4'
    });

    const targetDir = getResolvedConfiguredExportDir(caminhoRede);
    const defaultName = nomeSugerido || `Dashboard_Executivo_CCO_${new Date().toISOString().slice(0, 10)}.pdf`;

    const { finalPath, finalFilename } = getNonConflictingPath(targetDir, defaultName);
    
    let savedInPrimary = false;
    try {
      fs.writeFileSync(finalPath, pdfBuffer);
      savedInPrimary = true;
    } catch (writeErr) {
      console.warn('[Electron IPC] Falha ao salvar no diretório primário:', writeErr.message);
    }

    // Cópia de redundância no diretório padrão seguro exports (sem conflito)
    let backupPath = null;
    try {
      const documents = app.getPath('documents');
      const backupDir = path.join(documents, 'CCO Security Suite', 'exports');
      if (backupDir !== targetDir || !savedInPrimary) {
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const { finalPath: safeBackupPath } = getNonConflictingPath(backupDir, finalFilename);
        fs.writeFileSync(safeBackupPath, pdfBuffer);
        backupPath = safeBackupPath;
      }
    } catch (e) {}

    const resolvedFinalPath = savedInPrimary ? finalPath : (backupPath || finalPath);
    const resolvedDir = savedInPrimary ? targetDir : (backupPath ? path.dirname(backupPath) : targetDir);

    return {
      sucesso: true,
      caminho: resolvedFinalPath,
      diretorio: resolvedDir,
      nomeArquivo: finalFilename,
      fallback: !savedInPrimary
    };
  } catch (err) {
    console.error('[Electron IPC] Erro ao gerar PDF nativo via printToPDF:', err);
    return { sucesso: false, error: err.message };
  }
});

ipcMain.handle('shell:abrirPasta', async (event, folderPath) => {
  try {
    const documents = app.getPath('documents');
    const defaultExports = path.join(documents, 'CCO Security Suite', 'exports');
    let targetDir = defaultExports;

    if (folderPath && typeof folderPath === 'string' && folderPath.trim()) {
      const trimmed = folderPath.trim();
      let resolved = path.isAbsolute(trimmed) ? trimmed : path.join(documents, 'CCO Security Suite', trimmed);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        resolved = path.dirname(resolved);
      }
      targetDir = resolved;
    }

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

/**
 * Exibe a janela de ativação de segurança quando o software não possuir licença válida
 * ou estiver rodando pela primeira vez nesta máquina.
 */
function showActivationWindow() {
  return new Promise((resolve) => {
    const appIconPath = fs.existsSync(path.join(__dirname, '../public/shield.ico'))
      ? path.join(__dirname, '../public/shield.ico')
      : (fs.existsSync(path.join(__dirname, '../build/icon.ico'))
          ? path.join(__dirname, '../build/icon.ico')
          : path.join(__dirname, '../public/icon.ico'));

    activationWindow = new BrowserWindow({
      width: 580,
      height: 640,
      resizable: false,
      maximizable: false,
      minimizable: true,
      title: 'CCO Security Suite — Ativação de Segurança & Licenciamento (Rev 1.2)',
      icon: appIconPath,
      backgroundColor: '#020617',
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    activationWindow.loadFile(path.join(__dirname, 'activation.html'));

    activationWindow.once('ready-to-show', () => {
      activationWindow.show();
      activationWindow.focus();
    });

    let activatedSuccessfully = false;

    ipcMain.handle('licensing:obterHwid', () => {
      return licensingHelper.obterHwidLocal();
    });

    const handleAtivar = (event, senha) => {
      const resultado = licensingHelper.ativarLicencaComSenha(senha, app);
      if (resultado && resultado.sucesso) {
        activatedSuccessfully = true;
        setTimeout(() => {
          if (activationWindow && !activationWindow.isDestroyed()) {
            activationWindow.close();
          }
          ipcMain.removeHandler('licensing:ativar');
          ipcMain.removeHandler('licensing:obterHwid');
          resolve(true);
        }, 800);
      }
      return resultado;
    };

    ipcMain.handle('licensing:ativar', handleAtivar);

    ipcMain.once('licensing:cancelar', () => {
      if (activationWindow && !activationWindow.isDestroyed()) {
        activationWindow.close();
      }
      app.quit();
    });

    activationWindow.on('closed', () => {
      activationWindow = null;
      if (!activatedSuccessfully) {
        app.quit();
      }
    });
  });
}

app.whenReady().then(async () => {
  // 1. Checagem de Licença e Vinculação de Hardware (HWID Binding)
  const statusLicenca = licensingHelper.verificarStatusLicenca(app);

  if (statusLicenca.status === 'HWID_MISMATCH') {
    // Violação de cópia para outro computador detectada!
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Violação de Licença - CCO Security Suite',
      message: 'Erro de Violação de Licença / Cópia Não Autorizada',
      detail: `Esta cópia do software foi ativada para outro computador e não possui autorização para execução neste hardware.\n\nHardware Autorizado: ${statusLicenca.savedHwid}\nHardware Desta Estação: ${statusLicenca.currentHwid}\n\nO aplicativo será encerrado imediatamente para proteger a integridade do sistema.`
    });
    app.exit(1);
    return;
  }

  if (statusLicenca.status === 'NOT_ACTIVATED') {
    // Primeira execução, ambiente limpo ou formatação na mesma máquina -> Solicita Chave de Ativação
    console.log('[Licensing] Licença pendente de ativação. Abrindo janela de ativação...');
    const ativado = await showActivationWindow();
    if (!ativado) {
      app.quit();
      return;
    }
  }

  // 2. Se a licença estiver válida, inicializa a aplicação normalmente
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

