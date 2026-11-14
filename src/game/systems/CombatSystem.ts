/**
 * CombatSystem - Sistema Central de Combate, Cálculo de Dano e Barra de Ultimate
 */

import { CharacterStats, MoveDefinition } from '../types';
import { skinSystem } from './SkinSystem';
import { bossSystem } from './BossSystem';
import { questionBridgeSystem } from './QuestionBridgeSystem';
import { qteSystem } from './QTESystem';
import { audioSystem } from '../core/AudioSystem';
import { eventBus } from '../core/EventBus';

export interface CombatPlayerState {
  hp: number;
  maxHp: number;
  ultCharge: number; // 0 a 100
  isUltReady: boolean;
  streak: number;
  isAlive: boolean;
  computedStats: CharacterStats;
}

export interface FloatingCombatTextItem {
  id: string;
  text: string;
  color: string;
  target: 'player' | 'boss';
  isCrit: boolean;
}

export class CombatSystem {
  private playerState: CombatPlayerState = {
    hp: 100,
    maxHp: 100,
    ultCharge: 0,
    isUltReady: false,
    streak: 0,
    isAlive: true,
    computedStats: skinSystem.getComputedStats(),
  };

  private floatingTexts: FloatingCombatTextItem[] = [];

  public initCombat(bossId: string = 'spectre'): void {
    const stats = skinSystem.getComputedStats();
    this.playerState = {
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      ultCharge: stats.ultCharge || 0,
      isUltReady: (stats.ultCharge || 0) >= 100,
      streak: 0,
      isAlive: true,
      computedStats: stats,
    };
    this.floatingTexts = [];

    // Carrega o chefe correspondente
    bossSystem.loadBoss(bossId);

    // Escuta recompensas de QTE
    eventBus.on('QTE_SUCCESS', ({ reward }) => {
      if (!reward) return;
      if (reward.type === 'hp_heal') {
        this.healPlayer(reward.value);
      } else if (reward.type === 'ultimate_fill') {
        this.chargeUltimate(100);
      }
    });

    eventBus.emit('COMBAT_INITIALIZED', {
      player: this.playerState,
      boss: bossSystem.getState(),
    });
  }

  /**
   * Processa a resposta do aluno enviada pela interface de perguntas
   */
  public processAnswer(selectedIndex: number): void {
    if (!this.playerState.isAlive) return;

    const answerResult = questionBridgeSystem.submitAnswer(selectedIndex);

    if (answerResult.isCorrect) {
      this.handlePlayerSuccess(answerResult.comboTriggered);
    } else {
      this.handlePlayerFailure();
    }
  }

  private handlePlayerSuccess(isCombo: boolean): void {
    const skin = skinSystem.getActiveSkin();
    const move: MoveDefinition = isCombo ? skin.moveset.attack2 : skin.moveset.attack1;
    const stats = this.playerState.computedStats;

    // Cálculo de Dano Base
    const isCrit = Math.random() < stats.critRate;
    const critMult = isCrit ? stats.critDamage : 1.0;
    const baseDamage = Math.round(stats.atk * move.damageMultiplier * critMult);

    // Aumento de barra de Ultimate
    this.chargeUltimate(isCombo ? 35 : 25);

    // Chance de QTE Ofensivo em sequências altas (Streak >= 3)
    const currentStreak = questionBridgeSystem.getProgress().streak;
    const triggerOffensiveQTE = currentStreak >= 3 && Math.random() < 0.45;

    if (triggerOffensiveQTE) {
      qteSystem.triggerQTE(
        {
          id: 'qte_combo_ofensivo',
          type: 'sequence',
          keys: ['A', 'D', 'SPACE'],
          durationMs: 2200,
          label: `GOLPE CRÍTICO PERFEITO! Execute o combo da ${skin.name}!`,
          bonusReward: { type: 'critical_strike', value: 2.2 },
        },
        (success, reward) => {
          const finalMult = success ? (reward?.value || 2.0) : 1.0;
          const totalDmg = Math.round(baseDamage * finalMult);
          this.applyDamageToBoss(totalDmg, isCrit, move.name, move.sfx);
        }
      );
    } else {
      this.applyDamageToBoss(baseDamage, isCrit, move.name, move.sfx);
    }
  }

  private applyDamageToBoss(damage: number, isCrit: boolean, moveName: string, sfx: string): void {
    audioSystem.playSFX(sfx as any);
    const result = bossSystem.takeDamage(damage);

    this.addFloatingText(`-${damage}`, isCrit ? '#facc15' : '#38bdf8', 'boss', isCrit);

    eventBus.emit('PLAYER_ATTACKED', {
      moveName,
      damage,
      isCrit,
      bossRemainingHp: result.remainingHp,
    });

    if (result.defeated) {
      audioSystem.playSFX('victory_fanfare');
      eventBus.emit('COMBAT_VICTORY', {
        faseConcluida: true,
        xpGanho: 150,
        moedasGanhas: 50,
      });
    }
  }

  private handlePlayerFailure(): void {
    this.addFloatingText('ERROU!', '#ef4444', 'player', false);

    // O Boss contra-ataca quando o aluno erra
    bossSystem.executeBossTurn((bossDmg) => {
      this.damagePlayer(bossDmg);
    });
  }

  /**
   * Executa o Golpe Supremo (Ultimate) quando a barra atinge 100%
   */
  public executeUltimate(): boolean {
    if (!this.playerState.isUltReady || !this.playerState.isAlive) {
      return false;
    }

    const skin = skinSystem.getActiveSkin();
    const ult = skin.moveset.ultimate;
    const stats = this.playerState.computedStats;

    // Consome a barra de Ultimate
    this.playerState.ultCharge = 0;
    this.playerState.isUltReady = false;
    eventBus.emit('ULTIMATE_CHARGE_UPDATE', { ultCharge: 0, isReady: false });

    audioSystem.playSFX('ultimate_release');

    // Dispara o QTE exclusivo da Skin para a Ultimate
    qteSystem.triggerQTE(
      {
        id: `qte_ult_${skin.id}`,
        type: 'sequence',
        keys: ult.qtePattern,
        durationMs: 2800,
        label: `LIBERAR ULTIMATE: ${ult.name}!`,
        bonusReward: { type: 'critical_strike', value: 1.5 },
      },
      (success) => {
        const ultMult = success ? ult.damageMultiplier * 1.4 : ult.damageMultiplier;
        const totalDmg = Math.round(stats.atk * ultMult);
        this.applyDamageToBoss(totalDmg, true, ult.name, ult.sfx);
      }
    );

    return true;
  }

  public chargeUltimate(amount: number): void {
    this.playerState.ultCharge = Math.min(100, this.playerState.ultCharge + amount);
    this.playerState.isUltReady = this.playerState.ultCharge >= 100;

    if (this.playerState.isUltReady) {
      audioSystem.playSFX('ultimate_ready');
    }

    eventBus.emit('ULTIMATE_CHARGE_UPDATE', {
      ultCharge: this.playerState.ultCharge,
      isReady: this.playerState.isUltReady,
    });
  }

  public healPlayer(amount: number): void {
    this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + amount);
    this.addFloatingText(`+${amount} HP`, '#22c55e', 'player', false);
    audioSystem.playSFX('ui_select');

    eventBus.emit('PLAYER_HEALED', {
      hp: this.playerState.hp,
      maxHp: this.playerState.maxHp,
    });
  }

  public damagePlayer(rawDmg: number): void {
    const defMitigation = this.playerState.computedStats.def / (this.playerState.computedStats.def + 40);
    const finalDmg = Math.max(5, Math.round(rawDmg * (1 - defMitigation)));

    this.playerState.hp = Math.max(0, this.playerState.hp - finalDmg);
    this.addFloatingText(`-${finalDmg}`, '#ef4444', 'player', false);

    eventBus.emit('PLAYER_DAMAGED', {
      damage: finalDmg,
      remainingHp: this.playerState.hp,
      maxHp: this.playerState.maxHp,
    });

    if (this.playerState.hp <= 0) {
      this.playerState.isAlive = false;
      audioSystem.playSFX('defeat_sound');
      eventBus.emit('COMBAT_DEFEAT', {
        motivo: 'hp_zerado',
      });
    }
  }

  private addFloatingText(text: string, color: string, target: 'player' | 'boss', isCrit: boolean): void {
    const item: FloatingCombatTextItem = {
      id: `fct_${Date.now()}_${Math.random()}`,
      text,
      color,
      target,
      isCrit,
    };
    this.floatingTexts.push(item);
    eventBus.emit('FLOATING_TEXT_SPAWNED', item);
  }

  public getPlayerState(): CombatPlayerState {
    return this.playerState;
  }
}

export const combatSystem = new CombatSystem();
