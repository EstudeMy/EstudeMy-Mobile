/**
 * stagesData - Configurações completas das Fases Temáticas por Trilha de Aprendizado
 */

export interface StageEnemyConfig {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  spriteKey: string;
  tauntQuote: string;
}

export interface StageThemeConfig {
  id: string;
  title: string;
  subjectTitle: string; // Matéria pedagógica
  sceneryId: 'castelo' | 'montanha' | 'deserto' | 'vila' | 'vazio_cosmico';
  parallaxLayers: {
    skyColor: string;
    distantBgKey: string;
    midBgKey: string;
    groundColor: string;
    platformColor: string;
  };
  musicTrack: 'peaceful_camp' | 'battle_stage' | 'boss_clash' | 'final_showdown';
  enemies: StageEnemyConfig[];
  bossId: string;
}

export const STAGES_DATA: Record<string, StageThemeConfig> = {
  // ============================================================================
  // TRILHA 1: PROGRAMAÇÃO & BANCO DE DADOS (CIBER-CASTELO)
  // ============================================================================
  castelo: {
    id: 'castelo',
    title: 'A Fortaleza dos Dados e Algoritmos',
    subjectTitle: 'Banco de Dados & Programação',
    sceneryId: 'castelo',
    parallaxLayers: {
      skyColor: '#0a0d18',
      distantBgKey: 'castelo_skyline',
      midBgKey: 'castelo_muralhas',
      groundColor: '#1e293b',
      platformColor: '#334155',
    },
    musicTrack: 'battle_stage',
    enemies: [
      {
        id: 'bug_sintaxe',
        name: 'Glitch de Sintaxe',
        hp: 60,
        atk: 14,
        def: 6,
        spriteKey: 'spectre',
        tauntQuote: 'Um ponto e vírgula esquecido pode destruir seu código!',
      },
      {
        id: 'sentinela_sql',
        name: 'Sentinela do SQL',
        hp: 85,
        atk: 18,
        def: 12,
        spriteKey: 'cavaleiro_decaido',
        tauntQuote: 'Sua consulta SELECT não retornará nenhuma linha de vida!',
      },
    ],
    bossId: 'spectre',
  },

  // ============================================================================
  // TRILHA 2: MATEMÁTICA & FÍSICA (PICO DA LÓGICA)
  // ============================================================================
  montanha: {
    id: 'montanha',
    title: 'O Pico dos Teoremas e Vetores',
    subjectTitle: 'Matemática & Física',
    sceneryId: 'montanha',
    parallaxLayers: {
      skyColor: '#0c1b33',
      distantBgKey: 'montanha_picos',
      midBgKey: 'montanha_encostas',
      groundColor: '#1e3a5f',
      platformColor: '#2d4a6f',
    },
    musicTrack: 'battle_stage',
    enemies: [
      {
        id: 'golem_vetores',
        name: 'Golem de Matrizes',
        hp: 75,
        atk: 16,
        def: 10,
        spriteKey: 'cavaleiro_decaido',
        tauntQuote: 'Calcule o módulo da minha força se puder!',
      },
      {
        id: 'espectro_funcoes',
        name: 'Espectro Exponencial',
        hp: 90,
        atk: 22,
        def: 8,
        spriteKey: 'spectre',
        tauntQuote: 'Meu dano cresce assintoticamente!',
      },
    ],
    bossId: 'mago_corrompido',
  },

  // ============================================================================
  // TRILHA 3: LÍNGUAS, HISTÓRIA & HUMANAS (ARQUIVO DAS ERAS)
  // ============================================================================
  vila: {
    id: 'vila',
    title: 'A Biblioteca Ancestral de Sophia',
    subjectTitle: 'Língua Portuguesa & Humanidades',
    sceneryId: 'vila',
    parallaxLayers: {
      skyColor: '#1c1917',
      distantBgKey: 'vila_torres',
      midBgKey: 'vila_casarios',
      groundColor: '#292524',
      platformColor: '#44403c',
    },
    musicTrack: 'battle_stage',
    enemies: [
      {
        id: 'guardiao_concordancia',
        name: 'Guardião da Sintaxe',
        hp: 70,
        atk: 15,
        def: 8,
        spriteKey: 'spectre',
        tauntQuote: 'Suas palavras perderam a coesão!',
      },
      {
        id: 'paladino_historico',
        name: 'Cronista das Sombras',
        hp: 95,
        atk: 20,
        def: 14,
        spriteKey: 'cavaleiro_decaido',
        tauntQuote: 'Quem não conhece o passado é derrotado no presente!',
      },
    ],
    bossId: 'cavaleiro_decaido',
  },

  // ============================================================================
  // TRILHA 4: CIÊNCIAS & NATUREZA (DESERTO PRIMORDIAL)
  // ============================================================================
  deserto: {
    id: 'deserto',
    title: 'O Deserto das Teorias Naturais',
    subjectTitle: 'Ciências & Geografia',
    sceneryId: 'deserto',
    parallaxLayers: {
      skyColor: '#2a1a0a',
      distantBgKey: 'deserto_dunas',
      midBgKey: 'deserto_oasis',
      groundColor: '#78350f',
      platformColor: '#92400e',
    },
    musicTrack: 'battle_stage',
    enemies: [
      {
        id: 'escorpiao_fossil',
        name: 'Fóssil Vivente',
        hp: 80,
        atk: 17,
        def: 11,
        spriteKey: 'spectre',
        tauntQuote: 'Milênios de evolução me tornaram indestrutível!',
      },
      {
        id: 'nomade_solar',
        name: 'Caçador Solar',
        hp: 90,
        atk: 23,
        def: 9,
        spriteKey: 'arqueira',
        tauntQuote: 'A luz do deserto queima sua hesitação!',
      },
    ],
    bossId: 'spectre',
  },

  // ============================================================================
  // TRILHA FINAL: O SANTUÁRIO DO VAZIO CÓSMICO
  // ============================================================================
  vazio_cosmico: {
    id: 'vazio_cosmico',
    title: 'O Vazio Cósmico do Esquecimento',
    subjectTitle: 'Avaliação Final Interdisciplinar',
    sceneryId: 'vazio_cosmico',
    parallaxLayers: {
      skyColor: '#05030a',
      distantBgKey: 'galaxia_vazio',
      midBgKey: 'nebulosa_fragmentos',
      groundColor: '#1e1035',
      platformColor: '#3b1c6e',
    },
    musicTrack: 'final_showdown',
    enemies: [],
    bossId: 'chefe_final',
  },
};
