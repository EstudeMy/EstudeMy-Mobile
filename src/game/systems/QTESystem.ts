/**
 * QTESystem - Mecânica de Quick Time Events (Eventos Rápidos em Tempo Real)
 * Suporta sequências no teclado (Web) e botões virtuais interativos no celular (Mobile).
 */

import { QTEPrompt } from '../types';
import { audioSystem } from '../core/AudioSystem';
import { eventBus } from '../core/EventBus';

export interface QTEState {
  isActive: boolean;
  prompt: QTEPrompt | null;
  currentKeyIndex: number;
  timeRemainingMs: number;
  totalDurationMs: number;
  mashCount: number;
  targetMashCount: number;
  progressPercent: number; // 0.0 a 1.0
}

export class QTESystem {
  private state: QTEState = {
    isActive: false,
    prompt: null,
    currentKeyIndex: 0,
    timeRemainingMs: 0,
    totalDurationMs: 0,
    mashCount: 0,
    targetMashCount: 8,
    progressPercent: 1.0,
  };

  private timerInterval: any = null;
  private onResultCallback: ((success: boolean, bonusReward?: any) => void) | null = null;

  public triggerQTE(
    promptConfig?: Partial<QTEPrompt>,
    onResult?: (success: boolean, bonusReward?: any) => void
  ): void {
    if (this.state.isActive) return;

    this.onResultCallback = onResult || null;

    const defaultPrompts: QTEPrompt[] = [
      {
        id: 'qte_defesa_perfeita',
        type: 'single',
        keys: ['SPACE'],
        durationMs: 1400,
        label: 'PARRY PERFEITO! Pressione [ESPAÇO] ou TOQUE!',
        bonusReward: { type: 'boss_stagger', value: 2.0 },
      },
      {
        id: 'qte_combo_relampago',
        type: 'sequence',
        keys: ['A', 'D', 'SPACE'],
        durationMs: 2400,
        label: 'COMBO FEROZ! Sequência [A] -> [D] -> [ESPAÇO]!',
        bonusReward: { type: 'critical_strike', value: 2.5 },
      },
      {
        id: 'qte_recuperacao_vida',
        type: 'sequence',
        keys: ['W', 'S', 'SPACE'],
        durationMs: 2200,
        label: 'RECUPERAÇÃO DE ENERGIA! [W] -> [S] -> [ESPAÇO]!',
        bonusReward: { type: 'hp_heal', value: 30 },
      },
      {
        id: 'qte_sobrecarga_ult',
        type: 'mash',
        keys: ['SPACE'],
        durationMs: 2000,
        label: 'SOBRECARGA DE ULTIMATE! Pressione repetidamente!',
        bonusReward: { type: 'ultimate_fill', value: 100 },
      },
    ];

    const chosen = promptConfig
      ? ({
          id: promptConfig.id || 'qte_custom',
          type: promptConfig.type || 'sequence',
          keys: promptConfig.keys || ['A', 'D', 'SPACE'],
          durationMs: promptConfig.durationMs || 2200,
          label: promptConfig.label || 'EXECUTE O QTE!',
          bonusReward: promptConfig.bonusReward || { type: 'critical_strike', value: 2.0 },
        } as QTEPrompt)
      : defaultPrompts[Math.floor(Math.random() * defaultPrompts.length)];

    this.state = {
      isActive: true,
      prompt: chosen,
      currentKeyIndex: 0,
      timeRemainingMs: chosen.durationMs,
      totalDurationMs: chosen.durationMs,
      mashCount: 0,
      targetMashCount: chosen.type === 'mash' ? 7 : 1,
      progressPercent: 1.0,
    };

    audioSystem.playSFX('qte_alert');

    eventBus.emit('QTE_STARTED', { ...this.state });

    // Loop de contagem regressiva suave (30 FPS no timer de QTE)
    const tickMs = 33;
    this.timerInterval = setInterval(() => {
      this.state.timeRemainingMs -= tickMs;
      this.state.progressPercent = Math.max(0, this.state.timeRemainingMs / this.state.totalDurationMs);

      eventBus.emit('QTE_TICK', {
        timeRemainingMs: this.state.timeRemainingMs,
        progressPercent: this.state.progressPercent,
      });

      if (this.state.timeRemainingMs <= 0) {
        this.resolveQTE(false);
      }
    }, tickMs);
  }

  /**
   * Processa a entrada de uma tecla ou clique do jogador
   */
  public handleInput(inputKey: string): void {
    if (!this.state.isActive || !this.state.prompt) return;

    const normalizedInput = inputKey.toUpperCase().trim();
    const prompt = this.state.prompt;

    if (prompt.type === 'mash') {
      this.state.mashCount++;
      audioSystem.playSFX('ui_click');
      eventBus.emit('QTE_MASH_PROGRESS', {
        current: this.state.mashCount,
        target: this.state.targetMashCount,
      });

      if (this.state.mashCount >= this.state.targetMashCount) {
        this.resolveQTE(true);
      }
      return;
    }

    // Para 'single' ou 'sequence'
    const expectedKey = prompt.keys[this.state.currentKeyIndex];
    const isMatch =
      normalizedInput === expectedKey ||
      (expectedKey === 'SPACE' && (normalizedInput === ' ' || normalizedInput === 'TAP'));

    if (isMatch) {
      this.state.currentKeyIndex++;
      audioSystem.playSFX('slash_light');

      eventBus.emit('QTE_KEY_SUCCESS', {
        matchedKey: expectedKey,
        nextIndex: this.state.currentKeyIndex,
        totalKeys: prompt.keys.length,
      });

      // Se completou todas as teclas da sequência
      if (this.state.currentKeyIndex >= prompt.keys.length) {
        this.resolveQTE(true);
      }
    } else {
      // Errou a tecla na sequência
      audioSystem.playSFX('ui_click');
    }
  }

  private resolveQTE(success: boolean): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const reward = success && this.state.prompt ? this.state.prompt.bonusReward : null;

    if (success) {
      audioSystem.playSFX('qte_success');
      eventBus.emit('QTE_SUCCESS', { reward });
    } else {
      audioSystem.playSFX('qte_fail');
      eventBus.emit('QTE_FAILED', { penaltyDamage: 15 });
    }

    this.state.isActive = false;

    if (this.onResultCallback) {
      this.onResultCallback(success, reward);
      this.onResultCallback = null;
    }
  }

  public getState(): QTEState {
    return this.state;
  }

  public isQTEActive(): boolean {
    return this.state.isActive;
  }
}

export const qteSystem = new QTESystem();
