import * as XLSX from 'xlsx';
import databaseTemplate from '../../data/database_template.json';

const STORAGE_KEY = 'cco_operadores_base';

export const OPERADORES_INICIAIS = (databaseTemplate && Array.isArray(databaseTemplate.operadores) && databaseTemplate.operadores.length > 0)
  ? databaseTemplate.operadores
  : [
      { id: 'op-01', nome: 'Op. Yago Marinho', matricula: 'CCO-2535', cargo: 'Tec. Segurança Eletrônica', turno: 'Comercial Adm', status: 'Ativo', observacoes: 'Administrador e Responsável Técnico CCO', dataCadastro: '2026-01-01' },
      { id: 'op-02', nome: 'Operador CCO Líder', matricula: 'CCO-1001', cargo: 'Operador CCO Líder', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Central de Operações de Segurança', dataCadastro: '2026-01-01' },
      { id: 'op-03', nome: 'Op. Central CFTV', matricula: 'CCO-1002', cargo: 'Operador CFTV', turno: '12x36 Noturno', status: 'Ativo', observacoes: 'Monitoramento contínuo de CFTV', dataCadastro: '2026-01-01' },
      { id: 'op-04', nome: 'Supervisor CCO', matricula: 'CCO-1003', cargo: 'Supervisor Operacional', turno: '12x36 Diurno', status: 'Ativo', observacoes: 'Supervisão de Efetivo e Ocorrências', dataCadastro: '2026-01-01' }
    ];

/**
 * Carrega a lista completa de operadores do backend local com fallback ao localStorage
 */
export async function carregarOperadores() {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const res = await fetch('/api/operadores', {
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const dados = await res.json();
        if (Array.isArray(dados)) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
          } catch (e) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cco_operadores_changed', { detail: dados }));
          }
          return dados;
        }
      }
    }
  } catch (err) {
    console.warn('Não foi possível carregar operadores da API local, usando fallback local:', err);
  }

  // Fallback para localStorage
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo !== null) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler operadores do localStorage:', e);
  }

  return OPERADORES_INICIAIS;
}

/**
 * Função síncrona para obter rapidamente os operadores em cache local (útil para render inicial)
 */
export function obterOperadoresCache() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo !== null) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return OPERADORES_INICIAIS;
}

/**
 * Retorna os objetos dos operadores/vigilantes com status "Ativo"
 */
export function obterOperadoresAtivos() {
  const lista = obterOperadoresCache();
  const listaSegura = Array.isArray(lista) ? lista : [];
  return listaSegura.filter(op => op && op.status !== 'Inativo');
}

/**
 * Retorna apenas os nomes dos operadores/vigilantes com status "Ativo" (para uso em <select> / dropdowns)
 */
export function obterNomesOperadoresAtivos() {
  const ativos = obterOperadoresAtivos();
  return Array.isArray(ativos) ? ativos.map(op => op?.nome).filter(Boolean) : [];
}

/**
 * Salva a lista de operadores de forma persistente e síncrona tanto na API quanto em localStorage
 */
export async function salvarOperadores(novaLista) {
  if (!Array.isArray(novaLista)) {
    throw new Error('Lista de operadores inválida.');
  }

  // 1. Salva no localStorage imediatamente
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  } catch (e) {
    console.error('Erro ao salvar operadores no localStorage:', e);
  }

  // 2. Dispara evento reativo customizado com os dados atualizados de imediato
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cco_operadores_changed', { detail: novaLista }));
  }

  // 3. Envia para a API local salvar em data/operadores.json e operadores.xlsx
  let salvouBackend = false;
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    let res = await fetch('/api/salvar-operadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaLista),
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.status === 404) {
      res = await fetch('/api/operadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaLista)
      });
    }

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      salvouBackend = true;
    }
  } catch (err) {
    console.warn('Aviso: Erro ao salvar operadores via API local (salvo com segurança em cache local):', err);
  }

  return { success: true, salvouBackend, total: novaLista.length };
}

/**
 * Adiciona um novo operador
 */
export async function adicionarOperador(dados) {
  const listaAtual = await carregarOperadores();
  
  const nomeLimpo = (dados.nome || '').trim();
  const matriculaLimpa = (dados.matricula || '').trim();

  if (!nomeLimpo) {
    throw new Error('O nome do operador é obrigatório.');
  }

  const novoOperador = {
    id: `op-${Date.now()}`,
    nome: nomeLimpo,
    matricula: matriculaLimpa || `CCO-${Math.floor(1000 + Math.random() * 9000)}`,
    cargo: dados.cargo || 'Operador CCO',
    turno: dados.turno || '12x36 Diurno',
    status: dados.status || 'Ativo',
    observacoes: dados.observacoes || '',
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [novoOperador, ...listaAtual];
  await salvarOperadores(novaLista);
  return novoOperador;
}

/**
 * Edita um operador existente
 */
export async function editarOperador(id, dadosAtualizados) {
  const listaAtual = await carregarOperadores();
  const index = listaAtual.findIndex(op => op.id === id);

  if (index === -1) {
    throw new Error(`Operador com ID ${id} não encontrado.`);
  }

  const operadorAntigo = listaAtual[index];
  const operadorAtualizado = {
    ...operadorAntigo,
    ...dadosAtualizados,
    id: operadorAntigo.id, // ID não muda
    dataAtualizacao: new Date().toISOString().split('T')[0]
  };

  listaAtual[index] = operadorAtualizado;
  await salvarOperadores(listaAtual);
  return operadorAtualizado;
}

/**
 * Exclui um operador por ID
 */
export async function excluirOperador(id) {
  const listaAtual = await carregarOperadores();
  const novaLista = listaAtual.filter(op => op.id !== id);

  if (novaLista.length === 0) {
    throw new Error('Não é permitido remover todos os operadores da Central.');
  }

  await salvarOperadores(novaLista);
  return novaLista;
}

/**
 * Alterna o status (Ativo <-> Inativo)
 */
export async function alternarStatusOperador(id) {
  const listaAtual = await carregarOperadores();
  const operador = listaAtual.find(op => op.id === id);
  if (!operador) return listaAtual;

  const novoStatus = operador.status === 'Ativo' ? 'Inativo' : 'Ativo';
  operador.status = novoStatus;
  operador.dataAtualizacao = new Date().toISOString().split('T')[0];
  await salvarOperadores(listaAtual);
  return operador;
}

/**
 * Restaura o efetivo padrão original
 */
export async function restaurarOperadoresPadrao() {
  await salvarOperadores(OPERADORES_INICIAIS);
  return OPERADORES_INICIAIS;
}

/**
 * Exporta os operadores cadastrados diretamente para download no navegador em formato XLSX
 */
export function exportarOperadoresDownloadExcel(lista) {
  const dados = Array.isArray(lista) && lista.length > 0 ? lista : obterOperadoresCache();
  
  const linhas = dados.map((op, idx) => ({
    'Nº': idx + 1,
    'Nome / Identificação': op.nome,
    'Matrícula': op.matricula,
    'Cargo / Função': op.cargo,
    'Turno': op.turno,
    'Status': op.status,
    'Observações': op.observacoes || '-',
    'Data de Cadastro': op.dataCadastro || '-'
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(linhas);
  XLSX.utils.book_append_sheet(wb, ws, 'Efetivo Operadores CCO');
  
  const fileName = `Efetivo_Operadores_CCO_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
