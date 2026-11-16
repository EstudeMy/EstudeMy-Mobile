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
const KEY_TODAS_FASES = 'estudemy_todas_fases_concluidas';
const KEY_TRILHAS_ATIVAS = 'estudemy_trilhas_ativas_set';

export interface ProgressoResumo {
  totalFasesConcluidas: number;
  totalTrilhasAtivas: number;
  fasesIds: string[];
  trilhasIds: string[];
  bossesDerrotados: number;
  speedrunsConcluidos: number;
  xpAcumulado: number;
}

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

    // Atualiza registro global de todas as fases concluídas
    const rawAll = await getItemSafe(KEY_TODAS_FASES);
    let allPhases: string[] = [];
    if (rawAll) {
      try { allPhases = JSON.parse(rawAll); } catch {}
    }
    if (!allPhases.includes(faseId)) {
      allPhases.push(faseId);
      await setItemSafe(KEY_TODAS_FASES, JSON.stringify(allPhases));
    }

    // Atualiza conjunto global de trilhas ativas
    const rawTrails = await getItemSafe(KEY_TRILHAS_ATIVAS);
    let allTrails: string[] = [];
    if (rawTrails) {
      try { allTrails = JSON.parse(rawTrails); } catch {}
    }
    if (trilhaId && !allTrails.includes(trilhaId)) {
      allTrails.push(trilhaId);
      await setItemSafe(KEY_TRILHAS_ATIVAS, JSON.stringify(allTrails));
    }
  } catch (e) {
    logger.warn('Erro ao salvar progresso localmente:', e);
  }

  // 2. Sincroniza com a API do Backend
  try {
    if (isValidId(faseId)) {
      await api.post(API_ENDPOINTS.PROGRESSO.SALVAR, {
        faseId,
        pontuacao: Math.max(0, Number(pontuacao) || 100),
        totalPerguntas: 4,
        respostasUsuario: [],
      });
    }
  } catch (apiErr: any) {
    logger.info(`[Progresso] Salvo localmente para a fase ${faseId} (modo offline-first)`);
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

/**
 * Coleta o resumo completo do progresso de aprendizagem combinando Storage local e Backend
 */
export async function obterResumoProgressoUsuario(): Promise<ProgressoResumo> {
  const fasesSet = new Set<string>();
  const trilhasSet = new Set<string>();
  let bossesDerrotados = 0;
  let speedrunsConcluidos = 0;
  let xpBackend = 0;

  // 1. Vasculha localStorage na Web
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;

        if (key.startsWith(PREFIX_PROGRESSO)) {
          const tId = key.replace(PREFIX_PROGRESSO, '').trim();
          if (tId) trilhasSet.add(tId);
          try {
            const list = JSON.parse(window.localStorage.getItem(key) || '[]');
            if (Array.isArray(list)) {
              list.forEach((fId: string) => fId && fasesSet.add(String(fId)));
            }
          } catch {}
        } else if (key.startsWith('estudemy_progresso_speedrun_')) {
          try {
            const list = JSON.parse(window.localStorage.getItem(key) || '[]');
            if (Array.isArray(list) && list.length > 0) speedrunsConcluidos += list.length;
          } catch {}
        }
      }

      const bossesSaved = parseInt(window.localStorage.getItem('estudemy_user_bosses_derrotados') || '0', 10);
      bossesDerrotados = Math.max(bossesDerrotados, isNaN(bossesSaved) ? 0 : bossesSaved);
    } catch (e) {
      logger.warn('Erro ao ler progresso de aprendizagem na web:', e);
    }
  }

  // 2. Vasculha SecureStore / chaves salvas no mobile
  try {
    const rawAll = await getItemSafe(KEY_TODAS_FASES);
    if (rawAll) {
      const list = JSON.parse(rawAll);
      if (Array.isArray(list)) list.forEach((fId: string) => fId && fasesSet.add(String(fId)));
    }

    const rawTrails = await getItemSafe(KEY_TRILHAS_ATIVAS);
    if (rawTrails) {
      const list = JSON.parse(rawTrails);
      if (Array.isArray(list)) list.forEach((tId: string) => tId && trilhasSet.add(String(tId)));
    }
  } catch {}

  // 3. Tenta sincronizar com a API do Backend
  try {
    const [progressoRes, continueRes] = await Promise.allSettled([
      api.get(API_ENDPOINTS.PROGRESSO.USUARIO),
      api.get(API_ENDPOINTS.TRILHAS.CONTINUE),
    ]);

    if (progressoRes.status === 'fulfilled' && progressoRes.value?.data) {
      const d = progressoRes.value.data;
      if (typeof d.xpAcumulado === 'number') xpBackend = Math.max(xpBackend, d.xpAcumulado);
      if (typeof d.xpAtual === 'number') xpBackend = Math.max(xpBackend, d.xpAtual);
      if (d.usuario && typeof d.usuario.xpTotal === 'number') xpBackend = Math.max(xpBackend, d.usuario.xpTotal);

      if (Array.isArray(d)) {
        d.forEach((item: any) => {
          if (item?.faseId) fasesSet.add(String(item.faseId));
          if (item?.trilhaId) trilhasSet.add(String(item.trilhaId));
        });
      } else if (Array.isArray(d.fasesConcluidas)) {
        d.fasesConcluidas.forEach((f: any) => {
          const fid = typeof f === 'string' ? f : f?.faseId || f?._id;
          if (fid) fasesSet.add(String(fid));
        });
      }
    }

    if (continueRes.status === 'fulfilled' && Array.isArray(continueRes.value?.data)) {
      continueRes.value.data.forEach((trilha: any) => {
        const tid = trilha?._id || trilha?.id;
        if (tid) trilhasSet.add(String(tid));
      });
    }
  } catch (err) {
    logger.info('[Progresso] Usando dados locais resilientes para estatísticas de aprendizado');
  }

  return {
    totalFasesConcluidas: fasesSet.size,
    totalTrilhasAtivas: trilhasSet.size,
    fasesIds: Array.from(fasesSet),
    trilhasIds: Array.from(trilhasSet),
    bossesDerrotados,
    speedrunsConcluidos,
    xpAcumulado: Math.max(xpBackend, fasesSet.size * 100),
  };
}
