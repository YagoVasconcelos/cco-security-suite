import * as XLSX from 'xlsx';

const STORAGE_KEY = 'cco_operadores_base';

export const OPERADORES_INICIAIS = [
  {
    id: 'op-1',
    nome: 'Op. Operador 01',
    matricula: 'CCO-1001',
    cargo: 'Operador CCO',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: 'Operador titular da mesa de monitoramento 01',
    dataCadastro: '2026-01-01'
  },
  {
    id: 'op-2',
    nome: 'Op. Operador 02',
    matricula: 'CCO-1002',
    cargo: 'Operador CCO Líder',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: 'Líder operacional e coordenação de turno CCO',
    dataCadastro: '2026-01-01'
  }
];

/**
 * Carrega a lista completa de operadores do backend local com fallback ao localStorage
 */
export async function carregarOperadores() {
  try {
    const res = await fetch('/api/operadores');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados)) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        } catch (e) {
          // ignore quota
        }
        return dados;
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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler operadores do localStorage:', e);
  }

  // Fallback padrão inicial
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(OPERADORES_INICIAIS));
  } catch (e) {}

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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}
  return OPERADORES_INICIAIS;
}

/**
 * Retorna apenas os nomes dos operadores com status "Ativo" (para uso em <select> / dropdowns)
 */
export function obterNomesOperadoresAtivos() {
  const lista = obterOperadoresCache();
  const ativos = lista.filter(op => op.status !== 'Inativo');
  if (ativos.length === 0) {
    return lista.map(op => op.nome);
  }
  return ativos.map(op => op.nome);
}

/**
 * Salva a lista de operadores tanto na API do sistema (JSON + Excel) quanto no localStorage
 */
export async function salvarOperadores(novaLista) {
  if (!Array.isArray(novaLista)) {
    throw new Error('Lista de operadores inválida.');
  }

  // Salva no localStorage imediatamente
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  } catch (e) {
    console.error('Erro ao salvar operadores no localStorage:', e);
  }

  // Dispara evento reativo customizado para todos os componentes abertos
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cco_operadores_changed', { detail: novaLista }));
  }

  // Envia para a API local salvar em data/operadores.json e operadores.xlsx
  try {
    const res = await fetch('/api/salvar-operadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaLista)
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn('Aviso: Erro ao salvar operadores via API local (salvo em localStorage):', err);
  }

  return { success: true, savedPaths: ['localStorage'] };
}

/**
 * Adiciona um novo operador
 */
export async function adicionarOperador(dados) {
  const listaAtual = await carregarOperadores();
  
  // Formata o nome se necessário (garante padrão ou aceita direto)
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
  return await editarOperador(id, { status: novoStatus });
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
