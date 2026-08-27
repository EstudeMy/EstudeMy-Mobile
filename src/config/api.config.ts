import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // 1. Variável de ambiente explícita definida no .env (prioridade máxima)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Expo Go / Dispositivo Físico conectado na mesma rede local se estiver em dev local
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
    (Constants as any)?.experienceUrl;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0].replace(/^[a-z]+:\/\//i, '');
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  // 3. Emulador Android em dev local
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  // 4. Padrão Nuvem Render
  return 'https://estudemydocker.onrender.com';
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
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

/**
 * Endpoints da API EstudeMy
 */
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    CONFIRMAR: '/api/auth/confirmar',
    CRIAR_PERFIL: '/api/auth/criarPerfil',
  },
  // Usuários
  USERS: {
    ME: '/api/users/me',
    TERMOS: '/api/users/termos',
    DADOS_PESSOAIS: '/api/users/dados-pessoais',
    MUDAR_SENHA: '/api/users/mudar-senha',
    SOLICITAR_RECUPERACAO: '/api/users/solicitar-recuperacao',
    VERIFICAR_TOKEN: (token: string) => `/api/users/verificar-token/${token}`,
    REDEFINIR_SENHA: '/api/users/redefinir-senha',
    ATUALIZAR_PERSONAGEM: '/api/users/atualizar-personagem',
    IDIOMA: '/api/users/idioma',
    TEMA: '/api/users/tema',
    PREFERENCIAS: '/api/users/preferencias',
    LISTAR: '/api/users',
  },
  // Trilhas
  TRILHAS: {
    LISTAR: '/api/trilhas',
    GERAR_COM_IA: '/api/trilhas/gerar-com-ia',
    BUSCAR: '/api/trilhas/buscar',
    NOVIDADES: '/api/trilhas/novidades',
    POPULARES: '/api/trilhas/populares',
    CONTINUE: '/api/trilhas/continue',
    VISUALIZAR: (id: string) => `/api/trilhas/visualizar/${id}`,
    INICIAR: (id: string) => `/api/trilhas/iniciar/${id}`,
    POR_ID: (id: string) => `/api/trilhas/${id}`,
  },
  // Fases
  FASES: {
    LISTAR: '/api/fases',
    POR_TRILHA: (trilhaId: string) => `/api/fases/trilha/${trilhaId}`,
    POR_SECAO: (secaoId: string) => `/api/fases/secao/${secaoId}`,
    POR_ID: (id: string) => `/api/fases/${id}`,
    CONCLUIR: '/api/fases/concluir',
  },
  // Seções
  SECOES: {
    LISTAR: '/api/secoes',
    POR_TRILHA: (trilhaId: string) => `/api/secoes/trilha/${trilhaId}`,
    POR_ID: (id: string) => `/api/secoes/${id}`,
  },
  // Progresso
  PROGRESSO: {
    USUARIO: '/api/progresso/usuario',
    TRILHA: (trilhaId: string) => `/api/progresso/trilha/${trilhaId}`,
    VERIFICAR: (faseId: string) => `/api/progresso/verificar/${faseId}`,
    SALVAR: '/api/progresso/salvar',
    SALVAR_RESPOSTA: '/api/progresso/salvar-resposta',
  },
  // Ranking
  RANKING: {
    GERAL: '/api/ranking',
    NIVEL: '/api/ranking/nivel',
  },
  // Feedback e Contato
  FEEDBACK: '/api/feedback',
  CONTATO: '/api/contato',
  PERGUNTAS: '/api/perguntas',
  SCORE: '/api/score',
  MATERIAS: '/api/materias',
} as const;


