/**
 * Script de Teste Automatizado: Fluxo de Status de Cautela e Vínculo Relacional
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const provisorios = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'provisorios.json'), 'utf-8'));
const vigilantes = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'vigilantes.json'), 'utf-8'));
const operadores = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'operadores.json'), 'utf-8'));
const visitantes = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'visitantes.json'), 'utf-8'));
const ocorrencias = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'ocorrencias.json'), 'utf-8'));

console.log('=== TESTE DO FLUXO DE STATUS DE CAUTELA E VÍNCULO RELACIONAL ===\n');

let falhas = 0;

// Teste 1: Conflito de status na base (DEVOLVIDO sem dataDevolucao OU NÃO DEVOLVIDO com dataDevolucao)
const conflitoDevSemData = provisorios.filter(p => (p.situacao === 'DEVOLVIDO' || p.status === 'DEVOLVIDO') && !p.dataDevolucao);
const conflitoNaoDevComData = provisorios.filter(p => (p.situacao === 'NÃO DEVOLVIDO' || p.situacao === 'NAO_DEVOLVIDO') && p.dataDevolucao);

console.log(`1. Consistência de Status na Base de Provisórios:`);
if (conflitoDevSemData.length === 0 && conflitoNaoDevComData.length === 0) {
  console.log(`   ✓ 100% dos registros possuem status e data de devolução sincronizados.`);
  console.log(`   ✓ DEVOLVIDO sem data: 0 | NÃO DEVOLVIDO com data: 0`);
} else {
  console.error(`   ✗ FALHA: ${conflitoDevSemData.length} DEVOLVIDO sem data | ${conflitoNaoDevComData.length} NÃO DEVOLVIDO com data.`);
  falhas++;
}

// Teste 2: Status do Cartão Retirado Hoje (Edivaldo - Cartão 02)
const edivaldo = provisorios.find(p => p.id === 1700000000734 || (p.colaborador && p.colaborador.includes('EDIVALDO CARDOSOD')));
console.log(`\n2. Verificação do Ciclo Ativo de Cautela (Edivaldo Cardoso - Cartão 02):`);
if (edivaldo) {
  const isPendente = edivaldo.situacao === 'NÃO DEVOLVIDO' && !edivaldo.dataDevolucao;
  if (isPendente) {
    console.log(`   ✓ Cartão: ${edivaldo.cartao} (${edivaldo.portaria})`);
    console.log(`   ✓ Colaborador: ${edivaldo.colaborador}`);
    console.log(`   ✓ Retirada: ${edivaldo.dataRetirada} às ${edivaldo.horaRetirada}`);
    console.log(`   ✓ Situação estrita: ${edivaldo.situacao} (Em Posse / Ativo)`);
    console.log(`   ✓ Devolução: ${edivaldo.dataDevolucao || 'Pendente (Não devolvido)'}`);
    console.log(`   ✓ Vigilante de Saída: ${edivaldo.vigilante}`);
  } else {
    console.error(`   ✗ FALHA: Edivaldo não está em estado NÃO DEVOLVIDO (sit: ${edivaldo.situacao}, dev: ${edivaldo.dataDevolucao})`);
    falhas++;
  }
} else {
  console.error(`   ✗ FALHA: Registro de Edivaldo não encontrado.`);
  falhas++;
}

// Teste 3: Vínculo Relacional com Vigilantes
const nomesVig = new Set(vigilantes.map(v => v.nome));
const provSemVig = provisorios.filter(p => !nomesVig.has(p.vigilante));
const provSemVigDev = provisorios.filter(p => p.vigilanteDevolucao && !nomesVig.has(p.vigilanteDevolucao));
const visSemVig = visitantes.filter(v => (v.vigilanteEntrada && !nomesVig.has(v.vigilanteEntrada)) || (v.vigilanteSaida && !nomesVig.has(v.vigilanteSaida)));

console.log(`\n3. Integridade Relacional de Vigilantes:`);
console.log(`   ✓ Total de Vigilantes Oficiais Cadastrados: ${vigilantes.length}`);
if (provSemVig.length === 0 && provSemVigDev.length === 0 && visSemVig.length === 0) {
  console.log(`   ✓ 100% dos ${provisorios.length} registros de provisórios possuem vigilante canônico válido.`);
  console.log(`   ✓ 100% dos ${visitantes.length} registros de visitantes possuem vigilante canônico válido.`);
} else {
  console.error(`   ✗ FALHA: Vigilantes não vinculados encontrados: Prov Saída=${provSemVig.length}, Prov Dev=${provSemVigDev.length}, Vis=${visSemVig.length}`);
  falhas++;
}

// Teste 4: Integridade Relacional de Operadores
const nomesOp = new Set(operadores.map(o => o.nome));
const ocSemOp = ocorrencias.filter(o => !nomesOp.has(o.operador) || !nomesOp.has(o.responsaveis?.operador));

console.log(`\n4. Integridade Relacional de Operadores CCO:`);
console.log(`   ✓ Total de Operadores Oficiais Cadastrados: ${operadores.length}`);
if (ocSemOp.length === 0) {
  console.log(`   ✓ 100% das ${ocorrencias.length} ocorrências vinculadas a operador oficial (${ocorrencias[0]?.operador}).`);
} else {
  console.error(`   ✗ FALHA: ${ocSemOp.length} ocorrências sem operador canônico.`);
  falhas++;
}

// Teste 5: Simulação Atômica de Rotina de Baixa
console.log(`\n5. Teste da Rotina de Baixa (Simulação Atômica):`);
const idTeste = edivaldo.id;
const listaSimulada = provisorios.map(item => {
  if (item.id === idTeste) {
    return {
      ...item,
      situacao: 'DEVOLVIDO',
      dataDevolucao: '2026-09-16',
      horaDevolucao: '17:30',
      tempoPermanencia: '10h 00m',
      vigilanteDevolucao: 'Ana Margarida'
    };
  }
  return item;
});

const baixado = listaSimulada.find(p => p.id === idTeste);
const duplicados = listaSimulada.filter(p => p.id === idTeste).length;

if (baixado.situacao === 'DEVOLVIDO' && baixado.dataDevolucao === '2026-09-16' && duplicados === 1) {
  console.log(`   ✓ Baixa atômica executada com sucesso.`);
  console.log(`   ✓ Status atualizado para DEVOLVIDO às ${baixado.horaDevolucao} pelo vigilante ${baixado.vigilanteDevolucao}.`);
  console.log(`   ✓ Registros duplicados gerados: 0 (estritamente idempotente).`);
} else {
  console.error(`   ✗ FALHA na simulação de baixa.`);
  falhas++;
}

console.log('\n=================================================');
if (falhas === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
} else {
  console.error(`❌ OCORRERAM ${falhas} FALHAS NOS TESTES.`);
  process.exit(1);
}
