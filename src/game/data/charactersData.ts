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
};
