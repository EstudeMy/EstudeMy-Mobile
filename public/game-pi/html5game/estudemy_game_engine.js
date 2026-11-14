/**
 * ESTUDEMY RPG ENGINE - VERSÃO OVERHAUL V4
 * - Backgrounds Vivos e Animados (Pan-zoom suave, feixe de luz e canvas com clima/aurora/partículas em movimento)
 * - Inimigos Aleatórios por Fase (1, 2 ou até 3 inimigos com formação dinâmica)
 * - Fases Avançam SOMENTE quando TODOS os inimigos da fase forem derrotados
 * - Ultimate do Herói sem sobreposição (Botão dedicado acima do HUD, sem colidir com o quiz)
 * - Áudio Unificado (Inicialização direta no botão de Som [ON/OFF], sem banner flutuante)
 * - Inimigos com Mais Ataques e Golpes Supremos (com chance de 28% de errar e escrever "ERROU!" sobre o herói)
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CONFIGURAÇÕES VISUAIS: CENÁRIOS, INIMIGOS E HERÓIS
  // ============================================================================
  const THEMES_CONFIG = {
    castelo: {
      name: 'Castelo dos Dados',
      trackLabel: 'TRILHA: CASTELO DOS DADOS',
      musicKey: 'gothic_orchestra',
      bottomOffset: '18%',
      playerLeft: '13%',
      enemyPool: [
        { name: 'Guarda da Muralha', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 65, atk: 14, isFlying: false, type: 'fisico', ultName: 'Golpe de Ruína da Armadura' },
        { name: 'Spectre do Código', spriteFolder: 'assets/sprites/spectre', baseHp: 110, atk: 22, isFlying: false, type: 'magico', ultName: 'Chamas Negras da Corrupção' },
        { name: 'Acólito da Memória', spriteFolder: 'assets/sprites/mago', baseHp: 55, atk: 16, isFlying: false, type: 'magico', ultName: 'Vórtice dos Registradores' },
      ],
      phases: [
        { id: 1, name: 'Muralha e Portão dos Algoritmos', bgImg: 'assets/backgrounds/castelo_fase1_portao.jpg', weather: 'castle_embers' },
        { id: 2, name: 'Grande Salão dos Dados', bgImg: 'assets/backgrounds/castelo_fase2_salao.jpg', weather: 'castle_embers' },
        { id: 3, name: 'Catacumbas da Memória RAM', bgImg: 'assets/backgrounds/castelo_fase3_masmorra.jpg', weather: 'castle_embers' },
        { id: 4, name: 'Torre do Trono do Spectre', bgImg: 'assets/backgrounds/castelo_fase4_trono.jpg', weather: 'castle_embers' },
      ],
    },
    montanha: {
      name: 'Pico da Lógica',
      trackLabel: 'TRILHA: PICO DA LÓGICA',
      musicKey: 'viking_mountains',
      bottomOffset: '18%',
      playerLeft: '13%',
      enemyPool: [
        { name: 'Guerreiro da Geada', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 75, atk: 16, isFlying: false, type: 'fisico', ultName: 'Impacto Glacial Esmagador' },
        { name: 'Mago Cósmico do Pico', spriteFolder: 'assets/sprites/mago', baseHp: 120, atk: 25, isFlying: false, type: 'magico', ultName: 'Tempestade de Nevasca Cósmica' },
        { name: 'Espectro dos Ventos', spriteFolder: 'assets/sprites/spectre', baseHp: 60, atk: 18, isFlying: false, type: 'magico', ultName: 'Rajada Cortante do Ártico' },
      ],
      phases: [
        { id: 1, name: 'Encosta Nevada dos Vetores', bgImg: 'assets/backgrounds/montanha_fase1_encosta.jpg', weather: 'mountain_snow' },
        { id: 2, name: 'Desfiladeiro da Gravidade', bgImg: 'assets/backgrounds/montanha_fase2_desfiladeiro.jpg', weather: 'mountain_snow' },
        { id: 3, name: 'Caverna dos Cristais Lógicos', bgImg: 'assets/backgrounds/montanha_fase3_caverna.jpg', weather: 'mountain_snow' },
        { id: 4, name: 'Pico Cósmico da Lógica', bgImg: 'assets/backgrounds/montanha_fase4_pico.jpg', weather: 'mountain_snow' },
      ],
    },
    deserto: {
      name: 'Deserto Primordial',
      trackLabel: 'TRILHA: DESERTO PRIMORDIAL',
      musicKey: 'arabic_desert',
      bottomOffset: '18%',
      playerLeft: '13%',
      enemyPool: [
        { name: 'Guerreiro das Areias', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 70, atk: 15, isFlying: false, type: 'fisico', ultName: 'Fúria da Cimitarra Solar' },
        { name: 'Djinn das Tempestades', spriteFolder: 'assets/sprites/spectre', baseHp: 115, atk: 24, isFlying: false, type: 'magico', ultName: 'Ciclone do Sol Escaldante' },
        { name: 'Mago das Dunas', spriteFolder: 'assets/sprites/mago', baseHp: 60, atk: 18, isFlying: false, type: 'magico', ultName: 'Sepultamento do Arenito' },
      ],
      phases: [
        { id: 1, name: 'Dunas Escaldantes da Erosão', bgImg: 'assets/backgrounds/deserto_fase1_dunas.jpg', weather: 'desert_sand' },
        { id: 2, name: 'Oásis dos Fósseis Antigos', bgImg: 'assets/backgrounds/deserto_fase2_oasis.jpg', weather: 'desert_sand' },
        { id: 3, name: 'Templo Solar do Arenito', bgImg: 'assets/backgrounds/deserto_fase3_ruinas.jpg', weather: 'desert_sand' },
        { id: 4, name: 'Cratera da Tempestade Solar', bgImg: 'assets/backgrounds/deserto_fase4_cratera.jpg', weather: 'desert_sand' },
      ],
    },
    vila: {
      name: 'Vila Ancestral',
      trackLabel: 'TRILHA: VILA ANCESTRAL',
      musicKey: 'bard_village',
      bottomOffset: '18%',
      playerLeft: '13%',
      enemyPool: [
        { name: 'Cavaleiro Renegado', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 80, atk: 18, isFlying: false, type: 'fisico', ultName: 'Lâmina do Julgamento Cego' },
        { name: 'Lorde Decaído', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 125, atk: 26, isFlying: false, type: 'fisico', ultName: 'Golpe Quebra-Crânios' },
        { name: 'Ilusionista das Ruínas', spriteFolder: 'assets/sprites/mago', baseHp: 65, atk: 17, isFlying: false, type: 'magico', ultName: 'Espelhos do Caos Eterno' },
      ],
      phases: [
        { id: 1, name: 'Praça do Mercado das Crônicas', bgImg: 'assets/backgrounds/vila_fase1_mercado.jpg', weather: 'village_leaves' },
        { id: 2, name: 'Grande Arquivo e Biblioteca Arcana', bgImg: 'assets/backgrounds/vila_fase2_biblioteca.jpg', weather: 'village_leaves' },
        { id: 3, name: 'Cripta dos Filósofos', bgImg: 'assets/backgrounds/vila_fase3_cripta.jpg', weather: 'village_leaves' },
        { id: 4, name: 'Campanário do Cavaleiro', bgImg: 'assets/backgrounds/vila_fase4_campanario.jpg', weather: 'village_leaves' },
      ],
    },
    vazio_cosmico: {
      name: 'Vazio Cósmico',
      trackLabel: 'TRILHA: VAZIO CÓSMICO',
      musicKey: 'dark_void',
      bottomOffset: '18%',
      playerLeft: '13%',
      enemyPool: [
        { name: 'Arauto do Esquecimento', spriteFolder: 'assets/sprites/spectre', baseHp: 85, atk: 20, isFlying: false, type: 'magico', ultName: 'Aniquilação da Matéria' },
        { name: 'O Arquivista do Vazio', spriteFolder: 'assets/sprites/mago', baseHp: 150, atk: 30, isFlying: false, type: 'magico', ultName: 'Singularidade da Entropia' },
        { name: 'Cavaleiro da Entropia', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 90, atk: 22, isFlying: false, type: 'fisico', ultName: 'Corte da Dimensão Oculta' },
      ],
      phases: [
        { id: 1, name: 'Fragmentos dos Tomos Perdidos', bgImg: 'assets/backgrounds/vazio_fase1_fragmentos.jpg', weather: 'void_cosmic' },
        { id: 2, name: 'Nebulosa da Entropia Cósmica', bgImg: 'assets/backgrounds/vazio_fase2_nebulosa.jpg', weather: 'void_cosmic' },
        { id: 3, name: 'Singularidade do Infinito', bgImg: 'assets/backgrounds/vazio_fase3_singularidade.jpg', weather: 'void_cosmic' },
      ],
    },
  };

  const CHARACTERS_CONFIG = {
    samurai: {
      name: 'Kaito',
      spriteFolder: 'assets/sprites/samurai',
      attackSound: 'sword_slash',
      heavySound: 'sword_clash',
      skins: [
        { id: 'samurai_ronin', name: 'Kaito Ronin', cssClass: '', ultName: 'Dança das Mil Lâminas Sagradas', ultType: 'samurai_ronin' },
        { id: 'samurai_cyber_void', name: 'Kaito Cyber-Void', cssClass: 'skin-cyber-void', ultName: 'Julgamento Cyberpunk Omnislash', ultType: 'samurai_cyber' },
      ],
    },
    guerreiro: {
      name: 'Boran',
      spriteFolder: 'assets/sprites/cavaleiro',
      attackSound: 'heavy_impact',
      heavySound: 'shield_block',
      skins: [
        { id: 'guerreiro_templario', name: 'Boran da Ordem', cssClass: '', ultName: 'Investida Sagrada dos Céus', ultType: 'guerreiro_sagrado' },
        { id: 'guerreiro_berserker_lava', name: 'Boran Vulcânico', cssClass: 'skin-berserker-lava', ultName: 'Erupção Titânica de Magma', ultType: 'guerreiro_vulcanico' },
      ],
    },
    mago: {
      name: 'Valerius',
      spriteFolder: 'assets/sprites/mago',
      attackSound: 'magic_cast',
      heavySound: 'magic_impact',
      skins: [
        { id: 'mago_arcanista', name: 'Valerius Arcano', cssClass: '', ultName: 'Impacto do Meteoro Cósmico', ultType: 'mago_meteoro' },
        { id: 'mago_necromante_espectral', name: 'Valerius das Sombras', cssClass: 'skin-necromante', ultName: 'Vórtice do Apocalipse das Almas', ultType: 'mago_almas' },
      ],
    },
  };

  // ============================================================================
  // 2. SISTEMA DE ÁUDIO ORQUESTRAL REALISTA (SÍNTESE ACÚSTICA)
  // ============================================================================
  class RealisticOrchestralAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.timer = null;
      this.currentTrack = 'gothic_orchestra';
      this.step = 0;
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

          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);

          // Espacialidade e reverberação de concerto
          const delay1 = this.ctx.createDelay();
          delay1.delayTime.value = 0.22;
          const delayFeedback = this.ctx.createGain();
          delayFeedback.gain.value = 0.32;

          const delayFilter = this.ctx.createBiquadFilter();
          delayFilter.type = 'lowpass';
          delayFilter.frequency.value = 1400;

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
      this.init();
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stop();
      } else {
        this.start(this.currentTrack);
      }
      return !this.isMuted;
    }

    playGothicMovement(t, step) {
      const melody = [293.66, 349.23, 440.0, 415.3, 440.0, 349.23, 293.66, 277.18];
      const bassProg = [73.42, 73.42, 87.31, 87.31, 69.3, 69.3, 73.42, 73.42];
      const note = melody[step % melody.length];
      const bass = bassProg[Math.floor(step / 2) % bassProg.length];

      this.playAcousticPipeOrgan(note, t, 0.45, 0.16);
      if (step % 2 === 0) this.playWarmStrings(bass, t, 0.65, 0.22);
      if (step % 16 === 0) this.playTubularBell(146.83, t, 3.2, 0.3);
    }

    playArabicMovement(t, step) {
      const hijazOud = [293.66, 311.13, 369.99, 392.0, 369.99, 311.13, 293.66, 261.63];
      const note = hijazOud[step % hijazOud.length];
      this.playAcousticOud(note, t, 0.24, 0.25);
      if (step % 8 === 0) this.playWarmStrings(146.83, t, 1.8, 0.15);

      const r = [1, 0, 2, 0, 2, 1, 0, 2];
      if (r[step % r.length] === 1) this.playAcousticDarbukaDum(t, 0.22, 0.3);
      else if (r[step % r.length] === 2) this.playAcousticDarbukaTek(t, 0.08, 0.16);
    }

    playBardMovement(t, step) {
      const fluteMelody = [587.33, 659.25, 783.99, 880.0, 783.99, 659.25];
      const chords = [146.83, 196.0, 220.0, 164.81];
      const note = fluteMelody[step % fluteMelody.length];
      const chord = chords[Math.floor(step / 6) % chords.length];

      this.playAcousticFlute(note, t, 0.22, 0.22);
      if (step % 3 === 0) this.playAcousticPluck(chord, t, 0.45, 0.18);
    }

    playDarkVoidMovement(t, step) {
      this.playWarmSubBass(40.0, t, 1.2, 0.4);
      const pads = [[65.41, 92.5], [61.74, 87.31], [73.42, 103.83]];
      const pad = pads[Math.floor(step / 2) % pads.length];
      if (step % 2 === 0) {
        this.playWarmStrings(pad[0], t, 1.4, 0.16);
        this.playWarmStrings(pad[1], t, 1.4, 0.14);
      }
    }

    playVikingMovement(t, step) {
      const warRhythm = [1, 0, 1, 1, 0, 1, 0, 0];
      if (warRhythm[step % warRhythm.length] === 1) {
        this.playAcousticWarTaiko(t, 0.35, 0.55);
      }
      if (step % 8 === 0) {
        this.playGjallarhornCall(73.42, t, 1.8, 0.32);
        this.playGjallarhornCall(110.0, t, 1.8, 0.26);
      }
    }

    playWarmStrings(freq, time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.003, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);

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
      [1, 2].forEach((harmonic, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * harmonic, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(vol / (idx + 1.2), time + 0.08);
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

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);

      osc.start(time);
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
      [1, 2.76].forEach((ratio, i) => {
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

    playSFX(name) {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;

      switch (name) {
        case 'sword_slash':
        case 'slash':
          this.playAcousticOud(380, t, 0.1, 0.4);
          break;
        case 'sword_clash':
          this.playTubularBell(1100, t, 0.25, 0.35);
          break;
        case 'magic_cast':
          this.playAcousticFlute(660, t, 0.25, 0.35);
          break;
        case 'magic_impact':
          this.playAcousticWarTaiko(t, 0.28, 0.6);
          break;
        case 'heavy_impact':
        case 'hit':
          this.playAcousticWarTaiko(t, 0.22, 0.65);
          break;
        case 'shield_block':
          this.playTubularBell(350, t, 0.18, 0.45);
          break;
        case 'arrow_whoosh':
          this.playAcousticOud(280, t, 0.15, 0.3);
          break;
        case 'thunder_ultimate':
          this.playAcousticWarTaiko(t, 0.6, 0.85);
          this.playWarmSubBass(35, t, 0.8, 0.65);
          break;
        case 'crit':
          this.playTubularBell(1046, t, 0.3, 0.45);
          this.playAcousticWarTaiko(t, 0.25, 0.55);
          break;
        case 'qte_alert':
          this.playTubularBell(880, t, 0.12, 0.4);
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
  // 3. MOTOR PRINCIPAL DE BATALHA COM PROGRESSÃO CORRETA POR FASE
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

      // Elementos dos Inimigos (Múltiplos Slots com Visibilidade Dinâmica)
      this.enemySlots = [
        {
          wrapper: document.getElementById('enemy-0'),
          sprite: document.getElementById('enemy-0-sprite'),
          nameText: document.getElementById('enemy-0-name'),
          barFill: document.getElementById('enemy-0-hp-fill'),
          data: null,
          currentHp: 0,
          maxHp: 0,
          isAlive: false,
        },
        {
          wrapper: document.getElementById('enemy-1'),
          sprite: document.getElementById('enemy-1-sprite'),
          nameText: document.getElementById('enemy-1-name'),
          barFill: document.getElementById('enemy-1-hp-fill'),
          data: null,
          currentHp: 0,
          maxHp: 0,
          isAlive: false,
        },
        {
          wrapper: document.getElementById('enemy-2'),
          sprite: document.getElementById('enemy-2-sprite'),
          nameText: document.getElementById('enemy-2-name'),
          barFill: document.getElementById('enemy-2-hp-fill'),
          data: null,
          currentHp: 0,
          maxHp: 0,
          isAlive: false,
        },
      ];

      // Top Bar Elements
      this.missionTrackText = document.getElementById('mission-track-text');
      this.missionPhaseText = document.getElementById('mission-phase-text');
      this.bossTitleText = document.getElementById('boss-title-text');
      this.bossPhaseText = document.getElementById('boss-phase-text');
      this.bossBarFill = document.getElementById('boss-bar-fill');
      this.bossHpText = document.getElementById('boss-hp-text');

      // Top Action de Som
      this.btnAudioToggle = document.getElementById('btn-audio-toggle');
      this.audioBtnIcon = document.getElementById('audio-btn-icon');
      this.audioBtnText = document.getElementById('audio-btn-text');

      // Player HUD (Sem sobreposição)
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

      // Overlay Cinemático
      this.cinematicOverlay = document.getElementById('cinematic-overlay');
      this.ultimateBanner = document.getElementById('ultimate-banner');

      // Modais de Fim de Fase (Vitória e Derrota)
      this.phaseVictoryModal = document.getElementById('phase-victory-modal');
      this.victoryPhaseTitle = document.getElementById('victory-phase-title');
      this.victoryXpAmount = document.getElementById('victory-xp-amount');
      this.victoryStatEnemies = document.getElementById('victory-stat-enemies');
      this.victoryStatStreak = document.getElementById('victory-stat-streak');
      this.btnNextPhase = document.getElementById('btn-next-phase');
      this.phaseDefeatModal = document.getElementById('phase-defeat-modal');

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

      // QTE State e Cooldown
      this.qteActive = false;
      this.qteKeys = [];
      this.qteCurrentKeyIdx = 0;
      this.qteDuration = 2200;
      this.qteTimeRemaining = 0;
      this.qteTimerInterval = null;
      this.qteCallback = null;
      this.qteCooldown = false;

      // Perguntas
      this.questions = [];
      this.currentQuestionIdx = 0;

      // Partículas e FX
      this.floatingTexts = [];
      this.particles = [];
      this.cinematicSlashes = [];

      this.initEvents();
      this.loadGameData();
      this.startFxLoop();
    }

    initEvents() {
      // Inicializa áudio na primeira interação do usuário
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
        if (e.repeat) return;

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

      // Skin Selecionada no Perfil
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

      // Perguntas
      this.questions = raw?.perguntas && raw.perguntas.length > 0 ? raw.perguntas : [
        {
          enunciado: 'Qual a principal vantagem da computação em nuvem?',
          alternativas: ['Escalabilidade sob demanda', 'Custo fixo alto', 'Perda de controle', 'Necessidade de servidor físico local'],
          respostaCorreta: 'Escalabilidade sob demanda',
          indiceRespostaCorreta: 0,
          explicacao: 'A nuvem permite provisionar recursos sob demanda.',
        },
        {
          enunciado: 'O que caracteriza um banco de dados relacional (SQL)?',
          alternativas: ['Tabelas com chaves primárias e relacionamentos', 'Documentos JSON livres', 'Chaves e valores sem esquema', 'Grafos não estruturados'],
          respostaCorreta: 'Tabelas com chaves primárias e relacionamentos',
          indiceRespostaCorreta: 0,
          explicacao: 'Bancos relacionais organizam dados em tabelas estruturadas.',
        },
        {
          enunciado: 'Em arquitetura de microsserviços, qual a função de um API Gateway?',
          alternativas: ['Roteamento e segurança centralizados', 'Armazenar o banco de dados principal', 'Substituir a rede física', 'Eliminar requisições HTTP'],
          respostaCorreta: 'Roteamento e segurança centralizados',
          indiceRespostaCorreta: 0,
          explicacao: 'O Gateway unifica autenticação, rate limiting e roteamento.',
        },
      ];

      let initialPhase = 0;
      if (typeof raw?.ordem === 'number' && raw.ordem >= 1) {
        initialPhase = Math.max(0, (raw.ordem - 1) % 4);
      }

      this.currentThemePhase = initialPhase;
      this.applyTheme(this.activeTheme, initialPhase);
      this.applyHeroSkin();
      this.renderQuestion();
    }

    applyTheme(themeKey, phaseIndex = 0) {
      this.activeTheme = themeKey;
      const theme = THEMES_CONFIG[themeKey] || THEMES_CONFIG.castelo;

      this.setPhase(phaseIndex);

      if (this.soundtrack.ctx && !this.soundtrack.isMuted) {
        this.soundtrack.start(theme.musicKey);
      }
    }

    setPhase(phaseIdx) {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const maxPhases = theme.phases ? theme.phases.length : 1;
      const safeIdx = Math.max(0, Math.min(phaseIdx, maxPhases - 1));
      this.currentThemePhase = safeIdx;
      const phase = theme.phases ? theme.phases[safeIdx] : { name: theme.name, bgImg: theme.bgImg };

      // Fade de transição suave do background
      this.bgLayer.style.opacity = '0.35';
      setTimeout(() => {
        this.bgLayer.src = phase.bgImg;
        this.bgLayer.style.opacity = '1';
      }, 120);

      // Atualiza o Mission Badge
      if (this.missionTrackText) {
        this.missionTrackText.textContent = theme.trackLabel;
      }
      if (this.missionPhaseText) {
        this.missionPhaseText.textContent = `${phase.name} — Fase ${safeIdx + 1}/${maxPhases}`;
      }

      // Sorteia aleatoriamente a quantidade de inimigos (1, 2 ou 3) para esta fase!
      this.spawnRandomEnemiesForPhase(theme.enemyPool);

      // Posicionamento no terreno
      this.applyGrounding();

      this.addFloatingText(`FASE ${safeIdx + 1}: ${phase.name}!`, '#38bdf8', 683, 220);
    }

    spawnRandomEnemiesForPhase(pool) {
      // Sorteia 1, 2 ou 3 inimigos aleatoriamente
      const count = Math.floor(Math.random() * 3) + 1;

      // Reseta todos os slots
      this.enemySlots.forEach((slot) => {
        slot.isAlive = false;
        slot.wrapper.style.display = 'none';
        slot.wrapper.style.opacity = '1';
        slot.wrapper.style.transform = '';
      });

      if (count === 1) {
        // Apenas 1 Inimigo (Chefe Central Solitário)
        const eData = pool[1] || pool[0];
        const slot = this.enemySlots[1];
        slot.data = eData;
        slot.maxHp = Math.round(eData.baseHp * 1.35); // Chefe solo tem mais vida
        slot.currentHp = slot.maxHp;
        slot.isAlive = true;
        slot.wrapper.style.display = 'flex';
        slot.wrapper.style.right = '18%';
        slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
        slot.nameText.textContent = `👑 ${eData.name}`;
        slot.barFill.style.width = '100%';

        if (eData.isFlying) slot.wrapper.classList.add('is-flying');
        else slot.wrapper.classList.remove('is-flying');
      } else if (count === 2) {
        // 2 Inimigos (Vanguarda e Líder)
        const enemiesToUse = [pool[0], pool[1]];
        [0, 1].forEach((slotIdx, i) => {
          const eData = enemiesToUse[i];
          const slot = this.enemySlots[slotIdx];
          slot.data = eData;
          slot.maxHp = eData.baseHp;
          slot.currentHp = slot.maxHp;
          slot.isAlive = true;
          slot.wrapper.style.display = 'flex';
          slot.wrapper.style.right = slotIdx === 0 ? '25%' : '10%';
          slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
          slot.nameText.textContent = eData.name;
          slot.barFill.style.width = '100%';

          if (eData.isFlying) slot.wrapper.classList.add('is-flying');
          else slot.wrapper.classList.remove('is-flying');
        });
      } else {
        // 3 Inimigos (Esquadrão Completo)
        pool.slice(0, 3).forEach((eData, i) => {
          const slot = this.enemySlots[i];
          slot.data = eData;
          slot.maxHp = eData.baseHp;
          slot.currentHp = slot.maxHp;
          slot.isAlive = true;
          slot.wrapper.style.display = 'flex';
          slot.wrapper.style.right = i === 0 ? '28%' : i === 1 ? '17%' : '6%';
          slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
          slot.nameText.textContent = eData.name;
          slot.barFill.style.width = '100%';

          if (eData.isFlying) slot.wrapper.classList.add('is-flying');
          else slot.wrapper.classList.remove('is-flying');
        });
      }

      this.applyGrounding();
      this.updateTotalBossHUD();
    }

    applyGrounding() {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const bottom = theme.bottomOffset || '18%';
      const playerL = theme.playerLeft || '13%';

      this.playerWrapper.style.bottom = bottom;
      this.playerWrapper.style.left = playerL;

      if (this.enemySlots[0]?.wrapper) this.enemySlots[0].wrapper.style.bottom = bottom;
      if (this.enemySlots[1]?.wrapper) this.enemySlots[1].wrapper.style.bottom = bottom;
      if (this.enemySlots[2]?.wrapper) this.enemySlots[2].wrapper.style.bottom = bottom;
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

        // Animação de Ataque do Herói
        const attackGif = this.streak % 2 === 0 ? 'attack2.gif' : 'attack1.gif';
        this.playerSprite.src = `${char.spriteFolder}/${attackGif}`;
        this.playerWrapper.classList.add('actor-dash-strike');

        setTimeout(() => {
          this.soundtrack.playSFX(char.attackSound);
        }, 130);

        setTimeout(() => {
          this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
          this.playerWrapper.classList.remove('actor-dash-strike');
        }, 480);

        // O golpe atinge o primeiro inimigo vivo
        const target = this.getFirstAliveEnemy();
        if (target) {
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

        // Inimigo contra-ataca (com chance de errar ou desferir supremo!)
        this.executeEnemyTurn();

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

      slot.wrapper.classList.add('actor-enemy-recoil');
      setTimeout(() => {
        slot.wrapper.classList.remove('actor-enemy-recoil');
      }, 350);

      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      this.soundtrack.playSFX(isCrit ? 'crit' : char.heavySound);

      const rect = slot.wrapper.getBoundingClientRect();
      const containerRect = document.getElementById('game-container').getBoundingClientRect();
      const relX = rect.left - containerRect.left + 50;
      const relY = rect.top - containerRect.top + 60;
      this.addFloatingText(`-${dmg}`, isCrit ? '#facc15' : '#38bdf8', relX, relY, isCrit);

      this.updateTotalBossHUD();

      // Inimigo Derrotado
      if (slot.currentHp <= 0) {
        slot.isAlive = false;
        slot.wrapper.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        slot.wrapper.style.opacity = '0';
        slot.wrapper.style.transform = 'translateY(20px) scale(0.8)';
        this.addFloatingText(`${slot.data.name} DERROTADO!`, '#22c55e', relX, relY - 40, true);

        // REGRA CRÍTICA: As fases só avançam quando TODOS os inimigos daquela fase forem derrotados!
        const anyAlive = this.enemySlots.some((s) => s.isAlive);
        if (!anyAlive) {
          this.soundtrack.playSFX('victory');
          this.addFloatingText('VITÓRIA!', '#22c55e', 683, 330, true);
          this.showPhaseVictoryMenu();
        }
      }
    }

    executeEnemyTurn() {
      const aliveEnemies = this.enemySlots.filter((s) => s.isAlive);
      if (aliveEnemies.length === 0) return;

      const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      const isBoss = attacker === this.enemySlots[1];
      const isUltimate = (isBoss && Math.random() < 0.35) || Math.random() < 0.2;

      // Animação de ataque do inimigo
      attacker.sprite.src = `${attacker.data.spriteFolder}/${isUltimate ? 'attack2.gif' : 'attack1.gif'}`;
      attacker.wrapper.classList.add('actor-enemy-strike');
      if (isUltimate) attacker.wrapper.classList.add('actor-charge-glow');

      // Se for golpe supremo do inimigo, anuncia na tela
      if (isUltimate) {
        this.addFloatingText(`⚠️ SUPREMO: ${attacker.data.ultName.toUpperCase()}!`, '#ef4444', 683, 270, true);
        this.soundtrack.playSFX('thunder_ultimate');
      } else {
        setTimeout(() => {
          this.soundtrack.playSFX(attacker.data.type === 'magico' ? 'magic_impact' : 'heavy_impact');
        }, 160);
      }

      setTimeout(() => {
        attacker.sprite.src = `${attacker.data.spriteFolder}/idle.gif`;
        attacker.wrapper.classList.remove('actor-enemy-strike');
        attacker.wrapper.classList.remove('actor-charge-glow');
      }, 500);

      // REGRA: O inimigo tem 28% de chance de ERRAR o golpe no jogador!
      const enemyMissed = Math.random() < 0.28;

      if (enemyMissed) {
        // O Inimigo ERROU!
        this.soundtrack.playSFX('arrow_whoosh');
        this.playerWrapper.classList.add('actor-dodge');
        setTimeout(() => {
          this.playerWrapper.classList.remove('actor-dodge');
        }, 400);

        // Escreve "ERROU" em cima do jogador!
        this.addFloatingText('ERROU!', '#38bdf8', 250, 310, true);
        this.showFeedback('O inimigo errou o golpe! O herói esquivou perfeitamente!', '#38bdf8');
        return;
      }

      // Se acertou, verifica QTE defensivo ocasional
      const baseDmg = isUltimate ? Math.round(attacker.data.atk * 1.5) : attacker.data.atk;

      if (!this.qteCooldown && Math.random() < 0.3) {
        this.triggerQTE(['W', 'SPACE'], 'DEFESA RELÂMPAGO! [W] -> [ESPAÇO]!', (success) => {
          if (success) {
            this.soundtrack.playSFX('shield_block');
            this.addFloatingText('BLOQUEADO!', '#38bdf8', 250, 310, true);
          } else {
            this.damagePlayer(baseDmg);
          }
        });
      } else {
        this.damagePlayer(baseDmg);
      }
    }

    damagePlayer(dmg) {
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.soundtrack.playSFX('heavy_impact');
      this.addFloatingText(`-${dmg}`, '#ef4444', 250, 330, false);

      this.playerWrapper.classList.add('actor-recoil');
      setTimeout(() => {
        this.playerWrapper.classList.remove('actor-recoil');
      }, 350);

      this.updateHUD();

      if (this.playerHp <= 0) {
        this.soundtrack.playSFX('wrong');
        this.addFloatingText('DERROTA...', '#ef4444', 250, 330, true);
        if (typeof window.notificar_derrota_js === 'function') {
          window.notificar_derrota_js();
        }
        setTimeout(() => {
          if (this.phaseDefeatModal) {
            this.phaseDefeatModal.style.display = 'flex';
          }
        }, 1100);
      }
    }

    // ==========================================================================
    // 4B. MENUS DE FIM DE FASE (VITÓRIA E DERROTA COM GANHO DE XP)
    // ==========================================================================
    showPhaseVictoryMenu() {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const currentPhase = theme.phases ? theme.phases[this.currentThemePhase] : null;
      const phaseName = currentPhase ? currentPhase.name : `Fase ${this.currentThemePhase + 1}`;
      const isLastPhase = this.currentThemePhase + 1 >= theme.phases.length;

      // Cálculo do XP Ganho pelo Jogador
      const baseXP = 100;
      const enemyCount = this.enemySlots.filter((s) => s.data && s.wrapper.style.display !== 'none').length || 1;
      const streakBonus = Math.min(50, this.streak * 10);
      const earnedXP = baseXP + (enemyCount * 15) + streakBonus;

      if (this.victoryPhaseTitle) {
        this.victoryPhaseTitle.textContent = `${phaseName} — Concluída!`;
      }
      if (this.victoryXpAmount) {
        this.victoryXpAmount.textContent = `+${earnedXP} XP`;
      }
      if (this.victoryStatEnemies) {
        this.victoryStatEnemies.textContent = `${enemyCount} ${enemyCount > 1 ? 'Inimigos Derrotados' : 'Chefe Derrotado'}`;
      }
      if (this.victoryStatStreak) {
        this.victoryStatStreak.textContent = `Combo Streak: ${this.streak}`;
      }

      if (this.btnNextPhase) {
        if (isLastPhase) {
          this.btnNextPhase.innerHTML = '<span>Finalizar Trilha</span> <span>🏆</span>';
        } else {
          this.btnNextPhase.innerHTML = '<span>Avançar</span> <span class="btn-arrow">➔</span>';
        }
      }

      if (typeof window.notificar_vitoria_js === 'function') {
        window.notificar_vitoria_js();
      }

      setTimeout(() => {
        if (this.phaseVictoryModal) {
          this.phaseVictoryModal.style.display = 'flex';
        }
      }, 1000);
    }

    advanceToNextPhase() {
      if (this.phaseVictoryModal) this.phaseVictoryModal.style.display = 'none';
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      if (this.currentThemePhase + 1 < theme.phases.length) {
        this.setPhase(this.currentThemePhase + 1);
        this.renderQuestion();
      } else {
        this.exitBattle();
      }
    }

    repeatCurrentPhase() {
      if (this.phaseVictoryModal) this.phaseVictoryModal.style.display = 'none';
      if (this.phaseDefeatModal) this.phaseDefeatModal.style.display = 'none';
      this.playerHp = this.playerMaxHp;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.updateHUD();
      this.setPhase(this.currentThemePhase);
      this.renderQuestion();
    }

    exitBattle() {
      if (this.phaseVictoryModal) this.phaseVictoryModal.style.display = 'none';
      if (this.phaseDefeatModal) this.phaseDefeatModal.style.display = 'none';
      if (typeof window.jogar_voltar_js === 'function') {
        window.jogar_voltar_js();
      } else if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/trilha';
      }
    }

    updateTotalBossHUD() {
      let totalCurrent = 0;
      let totalMax = 0;
      let aliveCount = 0;

      this.enemySlots.forEach((s) => {
        if (s.data && s.wrapper.style.display !== 'none') {
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
      this.bossPhaseText.textContent = `${aliveCount} INIMIGO${aliveCount > 1 ? 'S' : ''}`;
    }

    chargeUltimate(val) {
      this.ultCharge = Math.min(100, this.ultCharge + val);
      this.isUltReady = this.ultCharge >= 100;
      this.btnUltimate.style.display = this.isUltReady ? 'block' : 'none';
      this.updateHUD();
    }

    // ==========================================================================
    // 4. GOLPE SUPREMO (ULTIMATE): 100% EXCLUSIVO E SEM SOBREPOSIÇÃO
    // ==========================================================================
    triggerUltimate() {
      if (!this.isUltReady) return;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.btnUltimate.style.display = 'none';
      this.updateHUD();

      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      const skin = char.skins[this.selectedSkinIndex] || char.skins[0];

      this.ultimateBanner.textContent = `⚡ ${skin.ultName.toUpperCase()}!`;
      this.cinematicOverlay.style.display = 'flex';

      this.playerSprite.src = `${char.spriteFolder}/full.gif`;
      this.playerWrapper.classList.add('actor-charge-glow');

      this.soundtrack.playSFX('thunder_ultimate');

      // Dispara efeito visual cinemático
      this.executeSkinUltimateVisuals(skin.ultType);

      // Causa dano massivo em todos os inimigos da fase
      setTimeout(() => {
        this.enemySlots.forEach((slot) => {
          if (slot.isAlive) {
            this.damageEnemy(slot, 95, true);
          }
        });
      }, 500);

      setTimeout(() => {
        this.cinematicOverlay.style.display = 'none';
        this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
        this.playerWrapper.classList.remove('actor-charge-glow');
      }, 1200);
    }

    executeSkinUltimateVisuals(ultType) {
      for (let i = 0; i < 9; i++) {
        setTimeout(() => {
          this.cinematicSlashes.push({
            x1: 200 + Math.random() * 900,
            y1: 150 + Math.random() * 450,
            x2: 400 + Math.random() * 900,
            y2: 250 + Math.random() * 450,
            color: ultType.includes('cyber') ? '#a855f7' : ultType.includes('vulcanico') ? '#f97316' : '#facc15',
            life: 0.35,
          });
        }, i * 55);
      }
    }

    // ==========================================================================
    // 5. QUICK TIME EVENT (QTE): FECHAMENTO IMEDIATO E ANTI-REPETIÇÃO
    // ==========================================================================
    triggerQTE(keys, label, callback) {
      if (this.qteCooldown) return;

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
          this.resolveQTE(true);
        }
      } else {
        this.resolveQTE(false);
      }
    }

    resolveQTE(success) {
      if (this.qteTimerInterval) {
        clearInterval(this.qteTimerInterval);
        this.qteTimerInterval = null;
      }

      this.qteActive = false;
      this.qteModal.style.display = 'none';

      this.qteCooldown = true;
      setTimeout(() => {
        this.qteCooldown = false;
      }, 8000);

      this.soundtrack.playSFX(success ? 'qte_success' : 'qte_fail');

      if (this.qteCallback) {
        const cb = this.qteCallback;
        this.qteCallback = null;
        cb(success);
      }
    }

    updateHUD() {
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

    // ==========================================================================
    // 6. CANVAS ANIMADO DINÂMICO (BACKGROUND VIVO E NÃO ESTÁTICO)
    // ==========================================================================
    startFxLoop() {
      let last = performance.now();

      // Posições das tochas da muralha e torres para a trilha do Castelo
      const CASTLE_TORCHES = [
        { x: 68, y: 330, s: 1.0 },
        { x: 395, y: 170, s: 0.85 },
        { x: 525, y: 410, s: 1.25 },
        { x: 808, y: 410, s: 1.25 },
        { x: 955, y: 245, s: 0.9 },
        { x: 1205, y: 325, s: 1.0 },
      ];

      // Bancos de névoa volumétrica móvel sob a ponte
      const fogBanks = [
        { x: 80, y: 550, rx: 240, ry: 50, vx: 22, alpha: 0.16 },
        { x: 440, y: 580, rx: 300, ry: 60, vx: 28, alpha: 0.20 },
        { x: 820, y: 545, rx: 260, ry: 55, vx: 20, alpha: 0.17 },
        { x: 1180, y: 575, rx: 320, ry: 65, vx: 26, alpha: 0.19 },
      ];

      // Vaga-lumes bioluminescentes para a Vila
      const fireflies = Array.from({ length: 42 }, () => ({
        x: Math.random() * 1366,
        y: Math.random() * 580 + 60,
        seed: Math.random() * 100,
        speed: Math.random() * 0.8 + 0.4,
        size: Math.random() * 2.5 + 1.8,
        color: Math.random() > 0.35 ? '#bef264' : '#fde047',
      }));

      // Folhas de outono para a Vila
      const autumnLeaves = Array.from({ length: 36 }, () => ({
        x: Math.random() * 1366,
        y: Math.random() * 768,
        vx: Math.random() * 35 + 20,
        vy: Math.random() * 45 + 30,
        va: Math.random() * 3 - 1.5,
        angle: Math.random() * Math.PI * 2,
        size: Math.random() * 5 + 4,
        color: ['#d97706', '#b45309', '#dc2626', '#ca8a04', '#65a30d'][Math.floor(Math.random() * 5)],
      }));

      // Estrelas cintilantes no céu alpino e cósmico
      const stars = Array.from({ length: 65 }, () => ({
        x: Math.random() * 1366,
        y: Math.random() * 320,
        r: Math.random() * 1.8 + 0.7,
        seed: Math.random() * 50,
      }));

      // Vórtice de acreção do Vazio Cósmico
      const voidVortex = Array.from({ length: 60 }, () => ({
        dist: Math.random() * 260 + 40,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.8 + 0.5,
        size: Math.random() * 3.5 + 1.5,
        color: ['#a855f7', '#38bdf8', '#c084fc', '#e0e7ff'][Math.floor(Math.random() * 4)],
      }));

      let lightningTimer = 8;
      let lightningFlash = 0;

      const loop = (now) => {
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        this.fxCtx.clearRect(0, 0, 1366, 768);

        const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
        const phase = theme.phases ? theme.phases[this.currentThemePhase] : null;
        const weather = phase ? phase.weather : 'castle_embers';

        // ----------------------------------------------------------------------
        // A. CENÁRIO: CASTELO DOS DADOS (Tochas com chamas, névoa e trovões)
        // ----------------------------------------------------------------------
        if (weather === 'castle_embers') {
          // 1. Tochas dinâmicas nas torres e portão
          CASTLE_TORCHES.forEach((t) => {
            const flicker = Math.sin(now * 0.012 + t.x * 0.1) * 0.2 + Math.cos(now * 0.024 + t.y * 0.1) * 0.14 + (Math.random() - 0.5) * 0.12;
            const currentScale = t.s * (1 + flicker * 0.22);

            // Halo radiante de luz quente
            const glowRadius = 55 * currentScale;
            const glow = this.fxCtx.createRadialGradient(t.x, t.y, 4, t.x, t.y, glowRadius);
            glow.addColorStop(0, `rgba(251, 146, 60, ${0.45 * (0.8 + flicker)})`);
            glow.addColorStop(0.45, `rgba(234, 88, 12, ${0.18 * (0.8 + flicker)})`);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.fxCtx.fillStyle = glow;
            this.fxCtx.beginPath();
            this.fxCtx.arc(t.x, t.y, glowRadius, 0, Math.PI * 2);
            this.fxCtx.fill();

            // Língua de fogo animada
            this.fxCtx.save();
            this.fxCtx.translate(t.x, t.y);
            this.fxCtx.fillStyle = '#f97316';
            this.fxCtx.beginPath();
            this.fxCtx.moveTo(0, 4 * currentScale);
            this.fxCtx.quadraticCurveTo(7 * currentScale, -5 * currentScale, (Math.random() - 0.5) * 3, -17 * currentScale);
            this.fxCtx.quadraticCurveTo(-7 * currentScale, -5 * currentScale, 0, 4 * currentScale);
            this.fxCtx.fill();

            // Núcleo branco-amarelado
            this.fxCtx.fillStyle = '#fef08a';
            this.fxCtx.beginPath();
            this.fxCtx.moveTo(0, 2 * currentScale);
            this.fxCtx.quadraticCurveTo(3.5 * currentScale, -3 * currentScale, 0, -10 * currentScale);
            this.fxCtx.quadraticCurveTo(-3.5 * currentScale, -3 * currentScale, 0, 2 * currentScale);
            this.fxCtx.fill();
            this.fxCtx.restore();

            // Emissão de fagulhas das tochas
            if (Math.random() < 0.25 && this.particles.length < 130) {
              this.particles.push({
                x: t.x + (Math.random() - 0.5) * 6,
                y: t.y - 10,
                vx: (Math.random() - 0.5) * 22,
                vy: -(Math.random() * 45 + 30),
                size: Math.random() * 2.8 + 1.2,
                color: Math.random() > 0.4 ? '#facc15' : '#f97316',
                alpha: 0.9,
                life: Math.random() * 1.8 + 1.2,
              });
            }
          });

          // 2. Névoa volumétrica móvel sobre o abismo sob a ponte
          fogBanks.forEach((f) => {
            f.x += f.vx * dt;
            if (f.x - f.rx > 1450) f.x = -f.rx - 50;

            this.fxCtx.save();
            this.fxCtx.translate(f.x, f.y);
            this.fxCtx.scale(1.6, 0.45);
            const fogGrad = this.fxCtx.createRadialGradient(0, 0, 20, 0, 0, f.rx);
            fogGrad.addColorStop(0, `rgba(148, 163, 184, ${f.alpha})`);
            fogGrad.addColorStop(0.6, `rgba(148, 163, 184, ${f.alpha * 0.4})`);
            fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.fxCtx.fillStyle = fogGrad;
            this.fxCtx.beginPath();
            this.fxCtx.arc(0, 0, f.rx, 0, Math.PI * 2);
            this.fxCtx.fill();
            this.fxCtx.restore();
          });

          // 3. Relâmpago periódico atmosférico
          lightningTimer -= dt;
          if (lightningTimer <= 0) {
            lightningFlash = 0.65;
            lightningTimer = Math.random() * 8 + 10;
          }
          if (lightningFlash > 0) {
            this.fxCtx.fillStyle = `rgba(224, 242, 254, ${lightningFlash * 0.35})`;
            this.fxCtx.fillRect(0, 0, 1366, 768);
            lightningFlash -= dt * 2.5;
          }
        }

        // ----------------------------------------------------------------------
        // B. CENÁRIO: PICO DA LÓGICA (Aurora Boreal 3 camadas e nevasca com gélidas rajadas)
        // ----------------------------------------------------------------------
        else if (weather === 'mountain_snow') {
          // 1. Estrelas cintilantes no céu alpino
          stars.forEach((s) => {
            const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.seed + now * 0.003));
            this.fxCtx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            this.fxCtx.beginPath();
            this.fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            this.fxCtx.fill();
          });

          // 2. Ondulações da Aurora Boreal (Verde Esmeralda e Violeta)
          const w1 = Math.sin(now * 0.0009) * 35;
          const w2 = Math.cos(now * 0.0013) * 25;

          this.fxCtx.save();
          // Fita 1: Verde Polar
          const g1 = this.fxCtx.createLinearGradient(0, 20, 0, 260);
          g1.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
          g1.addColorStop(0.5, 'rgba(52, 211, 153, 0.16)');
          g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.fxCtx.fillStyle = g1;
          this.fxCtx.beginPath();
          this.fxCtx.moveTo(0, 60 + w1);
          this.fxCtx.bezierCurveTo(400, 130 - w2, 850, 40 + w1, 1366, 80 - w2);
          this.fxCtx.lineTo(1366, 260);
          this.fxCtx.lineTo(0, 260);
          this.fxCtx.closePath();
          this.fxCtx.fill();

          // Fita 2: Violeta
          const g2 = this.fxCtx.createLinearGradient(0, 30, 0, 240);
          g2.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
          g2.addColorStop(0.6, 'rgba(192, 132, 252, 0.12)');
          g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.fxCtx.fillStyle = g2;
          this.fxCtx.beginPath();
          this.fxCtx.moveTo(0, 110 - w2);
          this.fxCtx.bezierCurveTo(450, 50 + w1, 950, 150 - w1, 1366, 70 + w2);
          this.fxCtx.lineTo(1366, 240);
          this.fxCtx.lineTo(0, 240);
          this.fxCtx.closePath();
          this.fxCtx.fill();

          // Fita 3: Cortina de raios de luz ciano
          const rayOffset = (now * 0.02) % 140;
          for (let rx = -50 + rayOffset; rx < 1400; rx += 140) {
            const rAlpha = 0.04 + 0.03 * Math.sin(rx + now * 0.002);
            const rGrad = this.fxCtx.createLinearGradient(rx, 30, rx, 250);
            rGrad.addColorStop(0, `rgba(56, 189, 248, ${rAlpha})`);
            rGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            this.fxCtx.fillStyle = rGrad;
            this.fxCtx.fillRect(rx, 30, 35, 220);
          }
          this.fxCtx.restore();

          // 3. Flocos de nevasca contínuos
          const wind = -130 - Math.sin(now * 0.002) * 60;
          if (this.particles.length < 120) {
            this.particles.push({
              x: Math.random() * 1500 - 50,
              y: -10,
              vx: wind + (Math.random() - 0.5) * 35,
              vy: Math.random() * 55 + 35,
              size: Math.random() * 3.8 + 1.8,
              color: '#ffffff',
              alpha: 0.88,
              life: Math.random() * 5 + 3,
            });
          }
        }

        // ----------------------------------------------------------------------
        // C. CENÁRIO: DESERTO PRIMORDIAL (Sol pulsante, miragem de calor e tempestade de areia)
        // ----------------------------------------------------------------------
        else if (weather === 'desert_sand') {
          // 1. Clarão solar no canto superior
          const sunRadius = 140 + Math.sin(now * 0.002) * 20;
          const sunGlow = this.fxCtx.createRadialGradient(1180, 90, 10, 1180, 90, sunRadius);
          sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          sunGlow.addColorStop(0.4, 'rgba(251, 191, 36, 0.16)');
          sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.fxCtx.fillStyle = sunGlow;
          this.fxCtx.beginPath();
          this.fxCtx.arc(1180, 90, sunRadius, 0, Math.PI * 2);
          this.fxCtx.fill();

          // 2. Ondas de calor sobre as dunas
          this.fxCtx.strokeStyle = 'rgba(251, 191, 36, 0.12)';
          this.fxCtx.lineWidth = 2;
          for (let ly = 420; ly <= 480; ly += 20) {
            this.fxCtx.beginPath();
            for (let lx = 0; lx <= 1366; lx += 40) {
              const heatY = ly + Math.sin(lx * 0.02 + now * 0.005) * 4;
              if (lx === 0) this.fxCtx.moveTo(lx, heatY);
              else this.fxCtx.lineTo(lx, heatY);
            }
            this.fxCtx.stroke();
          }

          // 3. Areia rápida varrendo da direita para esquerda
          if (this.particles.length < 130) {
            this.particles.push({
              x: 1366 + 10,
              y: Math.random() * 650 + 100,
              vx: -(Math.random() * 260 + 180),
              vy: (Math.random() - 0.45) * 35,
              size: Math.random() * 3 + 1.2,
              color: Math.random() > 0.4 ? '#f59e0b' : '#d97706',
              alpha: 0.8,
              life: Math.random() * 3.5 + 2,
            });
          }
        }

        // ----------------------------------------------------------------------
        // D. CENÁRIO: VILA ANCESTRAL (Vaga-lumes brilhantes e folhas caindo)
        // ----------------------------------------------------------------------
        else if (weather === 'village_leaves') {
          // 1. Vaga-lumes bioluminescentes
          fireflies.forEach((f) => {
            f.x += Math.sin(f.seed + now * 0.0018) * 1.5;
            f.y += Math.cos(f.seed * 1.3 + now * 0.0014) * 1.2;
            if (f.x < -20) f.x = 1386;
            if (f.x > 1386) f.x = -20;
            if (f.y < 30) f.y = 650;
            if (f.y > 670) f.y = 40;

            const alpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(f.seed * 4 + now * 0.004));

            const halo = this.fxCtx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.size * 6);
            halo.addColorStop(0, `rgba(190, 242, 100, ${alpha * 0.45})`);
            halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.fxCtx.fillStyle = halo;
            this.fxCtx.beginPath();
            this.fxCtx.arc(f.x, f.y, f.size * 6, 0, Math.PI * 2);
            this.fxCtx.fill();

            this.fxCtx.fillStyle = f.color;
            this.fxCtx.globalAlpha = alpha;
            this.fxCtx.beginPath();
            this.fxCtx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            this.fxCtx.fill();
            this.fxCtx.globalAlpha = 1.0;
          });

          // 2. Folhas de outono caindo e girando suavemente
          autumnLeaves.forEach((l) => {
            l.x += l.vx * dt + Math.sin(l.angle) * 25 * dt;
            l.y += l.vy * dt;
            l.angle += l.va * dt;

            if (l.y > 780 || l.x > 1400) {
              l.y = -20;
              l.x = Math.random() * 1366;
            }

            this.fxCtx.save();
            this.fxCtx.translate(l.x, l.y);
            this.fxCtx.rotate(l.angle);
            this.fxCtx.fillStyle = l.color;
            this.fxCtx.beginPath();
            this.fxCtx.ellipse(0, 0, l.size, l.size * 0.55, 0, 0, Math.PI * 2);
            this.fxCtx.fill();
            this.fxCtx.restore();
          });
        }

        // ----------------------------------------------------------------------
        // E. CENÁRIO: VAZIO CÓSMICO (Singularidade, horizonte de eventos e poeira estelar)
        // ----------------------------------------------------------------------
        else if (weather === 'void_cosmic') {
          // 1. Estrelas cósmicas
          stars.forEach((s) => {
            const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.seed + now * 0.0035));
            this.fxCtx.fillStyle = `rgba(224, 231, 255, ${twinkle})`;
            this.fxCtx.beginPath();
            this.fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            this.fxCtx.fill();
          });

          // 2. Vórtice de acreção da singularidade cósmica
          const cx = 683, cy = 310;
          voidVortex.forEach((v) => {
            v.angle += (140 / Math.max(30, v.dist)) * dt * v.speed;
            v.dist -= 14 * dt;
            if (v.dist < 22) v.dist = Math.random() * 260 + 80;

            const px = cx + Math.cos(v.angle) * v.dist * 1.8;
            const py = cy + Math.sin(v.angle) * v.dist * 0.65;

            this.fxCtx.fillStyle = v.color;
            this.fxCtx.globalAlpha = Math.min(1, v.dist / 80);
            this.fxCtx.beginPath();
            this.fxCtx.arc(px, py, v.size, 0, Math.PI * 2);
            this.fxCtx.fill();
          });
          this.fxCtx.globalAlpha = 1.0;

          // 3. Pulso radial do horizonte de eventos
          const vPulse = 45 + Math.sin(now * 0.003) * 8;
          const vGrad = this.fxCtx.createRadialGradient(cx, cy, 10, cx, cy, vPulse);
          vGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
          vGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.15)');
          vGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.fxCtx.fillStyle = vGrad;
          this.fxCtx.beginPath();
          this.fxCtx.arc(cx, cy, vPulse, 0, Math.PI * 2);
          this.fxCtx.fill();
        }

        // ----------------------------------------------------------------------
        // F. ATUALIZAÇÃO E RENDERIZAÇÃO DAS PARTÍCULAS ATIVAS
        // ----------------------------------------------------------------------
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;

          this.fxCtx.fillStyle = p.color;
          this.fxCtx.globalAlpha = Math.max(0, Math.min(1, p.alpha * (p.life / 2.5)));
          this.fxCtx.beginPath();
          this.fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.fxCtx.fill();

          if (p.life <= 0 || p.x < -30 || p.x > 1400 || p.y < -30 || p.y > 800) {
            this.particles.splice(i, 1);
          }
        }
        this.fxCtx.globalAlpha = 1.0;

        // ----------------------------------------------------------------------
        // G. CORTES DO GOLPE SUPREMO (Linhas Luminosas)
        // ----------------------------------------------------------------------
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

        // ----------------------------------------------------------------------
        // H. TEXTOS FLUTUANTES (Dano, Críticos e "ERROU!")
        // ----------------------------------------------------------------------
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