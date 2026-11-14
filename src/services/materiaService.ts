import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const isWeb = Platform.OS === 'web';
const STORAGE_MATERIAS_KEY = 'estudemy_materias_list';

export const DEFAULT_MATERIAS = [
  'Matemática',
  'História',
  'Programação',
  'Ciências',
  'Português',
  'Inglês',
  'Física',
  'Química',
  'Geografia',
  'Biologia',
  'Filosofia',
  'Sociologia',
];

async function getLocalMaterias(): Promise<string[] | null> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_MATERIAS_KEY);
        return raw ? JSON.parse(raw) : null;
      }
      return null;
    }
    const raw = await SecureStore.getItemAsync(STORAGE_MATERIAS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logger.warn('Erro ao ler matérias locais:', e);
    return null;
  }
}

async function saveLocalMaterias(list: string[]): Promise<void> {
  try {
    const json = JSON.stringify(list);
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_MATERIAS_KEY, json);
      }
      return;
    }
    await SecureStore.setItemAsync(STORAGE_MATERIAS_KEY, json);
  } catch (e) {
    logger.warn('Erro ao salvar matérias locais:', e);
  }
}

/**
 * Obtém a lista atualizada de todas as matérias cadastradas
 */
export async function obterMaterias(): Promise<string[]> {
  try {
    const res = await api.get(API_ENDPOINTS.MATERIAS);
    if (Array.isArray(res.data) && res.data.length > 0) {
      const serverList = res.data.map((item: any) => (typeof item === 'string' ? item : item.nome)).filter(Boolean);
      // Unir com as matérias locais e padrão sem duplicados
      const local = (await getLocalMaterias()) || [];
      const combined = Array.from(new Set([...serverList, ...local, ...DEFAULT_MATERIAS]));
      await saveLocalMaterias(combined);
      return combined;
    }
  } catch (err) {
    logger.warn('Falha ao buscar matérias da API. Carregando dados locais:', err);
  }

  const local = await getLocalMaterias();
  if (local && local.length > 0) {
    return Array.from(new Set([...local, ...DEFAULT_MATERIAS]));
  }

  return DEFAULT_MATERIAS;
}

/**
 * Adiciona uma nova matéria à plataforma (exclusivo para Admin)
 */
export async function adicionarMateria(nome: string): Promise<string[]> {
  const cleanNome = nome.trim();
  if (!cleanNome) {
    throw new Error('O nome da matéria não pode ser vazio.');
  }

  try {
    // 1. Tentar salvar no endpoint de Admin do backend
    await api.post('/api/admin/materias', { nome: cleanNome });
  } catch (err: any) {
    logger.warn('Erro ao salvar matéria no endpoint admin, tentando endpoint geral:', err);
    try {
      await api.post(API_ENDPOINTS.MATERIAS, { nome: cleanNome });
    } catch (e2) {
      logger.warn('Backend sem rota ativa para matérias, salvando persistência local:', e2);
    }
  }

  // 2. Atualizar cache local
  const current = await obterMaterias();
  if (!current.some((m) => m.toLowerCase() === cleanNome.toLowerCase())) {
    current.push(cleanNome);
  }
  await saveLocalMaterias(current);
  return current;
}

/**
 * Exclui uma matéria da plataforma
 */
export async function excluirMateria(nome: string): Promise<string[]> {
  const cleanNome = nome.trim();
  try {
    await api.delete(`/api/admin/materias/${encodeURIComponent(cleanNome)}`);
  } catch (err) {
    logger.warn('Erro ao excluir matéria no backend:', err);
  }

  const current = await obterMaterias();
  const updated = current.filter((m) => m.toLowerCase() !== cleanNome.toLowerCase());
  await saveLocalMaterias(updated);
  return updated;
}
