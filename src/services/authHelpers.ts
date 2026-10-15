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
    inMemoryUser = null;
    inMemoryProfileCompleted = false;
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(PROFILE_COMPLETED_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(PROFILE_COMPLETED_KEY);
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

const USER_KEY = 'estudemy_user_data';
const PROFILE_COMPLETED_KEY = 'estudemy_profile_completed';

// Cache em memória para garantir consistência instantânea caso SecureStore demore ou falhe
let inMemoryUser: any = null;
let inMemoryProfileCompleted = false;

export const saveLocalUser = async (user: any): Promise<void> => {
  try {
    inMemoryUser = user;
    const json = JSON.stringify(user);
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_KEY, json);
      }
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, json, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    logger.error('Erro ao salvar user local:', error);
  }
};

export const getLocalUser = async (): Promise<any | null> => {
  if (inMemoryUser) {
    return inMemoryUser;
  }
  try {
    let json: string | null = null;
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        json = window.localStorage.getItem(USER_KEY);
      }
    } else {
      json = await SecureStore.getItemAsync(USER_KEY, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    const parsed = json ? JSON.parse(json) : null;
    if (parsed) {
      inMemoryUser = parsed;
    }
    return parsed;
  } catch (error) {
    logger.error('Erro ao ler user local:', error);
    return null;
  }
};

export const setProfileCompleted = async (completed: boolean, userIdentifier?: string): Promise<void> => {
  try {
    const rawKey = userIdentifier ? `${PROFILE_COMPLETED_KEY}_${userIdentifier.toLowerCase()}` : PROFILE_COMPLETED_KEY;
    // SecureStore exige que as chaves contenham apenas caracteres alfanuméricos, '.', '-' e '_'
    const key = rawKey.replace(/[^a-zA-Z0-9_.-]/g, '_');
    inMemoryProfileCompleted = completed;
    const val = completed ? 'true' : 'false';
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
      return;
    }
    await SecureStore.setItemAsync(key, val, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    logger.error('Erro ao salvar profile completed:', error);
  }
};

export const isProfileCompleted = async (userIdentifier?: string): Promise<boolean> => {
  try {
    const rawKey = userIdentifier ? `${PROFILE_COMPLETED_KEY}_${userIdentifier.toLowerCase()}` : PROFILE_COMPLETED_KEY;
    const key = rawKey.replace(/[^a-zA-Z0-9_.-]/g, '_');
    let val: string | null = null;
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        val = window.localStorage.getItem(key);
      }
    } else {
      val = await SecureStore.getItemAsync(key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    return val === 'true';
  } catch (error) {
    return false;
  }
};
