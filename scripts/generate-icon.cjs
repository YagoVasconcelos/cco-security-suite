const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

function createIcoFromPngBuffers(images) {
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + entrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    const sizeByte = img.size >= 256 ? 0 : img.size;
    entry.writeUInt8(sizeByte, 0); // Width
    entry.writeUInt8(sizeByte, 1); // Height
    entry.writeUInt8(0, 2);        // Color count
    entry.writeUInt8(0, 3);        // Reserved
    entry.writeUInt16LE(1, 4);     // Planes
    entry.writeUInt16LE(32, 6);    // Bit depth (32bpp)
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Image offset
    offset += img.buffer.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

app.whenReady().then(async () => {
  const tempHtmlPath = path.join(__dirname, 'temp-icon.html');
  try {
    const svgPath = path.join(__dirname, '../public/shield.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');

    // Estilo elegante do ícone corporativo CCO Security Suite (fundo escuro + escudo ciano/azul vibrante)
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 256px;
    height: 256px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .app-icon {
    width: 240px;
    height: 240px;
    background: radial-gradient(circle at 30% 20%, #1e293b 0%, #090d16 100%);
    border-radius: 52px;
    border: 3px solid rgba(59, 130, 246, 0.45);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .svg-wrapper {
    width: 155px;
    height: 155px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.5));
  }
  svg {
    width: 100%;
    height: 100%;
    stroke: #38bdf8;
    stroke-width: 2.2;
  }
</style>
</head>
<body>
  <div class="app-icon">
    <div class="svg-wrapper">
      ${svgContent}
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    const win = new BrowserWindow({
      width: 256,
      height: 256,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        offscreen: true
      }
    });

    await win.loadFile(tempHtmlPath);
    await new Promise(r => setTimeout(r, 400));

    const masterImage = await win.webContents.capturePage({ x: 0, y: 0, width: 256, height: 256 });
    win.destroy();

    const sizes = [256, 128, 64, 48, 32, 16];
    const images = [];

    for (const size of sizes) {
      if (size === 256) {
        images.push({ size: 256, buffer: masterImage.toPNG() });
      } else {
        const resized = masterImage.resize({ width: size, height: size, quality: 'best' });
        images.push({ size, buffer: resized.toPNG() });
      }
    }

    const icoBuffer = createIcoFromPngBuffers(images);

    // Pastas de destino
    const buildDir = path.join(__dirname, '../build');
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    const publicDir = path.join(__dirname, '../public');

    // Salva PNGs
    fs.writeFileSync(path.join(publicDir, 'icon-256.png'), images[0].buffer);
    fs.writeFileSync(path.join(buildDir, 'icon.png'), images[0].buffer);

    // Salva ICOs
    const publicIco = path.join(publicDir, 'icon.ico');
    const shieldIco = path.join(publicDir, 'shield.ico');
    const buildIco = path.join(buildDir, 'icon.ico');
    const rootIco = path.join(__dirname, '../icon.ico');

    fs.writeFileSync(publicIco, icoBuffer);
    fs.writeFileSync(shieldIco, icoBuffer);
    fs.writeFileSync(buildIco, icoBuffer);
    fs.writeFileSync(rootIco, icoBuffer);

    console.log(`[Icon Generator] Sucesso! Ícone .ico e .png gerados com sucesso nos tamanhos: ${sizes.join(', ')} px`);
    console.log(`[Icon Generator] Arquivos salvos em:`);
    console.log(`  - ${buildIco}`);
    console.log(`  - ${shieldIco}`);
    console.log(`  - ${publicIco}`);
    console.log(`  - ${rootIco}`);

    try { fs.unlinkSync(tempHtmlPath); } catch (e) {}
    app.exit(0);
  } catch (err) {
    console.error('[Icon Generator] Erro:', err);
    try { fs.unlinkSync(tempHtmlPath); } catch (e) {}
    app.exit(1);
  }
});
