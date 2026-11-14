import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Trilha } from './trilhaService';
import { logger } from '../utils/logger';

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
 * Gera um código determinístico exclusivo baseado no ID da trilha.
 * Garante que cada trilha tenha sempre um código único mesmo que não venha salvo do backend.
 */
export function getDeterministicTrailCode(trilhaId: string): string {
  if (!trilhaId) return generateAccessCode();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let hash = 0;
  for (let i = 0; i < trilhaId.length; i++) {
    hash = (hash << 5) - hash + trilhaId.charCodeAt(i);
    hash |= 0;
  }
  let code = '';
  let num = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(num % chars.length);
    num = Math.floor(num / chars.length) + (trilhaId.charCodeAt(i % trilhaId.length) || 11);
  }
  return `TRL-${code}`;
}

/**
 * Verifica de forma definitiva e segura se uma trilha é Privada.
 * Regra de Ouro: Trilhas com disponibilidade 'Aberto' NUNCA são privadas e NUNCA requerem código!
 */
export function isTrilhaPrivada(trilha?: { disponibilidade?: string; codigoAcesso?: string } | null): boolean {
  if (!trilha) return false;
  if (trilha.disponibilidade === 'Aberto') return false;
  if (trilha.disponibilidade === 'Privado') return true;
  return Boolean(trilha.codigoAcesso && trilha.codigoAcesso.trim() !== '' && trilha.codigoAcesso !== 'TRL-ACESSO');
}

/**
 * Remove qualquer código de acesso salvo para uma trilha (usado ao tornar trilha aberta ou limpando resíduos)
 */
export async function removeTrailAccessCode(trilhaId: string): Promise<void> {
  if (!trilhaId) return;
  await initCache();
  if (inMemoryCodes[trilhaId]) {
    delete inMemoryCodes[trilhaId];
    await setStorageItem(STORAGE_CODES_MAP_KEY, JSON.stringify(inMemoryCodes));
  }
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
 * Garante e retorna o código de acesso ÚNICO da trilha privada.
 * Se a trilha for aberta (disponibilidade === 'Aberto'), NUNCA gera nem retorna código.
 */
export async function getOrGenerateTrailAccessCode(
  trilhaId: string,
  serverCode?: string,
  disponibilidade?: string
): Promise<string | null> {
  if (!trilhaId) return null;
  // Trilhas abertas NUNCA possuem código
  if (disponibilidade === 'Aberto') {
    await removeTrailAccessCode(trilhaId);
    return null;
  }

  await initCache();
  if (serverCode && serverCode.trim() && serverCode.toUpperCase() !== 'TRL-ACESSO') {
    const clean = serverCode.trim().toUpperCase();
    inMemoryCodes[trilhaId] = clean;
    await setStorageItem(STORAGE_CODES_MAP_KEY, JSON.stringify(inMemoryCodes));
    return clean;
  }
  if (inMemoryCodes[trilhaId] && inMemoryCodes[trilhaId] !== 'TRL-ACESSO') {
    return inMemoryCodes[trilhaId];
  }
  const uniqueCode = getDeterministicTrailCode(trilhaId);
  inMemoryCodes[trilhaId] = uniqueCode;
  await setStorageItem(STORAGE_CODES_MAP_KEY, JSON.stringify(inMemoryCodes));
  return uniqueCode;
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
  const withPrefix = formattedInput.startsWith('TRL-') ? formattedInput : `TRL-${formattedInput}`;
  const withoutPrefix = formattedInput.startsWith('TRL-') ? formattedInput.replace(/^TRL-/, '') : formattedInput;

  const serverCode = trilha.codigoAcesso?.trim().toUpperCase();
  const localCode = inMemoryCodes[trilha._id]?.trim().toUpperCase();
  const uniqueCode = getDeterministicTrailCode(trilha._id);

  const isMatch =
    (serverCode && (serverCode === formattedInput || serverCode === withPrefix || serverCode === withoutPrefix)) ||
    (localCode && (localCode === formattedInput || localCode === withPrefix || localCode === withoutPrefix)) ||
    (uniqueCode === formattedInput || uniqueCode === withPrefix || uniqueCode === withoutPrefix);

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

