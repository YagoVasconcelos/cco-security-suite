/**
 * Serviço de Gestão da Segurança e Senha Mestra do Sistema CCO
 * Gerencia a autenticação administrativa e validação segura (PBKDF2 / safeStorage DPAPI).
 * 
 * Regra Crítica: Senhas NUNCA são gravadas em texto puro ou trafegadas para o navegador.
 */

const STORAGE_KEY = 'cco_senha_mestra';

// Purga automática de resíduos legados de texto plano no cliente
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
} catch (e) {}

/**
 * Obtém os metadados de status e segurança atuais (sem expor hashes ou senhas).
 * @returns {Promise<{ protegido: boolean, dataAtualizacao: string, tipoCriptografia?: string }>}
 */
export async function obterSenhaMestra() {
  // 1. Tenta via Electron IPC nativo
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.obterStatusSeguranca === 'function') {
    try {
      const status = await window.electronAPI.obterStatusSeguranca();
      if (status && status.success) {
        return {
          protegido: true,
          dataAtualizacao: status.dataAtualizacao || new Date().toISOString(),
          tipoCriptografia: status.tipoCriptografia
        };
      }
    } catch (e) {
      console.warn('[segurancaService] Erro ao consultar status via IPC:', e);
    }
  }

  // 2. Consulta via API HTTP
  try {
    const res = await fetch('/api/seguranca');
    if (res.ok) {
      const data = await res.json();
      return {
        protegido: true,
        dataAtualizacao: data.dataAtualizacao || new Date().toISOString(),
        tipoCriptografia: data.tipoCriptografia
      };
    }
  } catch (err) {
    console.warn('[segurancaService] Erro ao buscar status de segurança da API:', err);
  }

  return {
    protegido: true,
    dataAtualizacao: new Date().toISOString()
  };
}

/**
 * Valida a senha digitada no servidor / Electron seguro, prevenindo vazamento de hash para o cliente.
 * @param {string} senhaDigitada 
 * @returns {Promise<boolean>}
 */
export async function validarSenhaMestra(senhaDigitada) {
  if (!senhaDigitada || typeof senhaDigitada !== 'string') {
    return false;
  }

  const senhaLimpa = senhaDigitada.trim();

  // 1. Tenta validação via IPC nativo do Electron (com safeStorage DPAPI)
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.validarSenhaMestra === 'function') {
    try {
      const resp = await window.electronAPI.validarSenhaMestra(senhaLimpa);
      if (resp && typeof resp.valido === 'boolean') {
        return resp.valido;
      }
    } catch (err) {
      console.warn('[segurancaService] Erro na validação IPC, tentando API HTTP:', err);
    }
  }

  // 2. Validação via endpoint seguro POST /api/validar-senha
  try {
    let res = await fetch('/api/validar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senhaLimpa })
    });

    if (res.status === 404) {
      res = await fetch('/api/seguranca/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaLimpa })
      });
    }

    if (res.ok) {
      const data = await res.json();
      return Boolean(data.valido);
    }
  } catch (err) {
    console.error('[segurancaService] Erro ao conectar ao serviço de autenticação:', err);
  }

  return false;
}

/**
 * Altera a Senha Mestra do sistema com hash irreversível e blindagem em disco.
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

  const novaSenhaLimpa = novaSenha.trim();

  // 1. Tenta alteração via Electron IPC nativo
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.alterarSenhaMestra === 'function') {
    try {
      const resp = await window.electronAPI.alterarSenhaMestra(senhaAtual, novaSenhaLimpa);
      if (resp) {
        if (resp.error) {
          throw new Error(resp.error);
        }
        if (resp.success) {
          window.dispatchEvent(new CustomEvent('cco_senha_changed', {
            detail: { dataAtualizacao: resp.dataAtualizacao || new Date().toISOString() }
          }));
          return {
            success: true,
            message: resp.message || 'Senha mestra alterada e blindada com sucesso!'
          };
        }
      }
    } catch (err) {
      if (err.message && (err.message.includes('incorreta') || err.message.includes('caracteres') || err.message.includes('vazia'))) {
        throw err;
      }
      console.warn('[segurancaService] Falha IPC ao salvar senha, tentando API HTTP:', err);
    }
  }

  // 2. Alteração via API HTTP
  try {
    let res = await fetch('/api/salvar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha: novaSenhaLimpa })
    });

    if (res.status === 404) {
      res = await fetch('/api/seguranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha: novaSenhaLimpa })
      });
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao alterar a senha mestra.');
    }

    window.dispatchEvent(new CustomEvent('cco_senha_changed', {
      detail: { dataAtualizacao: data.dataAtualizacao || new Date().toISOString() }
    }));

    return {
      success: true,
      message: data.message || 'Senha mestra alterada e blindada com sucesso!'
    };
  } catch (err) {
    if (err.message) {
      throw err;
    }
    throw new Error('Não foi possível se comunicar com o serviço de segurança.');
  }
}
