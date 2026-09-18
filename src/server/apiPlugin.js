import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cryptoHelper = require('./cryptoHelper.cjs');

/**
 * Helper to parse JSON body from incoming HTTP request stream
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
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

function getSafeExportDirectory(configuredPath, rootDir) {
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
    if (path.isAbsolute(trimmed) || trimmed.startsWith('\\\\')) {
      baseDir = trimmed;
    } else {
      const docBase = process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents') : rootDir;
      baseDir = path.join(docBase, 'CCO Security Suite', trimmed);
    }

    const baseNormalized = baseDir.toUpperCase();
    if (!baseNormalized.includes(ano) && !baseNormalized.includes(mesNome)) {
      baseDir = path.join(baseDir, periodoSubpasta);
    }

    try {
      if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
      return baseDir;
    } catch (err) {
      console.warn(`[Vite API] Caminho configurado (${baseDir}) inacessível:`, err.message);
    }
  }

  const userDocs = process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'CCO Security Suite', 'exports') : null;
  const candidates = [
    userDocs,
    path.join(rootDir, 'exports'),
    path.join(rootDir, 'data')
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch (e) {}
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

/**
 * Vite plugin that provides local file-system endpoints:
 * - POST /api/salvar-ocorrencia: saves to data/ocorrencias.json, CCO/ocorrencias.json and CCO/ocorrencias.xlsx
 * - POST /api/salvar-pdf: writes PDF buffer to CCO/exports and network path (e.g. MAPA DE CALOR/...)
 * - GET /api/ocorrencias: lists saved occurrences
 */
export function ccoApiPlugin() {
  return {
    name: 'cco-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rootDir = process.cwd();

        // 0. GET /api/diretorio-padrao
        if (req.url === '/api/diretorio-padrao' && req.method === 'GET') {
          const defaultExportDir = getSafeExportDirectory(null, rootDir);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            defaultExportDir,
            documentsDir: process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents') : '',
            userDataDir: rootDir
          }));
          return;
        }

        // 0.1 POST /api/validar-diretorio
        if (req.url === '/api/validar-diretorio' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const caminho = (body.caminho || '').trim();
            if (!caminho) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ valid: false, error: 'Caminho não fornecido.' }));
              return;
            }
            const safeResolved = getSafeExportDirectory(caminho, rootDir);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: true, resolvedDir: safeResolved }));
            return;
          } catch (err) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: false, error: err.message }));
            return;
          }
        }


        // 1. POST /api/salvar-ocorrencia
        if (req.url === '/api/salvar-ocorrencia' && req.method === 'POST') {
          try {
            const novaOcorrencia = await parseJsonBody(req);
            if (!novaOcorrencia.numeroRO) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dados da ocorrência incompletos (numeroRO ausente).' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'ocorrencias.json');
            const rootJsonPath = path.join(rootDir, 'ocorrencias.json');
            const rootXlsxPath = path.join(rootDir, 'ocorrencias.xlsx');

            // Carrega lista existente
            let lista = [];
            if (fs.existsSync(dataJsonPath)) {
              try {
                const content = fs.readFileSync(dataJsonPath, 'utf-8');
                lista = JSON.parse(content);
                if (!Array.isArray(lista)) lista = [];
              } catch (e) {
                lista = [];
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                const content = fs.readFileSync(rootJsonPath, 'utf-8');
                lista = JSON.parse(content);
                if (!Array.isArray(lista)) lista = [];
              } catch (e) {
                lista = [];
              }
            }

            // Remove duplicata se já existir mesmo numeroRO ou id
            lista = lista.filter(o => o.id !== novaOcorrencia.id && o.numeroRO !== novaOcorrencia.numeroRO);
            // Insere no início
            lista.unshift(novaOcorrencia);

            // Salva JSON no data/ e na raiz
            const jsonStr = JSON.stringify(lista, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            // Salva / Atualiza Excel na pasta raiz
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
                'Gerente Site': o.responsaveis?.gerenteSite || '',
                'Coordenação': o.responsaveis?.coordenacao || '',
                'Fiscal Contrato': o.responsaveis?.fiscalContrato || '',
                'Arquivo PDF': o.nomeArquivoPdf || '',
                'Data de Cadastro': o.dataCadastro || new Date().toISOString()
              }));

              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(linhasXlsx);
              XLSX.utils.book_append_sheet(wb, ws, 'Relatórios de Ocorrência');
              XLSX.writeFile(wb, rootXlsxPath);
            } catch (xlsxErr) {
              console.error('Erro ao gerar planilha Excel na raiz:', xlsxErr);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Ocorrência salva com sucesso!',
              savedPaths: [dataJsonPath, rootJsonPath, rootXlsxPath],
              total: lista.length
            }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-ocorrencia:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 2. POST /api/salvar-pdf
        if (req.url === '/api/salvar-pdf' && req.method === 'POST') {
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

            // 1. Resolve o diretório configurado ou o padrão seguro
            const primaryDir = getSafeExportDirectory(caminhoRede, rootDir);
            const { finalPath: primaryFilePath, finalFilename } = getNonConflictingPath(primaryDir, filename);

            try {
              if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
              fs.writeFileSync(primaryFilePath, pdfBuffer);
              savedPaths.push(primaryFilePath);
            } catch (priErr) {
              console.error('[Vite API] Erro ao salvar PDF no diretório primário:', priErr);
              warnings.push(`Falha de permissão no diretório (${primaryDir}): ${priErr.message}`);
            }

            // 2. Grava cópia de segurança em exports padrão se for diretório diferente
            const backupDir = getSafeExportDirectory(null, rootDir);
            if (backupDir && backupDir !== primaryDir) {
              try {
                if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                const backupFilePath = path.join(backupDir, finalFilename);
                fs.writeFileSync(backupFilePath, pdfBuffer);
                savedPaths.push(backupFilePath);
              } catch (bkpErr) {}
            }

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
              message: 'Arquivo PDF gerado e salvo com sucesso!',
              savedPaths,
              primaryPath: savedPaths[0],
              filename: finalFilename,
              warnings: warnings.length > 0 ? warnings : undefined
            }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-pdf:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 3. POST /api/salvar-excel
        if (req.url === '/api/salvar-excel' && req.method === 'POST') {
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

            // 1. Diretório seguro padrão em Documentos
            const primaryDir = getSafeExportDirectory(null, rootDir);
            try {
              if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
              const primaryFilePath = path.join(primaryDir, filename);
              fs.writeFileSync(primaryFilePath, excelBuffer);
              savedPaths.push(primaryFilePath);
            } catch (priErr) {
              console.error('[Vite API] Erro ao salvar Excel no diretório primário:', priErr);
              warnings.push(`Falha de permissão no diretório (${primaryDir}): ${priErr.message}`);
            }

            // 2. Caminho de rede ou pasta customizada se configurado
            if (caminhoRede && typeof caminhoRede === 'string' && caminhoRede.trim()) {
              try {
                const customDir = getSafeExportDirectory(caminhoRede, rootDir);
                if (customDir && customDir !== primaryDir) {
                  if (!fs.existsSync(customDir)) fs.mkdirSync(customDir, { recursive: true });
                  const customFilePath = path.join(customDir, filename);
                  fs.writeFileSync(customFilePath, excelBuffer);
                  savedPaths.push(customFilePath);
                }
              } catch (customErr) {
                console.warn('[Vite API] Falha ao gravar Excel no caminho de rede:', customErr.message);
                warnings.push(`Não foi possível salvar Excel na rede (${caminhoRede}): ${customErr.message}. Cópia salva em Documentos.`);
              }
            }

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
              message: 'Planilha Excel gerada e salva com sucesso!',
              savedPaths,
              primaryPath: savedPaths[0],
              warnings: warnings.length > 0 ? warnings : undefined
            }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-excel:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 4. GET /api/ocorrencias
        if (req.url === '/api/ocorrencias' && req.method === 'GET') {
          try {
            const dataJsonPath = path.join(rootDir, 'data', 'ocorrencias.json');
            const rootJsonPath = path.join(rootDir, 'ocorrencias.json');

            let lista = [];
            if (fs.existsSync(dataJsonPath)) {
              lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
            } else if (fs.existsSync(rootJsonPath)) {
              lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(lista));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 5. GET /api/operadores
        if (req.url === '/api/operadores' && req.method === 'GET') {
          try {
            const dataJsonPath = path.join(rootDir, 'data', 'operadores.json');
            const rootJsonPath = path.join(rootDir, 'operadores.json');

            let lista = null;
            if (fs.existsSync(dataJsonPath)) {
              try {
                lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {
                lista = null;
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {
                lista = null;
              }
            }

            if (!Array.isArray(lista)) {
              lista = [];
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(lista));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 6. POST /api/salvar-operadores
        if (req.url === '/api/salvar-operadores' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const listaOperadores = Array.isArray(body) ? body : (body.operadores || []);

            if (!Array.isArray(listaOperadores)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de operadores inválido.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const exportsDir = path.join(rootDir, 'exports');
            if (!fs.existsSync(exportsDir)) {
              fs.mkdirSync(exportsDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'operadores.json');
            const rootJsonPath = path.join(rootDir, 'operadores.json');
            const rootXlsxPath = path.join(rootDir, 'operadores.xlsx');
            const exportXlsxPath = path.join(exportsDir, 'operadores.xlsx');

            const jsonStr = JSON.stringify(listaOperadores, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            // Atualiza também data/database.json
            try {
              const dbJsonPath = path.join(dataDir, 'database.json');
              if (fs.existsSync(dbJsonPath)) {
                const banco = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
                banco.operadores = listaOperadores;
                fs.writeFileSync(dbJsonPath, JSON.stringify(banco, null, 2), 'utf-8');
              }
            } catch (dbErr) {
              console.warn('[Vite API] Falha ao atualizar database.json com operadores:', dbErr.message);
            }

            // Gera e salva a planilha Excel (.xlsx) na raiz e em exports/
            try {
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
              console.error('Erro ao gerar planilha de operadores:', xlsxErr);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Operadores salvos com sucesso em JSON e Excel!',
              savedPaths: [dataJsonPath, rootJsonPath, rootXlsxPath, exportXlsxPath],
              total: listaOperadores.length
            }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-operadores:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 6.1. GET /api/vigilantes
        if (req.url === '/api/vigilantes' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            const dataJsonPath = path.join(dataDir, 'vigilantes.json');
            const rootJsonPath = path.join(rootDir, 'vigilantes.json');

            let lista = null;
            if (fs.existsSync(dataJsonPath)) {
              try {
                lista = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {
                lista = null;
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                lista = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {
                lista = null;
              }
            }

            if (!Array.isArray(lista)) {
              lista = [
                { id: 'vig-1', nome: 'Vigilante Portaria 1', matricula: 'VIG-2001', posto: 'Portaria 1', cargo: 'Vigilante Portaria 1', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto principal de controle de acesso (P1)', dataCadastro: '2026-01-01' },
                { id: 'vig-2', nome: 'Vigilante Portaria 2', matricula: 'VIG-2002', posto: 'Portaria 2', cargo: 'Vigilante Portaria 2', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto de controle de acesso de serviços / carga (P2)', dataCadastro: '2026-01-01' },
                { id: 'vig-3', nome: 'Vigilante Ronda', matricula: 'VIG-2003', posto: 'Caldeira', cargo: 'Vigilante Ronda', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Posto Caldeira e fiscalização móvel', dataCadastro: '2026-01-01' },
                { id: 'vig-4', nome: 'Vigilante Cobertura', matricula: 'VIG-2004', posto: 'Cobertura', cargo: 'Vigilante Cobertura', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Apoio e cobertura operacional nos postos', dataCadastro: '2026-01-01' }
              ];
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(lista));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 6.2. POST /api/salvar-vigilantes (ou /api/vigilantes)
        if ((req.url === '/api/salvar-vigilantes' || req.url === '/api/vigilantes') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const listaVigilantes = Array.isArray(body) ? body : (body.vigilantes || []);

            if (!Array.isArray(listaVigilantes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de vigilantes inválido.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const exportsDir = path.join(rootDir, 'exports');
            if (!fs.existsSync(exportsDir)) {
              fs.mkdirSync(exportsDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'vigilantes.json');
            const rootJsonPath = path.join(rootDir, 'vigilantes.json');
            const rootXlsxPath = path.join(rootDir, 'vigilantes.xlsx');
            const exportXlsxPath = path.join(exportsDir, 'vigilantes.xlsx');

            const jsonStr = JSON.stringify(listaVigilantes, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            // Atualiza também data/database.json
            try {
              const dbJsonPath = path.join(dataDir, 'database.json');
              if (fs.existsSync(dbJsonPath)) {
                const banco = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
                banco.vigilantes = listaVigilantes;
                fs.writeFileSync(dbJsonPath, JSON.stringify(banco, null, 2), 'utf-8');
              }
            } catch (dbErr) {
              console.warn('[Vite API] Falha ao atualizar database.json com vigilantes:', dbErr.message);
            }

            // Gera e salva a planilha Excel (.xlsx) na raiz e em exports/
            try {
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
              console.error('Erro ao gerar planilha de vigilantes:', xlsxErr);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Vigilantes salvos com sucesso em JSON e Excel!',
              savedPaths: [dataJsonPath, rootJsonPath, rootXlsxPath, exportXlsxPath],
              total: listaVigilantes.length
            }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-vigilantes:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 7. GET /api/seguranca (Retorna metadados de auditoria - NUNCA expõe senhas ou hashes)
        if (req.url === '/api/seguranca' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            const dataJsonPath = path.join(dataDir, 'seguranca.json');
            const rootJsonPath = path.join(rootDir, 'seguranca.json');

            const seguranca = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath);
            const metadadosPublicos = cryptoHelper.obterMetadadosPublicos(seguranca);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(metadadosPublicos));
            return;
          } catch (err) {
            console.error('Erro em GET /api/seguranca:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 7.1 POST /api/validar-senha (ou /api/seguranca/validar) - Validação Segura no Servidor
        if ((req.url === '/api/validar-senha' || req.url === '/api/seguranca/validar') && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const senhaDigitada = (body.senha || body.senhaMestra || '').trim();

            const dataDir = path.join(rootDir, 'data');
            const dataJsonPath = path.join(dataDir, 'seguranca.json');
            const rootJsonPath = path.join(rootDir, 'seguranca.json');

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
            console.error('Erro em /api/validar-senha:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 8. POST /api/salvar-senha (ou /api/seguranca) - Alteração com Hash Criptográfico
        if ((req.url === '/api/salvar-senha' || req.url === '/api/seguranca') && req.method === 'POST') {
          try {
            const { senhaAtual, novaSenha, senha } = await parseJsonBody(req);
            const senhaAlvo = (novaSenha || senha || '').trim();

            if (!senhaAlvo || senhaAlvo.length < 4) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'A nova senha deve possuir pelo menos 4 caracteres.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            const dataJsonPath = path.join(dataDir, 'seguranca.json');
            const rootJsonPath = path.join(rootDir, 'seguranca.json');

            const segurancaAtual = cryptoHelper.carregarOuMigrarSeguranca(dataJsonPath, rootJsonPath);

            // Valida a senha atual fornecida
            if (senhaAtual !== undefined) {
              const atualValida = cryptoHelper.verificarSenha(senhaAtual, segurancaAtual);
              if (!atualValida) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'A senha mestra atual informada está incorreta.' }));
                return;
              }
            }

            // Gera o novo registro blindado (PBKDF2-HMAC-SHA512 + Salt)
            const novoRegistro = cryptoHelper.gerarRegistroSeguro(senhaAlvo);
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
            console.error('Erro em /api/salvar-senha:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 9. GET /api/turnos
        if (req.url === '/api/turnos' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'turnos.json');
            const rootJsonPath = path.join(rootDir, 'turnos.json');

            let turnos = null;
            if (fs.existsSync(dataJsonPath)) {
              try {
                turnos = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {
                turnos = null;
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                turnos = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {
                turnos = null;
              }
            }

            if (!Array.isArray(turnos) || turnos.length === 0) {
              turnos = [
                { id: 'turno-1', nome: '12x36 Diurno', descricao: 'Escala operacional diurna de 12 horas (06:00 às 18:00 / 07:00 às 19:00)', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'turno-2', nome: '12x36 Noturno', descricao: 'Escala operacional noturna de 12 horas (18:00 às 06:00 / 19:00 às 07:00)', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'turno-3', nome: 'Administrativo', descricao: 'Horário comercial de segunda a sexta-feira (08:00 às 17:00)', status: 'Ativo', dataCadastro: '2026-09-04' }
              ];
              fs.writeFileSync(dataJsonPath, JSON.stringify(turnos, null, 2), 'utf-8');
              fs.writeFileSync(rootJsonPath, JSON.stringify(turnos, null, 2), 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(turnos));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 10. POST /api/salvar-turnos
        if (req.url === '/api/salvar-turnos' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const turnos = Array.isArray(body) ? body : body.turnos;
            if (!Array.isArray(turnos)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de turnos inválido.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'turnos.json');
            const rootJsonPath = path.join(rootDir, 'turnos.json');

            const jsonStr = JSON.stringify(turnos, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: turnos.length }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-turnos:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 11. GET /api/observacoes
        if (req.url === '/api/observacoes' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'observacoes.json');
            const rootJsonPath = path.join(rootDir, 'observacoes.json');

            let observacoes = null;
            if (fs.existsSync(dataJsonPath)) {
              try {
                observacoes = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {
                observacoes = null;
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                observacoes = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {
                observacoes = null;
              }
            }

            if (!Array.isArray(observacoes) || observacoes.length === 0) {
              observacoes = [
                { id: 'obs-1', nome: 'ESQUECEU', descricao: 'Colaborador esqueceu a credencial na residência', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-2', nome: 'PERDEU', descricao: 'Extravio da credencial pelo colaborador', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-3', nome: 'COM DEFEITO', descricao: 'Crachá danificado, quebrado ou chip desmagnetizado', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-4', nome: 'ATM', descricao: 'Acesso Temporário de Manutenção / Terceirizado', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-5', nome: 'BLOQUEADO', descricao: 'Bloqueio preventivo de acesso cadastral', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-6', nome: 'RETORNO DE FÉRIAS', descricao: 'Reativação ou crachá provisório de retorno de férias', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-7', nome: 'RETORNO DE LICENÇA', descricao: 'Retorno de afastamento médico ou licença institucional', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-8', nome: 'AINDA NÃO POSSUI', descricao: 'Novo colaborador aguardando emissão definitiva de credencial', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-9', nome: 'NÃO PASSOU', descricao: 'Catraca não fez a leitura do cartão titular', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-10', nome: 'FURTADO', descricao: 'Furto ou roubo do documento com registro de BO', status: 'Ativo', dataCadastro: '2026-09-04' },
                { id: 'obs-11', nome: 'OUTROS', descricao: 'Outras situações operacionais a detalhar', status: 'Ativo', dataCadastro: '2026-09-04' }
              ];
              fs.writeFileSync(dataJsonPath, JSON.stringify(observacoes, null, 2), 'utf-8');
              fs.writeFileSync(rootJsonPath, JSON.stringify(observacoes, null, 2), 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(observacoes));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12. POST /api/salvar-observacoes
        if (req.url === '/api/salvar-observacoes' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const observacoes = Array.isArray(body) ? body : body.observacoes;
            if (!Array.isArray(observacoes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de observações inválido.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'observacoes.json');
            const rootJsonPath = path.join(rootDir, 'observacoes.json');

            const jsonStr = JSON.stringify(observacoes, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: observacoes.length }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-observacoes:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12.1. GET /api/cargos
        if (req.url === '/api/cargos' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const dataJsonPath = path.join(dataDir, 'cargos.json');
            const rootJsonPath = path.join(rootDir, 'cargos.json');

            let cargos = null;
            if (fs.existsSync(dataJsonPath)) {
              try { cargos = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { cargos = null; }
            } else if (fs.existsSync(rootJsonPath)) {
              try { cargos = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { cargos = null; }
            }

            if (!Array.isArray(cargos) || cargos.length === 0) {
              cargos = [
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
              fs.writeFileSync(dataJsonPath, JSON.stringify(cargos, null, 2), 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(cargos));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12.2. POST /api/salvar-cargos
        if (req.url === '/api/salvar-cargos' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const cargos = Array.isArray(body) ? body : body.cargos;
            if (!Array.isArray(cargos)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de cargos inválido.' }));
              return;
            }
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const dataJsonPath = path.join(dataDir, 'cargos.json');
            const rootJsonPath = path.join(rootDir, 'cargos.json');
            const jsonStr = JSON.stringify(cargos, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: cargos.length }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12.3. GET /api/sugestoes-observacoes
        if (req.url === '/api/sugestoes-observacoes' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const dataJsonPath = path.join(dataDir, 'sugestoes_observacoes.json');
            const rootJsonPath = path.join(rootDir, 'sugestoes_observacoes.json');

            let sugestoes = null;
            if (fs.existsSync(dataJsonPath)) {
              try { sugestoes = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { sugestoes = null; }
            } else if (fs.existsSync(rootJsonPath)) {
              try { sugestoes = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { sugestoes = null; }
            }

            if (!Array.isArray(sugestoes) || sugestoes.length === 0) {
              sugestoes = [
                { id: 'sobs-1', texto: 'Operador autorizado a emitir e assinar relatórios de ocorrência (RO)', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
                { id: 'sobs-2', texto: 'Responsável pelo monitoramento e despacho de viaturas no plantão', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
                { id: 'sobs-3', texto: 'Posto principal de controle de acesso de colaboradores e terceiros (P1)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
                { id: 'sobs-4', texto: 'Posto de controle de acesso de veículos pesados, carretas e cargas (P2)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
                { id: 'sobs-5', texto: 'Ronda perimetral móvel e fiscalização ostensiva de áreas críticas', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
                { id: 'sobs-6', texto: 'Apoio tático operacional e cobertura de intervalos nas portarias', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
              ];
              fs.writeFileSync(dataJsonPath, JSON.stringify(sugestoes, null, 2), 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(sugestoes));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12.4. POST /api/salvar-sugestoes-observacoes
        if (req.url === '/api/salvar-sugestoes-observacoes' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const sugestoes = Array.isArray(body) ? body : body.sugestoes;
            if (!Array.isArray(sugestoes)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de sugestões inválido.' }));
              return;
            }
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const dataJsonPath = path.join(dataDir, 'sugestoes_observacoes.json');
            const rootJsonPath = path.join(rootDir, 'sugestoes_observacoes.json');
            const jsonStr = JSON.stringify(sugestoes, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: sugestoes.length }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12.5. GET /api/taxonomia-predios-areas
        if (req.url === '/api/taxonomia-predios-areas' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const dataJsonPath = path.join(dataDir, 'taxonomia_predios_areas.json');
            const rootJsonPath = path.join(rootDir, 'taxonomia_predios_areas.json');

            let itens = null;
            if (fs.existsSync(dataJsonPath)) {
              try { itens = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8')); } catch (e) { itens = null; }
            } else if (fs.existsSync(rootJsonPath)) {
              try { itens = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8')); } catch (e) { itens = null; }
            }

            if (!Array.isArray(itens) || itens.length === 0) {
              itens = [];
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(itens));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 12.6. POST /api/salvar-taxonomia-predios-areas
        if (req.url === '/api/salvar-taxonomia-predios-areas' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const itens = Array.isArray(body) ? body : body.itens;
            if (!Array.isArray(itens)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Array de taxonomia inválido.' }));
              return;
            }
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const dataJsonPath = path.join(dataDir, 'taxonomia_predios_areas.json');
            const rootJsonPath = path.join(rootDir, 'taxonomia_predios_areas.json');
            const jsonStr = JSON.stringify(itens, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: itens.length }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 13. GET /api/responsaveis
        if (req.url === '/api/responsaveis' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'responsaveis.json');
            const rootJsonPath = path.join(rootDir, 'responsaveis.json');

            let responsaveis = null;
            if (fs.existsSync(dataJsonPath)) {
              try {
                responsaveis = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {
                responsaveis = null;
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                responsaveis = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {
                responsaveis = null;
              }
            }

            if (!responsaveis || typeof responsaveis !== 'object') {
              responsaveis = {
                gerenteSite: 'Gerência de Operações',
                coordenacao: 'Coordenação de Segurança Corporativa',
                fiscalContrato: 'Fiscalização de Contrato',
                caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
              };
              fs.writeFileSync(dataJsonPath, JSON.stringify(responsaveis, null, 2), 'utf-8');
              fs.writeFileSync(rootJsonPath, JSON.stringify(responsaveis, null, 2), 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responsaveis));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 14. POST /api/salvar-responsaveis
        if (req.url === '/api/salvar-responsaveis' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            if (!body || typeof body !== 'object') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Objeto de responsáveis inválido.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'responsaveis.json');
            const rootJsonPath = path.join(rootDir, 'responsaveis.json');

            const dadosSalvar = {
              gerenteSite: body.gerenteSite || 'Gerência de Operações',
              coordenacao: body.coordenacao || 'Coordenação de Segurança Corporativa',
              fiscalContrato: body.fiscalContrato || 'Fiscalização de Contrato',
              caminhoRede: body.caminhoRede || 'MAPA DE CALOR/2026/09.SETEMBRO',
              atualizadoEm: new Date().toISOString()
            };

            const jsonStr = JSON.stringify(dadosSalvar, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, dados: dadosSalvar }));
            return;
          } catch (err) {
            console.error('Erro em /api/salvar-responsaveis:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 15. Provisórios - GET e POST /api/provisorios e /api/salvar-provisorios
        if (req.url === '/api/provisorios' || req.url === '/api/salvar-provisorios') {
          const dataJsonPath = path.join(rootDir, 'data', 'provisorios.json');
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

              const dataDir = path.join(rootDir, 'data');
              if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

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

        // 16. Visitantes - GET e POST /api/visitantes e /api/salvar-visitantes
        if (req.url === '/api/visitantes' || req.url === '/api/salvar-visitantes') {
          const dataJsonPath = path.join(rootDir, 'data', 'visitantes.json');
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

              const dataDir = path.join(rootDir, 'data');
              if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

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

        // 17. RFID - GET e POST /api/rfid e /api/salvar-rfid
        if (req.url === '/api/rfid' || req.url === '/api/salvar-rfid') {
          const dataJsonPath = path.join(rootDir, 'data', 'rfid.json');
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

              const dataDir = path.join(rootDir, 'data');
              if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

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
        // 18. MÓDULO DE BACKUP & RESTAURAÇÃO COM MERGE INTELIGENTE (Vite API)
        // ====================================================

        // 18.1 Coleta de todos os dados locais do sistema para Backup
        if (req.url === '/api/backup/coletar' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
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
            console.error('[Vite Server] Erro ao coletar dados para backup:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Falha ao coletar dados para backup: ' + err.message }));
            return;
          }
        }

        // 18.2 Restauração de Backup com Merge Inteligente (Anti-Duplicidade)
        if (req.url === '/api/backup/restaurar' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const backupDados = body.dados || body;

            if (!backupDados || typeof backupDados !== 'object') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Arquivo de backup inválido ou sem seção de dados.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

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
              const primaryExportDir = getSafeExportDirectory(null, rootDir);
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
              console.warn('[Vite Server] Erro ao sincronizar Excel de ocorrências após restauração:', xlsxErr.message);
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
            console.error('[Vite Server] Erro ao restaurar backup:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Falha durante a restauração do backup: ' + err.message }));
            return;
          }
        }

        next();
      });
    }
  };
}
