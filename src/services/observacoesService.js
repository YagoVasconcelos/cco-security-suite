/**
 * Serviço de Gestão e Persistência de Observações Padrão do Sistema CCO
 * Utilizado pelos módulos de Credenciais Provisórias e Visitantes.
 */

export const OBSERVACOES_PADRAO = [
  { id: 'obs-1', nome: 'ESQUECEU', descricao: 'Colaborador esqueceu a credencial na residência', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-2', nome: 'PERDEU', descricao: 'Extravio da credencial pelo colaborador', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-3', nome: 'COM DEFEITO', descricao: 'Crachá danificado, quebrado ou chip desmagnetizado', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-4', nome: 'ATM', descricao: 'Acesso Temporário de Manutenção / Terceirizado', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-5', nome: 'BLOQUEADO', descricao: 'Bloqueio preventivo de acesso cadastral', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-6', nome: 'RETORNO DE FÉRIAS', descricao: 'Reativação ou crachá provisório de retorno de férias', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-7', nome: 'RETORNO DE LICENÇA', descricao: 'Retorno de afastamento médico ou licença institucional', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-8', nome: 'AINDA NÃO POSSUI', descricao: 'Novo colaborador aguardando emissão definitiva de credencial', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-9', nome: 'NÃO PASSOU', descricao: 'Catraca não fez a leitura do cartão titular', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-10', nome: 'FURTADO', descricao: 'Furto ou roubo do documento com registro de BO', status: 'Ativo', dataCadastro: '2026-09-04' },
  { id: 'obs-11', nome: 'OUTROS', descricao: 'Outras situações operacionais a detalhar', status: 'Ativo', dataCadastro: '2026-09-04' }
];

const STORAGE_KEY = 'cco_observacoes_config';

/**
 * Carrega a lista completa de observações do backend ou cache local
 * @returns {Promise<Array>}
 */
export async function carregarObservacoes() {
  try {
    const res = await fetch('/api/observacoes');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        return dados;
      }
    }
  } catch (err) {
    console.warn('[observacoesService] Erro ao carregar da API, usando cache local:', err);
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(OBSERVACOES_PADRAO));
  return OBSERVACOES_PADRAO;
}

/**
 * Salva a lista de observações no backend e sincroniza no cache local
 * @param {Array} lista 
 * @returns {Promise<boolean>}
 */
export async function salvarObservacoes(lista) {
  if (!Array.isArray(lista)) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

  try {
    await fetch('/api/salvar-observacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lista)
    });
  } catch (err) {
    console.warn('[observacoesService] Erro ao salvar observações no backend:', err);
  }

  window.dispatchEvent(new CustomEvent('cco_observacoes_changed', { detail: lista }));
  return true;
}

/**
 * Retorna sincronamente a lista de nomes de observações ATIVAS para preenchimento de dropdowns
 * @returns {Array<string>}
 */
export function obterNomesObservacoesAtivas() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ativas = parsed
          .filter(o => o.status !== 'Inativo')
          .map(o => o.nome);
        if (ativas.length > 0) return ativas;
      }
    }
  } catch (e) {}

  return OBSERVACOES_PADRAO.filter(o => o.status !== 'Inativo').map(o => o.nome);
}

/**
 * Adiciona uma nova observação
 */
export async function adicionarObservacao(dados) {
  const lista = await carregarObservacoes();
  const nomeUpper = (dados.nome || '').trim().toUpperCase();

  if (!nomeUpper) {
    throw new Error('O nome da observação é obrigatório.');
  }

  const duplicado = lista.some(o => o.nome.toUpperCase() === nomeUpper);
  if (duplicado) {
    throw new Error(`Já existe uma observação cadastrada com o nome "${nomeUpper}".`);
  }

  const nova = {
    id: `obs-${Date.now()}`,
    nome: nomeUpper,
    descricao: (dados.descricao || '').trim(),
    status: dados.status || 'Ativo',
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [...lista, nova];
  await salvarObservacoes(novaLista);
  return nova;
}

/**
 * Edita uma observação existente
 */
export async function editarObservacao(id, dados) {
  const lista = await carregarObservacoes();
  const nomeUpper = (dados.nome || '').trim().toUpperCase();

  if (!nomeUpper) {
    throw new Error('O nome da observação é obrigatório.');
  }

  const duplicado = lista.some(o => o.id !== id && o.nome.toUpperCase() === nomeUpper);
  if (duplicado) {
    throw new Error(`Já existe outra observação cadastrada com o nome "${nomeUpper}".`);
  }

  const novaLista = lista.map(o => {
    if (o.id === id) {
      return {
        ...o,
        nome: nomeUpper,
        descricao: (dados.descricao || '').trim(),
        status: dados.status || o.status,
        dataAtualizacao: new Date().toISOString().split('T')[0]
      };
    }
    return o;
  });

  await salvarObservacoes(novaLista);
  return true;
}

/**
 * Exclui uma observação da base
 */
export async function excluirObservacao(id) {
  const lista = await carregarObservacoes();
  const novaLista = lista.filter(o => o.id !== id);
  if (novaLista.length === 0) {
    throw new Error('O sistema deve manter pelo menos uma observação cadastrada.');
  }
  await salvarObservacoes(novaLista);
  return true;
}

/**
 * Alterna o status da observação (Ativo / Inativo)
 */
export async function alternarStatusObservacao(id) {
  const lista = await carregarObservacoes();
  const novaLista = lista.map(o => {
    if (o.id === id) {
      const novoStatus = o.status === 'Ativo' ? 'Inativo' : 'Ativo';
      return { ...o, status: novoStatus };
    }
    return o;
  });
  await salvarObservacoes(novaLista);
  return true;
}

/**
 * Restaura a lista de observações padrão de fábrica
 */
export async function restaurarObservacoesPadrao() {
  await salvarObservacoes(OBSERVACOES_PADRAO);
  return OBSERVACOES_PADRAO;
}
