// Script de Limpeza Completa de Distribuição (Clean Dist)
// Remove todos os arquivos residuais de compilações anteriores em dist, dist-electron e dist-react
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dirsToClean = [
  path.join(rootDir, 'dist'),
  path.join(rootDir, 'dist-electron'),
  path.join(rootDir, 'dist-react')
];

console.log('[Clean Dist] Iniciando faxina completa dos diretórios de build/distribuição...');

for (const dir of dirsToClean) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✓ Diretório removido: ${path.basename(dir)}/`);
    } catch (err) {
      console.warn(`  ! Aviso ao limpar ${path.basename(dir)}/: ${err.message}`);
    }
  }
}

console.log('[Clean Dist] Faxina concluída! Ambiente pronto para novo empacotamento.');
