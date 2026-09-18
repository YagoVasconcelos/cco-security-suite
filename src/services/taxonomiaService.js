/**
 * SERVIÇO DE GESTÃO DINÂMICA DE TAXONOMIA (PRÉDIOS E ÁREAS DE OCORRÊNCIA)
 * CCO Security Suite - Central de Controle Operacional
 * 
 * Permite cadastrar, editar, desativar e excluir prédios e suas áreas/setores
 * diretamente pela interface de Configurações, refletindo em tempo real nos
 * relatórios de ocorrência e nos dashboards executivos.
 */

export const TAXONOMIA_PADRAO_MAP = {
  'PORTARIA 1 (P1)': [
    'GUARITA',
    'P. FISCAL',
    'SALA DOS ARMARIOS',
    'E/S VEICULOS PESADOS',
    'E/S VEICULOS LEVES'
  ],
  'PORTARIA 2 (P2)': [
    'GUARITA',
    'E/S COLABORADORES',
    'SALAS DAS REVISTAS',
    'SALA DOS ARMARIOS',
    'CORREDOR EXTERNO'
  ],
  'COMPOSTAGEM': [
    'COMPOSTAGEM'
  ],
  'ESPAÇO SAUDE': [
    'SALA DO MEDICO',
    'SALA DE AUDIOMETRIA',
    'ENFERMARIA',
    'AMBULANCIA',
    'ADM',
    'RECEPÇÃO'
  ],
  'RESTAURANTE (SODEXO)': [
    'CATRACA RESTAURANTE',
    'AREA DE SERVIR',
    'MESAS REFETORIO',
    'VESTIARIOS',
    'CONGELADOS',
    'DISPENSA',
    'COZINHA',
    'ADM'
  ],
  'LABORATORIO QUALIDADE': [
    'SHELF LIFE',
    'CONTROLE QUALIDADE',
    'ADM'
  ],
  'BIORREFINARIA': [
    'SALA P&D',
    'RECEBIMENTO',
    'AROMATICOS',
    'BIORREFINARIA PILOTO'
  ],
  'ADM': [
    'CPD',
    'RECEPÇÃO',
    'ADMINISTRAÇÃO',
    'PRAÇA',
    'VESTIARIOS',
    'SALA AQUARELA',
    'SALA AÇAI',
    'SALA CASTANHA',
    'QUIOSQUE NATURA',
    'QUIOSQUE SODEXO'
  ],
  'HALL FABRICA': [
    'CATRACA FABRICA',
    'SABOARIA',
    'CCM',
    'SALA TUCUMÃ',
    'SALA DOJÔ',
    'SALA 3D',
    'ALMOXARIFADO SUPERIOR',
    'ALMOXARIFADO CENTRAL',
    'SALA DO TORNO',
    'SALA DOS MOLDES'
  ],
  'FABRICA': [
    'SABOARIA',
    'SALA AQUECIMENTO',
    'LINHA 1',
    'LINHA 2',
    'LINHA 3',
    'LINHA 4',
    'LINHA 5',
    'LINHA 6',
    'LINHA 7',
    'MANUTENÇÃO',
    'SALA DE EMBALAGEM'
  ],
  'GDM 1': [
    'AREA BATERIAS',
    'RECEBIMENTO',
    'RUAS DE O / AA',
    'DOCA 4',
    'DOCA 5',
    'DOCA 6'
  ],
  'GDM 2': [
    'DOCA 1',
    'DOCA 2',
    'DOCA 3',
    'MONTAGEM DE PALHETE',
    'RUAS DE A / P'
  ],
  'DOCAS': [
    'SALA DOS MOTORISTAS',
    'DOCAS 1 à 6',
    'RAMPA GDM 1',
    'AREA DAS EMPILHADEIRAS'
  ],
  'UTILIDADES': [
    'SYMRISE',
    'BOX PRINT',
    'CALDEIRARIA',
    'RESIDUOS',
    'ALMOXARIFADO EXTERNO'
  ],
  'TANCAGEM': [
    'SALAS DOS MOTORISTAS',
    'EXPEDIÇÃO',
    'CCM'
  ],
  'CALDEIRA': [
    'ADM',
    'PESQUISA',
    'CALDEIRAS'
  ],
  'RESIDUOS': [
    'CIDADE LIMPA'
  ]
};

// Gera a lista padrão plana para o CRUD
export function gerarListaPadraoPlana() {
  const lista = [];
  let contador = 1;
  Object.entries(TAXONOMIA_PADRAO_MAP).forEach(([predio, areas]) => {
    areas.forEach(area => {
      lista.push({
        id: `pa-${contador++}`,
        predio: predio.trim().toUpperCase(),
        area: area.trim().toUpperCase(),
        status: 'Ativo',
        dataCadastro: '2026-01-01'
      });
    });
  });
  return lista;
}

export const TAXONOMIA_PADRAO = gerarListaPadraoPlana();
const STORAGE_KEY = 'cco_taxonomia_predios_areas';

/**
 * Retorna a lista síncrona de mapeamentos do cache local ou padrão
 * @returns {Array<{ id: string, predio: string, area: string, status: string, dataCadastro: string }>}
 */
export function obterTaxonomiaSincrona() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[taxonomiaService] Erro ao ler do localStorage:', e);
  }
  return [...TAXONOMIA_PADRAO];
}

/**
 * Retorna o mapa { [predio]: string[] } de áreas ATIVAS para consumo direto
 * @returns {Record<string, string[]>}
 */
export function obterMapeamentoPrediosAreasSincrono() {
  const lista = obterTaxonomiaSincrona();
  const mapa = {};

  lista.forEach(item => {
    if (item && item.status !== 'Inativo' && item.predio && item.area) {
      const p = item.predio.trim().toUpperCase();
      const a = item.area.trim().toUpperCase();
      if (!mapa[p]) {
        mapa[p] = [];
      }
      if (!mapa[p].includes(a)) {
        mapa[p].push(a);
      }
    }
  });

  return mapa;
}

/**
 * Retorna a lista consolidada de todos os prédios únicos com pelo menos 1 área ativa ou cadastrada
 * @returns {string[]}
 */
export function obterListaPrediosSincrono() {
  const lista = obterTaxonomiaSincrona();
  const predios = new Set();
  lista.forEach(item => {
    if (item && item.predio) {
      predios.add(item.predio.trim().toUpperCase());
    }
  });
  return Array.from(predios);
}

/**
 * Notifica a aplicação sobre alterações na taxonomia
 */
function dispararEventoTaxonomia(dados) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('cco_taxonomia_changed', { detail: dados }));
    } catch (e) {}
  }
}

/**
 * Carrega a lista completa de mapeamento de prédios e áreas da API local ou fallback
 * @returns {Promise<Array>}
 */
export async function carregarTaxonomia() {
  try {
    const res = await fetch('/api/taxonomia-predios-areas');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        } catch (e) {}
        dispararEventoTaxonomia(dados);
        return dados;
      }
    }
  } catch (err) {
    console.warn('[taxonomiaService] Erro ao buscar da API, usando cache local:', err);
  }

  const locais = obterTaxonomiaSincrona();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locais));
  } catch (e) {}
  return locais;
}

/**
 * Salva a lista completa no backend local e no cache local
 * @param {Array} lista 
 * @returns {Promise<{ success: boolean, total: number }>}
 */
export async function salvarTaxonomia(lista) {
  if (!Array.isArray(lista)) return { success: false, total: 0 };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {}

  dispararEventoTaxonomia(lista);

  try {
    await fetch('/api/salvar-taxonomia-predios-areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lista)
    });
  } catch (err) {
    console.warn('[taxonomiaService] Erro ao sincronizar com backend local:', err);
  }

  return { success: true, total: lista.length };
}

/**
 * Adiciona um novo mapeamento Prédio -> Área
 * @param {Object} dados 
 * @returns {Promise<Object>}
 */
export async function adicionarPredioArea(dados) {
  const listaAtual = await carregarTaxonomia();

  const predioLimpo = (dados.predio || '').trim().toUpperCase();
  const areaLimpa = (dados.area || '').trim().toUpperCase();
  const status = dados.status === 'Inativo' ? 'Inativo' : 'Ativo';

  if (!predioLimpo) {
    throw new Error('O nome do Prédio é obrigatório.');
  }
  if (!areaLimpa) {
    throw new Error('O nome da Área / Setor é obrigatório.');
  }

  // Verifica duplicidade exata de prédio + área
  const jaExiste = listaAtual.some(item =>
    item.predio.trim().toUpperCase() === predioLimpo &&
    item.area.trim().toUpperCase() === areaLimpa
  );

  if (jaExiste) {
    throw new Error(`A área "${areaLimpa}" já está cadastrada para o prédio "${predioLimpo}".`);
  }

  const novoItem = {
    id: `pa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    predio: predioLimpo,
    area: areaLimpa,
    status,
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [novoItem, ...listaAtual];
  await salvarTaxonomia(novaLista);
  return novoItem;
}

/**
 * Edita um mapeamento existente
 * @param {string} id 
 * @param {Object} dadosAtualizados 
 * @returns {Promise<Object>}
 */
export async function editarPredioArea(id, dadosAtualizados) {
  const listaAtual = await carregarTaxonomia();
  const index = listaAtual.findIndex(item => item.id === id);

  if (index === -1) {
    throw new Error(`Registro de Prédio/Área ID ${id} não encontrado.`);
  }

  const predioLimpo = (dadosAtualizados.predio !== undefined ? dadosAtualizados.predio : listaAtual[index].predio).trim().toUpperCase();
  const areaLimpa = (dadosAtualizados.area !== undefined ? dadosAtualizados.area : listaAtual[index].area).trim().toUpperCase();
  const status = dadosAtualizados.status || listaAtual[index].status || 'Ativo';

  if (!predioLimpo) throw new Error('O nome do Prédio é obrigatório.');
  if (!areaLimpa) throw new Error('O nome da Área / Setor é obrigatório.');

  // Verifica duplicidade com outro ID
  const conflito = listaAtual.some(item =>
    item.id !== id &&
    item.predio.trim().toUpperCase() === predioLimpo &&
    item.area.trim().toUpperCase() === areaLimpa
  );

  if (conflito) {
    throw new Error(`Já existe outro registro com o prédio "${predioLimpo}" e área "${areaLimpa}".`);
  }

  const itemAtualizado = {
    ...listaAtual[index],
    predio: predioLimpo,
    area: areaLimpa,
    status,
    dataAtualizacao: new Date().toISOString().split('T')[0]
  };

  listaAtual[index] = itemAtualizado;
  await salvarTaxonomia(listaAtual);
  return itemAtualizado;
}

/**
 * Alterna status Ativo / Inativo
 * @param {string} id 
 * @returns {Promise<string>} Novo status
 */
export async function alternarStatusPredioArea(id) {
  const listaAtual = await carregarTaxonomia();
  const index = listaAtual.findIndex(item => item.id === id);

  if (index === -1) {
    throw new Error(`Registro ID ${id} não encontrado.`);
  }

  const statusAtual = listaAtual[index].status;
  const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';

  listaAtual[index].status = novoStatus;
  await salvarTaxonomia(listaAtual);
  return novoStatus;
}

/**
 * Exclui um mapeamento de Prédio/Área
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function excluirPredioArea(id) {
  const listaAtual = await carregarTaxonomia();
  const novaLista = listaAtual.filter(item => item.id !== id);

  if (novaLista.length === listaAtual.length) {
    throw new Error(`Registro ID ${id} não encontrado para exclusão.`);
  }

  await salvarTaxonomia(novaLista);
  return true;
}

/**
 * Restaura o mapeamento de fábrica
 * @returns {Promise<Array>}
 */
export async function restaurarTaxonomiaPadrao() {
  const padrao = gerarListaPadraoPlana();
  await salvarTaxonomia(padrao);
  return padrao;
}
