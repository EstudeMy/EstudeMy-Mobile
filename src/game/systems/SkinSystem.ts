/**
 * SkinSystem - Gerenciador de Skins com atributos dinâmicos e movesets exclusivos
 */

import { CharacterId, CharacterStats, SkinDefinition, SkinId } from '../types';
import { CHARACTERS_DATA } from '../data/charactersData';
import { SKINS_DATA } from '../data/skinsData';
import { eventBus } from '../core/EventBus';

export class SkinSystem {
  private selectedCharacterId: CharacterId = 'samurai';
  private selectedSkinId: SkinId = 'samurai_ronin';

  public setCharacter(characterId: CharacterId, skinId?: SkinId): void {
    if (!CHARACTERS_DATA[characterId]) {
      console.warn(`[SkinSystem] Personagem inválido: ${characterId}. Usando padrão 'samurai'.`);
      characterId = 'samurai';
    }
    this.selectedCharacterId = characterId;

    if (skinId && SKINS_DATA[skinId] && SKINS_DATA[skinId].characterId === characterId) {
      this.selectedSkinId = skinId;
    } else {
      this.selectedSkinId = CHARACTERS_DATA[characterId].defaultSkinId;
    }

    eventBus.emit('CHARACTER_SKIN_CHANGED', {
      characterId: this.selectedCharacterId,
      skin: this.getActiveSkin(),
      computedStats: this.getComputedStats(),
    });
  }

  public setSkin(skinId: SkinId): boolean {
    const skin = SKINS_DATA[skinId];
    if (!skin) {
      console.warn(`[SkinSystem] Skin inexistente: ${skinId}`);
      return false;
    }

    this.selectedCharacterId = skin.characterId;
    this.selectedSkinId = skinId;

    eventBus.emit('CHARACTER_SKIN_CHANGED', {
      characterId: this.selectedCharacterId,
      skin,
      computedStats: this.getComputedStats(),
    });
    return true;
  }

  public getActiveSkin(): SkinDefinition {
    return SKINS_DATA[this.selectedSkinId] || SKINS_DATA.samurai_ronin;
  }

  public getActiveCharacterId(): CharacterId {
    return this.selectedCharacterId;
  }

  /**
   * Calcula atributos finais somando a base do personagem com os modificadores da skin
   */
  public getComputedStats(): CharacterStats {
    const charBase = CHARACTERS_DATA[this.selectedCharacterId]?.baseStats || CHARACTERS_DATA.samurai.baseStats;
    const skinBonus = this.getActiveSkin().bonusStats;

    return {
      hp: Math.max(10, charBase.hp + (skinBonus.hp || 0)),
      maxHp: Math.max(10, charBase.maxHp + (skinBonus.hp || 0)),
      atk: Math.max(1, charBase.atk + (skinBonus.atk || 0)),
      def: Math.max(0, charBase.def + (skinBonus.def || 0)),
      spd: Math.max(1, charBase.spd + (skinBonus.spd || 0)),
      critRate: Math.min(1.0, Math.max(0, charBase.critRate + (skinBonus.critRate || 0))),
      critDamage: Math.max(1.0, charBase.critDamage + (skinBonus.critDamage || 0)),
      ultCharge: charBase.ultCharge,
      maxUltCharge: 100,
    };
  }

  /**
   * Retorna todas as skins disponíveis para um determinado personagem
   */
  public getSkinsForCharacter(characterId: CharacterId): SkinDefinition[] {
    const char = CHARACTERS_DATA[characterId];
    if (!char) return [];
    return char.skins.map((sId) => SKINS_DATA[sId]).filter(Boolean);
  }
}

export const skinSystem = new SkinSystem();
