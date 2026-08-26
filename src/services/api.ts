import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import { getToken, removeToken } from './authHelpers';

// Função para descobrir dinamicamente o IP do servidor em desenvolvimento
const getBaseUrl = (): string => {
  // Se houver uma variável de ambiente definida, use-a
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Em desenvolvimento, o hostUri do Expo contém o IP da máquina do desenvolvedor
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }

  // Fallback padrão para localhost/emulador
  return 'http://10.0.2.2:5000';
};

export const API_BASE_URL = getBaseUrl();
export const API_TIMEOUT = 30000;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Interceptor de requisição: Insere o token Bearer no cabeçalho
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de resposta: Trata expiramento de token (401)
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeToken();
      // Em React Native, o redirecionamento é feito escutando a mudança de estado de autenticação no AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
export { getToken, setToken, removeToken, isAuthenticated } from './authHelpers';
