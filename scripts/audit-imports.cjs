const fs = require('fs');
const path = require('path');

const hooks = ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext', 'useId'];
const findings = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find React import
  // e.g. import React, { useState, useEffect } from 'react';
  const importLines = content.split('\n').filter(l => l.includes("from 'react'") || l.includes('from "react"'));
  
  let importedNames = [];
  importLines.forEach(l => {
    const match = l.match(/\{([^}]+)\}/);
    if (match) {
      match[1].split(',').forEach(n => importedNames.push(n.trim()));
    }
  });

  hooks.forEach(hook => {
    // Regex for hook call like useMemo( or useMemo (
    const regex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
    if (regex.test(content)) {
      const isImported = importedNames.includes(hook);
      const isReactDot = content.includes(`React.${hook}`);
      if (!isImported && !isReactDot) {
        findings.push({ file: filePath, hook });
      }
    }
  });
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walkDir(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      checkFile(full);
    }
  });
}

walkDir('src');

console.log('=== AUDITORIA DE HOOKS DO REACT ===');
if (findings.length === 0) {
  console.log('Nenhum problema encontrado!');
} else {
  findings.forEach(f => {
    console.log(`[ERRO] ${f.file} -> usa '${f.hook}' mas não importa de 'react'`);
  });
}
