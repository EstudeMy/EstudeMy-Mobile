/**
 * gameModesData - Configurações completas dos Modos de Jogo Pedagógicos do EstudeMy
 */

import { GameModeConfig, GameModeId } from '../types';

export const GAME_MODES_CONFIG: Record<GameModeId, GameModeConfig> = {
  campanha: {
    id: 'campanha',
    name: 'Trilha da Sabedoria',
    tagline: 'A Jornada Principal',
    description: 'Avance pela narrativa das trilhas de estudo, enfrente guardiões conceituais e derrote o chefe temático.',
    icon: 'Sword',
    hasTimer: false,
    initialTimeSeconds: 0,
    timeBonusPerCorrect: 0,
    timePenaltyPerWrong: 0,
    hasWaves: false,
    bossOnly: false,
    streakBonusEnabled: true,
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
  },

  speedrun: {
    id: 'speedrun',
    name: 'Ataque Contra o Tempo',
    tagline: 'Fluência & Rapidez',
    description: '60 segundos no relógio! Cada resposta certa adiciona tempo e ativa combos. Erros consomem segundos preciosos.',
    icon: 'Zap',
    hasTimer: true,
    initialTimeSeconds: 60,
    timeBonusPerCorrect: 5,
    timePenaltyPerWrong: 8,
    hasWaves: false,
    bossOnly: false,
    streakBonusEnabled: true,
    xpMultiplier: 1.5,
    coinMultiplier: 1.8,
  },

  sobrevivencia: {
    id: 'sobrevivencia',
    name: 'Torre Infinita do Saber',
    tagline: 'Resistência & Mestria',
    description: 'Sobreviva a ondas infinitas de monstros conceituais. A dificuldade escala a cada andar e premia com upgrades temporários.',
    icon: 'Shield',
    hasTimer: true,
    initialTimeSeconds: 25, // Tempo por pergunta
    timeBonusPerCorrect: 0,
    timePenaltyPerWrong: 0,
    hasWaves: true,
    bossOnly: false,
    streakBonusEnabled: true,
    xpMultiplier: 2.0,
    coinMultiplier: 2.2,
  },

  boss_rush: {
    id: 'boss_rush',
    name: 'Arena dos Mestres',
    tagline: 'Duelo de Titãs',
    description: 'Enfrente diretamente os chefes mais temidos das trilhas e o Chefe Final com múltiplas barras de vida e QTEs mortais.',
    icon: 'Trophy',
    hasTimer: false,
    initialTimeSeconds: 0,
    timeBonusPerCorrect: 0,
    timePenaltyPerWrong: 0,
    hasWaves: false,
    bossOnly: true,
    streakBonusEnabled: true,
    xpMultiplier: 2.5,
    coinMultiplier: 3.0,
  },
};
