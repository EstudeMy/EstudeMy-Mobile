/**
 * adaptiveRecommendationService.ts
 * Motor de Recomendação Adaptativa Inteligente (Machine Learning / IA Educacional).
 * 
 * Analisa o histórico de acertos, taxa de erros e proficiência do usuário para
 * classificar o nível de desafio ideal (Zona de Desenvolvimento Proximal - ZPD):
 * - Se o usuário estiver errando muito (baixa acurácia / alto erro): recomenda trilhas mais fáceis.
 * - Se o usuário apresentar desempenho intermediário: recomenda trilhas de dificuldade média.
 * - Se o usuário estiver acertando muito (alta taxa de acertos e vitórias): recomenda trilhas mais difíceis.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Trilha } from './trilhaService';
import logger from '../utils/logger';

export type DificuldadeAlvo = 'Facil' | 'Medio' | 'Dificil';

export interface UserPerformanceSession {
  trilhaId?: string;
  faseId?: string;
  acertos: number;
  erros: number;
  vitoria: boolean;
  dificuldade?: string;
  timestamp: number;
}

export interface UserSkillProfile {
  totalAcertos: number;
  totalErros: number;
  taxaAcerto: number; // 0.0 a 1.0 (ex: 0.85 = 85%)
  taxaErro: number; // 0.0 a 1.0
  taxaVitoria: number;
  nivelUsuario: number;
  scoreProficiencia: number; // 0.0 a 1.0
  dificuldadeRecomendada: DificuldadeAlvo;
  labelMotivo: string;
  badgeTexto: string;
}

const STORAGE_KEY_PERFORMANCE = 'estudemy_ml_performance_sessions';

async function getStoredSessions(): Promise<UserPerformanceSession[]> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY_PERFORMANCE);
        return raw ? JSON.parse(raw) : [];
      }
      return [];
    }
    const raw = await SecureStore.getItemAsync(STORAGE_KEY_PERFORMANCE);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    logger.warn('[AdaptiveML] Erro ao recuperar histórico de performance:', err);
    return [];
  }
}

async function saveStoredSessions(sessions: UserPerformanceSession[]): Promise<void> {
  try {
    const serialized = JSON.stringify(sessions.slice(-50)); // Guarda as últimas 50 sessões
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_PERFORMANCE, serialized);
      }
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY_PERFORMANCE, serialized);
  } catch (err) {
    logger.warn('[AdaptiveML] Erro ao salvar sessão de performance:', err);
  }
}

/**
 * Registra o desempenho de uma sessão de quiz/batalha para enriquecer o modelo adaptativo
 */
export async function registrarSessaoQuiz(dados: {
  trilhaId?: string;
  faseId?: string;
  acertos: number;
  erros: number;
  vitoria: boolean;
  dificuldade?: string;
}): Promise<void> {
  try {
    const sessions = await getStoredSessions();
    const newSession: UserPerformanceSession = {
      trilhaId: dados.trilhaId,
      faseId: dados.faseId,
      acertos: Math.max(0, dados.acertos),
      erros: Math.max(0, dados.erros),
      vitoria: !!dados.vitoria,
      dificuldade: dados.dificuldade,
      timestamp: Date.now(),
    };
    sessions.push(newSession);
    await saveStoredSessions(sessions);
  } catch (e) {
    logger.warn('[AdaptiveML] Falha ao registrar sessão de quiz:', e);
  }
}

/**
 * Calcula o perfil cognitivo / proficiência do usuário via modelo preditivo heurístico
 */
export async function calcularPerfilHabilidade(user: any): Promise<UserSkillProfile> {
  const sessions = await getStoredSessions();

  let totalAcertos = 0;
  let totalErros = 0;
  let totalVitorias = 0;

  for (const s of sessions) {
    totalAcertos += s.acertos;
    totalErros += s.erros;
    if (s.vitoria) totalVitorias++;
  }

  // Se não houver sessões locais suficientes, utiliza o perfil de acertos do usuário na conta
  const totalQuestoes = totalAcertos + totalErros;
  let taxaAcerto = 0.70; // baseline saudável padrão
  let taxaVitoria = 0.70;

  if (totalQuestoes >= 3) {
    taxaAcerto = totalAcertos / totalQuestoes;
    taxaVitoria = sessions.length > 0 ? totalVitorias / sessions.length : 0.70;
  } else if (user) {
    const rawAcertos = Number(user.mediaAcertos) || Number(user.acertosPercentual);
    if (!isNaN(rawAcertos) && rawAcertos > 0) {
      taxaAcerto = Math.min(1, Math.max(0, rawAcertos / 100));
      taxaVitoria = taxaAcerto;
    }
  }

  const taxaErro = 1 - taxaAcerto;
  const rawXp = Number(user?.xpTotal) || Number(user?.xp) || 0;
  const userLevel = Math.min(50, Math.max(1, Math.floor(Math.sqrt(rawXp / 100)) + 1));
  const levelNormalized = Math.min(1, userLevel / 25);

  // Score composto de Proficiência:
  // 55% taxa de acertos nas perguntas + 25% taxa de vitórias + 20% maturidade de nível
  const scoreProficiencia = (0.55 * taxaAcerto) + (0.25 * taxaVitoria) + (0.20 * levelNormalized);

  let dificuldadeRecomendada: DificuldadeAlvo = 'Medio';
  let labelMotivo = '';
  let badgeTexto = '';

  const percentFormat = Math.round(taxaAcerto * 100);

  if (scoreProficiencia < 0.50 || taxaAcerto < 0.55) {
    // Usuário está errando com frequência -> Recomendar trilhas mais fáceis
    dificuldadeRecomendada = 'Facil';
    labelMotivo = `Identificamos que você precisa reforçar as bases (taxa de acertos: ${percentFormat}%). Recomendamos trilhas mais fáceis para consolidar o aprendizado!`;
    badgeTexto = `🌱 IA Adaptativa: Foco em Fixação (${percentFormat}% Acertos)`;
  } else if (scoreProficiencia > 0.78 || taxaAcerto > 0.80) {
    // Usuário está dominando e acertando muito -> Recomendar trilhas mais difíceis
    dificuldadeRecomendada = 'Dificil';
    labelMotivo = `Excelente desempenho! Você está acertando a maioria das questões (${percentFormat}%). Recomendamos desafios avançados!`;
    badgeTexto = `🔥 IA Adaptativa: Desafio Avançado (${percentFormat}% Acertos)`;
  } else {
    // Desempenho equilibrado -> Dificuldade Média
    dificuldadeRecomendada = 'Medio';
    labelMotivo = `Seu progresso está equilibrado (${percentFormat}% de acertos). Estas trilhas oferecem o desafio ideal para o seu nível!`;
    badgeTexto = `⚖️ IA Adaptativa: Nível Equilibrado (${percentFormat}% Acertos)`;
  }

  return {
    totalAcertos,
    totalErros,
    taxaAcerto,
    taxaErro,
    taxaVitoria,
    nivelUsuario: userLevel,
    scoreProficiencia,
    dificuldadeRecomendada,
    labelMotivo,
    badgeTexto,
  };
}

function normalizarDificuldade(diff?: string): DificuldadeAlvo {
  if (!diff) return 'Facil';
  const clean = diff.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.includes('facil') || clean.includes('iniciante') || clean.includes('easy')) return 'Facil';
  if (clean.includes('dificil') || clean.includes('avancad') || clean.includes('hard')) return 'Dificil';
  return 'Medio';
}

/**
 * Ordena e prioriza a lista de trilhas com base no modelo adaptativo de dificuldade.
 */
export function ordenarTrilhasPorAdaptabilidade(
  trilhas: Trilha[],
  dificuldadeAlvo: DificuldadeAlvo
): Trilha[] {
  if (!Array.isArray(trilhas) || trilhas.length === 0) return [];

  const copy = [...trilhas];

  const getDificuldadePeso = (trilha: Trilha): number => {
    const trailDiff = normalizarDificuldade(trilha.dificuldade || trilha.nivelDificuldade);

    // Afinidade máxima para a dificuldade predita
    if (trailDiff === dificuldadeAlvo) return 100;

    // Afinidade secundária para níveis adjacentes
    if (dificuldadeAlvo === 'Medio') {
      return 60; // Médio é adjacente a Fácil e Difícil
    }
    if (dificuldadeAlvo === 'Facil') {
      return trailDiff === 'Medio' ? 50 : 10;
    }
    if (dificuldadeAlvo === 'Dificil') {
      return trailDiff === 'Medio' ? 50 : 10;
    }
    return 30;
  };

  return copy.sort((a, b) => {
    const pesoA = getDificuldadePeso(a);
    const pesoB = getDificuldadePeso(b);
    return pesoB - pesoA;
  });
}
