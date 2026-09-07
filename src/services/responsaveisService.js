/**
 * SERVIÇO DE GESTÃO DE RESPONSÁVEIS DO SITE & DIRETÓRIO DE REDE
 * 
 * Gerencia a persistência dos nomes institucionais para assinaturas
 * executivas nos relatórios de ocorrência (Gerente, Coordenação, Fiscal)
 * e o caminho padrão de rede para arquivamento de PDFs.
 */

export const PADRAO_RESPONSAVEIS = {
  gerenteSite: 'Alcimara Silva',
  coordenacao: 'Ordiley Batista – Coordenador de segurança local - SERVIS',
  fiscalContrato: 'Roberta Santos',
  caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
};

const STORAGE_KEY = 'cco_config_responsaveis';

/**
 * Lê os dados de responsáveis de forma síncrona do cache local
 */
export function obterResponsaveisSincrono() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (parsed && typeof parsed === 'object') {
        return {
          gerenteSite: parsed.gerenteSite || PADRAO_RESPONSAVEIS.gerenteSite,
          coordenacao: parsed.coordenacao || PADRAO_RESPONSAVEIS.coordenacao,
          fiscalContrato: parsed.fiscalContrato || PADRAO_RESPONSAVEIS.fiscalContrato,
          caminhoRede: parsed.caminhoRede || PADRAO_RESPONSAVEIS.caminhoRede
        };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler responsáveis do localStorage:', e);
  }
  return { ...PADRAO_RESPONSAVEIS };
}

/**
 * Carrega os dados de responsáveis do backend (API local) com fallback para localStorage
 */
export async function carregarResponsaveis() {
  try {
    const res = await fetch('/api/responsaveis');
    if (res.ok) {
      const dados = await res.json();
      if (dados && typeof dados === 'object') {
        const dadosCompletos = {
          gerenteSite: dados.gerenteSite || PADRAO_RESPONSAVEIS.gerenteSite,
          coordenacao: dados.coordenacao || PADRAO_RESPONSAVEIS.coordenacao,
          fiscalContrato: dados.fiscalContrato || PADRAO_RESPONSAVEIS.fiscalContrato,
          caminhoRede: dados.caminhoRede || PADRAO_RESPONSAVEIS.caminhoRede
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosCompletos));
        } catch (e) {
          // localStorage pode estar cheio
        }
        return dadosCompletos;
      }
    }
  } catch (err) {
    console.warn('API /api/responsaveis indisponível, usando cache local:', err);
  }

  return obterResponsaveisSincrono();
}

/**
 * Salva as alterações de responsáveis na API e no localStorage, disparando evento global
 */
export async function salvarResponsaveis(novosResponsaveis) {
  const dadosValidados = {
    gerenteSite: (novosResponsaveis?.gerenteSite || PADRAO_RESPONSAVEIS.gerenteSite).trim(),
    coordenacao: (novosResponsaveis?.coordenacao || PADRAO_RESPONSAVEIS.coordenacao).trim(),
    fiscalContrato: (novosResponsaveis?.fiscalContrato || PADRAO_RESPONSAVEIS.fiscalContrato).trim(),
    caminhoRede: (novosResponsaveis?.caminhoRede || PADRAO_RESPONSAVEIS.caminhoRede).trim()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosValidados));
  } catch (e) {
    console.warn('Falha ao salvar responsáveis em localStorage:', e);
  }

  try {
    const res = await fetch('/api/salvar-responsaveis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosValidados)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Falha ao salvar responsáveis no banco de dados local.');
    }
  } catch (err) {
    console.warn('Aviso: Falha ao sincronizar com backend local:', err);
  }

  // Notifica todos os módulos da aplicação em tempo real
  try {
    window.dispatchEvent(new CustomEvent('cco_responsaveis_changed', { detail: dadosValidados }));
  } catch (e) {
    // Ignora
  }

  return dadosValidados;
}

/**
 * Restaura os responsáveis e diretório de rede para os valores de fábrica
 */
export async function restaurarResponsaveisPadrao() {
  return await salvarResponsaveis(PADRAO_RESPONSAVEIS);
}
