/**
 * SERVIÇO DE GESTÃO DE CARGOS E SUGESTÕES DE OBSERVAÇÃO
 * CCO Security Suite - Gestão Operacional de Efetivo
 * 
 * Centraliza e sincroniza os cargos e perfis de observação sugeridos
 * para Operadores da Central e Vigilantes de Posto/Ronda.
 */

export const CARGOS_PADRAO = [
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

export const SUGESTOES_OBS_PADRAO = [
  { id: 'sobs-1', texto: 'Operador autorizado a emitir e assinar relatórios de ocorrência (RO)', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'sobs-2', texto: 'Responsável pelo monitoramento e despacho de viaturas no plantão', tipo: 'OPERADOR', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'sobs-3', texto: 'Posto principal de controle de acesso de colaboradores e terceiros (P1)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'sobs-4', texto: 'Posto de controle de acesso de veículos pesados, carretas e cargas (P2)', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'sobs-5', texto: 'Ronda perimetral móvel e fiscalização ostensiva de áreas críticas', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' },
  { id: 'sobs-6', texto: 'Apoio tático operacional e cobertura de intervalos nas portarias', tipo: 'VIGILANTE', status: 'Ativo', dataCadastro: '2026-01-01' }
];

const STORAGE_KEY_CARGOS = 'cco_cargos_config';
const STORAGE_KEY_SUGESTOES = 'cco_sugestoes_obs_config';

// ============================================================================
// 1. GESTÃO DE CARGOS (OPERADORES & VIGILANTES)
// ============================================================================

export function obterCargosSincrono() {
  try {
    const local = localStorage.getItem(STORAGE_KEY_CARGOS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...CARGOS_PADRAO];
}

export async function carregarCargos() {
  try {
    const res = await fetch('/api/cargos');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) {
        localStorage.setItem(STORAGE_KEY_CARGOS, JSON.stringify(dados));
        return dados;
      }
    }
  } catch (err) {
    console.warn('[cargosService] Erro ao buscar da API, usando cache local:', err);
  }

  const locais = obterCargosSincrono();
  localStorage.setItem(STORAGE_KEY_CARGOS, JSON.stringify(locais));
  return locais;
}

export async function salvarCargos(lista) {
  if (!Array.isArray(lista)) return false;
  localStorage.setItem(STORAGE_KEY_CARGOS, JSON.stringify(lista));

  try {
    await fetch('/api/salvar-cargos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lista)
    });
  } catch (err) {
    console.warn('[cargosService] Erro ao salvar cargos no backend:', err);
  }

  window.dispatchEvent(new CustomEvent('cco_cargos_changed', { detail: lista }));
  return true;
}

export function obterCargosOperadoresAtivos() {
  const cargos = obterCargosSincrono();
  return cargos
    .filter(c => c && c.status !== 'Inativo' && (c.tipo === 'OPERADOR' || c.tipo === 'AMBOS' || !c.tipo))
    .map(c => c.nome);
}

export function obterCargosVigilantesAtivos() {
  const cargos = obterCargosSincrono();
  return cargos
    .filter(c => c && c.status !== 'Inativo' && (c.tipo === 'VIGILANTE' || c.tipo === 'AMBOS' || !c.tipo))
    .map(c => c.nome);
}

export async function adicionarCargo({ nome, tipo = 'AMBOS', status = 'Ativo' }) {
  if (!nome || !nome.trim()) throw new Error('O nome do cargo é obrigatório.');
  const lista = await carregarCargos();
  const nomeLimpo = nome.trim();

  if (lista.some(c => c.nome.toUpperCase() === nomeLimpo.toUpperCase())) {
    throw new Error(`O cargo "${nomeLimpo}" já está cadastrado.`);
  }

  const novo = {
    id: `cargo-${Date.now()}`,
    nome: nomeLimpo,
    tipo: tipo || 'AMBOS',
    status: status || 'Ativo',
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [...lista, novo];
  await salvarCargos(novaLista);
  return novo;
}

export async function editarCargo(id, dadosAtualizados) {
  const lista = await carregarCargos();
  const idx = lista.findIndex(c => String(c.id) === String(id));
  if (idx === -1) throw new Error('Cargo não encontrado para edição.');

  if (dadosAtualizados.nome && dadosAtualizados.nome.trim()) {
    const nomeLimpo = dadosAtualizados.nome.trim();
    if (lista.some(c => String(c.id) !== String(id) && c.nome.toUpperCase() === nomeLimpo.toUpperCase())) {
      throw new Error(`Já existe outro cargo cadastrado com o nome "${nomeLimpo}".`);
    }
    lista[idx].nome = nomeLimpo;
  }

  if (dadosAtualizados.tipo !== undefined) lista[idx].tipo = dadosAtualizados.tipo;
  if (dadosAtualizados.status !== undefined) lista[idx].status = dadosAtualizados.status;

  await salvarCargos(lista);
  return lista[idx];
}

export async function excluirCargo(id) {
  const lista = await carregarCargos();
  const novaLista = lista.filter(c => String(c.id) !== String(id));
  await salvarCargos(novaLista);
  return novaLista;
}

export async function alternarStatusCargo(id) {
  const lista = await carregarCargos();
  const item = lista.find(c => String(c.id) === String(id));
  if (!item) return lista;
  item.status = item.status === 'Ativo' ? 'Inativo' : 'Ativo';
  await salvarCargos(lista);
  return lista;
}

export async function restaurarCargosPadrao() {
  await salvarCargos([...CARGOS_PADRAO]);
  return [...CARGOS_PADRAO];
}

// ============================================================================
// 2. GESTÃO DE SUGESTÕES DE OBSERVAÇÃO (OPERADORES & VIGILANTES)
// ============================================================================

export function obterSugestoesSincrono() {
  try {
    const local = localStorage.getItem(STORAGE_KEY_SUGESTOES);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...SUGESTOES_OBS_PADRAO];
}

export async function carregarSugestoesObservacoes() {
  try {
    const res = await fetch('/api/sugestoes-observacoes');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) {
        localStorage.setItem(STORAGE_KEY_SUGESTOES, JSON.stringify(dados));
        return dados;
      }
    }
  } catch (err) {
    console.warn('[cargosService] Erro ao buscar da API, usando cache local:', err);
  }

  const locais = obterSugestoesSincrono();
  localStorage.setItem(STORAGE_KEY_SUGESTOES, JSON.stringify(locais));
  return locais;
}

export async function salvarSugestoesObservacoes(lista) {
  if (!Array.isArray(lista)) return false;
  localStorage.setItem(STORAGE_KEY_SUGESTOES, JSON.stringify(lista));

  try {
    await fetch('/api/salvar-sugestoes-observacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lista)
    });
  } catch (err) {
    console.warn('[cargosService] Erro ao salvar sugestões no backend:', err);
  }

  window.dispatchEvent(new CustomEvent('cco_sugestoes_obs_changed', { detail: lista }));
  return true;
}

export function obterSugestoesOperadoresAtivas() {
  const sugestoes = obterSugestoesSincrono();
  return sugestoes
    .filter(s => s && s.status !== 'Inativo' && (s.tipo === 'OPERADOR' || s.tipo === 'AMBOS' || !s.tipo))
    .map(s => s.texto);
}

export function obterSugestoesVigilantesAtivas() {
  const sugestoes = obterSugestoesSincrono();
  return sugestoes
    .filter(s => s && s.status !== 'Inativo' && (s.tipo === 'VIGILANTE' || s.tipo === 'AMBOS' || !s.tipo))
    .map(s => s.texto);
}

export async function adicionarSugestaoObservacao({ texto, tipo = 'AMBOS', status = 'Ativo' }) {
  if (!texto || !texto.trim()) throw new Error('O texto da observação é obrigatório.');
  const lista = await carregarSugestoesObservacoes();
  const textoLimpo = texto.trim();

  if (lista.some(s => s.texto.toUpperCase() === textoLimpo.toUpperCase())) {
    throw new Error(`Esta sugestão de observação já está cadastrada.`);
  }

  const nova = {
    id: `sobs-${Date.now()}`,
    texto: textoLimpo,
    tipo: tipo || 'AMBOS',
    status: status || 'Ativo',
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [...lista, nova];
  await salvarSugestoesObservacoes(novaLista);
  return nova;
}

export async function editarSugestaoObservacao(id, dadosAtualizados) {
  const lista = await carregarSugestoesObservacoes();
  const idx = lista.findIndex(s => String(s.id) === String(id));
  if (idx === -1) throw new Error('Sugestão não encontrada para edição.');

  if (dadosAtualizados.texto && dadosAtualizados.texto.trim()) {
    const textoLimpo = dadosAtualizados.texto.trim();
    if (lista.some(s => String(s.id) !== String(id) && s.texto.toUpperCase() === textoLimpo.toUpperCase())) {
      throw new Error(`Já existe outra sugestão com este mesmo texto.`);
    }
    lista[idx].texto = textoLimpo;
  }

  if (dadosAtualizados.tipo !== undefined) lista[idx].tipo = dadosAtualizados.tipo;
  if (dadosAtualizados.status !== undefined) lista[idx].status = dadosAtualizados.status;

  await salvarSugestoesObservacoes(lista);
  return lista[idx];
}

export async function excluirSugestaoObservacao(id) {
  const lista = await carregarSugestoesObservacoes();
  const novaLista = lista.filter(s => String(s.id) !== String(id));
  await salvarSugestoesObservacoes(novaLista);
  return novaLista;
}

export async function alternarStatusSugestaoObservacao(id) {
  const lista = await carregarSugestoesObservacoes();
  const item = lista.find(s => String(s.id) === String(id));
  if (!item) return lista;
  item.status = item.status === 'Ativo' ? 'Inativo' : 'Ativo';
  await salvarSugestoesObservacoes(lista);
  return lista;
}

export async function restaurarSugestoesPadrao() {
  await salvarSugestoesObservacoes([...SUGESTOES_OBS_PADRAO]);
  return [...SUGESTOES_OBS_PADRAO];
}

export const restaurarSugestoesObservacoesPadrao = restaurarSugestoesPadrao;
