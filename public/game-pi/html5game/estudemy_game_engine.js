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
        {
          name: 'Rei Spectre da Corrupção',
          spriteFolder: 'assets/sprites/spectre',
          baseHp: 225,
          atk: 34,
          isFlying: false,
          type: 'magico',
          isBoss: true,
          bossTier: 'supreme',
          attacks: [
            { name: 'Lança da Ruína de Dados', style: 'strike', sfx: 'sword_slash', color: '#8b5cf6' },
            { name: 'Vórtice da Matriz Corrompida', style: 'cast', sfx: 'magic_impact', color: '#ec4899' },
            { name: 'Sobrecarga de Registradores', style: 'leap', sfx: 'heavy_impact', color: '#f43f5e' },
          ],
          ultName: 'Chamas Negras da Corrupção Total',
          secondUltName: 'Execução Fatal: Kernel Panic (Fase 2)',
        },
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
        {
          name: 'Lorde da Geada',
          spriteFolder: 'assets/sprites/cavaleiro',
          baseHp: 155,
          atk: 28,
          isFlying: false,
          type: 'fisico',
          isBoss: true,
          attacks: [
            { name: 'Corte Glacial Rúnico', style: 'strike', sfx: 'sword_slash', color: '#38bdf8' },
            { name: 'Fissura de Gelo Cortante', style: 'leap', sfx: 'heavy_impact', color: '#0ea5e9' },
          ],
          ultName: 'Nevasca do Ártico Cósmico',
          secondUltName: 'Zero Absoluto Primordial (Fase 2)',
        },
        { name: 'Colosso de Magma', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 175, atk: 35, isFlying: false, type: 'fisico', ultName: 'Cataclismo Vulcânico' },
        { name: 'Valquíria das Tempestades', spriteFolder: 'assets/sprites/arqueira', baseHp: 110, atk: 28, isFlying: true, type: 'magico', ultName: 'Julgamento Celestial' },
        {
          name: 'Ignis, o Soberano do Magma',
          spriteFolder: 'assets/sprites/cavaleiro',
          baseHp: 245,
          atk: 37,
          isFlying: false,
          type: 'fisico',
          isBoss: true,
          bossTier: 'supreme',
          attacks: [
            { name: 'Garras Devoradoras de Magma', style: 'strike', sfx: 'sword_slash', color: '#f97316' },
            { name: 'Sopro Calcinante do Inferno', style: 'cast', sfx: 'magic_impact', color: '#ef4444' },
            { name: 'Fissura Sísmica Vulcânica', style: 'leap', sfx: 'heavy_impact', color: '#ea580c' },
          ],
          ultName: 'Cataclismo da Caldeira Cósmica',
          secondUltName: 'Despertar do Dragão do Fogo (Fase 2)',
        },
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
        {
          name: 'Arquimago Solar',
          spriteFolder: 'assets/sprites/mago',
          baseHp: 140,
          atk: 30,
          isFlying: false,
          type: 'magico',
          isBoss: true,
          attacks: [
            { name: 'Feixe de Plasma Solar', style: 'cast', sfx: 'magic_impact', color: '#eab308' },
            { name: 'Rajada de Fogo das Pirâmides', style: 'strike', sfx: 'sword_slash', color: '#f59e0b' },
          ],
          ultName: 'Tempestade da Supernova',
          secondUltName: 'Chamas Eternas de Heliópolis (Fase 2)',
        },
        { name: 'Sentinela das Areias', spriteFolder: 'assets/sprites/cavaleiro', baseHp: 130, atk: 24, isFlying: false, type: 'fisico', ultName: 'Maldição de Anúbis' },
        {
          name: 'Imperador Khepri-Ra',
          spriteFolder: 'assets/sprites/mago',
          baseHp: 235,
          atk: 36,
          isFlying: true,
          type: 'magico',
          isBoss: true,
          bossTier: 'supreme',
          attacks: [
            { name: 'Feixe Concentrado do Olho de Ra', style: 'cast', sfx: 'magic_impact', color: '#eab308' },
            { name: 'Tempestade de Areia Dourada', style: 'leap', sfx: 'heavy_impact', color: '#f59e0b' },
            { name: 'Lança Solar de Âmbar', style: 'strike', sfx: 'sword_slash', color: '#fcd34d' },
          ],
          ultName: 'Julgamento das Pirâmides Cósmicas',
          secondUltName: 'Grande Eclipse Solar da Morte (Fase 2)',
        },
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
        { name: 'Ladino das Sombras', spriteFolder: 'assets/sprites/arqueira', baseHp: 85, atk: 32, isFlying: false, type: 'fisico', ultName: 'Tempestade das Sombras' },
        {
          name: 'General Shogun Ronin Decaído',
          spriteFolder: 'assets/sprites/samurai',
          baseHp: 220,
          atk: 36,
          isFlying: false,
          type: 'fisico',
          isBoss: true,
          bossTier: 'supreme',
          attacks: [
            { name: 'Corte Relâmpago das Sombras', style: 'strike', sfx: 'sword_slash', color: '#e11d48' },
            { name: 'Dança das Lâminas Fantasmas', style: 'cast', sfx: 'thunder_ultimate', color: '#f43f5e' },
            { name: 'Shuriken Venenoso da Noite', style: 'strike', sfx: 'arrow_whoosh', color: '#10b981' },
          ],
          ultName: 'Julgamento da Lua Sangrenta',
          secondUltName: 'Corte Proibido: Mil Sombras (Fase 2)',
        },
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
        {
          name: 'Ceifador do Eclipse',
          spriteFolder: 'assets/sprites/spectre',
          baseHp: 165,
          atk: 33,
          isFlying: false,
          type: 'fisico',
          isBoss: true,
          attacks: [
            { name: 'Corte de Foice da Meia-Noite', style: 'strike', sfx: 'sword_slash', color: '#a855f7' },
            { name: 'Vórtice do Vácuo', style: 'cast', sfx: 'magic_impact', color: '#7c3aed' },
          ],
          ultName: 'Vórtice do Eclipse Sombrio',
          secondUltName: 'Singularidade da Foice Negra (Fase 2)',
        },
        { name: 'Arquivista Cósmico', spriteFolder: 'assets/sprites/mago', baseHp: 135, atk: 30, isFlying: true, type: 'magico', ultName: 'Colapso Gravitacional' },
        {
          name: 'Behemoth da Singularidade',
          spriteFolder: 'assets/sprites/spectre',
          baseHp: 260,
          atk: 39,
          isFlying: false,
          type: 'magico',
          isBoss: true,
          bossTier: 'supreme',
          attacks: [
            { name: 'Corte Dimensional de Vácuo', style: 'strike', sfx: 'sword_slash', color: '#a855f7' },
            { name: 'Tentáculos de Matéria Escura', style: 'cast', sfx: 'magic_impact', color: '#7c3aed' },
            { name: 'Pulsação Gravitacional Anômala', style: 'leap', sfx: 'heavy_impact', color: '#6366f1' },
          ],
          ultName: 'Colapso do Horizonte de Eventos',
          secondUltName: 'Dilaceração da Supernova Negra (Fase 2)',
        },
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
        { id: 'samurai_shogun_solar', name: 'Kaito Shogun Solar', cssClass: 'skin-shogun-solar', ultName: 'Corte do Dragão Solar', ultType: 'samurai_shogun' },
        { id: 'samurai_shinobi_sombra', name: 'Kaito Shinobi Sombrio', cssClass: 'skin-shinobi-sombra', ultName: 'Golpe Espectral do Eclipse', ultType: 'samurai_shinobi' },
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
    arqueira: {
      name: 'Lyra',
      spriteFolder: 'assets/sprites/arqueira',
      attackSound: 'arrow_shot',
      heavySound: 'arrow_volley',
      skins: [
        { id: 'arqueira_guardia', name: 'Lyra Sentinela', cssClass: '', ultName: 'Chuva das Estrelas Cadentes', ultType: 'arqueira_celeste' },
        { id: 'arqueira_cacadora_celeste', name: 'Lyra Cósmica', cssClass: 'skin-cacadora-celeste', ultName: 'Dança da Supernova Sagrada', ultType: 'arqueira_supernova' },
      ],
    },
    spectre: {
      name: 'Draven',
      spriteFolder: 'assets/sprites/spectre',
      attackSound: 'void_slash',
      heavySound: 'soul_burst',
      skins: [
        { id: 'spectre_paladino_sombrio', name: 'Draven da Meia-Noite', cssClass: '', ultName: 'Vórtice do Crepúsculo Eterno', ultType: 'spectre_crepusculo' },
        { id: 'spectre_senhor_abissal', name: 'Draven do Abismo', cssClass: 'skin-senhor-abissal', ultName: 'Colapso do Horizonte de Eventos', ultType: 'spectre_abissal' },
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

    playAcousticBowShot(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, time);
      osc.frequency.exponentialRampToValueAtTime(280, time + duration);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, time);
      filter.Q.setValueAtTime(3.5, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);
      osc.start(time);
      osc.stop(time + duration);
    }

    playAcousticVoidSlash(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, time);
      osc.frequency.exponentialRampToValueAtTime(110, time + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverbSend);
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
        case 'arrow_shot':
          this.playAcousticBowShot(t, 0.16, 0.5);
          break;
        case 'arrow_volley':
          this.playAcousticBowShot(t, 0.12, 0.4);
          this.playAcousticBowShot(t + 0.08, 0.16, 0.45);
          this.playTubularBell(1200, t + 0.1, 0.2, 0.35);
          break;
        case 'void_slash':
          this.playAcousticVoidSlash(t, 0.2, 0.48);
          break;
        case 'soul_burst':
          this.playAcousticWarTaiko(t, 0.32, 0.7);
          this.playWarmSubBass(45, t, 0.5, 0.6);
          break;
        case 'celestial_rain':
          this.playTubularBell(880, t, 0.4, 0.5);
          this.playTubularBell(1320, t + 0.12, 0.5, 0.6);
          this.playAcousticFlute(980, t + 0.2, 0.4, 0.45);
          break;
        case 'abyssal_oblivion':
          this.playAcousticWarTaiko(t, 0.7, 0.9);
          this.playWarmSubBass(28, t, 1.0, 0.85);
          this.playGjallarhornCall(75, t + 0.1, 0.6, 0.5);
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
      this.defeatPhaseTitle = document.getElementById('defeat-phase-title');
      this.defeatPhaseDesc = document.getElementById('defeat-phase-desc');

      // Badges dos Modos de Jogo (Speedrun, Torre Mortal Kombat, Boss Rush)
      this.speedrunTimerBadge = document.getElementById('speedrun-timer-badge');
      this.speedrunTimerNum = document.getElementById('speedrun-timer-num');
      this.towerFloorBadge = document.getElementById('tower-floor-badge');
      this.towerFloorNum = document.getElementById('tower-floor-num');
      this.bossRushBadge = document.getElementById('boss-rush-badge');
      this.bossRushNum = document.getElementById('boss-rush-num');
      this.speedrunTimerInterval = null;
      this.speedrunTimeRemaining = 50;
      this.towerFloor = 1;

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
      if (!raw && window.parent && window.parent !== window) {
        try {
          if (window.parent.gameData) raw = window.parent.gameData;
        } catch (e) {}
      }
      if (!raw) {
        try {
          const stored = sessionStorage.getItem('estudemy_game_data') || localStorage.getItem('estudemy_game_data');
          if (stored) raw = JSON.parse(stored);
        } catch (e) {}
      }

      this.currentTrilhaId = raw?.trilhaId || '';
      this.currentFaseId = raw?.faseId || '';
      this.fasesDaTrilha = Array.isArray(raw?.fasesDaTrilha) ? raw.fasesDaTrilha : [];
      this.currentFaseIndex = typeof raw?.phaseIndex === 'number' ? raw.phaseIndex : 0;
      this.modoJogo = (raw?.modoJogo || raw?.modo || 'campanha').toLowerCase().trim();

      // Prioridade absoluta para parâmetros da URL se presentes
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlModo = urlParams.get('modo');
        if (urlModo) {
          this.modoJogo = urlModo.toLowerCase().trim();
        }
        const urlTema = (urlParams.get('tema') || '').toLowerCase().trim();
        if (urlTema) {
          if (urlTema.includes('deserto')) this.activeTheme = 'deserto';
          else if (urlTema.includes('vila')) this.activeTheme = 'vila';
          else if (urlTema.includes('montanha')) this.activeTheme = 'montanha';
          else if (urlTema.includes('vazio') || urlTema.includes('cosmico')) this.activeTheme = 'vazio_cosmico';
          else if (urlTema.includes('castelo')) this.activeTheme = 'castelo';
        }
      } catch (e) {}

      // Herói Selecionado (Perfil do Usuário)
      const char = (raw?.personagem_selecionado || 'samurai').toLowerCase();
      if (char.includes('guerreiro') || char.includes('cavaleiro') || char.includes('boran')) {
        this.selectedCharKey = 'guerreiro';
      } else if (char.includes('mago') || char.includes('valerius')) {
        this.selectedCharKey = 'mago';
      } else if (char.includes('arqueira') || char.includes('lyra') || char.includes('archer')) {
        this.selectedCharKey = 'arqueira';
      } else if (char.includes('spectre') || char.includes('draven') || char.includes('algoz')) {
        this.selectedCharKey = 'spectre';
      } else {
        this.selectedCharKey = 'samurai';
      }

      // Skin Selecionada no Perfil
      const skinKey = (raw?.skin_selecionada || raw?.personagem_skin || '').toLowerCase();
      const heroConfig = CHARACTERS_CONFIG[this.selectedCharKey];
      const foundIdx = heroConfig.skins.findIndex((s) => s.id.toLowerCase() === skinKey || s.name.toLowerCase().includes(skinKey));
      this.selectedSkinIndex = foundIdx >= 0 ? foundIdx : 0;

      // Trilha / Cenário Temático (conectado à matéria e à trilha do app)
      const temaDirect = (raw?.trilhaTema || raw?.cenario || '').toLowerCase().trim();
      if (temaDirect === 'deserto' || temaDirect.includes('deserto')) {
        this.activeTheme = 'deserto';
      } else if (temaDirect === 'vila' || temaDirect.includes('vila')) {
        this.activeTheme = 'vila';
      } else if (temaDirect === 'montanha' || temaDirect.includes('montanha')) {
        this.activeTheme = 'montanha';
      } else if (temaDirect === 'vazio_cosmico' || temaDirect.includes('vazio') || temaDirect.includes('cosmico')) {
        this.activeTheme = 'vazio_cosmico';
      } else if (temaDirect === 'castelo' || temaDirect.includes('castelo')) {
        this.activeTheme = 'castelo';
      } else {
        const cenario = (raw?.trilha || raw?.materia || 'castelo').toLowerCase();
        if (cenario.includes('deserto') || cenario.includes('geo') || cenario.includes('hist')) {
          this.activeTheme = 'deserto';
        } else if (cenario.includes('vila') || cenario.includes('port') || cenario.includes('cien') || cenario.includes('lit') || cenario.includes('filo') || cenario.includes('bardo')) {
          this.activeTheme = 'vila';
        } else if (cenario.includes('montanha') || cenario.includes('mat') || (cenario.includes('fis') && !cenario.includes('geo')) || cenario.includes('calc')) {
          this.activeTheme = 'montanha';
        } else if (cenario.includes('vazio') || cenario.includes('cosmico')) {
          this.activeTheme = 'vazio_cosmico';
        } else {
          this.activeTheme = 'castelo';
        }
      }

      if (raw?.trilhaTitulo) {
        this.trackCustomTitle = `TRILHA: ${raw.trilhaTitulo.toUpperCase()}`;
      }

      // Determina a Fase da Trilha Temática
      let initialPhase = 0;
      if (typeof raw?.phaseIndex === 'number') {
        initialPhase = Math.max(0, raw.phaseIndex % 4);
      } else if (typeof raw?.ordem === 'number' && raw.ordem >= 1) {
        const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
        const total = theme.phases ? theme.phases.length : 4;
        initialPhase = Math.max(0, (raw.ordem - 1) % total);
      }

      this.currentThemePhase = initialPhase;

      // Perguntas pedagógicas conectadas à trilha e à fase
      if (raw?.perguntas && raw.perguntas.length > 0) {
        this.questions = raw.perguntas;
      } else {
        this.questions = this.getFallbackThematicQuestions(this.activeTheme, initialPhase);
      }

      this.currentQuestionIndex = 0;
      this.applyTheme(this.activeTheme, initialPhase);
      this.applyHeroSkin();
      this.renderQuestion();
    }

    getFallbackThematicQuestions(themeKey, phaseIndex) {
      const BANK = {
        castelo: [
          [
            { enunciado: 'Qual é a função básica de uma variável em um algoritmo?', alternativas: ['Armazenar dados na memória para processamento', 'Acelerar a placa de vídeo', 'Conectar à rede externa', 'Eliminar erros de sintaxe'], respostaCorreta: 'Armazenar dados na memória para processamento', indiceRespostaCorreta: 0 },
            { enunciado: 'O que representa uma estrutura condicional (if / else)?', alternativas: ['Um desvio de fluxo baseado em condição lógica', 'Uma repetição infinita de instruções', 'A conversão automática de números em texto', 'A exclusão de arquivos não utilizados'], respostaCorreta: 'Um desvio de fluxo baseado em condição lógica', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a principal vantagem da computação em nuvem?', alternativas: ['Escalabilidade sob demanda e alta disponibilidade', 'Custo fixo alto sem alteração', 'Necessidade obrigatória de servidor físico local', 'Perda de controle total sobre senhas'], respostaCorreta: 'Escalabilidade sob demanda e alta disponibilidade', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a complexidade média da busca binária em vetor ordenado?', alternativas: ['O(log n)', 'O(n²)', 'O(n!)', 'O(1)'], respostaCorreta: 'O(log n)', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'O que caracteriza um banco de dados relacional (SQL)?', alternativas: ['Tabelas com chaves primárias e relacionamentos', 'Documentos JSON livres sem esquema', 'Chaves e valores sem esquema', 'Grafos não estruturados'], respostaCorreta: 'Tabelas com chaves primárias e relacionamentos', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual comando SQL é utilizado para extrair dados de uma tabela?', alternativas: ['SELECT', 'INSERT', 'UPDATE', 'DROP'], respostaCorreta: 'SELECT', indiceRespostaCorreta: 0 },
            { enunciado: 'Para que serve uma Chave Estrangeira (Foreign Key)?', alternativas: ['Estabelecer vínculo de integridade entre duas tabelas', 'Criptografar senhas na tabela', 'Garantir chave primária não nula', 'Aumentar espaço de armazenamento'], respostaCorreta: 'Estabelecer vínculo de integridade entre duas tabelas', indiceRespostaCorreta: 0 },
            { enunciado: 'No SQL, qual cláusula filtra resultados agrupados por GROUP BY?', alternativas: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'], respostaCorreta: 'HAVING', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Qual estrutura opera no princípio LIFO (Last In, First Out)?', alternativas: ['Pilha (Stack)', 'Fila (Queue)', 'Vetor (Array)', 'Árvore Binária'], respostaCorreta: 'Pilha (Stack)', indiceRespostaCorreta: 0 },
            { enunciado: 'O que é um vazamento de memória (Memory Leak)?', alternativas: ['Memória alocada dinamicamente não liberada após o uso', 'Invasão que rouba arquivos confidenciais', 'Desligamento abrupto por queda de energia', 'Compactação excessiva de arquivos'], respostaCorreta: 'Memória alocada dinamicamente não liberada após o uso', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a vantagem de acesso médio de uma Tabela Hash?', alternativas: ['Acesso e busca em tempo constante médio O(1)', 'Ordenação alfabética automática', 'Consumo nulo de memória', 'Zero colisões garantido'], respostaCorreta: 'Acesso e busca em tempo constante médio O(1)', indiceRespostaCorreta: 0 },
            { enunciado: 'Em uma estrutura de Fila (Queue), como ocorrem as inserções e remoções?', alternativas: ['Primeiro a entrar é o primeiro a sair (FIFO)', 'Último a entrar é o primeiro a sair (LIFO)', 'Apenas no centro da lista', 'Em ordem alfabética aleatória'], respostaCorreta: 'Primeiro a entrar é o primeiro a sair (FIFO)', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Em arquitetura de microsserviços, qual a função de um API Gateway?', alternativas: ['Roteamento e segurança centralizados', 'Substituir banco de dados relacional', 'Eliminar a camada física de rede', 'Executar compilação em tempo real'], respostaCorreta: 'Roteamento e segurança centralizados', indiceRespostaCorreta: 0 },
            { enunciado: 'Nas propriedades ACID, o que significa Atomicidade?', alternativas: ['Transação executada por completo ou totalmente revertida', 'Dados gravados em memórias quânticas', 'Transações simultâneas isoladas', 'Dados persistentes após falha física'], respostaCorreta: 'Transação executada por completo ou totalmente revertida', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual padrão arquitetural separa leitura (queries) de escrita (commands)?', alternativas: ['CQRS', 'Monólito Clássico', 'MVC Puro', 'Singleton'], respostaCorreta: 'CQRS', indiceRespostaCorreta: 0 },
            { enunciado: 'O que caracteriza a Idempotência em uma API RESTful?', alternativas: ['Executar a mesma requisição múltiplas vezes produz o mesmo efeito', 'Requisição feita uma única vez por IP', 'Servidor gera chave nova a cada segundo', 'Respostas sempre em formato XML'], respostaCorreta: 'Executar a mesma requisição múltiplas vezes produz o mesmo efeito', indiceRespostaCorreta: 0 },
          ],
        ],
        montanha: [
          [
            { enunciado: 'Qual é o valor da raiz quadrada exata de 144?', alternativas: ['12', '14', '16', '10'], respostaCorreta: '12', indiceRespostaCorreta: 0 },
            { enunciado: 'Dada a função afim f(x) = 3x - 5, qual o valor numérico de f(4)?', alternativas: ['7', '9', '12', '17'], respostaCorreta: '7', indiceRespostaCorreta: 0 },
            { enunciado: 'Se uma armadura custa R$ 200,00 e recebe desconto de 15%, quanto custará?', alternativas: ['R$ 170,00', 'R$ 180,00', 'R$ 185,00', 'R$ 160,00'], respostaCorreta: 'R$ 170,00', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual é a soma dos ângulos internos de qualquer triângulo plano?', alternativas: ['180°', '360°', '90°', '270°'], respostaCorreta: '180°', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Pela 2ª Lei de Newton, a Força Resultante (F) é dada por:', alternativas: ['F = m × a (Massa vezes aceleração)', 'F = m / a', 'F = m + a', 'F = m × v²'], respostaCorreta: 'F = m × a (Massa vezes aceleração)', indiceRespostaCorreta: 0 },
            { enunciado: 'Um guerreiro percorre 180 km em exatamente 2 horas. Qual foi sua velocidade média?', alternativas: ['90 km/h', '100 km/h', '80 km/h', '120 km/h'], respostaCorreta: '90 km/h', indiceRespostaCorreta: 0 },
            { enunciado: 'O que diferencia uma grandeza vetorial de uma grandeza escalar?', alternativas: ['Vetores exigem módulo, direção e sentido', 'Escalares possuem apenas direção', 'Vetores não possuem representação numérica', 'Escalares existem apenas no vácuo'], respostaCorreta: 'Vetores exigem módulo, direção e sentido', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual o valor aproximado da aceleração da gravidade na Terra?', alternativas: ['9,8 m/s²', '1,6 m/s²', '24,8 m/s²', '300.000 km/s'], respostaCorreta: '9,8 m/s²', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Em um triângulo retângulo de catetos 3 e 4, a hipotenusa mede:', alternativas: ['5', '6', '7', '8'], respostaCorreta: '5', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual é o valor do seno de um ângulo de 30 graus?', alternativas: ['1/2 (0,5)', '√3/2', '1', '0'], respostaCorreta: '1/2 (0,5)', indiceRespostaCorreta: 0 },
            { enunciado: 'Como se calcula a área de um círculo em função do raio r?', alternativas: ['A = π × r²', 'A = 2 × π × r', 'A = π × r³', 'A = 4 × π × r²'], respostaCorreta: 'A = π × r²', indiceRespostaCorreta: 0 },
            { enunciado: 'Quantos vértices e faces possui um cubo regular?', alternativas: ['8 vértices e 6 faces', '6 vértices e 8 faces', '12 vértices e 6 faces', '8 vértices e 12 faces'], respostaCorreta: '8 vértices e 6 faces', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Na lógica booleana, a conjunção (A E B) só é verdadeira quando:', alternativas: ['Ambas as proposições A e B forem verdadeiras', 'Pelo menos uma for verdadeira', 'A for verdadeira e B for falsa', 'Ambas forem falsas'], respostaCorreta: 'Ambas as proposições A e B forem verdadeiras', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a probabilidade de obter a face 6 no lançamento de um dado comum?', alternativas: ['1/6 (aprox. 16,6%)', '1/2 (50%)', '1/3 (aprox. 33,3%)', '1/12 (aprox. 8,3%)'], respostaCorreta: '1/6 (aprox. 16,6%)', indiceRespostaCorreta: 0 },
            { enunciado: 'Na progressão geométrica (2, 4, 8, 16...), qual o valor da razão?', alternativas: ['2', '4', '8', '1'], respostaCorreta: '2', indiceRespostaCorreta: 0 },
            { enunciado: 'No cálculo diferencial, qual a derivada da função f(x) = x²?', alternativas: ['2x', 'x', '2', 'x³ / 3'], respostaCorreta: '2x', indiceRespostaCorreta: 0 },
          ],
        ],
        deserto: [
          [
            { enunciado: 'Qual agente natural é responsável pela formação e deslocamento das dunas?', alternativas: ['Ação eólica (ventos e transporte de sedimentos)', 'Erosão fluvial de rios subterrâneos', 'Abalos sísmicos contínuos do magma', 'Gravidade lunar'], respostaCorreta: 'Ação eólica (ventos e transporte de sedimentos)', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual camada sólida externa compõe a crosta rochosa da Terra?', alternativas: ['Litosfera', 'Astenosfera', 'Mesosfera', 'Núcleo Interno'], respostaCorreta: 'Litosfera', indiceRespostaCorreta: 0 },
            { enunciado: 'O que impulsiona o movimento das placas tectônicas terrestres?', alternativas: ['Correntes de convecção térmica de magma no manto', 'Rotação atmosférica de furacões', 'Magnetismo dos polos norte e sul', 'Pressão dos oceanos'], respostaCorreta: 'Correntes de convecção térmica de magma no manto', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual característica climática define os desertos áridos globais?', alternativas: ['Baixa pluviosidade e grande amplitude térmica diária', 'Chuvas constantes em todas as estações', 'Temperaturas congelantes estáveis', 'Umidade relativa do ar de 100%'], respostaCorreta: 'Baixa pluviosidade e grande amplitude térmica diária', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Qual processo converte luz solar, água e CO2 em glicose nas plantas?', alternativas: ['Fotossíntese', 'Respiração celular', 'Fermentação láctica', 'Quimiossíntese'], respostaCorreta: 'Fotossíntese', indiceRespostaCorreta: 0 },
            { enunciado: 'Em uma cadeia alimentar, como se chamam os seres que produzem seu próprio alimento?', alternativas: ['Produtores (Autótrofos)', 'Consumidores primários', 'Decompositores', 'Parasitas estritos'], respostaCorreta: 'Produtores (Autótrofos)', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual gás essencial é liberado para a atmosfera pela fotossíntese?', alternativas: ['Oxigênio (O₂)', 'Dióxido de carbono (CO₂)', 'Metano (CH₄)', 'Hélio (He)'], respostaCorreta: 'Oxigênio (O₂)', indiceRespostaCorreta: 0 },
            { enunciado: 'O que são fósseis no registro das ciências naturais?', alternativas: ['Restos ou vestígios petrificados de seres vivos pré-históricos', 'Minerais sintéticos industriais', 'Rochas magmáticas expelidas recentemente', 'Cristais de sal evaporados'], respostaCorreta: 'Restos ou vestígios petrificados de seres vivos pré-históricos', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Qual partícula atômica possui carga negativa e orbita o núcleo?', alternativas: ['Elétron', 'Próton', 'Nêutron', 'Pósitron'], respostaCorreta: 'Elétron', indiceRespostaCorreta: 0 },
            { enunciado: 'Na tabela periódica, qual elemento é representado pelo símbolo Fe?', alternativas: ['Ferro', 'Frâncio', 'Flúor', 'Irídio'], respostaCorreta: 'Ferro', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual é a fórmula molecular padrão da substância Água?', alternativas: ['H₂O', 'CO₂', 'NaCl', 'H₂O₂'], respostaCorreta: 'H₂O', indiceRespostaCorreta: 0 },
            { enunciado: 'Em soluções aquosas a 25°C, qual valor da escala de pH indica neutralidade?', alternativas: ['7', '0', '14', '1'], respostaCorreta: '7', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Qual molécula biológica carrega as instruções genéticas de todos os seres vivos?', alternativas: ['DNA', 'Glicose', 'Colesterol', 'Hemoglobina'], respostaCorreta: 'DNA', indiceRespostaCorreta: 0 },
            { enunciado: 'O que provoca o fenômeno luminoso das auroras boreais e austrais?', alternativas: ['Interação do vento solar com o campo magnético e atmosfera', 'Reflexo da luz nas calotas polares', 'Incêndios florestais nas taigas', 'Colisão de meteoritos na estratosfera'], respostaCorreta: 'Interação do vento solar com o campo magnético e atmosfera', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual planeta do Sistema Solar é conhecido como Planeta Vermelho?', alternativas: ['Marte', 'Júpiter', 'Vênus', 'Mercúrio'], respostaCorreta: 'Marte', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a principal fonte de energia que move o ciclo da água na Terra?', alternativas: ['A radiação emitida pelo Sol', 'O calor do núcleo terrestre', 'A força de atrito das marés', 'A eletricidade das nuvens'], respostaCorreta: 'A radiação emitida pelo Sol', indiceRespostaCorreta: 0 },
          ],
        ],
        vila: [
          [
            { enunciado: 'Em qual frase o uso da crase é plenamente CORRETO?', alternativas: ['Todos os sábios foram à biblioteca consultar tomos.', 'O mensageiro começou à cavalgar ao amanhecer.', 'Entregamos o pergaminho à ele com rapidez.', 'Eles caminharam passo à passo até a praça.'], respostaCorreta: 'Todos os sábios foram à biblioteca consultar tomos.', indiceRespostaCorreta: 0 },
            { enunciado: 'Assinale a alternativa com a concordância verbal padrão correta:', alternativas: ['Havia muitos cavaleiros reunidos na praça da vila.', 'Haviam muitos cavaleiros reunidos na praça da vila.', 'Fazem dez anos que a biblioteca foi fundada.', 'Devem de haver soluções melhores.'], respostaCorreta: 'Havia muitos cavaleiros reunidos na praça da vila.', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual sinal de pontuação introduz a fala de um personagem no diálogo direto?', alternativas: ['Travessão (—)', 'Reticências (...)', 'Ponto e vírgula (;)', 'Parênteses ()'], respostaCorreta: 'Travessão (—)', indiceRespostaCorreta: 0 },
            { enunciado: 'Na oração "Chegaram os sábios cronistas ao entardecer", qual é o sujeito?', alternativas: ['Os sábios cronistas', 'Ao entardecer', 'Chegaram', 'Oração sem sujeito'], respostaCorreta: 'Os sábios cronistas', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Qual figura de linguagem consiste no exagero intencional de uma ideia?', alternativas: ['Hipérbole', 'Eufemismo', 'Metonímia', 'Paradoxo'], respostaCorreta: 'Hipérbole', indiceRespostaCorreta: 0 },
            { enunciado: 'Quem escreveu as consagradas obras "Dom Casmurro" e "Memórias Póstumas"?', alternativas: ['Machado de Assis', 'José de Alencar', 'Clarice Lispector', 'Guimarães Rosa'], respostaCorreta: 'Machado de Assis', indiceRespostaCorreta: 0 },
            { enunciado: 'O que define a coesão textual em uma dissertação argumentativa?', alternativas: ['A articulação harmônica entre frases por conectivos e pronomes', 'O uso de margens padronizadas', 'A quantidade exata de páginas', 'A inserção de imagens coloridas'], respostaCorreta: 'A articulação harmônica entre frases por conectivos e pronomes', indiceRespostaCorreta: 0 },
            { enunciado: 'A qual grande período literário pertence a epopeia "Os Lusíadas", de Camões?', alternativas: ['Classicismo / Renascimento', 'Romantismo', 'Modernismo', 'Barroco'], respostaCorreta: 'Classicismo / Renascimento', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Qual filósofo grego imortalizou a máxima "Só sei que nada sei"?', alternativas: ['Sócrates', 'Platão', 'Aristóteles', 'Heráclito'], respostaCorreta: 'Sócrates', indiceRespostaCorreta: 0 },
            { enunciado: 'O que preconizava o movimento filosófico do Iluminismo no século XVIII?', alternativas: ['O predomínio da razão, da ciência e dos direitos individuais', 'A submissão absoluta ao dogma medieval', 'O fim de quaisquer leis escritas', 'A proibição do ensino público'], respostaCorreta: 'O predomínio da razão, da ciência e dos direitos individuais', indiceRespostaCorreta: 0 },
            { enunciado: 'Para Aristóteles, qual o objetivo supremo (Telos) de toda ação humana?', alternativas: ['Atingir a Felicidade e plenitude (Eudaimonia)', 'Acumular riquezas materiais ilimitadas', 'Vencer batalhas militares de conquista', 'Alcançar a imortalidade física'], respostaCorreta: 'Atingir a Felicidade e plenitude (Eudaimonia)', indiceRespostaCorreta: 0 },
            { enunciado: 'O que define o conceito moderno de Cidadania em uma democracia?', alternativas: ['O exercício pleno de direitos civis e cumprimento de deveres', 'Apenas residir em uma grande cidade', 'A posse obrigatória de títulos de nobreza', 'A isenção permanente de tributos'], respostaCorreta: 'O exercício pleno de direitos civis e cumprimento de deveres', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Em qual país e século teve início a Primeira Revolução Industrial?', alternativas: ['Inglaterra, no século XVIII', 'França, no século XVI', 'Alemanha, no século XIX', 'Estados Unidos, no século XVII'], respostaCorreta: 'Inglaterra, no século XVIII', indiceRespostaCorreta: 0 },
            { enunciado: 'O que caracterizou o Feudalismo na Europa durante a Idade Média?', alternativas: ['Economia agrária descentralizada e laços de suserania/vassalagem', 'Comércio digital internacional massivo', 'Poder centralizado por voto popular', 'Industrialização fabril automatizada'], respostaCorreta: 'Economia agrária descentralizada e laços de suserania/vassalagem', indiceRespostaCorreta: 0 },
            { enunciado: 'Em qual ano a ONU proclamou a Declaração Universal dos Direitos Humanos?', alternativas: ['1948', '1918', '1789', '2000'], respostaCorreta: '1948', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual lei sancionada em 1888 aboliu oficialmente a escravidão no Brasil?', alternativas: ['Lei Áurea', 'Lei do Ventre Livre', 'Lei dos Sexagenários', 'Lei Eusébio de Queirós'], respostaCorreta: 'Lei Áurea', indiceRespostaCorreta: 0 },
          ],
        ],
        vazio_cosmico: [
          [
            { enunciado: 'No pensamento computacional, o que significa Decomposição?', alternativas: ['Dividir um problema complexo em partes menores e tratáveis', 'Descartar permanentemente informações difíceis', 'Transformar código em texto simples', 'Repetir instruções até travar a máquina'], respostaCorreta: 'Dividir um problema complexo em partes menores e tratáveis', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a diferença crucial entre Correlação estatística e Causalidade?', alternativas: ['Correlação mostra variáveis oscilando juntas; causalidade prova causa e efeito', 'São expressões rigorosamente idênticas', 'Causalidade aplica-se apenas a finanças', 'Correlação nunca possui embasamento numérico'], respostaCorreta: 'Correlação mostra variáveis oscilando juntas; causalidade prova causa e efeito', indiceRespostaCorreta: 0 },
            { enunciado: 'Por que a interdisciplinaridade é essencial na resolução de problemas modernos?', alternativas: ['Porque os desafios reais do mundo integram tecnologia, humanidades e ciências', 'Para forçar memorização isolada de datas', 'Porque elimina o uso do raciocínio lógico', 'Apenas para economizar professores'], respostaCorreta: 'Porque os desafios reais do mundo integram tecnologia, humanidades e ciências', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Na teoria da informação e na física, o que expressa o conceito de Entropia?', alternativas: ['A medida do grau de incerteza, desordem ou informação de um sistema', 'A velocidade terminal de um corpo em queda', 'A tensão elétrica de uma hidrelétrica', 'A densidade de pixels de um display'], respostaCorreta: 'A medida do grau de incerteza, desordem ou informação de um sistema', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual o papel primordial da Ética no desenvolvimento de Inteligência Artificial?', alternativas: ['Prevenir vieses discriminatórios e proteger os direitos humanos', 'Impedir que computadores façam cálculos', 'Tornar computadores dependentes de engrenagens', 'Eliminar o acesso à internet aberta'], respostaCorreta: 'Prevenir vieses discriminatórios e proteger os direitos humanos', indiceRespostaCorreta: 0 },
            { enunciado: 'O que distingue a computação quântica da computação clássica?', alternativas: ['O uso de qubits com capacidade de superposição quântica', 'O funcionamento sem qualquer eletricidade', 'A previsão do futuro das pessoas com 100% de acerto', 'O uso de lâmpadas incandescentes'], respostaCorreta: 'O uso de qubits com capacidade de superposição quântica', indiceRespostaCorreta: 0 },
          ],
          [
            { enunciado: 'Em astrofísica, o que caracteriza uma Singularidade gravitacional?', alternativas: ['Uma região de densidade extrema onde as leis da física clássica colapsam', 'Uma estrela comum de oxigênio puro', 'Um planeta rochoso habitável no centro da galáxia', 'Um espelho cósmico que reflete estrelas'], respostaCorreta: 'Uma região de densidade extrema onde as leis da física clássica colapsam', indiceRespostaCorreta: 0 },
            { enunciado: 'Ao concluir sua jornada de aprendizado através de todas as trilhas, qual a missão de um mestre do conhecimento?', alternativas: ['Aplicar a sabedoria para melhorar a sociedade, ensinar os outros e seguir sempre aprendendo', 'Guardar todo o conhecimento trancado para si', 'Esquecer tudo ao chegar ao fim da jornada', 'Parar de questionar a realidade'], respostaCorreta: 'Aplicar a sabedoria para melhorar a sociedade, ensinar os outros e seguir sempre aprendendo', indiceRespostaCorreta: 0 },
            { enunciado: 'Qual a principal lição que o método científico nos ensina sobre os erros?', alternativas: ['Erros são hipóteses testadas que indicam caminhos de ajuste e evolução', 'Errar significa que se deve desistir de estudar', 'Os grandes cientistas nunca cometeram erros', 'Erros anulam a experiência anterior'], respostaCorreta: 'Erros são hipóteses testadas que indicam caminhos de ajuste e evolução', indiceRespostaCorreta: 0 },
          ],
        ],
      };

      const group = BANK[themeKey] || BANK.castelo;
      const safeIdx = Math.max(0, Math.min(phaseIndex, group.length - 1));
      return group[safeIdx];
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
        let label = theme.trackLabel;
        if (this.modoJogo === 'speedrun') {
          label += ' • ⚡ CONTRA O TEMPO';
        } else if (this.modoJogo === 'sobrevivencia') {
          label += ' • 🏰 TORRE DO SABER';
        } else if (this.modoJogo === 'boss_rush') {
          label += ' • 👑 ARENA DOS MESTRES';
        } else if (this.modoJogo === 'mundo_aberto' || this.modoJogo === 'livre') {
          label += ' • 🧭 MUNDO ABERTO (SEM XP)';
        }
        this.missionTrackText.textContent = label;
      }
      if (this.missionPhaseText) {
        this.missionPhaseText.textContent = phase.name;
      }

      // =========================================================================
      // GESTÃO DOS MODOS ESPECIAIS DE JOGO
      // =========================================================================

      // 1. MODO ATAQUE CONTRA O TEMPO (SPEEDRUN)
      // Timer na tela em contagem regressiva que vai diminuindo a cada fase
      if (this.speedrunTimerInterval) {
        clearInterval(this.speedrunTimerInterval);
        this.speedrunTimerInterval = null;
      }

      if (this.modoJogo === 'speedrun') {
        if (this.speedrunTimerBadge) this.speedrunTimerBadge.style.display = 'flex';
        // Reduz o tempo a cada fase: Fase 0 = 50s, Fase 1 = 40s, Fase 2 = 30s, Fase 3 = 20s (mínimo 15s)
        const initialSeconds = Math.max(15, 50 - safeIdx * 10);
        this.speedrunTimeRemaining = initialSeconds;
        if (this.speedrunTimerNum) {
          this.speedrunTimerNum.textContent = `${this.speedrunTimeRemaining}s`;
          this.speedrunTimerNum.classList.remove('timer-warning');
        }

        this.speedrunTimerInterval = setInterval(() => {
          if (this.playerHp <= 0 || (this.phaseVictoryModal && this.phaseVictoryModal.style.display === 'flex')) {
            clearInterval(this.speedrunTimerInterval);
            this.speedrunTimerInterval = null;
            return;
          }
          this.speedrunTimeRemaining--;
          if (this.speedrunTimerNum) {
            this.speedrunTimerNum.textContent = `${Math.max(0, this.speedrunTimeRemaining)}s`;
            if (this.speedrunTimeRemaining <= 10) {
              this.speedrunTimerNum.classList.add('timer-warning');
            } else {
              this.speedrunTimerNum.classList.remove('timer-warning');
            }
          }
          if (this.speedrunTimeRemaining <= 0) {
            clearInterval(this.speedrunTimerInterval);
            this.speedrunTimerInterval = null;
            this.handleSpeedrunTimeout();
          }
        }, 1000);
      } else {
        if (this.speedrunTimerBadge) this.speedrunTimerBadge.style.display = 'none';
      }

      // 2. MODO TORRE INFINITA (MORTAL KOMBAT STYLE)
      // Cada inimigo derrotado sobe um degrau; se morrer volta tudo
      if (this.modoJogo === 'sobrevivencia') {
        if (this.towerFloorBadge) this.towerFloorBadge.style.display = 'flex';
        let floor = 1;
        try {
          const rawFloor = sessionStorage.getItem('estudemy_tower_floor');
          if (rawFloor) floor = parseInt(rawFloor, 10);
        } catch (e) {}
        this.towerFloor = Math.max(1, isNaN(floor) ? 1 : floor);
        if (this.towerFloorNum) {
          this.towerFloorNum.textContent = `ANDAR ${this.towerFloor}`;
        }
      } else {
        if (this.towerFloorBadge) this.towerFloorBadge.style.display = 'none';
      }

      // 3. MODO ARENA DOS MESTRES (BOSS RUSH)
      // Apenas chefes. A cada fase começa com a mesma vida que terminou a anterior!
      if (this.modoJogo === 'boss_rush') {
        if (this.bossRushBadge) this.bossRushBadge.style.display = 'flex';
        if (this.bossRushNum) {
          this.bossRushNum.textContent = `CHEFE ${safeIdx + 1}/${maxPhases}`;
        }
        if (safeIdx === 0) {
          this.playerHp = this.playerMaxHp;
          try {
            sessionStorage.removeItem('estudemy_bossrush_hp');
          } catch (e) {}
        } else {
          try {
            const savedHp = sessionStorage.getItem('estudemy_bossrush_hp');
            if (savedHp !== null) {
              const parsedHp = parseInt(savedHp, 10);
              if (!isNaN(parsedHp) && parsedHp > 0) {
                this.playerHp = Math.min(this.playerMaxHp, parsedHp);
              }
            }
          } catch (e) {}
          this.addFloatingText(`VIDA PRESERVADA: ${this.playerHp} HP!`, '#f43f5e', 683, 260, true);
        }
        this.updateHUD();
      } else {
        if (this.bossRushBadge) this.bossRushBadge.style.display = 'none';
      }

      // Sorteia ou mantém fixos os inimigos para esta fase (não se altera no tentar novamente)
      this.spawnRandomEnemiesForPhase(theme.enemyPool);

      // Posicionamento no terreno
      this.applyGrounding();

      this.addFloatingText(`${phase.name}!`, '#38bdf8', 683, 220);
    }

    handleSpeedrunTimeout() {
      this.playerHp = 0;
      this.updateHUD();
      this.addFloatingText('TEMPO ESGOTADO!', '#ef4444', 683, 280, true);
      this.soundtrack.playSFX('hero_damage');
      if (typeof window.notificar_derrota_js === 'function') {
        window.notificar_derrota_js();
      }
      setTimeout(() => {
        if (this.phaseDefeatModal) {
          if (this.defeatPhaseTitle) {
            this.defeatPhaseTitle.textContent = 'TEMPO ESGOTADO!';
          }
          if (this.defeatPhaseDesc) {
            this.defeatPhaseDesc.textContent = 'O cronômetro zerou antes que você conseguisse derrotar todos os inimigos!';
          }
          this.phaseDefeatModal.style.display = 'flex';
        }
      }, 700);
    }

    spawnRandomEnemiesForPhase(pool) {
      // Garante que a quantidade de inimigos se repita e nunca aumente ao tentar novamente
      let count = 1;
      const phaseKey = `${this.currentTrilhaId || this.activeTheme}_fase_${this.currentThemePhase}`;
      this.phaseEnemyCounts = this.phaseEnemyCounts || {};

      if (this.phaseEnemyCounts[phaseKey] !== undefined) {
        count = this.phaseEnemyCounts[phaseKey];
      } else {
        try {
          const raw = sessionStorage.getItem('estudemy_phase_enemy_counts');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed[phaseKey] !== undefined) {
              count = parsed[phaseKey];
              this.phaseEnemyCounts[phaseKey] = count;
            }
          }
        } catch (e) {}
      }

      if (this.phaseEnemyCounts[phaseKey] === undefined) {
        if (this.modoJogo === 'boss_rush') {
          count = 1;
        } else {
          count = Math.floor(Math.random() * 3) + 1;
        }
        this.phaseEnemyCounts[phaseKey] = count;
        try {
          let allCounts = {};
          const raw = sessionStorage.getItem('estudemy_phase_enemy_counts');
          if (raw) allCounts = JSON.parse(raw);
          allCounts[phaseKey] = count;
          sessionStorage.setItem('estudemy_phase_enemy_counts', JSON.stringify(allCounts));
        } catch (e) {}
      }

      // Reseta todos os slots
      this.enemySlots.forEach((slot) => {
        slot.isAlive = false;
        slot.wrapper.style.display = 'none';
        slot.wrapper.style.opacity = '1';
        slot.wrapper.style.transform = '';
      });

      if (count === 1) {
        // Apenas 1 Inimigo (Chefe Central Solitário ou Boss Rush)
        let eData = pool.find((e) => e.isBoss) || pool[1] || pool[0];
        if (this.modoJogo === 'boss_rush') {
          const bosses = pool.filter((e) => e.isBoss);
          const safeIdx = Math.max(0, this.currentThemePhase - 1);
          if (bosses.length > 0) {
            eData = bosses[safeIdx % bosses.length];
          }
        }
        const slot = this.enemySlots[1];
        slot.data = eData;
        slot.maxHp = eData.isBoss ? Math.round(eData.baseHp * 1.6) : Math.round(eData.baseHp * 1.35);
        slot.currentHp = slot.maxHp;
        slot.phase2Activated = false;
        slot.wrapper.classList.remove('boss-phase2-enrage');
        slot.isAlive = true;
        slot.wrapper.style.display = 'flex';
        slot.wrapper.style.right = '18%';
        slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
        slot.nameText.textContent = eData.isBoss ? `☠️ CHEFÃO: ${eData.name}` : `👑 ${eData.name}`;
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
          slot.phase2Activated = false;
          slot.wrapper.classList.remove('boss-phase2-enrage');
          slot.isAlive = true;
          slot.wrapper.style.display = 'flex';
          slot.wrapper.style.right = slotIdx === 0 ? '25%' : '10%';
          slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
          slot.nameText.textContent = eData.isBoss ? `☠️ ${eData.name}` : eData.name;
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
          slot.phase2Activated = false;
          slot.wrapper.classList.remove('boss-phase2-enrage');
          slot.isAlive = true;
          slot.wrapper.style.display = 'flex';
          slot.wrapper.style.right = i === 0 ? '28%' : i === 1 ? '17%' : '6%';
          slot.sprite.src = `${eData.spriteFolder}/idle.gif`;
          slot.nameText.textContent = eData.isBoss ? `☠️ ${eData.name}` : eData.name;
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

        // Bônus de tempo no modo Speedrun (+3s por acerto)
        if (this.modoJogo === 'speedrun') {
          this.speedrunTimeRemaining += 3;
          if (this.speedrunTimerNum) {
            this.speedrunTimerNum.textContent = `${this.speedrunTimeRemaining}s`;
          }
          this.addFloatingText('+3s BÔNUS!', '#facc15', 683, 200, true);
        }

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

        // Penalidade de tempo no modo Speedrun (-5s por erro)
        if (this.modoJogo === 'speedrun') {
          this.speedrunTimeRemaining = Math.max(1, this.speedrunTimeRemaining - 5);
          if (this.speedrunTimerNum) {
            this.speedrunTimerNum.textContent = `${this.speedrunTimeRemaining}s`;
          }
          this.addFloatingText('-5s TEMPO!', '#ef4444', 683, 200, true);
        }

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

      // Se for Chefão e cair para <= 50% de HP, ativa FASE 2: FÚRIA DO CHEFÃO!
      if (slot.data && slot.data.isBoss && slot.currentHp > 0 && slot.currentHp <= slot.maxHp * 0.5 && !slot.phase2Activated) {
        slot.phase2Activated = true;
        slot.wrapper.classList.add('boss-phase2-enrage');
        this.soundtrack.playSFX('thunder_ultimate');
        this.addFloatingText('🔥 FASE 2: FÚRIA DO CHEFÃO DESPERTADA!', '#ef4444', 683, 190, true);
        this.showFeedback(`⚠️ O Chefão ${slot.data.name} entrou em FÚRIA (Fase 2)! Dano aumentado e novos golpes liberados!`, '#ef4444');
        const container = document.getElementById('game-container');
        if (container) {
          container.classList.add('screen-shake');
          setTimeout(() => container.classList.remove('screen-shake'), 450);
        }
      }

      // Inimigo Derrotado
      if (slot.currentHp <= 0) {
        slot.isAlive = false;
        slot.phase2Activated = false;
        slot.wrapper.classList.remove('boss-phase2-enrage');
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

    resetEnemyToIdle(slot) {
      if (!slot || !slot.wrapper || !slot.sprite) return;
      if (slot.attackTimer) {
        clearTimeout(slot.attackTimer);
        slot.attackTimer = null;
      }
      slot.wrapper.classList.remove('actor-enemy-strike', 'actor-charge-glow', 'actor-enemy-leap', 'actor-enemy-cast', 'actor-boss-supreme-strike');
      if (slot.isAlive && slot.data && slot.data.spriteFolder) {
        slot.sprite.src = `${slot.data.spriteFolder}/idle.gif`;
      }
      slot.isAttacking = false;
    }

    spawnMagicProjectile(attacker) {
      const proj = document.createElement('div');
      proj.style.position = 'absolute';
      proj.style.width = '24px';
      proj.style.height = '24px';
      proj.style.borderRadius = '50%';
      proj.style.background = 'radial-gradient(circle, #c084fc 20%, #7e22ce 80%)';
      proj.style.boxShadow = '0 0 20px #a855f7, 0 0 35px #9333ea';
      proj.style.zIndex = '8';
      proj.style.pointerEvents = 'none';
      proj.style.top = '52%';
      proj.style.left = '65%';
      proj.style.transition = 'all 0.38s cubic-bezier(0.2, 0.8, 0.2, 1)';
      document.getElementById('stage-arena')?.appendChild(proj);

      setTimeout(() => {
        proj.style.left = '20%';
        proj.style.transform = 'scale(1.4)';
      }, 20);

      setTimeout(() => {
        if (proj.parentNode) proj.parentNode.removeChild(proj);
      }, 400);
    }

    executeEnemyTurn() {
      const aliveEnemies = this.enemySlots.filter((s) => s.isAlive);
      if (aliveEnemies.length === 0) return;

      const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      if (!attacker || !attacker.data) return;

      // Limpa qualquer animação/timer anterior do atacante para não travar no meio do golpe
      this.resetEnemyToIdle(attacker);
      attacker.isAttacking = true;

      const isBoss = (attacker.data && attacker.data.isBoss) || attacker === this.enemySlots[1];
      const isPhase2 = !!attacker.phase2Activated;
      const hasCustomAttacks = attacker.data && Array.isArray(attacker.data.attacks) && attacker.data.attacks.length > 0;

      // Chefões têm probabilidade muito maior de lançar Supremos, especialmente na Fase 2!
      const isUltimate = (isBoss && (isPhase2 ? Math.random() < 0.55 : Math.random() < 0.35)) || Math.random() < 0.2;

      if (isUltimate) {
        // Golpe Supremo do Inimigo ou Chefão
        attacker.sprite.src = `${attacker.data.spriteFolder}/attack2.gif`;
        attacker.wrapper.classList.add('actor-charge-glow', isBoss ? 'actor-boss-supreme-strike' : 'actor-enemy-strike');

        let ultTitle = attacker.data.ultName || 'GOLPE SUPREMO';
        if (isPhase2 && attacker.data.secondUltName && Math.random() < 0.7) {
          ultTitle = attacker.data.secondUltName;
        }

        this.addFloatingText(`⚠️ SUPREMO ${isBoss ? 'DO CHEFÃO' : ''}: ${ultTitle.toUpperCase()}!`, '#ef4444', 683, 250, true);
        this.soundtrack.playSFX('thunder_ultimate');

        const container = document.getElementById('game-container');
        if (container) {
          container.classList.add('screen-shake');
          setTimeout(() => container.classList.remove('screen-shake'), 450);
        }
      } else if (isBoss && hasCustomAttacks) {
        // Repertório de Múltiplos Ataques Exclusivos de Chefão
        const chosenAtk = attacker.data.attacks[Math.floor(Math.random() * attacker.data.attacks.length)];
        const style = chosenAtk.style || 'strike';
        const color = chosenAtk.color || '#f97316';
        const sfx = chosenAtk.sfx || 'sword_slash';

        if (style === 'cast') {
          attacker.sprite.src = `${attacker.data.spriteFolder}/attack2.gif`;
          attacker.wrapper.classList.add('actor-enemy-cast');
          this.addFloatingText(`💥 ${chosenAtk.name.toUpperCase()}!`, color, 683, 260, false);
          setTimeout(() => {
            this.soundtrack.playSFX(sfx);
            this.spawnMagicProjectile(attacker);
          }, 180);
        } else if (style === 'leap') {
          attacker.sprite.src = `${attacker.data.spriteFolder}/attack1.gif`;
          attacker.wrapper.classList.add('actor-enemy-leap');
          this.addFloatingText(`🌋 ${chosenAtk.name.toUpperCase()}!`, color, 683, 260, false);
          setTimeout(() => {
            this.soundtrack.playSFX(sfx);
            const container = document.getElementById('game-container');
            if (container) {
              container.classList.add('screen-shake');
              setTimeout(() => container.classList.remove('screen-shake'), 380);
            }
          }, 220);
        } else {
          attacker.sprite.src = `${attacker.data.spriteFolder}/attack1.gif`;
          attacker.wrapper.classList.add('actor-enemy-strike');
          this.addFloatingText(`⚔️ ${chosenAtk.name.toUpperCase()}!`, color, 683, 260, false);
          setTimeout(() => {
            this.soundtrack.playSFX(sfx);
          }, 140);
        }
      } else {
        // Estilos Padrão para Inimigos Normais
        const attackStyle = Math.floor(Math.random() * 3);
        if (attackStyle === 2) {
          attacker.sprite.src = `${attacker.data.spriteFolder}/attack1.gif`;
          attacker.wrapper.classList.add('actor-enemy-leap');
          this.addFloatingText('ESMAGAMENTO SÍSMICO!', '#f97316', 683, 260, false);
          setTimeout(() => {
            this.soundtrack.playSFX('heavy_impact');
            const container = document.getElementById('game-container');
            if (container) {
              container.classList.add('screen-shake');
              setTimeout(() => container.classList.remove('screen-shake'), 380);
            }
          }, 220);
        } else if (attackStyle === 1) {
          attacker.sprite.src = `${attacker.data.spriteFolder}/attack2.gif`;
          attacker.wrapper.classList.add('actor-enemy-cast');
          this.addFloatingText('PROJÉTIL ARCANO!', '#a855f7', 683, 260, false);
          setTimeout(() => {
            this.soundtrack.playSFX('magic_impact');
            this.spawnMagicProjectile(attacker);
          }, 180);
        } else {
          attacker.sprite.src = `${attacker.data.spriteFolder}/attack1.gif`;
          attacker.wrapper.classList.add('actor-enemy-strike');
          this.addFloatingText('CORTE VELOZ!', '#38bdf8', 683, 260, false);
          setTimeout(() => {
            this.soundtrack.playSFX('sword_slash');
          }, 140);
        }
      }

      // Restaura o inimigo para IDLE com segurança total de timeout sem congelar
      attacker.attackTimer = setTimeout(() => {
        this.resetEnemyToIdle(attacker);
      }, 580);

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
      let baseDmg = isUltimate ? Math.round(attacker.data.atk * 1.6) : attacker.data.atk;
      if (isPhase2) {
        baseDmg = Math.round(baseDmg * 1.25); // Fúria da Fase 2 aumenta dano em +25%
      }

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
        if (this.speedrunTimerInterval) {
          clearInterval(this.speedrunTimerInterval);
          this.speedrunTimerInterval = null;
        }

        // No modo Torre Infinita (Mortal Kombat): se morrer volta tudo ao Andar 1!
        if (this.modoJogo === 'sobrevivencia') {
          try {
            sessionStorage.setItem('estudemy_tower_floor', '1');
          } catch (e) {}
          this.towerFloor = 1;
          if (this.towerFloorNum) {
            this.towerFloorNum.textContent = 'ANDAR 1';
          }
          if (this.defeatPhaseTitle) {
            this.defeatPhaseTitle.textContent = 'VOCÊ CAIU DA TORRE!';
          }
          if (this.defeatPhaseDesc) {
            this.defeatPhaseDesc.textContent = 'No Desafio Mortal Kombat, a derrota zera seu progresso e você volta ao primeiro andar!';
          }
        } else if (this.modoJogo === 'boss_rush') {
          try {
            sessionStorage.removeItem('estudemy_bossrush_hp');
          } catch (e) {}
          if (this.defeatPhaseTitle) {
            this.defeatPhaseTitle.textContent = 'O TITÃ TRIUNFOU!';
          }
          if (this.defeatPhaseDesc) {
            this.defeatPhaseDesc.textContent = 'Na Arena dos Mestres, a vida não se regenera! Tente novamente desde o início.';
          }
        }

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
      let earnedXP = baseXP + (enemyCount * 15) + streakBonus;

      // No modo mundo aberto / livre, não ganha XP
      if (this.modoJogo === 'mundo_aberto' || this.modoJogo === 'livre') {
        earnedXP = 0;
      }

      // Pausa timer do modo Speedrun ao vencer
      if (this.speedrunTimerInterval) {
        clearInterval(this.speedrunTimerInterval);
        this.speedrunTimerInterval = null;
      }

      // Regra Torre Infinita (Mortal Kombat): avança de andar e salva recorde
      if (this.modoJogo === 'sobrevivencia') {
        const nextFloor = (this.towerFloor || 1) + 1;
        this.towerFloor = nextFloor;
        try {
          sessionStorage.setItem('estudemy_tower_floor', nextFloor.toString());
          let rec = 1;
          const rawRec = localStorage.getItem('estudemy_tower_record');
          if (rawRec) rec = parseInt(rawRec, 10) || 1;
          if (nextFloor > rec) {
            localStorage.setItem('estudemy_tower_record', nextFloor.toString());
          }
        } catch (e) {}
      } else if (this.modoJogo === 'boss_rush') {
        // Regra Boss Rush: Preserva a vida restante para o próximo chefe!
        try {
          sessionStorage.setItem('estudemy_bossrush_hp', this.playerHp.toString());
        } catch (e) {}
      }

      if (this.victoryPhaseTitle) {
        if (this.modoJogo === 'sobrevivencia') {
          this.victoryPhaseTitle.textContent = `Andar ${this.towerFloor - 1} Vencido! Subindo para o Andar ${this.towerFloor}!`;
        } else if (this.modoJogo === 'boss_rush') {
          this.victoryPhaseTitle.textContent = `Chefe Derrotado! HP Restante: ${this.playerHp}/${this.playerMaxHp}`;
        } else {
          this.victoryPhaseTitle.textContent = `${phaseName} — Concluída!`;
        }
      }
      if (this.victoryXpAmount) {
        this.victoryXpAmount.textContent = earnedXP > 0 ? `+${earnedXP} XP` : '0 XP (Modo Livre)';
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

      // Salva progresso no localStorage instantaneamente de forma resiliente e offline-first por MODO DE JOGO
      try {
        let prefix = 'estudemy_progresso_trilha_';
        if (this.modoJogo === 'speedrun') {
          prefix = 'estudemy_progresso_speedrun_';
        } else if (this.modoJogo === 'boss_rush') {
          prefix = 'estudemy_progresso_boss_rush_';
        } else if (this.modoJogo === 'sobrevivencia') {
          prefix = 'estudemy_progresso_sobrevivencia_';
        }

        if (this.currentTrilhaId && this.currentFaseId && typeof window.localStorage !== 'undefined') {
          const key = prefix + this.currentTrilhaId;
          const rawLocal = window.localStorage.getItem(key);
          let list = [];
          if (rawLocal) {
            try { list = JSON.parse(rawLocal); } catch (e) {}
          }
          if (Array.isArray(list) && !list.includes(this.currentFaseId)) {
            list.push(this.currentFaseId);
            window.localStorage.setItem(key, JSON.stringify(list));
            console.log(`[GameEngine] Salvo progresso local (${this.modoJogo}) para fase:`, this.currentFaseId);
          }
        }
      } catch (e) {}

      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'FIM_FASE', vitoria: true, faseId: this.currentFaseId, trilhaId: this.currentTrilhaId, modo: this.modoJogo, earnedXP: earnedXP }, '*');
        }
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FIM_FASE', vitoria: true, faseId: this.currentFaseId, trilhaId: this.currentTrilhaId, modo: this.modoJogo, earnedXP: earnedXP }));
        }
      } catch (e) {}

      setTimeout(() => {
        if (this.phaseVictoryModal) {
          this.phaseVictoryModal.style.display = 'flex';
        }
      }, 1000);
    }

    advanceToNextPhase() {
      if (this.phaseVictoryModal) this.phaseVictoryModal.style.display = 'none';
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const nextThemePhase = this.currentThemePhase + 1;
      const maxPhases = (this.fasesDaTrilha && this.fasesDaTrilha.length > 0)
        ? this.fasesDaTrilha.length
        : (theme.phases ? theme.phases.length : 1);

      if (nextThemePhase < maxPhases) {
        // Regra Boss Rush: A cada fase começa com a mesma vida que terminou a anterior!
        // Nos outros modos, restaura normalmente para 100%
        if (this.modoJogo !== 'boss_rush') {
          this.playerHp = this.playerMaxHp;
        }
        this.updateHUD();

        const themePhaseIdx = nextThemePhase % (theme.phases ? theme.phases.length : 1);
        this.setPhase(themePhaseIdx);

        // Atualiza o ID da fase ativa para a próxima fase da trilha
        let nextFaseId = '';
        if (this.fasesDaTrilha && this.fasesDaTrilha[nextThemePhase]) {
          this.currentFaseId = this.fasesDaTrilha[nextThemePhase]._id;
          nextFaseId = this.currentFaseId;
        }

        // Prioriza perguntas cadastradas pelo professor para a próxima fase da trilha
        if (this.fasesDaTrilha && this.fasesDaTrilha[nextThemePhase] && Array.isArray(this.fasesDaTrilha[nextThemePhase].perguntas) && this.fasesDaTrilha[nextThemePhase].perguntas.length > 0) {
          this.questions = this.fasesDaTrilha[nextThemePhase].perguntas;
        } else {
          this.questions = this.getFallbackThematicQuestions(this.activeTheme, themePhaseIdx);
        }
        this.currentQuestionIdx = 0;
        this.renderQuestion();

        // Notifica o app pai que avançou diretamente para a próxima fase
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'AVANCAR_FASE', nextFaseId: nextFaseId, phaseIndex: nextThemePhase }, '*');
          }
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AVANCAR_FASE', nextFaseId: nextFaseId, phaseIndex: nextThemePhase }));
          }
        } catch (e) {}
      } else {
        this.exitBattle();
      }
    }

    repeatCurrentPhase() {
      if (this.phaseVictoryModal) this.phaseVictoryModal.style.display = 'none';
      if (this.phaseDefeatModal) this.phaseDefeatModal.style.display = 'none';

      // Reseta vida e variáveis do modo
      if (this.modoJogo === 'boss_rush') {
        this.playerHp = this.playerMaxHp;
        try {
          sessionStorage.removeItem('estudemy_bossrush_hp');
        } catch (e) {}
      } else if (this.modoJogo === 'sobrevivencia') {
        this.playerHp = this.playerMaxHp;
        this.towerFloor = 1;
        try {
          sessionStorage.setItem('estudemy_tower_floor', '1');
        } catch (e) {}
      } else {
        this.playerHp = this.playerMaxHp;
      }

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
      }
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'VOLTAR_TRILHA', trilhaId: this.currentTrilhaId }, '*');
        }
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VOLTAR_TRILHA', trilhaId: this.currentTrilhaId }));
        }
      } catch (e) {}
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

      if (this.selectedCharKey === 'arqueira') {
        this.soundtrack.playSFX('celestial_rain');
      } else if (this.selectedCharKey === 'spectre') {
        this.soundtrack.playSFX('abyssal_oblivion');
      } else {
        this.soundtrack.playSFX('thunder_ultimate');
      }

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
      if (ultType.includes('arqueira') || ultType.includes('celeste') || ultType.includes('supernova')) {
        // Chuva celestial de flechas de luz estelar
        for (let i = 0; i < 16; i++) {
          setTimeout(() => {
            const startX = 150 + Math.random() * 850;
            this.cinematicSlashes.push({
              x1: startX,
              y1: -10,
              x2: startX + 160 + (Math.random() - 0.5) * 80,
              y2: 460 + Math.random() * 220,
              color: ultType.includes('supernova') ? '#38bdf8' : '#fef08a',
              life: 0.42,
            });
          }, i * 40);
        }
      } else if (ultType.includes('spectre') || ultType.includes('abissal') || ultType.includes('crepusculo')) {
        // Fendas dimensionais e cortes do horizonte de eventos
        for (let i = 0; i < 14; i++) {
          setTimeout(() => {
            const cx = 350 + Math.random() * 600;
            const cy = 180 + Math.random() * 380;
            this.cinematicSlashes.push({
              x1: cx - 160,
              y1: cy + (Math.random() - 0.5) * 100,
              x2: cx + 160,
              y2: cy + (Math.random() - 0.5) * 100,
              color: ultType.includes('abissal') ? '#a855f7' : '#f43f5e',
              life: 0.45,
            });
          }, i * 45);
        }
      } else {
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