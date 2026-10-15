import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, API_BASE_URL, API_TIMEOUT } from '../config/api.config';
import { getToken, removeToken } from './authHelpers';
import { isJwtExpired } from '../utils/security';
import asyncLock from '../utils/asyncLock';
import logger from '../utils/logger';

export { API_BASE_URL, API_TIMEOUT };

// eslint-disable-next-line import/no-named-as-default-member
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    ...API_CONFIG.headers,
  },
});

/**
 * Interceptor de requisição:
 * - RC03: Valida se o token não está expirado antes de enviar
 * - RC09: Insere Idempotency-Key em mutações (POST, PUT, DELETE)
 * - Adiciona cabeçalhos de segurança contra MIME-sniffing
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();

    if (token) {
      // Verifica expiração preventiva do token
      if (isJwtExpired(token)) {
        logger.warn('Token expirado detectado antes da requisição. Limpando sessão.');
        await removeToken();
      } else if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Se for método de mutação sensível, anexa chave de idempotência se ainda não existir (RC09)
    if (config.method && ['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
      if (config.headers && !config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = asyncLock.generateIdempotencyKey();
      }
    }

    return config;
  },
  (error: AxiosError) => {
    logger.error('Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de resposta:
 * - RC03: Trata expiração/invalidação de token (401 Unauthorized)
 * - RC08: Trata Rate Limiting / DDoS (429 Too Many Requests)
 * - RC10: Trata mensagens de erro sem expor detalhes internos
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      logger.warn(`Sessão expirada ou não autorizada (401) na URL: ${error.config?.url}. Removendo token...`);
      await removeToken();
    } else if (status === 429) {
      // RC08: DDoS & Rate Limiting
      logger.warn('Limite de requisições excedido (429 Too Many Requests). Aguarde alguns instantes.');
    } else if (status && status >= 500) {
      logger.error(`Erro interno do servidor (${status}). Detalhes protegidos.`);
    }

    return Promise.reject(error);
  }
);

export default api;
export { getToken, setToken, removeToken, isAuthenticated } from './authHelpers';
