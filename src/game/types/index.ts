/**
 * Tipos e Interfaces do Motor de Jogo EstudeMy
 */

export type CharacterId = 'samurai' | 'guerreiro' | 'mago';

export type SkinId =
  | 'samurai_ronin'
  | 'samurai_cyber_void'
  | 'guerreiro_templario'
  | 'guerreiro_berserker_lava'
  | 'mago_arcanista'
  | 'mago_necromante_espectral';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number; // 0.0 a 1.0
  critDamage: number; // Ex: 1.5 a 2.5
  ultCharge: number; // 0 a 100
  maxUltCharge: number; // 100
}

export interface MoveDefinition {
  name: string;
  damageMultiplier: number;
  animationKey: string;
  sfx: string;
  effectDescription: string;
  cooldownTurns?: number;
}

export interface UltimateMoveDefinition extends MoveDefinition {
  qtePattern: string[]; // Sequência sugerida de QTE (ex: ['A', 'D', 'SPACE'])
  requiresQTE: boolean;
}

export interface SkinDefinition {
  id: SkinId;
  characterId: CharacterId;
  name: string;
  title: string;
  description: string;
  rarity: 'comum' | 'rara' | 'epica' | 'lendaria';
  bonusStats: Partial<CharacterStats>;
  moveset: {
    attack1: MoveDefinition;
    attack2: MoveDefinition;
    ultimate: UltimateMoveDefinition;
  };
  spriteTheme: {
    primaryColor: string;
    accentColor: string;
    auraColor: string;
    particleStyle: 'sparks' | 'void' | 'flames' | 'arcane' | 'wind';
  };
}

export interface CharacterBaseDefinition {
  id: CharacterId;
  name: string;
  classTitle: string;
  lore: string;
  baseStats: CharacterStats;
  defaultSkinId: SkinId;
  skins: SkinId[];
}

export type GameModeId = 'campanha' | 'speedrun' | 'sobrevivencia' | 'boss_rush';

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  hasTimer: boolean;
  initialTimeSeconds: number;
  timeBonusPerCorrect: number;
  timePenaltyPerWrong: number;
  hasWaves: boolean;
  bossOnly: boolean;
  streakBonusEnabled: boolean;
  xpMultiplier: number;
  coinMultiplier: number;
}

export type EmotionType = 'neutral' | 'determined' | 'angry' | 'surprised' | 'triumphant' | 'injured';

export interface DialogueLine {
  id: string;
  speaker: string;
  avatar: string;
  side: 'left' | 'right';
  text: string;
  emotion?: EmotionType;
  sfxVoice?: 'male_hero' | 'female_hero' | 'mago' | 'boss_deep' | 'boss_whisper' | 'system';
}

export interface CutsceneSequence {
  id: string;
  title: string;
  chapterBanner?: string;
  locationName: string;
  bgMusicTrack?: string;
  lines: DialogueLine[];
  onCompleteAction?: 'start_combat' | 'next_scene' | 'boss_battle';
}

export type QTEType = 'single' | 'sequence' | 'mash';

export interface QTEPrompt {
  id: string;
  type: QTEType;
  keys: string[]; // ['W', 'A', 'S', 'D', 'SPACE']
  durationMs: number;
  label: string;
  bonusReward: {
    type: 'ultimate_fill' | 'critical_strike' | 'hp_heal' | 'boss_stagger';
    value: number;
  };
}

export interface QuestionData {
  _id?: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: string | number;
  indiceRespostaCorreta: number;
  explicacao?: string;
  materia?: string;
  dificuldade?: 'facil' | 'medio' | 'dificil';
}
