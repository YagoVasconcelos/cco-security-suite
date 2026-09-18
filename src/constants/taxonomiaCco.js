// Matriz Oficial de Taxonomia CCO Security Suite
import { 
  obterMapeamentoPrediosAreasSincrono, 
  obterListaPrediosSincrono 
} from '../services/taxonomiaService';

/**
 * Operadores exclusivos da Central de Controle Operacional (CCO)
 */
export const OPERADORES_CCO = [
  'Op. Operador 01',
  'Op. Operador 02',
  'Op. Operador 03',
  'Op. Operador 04'
];

/**
 * Mapeamento oficial dos Prédios do Site (17 prédios conforme planilha oficial)
 */
export const PREDIOS_CCO = [
  'PORTARIA 1 (P1)',
  'PORTARIA 2 (P2)',
  'COMPOSTAGEM',
  'ESPAÇO SAUDE',
  'RESTAURANTE (SODEXO)',
  'LABORATORIO QUALIDADE',
  'BIORREFINARIA',
  'ADM',
  'HALL FABRICA',
  'FABRICA',
  'GDM 1',
  'GDM 2',
  'DOCAS',
  'UTILIDADES',
  'TANCAGEM',
  'CALDEIRA',
  'RESIDUOS'
];

/**
 * Mapeamento fixo e oficial de relacionamento estrutural: Prédio -> Áreas / Setores
 * Fonte: Planilha Oficial "LEVANTAMENTO DE AREA E OCORRENCIA"
 */
export const MAPEAMENTO_PREDIO_AREAS_CCO = {
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
    'PARAMETRIZAÇÃO',
    'MONTAGEM',
    'SALA EKOS',
    'PESAGEM',
    'MISTURADORES',
    'CALANDRAS',
    'LINHA 1',
    'LINHA 2',
    'LINHA 3',
    'LINHA 4',
    'SALA MANUTENÇÃO'
  ],
  'GDM 1': [
    'BATERIAS / EMPILHADEIRA',
    'AMIDO',
    'ENVASE',
    'ATENDIMENTO DE FABRICA',
    'TERMINAL DE CONSULTA',
    'AREA DE AMOSTRAGEM',
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

// Mapeamento de sinônimos / apelidos para compatibilidade total
const ALIASES_PREDIO = {
  'PORTARIA 1': 'PORTARIA 1 (P1)',
  'P1': 'PORTARIA 1 (P1)',
  'PORTARIA 2': 'PORTARIA 2 (P2)',
  'P2': 'PORTARIA 2 (P2)',
  'RESTAURANTE': 'RESTAURANTE (SODEXO)',
  'RESTAURANTE / REFEITÓRIO': 'RESTAURANTE (SODEXO)',
  'REFEITÓRIO': 'RESTAURANTE (SODEXO)',
  'SODEXO': 'RESTAURANTE (SODEXO)',
  'PRÉDIO ADMINISTRATIVO': 'ADM',
  'PREDIO ADMINISTRATIVO': 'ADM',
  'ADMINISTRATIVO': 'ADM',
  'ADMINISTRAÇÃO': 'ADM',
  'GALPÃO': 'GDM 1',
  'GALPAO': 'GDM 1',
  'GALPÃO 1': 'GDM 1',
  'GALPAO 1': 'GDM 1',
  'GALPÃO 2': 'GDM 2',
  'GALPAO 2': 'GDM 2',
  'ESPAÇO SAÚDE': 'ESPAÇO SAUDE',
  'LABORATÓRIO QUALIDADE': 'LABORATORIO QUALIDADE',
  'LABORATÓRIO': 'LABORATORIO QUALIDADE',
  'FÁBRICA': 'FABRICA',
  'HALL FÁBRICA': 'HALL FABRICA'
};

/**
 * Retorna a lista atualizada de todos os prédios disponíveis (configurados ou padrão)
 * @returns {string[]}
 */
export function obterPrediosAtivos() {
  try {
    const dinamicos = obterListaPrediosSincrono();
    if (Array.isArray(dinamicos) && dinamicos.length > 0) {
      return Array.from(new Set([...dinamicos, ...PREDIOS_CCO]));
    }
  } catch (e) {}
  return [...PREDIOS_CCO];
}

/**
 * Retorna a lista oficial e dinâmica de áreas correspondentes ao prédio informado.
 * Suporta correspondência exata, sinônimos operacionais e configurações personalizadas.
 * @param {string} predio 
 * @returns {string[]} Lista de áreas do prédio ou array vazio
 */
export function obterAreasDoPredio(predio) {
  if (!predio || typeof predio !== 'string') return [];
  const pTrim = predio.trim();
  const pUpper = pTrim.toUpperCase();

  // 1. Tenta buscar no mapa dinâmico configurado pelo usuário no sistema
  try {
    const mapaDinamico = obterMapeamentoPrediosAreasSincrono();
    if (mapaDinamico && typeof mapaDinamico === 'object') {
      if (mapaDinamico[pUpper] && Array.isArray(mapaDinamico[pUpper]) && mapaDinamico[pUpper].length > 0) {
        return [...mapaDinamico[pUpper]];
      }
      if (ALIASES_PREDIO[pUpper] && mapaDinamico[ALIASES_PREDIO[pUpper]]) {
        return [...mapaDinamico[ALIASES_PREDIO[pUpper]]];
      }
      const chaveDin = Object.keys(mapaDinamico).find(
        k => k === pUpper || pUpper.startsWith(k) || k.startsWith(pUpper)
      );
      if (chaveDin && mapaDinamico[chaveDin]?.length > 0) {
        return [...mapaDinamico[chaveDin]];
      }
    }
  } catch (e) {}

  // 2. Busca direta no mapa padrão estático
  if (MAPEAMENTO_PREDIO_AREAS_CCO[pTrim]) {
    return [...MAPEAMENTO_PREDIO_AREAS_CCO[pTrim]];
  }

  // 3. Busca por alias no mapa padrão estático
  if (ALIASES_PREDIO[pUpper] && MAPEAMENTO_PREDIO_AREAS_CCO[ALIASES_PREDIO[pUpper]]) {
    return [...MAPEAMENTO_PREDIO_AREAS_CCO[ALIASES_PREDIO[pUpper]]];
  }

  // 4. Busca case-insensitive aproximada no mapa padrão
  const chaveEncontrada = Object.keys(MAPEAMENTO_PREDIO_AREAS_CCO).find(
    k => k.toUpperCase() === pUpper || pUpper.startsWith(k.toUpperCase()) || k.toUpperCase().startsWith(pUpper)
  );

  if (chaveEncontrada) {
    return [...MAPEAMENTO_PREDIO_AREAS_CCO[chaveEncontrada]];
  }

  return [];
}

/**
 * Lista consolidada de todas as Áreas / Setores para compatibilidade geral
 */
export const AREAS_CCO = [
  ...new Set(Object.values(MAPEAMENTO_PREDIO_AREAS_CCO).flat())
];

/**
 * Mapeamento oficial dos Tópicos / Naturezas de Ocorrência
 */
export const TOPICOS_OCORRENCIA = [
  'USO INDEVIDO DE EPI',
  'NÃO UTILIZAÇÃO DE EPI',
  'ARRASTA PALHETE',
  'ERGONOMIA',
  'FURTO',
  'ALIMENTO',
  'DESVIO DE CONDUTA',
  'QUEBRA DE PROCEDIMENTO',
  'USO DE CELULAR INDEVIDO',
  'FONES DE OUVIDO',
  'DANOS PATRIMONIAIS',
  'QUASE ACIDENTE (Q.A)',
  'ACIDENTE',
  'DESCARTE INDEVIDO',
  'QUEBRA DE ACESSO',
  'AMBULANCIA'
];

/**
 * Principais Empresas contratadas e parceiras do Site
 */
export const EMPRESAS_CCO = [
  'PRESTADORES DE SERVIÇOS',
  'SEGURANÇA PATRIMONIAL',
  'ENGENHARIA E MANUTENÇÃO',
  'LOGÍSTICA E TRANSPORTES',
  'ALIMENTAÇÃO E CONVIVÊNCIA',
  'CONSTRUÇÃO CIVIL',
  'ADMINISTRAÇÃO CENTRAL'
];

/**
 * Classificações Oficiais de Gravidade / Severidade CCO
 */
export const GRAVIDADES_CCO = ['Baixa', 'Média', 'Alta', 'Crítica'];

/**
 * Normaliza qualquer valor de gravidade (legado, maiúsculo, com ou sem acento, variações como 'LEVE' ou 'GRAVE')
 * para o formato canônico: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
 */
export const normalizarGravidade = (g) => {
  if (!g) return 'Média';
  const s = String(g).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('CRITIC')) return 'Crítica';
  if (s.includes('ALT') || s.includes('GRAV')) return 'Alta';
  if (s.includes('MED')) return 'Média';
  if (s.includes('BAIX') || s.includes('LEV')) return 'Baixa';
  return 'Média';
};

