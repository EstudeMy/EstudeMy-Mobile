import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import logger from '../utils/logger';

const TOKEN_KEY = 'estudemy_auth_token';
const REFRESH_TOKEN_KEY = 'estudemy_refresh_token';

const isWeb = Platform.OS === 'web';

/**
 * Obtém o token de autenticação de forma segura (SecureStore no Native, localStorage com prefixo no Web)
 */
export const getToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    logger.error('Erro ao ler token seguro:', error);
    return null;
  }
};

/**
 * Salva o token de autenticação de forma segura
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    logger.error('Erro ao salvar token seguro:', error);
  }
};

/**
 * Salva o refresh token para rotação de sessão (RC03 Session Hijacking mitigation)
 */
export const setRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    logger.error('Erro ao salvar refresh token:', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.error('Erro ao ler refresh token:', error);
    return null;
  }
};

/**
 * Remove os tokens com encerramento de sessão seguro
 */
export const removeToken = async (): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.error('Erro ao remover token seguro:', error);
  }
};

/**
 * Verifica se o usuário possui token ativo
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return token !== null && token.length > 0;
};
