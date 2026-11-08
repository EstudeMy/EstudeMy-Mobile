import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Trilha } from './trilhaService';
import logger from '../utils/logger';

const isWeb = Platform.OS === 'web';

const STORAGE_CODES_MAP_KEY = 'estudemy_trail_access_codes';
const STORAGE_UNLOCKED_KEY = 'estudemy_unlocked_trails';

// Cache em memória para acesso síncrono rápido
let inMemoryCodes: Record<string, string> = {};
let inMemoryUnlocked: Set<string> = new Set();
let isInitialized = false;

/**
 * Lê uma string do storage persistente (Web ou Native)
 */
async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    logger.error(`Erro ao ler key ${key} do storage:`, err);
    return null;
  }
}

/**
 * Escreve uma string no storage persistente (Web ou Native)
 */
async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    logger.error(`Erro ao salvar key ${key} no storage:`, err);
  }
}

/**
 * Inicializa cache em memória
 */
async function initCache(): Promise<void> {
  if (isInitialized) return;
  try {
    const rawCodes = await getStorageItem(STORAGE_CODES_MAP_KEY);
    if (rawCodes) {
      inMemoryCodes = JSON.parse(rawCodes) || {};
    }
    const rawUnlocked = await getStorageItem(STORAGE_UNLOCKED_KEY);
    if (rawUnlocked) {
      const arr = JSON.parse(rawUnlocked) || [];
      inMemoryUnlocked = new Set(arr);
    }
    isInitialized = true;
  } catch (err) {
    logger.error('Erro ao inicializar cache de acesso:', err);
  }
}

/**
 * Gera um código de acesso exclusivo e legível para trilhas privadas.
 * Exemplo: TRL-8K4M9Q
 */
export function generateAccessCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TRL-${result}`;
}

/**
 * Salva o código de acesso gerado para uma trilha
 */
export async function saveTrailAccessCode(trilhaId: string, code: string): Promise<void> {
  await initCache();
  const cleanCode = code.trim().toUpperCase();
  inMemoryCodes[trilhaId] = cleanCode;
  await setStorageItem(STORAGE_CODES_MAP_KEY, JSON.stringify(inMemoryCodes));
}

/**
 * Recupera o código de acesso de uma trilha
 */
export async function getTrailAccessCode(trilhaId: string): Promise<string | null> {
  await initCache();
  return inMemoryCodes[trilhaId] || null;
}

/**
 * Retorna todos os códigos conhecidos (mapeados por ID da trilha)
 */
export async function getAllKnownTrailCodes(): Promise<Record<string, string>> {
  await initCache();
  return { ...inMemoryCodes };
}

/**
 * Desbloqueia uma trilha privada para o estudante atual
 */
export async function unlockTrail(trilhaId: string): Promise<void> {
  await initCache();
  inMemoryUnlocked.add(trilhaId);
  await setStorageItem(STORAGE_UNLOCKED_KEY, JSON.stringify(Array.from(inMemoryUnlocked)));
}

/**
 * Verifica se a trilha está desbloqueada pelo estudante atual
 */
export async function isTrailUnlocked(trilhaId: string): Promise<boolean> {
  await initCache();
  return inMemoryUnlocked.has(trilhaId);
}

/**
 * Retorna a lista de IDs de trilhas desbloqueadas
 */
export async function getUnlockedTrails(): Promise<string[]> {
  await initCache();
  return Array.from(inMemoryUnlocked);
}

/**
 * Valida o código digitado pelo estudante contra a trilha.
 * Se coincidir, marca automaticamente a trilha como desbloqueada!
 */
export async function validateAndUnlockTrail(trilha: Trilha, inputCode: string): Promise<boolean> {
  if (!trilha || !inputCode) return false;
  await initCache();

  const formattedInput = inputCode.trim().toUpperCase();
  const serverCode = trilha.codigoAcesso?.trim().toUpperCase();
  const localCode = inMemoryCodes[trilha._id]?.trim().toUpperCase();

  const isMatch = (serverCode && serverCode === formattedInput) || (localCode && localCode === formattedInput);

  if (isMatch) {
    await unlockTrail(trilha._id);
    return true;
  }

  return false;
}

/**
 * Copia um texto para a área de transferência de forma universal (Web & Native)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback para Web legada
    if (isWeb && typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
    return true;
  } catch (err) {
    logger.warn('Erro ao copiar para clipboard:', err);
    return false;
  }
}

