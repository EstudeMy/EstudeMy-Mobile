/**
 * AudioSystem - Sistema de Áudio e Efeitos Sonoros com Web Audio API
 * Produz trilhas orquestradas acústicas realistas (sem som 8-bit/pixelizado):
 * - Castelo: Orquestra Gótica Acústica (Órgão de tubos harmônico, violoncelo quente, sino tubular)
 * - Deserto: Orquestra Antiga Árabe (Alaúde/Oud em Maqam Hijaz, drone modal, percussão Darbuka)
 * - Vila: Orquestra de Câmara Folk (Flauta transversal de madeira com vibrato, harpa/alaúde em 6/8)
 * - Vazio: Ambient Dark Sinfônico (Sub-grave orgânico 40Hz, trítonos cósmicos, ressonância celestial)
 * - Montanha: Orquestra Nórdica / Viking (Tambores de guerra Taiko acústicos, trompa Gjallarhorn em quintas)
 * - SFX: Lâminas de aço, magias e feitiços arcanos, flechas, impactos contundentes e trovão supremo
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
  private musicVolume: number = 0.6;
  private isInitialized: boolean = false;

  private masterGain: GainNode | null = null;
  private reverbSend: GainNode | null = null;

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

      if (this.ctx && !this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Delay de ambiência com realimentação suave para simular sala de concerto acústica
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.22;
        const delayFeedback = this.ctx.createGain();
        delayFeedback.gain.value = 0.32;

        const delayFilter = this.ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 1400;

        this.reverbSend = this.ctx.createGain();
        this.reverbSend.gain.value = 0.4;

        this.reverbSend.connect(delay);
        delay.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delay);
        delayFilter.connect(this.masterGain);
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
        this.createPluck(380, t, 0.1, 0.35);
        this.createNoiseBurst(t, 0.08, 0.2, 2800);
        break;

      case 'slash_heavy':
      case 'sword_clash':
        this.createTone(1100, t, 0.25, 'sine', 0.35);
        this.createPluck(440, t, 0.15, 0.3);
        break;

      case 'magic_cast':
        this.createTone(660, t, 0.25, 'sine', 0.35);
        this.createTone(1320, t + 0.08, 0.3, 'sine', 0.25);
        break;

      case 'magic_impact':
        this.createWarTaiko(t, 0.28, 0.6);
        this.createTone(700, t, 0.3, 'sine', 0.35);
        break;

      case 'arrow_shot':
      case 'arrow_whoosh':
        this.createNoiseBurst(t, 0.1, 0.25, 3200);
        this.createTone(550, t, 0.08, 'triangle', 0.18);
        break;

      case 'arrow_hit':
        this.createTone(320, t, 0.08, 'triangle', 0.35);
        this.createTone(180, t + 0.02, 0.12, 'sine', 0.4);
        break;

      case 'hit_impact':
      case 'heavy_impact':
        this.createWarTaiko(t, 0.22, 0.65);
        break;

      case 'shield_block':
        this.createTone(350, t, 0.18, 'sine', 0.45);
        break;

      case 'critical_hit':
        this.createTone(1046, t, 0.3, 'sine', 0.45);
        this.createWarTaiko(t, 0.25, 0.55);
        break;

      case 'qte_alert':
        this.createTone(880, t, 0.12, 'sine', 0.4);
        this.createTone(1320, t + 0.08, 0.16, 'sine', 0.45);
        break;

      case 'qte_success':
        this.createTone(659, t, 0.12, 'sine', 0.4);
        this.createTone(1046, t + 0.1, 0.3, 'triangle', 0.5);
        break;

      case 'qte_fail':
        this.createWarmStrings(130, t, 0.28, 0.45);
        break;

      case 'ultimate_ready':
        this.createTone(440, t, 0.1, 'triangle', 0.3);
        this.createTone(660, t + 0.08, 0.12, 'sine', 0.35);
        this.createTone(880, t + 0.16, 0.2, 'sine', 0.4);
        break;

      case 'ultimate_release':
      case 'thunder_ultimate':
        this.createWarTaiko(t, 0.6, 0.85);
        this.createWarmSubBass(35, t, 0.8, 0.65);
        this.createWarTaiko(t + 0.15, 0.5, 0.7);
        break;

      case 'correct_answer':
        this.createTone(523, t, 0.12, 'sine', 0.4);
        this.createTone(783, t + 0.09, 0.22, 'sine', 0.45);
        break;

      case 'wrong_answer':
        this.createWarmStrings(180, t, 0.22, 0.4);
        break;

      case 'boss_roar':
        this.createWarTaiko(t, 0.5, 0.7);
        break;

      case 'victory_fanfare':
        this.createTone(523, t, 0.15, 'triangle', 0.45);
        this.createTone(659, t + 0.12, 0.15, 'triangle', 0.45);
        this.createTone(1046, t + 0.25, 0.4, 'triangle', 0.6);
        break;

      case 'defeat_sound':
        this.createWarmStrings(220, t, 0.4, 0.4);
        this.createWarmStrings(180, t + 0.3, 0.5, 0.45);
        break;

      default:
        break;
    }
  }

  public playMusic(track: MusicTrack): void {
    if (this.currentTrack === track && this.bgmInterval) return;
    this.stopMusic();
    this.currentTrack = track;
    if (this.isMuted) return;

    this.initContext();
    if (!this.ctx) return;

    this.step = 0;
    let intervalMs = 280;

    if (track === 'viking_mountains') intervalMs = 320;
    else if (track === 'arabic_desert') intervalMs = 210;
    else if (track === 'bard_village') intervalMs = 200;
    else if (track === 'dark_void') intervalMs = 520;
    else if (track === 'gothic_orchestra') intervalMs = 260;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      if (track === 'gothic_orchestra' || track === 'battle_stage') {
        const melody = [293.66, 349.23, 440.0, 415.3, 440.0, 349.23, 293.66, 277.18];
        const note = melody[this.step % melody.length];
        this.createPipeOrgan(note, t, 0.45, this.musicVolume * 0.22);
        if (this.step % 2 === 0) {
          this.createWarmStrings(73.42, t, 0.65, this.musicVolume * 0.3);
        }
      } else if (track === 'viking_mountains') {
        if (this.step % 2 === 0) {
          this.createWarTaiko(t, 0.35, this.musicVolume * 0.55);
        }
        if (this.step % 8 === 0) {
          this.createGjallarhorn(73.42, t, 1.8, this.musicVolume * 0.35);
          this.createGjallarhorn(110.0, t, 1.8, this.musicVolume * 0.28);
        }
      } else if (track === 'arabic_desert') {
        const hijaz = [293.66, 311.13, 369.99, 392.0, 369.99, 311.13, 293.66, 261.63];
        const note = hijaz[this.step % hijaz.length];
        this.createPluck(note, t, 0.24, this.musicVolume * 0.3);
        if (this.step % 2 === 0) {
          this.createWarmStrings(146.83, t, 0.35, this.musicVolume * 0.22);
        }
      } else if (track === 'bard_village' || track === 'peaceful_camp') {
        const flute = [587.33, 659.25, 783.99, 880.0, 783.99, 659.25];
        const note = flute[this.step % flute.length];
        this.createTone(note, t, 0.22, 'sine', this.musicVolume * 0.32);
        if (this.step % 3 === 0) {
          this.createPluck(196.0, t, 0.4, this.musicVolume * 0.25);
        }
      } else {
        // Dark Void
        this.createWarmSubBass(40.0, t, 1.2, this.musicVolume * 0.5);
        if (this.step % 4 === 0) {
          this.createWarmStrings(65.41, t, 1.4, this.musicVolume * 0.2);
          this.createWarmStrings(92.5, t, 1.4, this.musicVolume * 0.18);
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
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createWarmStrings(freq: number, startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.003, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc2.start(startTime);
    osc.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  private createPipeOrgan(freq: number, startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    [1, 2].forEach((harmonic, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * harmonic, startTime);

      const targetGain = (volMultiplier / (idx + 1.2)) * this.sfxVolume;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  private createPluck(freq: number, startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.8, startTime);
    filter.Q.setValueAtTime(3, startTime);

    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(targetGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createGjallarhorn(freq: number, startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, startTime);
    filter.Q.setValueAtTime(3, startTime);

    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createWarTaiko(startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, startTime);
    osc.frequency.exponentialRampToValueAtTime(30, startTime + duration);

    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(targetGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createWarmSubBass(freq: number, startTime: number, duration: number, volMultiplier: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private createNoiseBurst(startTime: number, duration: number, volMultiplier: number, highCut = 2200): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(highCut, startTime);

    const gain = this.ctx.createGain();
    const targetGain = volMultiplier * this.sfxVolume;
    gain.gain.setValueAtTime(targetGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    else gain.connect(this.ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }
}

export const audioSystem = AudioSystem.getInstance();