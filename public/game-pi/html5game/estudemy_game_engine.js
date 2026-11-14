/**
 * ESTUDEMY RPG ENGINE - VERSÃO OVERHAUL V3
 * - Orquestra Realista Sem Pixel/Chiptune (Somente síntese acústica com harmônicos, reverberação e envelopes suaves)
 * - Múltiplos Inimigos Simultâneos com Ataques Diversificados (Golpes físicos, magias arcanas e combos)
 * - Ultimate 100% Exclusivo por Personagem e Skin (NÃO é QTE; ativa sequência cinemática completa)
 * - Correção Definitiva do QTE: fecha imediatamente ao acertar ou errar e possui cooldown anti-repetição
 * - Remoção de nomes flutuantes abaixo dos personagens (HUD limpo e focado no terreno)
 * - Seleção de skins travada no Perfil do usuário (sem botão de troca in-game)
 * - Animações ricas: idle, attack1, attack2, recoil de dano, dash de ataque e golpe supremo
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CONFIGURAÇÕES VISUAIS: CENÁRIOS, HORDAS DE INIMIGOS E HERÓIS
  // ============================================================================
  const THEMES_CONFIG = {
    castelo: {
      name: 'Castelo dos Dados',
      trackLabel: 'TRILHA: CASTELO DOS DADOS',
      musicKey: 'gothic_orchestra',
      bottomOffset: '14%',
      playerLeft: '17%',
      enemies: [
        { name: 'Guarda da Muralha', spriteFolder: 'assets/sprites/cavaleiro', maxHp: 65, atk: 14, isFlying: false, type: 'fisico' },
        { name: 'Spectre do Código', spriteFolder: 'assets/sprites/spectre', maxHp: 110, atk: 22, isFlying: true, type: 'magico' },
        { name: 'Acólito da Memória', spriteFolder: 'assets/sprites/mago', maxHp: 55, atk: 16, isFlying: false, type: 'magico' },
      ],
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
      musicKey: 'viking_mountains',
      bottomOffset: '17%',
      playerLeft: '20%',
      enemies: [
        { name: 'Guerreiro da Geada', spriteFolder: 'assets/sprites/cavaleiro', maxHp: 75, atk: 16, isFlying: false, type: 'fisico' },
        { name: 'Mago Cósmico do Pico', spriteFolder: 'assets/sprites/mago', maxHp: 125, atk: 26, isFlying: false, type: 'magico' },
        { name: 'Espectro dos Ventos', spriteFolder: 'assets/sprites/spectre', maxHp: 60, atk: 18, isFlying: true, type: 'magico' },
      ],
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
      musicKey: 'arabic_desert',
      bottomOffset: '14%',
      playerLeft: '17%',
      enemies: [
        { name: 'Guerreiro das Areias', spriteFolder: 'assets/sprites/cavaleiro', maxHp: 70, atk: 15, isFlying: false, type: 'fisico' },
        { name: 'Djinn das Tempestades', spriteFolder: 'assets/sprites/spectre', maxHp: 115, atk: 24, isFlying: true, type: 'magico' },
        { name: 'Mago das Dunas', spriteFolder: 'assets/sprites/mago', maxHp: 60, atk: 18, isFlying: false, type: 'magico' },
      ],
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
      musicKey: 'bard_village',
      bottomOffset: '14%',
      playerLeft: '17%',
      enemies: [
        { name: 'Cavaleiro Renegado', spriteFolder: 'assets/sprites/cavaleiro', maxHp: 80, atk: 18, isFlying: false, type: 'fisico' },
        { name: 'Lorde Decaído', spriteFolder: 'assets/sprites/cavaleiro', maxHp: 130, atk: 25, isFlying: false, type: 'fisico' },
        { name: 'Ilusionista das Ruínas', spriteFolder: 'assets/sprites/mago', maxHp: 65, atk: 17, isFlying: false, type: 'magico' },
      ],
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
      musicKey: 'dark_void',
      bottomOffset: '15%',
      playerLeft: '17%',
      enemies: [
        { name: 'Arauto do Esquecimento', spriteFolder: 'assets/sprites/spectre', maxHp: 85, atk: 20, isFlying: true, type: 'magico' },
        { name: 'O Arquivista do Vazio', spriteFolder: 'assets/sprites/mago', maxHp: 160, atk: 32, isFlying: false, type: 'magico' },
        { name: 'Cavaleiro da Entropia', spriteFolder: 'assets/sprites/cavaleiro', maxHp: 90, atk: 22, isFlying: false, type: 'fisico' },
      ],
      phases: [
        { id: 1, name: 'Fragmentos dos Tomos Perdidos', bgImg: 'assets/backgrounds/vazio_fase1_fragmentos.jpg', weather: 'cosmic' },
        { id: 2, name: 'Nebulosa da Entropia Cósmica', bgImg: 'assets/backgrounds/vazio_fase2_nebulosa.jpg', weather: 'cosmic' },
        { id: 3, name: 'Singularidade do Infinito', bgImg: 'assets/backgrounds/vazio_fase3_singularidade.jpg', weather: 'cosmic' },
      ],
    },
  };

  // 3 Heróis Oficiais (Samurai, Guerreiro, Mago) com suas skins e seus ataques exclusivos
  const CHARACTERS_CONFIG = {
    samurai: {
      name: 'Kaito',
      spriteFolder: 'assets/sprites/samurai',
      attackSound: 'sword_slash',
      heavySound: 'sword_clash',
      skins: [
        {
          id: 'samurai_ronin',
          name: 'Kaito Ronin',
          shortName: 'Ronin',
          cssClass: '',
          ultName: 'Dança das Mil Lâminas Sagradas',
          ultType: 'samurai_ronin',
        },
        {
          id: 'samurai_cyber_void',
          name: 'Kaito Cyber-Void',
          shortName: 'Cyber-Void',
          cssClass: 'skin-cyber-void',
          ultName: 'Julgamento Cyberpunk Omnislash',
          ultType: 'samurai_cyber',
        },
      ],
    },
    guerreiro: {
      name: 'Boran',
      spriteFolder: 'assets/sprites/cavaleiro',
      attackSound: 'heavy_impact',
      heavySound: 'shield_block',
      skins: [
        {
          id: 'guerreiro_templario',
          name: 'Boran da Ordem',
          shortName: 'Ordem',
          cssClass: '',
          ultName: 'Investida Sagrada dos Céus',
          ultType: 'guerreiro_sagrado',
        },
        {
          id: 'guerreiro_berserker_lava',
          name: 'Boran Vulcânico',
          shortName: 'Vulcânico',
          cssClass: 'skin-berserker-lava',
          ultName: 'Erupção Titânica de Magma',
          ultType: 'guerreiro_vulcanico',
        },
      ],
    },
    mago: {
      name: 'Valerius',
      spriteFolder: 'assets/sprites/mago',
      attackSound: 'magic_cast',
      heavySound: 'magic_impact',
      skins: [
        {
          id: 'mago_arcanista',
          name: 'Valerius Arcano',
          shortName: 'Arcano',
          cssClass: '',
          ultName: 'Impacto do Meteoro Cósmico',
          ultType: 'mago_meteoro',
        },
        {
          id: 'mago_necromante_espectral',
          name: 'Valerius das Sombras',
          shortName: 'Sombras',
          cssClass: 'skin-necromante',
          ultName: 'Vórtice do Apocalipse das Almas',
          ultType: 'mago_almas',
        },
      ],
    },
  };

  // ============================================================================
  // 2. SISTEMA DE ÁUDIO ORQUESTRAL REALISTA (SÍNTESE ACÚSTICA SEM CHIPTUNE)
  // ============================================================================
  class RealisticOrchestralAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.timer = null;
      this.currentTrack = 'gothic_orchestra';
      this.step = 0;

      // Nós de Master e Reverb de Sala de Concerto
      this.masterGain = null;
      this.reverbSend = null;
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

          // Cria cadeia de reverberação e espacialidade de concerto
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);

          // Delay de ambiência com realimentação suave (simula sala acústica ampla)
          const delay1 = this.ctx.createDelay();
          delay1.delayTime.value = 0.22;
          const delayFeedback = this.ctx.createGain();
          delayFeedback.gain.value = 0.32;

          const delayFilter = this.ctx.createBiquadFilter();
          delayFilter.type = 'lowpass';
          delayFilter.frequency.value = 1400; // Corta agudos ásperos

          this.reverbSend = this.ctx.createGain();
          this.reverbSend.gain.value = 0.4;

          this.reverbSend.connect(delay1);
          delay1.connect(delayFilter);
          delayFilter.connect(delayFeedback);
          delayFeedback.connect(delay1);
          delayFilter.connect(this.masterGain);
        }
      } catch (e) {}
    }

    start(track = 'gothic_orchestra') {
      this.init();
      this.stop();
      this.currentTrack = track;
      if (this.isMuted || !this.ctx) return;

      this.step = 0;

      // Andamento orquestral orgânico e fluido
      let intervalMs = 280;
      if (track === 'viking_mountains') intervalMs = 320;
      else if (track === 'arabic_desert') intervalMs = 210;
      else if (track === 'bard_village') intervalMs = 200;
      else if (track === 'dark_void') intervalMs = 520;
      else if (track === 'gothic_orchestra') intervalMs = 260;

      this.timer = setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;

        switch (this.currentTrack) {
          case 'gothic_orchestra':
            this.playGothicMovement(t, this.step);
            break;
          case 'arabic_desert':
            this.playArabicMovement(t, this.step);
            break;
          case 'bard_village':
            this.playBardMovement(t, this.step);
            break;
          case 'dark_void':
            this.playDarkVoidMovement(t, this.step);
            break;
          case 'viking_mountains':
            this.playVikingMovement(t, this.step);
            break;
          default:
            this.playGothicMovement(t, this.step);
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
    // 1. CASTELO: Orquestra Gótica Acústica (Órgão de Tubos Harmônico + Cello + Sino)
    // --------------------------------------------------------------------------
    playGothicMovement(t, step) {
      // D Menor Harmônico Solene
      const melody = [
        293.66, 349.23, 440.0, 415.3, 440.0, 349.23, 293.66, 277.18,
        293.66, 369.99, 440.0, 554.37, 440.0, 349.23, 293.66, 220.0,
      ];
      const bassProgression = [73.42, 73.42, 87.31, 87.31, 69.3, 69.3, 73.42, 73.42];

      const note = melody[step % melody.length];
      const bass = bassProgression[Math.floor(step / 2) % bassProgression.length];

      // Órgão de Catedral Acústico (Sem onda quadrada - apenas senos somados e filtrados)
      this.playAcousticPipeOrgan(note, t, 0.45, 0.16);

      // Cello orquestral aveludado
      if (step % 2 === 0) {
        this.playWarmStrings(bass, t, 0.65, 0.22);
      }

      // Sino tubular de catedral distante a cada 16 tempos
      if (step % 16 === 0) {
        this.playTubularBell(146.83, t, 3.2, 0.3);
      }
    }

    // --------------------------------------------------------------------------
    // 2. DESERTO: Orquestra Árabe Acústica (Alaúde/Oud em Maqam Hijaz + Darbuka)
    // --------------------------------------------------------------------------
    playArabicMovement(t, step) {
      const hijazOud = [
        293.66, 311.13, 369.99, 392.0, 369.99, 311.13, 293.66, 261.63,
        233.08, 220.0, 233.08, 293.66, 311.13, 369.99, 440.0, 369.99,
      ];

      const note = hijazOud[step % hijazOud.length];

      // Alaúde / Oud Acústico
      this.playAcousticOud(note, t, 0.24, 0.25);

      // Drone modal de cordas no fundo
      if (step % 8 === 0) {
        this.playWarmStrings(146.83, t, 1.8, 0.15);
      }

      // Percussão Darbuka / Doumbek Acústica
      const rhythm = [1, 0, 2, 0, 2, 1, 0, 2];
      if (rhythm[step % rhythm.length] === 1) {
        this.playAcousticDarbukaDum(t, 0.22, 0.3);
      } else if (rhythm[step % rhythm.length] === 2) {
        this.playAcousticDarbukaTek(t, 0.08, 0.16);
      }
    }

    // --------------------------------------------------------------------------
    // 3. VILA: Tema com Bardos (Flauta Transversal Celta + Alaúde em 6/8 + Pandeiro)
    // --------------------------------------------------------------------------
    playBardMovement(t, step) {
      const fluteMelody = [
        587.33, 659.25, 783.99, 880.0, 783.99, 659.25,
        587.33, 493.88, 523.25, 587.33, 659.25, 493.88,
      ];
      const chords = [146.83, 196.0, 220.0, 164.81];

      const note = fluteMelody[step % fluteMelody.length];
      const chord = chords[Math.floor(step / 6) % chords.length];

      // Flauta Transversal de Madeira (Vibrato suave e ar harmônico)
      this.playAcousticFlute(note, t, 0.22, 0.22);

      // Harpa / Alaúde acústico
      if (step % 3 === 0) {
        this.playAcousticPluck(chord, t, 0.45, 0.18);
      } else if (step % 3 === 1) {
        this.playAcousticPluck(chord * 1.5, t, 0.3, 0.14);
      }

      // Pandeiro leve
      if (step % 3 === 2) {
        this.playAcousticTambourine(t, 0.07, 0.08);
      }
    }

    // --------------------------------------------------------------------------
    // 4. VAZIO CÓSMICO: Ambient Dark Sinfônico (Sub-Bass 40Hz + Trítonos + Horror Cósmico)
    // --------------------------------------------------------------------------
    playDarkVoidMovement(t, step) {
      // Sub-Bass 40Hz contínuo e aveludado
      this.playWarmSubBass(40.0, t, 1.2, 0.4);

      // Pads com intervalos de Trítono (Tensão cósmica sem estridência)
      const cosmicPads = [
        [65.41, 92.5],   // C2 e F#2
        [61.74, 87.31],  // B1 e F2
        [73.42, 103.83], // D2 e G#2
      ];

      const pad = cosmicPads[Math.floor(step / 2) % cosmicPads.length];
      if (step % 2 === 0) {
        this.playWarmStrings(pad[0], t, 1.4, 0.16);
        this.playWarmStrings(pad[1], t, 1.4, 0.14);
      }

      // Cristais cintilantes do espaço
      if (step % 4 === 1) {
        this.playTubularBell(880 + Math.random() * 300, t, 0.8, 0.08);
      }
    }

    // --------------------------------------------------------------------------
    // 5. MONTANHA: Orquestra Nórdica / Viking (Tambores de Guerra + Trompa de Valhalla)
    // --------------------------------------------------------------------------
    playVikingMovement(t, step) {
      // Tambor Taiko Nórdico com impacto acústico profundo
      const warRhythm = [1, 0, 1, 1, 0, 1, 0, 0];
      if (warRhythm[step % warRhythm.length] === 1) {
        this.playAcousticWarTaiko(t, 0.35, 0.55);
      }

      // Trompa Ancestral Gjallarhorn em Quintas Abertas (D2 + A2)
      if (step % 8 === 0) {
        this.playGjallarhornCall(73.42, t, 1.8, 0.32);
        this.playGjallarhornCall(110.0, t, 1.8, 0.26);
      } else if (step % 8 === 4) {
        this.playGjallarhornCall(82.41, t, 1.6, 0.3);
        this.playGjallarhornCall(123.47, t, 1.6, 0.24);
      }

      // Cordas graves ritmadas
      if (step % 2 === 1) {
        this.playWarmStrings(146.83, t, 0.25, 0.12);
      }
    }

    // --------------------------------------------------------------------------
    // SÍNTESE ACÚSTICA DE INSTRUMENTOS (ZERO CHIPTUNE)
    // --------------------------------------------------------------------------
    playWarmStrings(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.003, time); // Leve desafinação coral

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.Q.setValueAtTime(1.5, time);

      // Envelope suave de cordas (ataque 100ms, decaimento natural)
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + duration);
      osc2.stop(time + duration);
    }

    playAcousticPipeOrgan(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      // Combinação harmônica senoidal 8' + 4' + 2'
      [1, 2, 3].forEach((harmonic, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * harmonic, time);

        const hVol = vol / (idx + 1.2);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(hVol, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        gain.connect(this.reverbSend);

        osc.start(time);
        osc.stop(time + duration);
      });
    }

    playAcousticFlute(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Vibrato suave característico de sopro de madeira
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4.8, time);
      lfoGain.gain.setValueAtTime(3.5, time);
      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      lfo.start(time);
      osc.start(time);
      lfo.stop(time + duration);
      osc.stop(time + duration);
    }

    playAcousticOud(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.8, time);
      filter.Q.setValueAtTime(3, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      osc.start(time);
      osc.stop(time + duration);
    }

    playAcousticPluck(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      osc.start(time);
      osc.stop(time + duration);
    }

    playGjallarhornCall(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, time);
      filter.Q.setValueAtTime(3, time);

      // Envelope com swell majestoso de trompa nórdica
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      osc.start(time);
      osc.stop(time + duration);
    }

    playTubularBell(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      [1, 2.76, 5.4].forEach((ratio, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * ratio, time);

        gain.gain.setValueAtTime(vol / (i + 1), time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        gain.connect(this.reverbSend);

        osc.start(time);
        osc.stop(time + duration);
      });
    }

    playWarmSubBass(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration);
    }

    playAcousticWarTaiko(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + duration);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      osc.start(time);
      osc.stop(time + duration);
    }

    playAcousticDarbukaDum(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(55, time + duration);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration);
    }

    playAcousticDarbukaTek(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, time);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration);
    }

    playAcousticTambourine(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3800, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + duration);
    }

    // --------------------------------------------------------------------------
    // SFX DE COMBATE PROCEDURAL
    // --------------------------------------------------------------------------
    playSFX(name) {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;

      switch (name) {
        case 'sword_slash':
        case 'slash':
          this.playAcousticOud(380, t, 0.1, 0.4);
          this.playAcousticTambourine(t, 0.08, 0.2);
          break;

        case 'sword_clash':
          this.playTubularBell(1100, t, 0.25, 0.35);
          this.playAcousticPluck(440, t, 0.15, 0.3);
          break;

        case 'magic_cast':
          this.playAcousticFlute(660, t, 0.25, 0.35);
          this.playTubularBell(1320, t + 0.08, 0.3, 0.25);
          break;

        case 'magic_impact':
          this.playAcousticWarTaiko(t, 0.28, 0.6);
          this.playTubularBell(700, t, 0.3, 0.35);
          break;

        case 'heavy_impact':
        case 'hit':
          this.playAcousticWarTaiko(t, 0.22, 0.65);
          break;

        case 'shield_block':
          this.playTubularBell(350, t, 0.18, 0.45);
          break;

        case 'thunder_ultimate':
          this.playAcousticWarTaiko(t, 0.6, 0.85);
          this.playWarmSubBass(35, t, 0.8, 0.65);
          this.playAcousticWarTaiko(t + 0.15, 0.5, 0.7);
          break;

        case 'crit':
          this.playTubularBell(1046, t, 0.3, 0.45);
          this.playAcousticWarTaiko(t, 0.25, 0.55);
          break;

        case 'qte_alert':
          this.playTubularBell(880, t, 0.12, 0.4);
          this.playTubularBell(1320, t + 0.08, 0.16, 0.45);
          break;

        case 'qte_success':
          this.playTubularBell(659, t, 0.12, 0.4);
          this.playTubularBell(1046, t + 0.1, 0.3, 0.5);
          break;

        case 'qte_fail':
          this.playWarmStrings(130, t, 0.28, 0.45);
          break;

        case 'correct':
          this.playAcousticFlute(523, t, 0.12, 0.4);
          this.playAcousticFlute(783, t + 0.09, 0.22, 0.45);
          break;

        case 'wrong':
          this.playWarmStrings(180, t, 0.22, 0.4);
          break;

        case 'victory':
          this.playTubularBell(523, t, 0.15, 0.45);
          this.playTubularBell(659, t + 0.12, 0.15, 0.45);
          this.playTubularBell(1046, t + 0.25, 0.6, 0.6);
          break;

        default:
          this.playTubularBell(440, t, 0.1, 0.2);
          break;
      }
    }
  }

  // ============================================================================
  // 3. MOTOR PRINCIPAL DE BATALHA COM MÚLTIPLOS INIMIGOS E ULTIMATE EXCLUSIVO
  // ============================================================================
  class EstudeMyOverhaulGame {
    constructor() {
      this.soundtrack = new RealisticOrchestralAudio();
      this.fxCanvas = document.getElementById('fx-canvas');
      this.fxCtx = this.fxCanvas.getContext('2d');

      // Elementos do Jogador
      this.bgLayer = document.getElementById('bg-layer');
      this.playerSprite = document.getElementById('player-sprite');
      this.playerWrapper = document.getElementById('player-wrapper');

      // Elementos dos Inimigos (Múltiplos Slots)
      this.enemiesContainer = document.getElementById('enemies-container');
      this.enemySlots = [
        {
          wrapper: document.getElementById('enemy-0'),
          sprite: document.getElementById('enemy-0-sprite'),
          nameText: document.getElementById('enemy-0-name'),
          barFill: document.getElementById('enemy-0-hp-fill'),
          data: null,
          currentHp: 0,
          maxHp: 0,
          isAlive: true,
        },
        {
          wrapper: document.getElementById('enemy-1'),
          sprite: document.getElementById('enemy-1-sprite'),
          nameText: document.getElementById('enemy-1-name'),
          barFill: document.getElementById('enemy-1-hp-fill'),
          data: null,
          currentHp: 0,
          maxHp: 0,
          isAlive: true,
        },
        {
          wrapper: document.getElementById('enemy-2'),
          sprite: document.getElementById('enemy-2-sprite'),
          nameText: document.getElementById('enemy-2-name'),
          barFill: document.getElementById('enemy-2-hp-fill'),
          data: null,
          currentHp: 0,
          maxHp: 0,
          isAlive: true,
        },
      ];

      // Top Bar Elements
      this.missionTrackText = document.getElementById('mission-track-text');
      this.missionPhaseText = document.getElementById('mission-phase-text');
      this.audioUnlockOverlay = document.getElementById('audio-unlock-overlay');
      this.bossTitleText = document.getElementById('boss-title-text');
      this.bossPhaseText = document.getElementById('boss-phase-text');
      this.bossBarFill = document.getElementById('boss-bar-fill');
      this.bossHpText = document.getElementById('boss-hp-text');

      // Top Actions
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

      // Overlay Cinemático de Ultimate
      this.cinematicOverlay = document.getElementById('cinematic-overlay');
      this.ultimateBanner = document.getElementById('ultimate-banner');

      // Estados de Jogo
      this.activeTheme = 'castelo';
      this.currentThemePhase = 0;
      this.selectedCharKey = 'samurai';
      this.selectedSkinIndex = 0;

      // Pontos de Combate
      this.playerHp = 100;
      this.playerMaxHp = 100;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.streak = 0;

      // QTE State e Cooldown Anti-Repetição
      this.qteActive = false;
      this.qteKeys = [];
      this.qteCurrentKeyIdx = 0;
      this.qteDuration = 2200;
      this.qteTimeRemaining = 0;
      this.qteTimerInterval = null;
      this.qteCallback = null;
      this.qteCooldown = false; // Garante que nunca repita em loop

      // Perguntas
      this.questions = [];
      this.currentQuestionIdx = 0;

      // Partículas e Números Flutuantes
      this.floatingTexts = [];
      this.particles = [];
      this.cinematicSlashes = [];

      this.initEvents();
      this.loadGameData();
      this.startFxLoop();
    }

    initEvents() {
      // Desbloqueia áudio orquestral na primeira interação
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
        if (e.repeat) return; // Ignora auto-repetição de teclas seguradas

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

      // Herói Selecionado (Perfil do Usuário)
      const char = (raw?.personagem_selecionado || 'samurai').toLowerCase();
      if (char.includes('guerreiro') || char.includes('cavaleiro') || char.includes('boran')) {
        this.selectedCharKey = 'guerreiro';
      } else if (char.includes('mago') || char.includes('valerius')) {
        this.selectedCharKey = 'mago';
      } else {
        this.selectedCharKey = 'samurai';
      }

      // Skin Selecionada no Perfil (se definida pelo perfil)
      const skinKey = (raw?.skin_selecionada || raw?.personagem_skin || '').toLowerCase();
      const heroConfig = CHARACTERS_CONFIG[this.selectedCharKey];
      const foundIdx = heroConfig.skins.findIndex((s) => s.id.toLowerCase() === skinKey || s.name.toLowerCase().includes(skinKey));
      this.selectedSkinIndex = foundIdx >= 0 ? foundIdx : 0;

      // Trilha / Cenário
      const cenario = (raw?.cenario || raw?.trilha || 'castelo').toLowerCase();
      if (cenario.includes('montanha') || cenario.includes('pico')) this.activeTheme = 'montanha';
      else if (cenario.includes('deserto') || cenario.includes('dunas')) this.activeTheme = 'deserto';
      else if (cenario.includes('vila') || cenario.includes('mercado')) this.activeTheme = 'vila';
      else if (cenario.includes('vazio') || cenario.includes('final') || cenario.includes('singularidade')) this.activeTheme = 'vazio_cosmico';
      else this.activeTheme = 'castelo';

      // Perguntas pedagógicas
      this.questions = raw?.perguntas && raw.perguntas.length > 0 ? raw.perguntas : [
        {
          enunciado: 'Qual a principal vantagem da computação em nuvem?',
          alternativas: ['Escalabilidade sob demanda', 'Custo fixo alto', 'Perda de controle', 'Necessidade de servidor físico local'],
          respostaCorreta: 'Escalabilidade sob demanda',
          indiceRespostaCorreta: 0,
          explicacao: 'A nuvem permite provisionar e desprovisionar recursos sob demanda.',
        },
        {
          enunciado: 'O que caracteriza um banco de dados relacional (SQL)?',
          alternativas: ['Tabelas com chaves primárias e relacionamentos', 'Documentos JSON livres', 'Chaves e valores sem esquema', 'Grafos não estruturados'],
          respostaCorreta: 'Tabelas com chaves primárias e relacionamentos',
          indiceRespostaCorreta: 0,
          explicacao: 'Bancos relacionais estruturam dados em tabelas com integridade referencial.',
        },
        {
          enunciado: 'Em arquitetura de microsserviços, qual a função de um API Gateway?',
          alternativas: ['Roteamento e segurança centralizados', 'Armazenar o banco de dados principal', 'Substituir a rede física', 'Eliminar requisições HTTP'],
          respostaCorreta: 'Roteamento e segurança centralizados',
          indiceRespostaCorreta: 0,
          explicacao: 'O Gateway unifica autenticação, rate limiting e roteamento para múltiplos serviços.',
        },
      ];

      let initialPhase = 0;
      if (typeof raw?.ordem === 'number' && raw.ordem >= 1) {
        initialPhase = Math.max(0, (raw.ordem - 1) % 4);
      }

      this.applyTheme(this.activeTheme, initialPhase);
      this.applyHeroSkin();
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
      this.addFloatingText('ORQUESTRA HABILITADA!', '#22c55e', 683, 220);
    }

    applyTheme(themeKey, phaseIndex = 0) {
      this.activeTheme = themeKey;
      const theme = THEMES_CONFIG[themeKey] || THEMES_CONFIG.castelo;

      // Spawna os Múltiplos Inimigos da Fase
      this.setupEnemies(theme.enemies);

      // Aplica a fase solicitada
      this.setPhase(phaseIndex);

      // Inicia a música orquestral autêntica
      if (this.soundtrack.ctx && !this.soundtrack.isMuted) {
        this.soundtrack.start(theme.musicKey);
      }
    }

    setupEnemies(enemyList) {
      enemyList.forEach((eData, i) => {
        const slot = this.enemySlots[i];
        if (!slot) return;

        slot.data = eData;
        slot.maxHp = eData.maxHp;
        slot.currentHp = eData.maxHp;
        slot.isAlive = true;

        slot.wrapper.style.display = 'flex';
        slot.wrapper.style.opacity = '1';
        slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
        slot.nameText.textContent = eData.name;
        slot.barFill.style.width = '100%';

        if (eData.isFlying) {
          slot.wrapper.classList.add('is-flying');
        } else {
          slot.wrapper.classList.remove('is-flying');
        }
      });

      this.updateTotalBossHUD();
    }

    setPhase(phaseIdx) {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const maxPhases = theme.phases ? theme.phases.length : 1;
      const safeIdx = Math.max(0, Math.min(phaseIdx, maxPhases - 1));
      this.currentThemePhase = safeIdx;
      const phase = theme.phases ? theme.phases[safeIdx] : { name: theme.name, bgImg: theme.bgImg };

      // Fade suave de transição de cenário
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

      // Aplica ancoragem firme de chão
      this.applyGrounding();

      this.addFloatingText(`CENÁRIO: ${phase.name}!`, '#38bdf8', 683, 220);
    }

    applyGrounding() {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const bottom = theme.bottomOffset || '14%';
      const playerL = theme.playerLeft || '17%';

      // Herói firme no solo
      this.playerWrapper.style.bottom = bottom;
      this.playerWrapper.style.left = playerL;

      // Inimigos firmes no solo com profundidade
      if (this.enemySlots[0]?.wrapper) this.enemySlots[0].wrapper.style.bottom = bottom;
      if (this.enemySlots[1]?.wrapper) this.enemySlots[1].wrapper.style.bottom = `calc(${bottom} + 1%)`;
      if (this.enemySlots[2]?.wrapper) this.enemySlots[2].wrapper.style.bottom = `calc(${bottom} + 2%)`;
    }

    applyHeroSkin() {
      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      const skin = char.skins[this.selectedSkinIndex] || char.skins[0];

      this.playerSprite.className = `actor-sprite ${skin.cssClass}`;
      this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
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

        // Animação de Ataque do Herói (Alterna entre attack1 e attack2)
        const attackGif = this.streak % 2 === 0 ? 'attack2.gif' : 'attack1.gif';
        this.playerSprite.src = `${char.spriteFolder}/${attackGif}`;
        this.playerWrapper.classList.add('actor-dash-strike');

        setTimeout(() => {
          this.soundtrack.playSFX(char.attackSound);
        }, 140);

        setTimeout(() => {
          this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
          this.playerWrapper.classList.remove('actor-dash-strike');
        }, 500);

        // O golpe acerta o primeiro inimigo vivo à frente
        const target = this.getFirstAliveEnemy();
        if (target) {
          // Ocasional QTE de Combo apenas com streak alto e respeitando o cooldown
          if (this.streak >= 3 && !this.qteCooldown && Math.random() < 0.35) {
            this.triggerQTE(['A', 'D', 'SPACE'], 'GOLPE CRÍTICO! [A] -> [D] -> [ESPAÇO]!', (success) => {
              const mult = success ? 2.4 : 1.0;
              this.damageEnemy(target, Math.round(35 * mult), success);
            });
          } else {
            this.damageEnemy(target, 32, false);
          }
        }

        this.showFeedback('Excelente! Resposta correta e ataque desferido!', '#22c55e');
      } else {
        this.soundtrack.playSFX('wrong');
        this.streak = 0;

        // Inimigos contra-atacam com ataques diversificados!
        this.executeEnemyAttack();

        this.showFeedback(`Incorreto! Dica: ${q.explicacao || 'Revise o conteúdo desta etapa.'}`, '#ef4444');
      }

      this.currentQuestionIdx++;
      this.renderQuestion();
    }

    getFirstAliveEnemy() {
      return this.enemySlots.find((s) => s.isAlive && s.currentHp > 0) || null;
    }

    damageEnemy(slot, dmg, isCrit) {
      if (!slot || !slot.isAlive) return;

      slot.currentHp = Math.max(0, slot.currentHp - dmg);
      const ratio = slot.currentHp / slot.maxHp;
      slot.barFill.style.width = `${ratio * 100}%`;

      // Animação de Recuo de Dano no Inimigo
      slot.wrapper.classList.add('actor-enemy-recoil');
      setTimeout(() => {
        slot.wrapper.classList.remove('actor-enemy-recoil');
      }, 350);

      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      this.soundtrack.playSFX(isCrit ? 'crit' : char.heavySound);

      // Número Flutuante sobre o inimigo atingido
      const rect = slot.wrapper.getBoundingClientRect();
      const containerRect = document.getElementById('game-container').getBoundingClientRect();
      const relX = rect.left - containerRect.left + 50;
      const relY = rect.top - containerRect.top + 60;
      this.addFloatingText(`-${dmg}`, isCrit ? '#facc15' : '#38bdf8', relX, relY, isCrit);

      this.updateTotalBossHUD();

      // Morte do Inimigo
      if (slot.currentHp <= 0) {
        slot.isAlive = false;
        slot.wrapper.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        slot.wrapper.style.opacity = '0';
        slot.wrapper.style.transform = 'translateY(20px) scale(0.8)';
        this.addFloatingText(`${slot.data.name} DERROTADO!`, '#22c55e', relX, relY - 40, true);

        // Verifica se toda a horda foi derrotada
        const anyAlive = this.enemySlots.some((s) => s.isAlive);
        if (!anyAlive) {
          // Vitória da Fase!
          this.soundtrack.playSFX('victory');
          this.addFloatingText('VITÓRIA ÉPICA DA FASE!', '#22c55e', 683, 350, true);
          setTimeout(() => {
            if (typeof window.notificar_vitoria_js === 'function') {
              window.notificar_vitoria_js();
            }
          }, 2200);
        }
      }
    }

    executeEnemyAttack() {
      const aliveEnemies = this.enemySlots.filter((s) => s.isAlive);
      if (aliveEnemies.length === 0) return;

      // Sorteia qual inimigo vivo irá desferir o ataque
      const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      const atkType = attacker.data.type || 'fisico';

      // Animação de ataque com attack1 ou attack2
      attacker.sprite.src = `${attacker.data.spriteFolder}/attack1.gif`;
      attacker.wrapper.classList.add('actor-enemy-strike');

      setTimeout(() => {
        if (atkType === 'magico') {
          this.soundtrack.playSFX('magic_impact');
          this.triggerMagicBlast(attacker);
        } else {
          this.soundtrack.playSFX('heavy_impact');
        }
      }, 160);

      setTimeout(() => {
        attacker.sprite.src = `${attacker.data.spriteFolder}/idle.gif`;
        attacker.wrapper.classList.remove('actor-enemy-strike');
      }, 500);

      // Ocasional QTE de Defesa/Esquiva quando o inimigo ataca pesadamente
      if (!this.qteCooldown && Math.random() < 0.28) {
        this.triggerQTE(['W', 'SPACE'], 'DEFESA RELÂMPAGO! [W] -> [ESPAÇO]!', (success) => {
          if (success) {
            this.soundtrack.playSFX('shield_block');
            this.addFloatingText('BLOQUEADO!', '#38bdf8', 340, 360, true);
          } else {
            this.damagePlayer(attacker.data.atk);
          }
        });
      } else {
        this.damagePlayer(attacker.data.atk);
      }
    }

    triggerMagicBlast(attacker) {
      // Cria projétil mágico no canvas que cruza a tela até o herói
      this.particles.push({
        x: 950,
        y: 420,
        vx: -800,
        vy: 0,
        size: 14,
        color: '#a855f7',
        alpha: 1,
        life: 0.65,
      });
    }

    damagePlayer(dmg) {
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.soundtrack.playSFX('heavy_impact');
      this.addFloatingText(`-${dmg}`, '#ef4444', 340, 360, false);

      // Animação de Recuo de Dano no Herói
      this.playerWrapper.classList.add('actor-recoil');
      setTimeout(() => {
        this.playerWrapper.classList.remove('actor-recoil');
      }, 350);

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

    updateTotalBossHUD() {
      let totalCurrent = 0;
      let totalMax = 0;
      let aliveCount = 0;

      this.enemySlots.forEach((s) => {
        if (s.data) {
          totalMax += s.maxHp;
          if (s.isAlive) {
            totalCurrent += s.currentHp;
            aliveCount++;
          }
        }
      });

      const ratio = totalMax > 0 ? totalCurrent / totalMax : 0;
      this.bossBarFill.style.width = `${ratio * 100}%`;
      this.bossHpText.textContent = `${totalCurrent} / ${totalMax} HP`;
      this.bossPhaseText.textContent = `${aliveCount} INIMIGOS`;
    }

    chargeUltimate(val) {
      this.ultCharge = Math.min(100, this.ultCharge + val);
      this.isUltReady = this.ultCharge >= 100;
      this.btnUltimate.style.display = this.isUltReady ? 'block' : 'none';
      this.updateHUD();
    }

    // ==========================================================================
    // 4. GOLPE SUPREMO (ULTIMATE): 100% EXCLUSIVO E SEM QTE
    // ==========================================================================
    triggerUltimate() {
      if (!this.isUltReady) return;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.btnUltimate.style.display = 'none';
      this.updateHUD();

      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      const skin = char.skins[this.selectedSkinIndex] || char.skins[0];

      // Exibe Banner Cinemático
      this.ultimateBanner.textContent = `⚡ ${skin.ultName.toUpperCase()}!`;
      this.cinematicOverlay.style.display = 'flex';

      // Executa Animação de Golpe Supremo do Herói
      this.playerSprite.src = `${char.spriteFolder}/full.gif`;
      this.playerWrapper.classList.add('actor-charge-glow');

      this.soundtrack.playSFX('thunder_ultimate');

      // Dispara Efeitos Especiais Únicos no Canvas por Skin
      this.executeSkinUltimateVisuals(skin.ultType);

      // Causa Dano Massivo em ÁREA em TODOS os Inimigos Vivos
      setTimeout(() => {
        this.enemySlots.forEach((slot) => {
          if (slot.isAlive) {
            this.damageEnemy(slot, 95, true);
          }
        });
      }, 500);

      // Encerra a Sequência Cinemática Suavemente
      setTimeout(() => {
        this.cinematicOverlay.style.display = 'none';
        this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
        this.playerWrapper.classList.remove('actor-charge-glow');
      }, 1200);
    }

    executeSkinUltimateVisuals(ultType) {
      // Adiciona linhas de corte e explosões dinâmicas no canvas
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          this.cinematicSlashes.push({
            x1: 200 + Math.random() * 900,
            y1: 150 + Math.random() * 450,
            x2: 400 + Math.random() * 900,
            y2: 250 + Math.random() * 450,
            color: ultType.includes('cyber') ? '#a855f7' : ultType.includes('vulcanico') ? '#f97316' : '#facc15',
            life: 0.35,
          });
        }, i * 60);
      }
    }

    // ==========================================================================
    // 5. QUICK TIME EVENT (QTE): CORREÇÃO DEFINITIVA (DESAPARECE IMEDIATAMENTE)
    // ==========================================================================
    triggerQTE(keys, label, callback) {
      if (this.qteCooldown) return; // Não dispara se estiver em cooldown

      this.soundtrack.playSFX('qte_alert');
      this.qteActive = true;
      this.qteKeys = keys;
      this.qteCurrentKeyIdx = 0;
      this.qteDuration = 2200;
      this.qteTimeRemaining = 2200;
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
          // Todas as teclas pressionadas com sucesso!
          this.resolveQTE(true);
        }
      } else {
        // Errou uma tecla - falha o QTE e fecha
        this.resolveQTE(false);
      }
    }

    resolveQTE(success) {
      // 1. Limpa o timer imediatamente
      if (this.qteTimerInterval) {
        clearInterval(this.qteTimerInterval);
        this.qteTimerInterval = null;
      }

      // 2. Desativa e oculta a janela imediatamente
      this.qteActive = false;
      this.qteModal.style.display = 'none';

      // 3. Ativa cooldown anti-repetição (8 segundos)
      this.qteCooldown = true;
      setTimeout(() => {
        this.qteCooldown = false;
      }, 8000);

      this.soundtrack.playSFX(success ? 'qte_success' : 'qte_fail');

      // 4. Executa o callback e zera a referência
      if (this.qteCallback) {
        const cb = this.qteCallback;
        this.qteCallback = null;
        cb(success);
      }
    }

    updateHUD() {
      // Player HUD
      const playerRatio = Math.max(0, this.playerHp / this.playerMaxHp);
      this.playerHpFill.style.width = `${playerRatio * 100}%`;
      this.playerHpNum.textContent = `${this.playerHp}/${this.playerMaxHp}`;

      this.playerUltFill.style.width = `${this.ultCharge}%`;
      this.playerUltNum.textContent = `${this.ultCharge}%`;

      this.updateTotalBossHUD();
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

        // 2. Renderiza Linhas de Corte do Golpe Supremo
        for (let i = this.cinematicSlashes.length - 1; i >= 0; i--) {
          const s = this.cinematicSlashes[i];
          s.life -= dt;
          this.fxCtx.save();
          this.fxCtx.strokeStyle = s.color;
          this.fxCtx.lineWidth = 6;
          this.fxCtx.shadowColor = s.color;
          this.fxCtx.shadowBlur = 20;
          this.fxCtx.beginPath();
          this.fxCtx.moveTo(s.x1, s.y1);
          this.fxCtx.lineTo(s.x2, s.y2);
          this.fxCtx.stroke();
          this.fxCtx.restore();

          if (s.life <= 0) {
            this.cinematicSlashes.splice(i, 1);
          }
        }

        // 3. Renderiza Textos Flutuantes
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