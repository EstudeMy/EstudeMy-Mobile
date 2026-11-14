/**
 * BossSystem - Gerenciador de Chefes com Múltiplas Fases e Padrões de Ataque
 */

import { BossDefinition, BossPhaseConfig, BOSSES_DATA } from '../data/bossesData';
import { audioSystem } from '../core/AudioSystem';
import { eventBus } from '../core/EventBus';
import { qteSystem } from './QTESystem';

export interface BossLiveState {
  definition: BossDefinition;
  currentPhaseIndex: number; // 0-based
  currentPhase: BossPhaseConfig;
  currentHp: number;
  maxHp: number;
  isStaggered: boolean;
  staggerTurns: number;
  isDefeated: boolean;
}

export class BossSystem {
  private state: BossLiveState | null = null;

  public loadBoss(bossId: string): BossLiveState {
    const definition = BOSSES_DATA[bossId] || BOSSES_DATA.spectre;
    const firstPhase = definition.phases[0];

    this.state = {
      definition,
      currentPhaseIndex: 0,
      currentPhase: firstPhase,
      currentHp: firstPhase.hpMax,
      maxHp: firstPhase.hpMax,
      isStaggered: false,
      staggerTurns: 0,
      isDefeated: false,
    };

    if (firstPhase.musicTrack) {
      audioSystem.playMusic(firstPhase.musicTrack as any);
    }

    eventBus.emit('BOSS_SPAWNED', {
      bossId: definition.id,
      name: definition.name,
      phase: 1,
      totalPhases: definition.totalPhases,
      hp: this.state.currentHp,
    });

    return this.state;
  }

  public takeDamage(damage: number): { defeated: boolean; phaseChanged: boolean; remainingHp: number } {
    if (!this.state || this.state.isDefeated) {
      return { defeated: true, phaseChanged: false, remainingHp: 0 };
    }

    const defenseMitigation = this.state.currentPhase.def / (this.state.currentPhase.def + 40);
    const finalDamage = Math.max(5, Math.round(damage * (1 - defenseMitigation)));

    this.state.currentHp = Math.max(0, this.state.currentHp - finalDamage);

    eventBus.emit('BOSS_DAMAGED', {
      damage: finalDamage,
      remainingHp: this.state.currentHp,
      maxHp: this.state.maxHp,
      phase: this.state.currentPhaseIndex + 1,
    });

    // Se a barra de vida da fase atual zerou
    if (this.state.currentHp <= 0) {
      const nextPhaseIndex = this.state.currentPhaseIndex + 1;

      // Se ainda houverem fases adicionais (Ex: Chefe Final com 3 barras)
      if (nextPhaseIndex < this.state.definition.phases.length) {
        this.transitionToPhase(nextPhaseIndex);
        return { defeated: false, phaseChanged: true, remainingHp: this.state.currentHp };
      } else {
        // Chefe totalmente derrotado!
        this.state.isDefeated = true;
        audioSystem.playSFX('boss_roar');
        eventBus.emit('BOSS_DEFEATED', {
          bossId: this.state.definition.id,
          defeatQuote: this.state.definition.defeatQuote,
        });
        return { defeated: true, phaseChanged: false, remainingHp: 0 };
      }
    }

    return { defeated: false, phaseChanged: false, remainingHp: this.state.currentHp };
  }

  private transitionToPhase(phaseIndex: number): void {
    if (!this.state) return;
    const newPhase = this.state.definition.phases[phaseIndex];

    this.state.currentPhaseIndex = phaseIndex;
    this.state.currentPhase = newPhase;
    this.state.currentHp = newPhase.hpMax;
    this.state.maxHp = newPhase.hpMax;
    this.state.isStaggered = false;

    audioSystem.playSFX('boss_roar');
    if (newPhase.musicTrack) {
      audioSystem.playMusic(newPhase.musicTrack as any);
    }

    eventBus.emit('BOSS_PHASE_CHANGED', {
      phaseNumber: phaseIndex + 1,
      phaseName: newPhase.phaseName,
      maxHp: newPhase.hpMax,
      barColor: newPhase.barColor,
      voice: newPhase.voiceOnStart,
    });
  }

  /**
   * Executa a rodada de ataque do Boss
   */
  public executeBossTurn(onPlayerDamage: (dmg: number, isHeavy: boolean) => void): void {
    if (!this.state || this.state.isDefeated) return;

    if (this.state.isStaggered) {
      this.state.staggerTurns--;
      if (this.state.staggerTurns <= 0) {
        this.state.isStaggered = false;
      }
      eventBus.emit('BOSS_TURN_SKIPPED', { reason: 'staggered' });
      return;
    }

    // Escolhe aleatoriamente entre os ataques da fase atual
    const attacks = this.state.currentPhase.attacks;
    const attack = attacks[Math.floor(Math.random() * attacks.length)] || attacks[0];

    // Verifica se o ataque pesado ativa um QTE de defesa para o jogador
    const triggersQTE = attack.isHeavyAttack && Math.random() < this.state.currentPhase.qteChanceOnHit;

    if (triggersQTE) {
      qteSystem.triggerQTE(
        {
          id: 'qte_bloqueio_boss',
          type: 'single',
          keys: ['SPACE'],
          durationMs: 1500,
          label: `DEFENDA O GOLPE: ${attack.name}! [ESPAÇO] ou TOQUE!`,
          bonusReward: { type: 'boss_stagger', value: 1.0 },
        },
        (success) => {
          if (success) {
            // Jogador bloqueou com sucesso: atordoa o boss e não toma dano!
            this.state!.isStaggered = true;
            this.state!.staggerTurns = 1;
            audioSystem.playSFX('shield_block');
            eventBus.emit('BOSS_ATTACK_PARRIED', { attackName: attack.name });
          } else {
            // Falhou no QTE: toma dano cheio do ataque pesado
            audioSystem.playSFX(attack.sfx as any);
            onPlayerDamage(attack.damage, true);
          }
        }
      );
    } else {
      // Ataque normal sem QTE
      audioSystem.playSFX(attack.sfx as any);
      onPlayerDamage(attack.damage, false);
    }
  }

  public getState(): BossLiveState | null {
    return this.state;
  }
}

export const bossSystem = new BossSystem();
