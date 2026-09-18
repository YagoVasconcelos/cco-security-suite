const fs = require('fs');

const files = [
  'data/vigilantes.json',
  'data/database_template.json',
  'templates/database_template.json'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    const updated = raw
      .replace(/"posto":\s*"Portaria 1 - Principal"/g, '"posto": "Portaria 1"')
      .replace(/"posto":\s*"Portaria 2 - Cargas & Serviços"/g, '"posto": "Portaria 2"')
      .replace(/"posto":\s*"Ronda Operacional"/g, '"posto": "Caldeira"')
      .replace(/"posto":\s*"Vigilante Ronda"/g, '"posto": "Caldeira"');
    
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`✓ Atualizado com sucesso: ${file}`);
  }
});
