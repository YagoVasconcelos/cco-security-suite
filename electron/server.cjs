// Servidor Local Embutido para Produção no Electron (Node.js)
// Provê persistência em arquivos locais (JSON / XLSX / PDF) e serve o frontend compilado (dist)
const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const cryptoHelper = require('./cryptoHelper.cjs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function initializeCleanDataIfMissing(dataDir, rootDir) {
  const possibleTemplatePaths = [
    path.join(dataDir, 'database_template.json'),
    path.join(rootDir, 'data', 'database_template.json'),
    path.join(rootDir, 'templates', 'database_template.json'),
    path.join(__dirname, '../data/database_template.json'),
    path.join(process.resourcesPath || '', 'data/database_template.json'),
    path.join(process.resourcesPath || '', 'templates/database_template.json')
  ];

  let template = {};
  for (const tPath of possibleTemplatePaths) {
    if (tPath && fs.existsSync(tPath)) {
      try {
        template = JSON.parse(fs.readFileSync(tPath, 'utf-8'));
        break;
      } catch (e) {}
    }
  }

  const defaultFiles = {
    'ocorrencias.json': template.ocorrencias || [],
    'provisorios.json': template.provisorios || [],
    'visitantes.json': template.visitantes || [],
    'rfid.json': template.rfid || [],
    'seguranca.json': template.seguranca || cryptoHelper.gerarRegistroSeguro('admin123'),
    'responsaveis.json': template.responsaveis || {
      gerenteSite: 'Gerência de Operações',
      coordenacao: 'Coordenação de Segurança Corporativa',
      fiscalContrato: 'Fiscalização de Contrato',
      caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
    },
    'operadores.json': Array.isArray(template.operadores) ? template.operadores : [],
    'vigilantes.json': template.vigilantes && template.vigilantes.length > 0 ? template.vigilantes : [
      { id: 'vig-1', nome: 'Vigilante Portaria 1', matricula: 'VIG-2001', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Portaria 1', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto principal de controle de acesso (P1)', dataCadastro: '2026-01-01' },
      { id: 'vig-2', nome: 'Vigilante Portaria 2', matricula: 'VIG-2002', posto: 'Portaria 2 - Cargas & Serviços', cargo: 'Vigilante Portaria 2', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto de controle de acesso de serviços / carga (P2)', dataCadastro: '2026-01-01' },
      { id: 'vig-3', nome: 'Vigilante Ronda', matricula: 'VIG-2003', posto: 'Ronda Operacional', cargo: 'Vigilante Ronda', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Ronda perimetral e fiscalização móvel', dataCadastro: '2026-01-01' }
    ],
    'turnos.json': template.turnos && template.turnos.length > 0 ? template.turnos : [
      { id: 'turno-1', nome: '12x36 Diurno', descricao: 'Escala operacional diurna 12h', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'turno-2', nome: '12x36 Noturno', descricao: 'Escala operacional noturna 12h', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'turno-3', nome: 'Administrativo', descricao: 'Horário comercial', status: 'Ativo', dataCadastro: '2026-01-01' }
    ],
    'observacoes.json': template.observacoes && template.observacoes.length > 0 ? template.observacoes : [
      { id: 'obs-1', nome: 'ESQUECEU', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'obs-2', nome: 'PERDEU', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'obs-3', nome: 'COM DEFEITO', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'obs-4', nome: 'RETIDO', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'obs-5', nome: 'OUTROS', status: 'Ativo', dataCadastro: '2026-01-01' }
    ],
    'cargos.json': template.cargos && template.cargos.length > 0 ? template.cargos : [
      { id: 'cargo-1', nome: 'Operador CCO', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-2', nome: 'Operador CCO Líder', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-3', nome: 'Supervisor CCO', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-4', nome: 'Administrador / Gestor CCO', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-5', nome: 'Vigilante Portaria 1', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-6', nome: 'Vigilante Portaria 2', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-7', nome: 'Vigilante Ronda', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-8', nome: 'Vigilante CFTV Campo', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'cargo-9', nome: 'Inspetor de Segurança de Campo', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
    ],
    'sugestoes_observacoes.json': template.sugestoes_observacoes && template.sugestoes_observacoes.length > 0 ? template.sugestoes_observacoes : [
      { id: 'sobs-1', texto: 'Operador autorizado a emitir e assinar relatórios de ocorrência (RO)', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'sobs-2', texto: 'Responsável pelo monitoramento e despacho de viaturas no plantão', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'sobs-3', texto: 'Posto principal de controle de acesso de colaboradores e terceiros (P1)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'sobs-4', texto: 'Posto de controle de acesso de veículos pesados, carretas e cargas (P2)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'sobs-5', texto: 'Ronda perimetral móvel e fiscalização ostensiva de áreas críticas', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'sobs-6', texto: 'Apoio tático operacional e cobertura de intervalos nas portarias', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
    ]
  };

  for (const [file, defaultData] of Object.entries(defaultFiles)) {
    const target = path.join(dataDir, file);
    if (!fs.existsSync(target)) {
      try {
        fs.writeFileSync(target, JSON.stringify(defaultData, null, 2), 'utf-8');
      } catch (err) {
        console.warn(`[Server] Erro ao inicializar ${file}:`, err.message);
      }
    }
  }
}

function getSafeExportDirectory(configuredPath, documentsDir, userDataDir, rootDir) {
  // Se o usuário configurou um caminho personalizado (ex: tela de Configurações)
  if (configuredPath && typeof configuredPath === 'string' && configuredPath.trim()) {
    let trimmed = configuredPath.trim();
    const agora = new Date();
    const ano = String(agora.getFullYear());
    const mesNum = String(agora.getMonth() + 1).padStart(2, '0');
    const mesesNomes = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const mesNome = mesesNomes[agora.getMonth()];
    const periodoSubpasta = path.join(ano, `${mesNum}.${mesNome}`);

    trimmed = trimmed
      .replace(/\{ANO\}/gi, ano)
      .replace(/\{MES\}/gi, mesNum)
      .replace(/\{MES_NOME\}/gi, mesNome);

    let baseDir = '';
    // Se for caminho absoluto (C:\... ou D:\...) ou caminho de rede UNC (\\servidor\compartilhamento)
    if (path.isAbsolute(trimmed) || trimmed.startsWith('\\\\')) {
      baseDir = trimmed;
    } else {
      // Se for relativo (ex: 'MAPA DE CALOR/2026/09.SETEMBRO'), resolve dentro da pasta Documentos do usuário
      const docBase = documentsDir || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents') : rootDir);
      baseDir = path.join(docBase, 'CCO Security Suite', trimmed);
    }

    // Se o caminho configurado não possuir ano nem mês corrente na estrutura, organiza na subpasta de período
    const baseNormalized = baseDir.toUpperCase();
    if (!baseNormalized.includes(ano) && !baseNormalized.includes(mesNome)) {
      baseDir = path.join(baseDir, periodoSubpasta);
    }

    try {
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
      const testFile = path.join(baseDir, `.test_write_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return baseDir;
    } catch (err) {
      console.warn(`[Server] Caminho configurado (${baseDir}) inacessível ou sem permissão:`, err.message);
    }
  }

  // Diretório padrão seguro do Windows: Documents/CCO Security Suite/exports
  const candidates = [
    documentsDir ? path.join(documentsDir, 'CCO Security Suite', 'exports') : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'CCO Security Suite', 'exports') : null,
    userDataDir ? path.join(userDataDir, 'exports') : null,
    path.join(rootDir, 'exports')
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const testFile = path.join(dir, `.test_write_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return dir;
    } catch (e) {
      console.warn(`[Server] Candidato a diretório sem permissão de escrita (${dir}):`, e.message);
    }
  }

  return path.join(rootDir, 'data');
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

function startServer(options = {}) {
  return new Promise((resolve, reject) => {
    const opts = typeof options === 'number' ? { port: options } : (options || {});
    const rootDir = opts.rootDir || path.resolve(__dirname, '..');
    const port = opts.port || 3000;
    const staticDir = opts.staticDir || path.join(rootDir, 'dist-react');

    // Normaliza diretórios padrão seguros caso não tenham sido passados
    const resolvedDocumentsDir = opts.documentsDir || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents') : null);
    const resolvedUserDataDir = opts.userDataDir || (process.env.APPDATA ? path.join(process.env.APPDATA, 'cco-security-suite') : path.join(rootDir, 'data'));

    const dataDir = path.join(rootDir, 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.warn('[Server] Falha ao criar dataDir na raiz, usando userData:', err.message);
      }
    }

    // Inicializa banco de dados com templates limpos caso ainda não existam
    initializeCleanDataIfMissing(dataDir, rootDir);

    const server = http.createServer(async (req, res) => {
      // CORS headers para chamadas locais
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = urlObj.pathname;

      // ====================================================
      // ROTAS DE API DO CCO SECURITY SUITE (/api/*)
      // ====================================================

      // 1. Status da API & Diretório Padrão
      if (pathname === '/api/status' && req.method === 'GET') {
        const defaultExportDir = getSafeExportDirectory(null, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'online',
          mode: 'electron',
          timestamp: new Date().toISOString(),
          defaultExportDir
        }));
        return;
      }

      // 1.1 Rota de Consulta do Diretório Seguro Padrão
      if (pathname === '/api/diretorio-padrao' && req.method === 'GET') {
        const defaultExportDir = getSafeExportDirectory(null, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          defaultExportDir,
          documentsDir: resolvedDocumentsDir || '',
          userDataDir: resolvedUserDataDir || ''
        }));
        return;
      }

      // 1.2 Rota para Validar Permissão de Escrita em Diretório
      if (pathname === '/api/validar-diretorio' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          const caminho = (body.caminho || '').trim();
          if (!caminho) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: false, error: 'Caminho não fornecido.' }));
            return;
          }
          const safeResolved = getSafeExportDirectory(caminho, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ valid: true, resolvedDir: safeResolved }));
          return;
        } catch (err) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ valid: false, error: 'Permissão de disco negada: ' + err.message }));
          return;
        }
      }

      // 2. Ocorrências - POST /api/salvar-ocorrencia
      if (pathname === '/api/salvar-ocorrencia' && req.method === 'POST') {
        try {
          const novaOcorrencia = await parseJsonBody(req);
          if (!novaOcorrencia.numeroRO) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'numeroRO ausente.' }));
            return;
          }

          const dataJsonPath = path.join(dataDir, 'ocorrencias.json');
          const rootJsonPath = path.join(rootDir, 'ocorrencias.json');
          const rootXlsxPath = path.join(rootDir, 'ocorrencias.xlsx');

          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }

          lista = lista.filter(o => o.id !== novaOcorrencia.id && o.numeroRO !== novaOcorrencia.numeroRO);
          lista.unshift(novaOcorrencia);

          const jsonStr = JSON.stringify(lista, null, 2);
          try { fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8'); } catch (e) {}
          try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

          const savedPaths = [dataJsonPath];
          const primaryExportDir = getSafeExportDirectory(null, resolvedDocumentsDir, resolvedUserDataDir, rootDir);

          // Atualiza planilha Excel se XLSX disponível (na raiz e na pasta segura de Documentos)
          try {
            const linhasXlsx = lista.map(o => ({
              'Nº RO': o.numeroRO,
              'Data': o.data,
              'Hora': o.hora,
              'Local': o.local,
              'Gravidade': o.gravidade,
              'Título': o.titulo,
              'Descrição': o.descricao,
              'Qtd Envolvidos': Array.isArray(o.envolvidos) ? o.envolvidos.length : 0,
              'Nomes Envolvidos': Array.isArray(o.envolvidos) ? o.envolvidos.map(e => e.nome).join('; ') : '',
              'Qtd Fotos': Array.isArray(o.fotos) ? o.fotos.length : 0,
              'Arquivo PDF': o.nomeArquivoPdf || '',
              'Data de Cadastro': o.dataCadastro || new Date().toISOString()
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(linhasXlsx);
            XLSX.utils.book_append_sheet(wb, ws, 'Relatórios de Ocorrência');

            try {
              XLSX.writeFile(wb, rootXlsxPath);
              savedPaths.push(rootXlsxPath);
            } catch (rootErr) {}

            try {
              const exportXlsxPath = path.join(primaryExportDir, 'ocorrencias.xlsx');
              XLSX.writeFile(wb, exportXlsxPath);
              savedPaths.push(exportXlsxPath);
            } catch (expErr) {}
          } catch (xlsxErr) {
            console.warn('[Server] Aviso ao gerar Excel de ocorrências:', xlsxErr.message);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, total: lista.length, savedPaths }));
          return;
        } catch (err) {
          console.error('[Server] Erro ao salvar ocorrência:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Falha ao salvar ocorrência: ' + err.message }));
          return;
        }
      }

      // 3. Salvar PDF - POST /api/salvar-pdf
      if (pathname === '/api/salvar-pdf' && req.method === 'POST') {
        try {
          const { filename, base64Pdf, caminhoRede } = await parseJsonBody(req);
          if (!filename || !base64Pdf) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'filename e base64Pdf são obrigatórios.' }));
            return;
          }

          const cleanBase64 = base64Pdf.includes(',') ? base64Pdf.split(',')[1] : base64Pdf.replace(/^data:application\/pdf[^;]*;base64,/, '');
          const pdfBuffer = Buffer.from(cleanBase64, 'base64');

          const savedPaths = [];
          const warnings = [];

          // 1. Resolve o diretório configurado pelo usuário ou o padrão seguro
          const primaryDir = getSafeExportDirectory(caminhoRede, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
          const { finalPath: primaryFilePath, finalFilename } = getNonConflictingPath(primaryDir, filename);

          try {
            if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
            fs.writeFileSync(primaryFilePath, pdfBuffer);
            savedPaths.push(primaryFilePath);
          } catch (priErr) {
            console.error('[Server] Erro ao salvar PDF no diretório configurado:', priErr);
            warnings.push(`Falha de permissão no diretório configurado (${primaryDir}): ${priErr.message}`);
          }

          // 2. Grava cópia de segurança redundante em Documents/CCO Security Suite/exports
          const backupDir = getSafeExportDirectory(null, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
          if (backupDir && backupDir !== primaryDir) {
            try {
              if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
              const backupFilePath = path.join(backupDir, finalFilename);
              fs.writeFileSync(backupFilePath, pdfBuffer);
              savedPaths.push(backupFilePath);
            } catch (bkpErr) {}
          }

          // 3. Tenta espelhar na pasta exports da raiz se for gravável
          try {
            const rootExports = path.join(rootDir, 'exports');
            if (rootExports !== primaryDir && rootExports !== backupDir && fs.existsSync(rootExports)) {
              const rootFilePath = path.join(rootExports, finalFilename);
              fs.writeFileSync(rootFilePath, pdfBuffer);
            }
          } catch (e) {}

          if (savedPaths.length === 0) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Falha de permissão de disco: Não foi possível salvar o arquivo PDF em nenhum diretório do computador.',
              warnings
            }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            savedPaths,
            primaryPath: savedPaths[0],
            filename: finalFilename,
            warnings: warnings.length > 0 ? warnings : undefined
          }));
          return;
        } catch (err) {
          console.error('[Server] Erro inesperado em /api/salvar-pdf:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Erro inesperado ao salvar PDF: ' + err.message }));
          return;
        }
      }

      // 4. Salvar Excel - POST /api/salvar-excel
      if (pathname === '/api/salvar-excel' && req.method === 'POST') {
        try {
          const { filename, base64Excel, caminhoRede } = await parseJsonBody(req);
          if (!filename || !base64Excel) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'filename e base64Excel são obrigatórios.' }));
            return;
          }

          const cleanBase64 = base64Excel.replace(/^data:.*?;base64,/, '');
          const excelBuffer = Buffer.from(cleanBase64, 'base64');

          const savedPaths = [];
          const warnings = [];

          // 1. Grava no diretório seguro padrão em Documentos do Windows
          const primaryDir = getSafeExportDirectory(null, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
          try {
            if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
            const primaryFilePath = path.join(primaryDir, filename);
            fs.writeFileSync(primaryFilePath, excelBuffer);
            savedPaths.push(primaryFilePath);
          } catch (priErr) {
            console.error('[Server] Erro ao salvar Excel no diretório seguro:', priErr);
            warnings.push(`Falha de permissão no diretório local (${primaryDir}): ${priErr.message}`);
          }

          // 2. Se houver caminho de rede ou pasta personalizada, grava cópia adicional
          if (caminhoRede && typeof caminhoRede === 'string' && caminhoRede.trim()) {
            try {
              const customDir = getSafeExportDirectory(caminhoRede, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
              if (customDir && customDir !== primaryDir) {
                if (!fs.existsSync(customDir)) fs.mkdirSync(customDir, { recursive: true });
                const customFilePath = path.join(customDir, filename);
                fs.writeFileSync(customFilePath, excelBuffer);
                savedPaths.push(customFilePath);
              }
            } catch (customErr) {
              console.warn('[Server] Falha ao salvar Excel no caminho de rede:', customErr.message);
              warnings.push(`Não foi possível salvar Excel na pasta de rede (${caminhoRede}): ${customErr.message}. Cópia salva com segurança em Documentos.`);
            }
          }

          // 3. Tenta espelhar na pasta exports da raiz se for gravável
          try {
            const rootExports = path.join(rootDir, 'exports');
            if (rootExports !== primaryDir && fs.existsSync(rootExports)) {
              const rootFilePath = path.join(rootExports, filename);
              fs.writeFileSync(rootFilePath, excelBuffer);
            }
          } catch (e) {}

          if (savedPaths.length === 0) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Falha de permissão de disco: Não foi possível salvar o arquivo Excel em nenhum diretório do computador.',
              warnings
            }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            savedPaths,
            primaryPath: savedPaths[0],
            warnings: warnings.length > 0 ? warnings : undefined
          }));
          return;
        } catch (err) {
          console.error('[Server] Erro inesperado em /api/salvar-excel:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Erro inesperado ao salvar Excel: ' + err.message }));
          return;
        }
      }

      // 5. Ocorrências - GET /api/ocorrencias
      if (pathname === '/api/ocorrencias' && req.method === 'GET') {
        const dataJsonPath = path.join(dataDir, 'ocorrencias.json');
        let lista = [];
        if (fs.existsSync(dataJsonPath)) {
          try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
        }
        if (!Array.isArray(lista)) lista = [];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(lista));
        return;
      }

      // 6. Operadores - GET e POST /api/operadores e /api/salvar-operadores
      if (pathname === '/api/operadores' || pathname === '/api/salvar-operadores') {
        const dataJsonPath = path.join(dataDir, 'operadores.json');
        const rootJsonPath = path.join(rootDir, 'operadores.json');
        const rootXlsxPath = path.join(rootDir, 'operadores.xlsx');
        const exportsDir = path.join(rootDir, 'exports');
        const exportXlsxPath = path.join(exportsDir, 'operadores.xlsx');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(path.join(dataDir, 'database.json'))) {
            try {
              const banco = JSON.parse(fs.readFileSync(path.join(dataDir, 'database.json'), 'utf-8'));
              if (Array.isArray(banco.operadores) && banco.operadores.length > 0) lista = banco.operadores;
            } catch (e) {}
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista)) {
            lista = [];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const listaOperadores = Array.isArray(body) ? body : (body.operadores || []);
            if (!Array.isArray(listaOperadores)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de operadores inválido.' }));
              return;
            }

            const jsonStr = JSON.stringify(listaOperadores, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

            // Atualiza também data/database.json
            try {
              const dbJsonPath = path.join(dataDir, 'database.json');
              if (fs.existsSync(dbJsonPath)) {
                const banco = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
                banco.operadores = listaOperadores;
                fs.writeFileSync(dbJsonPath, JSON.stringify(banco, null, 2), 'utf-8');
              }
            } catch (dbErr) {
              console.warn('[Server] Falha ao atualizar database.json com operadores:', dbErr.message);
            }

            // Gera e salva a planilha Excel (.xlsx) na raiz e em exports/
            try {
              if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
              }
              const linhasXlsx = listaOperadores.map((op, idx) => ({
                'Nº': idx + 1,
                'Nome / Identificação': op.nome || '',
                'Matrícula': op.matricula || '',
                'Cargo / Função': op.cargo || 'Operador CCO',
                'Turno': op.turno || '12x36',
                'Status': op.status || 'Ativo',
                'Observações': op.observacoes || '',
                'Data Cadastro': op.dataCadastro || new Date().toISOString().split('T')[0]
              }));

              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(linhasXlsx);
              XLSX.utils.book_append_sheet(wb, ws, 'Operadores CCO');
              XLSX.writeFile(wb, rootXlsxPath);
              XLSX.writeFile(wb, exportXlsxPath);
            } catch (xlsxErr) {
              console.warn('[Server] Aviso ao gerar planilha de operadores:', xlsxErr.message);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Operadores salvos com sucesso em JSON e Excel!',
              total: listaOperadores.length
            }));
            return;
          } catch (err) {
            console.error('[Server] Erro ao salvar operadores:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 6.1. Vigilantes de Posto - GET e POST /api/vigilantes e /api/salvar-vigilantes
      if (pathname === '/api/vigilantes' || pathname === '/api/salvar-vigilantes') {
        const dataJsonPath = path.join(dataDir, 'vigilantes.json');
        const rootJsonPath = path.join(rootDir, 'vigilantes.json');
        const rootXlsxPath = path.join(rootDir, 'vigilantes.xlsx');
        const exportsDir = path.join(rootDir, 'exports');
        const exportXlsxPath = path.join(exportsDir, 'vigilantes.xlsx');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(path.join(dataDir, 'database.json'))) {
            try {
              const banco = JSON.parse(fs.readFileSync(path.join(dataDir, 'database.json'), 'utf-8'));
              if (Array.isArray(banco.vigilantes) && banco.vigilantes.length > 0) lista = banco.vigilantes;
            } catch (e) {}
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista) || lista.length === 0) {
            lista = [
              { id: 'vig-1', nome: 'Vigilante Portaria 1', matricula: 'VIG-2001', posto: 'Portaria 1 - Principal', cargo: 'Vigilante Portaria 1', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto principal de controle de acesso (P1)', dataCadastro: '2026-01-01' },
              { id: 'vig-2', nome: 'Vigilante Portaria 2', matricula: 'VIG-2002', posto: 'Portaria 2 - Cargas & Serviços', cargo: 'Vigilante Portaria 2', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto de controle de acesso de serviços / carga (P2)', dataCadastro: '2026-01-01' },
              { id: 'vig-3', nome: 'Vigilante Ronda', matricula: 'VIG-2003', posto: 'Ronda Operacional', cargo: 'Vigilante Ronda', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Ronda perimetral e fiscalização móvel', dataCadastro: '2026-01-01' }
            ];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const listaVigilantes = Array.isArray(body) ? body : (body.vigilantes || []);
            if (!Array.isArray(listaVigilantes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de vigilantes inválido.' }));
              return;
            }

            const jsonStr = JSON.stringify(listaVigilantes, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

            // Atualiza também data/database.json
            try {
              const dbJsonPath = path.join(dataDir, 'database.json');
              if (fs.existsSync(dbJsonPath)) {
                const banco = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
                banco.vigilantes = listaVigilantes;
                fs.writeFileSync(dbJsonPath, JSON.stringify(banco, null, 2), 'utf-8');
              }
            } catch (dbErr) {
              console.warn('[Server] Falha ao atualizar database.json com vigilantes:', dbErr.message);
            }

            // Gera e salva a planilha Excel (.xlsx) na raiz e em exports/
            try {
              if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
              }
              const linhasXlsx = listaVigilantes.map((v, idx) => ({
                'Nº': idx + 1,
                'Nome Completo': v.nome || '',
                'Matrícula': v.matricula || '',
                'Posto Físico': v.posto || v.cargo || 'Portaria',
                'Cargo / Função': v.cargo || 'Vigilante',
                'Turno': v.turno || '12x36',
                'Status': v.status || 'Ativo',
                'Observações': v.observacoes || '',
                'Data Cadastro': v.dataCadastro || new Date().toISOString().split('T')[0]
              }));

              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(linhasXlsx);
              XLSX.utils.book_append_sheet(wb, ws, 'Efetivo Vigilância de Posto');
              XLSX.writeFile(wb, rootXlsxPath);
              XLSX.writeFile(wb, exportXlsxPath);
            } catch (xlsxErr) {
              console.warn('[Server] Aviso ao gerar planilha de vigilantes:', xlsxErr.message);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Vigilantes salvos com sucesso em JSON e Excel!',
              total: listaVigilantes.length
            }));
            return;
          } catch (err) {
            console.error('[Server] Erro ao salvar vigilantes:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 7. Segurança - GET /api/seguranca, POST /api/validar-senha e POST /api/salvar-senha
      if (pathname === '/api/seguranca' || pathname === '/api/salvar-senha' || pathname === '/api/validar-senha' || pathname === '/api/seguranca/validar') {
        const dataJsonPath = path.join(dataDir, 'seguranca.json');
        const rootJsonPath = path.join(rootDir, 'seguranca.json');

        // GET /api/seguranca -> Retorna metadados de auditoria (sem senhas ou hashes)
        if (req.method === 'GET' && pathname === '/api/seguranca') {
          const seguranca = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath);
          const metadados = cryptoHelper.obterMetadadosPublicos(seguranca);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(metadados));
          return;
        }

        // POST /api/validar-senha (ou /api/seguranca/validar) -> Validação no servidor
        if (req.method === 'POST' && (pathname === '/api/validar-senha' || pathname === '/api/seguranca/validar')) {
          try {
            const body = await parseJsonBody(req);
            const senhaDigitada = (body.senha || body.senhaMestra || '').trim();

            const seguranca = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath);
            const valido = cryptoHelper.verificarSenha(senhaDigitada, seguranca);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              valido,
              message: valido ? 'Autenticação autorizada com sucesso.' : 'Senha mestra incorreta.'
            }));
            return;
          } catch (err) {
            console.error('[Server] Erro ao validar senha:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // POST /api/salvar-senha (ou /api/seguranca) -> Alteração com Hash Criptográfico
        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const novaSenha = (body.novaSenha || body.senha || '').trim();
            const senhaAtual = body.senhaAtual;

            if (!novaSenha || novaSenha.length < 4) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'A nova senha deve possuir pelo menos 4 caracteres.' }));
              return;
            }

            const segurancaAtual = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath);

            if (senhaAtual !== undefined) {
              const ok = cryptoHelper.verificarSenha(senhaAtual, segurancaAtual);
              if (!ok) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'A senha mestra atual informada está incorreta.' }));
                return;
              }
            }

            const novoRegistro = cryptoHelper.gerarRegistroSeguro(novaSenha);
            cryptoHelper.salvarEmDisco(dataJsonPath, rootJsonPath, novoRegistro);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Senha mestra alterada e blindada com sucesso!',
              dataAtualizacao: novoRegistro.dataAtualizacao
            }));
            return;
          } catch (err) {
            console.error('[Server] Erro ao salvar senha:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 8. Turnos - GET e POST /api/turnos e /api/salvar-turnos
      if (pathname === '/api/turnos' || pathname === '/api/salvar-turnos') {
        const dataJsonPath = path.join(dataDir, 'turnos.json');
        const rootJsonPath = path.join(rootDir, 'turnos.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista) || lista.length === 0) {
            lista = [
              { id: 'turno-1', nome: '12x36 Diurno', descricao: 'Escala operacional diurna 12h', status: 'Ativo' },
              { id: 'turno-2', nome: '12x36 Noturno', descricao: 'Escala operacional noturna 12h', status: 'Ativo' },
              { id: 'turno-3', nome: 'Administrativo', descricao: 'Horário comercial', status: 'Ativo' }
            ];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const turnos = Array.isArray(body) ? body : body.turnos;
            if (Array.isArray(turnos)) {
              const jsonStr = JSON.stringify(turnos, null, 2);
              fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
              try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: turnos.length }));
              return;
            }
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Array de turnos inválido.' }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 9. Observações - GET e POST /api/observacoes e /api/salvar-observacoes
      if (pathname === '/api/observacoes' || pathname === '/api/salvar-observacoes') {
        const dataJsonPath = path.join(dataDir, 'observacoes.json');
        const rootJsonPath = path.join(rootDir, 'observacoes.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista) || lista.length === 0) {
            lista = [
              { id: 'obs-1', nome: 'ESQUECEU', status: 'Ativo' },
              { id: 'obs-2', nome: 'PERDEU', status: 'Ativo' },
              { id: 'obs-3', nome: 'COM DEFEITO', status: 'Ativo' },
              { id: 'obs-4', nome: 'RETIDO', status: 'Ativo' },
              { id: 'obs-5', nome: 'OUTROS', status: 'Ativo' }
            ];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const obs = Array.isArray(body) ? body : body.observacoes;
            if (Array.isArray(obs)) {
              const jsonStr = JSON.stringify(obs, null, 2);
              fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
              try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: obs.length }));
              return;
            }
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Array de observações inválido.' }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 9.1. Cargos Sugeridos - GET e POST /api/cargos e /api/salvar-cargos
      if (pathname === '/api/cargos' || pathname === '/api/salvar-cargos') {
        const dataJsonPath = path.join(dataDir, 'cargos.json');
        const rootJsonPath = path.join(rootDir, 'cargos.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista) || lista.length === 0) {
            lista = [
              { id: 'cargo-1', nome: 'Operador CCO', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-2', nome: 'Operador CCO Líder', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-3', nome: 'Supervisor CCO', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-4', nome: 'Administrador / Gestor CCO', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-5', nome: 'Vigilante Portaria 1', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-6', nome: 'Vigilante Portaria 2', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-7', nome: 'Vigilante Ronda', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-8', nome: 'Vigilante CFTV Campo', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'cargo-9', nome: 'Inspetor de Segurança de Campo', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
            ];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const cargos = Array.isArray(body) ? body : body.cargos;
            if (Array.isArray(cargos)) {
              const jsonStr = JSON.stringify(cargos, null, 2);
              fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
              try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: cargos.length }));
              return;
            }
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Array de cargos inválido.' }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 9.2. Sugestões de Observação - GET e POST /api/sugestoes-observacoes e /api/salvar-sugestoes-observacoes
      if (pathname === '/api/sugestoes-observacoes' || pathname === '/api/salvar-sugestoes-observacoes') {
        const dataJsonPath = path.join(dataDir, 'sugestoes_observacoes.json');
        const rootJsonPath = path.join(rootDir, 'sugestoes_observacoes.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista) || lista.length === 0) {
            lista = [
              { id: 'sobs-1', texto: 'Operador autorizado a emitir e assinar relatórios de ocorrência (RO)', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'sobs-2', texto: 'Responsável pelo monitoramento e despacho de viaturas no plantão', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'sobs-3', texto: 'Posto principal de controle de acesso de colaboradores e terceiros (P1)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'sobs-4', texto: 'Posto de controle de acesso de veículos pesados, carretas e cargas (P2)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'sobs-5', texto: 'Ronda perimetral móvel e fiscalização ostensiva de áreas críticas', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
              { id: 'sobs-6', texto: 'Apoio tático operacional e cobertura de intervalos nas portarias', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
            ];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const sugestoes = Array.isArray(body) ? body : body.sugestoes;
            if (Array.isArray(sugestoes)) {
              const jsonStr = JSON.stringify(sugestoes, null, 2);
              fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
              try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: sugestoes.length }));
              return;
            }
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Array de sugestões inválido.' }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 9.3. Taxonomia de Prédios e Áreas - GET e POST /api/taxonomia-predios-areas e /api/salvar-taxonomia-predios-areas
      if (pathname === '/api/taxonomia-predios-areas' || pathname === '/api/salvar-taxonomia-predios-areas') {
        const dataJsonPath = path.join(dataDir, 'taxonomia_predios_areas.json');
        const rootJsonPath = path.join(rootDir, 'taxonomia_predios_areas.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista)) {
            lista = [];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const itens = Array.isArray(body) ? body : body.itens;
            if (Array.isArray(itens)) {
              const jsonStr = JSON.stringify(itens, null, 2);
              fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
              try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: itens.length }));
              return;
            }
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Array de taxonomia inválido.' }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 10. Responsáveis do Site - GET e POST /api/responsaveis e /api/salvar-responsaveis
      if (pathname === '/api/responsaveis' || pathname === '/api/salvar-responsaveis') {
        const dataJsonPath = path.join(dataDir, 'responsaveis.json');
        const rootJsonPath = path.join(rootDir, 'responsaveis.json');

        if (req.method === 'GET') {
          let dados = {
            gerenteSite: 'Gerência de Operações',
            coordenacao: 'Coordenação de Segurança Local - SERVIS',
            fiscalContrato: 'Fiscalização de Contrato',
            caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
          };
          if (fs.existsSync(dataJsonPath)) {
            try { dados = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) {}
          } else if (fs.existsSync(rootJsonPath)) {
            try { dados = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) {}
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(dados));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const jsonStr = JSON.stringify(body, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 11. Provisórios - GET e POST /api/provisorios e /api/salvar-provisorios
      if (pathname === '/api/provisorios' || pathname === '/api/salvar-provisorios') {
        const dataJsonPath = path.join(dataDir, 'provisorios.json');
        const rootJsonPath = path.join(rootDir, 'provisorios.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista)) lista = [];
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const provisorios = Array.isArray(body) ? body : (body.provisorios || []);
            if (!Array.isArray(provisorios)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de provisórios inválido.' }));
              return;
            }

            const jsonStr = JSON.stringify(provisorios, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: provisorios.length }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 12. Visitantes - GET e POST /api/visitantes e /api/salvar-visitantes
      if (pathname === '/api/visitantes' || pathname === '/api/salvar-visitantes') {
        const dataJsonPath = path.join(dataDir, 'visitantes.json');
        const rootJsonPath = path.join(rootDir, 'visitantes.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista)) lista = [];
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const visitantes = Array.isArray(body) ? body : (body.visitantes || []);
            if (!Array.isArray(visitantes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de visitantes inválido.' }));
              return;
            }

            const jsonStr = JSON.stringify(visitantes, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: visitantes.length }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // 13. RFID - GET e POST /api/rfid e /api/salvar-rfid
      if (pathname === '/api/rfid' || pathname === '/api/salvar-rfid') {
        const dataJsonPath = path.join(dataDir, 'rfid.json');
        const rootJsonPath = path.join(rootDir, 'rfid.json');

        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          } else if (fs.existsSync(rootJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista)) lista = [];
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }

        if (req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const cartoes = Array.isArray(body) ? body : (body.cartoes || body.rfid || []);
            if (!Array.isArray(cartoes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de cartões RFID inválido.' }));
              return;
            }

            const jsonStr = JSON.stringify(cartoes, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: cartoes.length }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
      }

      // ====================================================
      // 18. MÓDULO DE BACKUP & RESTAURAÇÃO COM MERGE INTELIGENTE
      // ====================================================

      // 18.1 Coleta de todos os dados locais do sistema para Backup
      if (pathname === '/api/backup/coletar' && req.method === 'GET') {
        try {
          const lerJsonSeguro = (nomeArquivo, padrao = []) => {
            const dataP = path.join(dataDir, nomeArquivo);
            const rootP = path.join(rootDir, nomeArquivo);
            if (fs.existsSync(dataP)) {
              try { return JSON.parse(fs.readFileSync(dataP, 'utf-8')); } catch (e) {}
            }
            if (fs.existsSync(rootP)) {
              try { return JSON.parse(fs.readFileSync(rootP, 'utf-8')); } catch (e) {}
            }
            return padrao;
          };

          const ocorrencias = lerJsonSeguro('ocorrencias.json', []);
          const provisorios = lerJsonSeguro('provisorios.json', []);
          const visitantes = lerJsonSeguro('visitantes.json', []);
          const operadores = lerJsonSeguro('operadores.json', []);
          const vigilantes = lerJsonSeguro('vigilantes.json', []);
          const turnos = lerJsonSeguro('turnos.json', []);
          const observacoes = lerJsonSeguro('observacoes.json', []);
          const responsaveis = lerJsonSeguro('responsaveis.json', {});
          const rfid = lerJsonSeguro('rfid.json', []);
          const seguranca = lerJsonSeguro('seguranca.json', {});

          const backupPayload = {
            sistema: 'CCO Security Suite',
            versao: '2.0',
            dataExportacao: new Date().toISOString(),
            geradoPor: 'TecPrimus Soluções Tecnológicas',
            estatisticas: {
              totalOcorrencias: Array.isArray(ocorrencias) ? ocorrencias.length : 0,
              totalProvisorios: Array.isArray(provisorios) ? provisorios.length : 0,
              totalVisitantes: Array.isArray(visitantes) ? visitantes.length : 0,
              totalOperadores: Array.isArray(operadores) ? operadores.length : 0,
              totalVigilantes: Array.isArray(vigilantes) ? vigilantes.length : 0,
              totalTurnos: Array.isArray(turnos) ? turnos.length : 0,
              totalObservacoes: Array.isArray(observacoes) ? observacoes.length : 0,
              totalRfid: Array.isArray(rfid) ? rfid.length : 0
            },
            dados: {
              ocorrencias: Array.isArray(ocorrencias) ? ocorrencias : [],
              provisorios: Array.isArray(provisorios) ? provisorios : [],
              visitantes: Array.isArray(visitantes) ? visitantes : [],
              operadores: Array.isArray(operadores) ? operadores : [],
              vigilantes: Array.isArray(vigilantes) ? vigilantes : [],
              turnos: Array.isArray(turnos) ? turnos : [],
              observacoes: Array.isArray(observacoes) ? observacoes : [],
              responsaveis: typeof responsaveis === 'object' && responsaveis !== null ? responsaveis : {},
              rfid: Array.isArray(rfid) ? rfid : [],
              seguranca: typeof seguranca === 'object' && seguranca !== null ? seguranca : {}
            }
          };

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(backupPayload));
          return;
        } catch (err) {
          console.error('[Server] Erro ao coletar dados para backup:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Falha ao coletar dados para backup: ' + err.message }));
          return;
        }
      }

      // 18.2 Restauração de Backup com Merge Inteligente (Anti-Duplicidade)
      if (pathname === '/api/backup/restaurar' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          const backupDados = body.dados || body;

          if (!backupDados || typeof backupDados !== 'object') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Arquivo de backup inválido ou sem seção de dados.' }));
            return;
          }

          const lerJsonSeguro = (nomeArquivo, padrao = []) => {
            const dataP = path.join(dataDir, nomeArquivo);
            const rootP = path.join(rootDir, nomeArquivo);
            if (fs.existsSync(dataP)) {
              try { return JSON.parse(fs.readFileSync(dataP, 'utf-8')); } catch (e) {}
            }
            if (fs.existsSync(rootP)) {
              try { return JSON.parse(fs.readFileSync(rootP, 'utf-8')); } catch (e) {}
            }
            return padrao;
          };

          const salvarJsonDuplo = (nomeArquivo, dados) => {
            const dataP = path.join(dataDir, nomeArquivo);
            const rootP = path.join(rootDir, nomeArquivo);
            const str = JSON.stringify(dados, null, 2);
            try { fs.writeFileSync(dataP, str, 'utf-8'); } catch (e) {}
            try { fs.writeFileSync(rootP, str, 'utf-8'); } catch (e) {}
          };

          // Função de fusão inteligente com chave única
          const executarMergeArray = (baseAtual, baseBackup, extrairChave) => {
            const atualLista = Array.isArray(baseAtual) ? [...baseAtual] : [];
            const backupLista = Array.isArray(baseBackup) ? baseBackup : [];
            const chavesExistentes = new Set();

            for (const item of atualLista) {
              const chave = extrairChave(item);
              if (chave) chavesExistentes.add(chave);
            }

            let novos = 0;
            let duplicadosEvitados = 0;
            const adicionados = [];

            for (const item of backupLista) {
              const chave = extrairChave(item);
              if (!chave) continue;
              if (chavesExistentes.has(chave)) {
                duplicadosEvitados++;
              } else {
                chavesExistentes.add(chave);
                adicionados.push(item);
                novos++;
              }
            }

            const listaFinal = [...atualLista, ...adicionados];
            return {
              listaFinal,
              novos,
              preservados: atualLista.length,
              duplicadosEvitados,
              total: listaFinal.length
            };
          };

          // 1. Ocorrências (Chave: numeroRO ou id)
          const ocorrenciasAtuais = lerJsonSeguro('ocorrencias.json', []);
          const resOcorrencias = executarMergeArray(
            ocorrenciasAtuais,
            backupDados.ocorrencias,
            (o) => (o.numeroRO && typeof o.numeroRO === 'string' && o.numeroRO.trim()) ? o.numeroRO.trim().toUpperCase() : String(o.id || '')
          );
          salvarJsonDuplo('ocorrencias.json', resOcorrencias.listaFinal);

          // Atualiza ocorrencias.xlsx
          try {
            const rootXlsxPath = path.join(rootDir, 'ocorrencias.xlsx');
            const primaryExportDir = getSafeExportDirectory(null, resolvedDocumentsDir, resolvedUserDataDir, rootDir);
            const exportXlsxPath = path.join(primaryExportDir, 'ocorrencias.xlsx');

            const linhasXlsx = resOcorrencias.listaFinal.map(o => ({
              'Nº RO': o.numeroRO,
              'Data': o.data,
              'Hora': o.hora,
              'Local': o.local,
              'Gravidade': o.gravidade,
              'Título': o.titulo,
              'Descrição': o.descricao,
              'Qtd Envolvidos': Array.isArray(o.envolvidos) ? o.envolvidos.length : 0,
              'Nomes Envolvidos': Array.isArray(o.envolvidos) ? o.envolvidos.map(e => e.nome).join('; ') : '',
              'Qtd Fotos': Array.isArray(o.fotos) ? o.fotos.length : 0,
              'Arquivo PDF': o.nomeArquivoPdf || '',
              'Data de Cadastro': o.dataCadastro || new Date().toISOString()
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(linhasXlsx);
            XLSX.utils.book_append_sheet(wb, ws, 'Relatórios de Ocorrência');
            try { XLSX.writeFile(wb, rootXlsxPath); } catch (e) {}
            try { XLSX.writeFile(wb, exportXlsxPath); } catch (e) {}
          } catch (xlsxErr) {
            console.warn('[Server] Erro ao sincronizar Excel de ocorrências após restauração:', xlsxErr.message);
          }

          // 2. Provisórios (Chave: id ou cartao+colaborador+data+hora)
          const provisoriosAtuais = lerJsonSeguro('provisorios.json', []);
          const resProvisorios = executarMergeArray(
            provisoriosAtuais,
            backupDados.provisorios,
            (p) => p.id ? String(p.id) : `${(p.cartao || '').trim().toUpperCase()}_${(p.colaborador || '').trim().toUpperCase()}_${p.dataRetirada || ''}_${p.horaRetirada || ''}`
          );
          salvarJsonDuplo('provisorios.json', resProvisorios.listaFinal);

          // 3. Visitantes (Chave: id ou doc+data+hora)
          const visitantesAtuais = lerJsonSeguro('visitantes.json', []);
          const resVisitantes = executarMergeArray(
            visitantesAtuais,
            backupDados.visitantes,
            (v) => v.id ? String(v.id) : `${(v.documento || '').replace(/\D/g, '')}_${v.dataEntrada || ''}_${v.horaEntrada || ''}`
          );
          salvarJsonDuplo('visitantes.json', resVisitantes.listaFinal);

          // 4. Operadores (Chave: matricula ou id ou nome)
          const operadoresAtuais = lerJsonSeguro('operadores.json', []);
          const resOperadores = executarMergeArray(
            operadoresAtuais,
            backupDados.operadores,
            (op) => (op.matricula && op.matricula !== 'N/A' && op.matricula.trim()) ? op.matricula.trim().toUpperCase() : (op.id ? String(op.id).trim().toUpperCase() : (op.nome || '').trim().toUpperCase())
          );
          salvarJsonDuplo('operadores.json', resOperadores.listaFinal);

          // 5. Vigilantes (Chave: matricula ou id ou nome)
          const vigilantesAtuais = lerJsonSeguro('vigilantes.json', []);
          const resVigilantes = executarMergeArray(
            vigilantesAtuais,
            backupDados.vigilantes,
            (vig) => (vig.matricula && vig.matricula !== 'N/A' && vig.matricula.trim()) ? vig.matricula.trim().toUpperCase() : (vig.id ? String(vig.id).trim().toUpperCase() : (vig.nome || '').trim().toUpperCase())
          );
          salvarJsonDuplo('vigilantes.json', resVigilantes.listaFinal);

          // 6. Turnos (Chave: nome normalizado ou id)
          const turnosAtuais = lerJsonSeguro('turnos.json', []);
          const resTurnos = executarMergeArray(
            turnosAtuais,
            backupDados.turnos,
            (t) => (t.nome || '').trim().toUpperCase() || String(t.id || '')
          );
          salvarJsonDuplo('turnos.json', resTurnos.listaFinal);

          // 7. Observações (Chave: nome normalizado ou id)
          const observacoesAtuais = lerJsonSeguro('observacoes.json', []);
          const resObservacoes = executarMergeArray(
            observacoesAtuais,
            backupDados.observacoes,
            (obs) => (obs.nome || '').trim().toUpperCase() || String(obs.id || '')
          );
          salvarJsonDuplo('observacoes.json', resObservacoes.listaFinal);

          // 8. RFID (Chave: numeroCartao ou codigoHex ou id)
          const rfidAtuais = lerJsonSeguro('rfid.json', []);
          const resRfid = executarMergeArray(
            rfidAtuais,
            backupDados.rfid,
            (r) => String(r.numeroCartao || r.codigoHex || r.id || '').trim().toUpperCase()
          );
          salvarJsonDuplo('rfid.json', resRfid.listaFinal);

          // 9. Responsáveis & Parâmetros (Preserva atuais, mescla valores ausentes)
          const responsaveisAtuais = lerJsonSeguro('responsaveis.json', {});
          const responsaveisBackup = (backupDados.responsaveis && typeof backupDados.responsaveis === 'object') ? backupDados.responsaveis : {};
          const responsaveisFinal = { ...responsaveisBackup, ...responsaveisAtuais };
          salvarJsonDuplo('responsaveis.json', responsaveisFinal);

          // 10. Segurança / Senha Mestra: Mantém a senha mestra atual do sistema
          const segurancaAtual = lerJsonSeguro('seguranca.json', {});

          const totalNovos = resOcorrencias.novos + resProvisorios.novos + resVisitantes.novos + resOperadores.novos + resVigilantes.novos + resTurnos.novos + resObservacoes.novos + resRfid.novos;
          const totalPreservados = resOcorrencias.preservados + resProvisorios.preservados + resVisitantes.preservados + resOperadores.preservados + resVigilantes.preservados + resTurnos.preservados + resObservacoes.preservados + resRfid.preservados;
          const totalDuplicadosEvitados = resOcorrencias.duplicadosEvitados + resProvisorios.duplicadosEvitados + resVisitantes.duplicadosEvitados + resOperadores.duplicadosEvitados + resVigilantes.duplicadosEvitados + resTurnos.duplicadosEvitados + resObservacoes.duplicadosEvitados + resRfid.duplicadosEvitados;

          const resposta = {
            success: true,
            mensagem: `Backup restaurado com sucesso! ${totalNovos} registros novos integrados, ${totalDuplicadosEvitados} duplicados evitados.`,
            detalhes: {
              ocorrencias: resOcorrencias,
              provisorios: resProvisorios,
              visitantes: resVisitantes,
              operadores: resOperadores,
              vigilantes: resVigilantes,
              turnos: resTurnos,
              observacoes: resObservacoes,
              rfid: resRfid,
              responsaveis: { atualizado: true },
              seguranca: { preservado: true }
            },
            totais: {
              totalNovos,
              totalPreservados,
              totalDuplicadosEvitados
            },
            dadosAtualizados: {
              ocorrencias: resOcorrencias.listaFinal,
              provisorios: resProvisorios.listaFinal,
              visitantes: resVisitantes.listaFinal,
              operadores: resOperadores.listaFinal,
              vigilantes: resVigilantes.listaFinal,
              turnos: resTurnos.listaFinal,
              observacoes: resObservacoes.listaFinal,
              rfid: resRfid.listaFinal,
              responsaveis: responsaveisFinal,
              seguranca: segurancaAtual
            }
          };

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(resposta));
          return;
        } catch (err) {
          console.error('[Server] Erro ao restaurar backup:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Falha durante a restauração do backup: ' + err.message }));
          return;
        }
      }

      // ====================================================
      // PROTEÇÃO CONTRA FALLBACK INDEVIDO DE ROTAS DE API
      // ====================================================
      if (pathname.startsWith('/api/')) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Rota de API não encontrada: ${pathname}` }));
        return;
      }

      // ====================================================
      // SERVIÇO DE ARQUIVOS ESTÁTICOS (dist/) COM SPA FALLBACK
      // ====================================================
      if (staticDir && fs.existsSync(staticDir)) {
        let filePath = path.join(staticDir, pathname === '/' ? 'index.html' : pathname);

        // Previne Directory Traversal
        if (!filePath.startsWith(staticDir)) {
          res.statusCode = 403;
          res.end('Acesso negado');
          return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          fs.createReadStream(filePath).pipe(res);
          return;
        }

        // SPA Fallback para rotas do cliente
        const indexHtml = path.join(staticDir, 'index.html');
        if (fs.existsSync(indexHtml)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(indexHtml).pipe(res);
          return;
        }
      }

      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Recurso não encontrado' }));
    });

    server.listen(port, '127.0.0.1', () => {
      const actualPort = server.address().port;
      resolve({ server, port: actualPort });
    });

    server.on('error', (err) => {
      // Se porta já ocupada, tenta porta aleatória
      if (err.code === 'EADDRINUSE') {
        const fallbackServer = server.listen(0, '127.0.0.1', () => {
          const actualPort = fallbackServer.address().port;
          resolve({ server: fallbackServer, port: actualPort });
        });
      } else {
        reject(err);
      }
    });
  });
}

module.exports = { startServer };
