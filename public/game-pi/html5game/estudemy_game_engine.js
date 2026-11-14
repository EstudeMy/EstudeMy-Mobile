/**
 * ESTUDEMY RPG ENGINE - VERSÃO OVERHAUL V2
 * - Cenários exclusivos com 19 backgrounds temáticos integrados
 * - Atores ancorados no chão com sombras de contato (apenas voadores levitam)
 * - 5 Trilhas Sonoras Sintetizadas Autênticas:
 *     1. Castelo: Orquestra Gótica (Órgão de tubos, sino de catedral, escala menor harmônica)
 *     2. Deserto: Orquestra Antiga Árabe (Maqam Hijaz, Oud/Alaúde, percussão Darbuka)
 *     3. Vila: Tema com Bardos (Flauta celta/tin whistle, alaúde folk em 6/8)
 *     4. Vazio: Tema Dark Sombrio Cósmico (Drone sub-grave 42Hz, trítonos, horror cósmico)
 *     5. Montanha: Tema Viking/Nórdico (Tambores de guerra épicos, trompa Gjallarhorn em 5as)
 * - Efeitos Sonoros (SFX): Espadas, Magias/Poderes, Flechas, Pancadas pesadas e Trovão
 * - 3 Heróis Oficiais: Samurai, Guerreiro e Mago (com suas skins e golpes exclusivos)
 * - Integração automática com dados do perfil e da trilha sem botões de debug na tela
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CONFIGURAÇÕES VISUAIS: CENÁRIOS POR TRILHA E FASE
  // ============================================================================
  const THEMES_CONFIG = {
    castelo: {
      name: 'Castelo dos Dados',
      trackLabel: 'TRILHA: CASTELO DOS DADOS',
      defaultBoss: 'spectre',
      musicKey: 'gothic_orchestra',
      bottomOffset: '14%',
      sideOffset: '18%',
      phases: [
        { id: 1, name: 'Muralha e Portão dos Algoritmos', bgImg: 'assets/backgrounds/castelo_fase1_portao.jpg', weather: 'embers' },
        { id: 2, name: 'Grande Salão dos Dados', bgImg: 'assets/backgrounds/castelo_fase2_salao.jpg', weather: 'embers' },
        { id: 3, name: 'Catacumbas da Memória RAM', bgImg: 'assets/backgrounds/castelo_fase3_masmorra.jpg', weather: 'embers' },
        { id: 4, name: 'Torre do Trono do Spectre', bgImg: 'assets/backgrounds/castelo_fase4_trono.jpg', weather: 'embers' },
      ],
    },
    montanha: {
      name: 'Pico da Lógica',
      trackLabel: 'TRILHA: PICO DA LÓGICA',
      defaultBoss: 'mago',
      musicKey: 'viking_mountains',
      bottomOffset: '17%',
      sideOffset: '21%',
      phases: [
        { id: 1, name: 'Encosta Nevada dos Vetores', bgImg: 'assets/backgrounds/montanha_fase1_encosta.jpg', weather: 'snow' },
        { id: 2, name: 'Desfiladeiro da Gravidade', bgImg: 'assets/backgrounds/montanha_fase2_desfiladeiro.jpg', weather: 'snow' },
        { id: 3, name: 'Caverna dos Cristais Lógicos', bgImg: 'assets/backgrounds/montanha_fase3_caverna.jpg', weather: 'snow' },
        { id: 4, name: 'Pico Cósmico da Lógica', bgImg: 'assets/backgrounds/montanha_fase4_pico.jpg', weather: 'snow' },
      ],
    },
    deserto: {
      name: 'Deserto Primordial',
      trackLabel: 'TRILHA: DESERTO PRIMORDIAL',
      defaultBoss: 'spectre',
      musicKey: 'arabic_desert',
      bottomOffset: '14%',
      sideOffset: '18%',
      phases: [
        { id: 1, name: 'Dunas Escaldantes da Erosão', bgImg: 'assets/backgrounds/deserto_fase1_dunas.jpg', weather: 'sand' },
        { id: 2, name: 'Oásis dos Fósseis Antigos', bgImg: 'assets/backgrounds/deserto_fase2_oasis.jpg', weather: 'sand' },
        { id: 3, name: 'Templo Solar do Arenito', bgImg: 'assets/backgrounds/deserto_fase3_ruinas.jpg', weather: 'sand' },
        { id: 4, name: 'Cratera da Tempestade Solar', bgImg: 'assets/backgrounds/deserto_fase4_cratera.jpg', weather: 'sand' },
      ],
    },
    vila: {
      name: 'Vila Ancestral',
      trackLabel: 'TRILHA: VILA ANCESTRAL',
      defaultBoss: 'cavaleiro',
      musicKey: 'bard_village',
      bottomOffset: '14%',
      sideOffset: '18%',
      phases: [
        { id: 1, name: 'Praça do Mercado das Crônicas', bgImg: 'assets/backgrounds/vila_fase1_mercado.jpg', weather: 'leaves' },
        { id: 2, name: 'Grande Arquivo e Biblioteca Arcana', bgImg: 'assets/backgrounds/vila_fase2_biblioteca.jpg', weather: 'leaves' },
        { id: 3, name: 'Cripta dos Filósofos', bgImg: 'assets/backgrounds/vila_fase3_cripta.jpg', weather: 'leaves' },
        { id: 4, name: 'Campanário do Cavaleiro', bgImg: 'assets/backgrounds/vila_fase4_campanario.jpg', weather: 'leaves' },
      ],
    },
    vazio_cosmico: {
      name: 'Vazio Cósmico',
      trackLabel: 'TRILHA: VAZIO CÓSMICO',
      defaultBoss: 'chefe_final',
      musicKey: 'dark_void',
      bottomOffset: '15%',
      sideOffset: '18%',
      phases: [
        { id: 1, name: 'Fragmentos dos Tomos Perdidos', bgImg: 'assets/backgrounds/vazio_fase1_fragmentos.jpg', weather: 'cosmic' },
        { id: 2, name: 'Nebulosa da Entropia Cósmica', bgImg: 'assets/backgrounds/vazio_fase2_nebulosa.jpg', weather: 'cosmic' },
        { id: 3, name: 'Singularidade do Infinito', bgImg: 'assets/backgrounds/vazio_fase3_singularidade.jpg', weather: 'cosmic' },
      ],
    },
  };

  // 3 Heróis Oficiais de EstudeMy (Samurai, Guerreiro e Mago)
  const CHARACTERS_CONFIG = {
    samurai: {
      name: 'Kaito',
      spriteFolder: 'assets/sprites/samurai',
      attackSound: 'sword_slash',
      clashSound: 'sword_clash',
      skins: [
        { id: 'samurai_ronin', name: 'Kaito Ronin', shortName: 'Ronin', cssClass: '', ultName: 'Dança das Mil Lâminas' },
        { id: 'samurai_cyber_void', name: 'Kaito Cyber-Void', shortName: 'Cyber-Void', cssClass: 'skin-cyber-void', ultName: 'Julgamento Omnislash' },
      ],
    },
    guerreiro: {
      name: 'Boran',
      spriteFolder: 'assets/sprites/cavaleiro',
      attackSound: 'heavy_impact',
      clashSound: 'shield_block',
      skins: [
        { id: 'guerreiro_templario', name: 'Boran da Ordem', shortName: 'Ordem', cssClass: '', ultName: 'Investida Sagrada' },
        { id: 'guerreiro_berserker_lava', name: 'Boran Vulcânico', shortName: 'Vulcânico', cssClass: 'skin-berserker-lava', ultName: 'Erupção Titânica' },
      ],
    },
    mago: {
      name: 'Valerius',
      spriteFolder: 'assets/sprites/mago',
      attackSound: 'magic_cast',
      clashSound: 'magic_impact',
      skins: [
        { id: 'mago_arcanista', name: 'Valerius Arcano', shortName: 'Arcano', cssClass: '', ultName: 'Meteoro Cósmico' },
        { id: 'mago_necromante_espectral', name: 'Valerius das Sombras', shortName: 'Sombras', cssClass: 'skin-necromante', ultName: 'Apocalipse das Almas' },
      ],
    },
  };

  const BOSSES_CONFIG = {
    spectre: {
      name: 'Spectre do Código',
      spriteFolder: 'assets/sprites/spectre',
      isFlying: true, // Único que flutua no ar
      attackSound: 'magic_cast',
      phases: [
        { name: 'Manifestação Ectoplasmática', hpMax: 100, barColor: '#38bdf8', atk: 18 },
      ],
    },
    cavaleiro: {
      name: 'Cavaleiro Decaído',
      spriteFolder: 'assets/sprites/cavaleiro',
      isFlying: false, // Pés firmemente no chão
      attackSound: 'heavy_impact',
      phases: [
        { name: 'Fase I: Postura Implacável', hpMax: 120, barColor: '#3b82f6', atk: 20 },
        { name: 'Fase II: Fúria da Armadura Quebrada', hpMax: 150, barColor: '#ef4444', atk: 30 },
      ],
    },
    mago: {
      name: 'Mago Corrompido',
      spriteFolder: 'assets/sprites/mago',
      isFlying: false, // Pés firmemente no chão
      attackSound: 'magic_cast',
      phases: [
        { name: 'Fase I: Ilusão de Fórmulas', hpMax: 110, barColor: '#a855f7', atk: 22 },
        { name: 'Fase II: Tempestade de Caos', hpMax: 160, barColor: '#d946ef', atk: 34 },
      ],
    },
    chefe_final: {
      name: 'O Arquivista do Vazio',
      spriteFolder: 'assets/sprites/mago',
      isFlying: false, // Pés firmemente no chão
      attackSound: 'thunder_ultimate',
      phases: [
        { name: 'Fase I: Tomos Apagados', hpMax: 140, barColor: '#8b5cf6', atk: 24 },
        { name: 'Fase II: Fúria da Entropia', hpMax: 180, barColor: '#ef4444', atk: 36 },
        { name: 'Fase III: Singularidade Primordial', hpMax: 220, barColor: '#eab308', atk: 48 },
      ],
    },
  };

  // ============================================================================
  // 2. SISTEMA DE TRILHA SONORA TEMÁTICA & SFX PROCEDURAL COMPLETO
  // ============================================================================
  class SynthesizedSoundtrack {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.timer = null;
      this.currentTrack = 'gothic_orchestra';
      this.step = 0;
    }

    init() {
      if (this.ctx && this.ctx.state === 'running') return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
        }
      } catch (e) {}
    }

    start(track = 'gothic_orchestra') {
      this.init();
      this.stop();
      this.currentTrack = track;
      if (this.isMuted || !this.ctx) return;

      this.step = 0;

      // Tempos e intervalos por gênero musical
      let intervalMs = 240;
      if (track === 'viking_mountains') intervalMs = 260; // Marcha viking pesada
      else if (track === 'arabic_desert') intervalMs = 175; // Ritmo sincopado árabe
      else if (track === 'bard_village') intervalMs = 160; // Giga celta viva em 6/8
      else if (track === 'dark_void') intervalMs = 420; // Drone atmosférico lento
      else if (track === 'gothic_orchestra') intervalMs = 220; // Fuga barroca gótica

      this.timer = setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;

        switch (this.currentTrack) {
          case 'gothic_orchestra':
            this.tickGothicCastle(t, this.step);
            break;
          case 'arabic_desert':
            this.tickArabicDesert(t, this.step);
            break;
          case 'bard_village':
            this.tickBardVillage(t, this.step);
            break;
          case 'dark_void':
            this.tickDarkVoid(t, this.step);
            break;
          case 'viking_mountains':
            this.tickVikingMountain(t, this.step);
            break;
          default:
            this.tickGothicCastle(t, this.step);
            break;
        }

        this.step++;
      }, intervalMs);
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    toggle() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stop();
      } else {
        this.start(this.currentTrack);
      }
      return !this.isMuted;
    }

    // --------------------------------------------------------------------------
    // 1. CASTELO: Orquestra Gótica (Pipe Organ, Sino de Catedral, Ré Menor Harmônico)
    // --------------------------------------------------------------------------
    tickGothicCastle(t, step) {
      // Escala: Ré Menor Harmônico (D, E, F, G, A, Bb, C#)
      const organMelody = [
        293.66, 349.23, 440.0, 415.3, 440.0, 349.23, 293.66, 277.18,
        293.66, 369.99, 440.0, 554.37, 440.0, 349.23, 293.66, 220.0,
      ];
      const celloBass = [73.42, 73.42, 87.31, 87.31, 69.3, 69.3, 73.42, 73.42];

      const note = organMelody[step % organMelody.length];
      const bass = celloBass[Math.floor(step / 2) % celloBass.length];

      // Órgão de Tubos (Voz Dupla: Square filtrado + Sine com leve vibrato)
      this.playPipeOrgan(note, t, 0.28, 0.14);

      // Cello no contrabaixo
      if (step % 2 === 0) {
        this.playTone(bass, t, 0.38, 'sawtooth', 0.18, 500);
      }

      // Sino gótico solene a cada 16 compassos
      if (step % 16 === 0) {
        this.playCathedralBell(146.83, t, 2.2, 0.25);
      }
    }

    // --------------------------------------------------------------------------
    // 2. DESERTO: Orquestra Antiga Árabe (Maqam Hijaz, Alaúde/Oud, Darbuka)
    // --------------------------------------------------------------------------
    tickArabicDesert(t, step) {
      // Escala Maqam Hijaz (D, Eb, F#, G, A, Bb, C)
      const hijazOud = [
        293.66, 311.13, 369.99, 392.0, 369.99, 311.13, 293.66, 261.63,
        233.08, 220.0, 233.08, 293.66, 311.13, 369.99, 440.0, 369.99,
      ];

      const note = hijazOud[step % hijazOud.length];

      // Alaúde / Oud Árabe (Ataque rápido de corda dedilhada com ressonância)
      this.playPluckedString(note, t, 0.16, 0.22);

      // Drone místico de fundo
      if (step % 8 === 0) {
        this.playTone(146.83, t, 1.2, 'triangle', 0.12);
      }

      // Percussão Darbuka / Doumbek (Dum-Tek-Tek-Dum-Tek)
      const drumPattern = [1, 0, 2, 0, 2, 1, 0, 2]; // 1 = Dum (grave), 2 = Tek (estalo agudo)
      const hit = drumPattern[step % drumPattern.length];
      if (hit === 1) {
        this.playDarbukaDum(t, 0.14, 0.28);
      } else if (hit === 2) {
        this.playDarbukaTek(t, 0.06, 0.18);
      }
    }

    // --------------------------------------------------------------------------
    // 3. VILA: Tema com Bardos (Flauta Celta / Tin Whistle, Alaúde em 6/8)
    // --------------------------------------------------------------------------
    tickBardVillage(t, step) {
      // Melodia de Flauta Celta / Tin Whistle (Alegre e dançante)
      const fluteMelody = [
        587.33, 659.25, 783.99, 880.0, 783.99, 659.25,
        587.33, 493.88, 523.25, 587.33, 659.25, 493.88,
      ];
      const luteChords = [146.83, 196.0, 220.0, 164.81];

      const note = fluteMelody[step % fluteMelody.length];
      const chordRoot = luteChords[Math.floor(step / 6) % luteChords.length];

      // Flauta do Bardo (Onda Senoidal pura com sopro leve)
      this.playFluteNote(note, t, 0.14, 0.18);

      // Dedilhado do Alaúde em 6/8
      if (step % 3 === 0) {
        this.playTone(chordRoot, t, 0.25, 'triangle', 0.16);
      } else if (step % 3 === 1) {
        this.playTone(chordRoot * 1.5, t, 0.18, 'sine', 0.12);
      }

      // Pandeiro / Percussão de Taberna
      if (step % 3 === 2) {
        this.playTambourine(t, 0.05, 0.09);
      }
    }

    // --------------------------------------------------------------------------
    // 4. VAZIO CÓSMICO: Tema Mais Dark Sombrio (Sub-Bass 42Hz, Trítonos, Horror Cósmico)
    // --------------------------------------------------------------------------
    tickDarkVoid(t, step) {
      // Sub-Bass 42Hz pulsante contínuo
      this.playTone(42.0, t, 0.8, 'sine', 0.35);

      // Acordes dissonantes de Trítono Cósmico (Tensão Infinita)
      const cosmicPads = [
        [65.41, 92.5],   // C2 e F#2 (Trítono do Vazio)
        [61.74, 87.31],  // B1 e F2
        [73.42, 103.83], // D2 e G#2
        [58.27, 82.41],  // Bb1 e E2
      ];

      const pad = cosmicPads[Math.floor(step / 2) % cosmicPads.length];
      if (step % 2 === 0) {
        this.playTone(pad[0], t, 0.9, 'sawtooth', 0.12, 380);
        this.playTone(pad[1], t, 0.9, 'triangle', 0.14, 450);
      }

      // Ecos cósmicos brilhantes esparsos
      if (step % 4 === 1) {
        const shimmer = 880 + Math.random() * 400;
        this.playTone(shimmer, t, 0.35, 'sine', 0.05);
      }
    }

    // --------------------------------------------------------------------------
    // 5. MONTANHA: Tema Mais Viking / Nórdico (Tambores de Guerra, Gjallarhorn)
    // --------------------------------------------------------------------------
    tickVikingMountain(t, step) {
      // Percussão tribal de tambores de guerra pesados (Taiko / Shamanic Drum)
      // Ritmo Nórdico: DUM... DUM-DUM... DUM
      const drumPattern = [1, 0, 1, 1, 0, 1, 0, 0];
      if (drumPattern[step % drumPattern.length] === 1) {
        this.playWarDrum(t, 0.22, 0.42);
      }

      // Trompa Nórdica / Gjallarhorn (Quintas Abertas D2 + A2 em Sawtooth filtrado)
      if (step % 8 === 0) {
        this.playGjallarhorn(73.42, t, 1.4, 0.28);
        this.playGjallarhorn(110.0, t, 1.4, 0.22);
      } else if (step % 8 === 4) {
        this.playGjallarhorn(82.41, t, 1.2, 0.26);
        this.playGjallarhorn(123.47, t, 1.2, 0.2);
      }

      // Lyra / Tagelharpa rítmica
      if (step % 2 === 1) {
        this.playTone(146.83, t, 0.15, 'sawtooth', 0.08, 600);
      }
    }

    // --------------------------------------------------------------------------
    // SÍNTESE DE INSTRUMENTOS
    // --------------------------------------------------------------------------
    playTone(freq, time, duration, type, vol, filterFreq = null) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      if (filterFreq) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, time);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    }

    playPipeOrgan(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      // Voz 1: Square com filtro quente
      this.playTone(freq, time, duration, 'square', vol * 0.65, 1200);
      // Voz 2: Senoide de oitava para corpo harmônico
      this.playTone(freq * 2, time, duration, 'sine', vol * 0.5);
    }

    playCathedralBell(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      this.playTone(freq, time, duration, 'sine', vol);
      this.playTone(freq * 2.76, time, duration * 0.7, 'triangle', vol * 0.4);
      this.playTone(freq * 5.4, time, duration * 0.4, 'sine', vol * 0.2);
    }

    playPluckedString(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2.5, time);
      filter.Q.setValueAtTime(3, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    playFluteNote(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      this.playTone(freq, time, duration, 'sine', vol);
      // Leve sopro harmônico
      this.playTone(freq * 2, time, duration * 0.8, 'triangle', vol * 0.25);
    }

    playWarDrum(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + duration);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    playGjallarhorn(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.Q.setValueAtTime(4, time);

      // Envelope com ataque majestoso tipo trompa
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    playDarbukaDum(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(170, time);
      osc.frequency.exponentialRampToValueAtTime(65, time + duration);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    }

    playDarbukaTek(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      this.playTone(850, time, duration, 'triangle', vol, 1400);
    }

    playTambourine(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + duration);
    }

    // --------------------------------------------------------------------------
    // EFEITOS SONOROS (SFX) PROCEDURAIS: ESPADAS, MAGIAS, FLECHAS, PANCADAS
    // --------------------------------------------------------------------------
    playSFX(name) {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;

      switch (name) {
        // Sons de Espada e Lâmina
        case 'sword_slash':
        case 'slash':
          this.playTone(480, t, 0.08, 'sawtooth', 0.35);
          this.playTone(220, t + 0.03, 0.12, 'sawtooth', 0.4);
          this.playNoiseBurst(t, 0.08, 0.25, 2000);
          break;

        case 'sword_clash':
          this.playTone(1200, t, 0.15, 'square', 0.35);
          this.playTone(800, t + 0.02, 0.2, 'sawtooth', 0.3);
          this.playTone(300, t, 0.18, 'triangle', 0.45);
          break;

        // Sons de Magias e Poderes Arcanos
        case 'magic_cast':
          this.playTone(440, t, 0.12, 'sine', 0.3);
          this.playTone(659, t + 0.05, 0.15, 'sine', 0.35);
          this.playTone(880, t + 0.1, 0.22, 'triangle', 0.4);
          this.playTone(1320, t + 0.14, 0.25, 'sine', 0.3);
          break;

        case 'magic_impact':
          this.playTone(160, t, 0.25, 'sawtooth', 0.5, 450);
          this.playTone(880, t + 0.02, 0.2, 'square', 0.3);
          this.playNoiseBurst(t + 0.04, 0.16, 0.4, 800);
          break;

        // Sons de Flecha
        case 'arrow_whoosh':
          this.playNoiseBurst(t, 0.12, 0.28, 3000);
          this.playTone(600, t, 0.1, 'triangle', 0.2);
          break;

        case 'arrow_hit':
          this.playTone(320, t, 0.08, 'sawtooth', 0.35);
          this.playTone(180, t + 0.02, 0.12, 'triangle', 0.4);
          break;

        // Pancadas Pesadas e Impactos Contundentes
        case 'heavy_impact':
        case 'hit':
          this.playWarDrum(t, 0.2, 0.6);
          this.playTone(110, t, 0.2, 'sawtooth', 0.45);
          this.playNoiseBurst(t, 0.12, 0.35, 1200);
          break;

        case 'shield_block':
          this.playTone(320, t, 0.12, 'square', 0.4);
          this.playTone(180, t + 0.04, 0.2, 'triangle', 0.45);
          break;

        // Trovão e Ultimate
        case 'thunder_ultimate':
          this.playNoiseBurst(t, 0.4, 0.65, 800);
          this.playTone(85, t, 0.5, 'sawtooth', 0.65);
          this.playWarDrum(t + 0.08, 0.4, 0.7);
          break;

        case 'crit':
          this.playTone(980, t, 0.22, 'square', 0.45);
          this.playTone(140, t + 0.02, 0.26, 'sawtooth', 0.55);
          this.playNoiseBurst(t, 0.15, 0.4, 1500);
          break;

        // QTEs
        case 'qte_alert':
          this.playTone(740, t, 0.08, 'square', 0.4);
          this.playTone(1100, t + 0.07, 0.14, 'square', 0.45);
          break;

        case 'qte_success':
          this.playTone(523, t, 0.08, 'sine', 0.35);
          this.playTone(659, t + 0.08, 0.08, 'sine', 0.35);
          this.playTone(1046, t + 0.16, 0.25, 'triangle', 0.5);
          break;

        case 'qte_fail':
          this.playTone(220, t, 0.15, 'sawtooth', 0.4);
          this.playTone(150, t + 0.12, 0.24, 'sawtooth', 0.45);
          break;

        // Pedagógicos
        case 'correct':
          this.playTone(440, t, 0.09, 'sine', 0.35);
          this.playTone(659, t + 0.08, 0.2, 'sine', 0.45);
          break;

        case 'wrong':
          this.playTone(200, t, 0.18, 'sawtooth', 0.4);
          this.playTone(150, t + 0.12, 0.24, 'sawtooth', 0.45);
          break;

        case 'victory':
          this.playTone(523, t, 0.12, 'triangle', 0.45);
          this.playTone(659, t + 0.12, 0.12, 'triangle', 0.45);
          this.playTone(783, t + 0.24, 0.38, 'triangle', 0.6);
          break;

        default:
          this.playTone(440, t, 0.1, 'sine', 0.2);
          break;
      }
    }

    playNoiseBurst(time, duration, vol, highCut = 2000) {
      if (!this.ctx || this.isMuted) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(highCut, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + duration);
    }
  }

  // ============================================================================
  // 3. MOTOR PRINCIPAL DE BATALHA RPG (OVERHAUL V2)
  // ============================================================================
  class EstudeMyOverhaulGame {
    constructor() {
      this.soundtrack = new SynthesizedSoundtrack();
      this.fxCanvas = document.getElementById('fx-canvas');
      this.fxCtx = this.fxCanvas.getContext('2d');

      // Elementos do DOM
      this.bgLayer = document.getElementById('bg-layer');
      this.playerSprite = document.getElementById('player-sprite');
      this.bossSprite = document.getElementById('boss-sprite');
      this.playerWrapper = document.getElementById('player-wrapper');
      this.bossWrapper = document.getElementById('boss-wrapper');
      this.playerNameplate = document.getElementById('player-nameplate');
      this.bossNameplate = document.getElementById('boss-nameplate');

      // Top Bar Elements
      this.missionTrackText = document.getElementById('mission-track-text');
      this.missionPhaseText = document.getElementById('mission-phase-text');
      this.audioUnlockOverlay = document.getElementById('audio-unlock-overlay');
      this.bossTitleText = document.getElementById('boss-title-text');
      this.bossPhaseText = document.getElementById('boss-phase-text');
      this.bossBarFill = document.getElementById('boss-bar-fill');
      this.bossHpText = document.getElementById('boss-hp-text');

      // In-Game Action Buttons
      this.btnSkinToggle = document.getElementById('btn-skin-toggle');
      this.skinBtnText = document.getElementById('skin-btn-text');
      this.btnAudioToggle = document.getElementById('btn-audio-toggle');
      this.audioBtnIcon = document.getElementById('audio-btn-icon');
      this.audioBtnText = document.getElementById('audio-btn-text');

      // Player HUD
      this.playerHpFill = document.getElementById('player-hp-fill');
      this.playerHpNum = document.getElementById('player-hp-num');
      this.playerUltFill = document.getElementById('player-ult-fill');
      this.playerUltNum = document.getElementById('player-ult-num');
      this.btnUltimate = document.getElementById('btn-ultimate');

      // Quiz Elements
      this.questionTitle = document.getElementById('question-title');
      this.pedagogicalFeedback = document.getElementById('pedagogical-feedback');
      this.altTexts = [
        document.getElementById('alt-text-0'),
        document.getElementById('alt-text-1'),
        document.getElementById('alt-text-2'),
        document.getElementById('alt-text-3'),
      ];

      // QTE Elements
      this.qteModal = document.getElementById('qte-modal');
      this.qtePromptLabel = document.getElementById('qte-prompt-label');
      this.qteKeysContainer = document.getElementById('qte-keys-container');
      this.qteTimerFill = document.getElementById('qte-timer-fill');

      // Estados de Jogo
      this.gameMode = 'campanha';
      this.activeTheme = 'castelo';
      this.currentThemePhase = 0;
      this.selectedCharKey = 'samurai';
      this.selectedSkinIndex = 0;
      this.selectedBossKey = 'spectre';
      this.currentPhaseIndex = 0;

      // Pontos de Combate
      this.playerHp = 100;
      this.playerMaxHp = 100;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.streak = 0;
      this.bossHp = 100;
      this.bossMaxHp = 100;

      // QTE State
      this.qteActive = false;
      this.qteKeys = [];
      this.qteCurrentKeyIdx = 0;
      this.qteDuration = 2400;
      this.qteTimeRemaining = 0;
      this.qteTimerInterval = null;
      this.qteCallback = null;

      // Perguntas
      this.questions = [];
      this.currentQuestionIdx = 0;

      // Partículas e Números Flutuantes
      this.floatingTexts = [];
      this.particles = [];

      this.initEvents();
      this.loadGameData();
      this.startFxLoop();
    }

    initEvents() {
      // Inicia áudio na primeira interação do usuário
      const unlockAudio = () => {
        this.soundtrack.init();
        if (!this.soundtrack.timer && !this.soundtrack.isMuted) {
          const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
          this.soundtrack.start(theme.musicKey);
        }
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });

      // Teclado
      window.addEventListener('keydown', (e) => {
        if (this.qteActive) {
          const key = e.code === 'Space' ? 'SPACE' : e.key.toUpperCase();
          this.handleQTEKey(key);
          return;
        }

        if (e.code === 'Space' && this.isUltReady) {
          this.triggerUltimate();
          return;
        }

        if (['1', '2', '3', '4'].includes(e.key)) {
          this.submitAnswer(parseInt(e.key, 10) - 1);
        }
      });
    }

    loadGameData() {
      let raw = null;
      if (typeof window.obter_dados_fase_js === 'function') {
        try {
          const s = window.obter_dados_fase_js();
          if (s) raw = JSON.parse(s);
        } catch (e) {}
      }
      if (!raw && window.gameData) {
        raw = window.gameData;
      }

      // Herói Selecionado (Perfil do Usuário) - Somente Samurai, Guerreiro ou Mago
      const char = (raw?.personagem_selecionado || 'samurai').toLowerCase();
      if (char.includes('guerreiro') || char.includes('cavaleiro') || char.includes('boran')) {
        this.selectedCharKey = 'guerreiro';
      } else if (char.includes('mago') || char.includes('valerius')) {
        this.selectedCharKey = 'mago';
      } else {
        this.selectedCharKey = 'samurai';
      }

      // Trilha / Cenário selecionado na trilha de aprendizado
      const cenario = (raw?.cenario || raw?.trilha || 'castelo').toLowerCase();
      if (cenario.includes('montanha') || cenario.includes('pico')) this.activeTheme = 'montanha';
      else if (cenario.includes('deserto') || cenario.includes('dunas')) this.activeTheme = 'deserto';
      else if (cenario.includes('vila') || cenario.includes('mercado')) this.activeTheme = 'vila';
      else if (cenario.includes('vazio') || cenario.includes('final') || cenario.includes('singularidade')) this.activeTheme = 'vazio_cosmico';
      else this.activeTheme = 'castelo';

      // Modo de Jogo selecionado na Trilha
      if (raw?.modo) {
        this.gameMode = raw.modo;
      }

      // Perguntas pedagógicas
      this.questions = raw?.perguntas && raw.perguntas.length > 0 ? raw.perguntas : [
        {
          enunciado: 'Qual a principal vantagem da computação em nuvem?',
          alternativas: ['Escalabilidade sob demanda', 'Custo fixo alto', 'Perda de controle', 'Necessidade de servidor físico local'],
          respostaCorreta: 'Escalabilidade sob demanda',
          indiceRespostaCorreta: 0,
          explicacao: 'A nuvem permite provisionar e desprovisionar recursos conforme a necessidade real.',
        },
        {
          enunciado: 'O que caracteriza um banco de dados relacional (SQL)?',
          alternativas: ['Tabelas com chaves primárias e relacionamentos', 'Documentos JSON livres', 'Chaves e valores sem esquema', 'Grafos não estruturados'],
          respostaCorreta: 'Tabelas com chaves primárias e relacionamentos',
          indiceRespostaCorreta: 0,
          explicacao: 'Bancos relacionais utilizam tabelas estruturadas com integridade referencial.',
        },
        {
          enunciado: 'Em arquitetura de microsserviços, qual a função de um API Gateway?',
          alternativas: ['Roteamento e segurança centralizados', 'Armazenar o banco de dados principal', 'Substituir a rede física', 'Eliminar requisições HTTP'],
          respostaCorreta: 'Roteamento e segurança centralizados',
          indiceRespostaCorreta: 0,
          explicacao: 'O Gateway unifica autenticação, rate limiting e roteamento para múltiplos serviços.',
        },
      ];

      // Determina a fase inicial do cenário
      let initialPhase = 0;
      if (typeof raw?.ordem === 'number' && raw.ordem >= 1) {
        initialPhase = Math.max(0, (raw.ordem - 1) % 4);
      }

      this.applyTheme(this.activeTheme, initialPhase);
      this.applySkin();
      this.renderQuestion();
    }

    unlockAudioUserAction() {
      this.soundtrack.init();
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      this.soundtrack.start(theme.musicKey);
      if (this.audioUnlockOverlay) {
        this.audioUnlockOverlay.style.display = 'none';
      }
      if (this.audioBtnIcon && this.audioBtnText) {
        this.audioBtnIcon.textContent = '🔊';
        this.audioBtnText.textContent = 'Som: ON';
      }
      this.addFloatingText('ÁUDIO HABILITADO!', '#22c55e', 683, 220);
    }

    setPhase(phaseIdx) {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const maxPhases = theme.phases ? theme.phases.length : 1;
      const safeIdx = Math.max(0, Math.min(phaseIdx, maxPhases - 1));
      this.currentThemePhase = safeIdx;
      const phase = theme.phases ? theme.phases[safeIdx] : { name: theme.name, bgImg: theme.bgImg };

      // Transição suave de cenário com fade
      this.bgLayer.style.opacity = '0.35';
      setTimeout(() => {
        this.bgLayer.src = phase.bgImg;
        this.bgLayer.style.opacity = '1';
      }, 100);

      // Atualiza o Mission Badge
      if (this.missionTrackText) {
        this.missionTrackText.textContent = theme.trackLabel;
      }
      if (this.missionPhaseText) {
        this.missionPhaseText.textContent = `${phase.name} — Fase ${safeIdx + 1}/${maxPhases}`;
      }

      // Aplica posicionamento de chão conforme o cenário
      this.applyGroundingPositions();

      this.addFloatingText(`CENÁRIO: ${phase.name}!`, '#38bdf8', 683, 220);
    }

    applyGroundingPositions() {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const bottom = theme.bottomOffset || '14%';
      const side = theme.sideOffset || '18%';

      // Posiciona herói e chefe com pés firmemente plantados no platô do mapa
      this.playerWrapper.style.bottom = bottom;
      this.playerWrapper.style.left = side;

      this.bossWrapper.style.bottom = bottom;
      this.bossWrapper.style.right = side;

      // Animação de voo apenas para chefes voadores (Spectre)
      const boss = BOSSES_CONFIG[this.selectedBossKey];
      if (boss && boss.isFlying) {
        this.bossWrapper.classList.add('is-flying');
      } else {
        this.bossWrapper.classList.remove('is-flying');
      }

      // O herói NUNCA flutua; pés sempre no chão
      this.playerWrapper.classList.remove('is-flying');
    }

    applyTheme(themeKey, phaseIndex = 0) {
      this.activeTheme = themeKey;
      const theme = THEMES_CONFIG[themeKey] || THEMES_CONFIG.castelo;

      // Define o Boss temático da trilha
      this.selectedBossKey = theme.defaultBoss;
      this.setupBoss(this.selectedBossKey);

      // Aplica a fase solicitada
      this.setPhase(phaseIndex);

      // Inicia a música autêntica da trilha
      if (this.soundtrack.ctx && !this.soundtrack.isMuted) {
        this.soundtrack.start(theme.musicKey);
      }
    }

    setupBoss(bossKey) {
      this.selectedBossKey = bossKey;
      const boss = BOSSES_CONFIG[bossKey] || BOSSES_CONFIG.spectre;
      this.currentPhaseIndex = 0;
      this.setupBossPhase(0);
    }

    setupBossPhase(idx) {
      const boss = BOSSES_CONFIG[this.selectedBossKey];
      const phase = boss.phases[idx];

      this.currentPhaseIndex = idx;
      this.bossHp = phase.hpMax;
      this.bossMaxHp = phase.hpMax;

      this.bossSprite.src = `${boss.spriteFolder}/idle.gif`;
      this.bossNameplate.textContent = boss.name;
      this.bossTitleText.textContent = `👑 ${boss.name.toUpperCase()} — ${phase.name}`;
      this.bossPhaseText.textContent = `FASE ${idx + 1}/${boss.phases.length}`;
      this.bossBarFill.style.backgroundColor = phase.barColor;

      // Aplica voo se voador
      if (boss.isFlying) {
        this.bossWrapper.classList.add('is-flying');
      } else {
        this.bossWrapper.classList.remove('is-flying');
      }

      this.updateHUD();
      this.addFloatingText(`FASE ${idx + 1}: ${phase.name}!`, phase.barColor, 1020, 300);
    }

    cycleSkin() {
      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      this.selectedSkinIndex = (this.selectedSkinIndex + 1) % char.skins.length;
      this.applySkin();
      this.soundtrack.playSFX(char.attackSound || 'sword_slash');
    }

    applySkin() {
      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      const skin = char.skins[this.selectedSkinIndex];

      // Remove classes antigas de skins e aplica a nova
      this.playerSprite.className = `actor-sprite ${skin.cssClass}`;
      this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
      this.playerNameplate.textContent = skin.name;

      if (this.skinBtnText) {
        this.skinBtnText.textContent = `Skin: ${skin.shortName}`;
      }

      this.addFloatingText(`SKIN: ${skin.name}!`, '#38bdf8', 340, 300);
    }

    toggleAudio() {
      const isPlaying = this.soundtrack.toggle();
      if (this.audioBtnIcon && this.audioBtnText) {
        this.audioBtnIcon.textContent = isPlaying ? '🔊' : '🔇';
        this.audioBtnText.textContent = isPlaying ? 'Som: ON' : 'Som: OFF';
      }
    }

    renderQuestion() {
      const q = this.questions[this.currentQuestionIdx % this.questions.length];
      if (!q) return;

      this.questionTitle.textContent = q.enunciado;
      q.alternativas.forEach((alt, i) => {
        if (this.altTexts[i]) {
          this.altTexts[i].textContent = alt;
        }
      });
    }

    submitAnswer(idx) {
      if (this.qteActive) return;
      const q = this.questions[this.currentQuestionIdx % this.questions.length];
      if (!q) return;

      const isCorrect = idx === q.indiceRespostaCorreta;
      const char = CHARACTERS_CONFIG[this.selectedCharKey];

      if (isCorrect) {
        this.soundtrack.playSFX('correct');
        this.streak++;
        this.chargeUltimate(25);

        // A cada 2 acertos, avança o cenário para a próxima fase da trilha
        if (this.streak > 0 && this.streak % 2 === 0) {
          const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
          const nextPhase = (this.currentThemePhase + 1) % theme.phases.length;
          this.setPhase(nextPhase);
        }

        // Toca SFX autêntico do herói
        setTimeout(() => {
          this.soundtrack.playSFX(char.attackSound);
        }, 120);

        // Animação de Golpe do Herói (Avanço rápido + Attack GIF)
        this.playerSprite.src = `${char.spriteFolder}/attack1.gif`;
        this.playerWrapper.style.transform = 'translateX(55px)';

        setTimeout(() => {
          this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
          this.playerWrapper.style.transform = 'translateX(0)';
        }, 450);

        // Chance de QTE em sequência de acertos
        if (this.streak >= 2) {
          this.triggerQTE(['A', 'D', 'SPACE'], 'COMBO CRÍTICO! [A] -> [D] -> [ESPAÇO]!', (success) => {
            const mult = success ? 2.5 : 1.0;
            this.damageBoss(Math.round(28 * mult), success);
          });
        } else {
          this.damageBoss(28, false);
        }

        this.showFeedback('Excelente! Resposta correta e golpe desferido!', '#22c55e');
      } else {
        this.soundtrack.playSFX('wrong');
        this.streak = 0;

        // Contra-Ataque do Boss
        const boss = BOSSES_CONFIG[this.selectedBossKey];
        setTimeout(() => {
          this.soundtrack.playSFX(boss.attackSound || 'heavy_impact');
        }, 120);

        this.bossSprite.src = `${boss.spriteFolder}/attack1.gif`;
        this.bossWrapper.style.transform = 'translateX(-55px)';

        setTimeout(() => {
          this.bossSprite.src = `${boss.spriteFolder}/idle.gif`;
          this.bossWrapper.style.transform = 'translateX(0)';
        }, 450);

        const phase = boss.phases[this.currentPhaseIndex];
        this.damagePlayer(phase.atk);
        this.showFeedback(`Incorreto! Dica: ${q.explicacao || 'Revise o conteúdo desta etapa.'}`, '#ef4444');
      }

      this.currentQuestionIdx++;
      this.renderQuestion();
    }

    showFeedback(text, color) {
      this.pedagogicalFeedback.textContent = text;
      this.pedagogicalFeedback.style.color = color;
      this.pedagogicalFeedback.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
      this.pedagogicalFeedback.style.border = `1px solid ${color}`;
      this.pedagogicalFeedback.style.display = 'block';

      setTimeout(() => {
        this.pedagogicalFeedback.style.display = 'none';
      }, 4000);
    }

    damageBoss(dmg, isCrit) {
      this.bossHp = Math.max(0, this.bossHp - dmg);
      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      this.soundtrack.playSFX(isCrit ? 'crit' : char.clashSound);
      this.addFloatingText(`-${dmg}`, isCrit ? '#facc15' : '#38bdf8', 1020, 360, isCrit);

      // Flash do Boss
      this.bossSprite.style.filter = 'brightness(2) contrast(1.5)';
      setTimeout(() => {
        this.bossSprite.style.filter = '';
      }, 180);

      this.updateHUD();

      if (this.bossHp <= 0) {
        const boss = BOSSES_CONFIG[this.selectedBossKey];
        if (this.currentPhaseIndex + 1 < boss.phases.length) {
          this.setupBossPhase(this.currentPhaseIndex + 1);

          // Avança também o cenário da trilha
          const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
          const nextStagePhase = Math.min(this.currentPhaseIndex, theme.phases.length - 1);
          this.setPhase(nextStagePhase);
        } else {
          // Vitória da Fase!
          this.soundtrack.playSFX('victory');
          this.addFloatingText('VITÓRIA ÉPICA!', '#22c55e', 683, 350, true);
          setTimeout(() => {
            if (typeof window.notificar_vitoria_js === 'function') {
              window.notificar_vitoria_js();
            }
          }, 2000);
        }
      }
    }

    damagePlayer(dmg) {
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.soundtrack.playSFX('heavy_impact');
      this.addFloatingText(`-${dmg}`, '#ef4444', 340, 360, false);

      // Flash de Dano no Jogador
      this.playerSprite.style.filter = 'brightness(2.2) drop-shadow(0 0 15px red)';
      setTimeout(() => {
        this.applySkin();
      }, 220);

      this.updateHUD();

      if (this.playerHp <= 0) {
        this.soundtrack.playSFX('wrong');
        this.addFloatingText('DERROTA...', '#ef4444', 683, 350, true);
        setTimeout(() => {
          if (typeof window.notificar_derrota_js === 'function') {
            window.notificar_derrota_js();
          }
        }, 2000);
      }
    }

    chargeUltimate(val) {
      this.ultCharge = Math.min(100, this.ultCharge + val);
      this.isUltReady = this.ultCharge >= 100;
      this.btnUltimate.style.display = this.isUltReady ? 'block' : 'none';
      this.updateHUD();
    }

    triggerUltimate() {
      if (!this.isUltReady) return;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.btnUltimate.style.display = 'none';
      this.updateHUD();

      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      const skin = char.skins[this.selectedSkinIndex];

      this.soundtrack.playSFX('thunder_ultimate');

      this.triggerQTE(['W', 'S', 'A', 'D', 'SPACE'], `GOLPE SUPREMO: ${skin.ultName}!`, (success) => {
        const dmg = success ? 115 : 60;
        this.damageBoss(dmg, true);
      });
    }

    triggerQTE(keys, label, callback) {
      this.soundtrack.playSFX('qte_alert');
      this.qteActive = true;
      this.qteKeys = keys;
      this.qteCurrentKeyIdx = 0;
      this.qteDuration = 2400;
      this.qteTimeRemaining = 2400;
      this.qteCallback = callback;

      this.qtePromptLabel.textContent = label;
      this.qteKeysContainer.innerHTML = '';

      keys.forEach((k, idx) => {
        const box = document.createElement('div');
        box.className = `qte-key-box ${idx === 0 ? 'active' : ''}`;
        box.textContent = k;
        box.onclick = () => this.handleQTEKey(k);
        this.qteKeysContainer.appendChild(box);
      });

      this.qteModal.style.display = 'flex';

      if (this.qteTimerInterval) clearInterval(this.qteTimerInterval);
      const step = 40;
      this.qteTimerInterval = setInterval(() => {
        this.qteTimeRemaining -= step;
        const pct = Math.max(0, (this.qteTimeRemaining / this.qteDuration) * 100);
        this.qteTimerFill.style.width = `${pct}%`;

        if (this.qteTimeRemaining <= 0) {
          this.resolveQTE(false);
        }
      }, step);
    }

    handleQTEKey(key) {
      if (!this.qteActive) return;
      const expected = this.qteKeys[this.qteCurrentKeyIdx];
      const match = key === expected || (expected === 'SPACE' && (key === ' ' || key === 'TAP'));

      if (match) {
        this.soundtrack.playSFX('sword_slash');
        const boxes = this.qteKeysContainer.children;
        if (boxes[this.qteCurrentKeyIdx]) {
          boxes[this.qteCurrentKeyIdx].className = 'qte-key-box completed';
        }
        this.qteCurrentKeyIdx++;

        if (this.qteCurrentKeyIdx < this.qteKeys.length) {
          if (boxes[this.qteCurrentKeyIdx]) {
            boxes[this.qteCurrentKeyIdx].className = 'qte-key-box active';
          }
        } else {
          this.resolveQTE(true);
        }
      }
    }

    resolveQTE(success) {
      if (this.qteTimerInterval) {
        clearInterval(this.qteTimerInterval);
        this.qteTimerInterval = null;
      }
      this.qteActive = false;
      this.qteModal.style.display = 'none';
      this.soundtrack.playSFX(success ? 'qte_success' : 'qte_fail');

      if (this.qteCallback) {
        this.qteCallback(success);
        this.qteCallback = null;
      }
    }

    updateHUD() {
      // Boss HUD
      const bossRatio = Math.max(0, this.bossHp / this.bossMaxHp);
      this.bossBarFill.style.width = `${bossRatio * 100}%`;
      this.bossHpText.textContent = `${this.bossHp} / ${this.bossMaxHp} HP`;

      // Player HUD
      const playerRatio = Math.max(0, this.playerHp / this.playerMaxHp);
      this.playerHpFill.style.width = `${playerRatio * 100}%`;
      this.playerHpNum.textContent = `${this.playerHp}/${this.playerMaxHp}`;

      this.playerUltFill.style.width = `${this.ultCharge}%`;
      this.playerUltNum.textContent = `${this.ultCharge}%`;
    }

    addFloatingText(text, color, x, y, isCrit = false) {
      this.floatingTexts.push({
        text,
        color,
        x,
        y,
        life: 1.0,
        isCrit,
      });
    }

    startFxLoop() {
      let last = performance.now();
      const loop = (now) => {
        const dt = (now - last) / 1000;
        last = now;

        this.fxCtx.clearRect(0, 0, 1366, 768);

        // 1. Partículas Climáticas Temáticas da Fase do Cenário
        const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
        const phase = theme.phases ? theme.phases[this.currentThemePhase] : null;
        const weather = phase ? phase.weather : 'embers';

        if (this.particles.length < 50) {
          if (weather === 'embers') {
            this.particles.push({
              x: Math.random() * 1366,
              y: 768 + 10,
              vx: (Math.random() - 0.5) * 40,
              vy: -(Math.random() * 45 + 30),
              size: Math.random() * 3 + 1.5,
              color: Math.random() > 0.4 ? '#f97316' : '#facc15',
              alpha: 0.85,
              life: Math.random() * 3 + 2,
            });
          } else if (weather === 'snow') {
            this.particles.push({
              x: Math.random() * 1366,
              y: -10,
              vx: Math.sin(now * 0.002) * 20 - 10,
              vy: Math.random() * 45 + 25,
              size: Math.random() * 3.5 + 2,
              color: '#ffffff',
              alpha: 0.9,
              life: Math.random() * 5 + 3,
            });
          } else if (weather === 'sand') {
            this.particles.push({
              x: 1366 + 10,
              y: Math.random() * 768,
              vx: -(Math.random() * 100 + 75),
              vy: (Math.random() - 0.4) * 25,
              size: Math.random() * 2.5 + 1,
              color: Math.random() > 0.5 ? '#f59e0b' : '#d97706',
              alpha: 0.75,
              life: Math.random() * 4 + 2,
            });
          } else if (weather === 'leaves') {
            this.particles.push({
              x: Math.random() * 1366,
              y: -10,
              vx: (Math.random() - 0.5) * 35,
              vy: Math.random() * 35 + 20,
              size: Math.random() * 4 + 2,
              color: Math.random() > 0.5 ? '#22c55e' : '#a16207',
              alpha: 0.8,
              life: Math.random() * 4 + 3,
            });
          } else if (weather === 'cosmic') {
            this.particles.push({
              x: 683 + (Math.random() - 0.5) * 900,
              y: 384 + (Math.random() - 0.5) * 600,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              size: Math.random() * 4 + 1.5,
              color: Math.random() > 0.5 ? '#a855f7' : '#38bdf8',
              alpha: 0.9,
              life: Math.random() * 3 + 1.5,
            });
          }
        }

        // Renderiza e movimenta as partículas climáticas
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;

          this.fxCtx.fillStyle = p.color;
          this.fxCtx.globalAlpha = Math.max(0, Math.min(1, p.alpha * (p.life / 3)));
          this.fxCtx.beginPath();
          this.fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.fxCtx.fill();

          if (p.life <= 0 || p.x < -20 || p.x > 1386 || p.y < -20 || p.y > 788) {
            this.particles.splice(i, 1);
          }
        }
        this.fxCtx.globalAlpha = 1.0;

        // 2. Renderiza Textos Flutuantes
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
          const ft = this.floatingTexts[i];
          ft.y -= dt * 45;
          ft.life -= dt * 0.9;

          this.fxCtx.save();
          this.fxCtx.font = ft.isCrit ? '900 28px Inter, sans-serif' : 'bold 20px Inter, sans-serif';
          this.fxCtx.textAlign = 'center';
          this.fxCtx.fillStyle = '#000000';
          this.fxCtx.fillText(ft.text, ft.x + 2, ft.y + 2);
          this.fxCtx.fillStyle = ft.color;
          this.fxCtx.fillText(ft.text, ft.x, ft.y);
          this.fxCtx.restore();

          if (ft.life <= 0) {
            this.floatingTexts.splice(i, 1);
          }
        }

        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  window.addEventListener('load', () => {
    window.estudemyGame = new EstudeMyOverhaulGame();
  });
})();