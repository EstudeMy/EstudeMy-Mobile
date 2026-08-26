import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

/**
 * Obtém o token de autenticação de forma assíncrona do SecureStore
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao ler o token do SecureStore:', error);
    return null;
  }
};

/**
 * Salva o token de autenticação de forma assíncrona no SecureStore
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Erro ao salvar o token no SecureStore:', error);
  }
};

/**
 * Remove o token de autenticação do SecureStore
 */
export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao remover o token do SecureStore:', error);
  }
};

/**
 * Verifica se o usuário está autenticado (assíncrono)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return token !== null;
};
