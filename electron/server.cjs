// Servidor Local Embutido para Produção no Electron (Node.js)
// Provê persistência em arquivos locais (JSON / XLSX / PDF) e serve o frontend compilado (dist)
const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
    'seguranca.json': template.seguranca || { senhaMestra: 'admin123', dataAtualizacao: new Date().toISOString() },
    'responsaveis.json': template.responsaveis || {
      gerenteSite: 'Gerência de Operações',
      coordenacao: 'Coordenação de Segurança Corporativa',
      fiscalContrato: 'Fiscalização de Contrato',
      caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
    },
    'operadores.json': template.operadores && template.operadores.length > 0 ? template.operadores : [
      { id: 'op-1', nome: 'Op. Operador 01', matricula: 'CCO-1001', cargo: 'Operador CCO', turno: '12x36 Diurno', status: 'Ativo', dataCadastro: '2026-01-01' },
      { id: 'op-2', nome: 'Op. Operador 02', matricula: 'CCO-1002', cargo: 'Operador CCO Líder', turno: '12x36 Diurno', status: 'Ativo', dataCadastro: '2026-01-01' }
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

function startServer({ port = 3000, staticDir, rootDir }) {
  return new Promise((resolve, reject) => {
    const dataDir = path.join(rootDir, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
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

      // 1. Status da API
      if (pathname === '/api/status' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'online', mode: 'electron', timestamp: new Date().toISOString() }));
        return;
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
          fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
          try { fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8'); } catch (e) {}

          // Atualiza planilha Excel se XLSX disponível
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
            XLSX.writeFile(wb, rootXlsxPath);
          } catch (xlsxErr) {
            console.warn('Aviso: erro ao gerar Excel na raiz:', xlsxErr.message);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, total: lista.length }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
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

          const cleanBase64 = base64Pdf.replace(/^data:application\/pdf;base64,/, '');
          const pdfBuffer = Buffer.from(cleanBase64, 'base64');

          const exportsDir = path.join(rootDir, 'exports');
          if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

          const exportFilePath = path.join(exportsDir, filename);
          fs.writeFileSync(exportFilePath, pdfBuffer);
          const savedPaths = [exportFilePath];

          if (caminhoRede) {
            try {
              const redeDir = path.isAbsolute(caminhoRede) ? caminhoRede : path.join(rootDir, caminhoRede);
              if (!fs.existsSync(redeDir)) fs.mkdirSync(redeDir, { recursive: true });
              const redeFilePath = path.join(redeDir, filename);
              fs.writeFileSync(redeFilePath, pdfBuffer);
              savedPaths.push(redeFilePath);
            } catch (redeErr) {
              console.warn('Aviso: Não foi possível gravar no caminho de rede:', redeErr.message);
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, savedPaths }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      // 4. Salvar Excel - POST /api/salvar-excel
      if (pathname === '/api/salvar-excel' && req.method === 'POST') {
        try {
          const { filename, base64Excel } = await parseJsonBody(req);
          if (!filename || !base64Excel) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'filename e base64Excel são obrigatórios.' }));
            return;
          }

          const cleanBase64 = base64Excel.replace(/^data:.*?;base64,/, '');
          const excelBuffer = Buffer.from(cleanBase64, 'base64');

          const exportsDir = path.join(rootDir, 'exports');
          if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

          const exportFilePath = path.join(exportsDir, filename);
          fs.writeFileSync(exportFilePath, excelBuffer);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, savedPath: exportFilePath }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
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
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(lista));
        return;
      }

      // 6. Operadores - GET e POST /api/operadores
      if (pathname === '/api/operadores') {
        const dataJsonPath = path.join(dataDir, 'operadores.json');
        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (!Array.isArray(lista)) {
            lista = [
              { id: 'op-1', nome: 'Op. Operador 01', matricula: 'CCO-1001', cargo: 'Operador CCO', turno: '12x36 Diurno', status: 'Ativo' },
              { id: 'op-2', nome: 'Op. Operador 02', matricula: 'CCO-1002', cargo: 'Operador CCO Líder', turno: '12x36 Diurno', status: 'Ativo' }
            ];
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lista));
          return;
        }
        if (req.method === 'POST') {
          const body = await parseJsonBody(req);
          const operadores = Array.isArray(body) ? body : body.operadores;
          if (Array.isArray(operadores)) {
            fs.writeFileSync(dataJsonPath, JSON.stringify(operadores, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: operadores.length }));
            return;
          }
        }
      }

      // 7. Segurança - GET e POST /api/seguranca
      if (pathname === '/api/seguranca') {
        const dataJsonPath = path.join(dataDir, 'seguranca.json');
        if (req.method === 'GET') {
          let config = { senhaMestra: 'admin123' };
          if (fs.existsSync(dataJsonPath)) {
            try { config = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) {}
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(config));
          return;
        }
        if (req.method === 'POST') {
          const body = await parseJsonBody(req);
          if (body.novaSenha) {
            const config = { senhaMestra: body.novaSenha, dataAtualizacao: new Date().toISOString() };
            fs.writeFileSync(dataJsonPath, JSON.stringify(config, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
            return;
          }
        }
      }

      // 8. Turnos - GET e POST /api/turnos
      if (pathname === '/api/turnos') {
        const dataJsonPath = path.join(dataDir, 'turnos.json');
        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (lista.length === 0) {
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
          const body = await parseJsonBody(req);
          const turnos = Array.isArray(body) ? body : body.turnos;
          if (Array.isArray(turnos)) {
            fs.writeFileSync(dataJsonPath, JSON.stringify(turnos, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: turnos.length }));
            return;
          }
        }
      }

      // 9. Observações - GET e POST /api/observacoes
      if (pathname === '/api/observacoes') {
        const dataJsonPath = path.join(dataDir, 'observacoes.json');
        if (req.method === 'GET') {
          let lista = [];
          if (fs.existsSync(dataJsonPath)) {
            try { lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { lista = []; }
          }
          if (lista.length === 0) {
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
          const body = await parseJsonBody(req);
          const obs = Array.isArray(body) ? body : body.observacoes;
          if (Array.isArray(obs)) {
            fs.writeFileSync(dataJsonPath, JSON.stringify(obs, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: obs.length }));
            return;
          }
        }
      }

      // 10. Responsáveis do Site - GET e POST /api/responsaveis
      if (pathname === '/api/responsaveis') {
        const dataJsonPath = path.join(dataDir, 'responsaveis.json');
        if (req.method === 'GET') {
          let dados = {
            gerenteSite: 'Gerência de Operações',
            coordenacao: 'Coordenação de Segurança Local - SERVIS',
            fiscalContrato: 'Fiscalização de Contrato',
            caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
          };
          if (fs.existsSync(dataJsonPath)) {
            try { dados = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) {}
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(dados));
          return;
        }
        if (req.method === 'POST') {
          const body = await parseJsonBody(req);
          fs.writeFileSync(dataJsonPath, JSON.stringify(body, null, 2), 'utf-8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
          return;
        }
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
      resolve({ server, port });
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
