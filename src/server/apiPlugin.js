import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

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

            // Remove prefixo se houver (ex: "data:application/pdf;base64,")
            const cleanBase64 = base64Pdf.replace(/^data:application\/pdf;base64,/, '');
            const pdfBuffer = Buffer.from(cleanBase64, 'base64');

            const exportsDir = path.join(rootDir, 'exports');
            if (!fs.existsSync(exportsDir)) {
              fs.mkdirSync(exportsDir, { recursive: true });
            }

            const exportFilePath = path.join(exportsDir, filename);
            fs.writeFileSync(exportFilePath, pdfBuffer);

            const savedPaths = [exportFilePath];

            // Se caminho de rede informado (ex: MAPA DE CALOR/2026/09.SETEMBRO)
            if (caminhoRede) {
              try {
                const redeDir = path.isAbsolute(caminhoRede)
                  ? caminhoRede
                  : path.join(rootDir, caminhoRede);

                if (!fs.existsSync(redeDir)) {
                  fs.mkdirSync(redeDir, { recursive: true });
                }
                const redeFilePath = path.join(redeDir, filename);
                fs.writeFileSync(redeFilePath, pdfBuffer);
                savedPaths.push(redeFilePath);
              } catch (redeErr) {
                console.warn('Aviso: Não foi possível gravar na pasta de rede informada:', redeErr.message);
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Arquivo PDF gerado e salvo com sucesso!',
              savedPaths
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
            if (!fs.existsSync(exportsDir)) {
              fs.mkdirSync(exportsDir, { recursive: true });
            }

            const exportFilePath = path.join(exportsDir, filename);
            fs.writeFileSync(exportFilePath, excelBuffer);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Planilha Excel gerada e salva com sucesso em CCO/exports!',
              savedPaths: [exportFilePath]
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
              lista = [
                { id: 'op-1', nome: 'Op. Operador 01', matricula: 'CCO-1001', cargo: 'Operador CCO', turno: '12x36 Diurno', status: 'Ativo', dataCadastro: '2026-01-01' },
                { id: 'op-2', nome: 'Op. Operador 02', matricula: 'CCO-1002', cargo: 'Operador CCO Líder', turno: '12x36 Diurno', status: 'Ativo', dataCadastro: '2026-01-01' }
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

        // 7. GET /api/seguranca
        if (req.url === '/api/seguranca' && req.method === 'GET') {
          try {
            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'seguranca.json');
            const rootJsonPath = path.join(rootDir, 'seguranca.json');

            let seguranca = null;
            if (fs.existsSync(dataJsonPath)) {
              try {
                seguranca = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {
                seguranca = null;
              }
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                seguranca = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {
                seguranca = null;
              }
            }

            if (!seguranca || !seguranca.senhaMestra) {
              seguranca = {
                senhaMestra: 'admin123',
                dataAtualizacao: new Date().toISOString()
              };
              fs.writeFileSync(dataJsonPath, JSON.stringify(seguranca, null, 2), 'utf-8');
              fs.writeFileSync(rootJsonPath, JSON.stringify(seguranca, null, 2), 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              senhaMestra: seguranca.senhaMestra,
              dataAtualizacao: seguranca.dataAtualizacao
            }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 8. POST /api/salvar-senha
        if (req.url === '/api/salvar-senha' && req.method === 'POST') {
          try {
            const { senhaAtual, novaSenha } = await parseJsonBody(req);
            if (!novaSenha || typeof novaSenha !== 'string' || novaSenha.trim().length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nova senha é obrigatória.' }));
              return;
            }

            const dataDir = path.join(rootDir, 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const dataJsonPath = path.join(dataDir, 'seguranca.json');
            const rootJsonPath = path.join(rootDir, 'seguranca.json');

            // Verifica senha atual
            let segurancaAtual = { senhaMestra: 'admin123' };
            if (fs.existsSync(dataJsonPath)) {
              try {
                segurancaAtual = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
              } catch (e) {}
            } else if (fs.existsSync(rootJsonPath)) {
              try {
                segurancaAtual = JSON.parse(fs.readFileSync(rootJsonPath, 'utf-8'));
              } catch (e) {}
            }

            if (senhaAtual !== undefined && senhaAtual !== segurancaAtual.senhaMestra) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'A senha mestra atual informada está incorreta.' }));
              return;
            }

            const novoObjeto = {
              senhaMestra: novaSenha.trim(),
              dataAtualizacao: new Date().toISOString()
            };

            const jsonStr = JSON.stringify(novoObjeto, null, 2);
            fs.writeFileSync(dataJsonPath, jsonStr, 'utf-8');
            fs.writeFileSync(rootJsonPath, jsonStr, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: 'Senha mestra alterada com sucesso!',
              dataAtualizacao: novoObjeto.dataAtualizacao
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

        next();
      });
    }
  };
}
