/**
 * Utilitário de Leveling e Progressão de XP para o EstudeMy
 */

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
  title: string;
}

/**
 * Calcula o nível do usuário baseado no XP Total acumulado.
 * Progressão equilibrada RPG:
 * - Nível 1: 0 a 100 XP (precisa de 100 XP)
 * - Nível 2: 101 a 250 XP (precisa de 150 XP)
 * - Nível 3: 251 a 450 XP (precisa de 200 XP)
 * - Nível 4: 451 a 700 XP (precisa de 250 XP)
 * - Nível 5: 701 a 1000 XP (precisa de 300 XP)
 * Cada nível acima requer +50 XP que o anterior.
 */
export function calculateLevel(xpTotal: number = 0): LevelInfo {
  const safeXp = Math.max(0, Math.floor(Number(xpTotal) || 0));

  let level = 1;
  let accumulatedXpForNext = 100;
  let accumulatedXpForCurrent = 0;
  let step = 100;

  while (safeXp >= accumulatedXpForNext && level < 100) {
    level++;
    accumulatedXpForCurrent = accumulatedXpForNext;
    step += 50;
    accumulatedXpForNext += step;
  }

  const xpInCurrentLevel = safeXp - accumulatedXpForCurrent;
  const xpNeededForNextLevel = accumulatedXpForNext - accumulatedXpForCurrent;
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
  );

  const titles = [
    'Iniciante',
    'Aprendiz',
    'Estudioso',
    'Aventureiro',
    'Veterano',
    'Estrategista',
    'Mestre do Saber',
    'Grão-Mestre',
    'Lendário',
    'Soberano dos Dados',
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)];

  return {
    level,
    currentXp: safeXp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
    title,
  };
}
