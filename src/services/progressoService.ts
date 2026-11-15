/**
 * progressoService.ts
 * Gerenciamento resiliente de progresso de fases e trilhas.
 * Suporta Web (localStorage) e Mobile (SecureStore) com sincronização e fallback offline-first.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { isValidId } from '../utils/security';
import logger from '../utils/logger';

const PREFIX_PROGRESSO = 'estudemy_progresso_trilha_';

async function getItemSafe(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItemSafe(key: string, val: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, val);
  } catch {}
}

/**
 * Obtém os IDs de todas as fases concluídas salvas localmente para uma trilha
 */
export async function obterFasesConcluidasLocalmente(trilhaId: string): Promise<string[]> {
  if (!trilhaId) return [];
  try {
    const raw = await getItemSafe(`${PREFIX_PROGRESSO}${trilhaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    logger.warn('Erro ao ler progresso local da trilha:', err);
    return [];
  }
}

/**
 * Registra a conclusão de uma fase localmente e tenta sincronizar com o backend
 */
export async function registrarFaseConcluida(
  trilhaId: string,
  faseId: string,
  pontuacao: number = 100
): Promise<string[]> {
  if (!trilhaId || !faseId) return [];

  // 1. Salva no Storage Local imediatamente (Offline-first / Instantâneo)
  let concluidas: string[] = [];
  try {
    const atuais = await obterFasesConcluidasLocalmente(trilhaId);
    if (!atuais.includes(faseId)) {
      concluidas = [...atuais, faseId];
      await setItemSafe(`${PREFIX_PROGRESSO}${trilhaId}`, JSON.stringify(concluidas));
    } else {
      concluidas = atuais;
    }
  } catch (e) {
    logger.warn('Erro ao salvar progresso localmente:', e);
  }

  // 2. Sincroniza com a API do Backend
  try {
    if (isValidId(faseId)) {
      await api.post(API_ENDPOINTS.PROGRESSO.SALVAR, {
        faseId,
        trilhaId: isValidId(trilhaId) ? trilhaId : undefined,
        pontuacao: Math.max(0, pontuacao),
        totalPerguntas: 4,
        acertos: 4,
        erros: 0,
        concluido: true,
      });
    }
  } catch (apiErr) {
    logger.warn('[Progresso] Falha na sincronização com backend, mantido localmente:', apiErr);
  }

  return concluidas;
}

/**
 * Limpa o progresso local de uma trilha (para reiniciar)
 */
export async function limparProgressoTrilha(trilhaId: string): Promise<void> {
  if (!trilhaId) return;
  try {
    await setItemSafe(`${PREFIX_PROGRESSO}${trilhaId}`, JSON.stringify([]));
  } catch {}
}
