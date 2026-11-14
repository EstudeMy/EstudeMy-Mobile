/**
 * QuestionBridgeSystem - Ponte pedagógica entre o quiz de estudos e a batalha RPG
 */

import { GameModeId, QuestionData } from '../types';
import { audioSystem } from '../core/AudioSystem';
import { eventBus } from '../core/EventBus';

export interface AnswerResult {
  isCorrect: boolean;
  selectedOption: string;
  correctOption: string;
  streak: number;
  comboTriggered: boolean;
  ultChargeGained: number;
  explanation?: string;
}

export class QuestionBridgeSystem {
  private questions: QuestionData[] = [];
  private currentIndex: number = 0;
  private currentStreak: number = 0;
  private maxStreak: number = 0;
  private correctCount: number = 0;
  private wrongCount: number = 0;
  private activeMode: GameModeId = 'campanha';

  public loadQuestions(rawQuestions: any[], mode: GameModeId = 'campanha'): void {
    this.activeMode = mode;
    this.currentIndex = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.correctCount = 0;
    this.wrongCount = 0;

    // Normalização e embaralhamento com Fisher-Yates
    this.questions = (rawQuestions || []).map((q) => {
      const origAlts = Array.isArray(q.alternativas) ? [...q.alternativas] : [];
      let correctAnswerText = '';

      if (typeof q.respostaCorreta === 'number' && origAlts[q.respostaCorreta] !== undefined) {
        correctAnswerText = origAlts[q.respostaCorreta];
      } else if (typeof q.respostaCorreta === 'string' && /^\d+$/.test(q.respostaCorreta.trim())) {
        correctAnswerText = origAlts[parseInt(q.respostaCorreta.trim(), 10)] || origAlts[0] || '';
      } else if (typeof q.respostaCorreta === 'string') {
        correctAnswerText = q.respostaCorreta;
      } else {
        correctAnswerText = origAlts[0] || '';
      }

      // Embaralha alternativas
      const shuffled = [...origAlts];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }

      const correctIndex = shuffled.findIndex((alt) => alt === correctAnswerText);

      return {
        _id: q._id || q.id,
        enunciado: q.enunciado || q.titulo || 'Pergunta de Conhecimento',
        alternativas: shuffled,
        respostaCorreta: correctAnswerText,
        indiceRespostaCorreta: correctIndex >= 0 ? correctIndex : 0,
        explicacao: q.explicacao || 'Revise o conteúdo desta trilha para aprofundar seu aprendizado.',
        materia: q.materia,
        dificuldade: q.dificuldade || 'medio',
      };
    });

    eventBus.emit('QUESTIONS_LOADED', {
      total: this.questions.length,
      mode: this.activeMode,
    });
  }

  public getCurrentQuestion(): QuestionData | null {
    if (this.questions.length === 0) return null;
    return this.questions[this.currentIndex % this.questions.length];
  }

  public submitAnswer(selectedIndex: number): AnswerResult {
    const q = this.getCurrentQuestion();
    if (!q) {
      return {
        isCorrect: false,
        selectedOption: '',
        correctOption: '',
        streak: 0,
        comboTriggered: false,
        ultChargeGained: 0,
      };
    }

    const selectedText = q.alternativas[selectedIndex] || '';
    const isCorrect = selectedIndex === q.indiceRespostaCorreta;

    let ultChargeGained = 0;
    let comboTriggered = false;

    if (isCorrect) {
      this.correctCount++;
      this.currentStreak++;
      if (this.currentStreak > this.maxStreak) {
        this.maxStreak = this.currentStreak;
      }

      // Acerto base: +25% de carga de Ultimate
      ultChargeGained = 25;

      // Se streak >= 2, ativa combo de ataque
      if (this.currentStreak >= 2) {
        comboTriggered = true;
        ultChargeGained += 10;
      }

      audioSystem.playSFX('correct_answer');
    } else {
      this.wrongCount++;
      this.currentStreak = 0;
      audioSystem.playSFX('wrong_answer');
    }

    const result: AnswerResult = {
      isCorrect,
      selectedOption: selectedText,
      correctOption: q.respostaCorreta as string,
      streak: this.currentStreak,
      comboTriggered,
      ultChargeGained,
      explanation: q.explicacao,
    };

    eventBus.emit('ANSWER_SUBMITTED', result);

    // Avança para a próxima pergunta
    this.currentIndex++;

    return result;
  }

  public getProgress(): { current: number; total: number; correct: number; wrong: number; streak: number } {
    return {
      current: this.currentIndex,
      total: this.questions.length,
      correct: this.correctCount,
      wrong: this.wrongCount,
      streak: this.currentStreak,
    };
  }

  public hasRemainingQuestions(): boolean {
    return this.currentIndex < this.questions.length;
  }
}

export const questionBridgeSystem = new QuestionBridgeSystem();
