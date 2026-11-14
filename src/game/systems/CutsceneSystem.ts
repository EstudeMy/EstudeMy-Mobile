/**
 * CutsceneSystem - Gerenciador de cutscenes cinematográficas com letterbox e banners dramáticos
 */

import { CutsceneSequence } from '../types';
import { dialogueSystem } from './DialogueSystem';
import { audioSystem } from '../core/AudioSystem';
import { eventBus } from '../core/EventBus';

export class CutsceneSystem {
  private activeSequence: CutsceneSequence | null = null;
  private isCinematicActive: boolean = false;
  private letterboxProgress: number = 0; // 0.0 (sem bordas pretas) a 1.0 (bordas de cinema abertas)
  private bannerAlpha: number = 0;
  private bannerText: string = '';
  private onSequenceComplete: (() => void) | null = null;

  public playCutscene(sequence: CutsceneSequence, onComplete?: () => void): void {
    this.activeSequence = sequence;
    this.isCinematicActive = true;
    this.onSequenceComplete = onComplete || null;
    this.letterboxProgress = 0;
    this.bannerAlpha = 1.0;
    this.bannerText = sequence.chapterBanner || sequence.title;

    if (sequence.bgMusicTrack) {
      audioSystem.playMusic(sequence.bgMusicTrack as any);
    }

    eventBus.emit('CUTSCENE_STARTED', {
      title: sequence.title,
      location: sequence.locationName,
    });

    // Inicia os diálogos após rápida abertura cinematográfica
    setTimeout(() => {
      dialogueSystem.startDialogue(sequence.lines, () => {
        this.finishCutscene();
      });
    }, 600);
  }

  public update(deltaTime: number): void {
    if (!this.isCinematicActive) return;

    // Transição suave do letterbox
    if (this.letterboxProgress < 1.0) {
      this.letterboxProgress = Math.min(1.0, this.letterboxProgress + deltaTime * 2.5);
    }

    // Fade-out suave do banner de capítulo inicial
    if (this.bannerAlpha > 0) {
      this.bannerAlpha = Math.max(0, this.bannerAlpha - deltaTime * 0.4);
    }
  }

  private finishCutscene(): void {
    this.isCinematicActive = false;
    this.letterboxProgress = 0;
    this.bannerAlpha = 0;

    eventBus.emit('CUTSCENE_FINISHED', { sequence: this.activeSequence });

    if (this.onSequenceComplete) {
      this.onSequenceComplete();
      this.onSequenceComplete = null;
    }
  }

  public isPlaying(): boolean {
    return this.isCinematicActive;
  }

  public getLetterboxProgress(): number {
    return this.letterboxProgress;
  }

  public getBanner(): { text: string; alpha: number } {
    return { text: this.bannerText, alpha: this.bannerAlpha };
  }
}

export const cutsceneSystem = new CutsceneSystem();
