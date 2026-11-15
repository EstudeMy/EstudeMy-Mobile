/**
 * charactersData - Definições base dos 4 personagens jogáveis do EstudeMy
 */

import { CharacterBaseDefinition } from '../types';

export const CHARACTERS_DATA: Record<string, CharacterBaseDefinition> = {
  samurai: {
    id: 'samurai',
    name: 'Kaito',
    classTitle: 'Samurai da Honra',
    lore: 'Mestre da lâmina sagrada dos templos do conhecimento. Eleva o foco mental para desferir golpes relâmpago capazes de cortar a dúvida e a ignorância.',
    baseStats: {
      hp: 100,
      maxHp: 100,
      atk: 28,
      def: 12,
      spd: 18,
      critRate: 0.25, // 25% de chance de crítico base
      critDamage: 2.0, // Dano crítico 200%
      ultCharge: 0,
      maxUltCharge: 100,
    },
    defaultSkinId: 'samurai_ronin',
    skins: ['samurai_ronin', 'samurai_cyber_void'],
  },

  guerreiro: {
    id: 'guerreiro',
    name: 'Boran',
    classTitle: 'Guardião Férreo',
    lore: 'Portador do escudo inquebrável das bibliotecas antigas. Suporta os ataques mais severos do esquecimento e retribui com o impacto avassalador da sua espada.',
    baseStats: {
      hp: 140,
      maxHp: 140,
      atk: 22,
      def: 22,
      spd: 10,
      critRate: 0.12,
      critDamage: 1.6,
      ultCharge: 0,
      maxUltCharge: 100,
    },
    defaultSkinId: 'guerreiro_templario',
    skins: ['guerreiro_templario', 'guerreiro_berserker_lava'],
  },

  mago: {
    id: 'mago',
    name: 'Valerius',
    classTitle: 'Mago Arcanista',
    lore: 'Estudioso das runas primordiais da ciência e da lógica. Canaliza a energia do saber em feitiços avassaladores e possui a mais rápida canalização de Ultimate.',
    baseStats: {
      hp: 85,
      maxHp: 85,
      atk: 34,
      def: 8,
      spd: 14,
      critRate: 0.18,
      critDamage: 1.8,
      ultCharge: 20, // Já inicia com 20 de energia
      maxUltCharge: 100,
    },
    defaultSkinId: 'mago_arcanista',
    skins: ['mago_arcanista', 'mago_necromante_espectral'],
  },

  arqueira: {
    id: 'arqueira',
    name: 'Lyra',
    classTitle: 'Sentinela Celeste',
    lore: 'Atiradora de elite dos templos astrais. Empunha um arco forjado na luz das estrelas, capaz de atingir alvos através das brumas com precisão cirúrgica.',
    baseStats: {
      hp: 90,
      maxHp: 90,
      atk: 32,
      def: 10,
      spd: 20,
      critRate: 0.30, // 30% de chance de crítico base
      critDamage: 2.1,
      ultCharge: 10,
      maxUltCharge: 100,
    },
    defaultSkinId: 'arqueira_guardia',
    skins: ['arqueira_guardia', 'arqueira_cacadora_celeste'],
  },

  spectre: {
    id: 'spectre',
    name: 'Draven',
    classTitle: 'Algoz do Eclipse',
    lore: 'Mestre renegado das sombras que domina a energia do vácuo cósmico. Seus cortes drenam a essência dos oponentes e quebram as barreiras da realidade.',
    baseStats: {
      hp: 115,
      maxHp: 115,
      atk: 30,
      def: 16,
      spd: 16,
      critRate: 0.20,
      critDamage: 1.9,
      ultCharge: 0,
      maxUltCharge: 100,
    },
    defaultSkinId: 'spectre_paladino_sombrio',
    skins: ['spectre_paladino_sombrio', 'spectre_senhor_abissal'],
  },
};
