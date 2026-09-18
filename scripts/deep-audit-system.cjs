const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BROWSER_GLOBALS = new Set([
  'window', 'document', 'navigator', 'console', 'Math', 'Date', 'JSON',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'fetch', 'localStorage', 'sessionStorage', 'CustomEvent', 'Event', 'AbortController',
  'Blob', 'File', 'FileReader', 'FormData', 'URL', 'URLSearchParams',
  'alert', 'confirm', 'prompt', 'Intl', 'Promise', 'Set', 'Map', 'WeakMap', 'WeakSet',
  'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'TypeError', 'RangeError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'encodeURI', 'decodeURI', 'Infinity', 'NaN', 'undefined', 'null',
  'performance', 'crypto', 'sessionStorage', 'history', 'location',
  'Audio', 'Image', 'process', 'global', 'Buffer', 'module', 'require', 'exports',
  'MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'Node'
]);

const issues = [];

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator',
        'exportDefaultFrom'
      ]
    });
  } catch (err) {
    issues.push({ file: filePath, type: 'SYNTAX_ERROR', message: err.message });
    return;
  }

  traverse(ast, {
    Program(path) {
      const globalScope = path.scope;
      const bindings = globalScope.bindings;

      // Check all references in this file
      path.traverse({
        ReferencedIdentifier(identPath) {
          const name = identPath.node.name;
          
          // Skip if in browser globals
          if (BROWSER_GLOBALS.has(name)) return;
          
          // Check if identifier has a binding in any enclosing scope
          if (!identPath.scope.hasBinding(name)) {
            // Check if it's property access like obj.name (already handled by ReferencedIdentifier for obj)
            // But verify if it is an undeclared global
            issues.push({
              file: filePath,
              line: identPath.node.loc ? identPath.node.loc.start.line : 0,
              col: identPath.node.loc ? identPath.node.loc.start.column : 0,
              identifier: name,
              type: 'UNDECLARED_IDENTIFIER'
            });
          }
        }
      });
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

console.log('=== RELATÓRIO DE AUDITORIA PROFUNDA DE AST (SRC) ===');
if (issues.length === 0) {
  console.log('🎉 100% LIMPO! Nenhum identificador indefinido encontrado.');
} else {
  // Deduplicate by file and identifier
  const unique = new Map();
  issues.forEach(iss => {
    const key = `${iss.file}::${iss.identifier || iss.type}`;
    if (!unique.has(key)) {
      unique.set(key, iss);
    }
  });

  console.log(`Encontrados ${unique.size} possíveis alertas:`);
  for (const iss of unique.values()) {
    console.log(`- [Linha ${iss.line}] ${iss.file}: '${iss.identifier}' (${iss.type})`);
  }
}
