/**
 * AudioSystem - Sistema de Áudio e Efeitos Sonoros com Web Audio API
 * Produz áudio sintético procedural leve e dinâmico, sem peso de arquivos pesados.
 */

export type SFXKey =
  | 'ui_click'
  | 'ui_select'
  | 'dialogue_blip'
  | 'slash_light'
  | 'slash_heavy'
  | 'magic_cast'
  | 'arrow_shot'
  | 'hit_impact'
  | 'critical_hit'
  | 'shield_block'
  | 'qte_alert'
  | 'qte_success'
  | 'qte_fail'
  | 'ultimate_ready'
  | 'ultimate_release'
  | 'correct_answer'
  | 'wrong_answer'
  | 'boss_roar'
  | 'victory_fanfare'
  | 'defeat_sound';

export type MusicTrack = 'peaceful_camp' | 'battle_stage' | 'boss_clash' | 'final_showdown';

export class AudioSystem {
  private static instance: AudioSystem;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private isInitialized: boolean = false;

  // BGM sintetizada ativa
  private bgmInterval: any = null;
  private currentTrack: MusicTrack | null = null;

  private constructor() {}

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  /**
   * Inicializa o contexto de áudio após interação do usuário (touch ou clique)
   */
  public initContext(): void {
    if (this.ctx && this.ctx.state === 'running') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('[AudioSystem] Web Audio API não suportada neste ambiente:', e);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.bgmInterval) {
      this.stopMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Toca um efeito sonoro procedural
   */
  public playSFX(key: SFXKey): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (key) {
      case 'ui_click':
        this.createTone(600, t, 0.04, 'sine', 0.15);
        break;

      case 'ui_select':
        this.createTone(440, t, 0.06, 'triangle', 0.2);
        this.createTone(880, t + 0.05, 0.08, 'sine', 0.25);
        break;

      case 'dialogue_blip':
        this.createTone(320 + Math.random() * 80, t, 0.03, 'sine', 0.08);
        break;

      case 'slash_light':
        this.createNoiseSweep(800, 200, t, 0.12, 0.3);
        break;

      case 'slash_heavy':
        this.createNoiseSweep(600, 100, t, 0.22, 0.5);
        this.createTone(90, t, 0.25, 'sawtooth', 0.35);
        break;

      case 'magic_cast':
        this.createTone(400, t, 0.15, 'sine', 0.2);
        this.createTone(600, t + 0.05, 0.15, 'sine', 0.25);
        this.createTone(900, t + 0.1, 0.2, 'triangle', 0.3);
        break;

      case 'arrow_shot':
        this.createNoiseSweep(1200, 400, t, 0.08, 0.3);
        this.createTone(550, t, 0.09, 'triangle', 0.18);
        break;

      case 'hit_impact':
        this.createTone(120, t, 0.15, 'sawtooth', 0.4);
        this.createNoise(t, 0.1, 0.3);
        break;

      case 'critical_hit':
        this.createTone(180, t, 0.25, 'sawtooth', 0.5);
        this.createTone(880, t + 0.02, 0.18, 'square', 0.35);
        this.createNoise(t, 0.18, 0.45);
        break;

      case 'shield_block':
        this.createTone(240, t, 0.1, 'square', 0.3);
        this.createTone(160, t + 0.03, 0.15, 'triangle', 0.35);
        break;

      case 'qte_alert':
        this.createTone(750, t, 0.08, 'square', 0.4);
        this.createTone(1050, t + 0.07, 0.12, 'square', 0.45);
        break;

      case 'qte_success':
        this.createTone(523.25, t, 0.09, 'sine', 0.35); // C5
        this.createTone(659.25, t + 0.08, 0.09, 'sine', 0.35); // E5
        this.createTone(783.99, t + 0.16, 0.15, 'triangle', 0.45); // G5
        this.createTone(1046.5, t + 0.22, 0.25, 'sine', 0.5); // C6
        break;

      case 'qte_fail':
        this.createTone(250, t, 0.14, 'sawtooth', 0.4);
        this.createTone(180, t + 0.12, 0.22, 'sawtooth', 0.45);
        break;

      case 'ultimate_ready':
        this.createTone(440, t, 0.1, 'triangle', 0.3);
        this.createTone(660, t + 0.08, 0.12, 'triangle', 0.35);
        this.createTone(880, t + 0.16, 0.2, 'sine', 0.4);
        break;

      case 'ultimate_release':
        this.createTone(110, t, 0.4, 'sawtooth', 0.6);
        this.createNoiseSweep(1400, 100, t, 0.45, 0.5);
        this.createTone(880, t + 0.1, 0.3, 'square', 0.4);
        break;

      case 'correct_answer':
        this.createTone(440, t, 0.08, 'sine', 0.3);
        this.createTone(554.37, t + 0.07, 0.08, 'sine', 0.35);
        this.createTone(659.25, t + 0.14, 0.2, 'sine', 0.4);
        break;

      case 'wrong_answer':
        this.createTone(220, t, 0.15, 'sawtooth', 0.35);
        this.createTone(196, t + 0.12, 0.25, 'sawtooth', 0.4);
        break;

      case 'boss_roar':
        this.createTone(75, t, 0.6, 'sawtooth', 0.6);
        this.createNoise(t + 0.05, 0.5, 0.4);
        break;

      case 'victory_fanfare':
        this.playVictoryFanfare(t);
        break;

      case 'defeat_sound':
        this.createTone(330, t, 0.2, 'triangle', 0.35);
        this.createTone(293, t + 0.18, 0.2, 'triangle', 0.35);
        this.createTone(261, t + 0.36, 0.35, 'sawtooth', 0.4);
        break;

      default:
        break;
    }
  }

  /**
   * Toca ou altera a trilha sonora de fundo sintetizada
   */
  public playMusic(track: MusicTrack): void {
    if (this.currentTrack === track && this.bgmInterval) return;
    this.stopMusic();
    this.currentTrack = track;
    if (this.isMuted) return;

    this.initContext();
    if (!this.ctx) return;

    const baseNotes = track === 'boss_clash' || track === 'final_showdown'
      ? [110, 123.47, 130.81, 146.83, 110, 164.81] // A2, B2, C3, D3, A2, E3
      : [130.81, 164.81, 196.0, 220.0, 196.0, 164.81]; // C3, E3, G3, A3, G3, E3

    let step = 0;
    const intervalMs = track === 'boss_clash' ? 240 : track === 'final_showdown' ? 190 : 380;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const freq = baseNotes[step % baseNotes.length];

      // Baixo / Linha de percussão melódica
      this.createTone(freq, t, 0.16, 'triangle', this.musicVolume * 0.4);

      // Camada de tensão no boss
      if (track === 'boss_clash' || track === 'final_showdown') {
        if (step % 2 === 0) {
          this.createTone(freq * 2, t, 0.09, 'sawtooth', this.musicVolume * 0.25);
        }
      }

      step++;
    }, intervalMs);
  }

  public stopMusic(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentTrack = null;
  }

  private createTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volMultiplier: number
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(targetGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createNoiseSweep(
    startFreq: number,
    endFreq: number,
    startTime: number,
    duration: number,
    volMultiplier: number
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    gain.gain.setValueAtTime(volMultiplier * this.sfxVolume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createNoise(startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volMultiplier * this.sfxVolume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  private playVictoryFanfare(t: number): void {
    const fanfareNotes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 523.25, d: 0.12 }, // C5
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.35 }, // E5
      { f: 783.99, d: 0.5 },  // G5
    ];

    let offset = 0;
    fanfareNotes.forEach((note) => {
      this.createTone(note.f, t + offset, note.d, 'triangle', 0.5);
      offset += note.d + 0.04;
    });
  }
}

export const audioSystem = AudioSystem.getInstance();
