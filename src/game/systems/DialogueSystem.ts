/**
 * DialogueSystem - Sistema de reprodução de diálogos com efeito Typewriter e SFX
 */

import { DialogueLine } from '../types';
import { audioSystem } from '../core/AudioSystem';
import { eventBus } from '../core/EventBus';

export class DialogueSystem {
  private currentLines: DialogueLine[] = [];
  private currentLineIndex: number = 0;
  private displayedText: string = '';
  private fullText: string = '';
  private charIndex: number = 0;
  private isTyping: boolean = false;
  private typingTimer: any = null;
  private typingSpeedMs: number = 28; // Velocidade da digitação
  private isActive: boolean = false;
  private onCompleteCallback: (() => void) | null = null;

  public startDialogue(lines: DialogueLine[], onComplete?: () => void): void {
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    this.currentLines = lines;
    this.currentLineIndex = 0;
    this.isActive = true;
    this.onCompleteCallback = onComplete || null;

    eventBus.emit('DIALOGUE_STARTED', { totalLines: lines.length });
    this.loadCurrentLine();
  }

  private loadCurrentLine(): void {
    if (this.currentLineIndex >= this.currentLines.length) {
      this.finishDialogue();
      return;
    }

    const line = this.currentLines[this.currentLineIndex];
    this.fullText = line.text;
    this.displayedText = '';
    this.charIndex = 0;
    this.isTyping = true;

    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }

    eventBus.emit('DIALOGUE_LINE_CHANGE', { line, index: this.currentLineIndex });

    this.typingTimer = setInterval(() => {
      if (this.charIndex < this.fullText.length) {
        this.displayedText += this.fullText.charAt(this.charIndex);
        this.charIndex++;

        // Emite som sutil a cada 2 caracteres
        if (this.charIndex % 2 === 0) {
          audioSystem.playSFX('dialogue_blip');
        }

        eventBus.emit('DIALOGUE_TYPING_UPDATE', { text: this.displayedText });
      } else {
        this.completeTyping();
      }
    }, this.typingSpeedMs);
  }

  public completeTyping(): void {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    this.isTyping = false;
    this.displayedText = this.fullText;
    eventBus.emit('DIALOGUE_TYPING_COMPLETE', { text: this.displayedText });
  }

  /**
   * Acionado quando o jogador clica na tela ou pressiona espaço
   */
  public advance(): void {
    if (!this.isActive) return;

    if (this.isTyping) {
      // Se ainda estiver digitando, completa a frase imediatamente
      this.completeTyping();
    } else {
      // Se já terminou a frase, avança para a próxima
      audioSystem.playSFX('ui_select');
      this.currentLineIndex++;
      this.loadCurrentLine();
    }
  }

  private finishDialogue(): void {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    this.isActive = false;
    eventBus.emit('DIALOGUE_FINISHED');
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
      this.onCompleteCallback = null;
    }
  }

  public getCurrentLine(): DialogueLine | null {
    if (!this.isActive || this.currentLineIndex >= this.currentLines.length) {
      return null;
    }
    return this.currentLines[this.currentLineIndex];
  }

  public getDisplayedText(): string {
    return this.displayedText;
  }

  public isDialogueActive(): boolean {
    return this.isActive;
  }
}

export const dialogueSystem = new DialogueSystem();
