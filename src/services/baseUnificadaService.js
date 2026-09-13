// Serviço de Base Unificada Global - Compartilhamento Cruzado de Cadastros
// Unifica o histórico de Colaboradores, Visitantes, RFID e Ocorrências

const CACHE_KEY = 'cco_cadastros_compartilhados';

/**
 * Normaliza textos para comparações precisas sem acentos
 */
export function normalizarTexto(txt = '') {
  return txt
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * REGRA DE NEGÓCIO ESTRITA: Valida se o nome é de uma pessoa física legítima
 * Filtra e exclui qualquer termo genérico, anônimo, evadido ou de estoque.
 */
export function isNomeValido(nome) {
  if (!nome || typeof nome !== 'string') return false;
  const n = nome.trim();
  if (n.length < 2) return false;

  const nNorm = normalizarTexto(n);

  // Termos estritamente proibidos de pessoas não identificadas ou operacionais
  const termosProibidos = [
    'NAO IDENTIFICADO',
    'INDIVIDUO NAO IDENTIFICADO',
    'SEM IDENTIFICACAO',
    'DESCONHECIDO',
    'IGNORADO',
    'EVADIDO',
    'FORAGIDO',
    'ANONIMO',
    'SUSPEITO',
    'INFRATOR',
    'NAO INFORMADO',
    'NAO CONSTA',
    'NAO DECLARADO',
    'A DEFINIR',
    'A VINCULAR',
    'ESTOQUE',
    'DISPONIVEL',
    'INVENTARIO',
    'ROTATIVO',
    'CRACHA',
    'CARTAO',
    'VISITA PARTICULAR',
    'TESTE'
  ];

  for (const termo of termosProibidos) {
    if (nNorm.includes(termo)) {
      return false;
    }
  }

  // Não pode ser termos reservados curtos
  if (['N/A', 'ND', 'NULL', 'UNDEFINED', '-'].includes(nNorm)) {
    return false;
  }

  // Deve possuir ao menos 2 caracteres alfabéticos reais
  const letras = nNorm.replace(/[^A-Z]/g, '');
  if (letras.length < 2) return false;

  return true;
}

/**
 * REGRA DE NEGÓCIO ESTRITA: Valida se a empresa é legítima
 */
export function isEmpresaValida(empresa) {
  if (!empresa || typeof empresa !== 'string') return false;
  const e = empresa.trim();
  if (e.length < 2) return false;

  const eNorm = normalizarTexto(e);

  const termosProibidos = [
    'NAO IDENTIFICADO',
    'INDIVIDUO',
    'DESCONHECIDO',
    'IGNORADO',
    'NAO INFORMADO',
    'NAO CONSTA',
    'ESTOQUE CCO',
    'ESTOQUE',
    'DISPONIVEL',
    'VISITA PARTICULAR',
    'INTERNO',
    'TESTE'
  ];

  for (const termo of termosProibidos) {
    if (eNorm.includes(termo)) {
      return false;
    }
  }

  if (['N/A', 'ND', 'NULL', 'UNDEFINED', '-'].includes(eNorm)) {
    return false;
  }

  return true;
}

// Cache em memória para dados carregados de APIs ou arquivos
let cacheProvisoriosMemoria = [];
let cacheRfidMemoria = [];
let cacheVisitantesMemoria = [];
let cacheOcorrenciasMemoria = [];

/**
 * Sincroniza dados assincronamente com o backend da aplicação (/api/*)
 * Garante que mesmo sem o usuário ter navegado pelos outros módulos,
 * as pessoas e empresas de Provisórios, RFID, Visitantes e Ocorrências estejam no autocomplete.
 */
export async function sincronizarBaseUnificada() {
  if (typeof window === 'undefined') return;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;
    const opt = controller ? { signal: controller.signal } : {};

    const [resProv, resRfid, resVis, resOc] = await Promise.all([
      fetch('/api/provisorios', opt).catch(() => null),
      fetch('/api/rfid', opt).catch(() => null),
      fetch('/api/visitantes', opt).catch(() => null),
      fetch('/api/ocorrencias', opt).catch(() => null)
    ]);

    if (timeoutId) clearTimeout(timeoutId);

    if (resProv && resProv.ok) {
      const data = await resProv.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        cacheProvisoriosMemoria = data;
        try {
          if (!localStorage.getItem('cco_provisorios_registros')) {
            localStorage.setItem('cco_provisorios_registros', JSON.stringify(data));
          }
        } catch (_) {}
      }
    }

    if (resRfid && resRfid.ok) {
      const data = await resRfid.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        cacheRfidMemoria = data;
        try {
          if (!localStorage.getItem('cco_rfid_inventario')) {
            localStorage.setItem('cco_rfid_inventario', JSON.stringify(data));
          }
        } catch (_) {}
      }
    }

    if (resVis && resVis.ok) {
      const data = await resVis.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        cacheVisitantesMemoria = data;
        try {
          if (!localStorage.getItem('cco_visitantes_registros')) {
            localStorage.setItem('cco_visitantes_registros', JSON.stringify(data));
          }
        } catch (_) {}
      }
    }

    if (resOc && resOc.ok) {
      const data = await resOc.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        cacheOcorrenciasMemoria = data;
        try {
          if (!localStorage.getItem('cco_ocorrencias_registros')) {
            localStorage.setItem('cco_ocorrencias_registros', JSON.stringify(data));
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    // Modo offline silencioso
  }
}

// Inicialização automática de escuta e sincronização
if (typeof window !== 'undefined') {
  sincronizarBaseUnificada();

  window.addEventListener('cco_provisorios_changed', (e) => {
    if (e.detail && Array.isArray(e.detail)) cacheProvisoriosMemoria = e.detail;
  });
  window.addEventListener('cco_rfid_changed', (e) => {
    if (e.detail && Array.isArray(e.detail)) cacheRfidMemoria = e.detail;
  });
  window.addEventListener('cco_visitantes_changed', (e) => {
    if (e.detail && Array.isArray(e.detail)) cacheVisitantesMemoria = e.detail;
  });
  window.addEventListener('cco_ocorrencias_changed', (e) => {
    if (e.detail && Array.isArray(e.detail)) cacheOcorrenciasMemoria = e.detail;
  });
}

/**
 * Coleta e consolida todos os perfis cadastrados em todos os módulos da aplicação
 * Fontes: Provisórios, Visitantes, RFID, Ocorrências e Cache Persistente Dedicado
 */
export function obterBaseUnificadaPessoas() {
  const mapa = new Map();

  const registrar = (nome, dados = {}) => {
    if (!isNomeValido(nome)) return;
    const n = nome.trim();
    const nNorm = normalizarTexto(n);

    const existente = mapa.get(nNorm) || {
      nome: n,
      nomeNormalizado: nNorm,
      empresa: '',
      matricula: '',
      cargo: '',
      documento: '',
      placaVeiculo: '',
      origens: new Set()
    };

    // Preenche campos faltantes com dados mais específicos
    if (dados.empresa && isEmpresaValida(dados.empresa) && !existente.empresa) {
      existente.empresa = dados.empresa.trim().toUpperCase();
    }
    if (dados.matricula && !existente.matricula) {
      existente.matricula = dados.matricula.trim().toUpperCase();
    }
    if (dados.cargo && !existente.cargo) {
      existente.cargo = dados.cargo.trim().toUpperCase();
    }
    if (dados.documento && !existente.documento) {
      existente.documento = dados.documento.trim();
    }
    if (dados.placaVeiculo && !existente.placaVeiculo && dados.placaVeiculo !== 'N/A') {
      existente.placaVeiculo = dados.placaVeiculo.trim().toUpperCase();
    }
    if (dados.origem) {
      existente.origens.add(dados.origem);
    }

    mapa.set(nNorm, existente);
  };

  // 1. Extrair de Provisórios (localStorage ou memória)
  try {
    let provs = cacheProvisoriosMemoria;
    const salvosProv = typeof localStorage !== 'undefined' ? localStorage.getItem('cco_provisorios_registros') : null;
    if (salvosProv) {
      const parsed = JSON.parse(salvosProv);
      if (Array.isArray(parsed) && parsed.length > 0) provs = parsed;
    }
    if (Array.isArray(provs)) {
      provs.forEach(p => {
        if (p && p.colaborador) {
          registrar(p.colaborador, {
            empresa: p.empresa,
            matricula: p.matricula,
            cargo: p.cargo,
            origem: 'PROVISÓRIOS'
          });
        }
      });
    }
  } catch (e) {}

  // 2. Extrair de Visitantes (localStorage ou memória)
  try {
    let vis = cacheVisitantesMemoria;
    const salvosVis = typeof localStorage !== 'undefined' ? localStorage.getItem('cco_visitantes_registros') : null;
    if (salvosVis) {
      const parsed = JSON.parse(salvosVis);
      if (Array.isArray(parsed) && parsed.length > 0) vis = parsed;
    }
    if (Array.isArray(vis)) {
      vis.forEach(v => {
        if (v && v.visitante) {
          registrar(v.visitante, {
            empresa: v.empresa,
            documento: v.documento,
            placaVeiculo: v.placaVeiculo,
            origem: 'VISITANTES'
          });
        }
        if (v && v.anfitriao) {
          registrar(v.anfitriao, {
            empresa: 'INTERNO',
            cargo: v.anfitriaoSetor,
            origem: 'ANFITRIÃO'
          });
        }
      });
    }
  } catch (e) {}

  // 3. Extrair de RFID (localStorage ou memória)
  try {
    let rfids = cacheRfidMemoria;
    const salvosRfid = typeof localStorage !== 'undefined' ? localStorage.getItem('cco_rfid_inventario') : null;
    if (salvosRfid) {
      const parsed = JSON.parse(salvosRfid);
      if (Array.isArray(parsed) && parsed.length > 0) rfids = parsed;
    }
    if (Array.isArray(rfids)) {
      rfids.forEach(r => {
        if (r && r.colaborador) {
          registrar(r.colaborador, {
            empresa: r.empresa,
            origem: 'RFID'
          });
        }
      });
    }
  } catch (e) {}

  // 4. Extrair de Ocorrências (localStorage ou memória - Envolvidos)
  try {
    let ocs = cacheOcorrenciasMemoria;
    const salvosOc = typeof localStorage !== 'undefined' ? localStorage.getItem('cco_ocorrencias_registros') : null;
    if (salvosOc) {
      const parsed = JSON.parse(salvosOc);
      if (Array.isArray(parsed) && parsed.length > 0) ocs = parsed;
    }
    if (Array.isArray(ocs)) {
      ocs.forEach(oc => {
        if (oc && Array.isArray(oc.envolvidos)) {
          oc.envolvidos.forEach(env => {
            // REGRA DE NEGÓCIO ESTRITA: Exclui qualquer registro não identificado, anônimo ou evadido
            if (env && !env.naoIdentificado && isNomeValido(env.nome)) {
              registrar(env.nome, {
                empresa: isEmpresaValida(env.empresa) ? env.empresa : '',
                matricula: env.matricula,
                cargo: env.funcao || env.cargo,
                origem: 'OCORRÊNCIAS'
              });
            }
          });
        }
      });
    }
  } catch (e) {}

  // 5. Cadastros diretos adicionados na base unificada
  try {
    const salvosDiretos = localStorage.getItem(CACHE_KEY);
    if (salvosDiretos) {
      const diretos = JSON.parse(salvosDiretos);
      if (Array.isArray(diretos)) {
        diretos.forEach(d => {
          if (d && isNomeValido(d.nome)) {
            registrar(d.nome, {
              empresa: isEmpresaValida(d.empresa) ? d.empresa : '',
              matricula: d.matricula,
              cargo: d.cargo,
              documento: d.documento,
              placaVeiculo: d.placaVeiculo,
              origem: 'BASE UNIFICADA'
            });
          }
        });
      }
    }
  } catch (e) {}

  return Array.from(mapa.values()).map(p => ({
    ...p,
    origens: Array.from(p.origens)
  }));
}

/**
 * Coleta todas as empresas únicas registradas em qualquer módulo da suíte
 */
export function obterBaseUnificadaEmpresas() {
  const pessoas = obterBaseUnificadaPessoas();
  const empresasSet = new Set();

  pessoas.forEach(p => {
    if (p.empresa && isEmpresaValida(p.empresa)) {
      empresasSet.add(p.empresa.trim().toUpperCase());
    }
  });

  return Array.from(empresasSet).sort();
}

/**
 * Busca inteligente por pessoas na base global unificada
 */
export function buscarPessoasUnificadas(termo, limite = 8) {
  if (!termo || typeof termo !== 'string' || termo.trim().length === 0) return [];
  const termoNorm = normalizarTexto(termo);
  const pessoas = obterBaseUnificadaPessoas();

  return pessoas
    .filter(p => {
      if (!isNomeValido(p.nome)) return false;
      const matchNome = p.nomeNormalizado.includes(termoNorm);
      const matchDoc = p.documento && p.documento.includes(termo.trim());
      const matchMat = p.matricula && normalizarTexto(p.matricula).includes(termoNorm);
      return matchNome || matchDoc || matchMat;
    })
    .slice(0, limite);
}

/**
 * Busca inteligente por empresas na base global unificada
 */
export function buscarEmpresasUnificadas(termo, limite = 8) {
  if (!termo || typeof termo !== 'string' || termo.trim().length === 0) return [];
  const termoNorm = normalizarTexto(termo);
  const empresas = obterBaseUnificadaEmpresas();

  return empresas
    .filter(emp => isEmpresaValida(emp) && normalizarTexto(emp).includes(termoNorm))
    .slice(0, limite);
}

/**
 * Salva ou atualiza um cadastro diretamente na base unificada compartilhada
 */
export function salvarPessoaUnificada({ nome, empresa, matricula, cargo, documento, placaVeiculo }) {
  if (!isNomeValido(nome)) return;
  const nomeTrim = nome.trim();
  const nomeNorm = normalizarTexto(nomeTrim);

  try {
    const salvos = localStorage.getItem(CACHE_KEY);
    const lista = salvos ? JSON.parse(salvos) : [];
    // Limpeza profilática de registros legados inválidos
    const listaSegura = (Array.isArray(lista) ? lista : []).filter(
      item => item && isNomeValido(item.nome)
    );

    const idx = listaSegura.findIndex(
      item => item && item.nome && normalizarTexto(item.nome) === nomeNorm
    );

    const novoObj = {
      nome: nomeTrim,
      empresa: isEmpresaValida(empresa) ? empresa.trim().toUpperCase() : '',
      matricula: matricula ? matricula.trim().toUpperCase() : '',
      cargo: cargo ? cargo.trim().toUpperCase() : '',
      documento: documento ? documento.trim() : '',
      placaVeiculo: placaVeiculo ? placaVeiculo.trim().toUpperCase() : '',
      atualizadoEm: new Date().toISOString()
    };

    if (idx >= 0) {
      listaSegura[idx] = { ...listaSegura[idx], ...novoObj };
    } else {
      listaSegura.push(novoObj);
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(listaSegura));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cco_cadastros_compartilhados_changed', { detail: listaSegura })
      );
    }
  } catch (err) {
    console.warn('Falha ao salvar cadastro na base unificada:', err);
  }
}
