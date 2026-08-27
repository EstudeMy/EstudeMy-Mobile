import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, API_BASE_URL, API_TIMEOUT } from '../config/api.config';
import { getToken, removeToken } from './authHelpers';

export { API_BASE_URL, API_TIMEOUT };

const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    ...API_CONFIG.headers,
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
    }
    return Promise.reject(error);
  }
);

export default api;
export { getToken, setToken, removeToken, isAuthenticated } from './authHelpers';

