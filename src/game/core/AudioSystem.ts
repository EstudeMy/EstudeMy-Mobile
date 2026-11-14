/**
 * AudioSystem - Sistema de Áudio e Efeitos Sonoros com Web Audio API
 * Produz trilhas orquestradas procedurais e efeitos sonoros autênticos:
 * - Castelo: Orquestra Gótica (Órgão de tubos, sino de catedral, escala menor harmônica)
 * - Deserto: Orquestra Antiga Árabe (Maqam Hijaz, Alaúde/Oud, percussão Darbuka)
 * - Vila: Tema com Bardos (Flauta celta/tin whistle, alaúde em 6/8)
 * - Vazio: Tema Dark Sombrio Cósmico (Drone sub-grave 42Hz, trítonos)
 * - Montanha: Tema Viking/Nórdico (Tambores de guerra épicos, trompa Gjallarhorn em 5as)
 * - SFX: Sons de espadas, magias/poderes, flechas, pancadas pesadas e trovão
 */

export type SFXKey =
  | 'ui_click'
  | 'ui_select'
  | 'dialogue_blip'
  | 'slash_light'
  | 'slash_heavy'
  | 'sword_slash'
  | 'sword_clash'
  | 'magic_cast'
  | 'magic_impact'
  | 'arrow_shot'
  | 'arrow_whoosh'
  | 'arrow_hit'
  | 'hit_impact'
  | 'heavy_impact'
  | 'critical_hit'
  | 'shield_block'
  | 'qte_alert'
  | 'qte_success'
  | 'qte_fail'
  | 'ultimate_ready'
  | 'ultimate_release'
  | 'thunder_ultimate'
  | 'correct_answer'
  | 'wrong_answer'
  | 'boss_roar'
  | 'victory_fanfare'
  | 'defeat_sound';

export type MusicTrack =
  | 'peaceful_camp'
  | 'battle_stage'
  | 'boss_clash'
  | 'final_showdown'
  | 'gothic_orchestra'
  | 'viking_mountains'
  | 'arabic_desert'
  | 'bard_village'
  | 'dark_void';

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
  private step: number = 0;

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
      case 'sword_slash':
        this.createTone(480, t, 0.08, 'sawtooth', 0.35);
        this.createTone(220, t + 0.03, 0.12, 'sawtooth', 0.4);
        this.createNoiseSweep(2200, 400, t, 0.08, 0.25);
        break;

      case 'slash_heavy':
      case 'sword_clash':
        this.createTone(1200, t, 0.15, 'square', 0.35);
        this.createTone(800, t + 0.02, 0.2, 'sawtooth', 0.3);
        this.createTone(300, t, 0.18, 'triangle', 0.45);
        break;

      case 'magic_cast':
        this.createTone(440, t, 0.12, 'sine', 0.3);
        this.createTone(659, t + 0.05, 0.15, 'sine', 0.35);
        this.createTone(880, t + 0.1, 0.22, 'triangle', 0.4);
        this.createTone(1320, t + 0.14, 0.25, 'sine', 0.3);
        break;

      case 'magic_impact':
        this.createTone(160, t, 0.25, 'sawtooth', 0.5);
        this.createTone(880, t + 0.02, 0.2, 'square', 0.3);
        this.createNoise(t + 0.04, 0.16, 0.4);
        break;

      case 'arrow_shot':
      case 'arrow_whoosh':
        this.createNoiseSweep(3000, 600, t, 0.12, 0.28);
        this.createTone(600, t, 0.1, 'triangle', 0.2);
        break;

      case 'arrow_hit':
        this.createTone(320, t, 0.08, 'sawtooth', 0.35);
        this.createTone(180, t + 0.02, 0.12, 'triangle', 0.4);
        break;

      case 'hit_impact':
      case 'heavy_impact':
        this.createTone(120, t, 0.18, 'sawtooth', 0.55);
        this.createNoise(t, 0.12, 0.35);
        break;

      case 'shield_block':
        this.createTone(320, t, 0.12, 'square', 0.4);
        this.createTone(180, t + 0.04, 0.2, 'triangle', 0.45);
        break;

      case 'critical_hit':
        this.createTone(180, t, 0.25, 'sawtooth', 0.5);
        this.createTone(880, t + 0.02, 0.18, 'square', 0.35);
        this.createNoise(t, 0.18, 0.45);
        break;

      case 'qte_alert':
        this.createTone(750, t, 0.08, 'square', 0.4);
        this.createTone(1050, t + 0.07, 0.12, 'square', 0.45);
        break;

      case 'qte_success':
        this.createTone(523.25, t, 0.09, 'sine', 0.35);
        this.createTone(659.25, t + 0.08, 0.09, 'sine', 0.35);
        this.createTone(783.99, t + 0.16, 0.15, 'triangle', 0.45);
        this.createTone(1046.5, t + 0.22, 0.25, 'sine', 0.5);
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
      case 'thunder_ultimate':
        this.createNoiseSweep(1600, 80, t, 0.45, 0.65);
        this.createTone(85, t, 0.5, 'sawtooth', 0.65);
        this.createTone(880, t + 0.1, 0.25, 'square', 0.4);
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
   * Toca a trilha temática autêntica
   */
  public playMusic(track: MusicTrack): void {
    if (this.currentTrack === track && this.bgmInterval) return;
    this.stopMusic();
    this.currentTrack = track;
    if (this.isMuted) return;

    this.initContext();
    if (!this.ctx) return;

    this.step = 0;
    let intervalMs = 240;

    if (track === 'viking_mountains') intervalMs = 260;
    else if (track === 'arabic_desert') intervalMs = 175;
    else if (track === 'bard_village') intervalMs = 160;
    else if (track === 'dark_void') intervalMs = 420;
    else if (track === 'gothic_orchestra') intervalMs = 220;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      if (track === 'gothic_orchestra' || track === 'battle_stage') {
        const organMelody = [293.66, 349.23, 440.0, 415.3, 440.0, 349.23, 293.66, 277.18];
        const note = organMelody[this.step % organMelody.length];
        this.createTone(note, t, 0.25, 'square', this.musicVolume * 0.22);
        if (this.step % 2 === 0) {
          this.createTone(73.42, t, 0.35, 'sawtooth', this.musicVolume * 0.3);
        }
      } else if (track === 'viking_mountains') {
        // Taiko drum + Gjallarhorn
        if (this.step % 2 === 0) {
          this.createTone(85, t, 0.2, 'sawtooth', this.musicVolume * 0.45);
        }
        if (this.step % 8 === 0) {
          this.createTone(73.42, t, 1.2, 'sawtooth', this.musicVolume * 0.3);
          this.createTone(110.0, t, 1.2, 'triangle', this.musicVolume * 0.25);
        }
      } else if (track === 'arabic_desert') {
        const hijaz = [293.66, 311.13, 369.99, 392.0, 369.99, 311.13, 293.66, 261.63];
        const note = hijaz[this.step % hijaz.length];
        this.createTone(note, t, 0.16, 'sawtooth', this.musicVolume * 0.25);
        if (this.step % 2 === 0) {
          this.createTone(146.83, t, 0.18, 'triangle', this.musicVolume * 0.2);
        }
      } else if (track === 'bard_village' || track === 'peaceful_camp') {
        const flute = [587.33, 659.25, 783.99, 880.0, 783.99, 659.25];
        const note = flute[this.step % flute.length];
        this.createTone(note, t, 0.14, 'sine', this.musicVolume * 0.3);
        if (this.step % 3 === 0) {
          this.createTone(196.0, t, 0.25, 'triangle', this.musicVolume * 0.25);
        }
      } else {
        // Dark Void
        this.createTone(42.0, t, 0.8, 'sine', this.musicVolume * 0.45);
        if (this.step % 4 === 0) {
          this.createTone(65.41, t, 0.9, 'sawtooth', this.musicVolume * 0.18);
          this.createTone(92.5, t, 0.9, 'triangle', this.musicVolume * 0.18);
        }
      }

      this.step++;
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
      { f: 523.25, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.35 },
      { f: 783.99, d: 0.5 },
    ];

    let offset = 0;
    fanfareNotes.forEach((note) => {
      this.createTone(note.f, t + offset, note.d, 'triangle', 0.5);
      offset += note.d + 0.04;
    });
  }
}

export const audioSystem = AudioSystem.getInstance();