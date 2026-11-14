/**
 * bossesData - Configurações detalhadas dos Bosses e do Chefe Final multi-fase
 */

export interface BossAttackMove {
  name: string;
  damage: number;
  animationKey: string;
  sfx: string;
  isHeavyAttack: boolean; // Se for pesado, pode disparar QTE de defesa
  quote?: string;
}

export interface BossPhaseConfig {
  phaseNumber: number;
  phaseName: string;
  hpMax: number;
  atk: number;
  def: number;
  barColor: string; // Cor da barra de vida da fase
  musicTrack?: string;
  voiceOnStart?: string;
  attacks: BossAttackMove[];
  qteChanceOnHit: number; // 0.0 a 1.0
}

export interface BossDefinition {
  id: string;
  name: string;
  title: string;
  theme: string;
  totalPhases: number;
  phases: BossPhaseConfig[];
  defeatQuote: string;
}

export const BOSSES_DATA: Record<string, BossDefinition> = {
  // ============================================================================
  // BOSS 1: SPECTRE (Ciber-Castelo / Programação)
  // ============================================================================
  spectre: {
    id: 'spectre',
    name: 'Spectre do Código',
    title: 'Guardião Corrompido dos Algoritmos',
    theme: 'castelo',
    totalPhases: 1,
    phases: [
      {
        phaseNumber: 1,
        phaseName: 'Manifestação Ectoplasmática',
        hpMax: 120,
        atk: 18,
        def: 8,
        barColor: '#38bdf8',
        musicTrack: 'boss_clash',
        voiceOnStart: 'Seus dados foram corrompidos!',
        attacks: [
          {
            name: 'NullPointerException Sweep',
            damage: 16,
            animationKey: 'spectre_golpe_1',
            sfx: 'slash_light',
            isHeavyAttack: false,
          },
          {
            name: 'Buffer Overflow Glitch',
            damage: 26,
            animationKey: 'spectre_golpe_2',
            sfx: 'slash_heavy',
            isHeavyAttack: true,
            quote: 'Sua memória não resistirá!',
          },
        ],
        qteChanceOnHit: 0.35,
      },
    ],
    defeatQuote: 'Sistema... estabilizado... você limpou a memória corrompida...',
  },

  // ============================================================================
  // BOSS 2: CAVALEIRO DECAÍDO (Fortaleza dos Dados)
  // ============================================================================
  cavaleiro_decaido: {
    id: 'cavaleiro_decaido',
    name: 'Cavaleiro Decaído',
    title: 'Sentinela de Ferro das Provas',
    theme: 'castelo',
    totalPhases: 2,
    phases: [
      {
        phaseNumber: 1,
        phaseName: 'Postura Implacável',
        hpMax: 150,
        atk: 22,
        def: 18,
        barColor: '#3b82f6',
        musicTrack: 'boss_clash',
        voiceOnStart: 'Minha guarda nunca quebra!',
        attacks: [
          {
            name: 'Golpe de Escudo Rachador',
            damage: 20,
            animationKey: 'cavaleiro_golpe_1',
            sfx: 'shield_block',
            isHeavyAttack: false,
          },
          {
            name: 'Corte Pesado de Bastarda',
            damage: 30,
            animationKey: 'cavaleiro_golpe_2',
            sfx: 'slash_heavy',
            isHeavyAttack: true,
            quote: 'Ajoelhe-se diante da disciplina!',
          },
        ],
        qteChanceOnHit: 0.4,
      },
      {
        phaseNumber: 2,
        phaseName: 'Fúria da Armadura Quebrada',
        hpMax: 180,
        atk: 30,
        def: 10,
        barColor: '#ef4444',
        musicTrack: 'boss_clash',
        voiceOnStart: 'Você despertou a lâmina ensanguentada!',
        attacks: [
          {
            name: 'Lâmina do Julgamento Férreo',
            damage: 28,
            animationKey: 'cavaleiro_golpe_1',
            sfx: 'slash_heavy',
            isHeavyAttack: false,
          },
          {
            name: 'Estocada Destruidora de Bastilha',
            damage: 42,
            animationKey: 'cavaleiro_golpe_2',
            sfx: 'hit_impact',
            isHeavyAttack: true,
            quote: 'Este é o fim da sua jornada!',
          },
        ],
        qteChanceOnHit: 0.6,
      },
    ],
    defeatQuote: 'Você tem a têmpera de um verdadeiro mestre...',
  },

  // ============================================================================
  // BOSS 3: MAGO CORROMPIDO (Torre da Lógica e Matemática)
  // ============================================================================
  mago_corrompido: {
    id: 'mago_corrompido',
    name: 'Mago Corrompido',
    title: 'Arquimago do Paradoxo',
    theme: 'montanha',
    totalPhases: 2,
    phases: [
      {
        phaseNumber: 1,
        phaseName: 'Ilusão de Fórmulas',
        hpMax: 140,
        atk: 25,
        def: 6,
        barColor: '#a855f7',
        musicTrack: 'boss_clash',
        voiceOnStart: 'A mente lógica é cheia de armadilhas!',
        attacks: [
          {
            name: 'Dardo de Paradoxo Arcano',
            damage: 22,
            animationKey: 'mago_golpe_1',
            sfx: 'magic_cast',
            isHeavyAttack: false,
          },
          {
            name: 'Singularidade Dimensional',
            damage: 34,
            animationKey: 'mago_golpe_2',
            sfx: 'magic_cast',
            isHeavyAttack: true,
            quote: 'Resolva este enigma ou pereça!',
          },
        ],
        qteChanceOnHit: 0.45,
      },
      {
        phaseNumber: 2,
        phaseName: 'Tempestade de Caos Cósmico',
        hpMax: 190,
        atk: 35,
        def: 4,
        barColor: '#d946ef',
        musicTrack: 'boss_clash',
        voiceOnStart: 'Que o vácuo consuma sua inteligência!',
        attacks: [
          {
            name: 'Relâmpago da Não-Linearidade',
            damage: 32,
            animationKey: 'mago_golpe_1',
            sfx: 'magic_cast',
            isHeavyAttack: false,
          },
          {
            name: 'Cataclismo Quântico',
            damage: 48,
            animationKey: 'mago_golpe_2',
            sfx: 'ultimate_release',
            isHeavyAttack: true,
            quote: 'O caos é a única resposta!',
          },
        ],
        qteChanceOnHit: 0.65,
      },
    ],
    defeatQuote: 'Minhas equações... foram todas resolvidas com perfeição...',
  },

  // ============================================================================
  // CHEFE FINAL: ARQUIVISTA DO VAZIO (3 BARRAS DE VIDA!)
  // ============================================================================
  chefe_final: {
    id: 'chefe_final',
    name: 'O Arquivista do Vazio',
    title: 'A Encarnação do Esquecimento Absoluto',
    theme: 'vazio_cosmico',
    totalPhases: 3,
    phases: [
      // FASE 1: Tática e Metódica (Barra Roxa)
      {
        phaseNumber: 1,
        phaseName: 'Fase I: O Guardião dos Tomos Apagados',
        hpMax: 200,
        atk: 26,
        def: 15,
        barColor: '#8b5cf6',
        musicTrack: 'boss_clash',
        voiceOnStart: 'Você trouxe conhecimento para onde só deve reinar o vazio!',
        attacks: [
          {
            name: 'Queima de Páginas Antigas',
            damage: 24,
            animationKey: 'mago_golpe_1',
            sfx: 'magic_cast',
            isHeavyAttack: false,
          },
          {
            name: 'Selo do Apagamento',
            damage: 36,
            animationKey: 'mago_golpe_2',
            sfx: 'slash_heavy',
            isHeavyAttack: true,
            quote: 'Esqueça tudo o que aprendeu!',
          },
        ],
        qteChanceOnHit: 0.5,
      },

      // FASE 2: Fúria e Corrupção (Barra Vermelha)
      {
        phaseNumber: 2,
        phaseName: 'Fase II: A Fúria da Entropia',
        hpMax: 260,
        atk: 36,
        def: 12,
        barColor: '#ef4444',
        musicTrack: 'final_showdown',
        voiceOnStart: 'A ignorância é uma chama que você jamais apagará!',
        attacks: [
          {
            name: 'Fissão da Dúvida',
            damage: 32,
            animationKey: 'spectre_golpe_1',
            sfx: 'slash_heavy',
            isHeavyAttack: false,
          },
          {
            name: 'Chuva de Asteroides do Esquecimento',
            damage: 50,
            animationKey: 'spectre_golpe_2',
            sfx: 'ultimate_release',
            isHeavyAttack: true,
            quote: 'Desmorone junto com seus sonhos acadêmicos!',
          },
        ],
        qteChanceOnHit: 0.7,
      },

      // FASE 3: Caos Primordial & QTEs Rápidos (Barra Dourada Celestial)
      {
        phaseNumber: 3,
        phaseName: 'Fase III: Singularidade do Infinito',
        hpMax: 320,
        atk: 45,
        def: 8,
        barColor: '#eab308',
        musicTrack: 'final_showdown',
        voiceOnStart: 'TESTEMUNHE O PODER DO ESQUECIMENTO PRIMORDIAL!',
        attacks: [
          {
            name: 'Pulso de Aniquilação Cósmica',
            damage: 40,
            animationKey: 'cavaleiro_golpe_1',
            sfx: 'ultimate_release',
            isHeavyAttack: false,
          },
          {
            name: 'Julgamento Final: Deletar Memória',
            damage: 65,
            animationKey: 'cavaleiro_golpe_2',
            sfx: 'boss_roar',
            isHeavyAttack: true,
            quote: 'NENHUMA RESPOSTA PODE SALVAR VOCÊ AGORA!',
          },
        ],
        qteChanceOnHit: 0.85,
      },
    ],
    defeatQuote: 'Impossível... A luz da sabedoria... jamais pode ser apagada...',
  },
};
