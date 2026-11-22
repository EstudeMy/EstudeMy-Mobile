/**
 * Utilitário de Leveling e Progressão de XP para o EstudeMy
 * Sistema balanceado, robusto e escalável para RPG Educacional.
 */

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
  title: string;
  isMaxLevel: boolean;
  formattedXpText: string;
}

export const MAX_LEVEL = 100;
// Limite máximo realista de XP para prevenir overflows ou valores corrompidos de testes
export const MAX_REALISTIC_XP = 500000;

// Títulos épicos cobrindo toda a jornada do nível 1 ao 100
const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: 'Iniciante Curioso' },
  { minLevel: 5, title: 'Aprendiz do Saber' },
  { minLevel: 10, title: 'Estudioso Dedicado' },
  { minLevel: 15, title: 'Aventureiro Intelectual' },
  { minLevel: 20, title: 'Explorador de Ideias' },
  { minLevel: 25, title: 'Cavaleiro do Saber' },
  { minLevel: 30, title: 'Estrategista Arcano' },
  { minLevel: 40, title: 'Guardião da Sabedoria' },
  { minLevel: 50, title: 'Mestre do Conhecimento' },
  { minLevel: 60, title: 'Erudito Sagaz' },
  { minLevel: 70, title: 'Grão-Mestre Intelectual' },
  { minLevel: 80, title: 'Lendário dos Saberes' },
  { minLevel: 90, title: 'Arqui-Sábio Iluminado' },
  { minLevel: 100, title: 'Soberano dos Dados' },
];

function getTitleForLevel(lvl: number): string {
  let matched = LEVEL_TITLES[0].title;
  for (const item of LEVEL_TITLES) {
    if (lvl >= item.minLevel) {
      matched = item.title;
    } else {
      break;
    }
  }
  return matched;
}

/**
 * Retorna o XP necessário para passar do nível `lvl` para `lvl + 1`.
 * Curva mais branda e amigável:
 * - Nível 1 a 10: 80 + (lvl * 20) XP (ex: Nível 1 precisa de 100 XP, Nível 2 de 120 XP)
 * - Nível 11 a 30: 200 + ((lvl - 10) * 30) XP
 * - Nível 31 a 100: 800 + ((lvl - 30) * 40) XP
 */
export function getXpNeededForLevel(lvl: number): number {
  if (lvl <= 10) {
    return 80 + lvl * 20;
  }
  if (lvl <= 30) {
    return 200 + (lvl - 10) * 30;
  }
  return 800 + (lvl - 30) * 40;
}

/**
 * Calcula o nível do usuário baseado no XP Total acumulado.
 * Garante matematicamente que:
 * 1. xpInCurrentLevel NUNCA ultrapasse xpNeededForNextLevel.
 * 2. progressPercentage esteja sempre entre 0% e 100%.
 * 3. Valores corrompidos ou anômalos de XP (> 10 milhões) sejam tratados com segurança.
 * 4. No nível máximo (100), o progresso seja exibido como 100% completo com segurança.
 */
export function calculateLevel(xpTotal: number = 0): LevelInfo {
  // Trata valores nulos, negativos ou valores gigantes anômalos de testes
  const rawNum = Number(xpTotal);
  let safeXp = Math.max(0, Math.floor(isNaN(rawNum) ? 0 : rawNum));

  // Pré-computa a tabela de níveis para evitar repetição
  let level = 1;
  let accumulatedXpForCurrent = 0;
  let xpNeededForNextLevel = getXpNeededForLevel(1);
  let accumulatedXpForNext = xpNeededForNextLevel;

  while (level < MAX_LEVEL && safeXp >= accumulatedXpForNext) {
    level++;
    accumulatedXpForCurrent = accumulatedXpForNext;
    xpNeededForNextLevel = getXpNeededForLevel(level);
    accumulatedXpForNext = accumulatedXpForCurrent + xpNeededForNextLevel;
  }

  const isMaxLevel = level >= MAX_LEVEL;
  const title = getTitleForLevel(level);

  let xpInCurrentLevel = 0;
  let progressPercentage = 0;

  if (isMaxLevel) {
    // No nível máximo, a barra fica completa e consistente
    xpInCurrentLevel = xpNeededForNextLevel;
    progressPercentage = 100;
  } else {
    xpInCurrentLevel = Math.min(
      xpNeededForNextLevel,
      Math.max(0, safeXp - accumulatedXpForCurrent)
    );
    progressPercentage = Math.min(
      100,
      Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
    );
  }

  const formattedCurrent = xpInCurrentLevel.toLocaleString('pt-BR');
  const formattedNext = xpNeededForNextLevel.toLocaleString('pt-BR');
  const formattedXpText = isMaxLevel
    ? `${formattedNext} / ${formattedNext} XP (100%)`
    : `${formattedCurrent} / ${formattedNext} XP (${progressPercentage}%)`;

  return {
    level,
    currentXp: safeXp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
    title,
    isMaxLevel,
    formattedXpText,
  };
}
