/**
 * Configuração centralizada para conexão com a API Java
 * 
 * Esta configuração define a URL base da API e outras configurações
 * importantes para comunicação com o backend Java (Spring Boot)
 */

import Constants from 'expo-constants';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }
  return 'http://10.0.2.2:5000';
};

export const API_BASE_URL = getBaseUrl();

/**
 * Timeout padrão para requisições (em milissegundos)
 */
export const API_TIMEOUT = 30000; // 30 segundos

/**
 * Configurações da API
 */
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
} as const;

/**
 * Endpoints da API
 */
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    VERIFY: "/api/auth/verify",
    TERMOS: "/api/auth/termos",
    CRIAR_PERFIL: "/api/auth/criarPerfil",
  },
  // Usuários
  USERS: {
    ME: "/api/users/me",
    VERIFY: "/api/users/verify",
    DADOS_PESSOAIS: "/api/users/dados-pessoais",
    MUDAR_SENHA: "/api/users/mudar-senha",
    SOLICITAR_RECUPERACAO: "/api/users/solicitar-recuperacao",
    VERIFICAR_TOKEN: "/api/users/verificar-token",
    REDEFINIR_SENHA: "/api/users/redefinir-senha",
    ATUALIZAR_PERSONAGEM: "/api/users/atualizar-personagem",
    IDIOMA: "/api/users/idioma",
    TEMA: "/api/users/tema",
    PREFERENCIAS: "/api/users/preferencias",
    LISTAR: "/api/usuarios",
  },
  // Trilhas
  TRILHAS: {
    LISTAR: "/api/trilhas",
    /** POST — professor; corpo `{ materia, temaOuObjetivo?, ... }`; resposta `{ trilha, secoes }` */
    GERAR_COM_IA: "/api/trilhas/gerar-com-ia",
    BUSCAR: "/api/trilhas/buscar",
    NOVIDADES: "/api/trilhas/novidades",
    POPULARES: "/api/trilhas/populares",
    CONTINUE: "/api/trilhas/continue",
    VISUALIZAR: "/api/trilhas/visualizar",
    INICIAR: "/api/trilhas/iniciar",
    POR_ID: (id: string) => `/api/trilhas/${id}`,
  },
  // Fases
  FASES: {
    LISTAR: "/api/fases",
    POR_TRILHA: (trilhaId: string) => `/api/fases/trilha/${trilhaId}`,
    POR_SECAO: (secaoId: string) => `/api/fases/secao/${secaoId}`,
    POR_ID: (id: string) => `/api/fases/${id}`,
  },
  // Seções
  SECOES: {
    LISTAR: "/api/secoes",
    POR_TRILHA: (trilhaId: string) => `/api/secoes/trilha/${trilhaId}`,
    POR_ID: (id: string) => `/api/secoes/${id}`,
  },
  // Progresso
  PROGRESSO: {
    USUARIO: "/api/progresso/usuario",
    TRILHA: (trilhaId: string) => `/api/progresso/trilha/${trilhaId}`,
    VERIFICAR: (faseId: string) => `/api/progresso/verificar/${faseId}`,
    SALVAR: "/api/progresso/salvar",
    SALVAR_RESPOSTA: "/api/progresso/salvar-resposta",
  },
  // Lições Salvas
  LICOES_SALVAS: {
    LISTAR: "/api/licoes-salvas",
    VERIFICAR: (trilhaId: string) => `/api/licoes-salvas/verificar/${trilhaId}`,
    POR_ID: (id: string) => `/api/licoes-salvas/${id}`,
  },
  // Ranking
  RANKING: {
    GERAL: "/api/ranking",
    NIVEL: "/api/ranking/nivel",
  },
  // Feedback
  FEEDBACK: "/api/feedback",
  // Contato
  CONTATO: "/api/contato",
  // Perguntas e Resultados
  PERGUNTAS: "/api/perguntas",
  RESULTADOS: "/api/resultados",
} as const;

