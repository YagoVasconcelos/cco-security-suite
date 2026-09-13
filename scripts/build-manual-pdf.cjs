// Compilador de Manual do Usuário Markdown para PDF Corporativo
// Converte docs/Manual_Usuario_CCO.md em docs/Manual_Usuario_CCO.pdf
// Suporta imagens em docs/prints/ com proteção contra quebra de página

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  try {
    console.log('[build:pdf] Iniciando compilação do Manual do Usuário para PDF...');

    const rootDir = path.join(__dirname, '..');
    const docsDir = path.join(rootDir, 'docs');
    const mdPath = path.join(docsDir, 'Manual_Usuario_CCO.md');
    const pdfPath = path.join(docsDir, 'Manual_Usuario_CCO.pdf');
    const printsDir = path.join(docsDir, 'prints');

    if (!fs.existsSync(mdPath)) {
      console.error(`[build:pdf] Erro: Arquivo ${mdPath} não encontrado!`);
      app.exit(1);
      return;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf-8');

    // Configura o renderer do Marked para tratar imagens com proteção contra quebra de página
    const renderer = new marked.Renderer();

    renderer.image = function ({ href, title, text }) {
      const imgFileName = path.basename(href);
      const imgAbsPath = path.join(docsDir, href);

      let imageSrc = href;
      let fileExists = false;

      if (fs.existsSync(imgAbsPath)) {
        try {
          const imgBuffer = fs.readFileSync(imgAbsPath);
          const ext = path.extname(imgAbsPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png');
          imageSrc = `data:${mime};base64,${imgBuffer.toString('base64')}`;
          fileExists = true;
        } catch (e) {
          fileExists = false;
        }
      }

      if (fileExists) {
        return `
          <div class="manual-image-container">
            <div class="manual-image-wrapper">
              <img src="${imageSrc}" alt="${text || 'Captura de Tela'}" />
            </div>
            ${text ? `<div class="manual-image-caption">Figura: ${text}</div>` : ''}
          </div>
        `;
      } else {
        // Placeholder corporativo elegante caso o print ainda não tenha sido colocado na pasta
        return `
          <div class="manual-image-container placeholder">
            <div class="placeholder-icon">📷</div>
            <div class="placeholder-title">${text || 'Captura de Tela do Sistema'}</div>
            <div class="placeholder-desc">Arquivo esperado: <code>docs/prints/${imgFileName}</code></div>
          </div>
        `;
      }
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true
    });

    const parsedHtml = marked.parse(mdContent);

    // CSS corporativo premium para manual técnico em formato A4
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Manual de Operação - CCO Security Suite Rev 1.0</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cabeçalho Corporativo no Topo */
    .manual-header-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4mm;
      margin-bottom: 8mm;
    }
    .header-logo-text {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-logo-text span {
      color: #2563eb;
    }
    .header-subtitle {
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* Títulos e Seções */
    h1 {
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      margin-top: 8mm;
      margin-bottom: 4mm;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 2mm;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      font-weight: 800;
      color: #1e293b;
      margin-top: 7mm;
      margin-bottom: 3mm;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12pt;
      font-weight: 700;
      color: #2563eb;
      margin-top: 5mm;
      margin-bottom: 2mm;
      page-break-after: avoid;
    }

    p {
      text-align: justify;
      margin-bottom: 3mm;
      margin-top: 0;
    }

    ul, ol {
      margin-top: 2mm;
      margin-bottom: 4mm;
      padding-left: 6mm;
    }
    li {
      margin-bottom: 1.5mm;
      text-align: justify;
    }

    /* Imagens e Prints (Proteção de Quebra de Página) */
    .manual-image-container {
      margin: 6mm 0 8mm 0;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: block;
    }
    .manual-image-wrapper {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 3mm;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
      text-align: center;
    }
    .manual-image-wrapper img {
      max-width: 100%;
      height: auto;
      max-height: 125mm;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
    }
    .manual-image-caption {
      font-size: 9pt;
      font-weight: bold;
      color: #475569;
      text-align: center;
      margin-top: 2mm;
    }

    /* Placeholder quando o print ainda não existe */
    .manual-image-container.placeholder {
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      padding: 8mm;
      background: #f8fafc;
      text-align: center;
      color: #475569;
    }
    .placeholder-icon {
      font-size: 24pt;
      margin-bottom: 2mm;
    }
    .placeholder-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 1mm;
    }
    .placeholder-desc {
      font-size: 9pt;
      color: #64748b;
    }
    .placeholder-desc code {
      background: #e2e8f0;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 8.5pt;
    }

    /* Blocos de Alerta / Dica */
    blockquote {
      margin: 4mm 0;
      padding: 3mm 4mm;
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      border-radius: 0 6px 6px 0;
      color: #1e3a8a;
      page-break-inside: avoid;
    }
    blockquote p {
      margin: 0;
    }

    /* Tabelas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 6mm 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      padding: 2.5mm 3mm;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 2mm 3mm;
      color: #334155;
    }

    /* Código inline */
    code {
      font-family: 'Consolas', monospace;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0f172a;
      font-size: 9.5pt;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 6mm 0;
    }
  </style>
</head>
<body>
  <div class="manual-header-badge">
    <div>
      <div class="header-logo-text">CCO <span>SECURITY SUITE</span> Rev 1.0</div>
      <div class="header-subtitle">TecPrimus Soluções Tecnológicas • Ano 2026</div>
    </div>
    <div style="text-align: right; font-size: 8.5pt; color: #64748b; font-weight: 600;">
      MANUAL DE OPERAÇÃO DO USUÁRIO<br>
      Gestão Corporativa & Segurança
    </div>
  </div>

  ${parsedHtml}
</body>
</html>`;

    const tempHtmlPath = path.join(__dirname, 'temp_manual_build.html');
    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');

    const win = new BrowserWindow({
      width: 1200,
      height: 1600,
      show: false,
      frame: false,
      webPreferences: {
        offscreen: true
      }
    });

    await win.loadFile(tempHtmlPath);
    await new Promise(resolve => setTimeout(resolve, 800));

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: {
        marginType: 'default'
      }
    });

    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`[build:pdf] Sucesso! Manual gerado em: ${pdfPath} (${pdfBuffer.length} bytes)`);

    win.destroy();
    try { fs.unlinkSync(tempHtmlPath); } catch (e) {}

    app.exit(0);
  } catch (err) {
    console.error('[build:pdf] Erro fatal durante compilação:', err);
    app.exit(1);
  }
});
