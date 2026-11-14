/**
 * ESTUDEMY RPG ENGINE - VERSÃO COMPLETA OVERHAUL
 * Integração de Sprites Reais, Backgrounds Temáticos, Trilha Sonora Sintetizada, Skins e QTEs
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CONFIGURAÇÕES VISUAIS: SPRITES, SKINS E CENÁRIOS EXCLUSIVOS POR FASE
  // ============================================================================
  const THEMES_CONFIG = {
    castelo: {
      name: 'Castelo dos Dados',
      defaultBoss: 'spectre',
      musicKey: 'battle',
      phases: [
        { id: 1, name: 'Muralha e Portão dos Algoritmos', bgImg: 'assets/backgrounds/castelo_fase1_portao.jpg', weather: 'embers' },
        { id: 2, name: 'Grande Salão dos Dados', bgImg: 'assets/backgrounds/castelo_fase2_salao.jpg', weather: 'embers' },
        { id: 3, name: 'Catacumbas da Memória RAM', bgImg: 'assets/backgrounds/castelo_fase3_masmorra.jpg', weather: 'embers' },
        { id: 4, name: 'Torre do Trono do Spectre', bgImg: 'assets/backgrounds/castelo_fase4_trono.jpg', weather: 'embers' },
      ],
    },
    montanha: {
      name: 'Pico da Lógica',
      defaultBoss: 'mago',
      musicKey: 'battle',
      phases: [
        { id: 1, name: 'Encosta Nevada dos Vetores', bgImg: 'assets/backgrounds/montanha_fase1_encosta.jpg', weather: 'snow' },
        { id: 2, name: 'Desfiladeiro da Gravidade', bgImg: 'assets/backgrounds/montanha_fase2_desfiladeiro.jpg', weather: 'snow' },
        { id: 3, name: 'Caverna dos Cristais Lógicos', bgImg: 'assets/backgrounds/montanha_fase3_caverna.jpg', weather: 'snow' },
        { id: 4, name: 'Pico Cósmico da Lógica', bgImg: 'assets/backgrounds/montanha_fase4_pico.jpg', weather: 'snow' },
      ],
    },
    deserto: {
      name: 'Deserto Primordial',
      defaultBoss: 'spectre',
      musicKey: 'battle',
      phases: [
        { id: 1, name: 'Dunas Escaldantes da Erosão', bgImg: 'assets/backgrounds/deserto_fase1_dunas.jpg', weather: 'sand' },
        { id: 2, name: 'Oásis dos Fósseis Antigos', bgImg: 'assets/backgrounds/deserto_fase2_oasis.jpg', weather: 'sand' },
        { id: 3, name: 'Templo Solar do Arenito', bgImg: 'assets/backgrounds/deserto_fase3_ruinas.jpg', weather: 'sand' },
        { id: 4, name: 'Cratera da Tempestade Solar', bgImg: 'assets/backgrounds/deserto_fase4_cratera.jpg', weather: 'sand' },
      ],
    },
    vila: {
      name: 'Vila Ancestral',
      defaultBoss: 'cavaleiro',
      musicKey: 'battle',
      phases: [
        { id: 1, name: 'Praça do Mercado das Crônicas', bgImg: 'assets/backgrounds/vila_fase1_mercado.jpg', weather: 'leaves' },
        { id: 2, name: 'Grande Arquivo e Biblioteca Arcana', bgImg: 'assets/backgrounds/vila_fase2_biblioteca.jpg', weather: 'leaves' },
        { id: 3, name: 'Cripta dos Filósofos', bgImg: 'assets/backgrounds/vila_fase3_cripta.jpg', weather: 'leaves' },
        { id: 4, name: 'Campanário do Cavaleiro', bgImg: 'assets/backgrounds/vila_fase4_campanario.jpg', weather: 'leaves' },
      ],
    },
    vazio_cosmico: {
      name: 'Vazio Cósmico',
      defaultBoss: 'chefe_final',
      musicKey: 'final_boss',
      phases: [
        { id: 1, name: 'Fragmentos dos Tomos Perdidos', bgImg: 'assets/backgrounds/vazio_fase1_fragmentos.jpg', weather: 'cosmic' },
        { id: 2, name: 'Nebulosa da Entropia Cósmica', bgImg: 'assets/backgrounds/vazio_fase2_nebulosa.jpg', weather: 'cosmic' },
        { id: 3, name: 'Singularidade do Infinito', bgImg: 'assets/backgrounds/vazio_fase3_singularidade.jpg', weather: 'cosmic' },
      ],
    },
  };

  const CHARACTERS_CONFIG = {
    samurai: {
      name: 'Kaito',
      spriteFolder: 'assets/sprites/samurai',
      skins: [
        { id: 'samurai_ronin', name: 'Kaito Ronin', cssClass: '', ultName: 'Dança das Mil Lâminas' },
        { id: 'samurai_cyber_void', name: 'Kaito Cyber-Void', cssClass: 'skin-cyber-void', ultName: 'Julgamento Omnislash' },
      ],
    },
    guerreiro: {
      name: 'Boran',
      spriteFolder: 'assets/sprites/cavaleiro',
      skins: [
        { id: 'guerreiro_templario', name: 'Boran da Ordem', cssClass: '', ultName: 'Investida Sagrada' },
        { id: 'guerreiro_berserker_lava', name: 'Boran Vulcânico', cssClass: 'skin-berserker-lava', ultName: 'Erupção Titânica' },
      ],
    },
    mago: {
      name: 'Valerius',
      spriteFolder: 'assets/sprites/mago',
      skins: [
        { id: 'mago_arcanista', name: 'Valerius Arcano', cssClass: '', ultName: 'Meteoro Cósmico' },
        { id: 'mago_necromante_espectral', name: 'Valerius das Sombras', cssClass: 'skin-necromante', ultName: 'Apocalipse das Almas' },
      ],
    },
    arqueira: {
      name: 'Lyra',
      spriteFolder: 'assets/sprites/arqueira',
      skins: [
        { id: 'arqueira_silvestre', name: 'Lyra dos Bosques', cssClass: '', ultName: 'Chuva de Flechas' },
        { id: 'arqueira_sniper_sonica', name: 'Lyra Railgun', cssClass: 'skin-sniper-sonica', ultName: 'Disparo Orbital Sônico' },
      ],
    },
  };

  const BOSSES_CONFIG = {
    spectre: {
      name: 'Spectre do Código',
      spriteFolder: 'assets/sprites/spectre',
      phases: [
        { name: 'Manifestação Ectoplasmática', hpMax: 100, barColor: '#38bdf8', atk: 18 },
      ],
    },
    cavaleiro: {
      name: 'Cavaleiro Decaído',
      spriteFolder: 'assets/sprites/cavaleiro',
      phases: [
        { name: 'Fase I: Postura Implacável', hpMax: 120, barColor: '#3b82f6', atk: 20 },
        { name: 'Fase II: Fúria da Armadura Quebrada', hpMax: 150, barColor: '#ef4444', atk: 30 },
      ],
    },
    mago: {
      name: 'Mago Corrompido',
      spriteFolder: 'assets/sprites/mago',
      phases: [
        { name: 'Fase I: Ilusão de Fórmulas', hpMax: 110, barColor: '#a855f7', atk: 22 },
        { name: 'Fase II: Tempestade de Caos', hpMax: 160, barColor: '#d946ef', atk: 34 },
      ],
    },
    chefe_final: {
      name: 'O Arquivista do Vazio',
      spriteFolder: 'assets/sprites/mago', // Usa sprite de mago com aura dourada
      phases: [
        { name: 'Fase I: Tomos Apagados', hpMax: 140, barColor: '#8b5cf6', atk: 24 },
        { name: 'Fase II: Fúria da Entropia', hpMax: 180, barColor: '#ef4444', atk: 36 },
        { name: 'Fase III: Singularidade Primordial', hpMax: 220, barColor: '#eab308', atk: 48 },
      ],
    },
  };

  // ============================================================================
  // 2. SISTEMA DE TRILHA SONORA & SFX COMPLETO (SINTETIZADOR MULTICANAL)
  // ============================================================================
  class SynthesizedSoundtrack {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.timer = null;
      this.currentTrack = 'battle';
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

    start(track = 'battle') {
      this.init();
      this.stop();
      this.currentTrack = track;
      if (this.isMuted) return;

      // Escalas de batalha empolgantes no estilo 16-bit
      const melodyBattle = [
        440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88,
        440, 523.25, 659.25, 783.99, 659.25, 523.25, 440, 392,
      ];
      const melodyBoss = [
        220, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94,
        220, 261.63, 329.63, 392.00, 329.63, 261.63, 220, 196,
      ];
      const bassBattle = [110, 110, 130.81, 130.81, 146.83, 146.83, 110, 110];

      const intervalMs = track === 'final_boss' ? 140 : 180;

      this.timer = setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const melody = track === 'final_boss' ? melodyBoss : melodyBattle;
        const note = melody[this.step % melody.length];
        const bassNote = bassBattle[Math.floor(this.step / 2) % bassBattle.length];

        // 1. Canal de Melodia Líder (Square wave com vibrato leve)
        this.playTone(note, t, 0.12, 'square', 0.12);

        // 2. Canal de Baixo Pulsante (Triangle wave)
        if (this.step % 2 === 0) {
          this.playTone(bassNote, t, 0.16, 'triangle', 0.22);
        }

        // 3. Canal de Percussão (Ruído branco como chimbal/caixa)
        if (this.step % 2 === 1) {
          this.playNoise(t, 0.05, 0.08);
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

    playTone(freq, time, duration, type, vol) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    playNoise(time, duration, vol) {
      if (!this.ctx || this.isMuted) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      noise.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + duration);
    }

    playSFX(name) {
      this.init();
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;

      if (name === 'slash') {
        this.playTone(340, t, 0.12, 'sawtooth', 0.4);
        this.playTone(180, t + 0.05, 0.15, 'sawtooth', 0.45);
      } else if (name === 'hit') {
        this.playTone(120, t, 0.18, 'sawtooth', 0.5);
        this.playNoise(t, 0.1, 0.35);
      } else if (name === 'crit') {
        this.playTone(880, t, 0.2, 'square', 0.45);
        this.playTone(140, t + 0.02, 0.25, 'sawtooth', 0.55);
      } else if (name === 'qte_alert') {
        this.playTone(700, t, 0.08, 'square', 0.4);
        this.playTone(1050, t + 0.07, 0.14, 'square', 0.45);
      } else if (name === 'qte_success') {
        this.playTone(523, t, 0.08, 'sine', 0.35);
        this.playTone(659, t + 0.08, 0.08, 'sine', 0.35);
        this.playTone(1046, t + 0.16, 0.25, 'triangle', 0.5);
      } else if (name === 'qte_fail') {
        this.playTone(220, t, 0.15, 'sawtooth', 0.4);
        this.playTone(160, t + 0.12, 0.22, 'sawtooth', 0.45);
      } else if (name === 'correct') {
        this.playTone(440, t, 0.09, 'sine', 0.35);
        this.playTone(659, t + 0.08, 0.2, 'sine', 0.45);
      } else if (name === 'wrong') {
        this.playTone(200, t, 0.18, 'sawtooth', 0.4);
        this.playTone(150, t + 0.12, 0.22, 'sawtooth', 0.45);
      } else if (name === 'victory') {
        this.playTone(523, t, 0.12, 'triangle', 0.4);
        this.playTone(659, t + 0.12, 0.12, 'triangle', 0.4);
        this.playTone(783, t + 0.24, 0.35, 'triangle', 0.55);
      }
    }
  }

  // ============================================================================
  // 3. CONTROLADOR COMPLETO DA BATALHA
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

      // HUD Elements
      this.phaseBannerText = document.getElementById('phase-banner-text');
      this.audioUnlockOverlay = document.getElementById('audio-unlock-overlay');
      this.bossTitleText = document.getElementById('boss-title-text');
      this.bossPhaseText = document.getElementById('boss-phase-text');
      this.bossBarFill = document.getElementById('boss-bar-fill');
      this.bossHpText = document.getElementById('boss-hp-text');
      this.playerHpFill = document.getElementById('player-hp-fill');
      this.playerHpNum = document.getElementById('player-hp-num');
      this.playerUltFill = document.getElementById('player-ult-fill');
      this.playerUltNum = document.getElementById('player-ult-num');
      this.btnUltimate = document.getElementById('btn-ultimate');
      this.btnSkinToggle = document.getElementById('btn-skin-toggle');
      this.btnAudioToggle = document.getElementById('btn-audio-toggle');

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

      // Estados
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
      this.qteDuration = 2200;
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
      // Inicia áudio na primeira interação
      const unlockAudio = () => {
        this.soundtrack.init();
        if (!this.soundtrack.timer && !this.soundtrack.isMuted) {
          this.soundtrack.start(THEMES_CONFIG[this.activeTheme].musicKey);
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

      const char = (raw?.personagem_selecionado || 'samurai').toLowerCase();
      if (char.includes('guerreiro') || char.includes('cavaleiro')) {
        this.selectedCharKey = 'guerreiro';
      } else if (char.includes('mago')) {
        this.selectedCharKey = 'mago';
      } else if (char.includes('arqueira')) {
        this.selectedCharKey = 'arqueira';
      } else {
        this.selectedCharKey = 'samurai';
      }

      const cenario = (raw?.cenario || 'castelo').toLowerCase();
      if (cenario.includes('montanha')) this.activeTheme = 'montanha';
      else if (cenario.includes('deserto')) this.activeTheme = 'deserto';
      else if (cenario.includes('vila')) this.activeTheme = 'vila';
      else if (cenario.includes('vazio') || cenario.includes('final')) this.activeTheme = 'vazio_cosmico';
      else this.activeTheme = 'castelo';

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

      this.applyTheme(this.activeTheme);
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
      if (this.btnAudioToggle) {
        this.btnAudioToggle.textContent = '🔊 Música: ON';
      }
      this.addFloatingText('ÁUDIO HABILITADO!', '#22c55e', 683, 220);
    }

    setPhase(phaseIdx) {
      const theme = THEMES_CONFIG[this.activeTheme] || THEMES_CONFIG.castelo;
      const maxPhases = theme.phases ? theme.phases.length : 1;
      const safeIdx = Math.max(0, Math.min(phaseIdx, maxPhases - 1));
      this.currentThemePhase = safeIdx;
      const phase = theme.phases ? theme.phases[safeIdx] : { name: theme.name, bgImg: theme.bgImg };

      // Transição suave de cenário com fade rápido
      this.bgLayer.style.opacity = '0.35';
      setTimeout(() => {
        this.bgLayer.src = phase.bgImg;
        this.bgLayer.style.opacity = '1';
      }, 120);

      // Atualiza botões de fase no topo
      for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`btn-fase-${i}`);
        if (btn) {
          btn.classList.toggle('active', i === safeIdx);
          btn.style.display = i < maxPhases ? 'inline-flex' : 'none';
        }
      }

      // Atualiza banner de fase e cenário
      if (this.phaseBannerText) {
        this.phaseBannerText.textContent = `${phase.name} — Fase ${safeIdx + 1}/${maxPhases}`;
      }

      this.addFloatingText(`CENÁRIO: ${phase.name}!`, '#38bdf8', 683, 220);
    }

    setCharacter(charKey) {
      if (!CHARACTERS_CONFIG[charKey]) return;
      this.selectedCharKey = charKey;
      this.selectedSkinIndex = 0;

      // Atualiza botões de personagens
      ['samurai', 'guerreiro', 'mago', 'arqueira'].forEach((c) => {
        const btn = document.getElementById(`btn-char-${c}`);
        if (btn) btn.classList.toggle('active', c === charKey);
      });

      this.applySkin();
      this.soundtrack.playSFX('slash');
    }

    applyTheme(themeKey, phaseIndex = 0) {
      this.activeTheme = themeKey;
      const theme = THEMES_CONFIG[themeKey] || THEMES_CONFIG.castelo;

      // Atualiza botões de tema na barra superior
      ['castelo', 'montanha', 'deserto', 'vila', 'vazio'].forEach((t) => {
        const btn = document.getElementById(`btn-theme-${t}`);
        if (btn) btn.classList.toggle('active', themeKey.includes(t));
      });

      // Aplica a fase solicitada com o cenário dedicado
      this.setPhase(phaseIndex);

      // Define o Boss temático
      this.selectedBossKey = theme.defaultBoss;
      this.setupBoss(this.selectedBossKey);

      // Inicia a música da trilha
      if (this.soundtrack.ctx && !this.soundtrack.isMuted) {
        this.soundtrack.start(theme.musicKey);
      }
    }

    setTheme(themeKey) {
      this.applyTheme(themeKey, 0);
    }

    setGameMode(modeKey) {
      this.gameMode = modeKey;
      ['campanha', 'speedrun', 'sobrevivencia', 'boss_rush'].forEach((m) => {
        const btn = document.getElementById(`btn-mode-${m}`);
        if (btn) btn.classList.toggle('active', m === modeKey);
      });

      if (modeKey === 'boss_rush') {
        this.setupBoss('chefe_final');
      }
      this.addFloatingText(`MODO: ${modeKey.toUpperCase()}!`, '#facc15', 683, 300);
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

      this.updateHUD();
      this.addFloatingText(`FASE ${idx + 1}: ${phase.name}!`, phase.barColor, 1020, 300);
    }

    cycleSkin() {
      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      this.selectedSkinIndex = (this.selectedSkinIndex + 1) % char.skins.length;
      this.applySkin();
      this.soundtrack.playSFX('slash');
    }

    applySkin() {
      const char = CHARACTERS_CONFIG[this.selectedCharKey];
      const skin = char.skins[this.selectedSkinIndex];

      // Remove classes antigas de skins e aplica a nova
      this.playerSprite.className = `actor-sprite ${skin.cssClass}`;
      this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
      this.playerNameplate.textContent = skin.name;
      if (this.btnSkinToggle) {
        this.btnSkinToggle.textContent = `👘 Skin: ${skin.name.split(' ')[1] || 'Padrão'}`;
      }

      this.addFloatingText(`SKIN ATIVADA: ${skin.name}!`, '#38bdf8', 340, 300);
    }

    toggleAudio() {
      const isPlaying = this.soundtrack.toggle();
      this.btnAudioToggle.textContent = isPlaying ? '🔊 Música: ON' : '🔇 Música: OFF';
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

        // Animação de Golpe do Herói (Lunge + Attack GIF)
        const char = CHARACTERS_CONFIG[this.selectedCharKey];
        this.playerSprite.src = `${char.spriteFolder}/attack1.gif`;
        this.playerWrapper.style.transform = 'translateX(55px)';

        setTimeout(() => {
          this.playerSprite.src = `${char.spriteFolder}/idle.gif`;
          this.playerWrapper.style.transform = 'translateX(0)';
        }, 450);

        // Chance de QTE em Streak
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

        // Animação de Contra-Ataque do Boss
        const boss = BOSSES_CONFIG[this.selectedBossKey];
        this.bossSprite.src = `${boss.spriteFolder}/attack1.gif`;
        this.bossWrapper.style.transform = 'translateX(-55px)';

        setTimeout(() => {
          this.bossSprite.src = `${boss.spriteFolder}/idle.gif`;
          this.bossWrapper.style.transform = 'translateX(0)';
        }, 450);

        const phase = boss.phases[this.currentPhaseIndex];
        this.damagePlayer(phase.atk);
        this.showFeedback(`Incorreto! Dica: ${q.explicacao || 'Revise a matéria.'}`, '#ef4444');
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
      this.soundtrack.playSFX(isCrit ? 'crit' : 'hit');
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

          // Avança também o cenário da trilha para a nova fase
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
      this.soundtrack.playSFX('hit');
      this.addFloatingText(`-${dmg}`, '#ef4444', 340, 360, false);

      // Flash do Jogador
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

      this.triggerQTE(['W', 'S', 'A', 'D', 'SPACE'], `GOLPE SUPREMO: ${skin.ultName}!`, (success) => {
        const dmg = success ? 110 : 55;
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
        this.soundtrack.playSFX('slash');
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
