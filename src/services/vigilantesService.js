import * as XLSX from 'xlsx';

const STORAGE_KEY = 'cco_vigilantes_base';

export const VIGILANTES_INICIAIS = [
  {
    id: 'vig-1',
    nome: 'Vigilante Portaria 1',
    matricula: 'VIG-2001',
    posto: 'Portaria 1 - Principal',
    cargo: 'Vigilante Portaria 1',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: 'Posto principal de controle de acesso (P1)',
    dataCadastro: '2026-01-01'
  },
  {
    id: 'vig-2',
    nome: 'Vigilante Portaria 2',
    matricula: 'VIG-2002',
    posto: 'Portaria 2 - Cargas & Serviços',
    cargo: 'Vigilante Portaria 2',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: 'Posto de controle de acesso de serviços / carga (P2)',
    dataCadastro: '2026-01-01'
  },
  {
    id: 'vig-3',
    nome: 'Vigilante Ronda',
    matricula: 'VIG-2003',
    posto: 'Ronda Operacional',
    cargo: 'Vigilante Ronda',
    turno: '12x36 Diurno',
    status: 'Ativo',
    observacoes: 'Ronda perimetral e fiscalização móvel',
    dataCadastro: '2026-01-01'
  }
];

/**
 * Carrega a lista completa de vigilantes de posto do backend local com fallback ao localStorage
 */
export async function carregarVigilantes() {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const res = await fetch('/api/vigilantes', {
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const dados = await res.json();
        if (Array.isArray(dados) && dados.length > 0) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
          } catch (e) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cco_vigilantes_changed', { detail: dados }));
          }
          return dados;
        }
      }
    }
  } catch (err) {
    console.warn('Não foi possível carregar vigilantes da API local, usando fallback local:', err);
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
    console.error('Erro ao ler vigilantes do localStorage:', e);
  }

  // Fallback padrão inicial
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(VIGILANTES_INICIAIS));
  } catch (e) {}

  return VIGILANTES_INICIAIS;
}

/**
 * Função síncrona para obter rapidamente os vigilantes em cache local (útil para render inicial)
 */
export function obterVigilantesCache() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo !== null) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return VIGILANTES_INICIAIS;
}

/**
 * Retorna os objetos dos vigilantes com status "Ativo"
 */
export function obterVigilantesAtivos() {
  const lista = obterVigilantesCache();
  const listaSegura = Array.isArray(lista) ? lista : VIGILANTES_INICIAIS;
  const ativos = listaSegura.filter(v => v && v.status !== 'Inativo');
  return ativos.length > 0 ? ativos : listaSegura;
}

/**
 * Retorna apenas os nomes dos vigilantes com status "Ativo" (para uso em <select> / dropdowns de entregas e baixas)
 */
export function obterNomesVigilantesAtivos() {
  const ativos = obterVigilantesAtivos();
  return Array.isArray(ativos) ? ativos.map(v => v?.nome).filter(Boolean) : [];
}

/**
 * Salva a lista de vigilantes de forma persistente e síncrona tanto na API quanto em localStorage
 */
export async function salvarVigilantes(novaLista) {
  if (!Array.isArray(novaLista)) {
    throw new Error('Lista de vigilantes inválida.');
  }

  // 1. Salva no localStorage imediatamente
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  } catch (e) {
    console.error('Erro ao salvar vigilantes no localStorage:', e);
  }

  // 2. Dispara evento reativo customizado com os dados atualizados de imediato
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cco_vigilantes_changed', { detail: novaLista }));
  }

  // 3. Envia para a API local salvar em data/vigilantes.json e vigilantes.xlsx
  let salvouBackend = false;
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    let res = await fetch('/api/salvar-vigilantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaLista),
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.status === 404) {
      res = await fetch('/api/vigilantes', {
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
    console.warn('Aviso: Erro ao salvar vigilantes via API local (salvo com segurança em cache local):', err);
  }

  return { success: true, salvouBackend, total: novaLista.length };
}

/**
 * Adiciona um novo vigilante de posto
 */
export async function adicionarVigilante(dados) {
  const listaAtual = await carregarVigilantes();
  
  const nomeLimpo = (dados.nome || '').trim();
  const matriculaLimpa = (dados.matricula || '').trim();

  if (!nomeLimpo) {
    throw new Error('O nome do vigilante é obrigatório.');
  }

  const novoVigilante = {
    id: `vig-${Date.now()}`,
    nome: nomeLimpo,
    matricula: matriculaLimpa || `VIG-${Math.floor(1000 + Math.random() * 9000)}`,
    posto: dados.posto || dados.cargo || 'Portaria 1 - Principal',
    cargo: dados.cargo || dados.posto || 'Vigilante Portaria 1',
    turno: dados.turno || '12x36 Diurno',
    status: dados.status || 'Ativo',
    observacoes: dados.observacoes || '',
    dataCadastro: new Date().toISOString().split('T')[0]
  };

  const novaLista = [novoVigilante, ...listaAtual];
  await salvarVigilantes(novaLista);
  return novoVigilante;
}

/**
 * Edita um vigilante existente
 */
export async function editarVigilante(id, dadosAtualizados) {
  const listaAtual = await carregarVigilantes();
  const index = listaAtual.findIndex(v => v.id === id);

  if (index === -1) {
    throw new Error(`Vigilante com ID ${id} não encontrado.`);
  }

  const vigilanteAntigo = listaAtual[index];
  const vigilanteAtualizado = {
    ...vigilanteAntigo,
    ...dadosAtualizados,
    id: vigilanteAntigo.id, // ID preservado
    dataAtualizacao: new Date().toISOString().split('T')[0]
  };

  listaAtual[index] = vigilanteAtualizado;
  await salvarVigilantes(listaAtual);
  return vigilanteAtualizado;
}

/**
 * Exclui um vigilante por ID
 */
export async function excluirVigilante(id) {
  const listaAtual = await carregarVigilantes();
  const novaLista = listaAtual.filter(v => v.id !== id);

  if (novaLista.length === 0) {
    throw new Error('Não é permitido remover todos os vigilantes de posto da base.');
  }

  await salvarVigilantes(novaLista);
  return novaLista;
}

/**
 * Alterna o status (Ativo <-> Inativo)
 */
export async function alternarStatusVigilante(id) {
  const listaAtual = await carregarVigilantes();
  const vig = listaAtual.find(v => v.id === id);
  if (!vig) return listaAtual;

  const novoStatus = vig.status === 'Ativo' ? 'Inativo' : 'Ativo';
  vig.status = novoStatus;
  vig.dataAtualizacao = new Date().toISOString().split('T')[0];
  await salvarVigilantes(listaAtual);
  return vig;
}

/**
 * Restaura o efetivo padrão de vigilantes
 */
export async function restaurarVigilantesPadrao() {
  await salvarVigilantes(VIGILANTES_INICIAIS);
  return VIGILANTES_INICIAIS;
}

/**
 * Exporta os vigilantes de posto cadastrados para download em XLSX
 */
export function exportarVigilantesDownloadExcel(lista) {
  const dados = Array.isArray(lista) && lista.length > 0 ? lista : obterVigilantesCache();
  
  const linhas = dados.map((v, idx) => ({
    'Nº': idx + 1,
    'Nome Completo': v.nome,
    'Matrícula': v.matricula,
    'Posto Físico': v.posto || v.cargo || 'Portaria',
    'Função': v.cargo || 'Vigilante',
    'Turno': v.turno,
    'Status': v.status,
    'Observações': v.observacoes || '-',
    'Data de Cadastro': v.dataCadastro || '-'
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(linhas);
  XLSX.utils.book_append_sheet(wb, ws, 'Efetivo Vigilância de Posto');
  
  const fileName = `Efetivo_Vigilancia_Postos_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
