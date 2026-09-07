/**
 * Serviço de Gestão da Segurança e Senha Mestra do Sistema CCO
 * Gerencia a autenticação administrativa e persistência no arquivo local (data/seguranca.json).
 * Senha padrão de fábrica: admin123
 */

const SENHA_PADRAO = 'admin123';
const STORAGE_KEY = 'cco_senha_mestra';

/**
 * Obtém a senha mestra atual do backend (ou localStorage com fallback seguro).
 * @returns {Promise<{ senhaMestra: string, dataAtualizacao: string }>}
 */
export async function obterSenhaMestra() {
  try {
    const res = await fetch('/api/seguranca');
    if (res.ok) {
      const data = await res.json();
      if (data && data.senhaMestra) {
        // Sincroniza cache local
        localStorage.setItem(STORAGE_KEY, data.senhaMestra);
        return {
          senhaMestra: data.senhaMestra,
          dataAtualizacao: data.dataAtualizacao || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('[segurancaService] Erro ao buscar da API, usando fallback local:', err);
  }

  // Fallback LocalStorage ou Senha de Fábrica
  const local = localStorage.getItem(STORAGE_KEY) || SENHA_PADRAO;
  return {
    senhaMestra: local,
    dataAtualizacao: new Date().toISOString()
  };
}

/**
 * Valida se a senha digitada confere com a Senha Mestra cadastrada.
 * @param {string} senhaDigitada 
 * @returns {Promise<boolean>}
 */
export async function validarSenhaMestra(senhaDigitada) {
  if (!senhaDigitada || typeof senhaDigitada !== 'string') {
    return false;
  }

  const { senhaMestra } = await obterSenhaMestra();
  return senhaDigitada.trim() === senhaMestra.trim();
}

/**
 * Altera a Senha Mestra do sistema.
 * @param {string} senhaAtual 
 * @param {string} novaSenha 
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function alterarSenhaMestra(senhaAtual, novaSenha) {
  if (!novaSenha || typeof novaSenha !== 'string' || novaSenha.trim().length === 0) {
    throw new Error('A nova senha não pode ser vazia.');
  }

  if (novaSenha.trim().length < 4) {
    throw new Error('A nova senha deve possuir pelo menos 4 caracteres.');
  }

  // Tenta persistir no backend JSON
  try {
    const res = await fetch('/api/salvar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha: novaSenha.trim() })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao alterar a senha mestra.');
    }

    // Atualiza cache local
    localStorage.setItem(STORAGE_KEY, novaSenha.trim());

    // Dispara evento global
    window.dispatchEvent(new CustomEvent('cco_senha_changed', {
      detail: { dataAtualizacao: new Date().toISOString() }
    }));

    return {
      success: true,
      message: data.message || 'Senha mestra alterada com sucesso!'
    };
  } catch (err) {
    // Se o backend estiver indisponível, faz validação e persistência local
    console.warn('[segurancaService] API indisponível, processando localmente:', err);

    const senhaSalva = localStorage.getItem(STORAGE_KEY) || SENHA_PADRAO;
    if (senhaAtual.trim() !== senhaSalva.trim()) {
      throw new Error('A senha atual informada está incorreta.');
    }

    localStorage.setItem(STORAGE_KEY, novaSenha.trim());
    window.dispatchEvent(new CustomEvent('cco_senha_changed', {
      detail: { dataAtualizacao: new Date().toISOString() }
    }));

    return {
      success: true,
      message: 'Senha mestra atualizada no cache local com sucesso!'
    };
  }
}
