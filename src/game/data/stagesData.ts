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

export interface StagePhaseInfo {
  faseNumber: number;
  name: string;
  bgImage: string;
  description: string;
  ambientEffect?: 'torch_embers' | 'falling_snow' | 'sand_dust' | 'leaves_rain' | 'cosmic_vortex';
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
  fases: StagePhaseInfo[];
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
    fases: [
      {
        faseNumber: 1,
        name: 'Muralha e Portão dos Algoritmos',
        bgImage: 'assets/backgrounds/castelo_fase1_portao.jpg',
        description: 'Muralhas impenetráveis guardadas por sentinelas de código binário.',
        ambientEffect: 'torch_embers',
      },
      {
        faseNumber: 2,
        name: 'Grande Salão dos Dados',
        bgImage: 'assets/backgrounds/castelo_fase2_salao.jpg',
        description: 'Colunas de pedra ancestral e estandartes rúnicos iluminados por tochas arcanas.',
        ambientEffect: 'torch_embers',
      },
      {
        faseNumber: 3,
        name: 'Catacumbas da Memória RAM',
        bgImage: 'assets/backgrounds/castelo_fase3_masmorra.jpg',
        description: 'Masmorras góticas com chamas azuis espectrais onde ponteiros perdidos vagueiam.',
        ambientEffect: 'torch_embers',
      },
      {
        faseNumber: 4,
        name: 'Torre do Trono do Spectre',
        bgImage: 'assets/backgrounds/castelo_fase4_trono.jpg',
        description: 'O topo supremo do castelo onde o Spectre do Código aguarda os mais audaciosos.',
        ambientEffect: 'torch_embers',
      },
    ],
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
    fases: [
      {
        faseNumber: 1,
        name: 'Encosta Nevada dos Vetores',
        bgImage: 'assets/backgrounds/montanha_fase1_encosta.jpg',
        description: 'Encostas congeladas onde a gravidade e o atrito desafiam cada passo do herói.',
        ambientEffect: 'falling_snow',
      },
      {
        faseNumber: 2,
        name: 'Desfiladeiro da Gravidade',
        bgImage: 'assets/backgrounds/montanha_fase2_desfiladeiro.jpg',
        description: 'Ponte pênsil de cordas suspensa sobre um precipício imensurável coberto de névoa.',
        ambientEffect: 'falling_snow',
      },
      {
        faseNumber: 3,
        name: 'Caverna dos Cristais Lógicos',
        bgImage: 'assets/backgrounds/montanha_fase3_caverna.jpg',
        description: 'Interior de mina de gelo reluzente com geodos azuis e prismas de refração.',
        ambientEffect: 'falling_snow',
      },
      {
        faseNumber: 4,
        name: 'Pico Cósmico dos Astros',
        bgImage: 'assets/backgrounds/montanha_fase4_pico.jpg',
        description: 'O topo absoluto da cordilheira tocando as auroras boreais e as constelações.',
        ambientEffect: 'falling_snow',
      },
    ],
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
    fases: [
      {
        faseNumber: 1,
        name: 'Praça do Mercado das Crônicas',
        bgImage: 'assets/backgrounds/vila_fase1_mercado.jpg',
        description: 'Vila medieval aconchegante com chão de pedra e janelas iluminadas.',
        ambientEffect: 'leaves_rain',
      },
      {
        faseNumber: 2,
        name: 'Grande Arquivo e Biblioteca',
        bgImage: 'assets/backgrounds/vila_fase2_biblioteca.jpg',
        description: 'Imensas estantes de tomos antigos, pergaminhos filosóficos e mesas de estudo.',
        ambientEffect: 'leaves_rain',
      },
      {
        faseNumber: 3,
        name: 'Cripta dos Filósofos',
        bgImage: 'assets/backgrounds/vila_fase3_cripta.jpg',
        description: 'Cripta gótica sombria e lápides ancestrais sob o luar prateado.',
        ambientEffect: 'leaves_rain',
      },
      {
        faseNumber: 4,
        name: 'Campanário do Cavaleiro',
        bgImage: 'assets/backgrounds/vila_fase4_campanario.jpg',
        description: 'O topo da torre do sino com visão de toda a vila e os campos enevoados.',
        ambientEffect: 'leaves_rain',
      },
    ],
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
    fases: [
      {
        faseNumber: 1,
        name: 'Dunas Escaldantes da Erosão',
        bgImage: 'assets/backgrounds/deserto_fase1_dunas.jpg',
        description: 'Vasto mar de areia dourada e miragens sob o calor escaldante.',
        ambientEffect: 'sand_dust',
      },
      {
        faseNumber: 2,
        name: 'Oásis dos Fósseis Antigos',
        bgImage: 'assets/backgrounds/deserto_fase2_oasis.jpg',
        description: 'Lago de águas cristalinas turquesa, palmeiras e tendas rústicas de viajantes.',
        ambientEffect: 'sand_dust',
      },
      {
        faseNumber: 3,
        name: 'Templo Solar do Arenito',
        bgImage: 'assets/backgrounds/deserto_fase3_ruinas.jpg',
        description: 'Ruínas monumentais com colunas entalhadas em hieróglifos de ouro e braseiros.',
        ambientEffect: 'sand_dust',
      },
      {
        faseNumber: 4,
        name: 'Cratera da Tempestade Solar',
        bgImage: 'assets/backgrounds/deserto_fase4_cratera.jpg',
        description: 'Vale árido com fendas incandescentes e tempestade de vento cósmico.',
        ambientEffect: 'sand_dust',
      },
    ],
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
        spriteKey: 'spectre',
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
    fases: [
      {
        faseNumber: 1,
        name: 'Fragmentos dos Tomos Perdidos',
        bgImage: 'assets/backgrounds/vazio_fase1_fragmentos.jpg',
        description: 'Plataformas de matéria escura flutuando no abismo estelar.',
        ambientEffect: 'cosmic_vortex',
      },
      {
        faseNumber: 2,
        name: 'Nebulosa da Entropia',
        bgImage: 'assets/backgrounds/vazio_fase2_nebulosa.jpg',
        description: 'Campos de radiação violeta onde o tempo e o espaço se distorcem.',
        ambientEffect: 'cosmic_vortex',
      },
      {
        faseNumber: 3,
        name: 'Singularidade do Infinito',
        bgImage: 'assets/backgrounds/vazio_fase3_singularidade.jpg',
        description: 'O horizonte de eventos supremo onde o Arquivista do Vazio rege o destino do conhecimento.',
        ambientEffect: 'cosmic_vortex',
      },
    ],
    enemies: [],
    bossId: 'chefe_final',
  },
};
