/**
 * Serviço de Gestão e Persistência de Turnos Operacionais do Sistema CCO
 * Gerencia a lista dinâmica de turnos e sincronização com o banco de dados local.
 */

export const TURNOS_PADRAO = [
  {
    id: 'turno-1',
    nome: '12x36 Diurno',
    descricao: 'Escala operacional diurna de 12 horas (06:00 às 18:00 / 07:00 às 19:00)',
    status: 'Ativo',
    dataCadastro: '2026-09-04'
  },
  {
    id: 'turno-2',
    nome: '12x36 Noturno',
    descricao: 'Escala operacional noturna de 12 horas (18:00 às 06:00 / 19:00 às 07:00)',
    status: 'Ativo',
    dataCadastro: '2026-09-04'
  },
  {
    id: 'turno-3',
    nome: 'Administrativo',
    descricao: 'Horário comercial de segunda a sexta-feira (08:00 às 17:00)',
    status: 'Ativo',
    dataCadastro: '2026-09-04'
  }
];

const STORAGE_KEY = 'cco_turnos_config';

/**
 * Carrega a lista completa de turnos do backend ou cache local
 * @returns {Promise<Array>}
 */
export async function carregarTurnos() {
  try {
    const res = await fetch('/api/turnos');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        return dados;
      }
    }
  } catch (err) {
    console.warn('[turnosService] Erro ao carregar da API, usando cache local:', err);
  }

  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(TURNOS_PADRAO));
  return TURNOS_PADRAO;
}

/**
 * Salva a lista de turnos no backend e sincroniza no cache local
 * @param {Array} lista 
 * @returns {Promise<boolean>}
 */
export async function salvarTurnos(lista) {
  if (!Array.isArray(lista)) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

  try {
    await fetch('/api/salvar-turnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lista)
    });
  } catch (err) {
    console.warn('[turnosService] Erro ao salvar turnos no backend:', err);
  }

  window.dispatchEvent(new CustomEvent('cco_turnos_changed', { detail: lista }));
  return true;
}

/**
 * Retorna sincronamente a lista de nomes de turnos ATIVOS para preenchimento de dropdowns
 * @returns {Array<string>}
 */
export function obterNomesTurnosAtivos() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ativos = parsed
          .filter(t => t.status !== 'Inativo')
          .map(t => t.nome);
        if (ativos.length > 0) return ativos;
      }
    }
  } catch (e) {}

  return TURNOS_PADRAO.filter(t => t.status !== 'Inativo').map(t => t.nome);
}

/**
 * Adiciona um novo turno
 */
export async function adicionarTurno(dados) {
  const lista = await carregarTurnos();
  const nomeTrim = (dados.nome || '').trim();

  if (!nomeTrim) {
    throw new Error('O nome do turno é obrigatório.');
  }

  const duplicado = lista.some(t => t.nome.toLowerCase() === nomeTrim.toLowerCase());
  if (duplicado) {
    throw new Error(`Já existe um turno cadastrado com o nome "${nomeTrim}".`);
  }

  const novo = {
    id: `turno-${Date.now()}`,
    nome: nomeTrim,
    descricao: (dados.descricao || '').trim(),
    status: dados.status || 'Ativo',
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [...lista, novo];
  await salvarTurnos(novaLista);
  return novo;
}

/**
 * Edita um turno existente
 */
export async function editarTurno(id, dados) {
  const lista = await carregarTurnos();
  const nomeTrim = (dados.nome || '').trim();

  if (!nomeTrim) {
    throw new Error('O nome do turno é obrigatório.');
  }

  const duplicado = lista.some(t => t.id !== id && t.nome.toLowerCase() === nomeTrim.toLowerCase());
  if (duplicado) {
    throw new Error(`Já existe outro turno cadastrado com o nome "${nomeTrim}".`);
  }

  const novaLista = lista.map(t => {
    if (t.id === id) {
      return {
        ...t,
        nome: nomeTrim,
        descricao: (dados.descricao || '').trim(),
        status: dados.status || t.status,
        dataAtualizacao: new Date().toISOString().split('T')[0]
      };
    }
    return t;
  });

  await salvarTurnos(novaLista);
  return true;
}

/**
 * Exclui um turno da base
 */
export async function excluirTurno(id) {
  const lista = await carregarTurnos();
  const novaLista = lista.filter(t => t.id !== id);
  if (novaLista.length === 0) {
    throw new Error('O sistema deve manter pelo menos um turno cadastrado.');
  }
  await salvarTurnos(novaLista);
  return true;
}

/**
 * Alterna o status do turno (Ativo / Inativo)
 */
export async function alternarStatusTurno(id) {
  const lista = await carregarTurnos();
  const novaLista = lista.map(t => {
    if (t.id === id) {
      const novoStatus = t.status === 'Ativo' ? 'Inativo' : 'Ativo';
      return { ...t, status: novoStatus };
    }
    return t;
  });
  await salvarTurnos(novaLista);
  return true;
}

/**
 * Restaura a lista de turnos padrão de fábrica
 */
export async function restaurarTurnosPadrao() {
  await salvarTurnos(TURNOS_PADRAO);
  return TURNOS_PADRAO;
}
