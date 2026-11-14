/**
 * skinsData - Definição do Sistema de Skins com Spritesheets, Atributos e Movesets Exclusivos
 */

import { SkinDefinition, SkinId } from '../types';

export const SKINS_DATA: Record<SkinId, SkinDefinition> = {
  // ============================================================================
  // SAMURAI
  // ============================================================================
  samurai_ronin: {
    id: 'samurai_ronin',
    characterId: 'samurai',
    name: 'Kaito Ronin',
    title: 'O Espadachim da Honra',
    description: 'Estilo clássico da escola Kenjutsu. Combina serenidade espiritual com precisão cirúrgica.',
    rarity: 'comum',
    bonusStats: {
      atk: 0,
      critRate: 0,
      spd: 0,
    },
    moveset: {
      attack1: {
        name: 'Corte de Katana (Iaijutsu)',
        damageMultiplier: 1.0,
        animationKey: 'samurai_golpe_1',
        sfx: 'slash_light',
        effectDescription: 'Ataque frontal rápido com a bainha de bambu.',
      },
      attack2: {
        name: 'Estocada da Flor de Lótus',
        damageMultiplier: 1.45,
        animationKey: 'samurai_golpe_2',
        sfx: 'slash_heavy',
        effectDescription: 'Duplo corte cruzado que ignora parte da resistência do inimigo.',
      },
      ultimate: {
        name: 'Dança das Mil Lâminas Sagradas',
        damageMultiplier: 3.2,
        animationKey: 'samurai_ult',
        sfx: 'ultimate_release',
        effectDescription: 'Sequência de 12 cortes em alta velocidade com corte estelar final.',
        qtePattern: ['A', 'D', 'SPACE'],
        requiresQTE: true,
      },
    },
    spriteTheme: {
      primaryColor: '#0ea5e9',
      accentColor: '#38bdf8',
      auraColor: 'rgba(14, 165, 233, 0.4)',
      particleStyle: 'sparks',
    },
  },

  samurai_cyber_void: {
    id: 'samurai_cyber_void',
    characterId: 'samurai',
    name: 'Kaito Cyber-Void',
    title: 'O Andarilho Dimensional',
    description: 'Equipado com nanotubos de plasma e lâmina fotônica. Seus golpes distorcem o espaço-tempo.',
    rarity: 'lendaria',
    bonusStats: {
      atk: 6,
      critRate: 0.15, // +15% de crítico
      spd: 4,
    },
    moveset: {
      attack1: {
        name: 'Lâmina de Plasma Fóton',
        damageMultiplier: 1.25,
        animationKey: 'samurai_cyber_golpe_1',
        sfx: 'slash_light',
        effectDescription: 'Disparo de feixes de laser que perfuram as armaduras inimigas.',
      },
      attack2: {
        name: 'Corte Dimensional do Vazio',
        damageMultiplier: 1.75,
        animationKey: 'samurai_cyber_golpe_2',
        sfx: 'slash_heavy',
        effectDescription: 'Teletransporte instantâneo pelas costas do alvo com rastro ultravioleta.',
      },
      ultimate: {
        name: 'Julgamento Cyberpunk Omnislash',
        damageMultiplier: 3.9,
        animationKey: 'samurai_cyber_ult',
        sfx: 'ultimate_release',
        effectDescription: 'Distorção da gravidade da arena com tempestade de cortes quânticos.',
        qtePattern: ['W', 'S', 'A', 'D', 'SPACE'],
        requiresQTE: true,
      },
    },
    spriteTheme: {
      primaryColor: '#a855f7',
      accentColor: '#ec4899',
      auraColor: 'rgba(168, 85, 247, 0.5)',
      particleStyle: 'void',
    },
  },

  // ============================================================================
  // GUERREIRO
  // ============================================================================
  guerreiro_templario: {
    id: 'guerreiro_templario',
    characterId: 'guerreiro',
    name: 'Boran da Fortaleza',
    title: 'Cavaleiro da Ordem',
    description: 'Armadura pesada forjada nas forjas acadêmicas. Defende o saber contra o caos.',
    rarity: 'comum',
    bonusStats: {
      def: 0,
      hp: 0,
    },
    moveset: {
      attack1: {
        name: 'Golpe de Espada Longa',
        damageMultiplier: 1.0,
        animationKey: 'guerreiro_golpe_1',
        sfx: 'slash_light',
        effectDescription: 'Balanço descendente com lâmina de duas mãos.',
      },
      attack2: {
        name: 'Pancada com Escudo Férreo',
        damageMultiplier: 1.4,
        animationKey: 'guerreiro_golpe_2',
        sfx: 'shield_block',
        effectDescription: 'Impacto contundente que causa atordoamento breve no alvo.',
      },
      ultimate: {
        name: 'Investida Sagrada da Bastilha',
        damageMultiplier: 2.9,
        animationKey: 'guerreiro_ult',
        sfx: 'ultimate_release',
        effectDescription: 'Corrida imparável com escudo de energia esmagando a linha inimiga.',
        qtePattern: ['SPACE', 'W', 'SPACE'],
        requiresQTE: true,
      },
    },
    spriteTheme: {
      primaryColor: '#3b82f6',
      accentColor: '#60a5fa',
      auraColor: 'rgba(59, 130, 246, 0.35)',
      particleStyle: 'sparks',
    },
  },

  guerreiro_berserker_lava: {
    id: 'guerreiro_berserker_lava',
    characterId: 'guerreiro',
    name: 'Boran Vulcânico',
    title: 'Fúria de Magma',
    description: 'Banhado no núcleo de um vulcão primordial. Troca cautela defensiva por poder destrutivo puro.',
    rarity: 'epica',
    bonusStats: {
      hp: 30,
      atk: 8,
      def: -4,
    },
    moveset: {
      attack1: {
        name: 'Machado Incandescente',
        damageMultiplier: 1.3,
        animationKey: 'guerreiro_lava_golpe_1',
        sfx: 'slash_heavy',
        effectDescription: 'Ataque pesado que deixa o inimigo em chamas com queimadura.',
      },
      attack2: {
        name: 'Fenda Sísmica de Magma',
        damageMultiplier: 1.65,
        animationKey: 'guerreiro_lava_golpe_2',
        sfx: 'hit_impact',
        effectDescription: 'Pancada no solo que ergue estalagmites de rocha derretida.',
      },
      ultimate: {
        name: 'Erupção Titânica do Colosso',
        damageMultiplier: 3.7,
        animationKey: 'guerreiro_lava_ult',
        sfx: 'ultimate_release',
        effectDescription: 'Explosão vulcânica massiva cobrindo toda a arena de combate.',
        qtePattern: ['SPACE', 'SPACE', 'A', 'D'],
        requiresQTE: true,
      },
    },
    spriteTheme: {
      primaryColor: '#ef4444',
      accentColor: '#f97316',
      auraColor: 'rgba(239, 68, 68, 0.5)',
      particleStyle: 'flames',
    },
  },

  // ============================================================================
  // MAGO
  // ============================================================================
  mago_arcanista: {
    id: 'mago_arcanista',
    characterId: 'mago',
    name: 'Valerius Arcano',
    title: 'Teurgista da Lógica',
    description: 'Canalizador dos elementos puros da computação e matemática.',
    rarity: 'comum',
    bonusStats: {
      atk: 0,
      ultCharge: 0,
    },
    moveset: {
      attack1: {
        name: 'Dardo de Energia Pura',
        damageMultiplier: 1.1,
        animationKey: 'mago_golpe_1',
        sfx: 'magic_cast',
        effectDescription: 'Disparo arcano com velocidade concentrada.',
      },
      attack2: {
        name: 'Orbe Incandescente',
        damageMultiplier: 1.5,
        animationKey: 'mago_golpe_2',
        sfx: 'magic_cast',
        effectDescription: 'Esfera rúnica que explode em contato com o alvo.',
      },
      ultimate: {
        name: 'Meteoro do Saber Cósmico',
        damageMultiplier: 3.4,
        animationKey: 'mago_ult',
        sfx: 'ultimate_release',
        effectDescription: 'Queda de um fragmento cósmico vaporizando defesas.',
        qtePattern: ['W', 'A', 'SPACE'],
        requiresQTE: true,
      },
    },
    spriteTheme: {
      primaryColor: '#6366f1',
      accentColor: '#818cf8',
      auraColor: 'rgba(99, 102, 241, 0.4)',
      particleStyle: 'arcane',
    },
  },

  mago_necromante_espectral: {
    id: 'mago_necromante_espectral',
    characterId: 'mago',
    name: 'Valerius das Sombras',
    title: 'Lorde Espectral',
    description: 'Dominou os segredos ocultos da memória e do tempo. Drena a vitalidade dos ignorantes.',
    rarity: 'lendaria',
    bonusStats: {
      atk: 10,
      critRate: 0.1,
    },
    moveset: {
      attack1: {
        name: 'Chama Abissal',
        damageMultiplier: 1.3,
        animationKey: 'mago_spectral_golpe_1',
        sfx: 'magic_cast',
        effectDescription: 'Fogo negro que rouba 10% do dano causado na forma de HP.',
      },
      attack2: {
        name: 'Garras do Submundo',
        damageMultiplier: 1.7,
        animationKey: 'mago_spectral_golpe_2',
        sfx: 'magic_cast',
        effectDescription: 'Mãos etéreas surgem do chão prendendo o inimigo.',
      },
      ultimate: {
        name: 'Apocalipse das Almas Perdidas',
        damageMultiplier: 4.1,
        animationKey: 'mago_spectral_ult',
        sfx: 'ultimate_release',
        effectDescription: 'Inundação espectral que drena todos os inimigos da tela.',
        qtePattern: ['A', 'W', 'D', 'SPACE'],
        requiresQTE: true,
      },
    },
    spriteTheme: {
      primaryColor: '#10b981',
      accentColor: '#059669',
      auraColor: 'rgba(16, 185, 129, 0.45)',
      particleStyle: 'void',
    },
  },
};
