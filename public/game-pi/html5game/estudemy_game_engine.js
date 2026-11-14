/**
 * ESTUDEMY OVERHAULED GAME ENGINE
 * Motor de Jogo Pedagógico Completo (Web Audio + Canvas 2D + QTE + Multi-Bosses + Modos de Jogo)
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. DADOS DE PERSONAGENS, SKINS E MODOS
  // ============================================================================
  const SKINS_CONFIG = {
    samurai_ronin: {
      name: 'Kaito Ronin',
      char: 'samurai',
      primaryColor: '#0ea5e9',
      accentColor: '#38bdf8',
      auraColor: 'rgba(14, 165, 233, 0.4)',
      atkBonus: 0,
      critRate: 0.25,
      moves: ['Corte de Katana (Iaijutsu)', 'Estocada da Flor de Lótus', 'Dança das Mil Lâminas'],
      qtePattern: ['A', 'D', 'SPACE'],
    },
    samurai_cyber_void: {
      name: 'Kaito Cyber-Void',
      char: 'samurai',
      primaryColor: '#a855f7',
      accentColor: '#ec4899',
      auraColor: 'rgba(168, 85, 247, 0.55)',
      atkBonus: 8,
      critRate: 0.4,
      moves: ['Lâmina de Plasma Fóton', 'Corte Dimensional do Vazio', 'Julgamento Omnislash'],
      qtePattern: ['W', 'S', 'A', 'D', 'SPACE'],
    },
    guerreiro_templario: {
      name: 'Boran da Ordem',
      char: 'guerreiro',
      primaryColor: '#3b82f6',
      accentColor: '#60a5fa',
      auraColor: 'rgba(59, 130, 246, 0.35)',
      atkBonus: 0,
      critRate: 0.15,
      moves: ['Golpe de Espada Longa', 'Pancada com Escudo Férreo', 'Investida Sagrada'],
      qtePattern: ['SPACE', 'W', 'SPACE'],
    },
    guerreiro_berserker_lava: {
      name: 'Boran Vulcânico',
      char: 'guerreiro',
      primaryColor: '#ef4444',
      accentColor: '#f97316',
      auraColor: 'rgba(239, 68, 68, 0.5)',
      atkBonus: 10,
      critRate: 0.25,
      moves: ['Machado Incandescente', 'Fenda Sísmica de Magma', 'Erupção Titânica'],
      qtePattern: ['SPACE', 'SPACE', 'A', 'D'],
    },
    mago_arcanista: {
      name: 'Valerius Arcano',
      char: 'mago',
      primaryColor: '#6366f1',
      accentColor: '#818cf8',
      auraColor: 'rgba(99, 102, 241, 0.4)',
      atkBonus: 0,
      critRate: 0.2,
      moves: ['Dardo de Energia Pura', 'Orbe Incandescente', 'Meteoro Cósmico'],
      qtePattern: ['W', 'A', 'SPACE'],
    },
    mago_necromante_espectral: {
      name: 'Valerius das Sombras',
      char: 'mago',
      primaryColor: '#10b981',
      accentColor: '#059669',
      auraColor: 'rgba(16, 185, 129, 0.45)',
      atkBonus: 12,
      critRate: 0.3,
      moves: ['Chama Abissal', 'Garras do Submundo', 'Apocalipse das Almas'],
      qtePattern: ['A', 'W', 'D', 'SPACE'],
    },
    arqueira_silvestre: {
      name: 'Lyra dos Bosques',
      char: 'arqueira',
      primaryColor: '#22c55e',
      accentColor: '#4ade80',
      auraColor: 'rgba(34, 197, 94, 0.35)',
      atkBonus: 0,
      critRate: 0.22,
      moves: ['Tiro Rápido de Precisão', 'Disparo Múltiplo Disperso', 'Chuva de Flechas'],
      qtePattern: ['W', 'SPACE', 'W'],
    },
    arqueira_sniper_sonica: {
      name: 'Lyra Railgun',
      char: 'arqueira',
      primaryColor: '#06b6d4',
      accentColor: '#38bdf8',
      auraColor: 'rgba(6, 182, 212, 0.45)',
      atkBonus: 9,
      critRate: 0.35,
      moves: ['Projétil Eletromagnético Railgun', 'Flecha de Alta Frequência', 'Canhão Orbital'],
      qtePattern: ['D', 'A', 'W', 'SPACE'],
    },
  };

  const BOSSES_CONFIG = {
    spectre: {
      name: 'Spectre do Código',
      theme: 'castelo',
      phases: [
        { name: 'Manifestação Ectoplasmática', hpMax: 100, barColor: '#38bdf8', atk: 18, qteChance: 0.35 },
      ],
    },
    cavaleiro: {
      name: 'Cavaleiro Decaído',
      theme: 'castelo',
      phases: [
        { name: 'Fase I: Postura Implacável', hpMax: 120, barColor: '#3b82f6', atk: 20, qteChance: 0.4 },
        { name: 'Fase II: Fúria da Armadura Quebrada', hpMax: 140, barColor: '#ef4444', atk: 28, qteChance: 0.6 },
      ],
    },
    mago: {
      name: 'Mago Corrompido',
      theme: 'montanha',
      phases: [
        { name: 'Fase I: Ilusão de Fórmulas', hpMax: 110, barColor: '#a855f7', atk: 22, qteChance: 0.4 },
        { name: 'Fase II: Tempestade de Caos Cósmico', hpMax: 150, barColor: '#d946ef', atk: 32, qteChance: 0.65 },
      ],
    },
    chefe_final: {
      name: 'O Arquivista do Vazio',
      theme: 'vazio_cosmico',
      phases: [
        { name: 'Fase I: Tomos Esquecidos', hpMax: 150, barColor: '#8b5cf6', atk: 25, qteChance: 0.5 },
        { name: 'Fase II: Fúria da Entropia', hpMax: 180, barColor: '#ef4444', atk: 35, qteChance: 0.7 },
        { name: 'Fase III: Singularidade Primordial', hpMax: 220, barColor: '#eab308', atk: 45, qteChance: 0.85 },
      ],
    },
  };

  // ============================================================================
  // 2. SISTEMA DE ÁUDIO SINTÉTICO (WEB AUDIO API)
  // ============================================================================
  class AudioSynth {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.bgmTimer = null;
    }

    init() {
      if (this.ctx && this.ctx.state === 'running') return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
          if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
        }
      } catch (e) {}
    }

    playTone(freq, duration, type = 'sine', volume = 0.25) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    }

    playSFX(name) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      if (name === 'hit') {
        this.playTone(140, 0.12, 'sawtooth', 0.4);
      } else if (name === 'slash') {
        this.playTone(380, 0.1, 'sawtooth', 0.3);
      } else if (name === 'crit') {
        this.playTone(880, 0.18, 'square', 0.4);
        this.playTone(180, 0.22, 'sawtooth', 0.5);
      } else if (name === 'qte_alert') {
        this.playTone(700, 0.08, 'square', 0.35);
        this.playTone(1000, 0.12, 'square', 0.4);
      } else if (name === 'qte_success') {
        this.playTone(523, 0.08, 'sine', 0.3);
        this.playTone(659, 0.08, 'sine', 0.3);
        this.playTone(1046, 0.2, 'triangle', 0.45);
      } else if (name === 'qte_fail') {
        this.playTone(220, 0.15, 'sawtooth', 0.4);
        this.playTone(160, 0.2, 'sawtooth', 0.45);
      } else if (name === 'correct') {
        this.playTone(440, 0.08, 'sine', 0.3);
        this.playTone(659, 0.18, 'sine', 0.4);
      } else if (name === 'wrong') {
        this.playTone(180, 0.22, 'sawtooth', 0.35);
      } else if (name === 'victory') {
        this.playTone(523, 0.12, 'triangle', 0.4);
        this.playTone(659, 0.12, 'triangle', 0.4);
        this.playTone(783, 0.35, 'triangle', 0.5);
      }
    }

    startBGM(isBoss = false) {
      this.stopBGM();
      const notes = isBoss ? [110, 130.81, 146.83, 110, 164.81] : [130.81, 164.81, 196.0, 220.0];
      let step = 0;
      this.bgmTimer = setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        const freq = notes[step % notes.length];
        this.playTone(freq, 0.15, 'triangle', 0.08);
        step++;
      }, isBoss ? 280 : 380);
    }

    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  // ============================================================================
  // 3. CLASSE PRINCIPAL DO JOGO
  // ============================================================================
  class EstudeMyGame {
    constructor() {
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.audio = new AudioSynth();

      // Configuração Widescreen Virtual
      this.width = 1366;
      this.height = 768;
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      // Estado do Jogo
      this.gameData = null;
      this.mode = 'campanha'; // campanha | speedrun | sobrevivencia | boss_rush
      this.activeSkinKey = 'samurai_ronin';
      this.activeSkin = SKINS_CONFIG.samurai_ronin;
      this.activeBossKey = 'spectre';
      this.activeBoss = BOSSES_CONFIG.spectre;
      this.currentPhaseIndex = 0;

      // Atributos de Batalha
      this.playerHp = 100;
      this.playerMaxHp = 100;
      this.ultCharge = 0;
      this.isUltReady = false;
      this.streak = 0;
      this.bossHp = 100;
      this.bossMaxHp = 100;
      this.isStaggered = false;

      // Timer (Speedrun Mode)
      this.timerSeconds = 60;
      this.speedrunInterval = null;

      // Perguntas
      this.questions = [];
      this.currentQuestionIndex = 0;
      this.questionFeedback = null;
      this.feedbackTimer = null;

      // QTE (Quick Time Event)
      this.qte = {
        active: false,
        keys: [],
        currentIndex: 0,
        timeRemaining: 0,
        totalTime: 0,
        label: '',
        onSuccess: null,
      };

      // Textos Flutuantes de Dano
      this.floatingTexts = [];

      // Animações
      this.animTime = 0;
      this.playerAnim = 'idle';

      this.initEvents();
      this.loadGameDataFromBridge();
      this.startLoop();
    }

    initEvents() {
      window.addEventListener('keydown', (e) => {
        this.audio.init();

        // 1. QTE Input
        if (this.qte.active) {
          const key = e.code === 'Space' ? 'SPACE' : e.key.toUpperCase();
          this.handleQTEInput(key);
          return;
        }

        // 2. Acionamento de Ultimate com Barra de Espaço
        if (e.code === 'Space' && this.isUltReady) {
          this.triggerUltimate();
          return;
        }

        // 3. Teclas 1, 2, 3, 4 para responder perguntas
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          this.submitAnswer(idx);
        }
      });

      this.canvas.addEventListener('pointerdown', (e) => {
        this.audio.init();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        this.handleClick(clickX, clickY);
      });
    }

    loadGameDataFromBridge() {
      let rawData = null;
      if (typeof window.obter_dados_fase_js === 'function') {
        try {
          const s = window.obter_dados_fase_js();
          if (s) rawData = JSON.parse(s);
        } catch (e) {}
      }
      if (!rawData && window.gameData) {
        rawData = window.gameData;
      }

      this.gameData = rawData || {
        titulo: 'Fase de Avaliação',
        cenario: 'castelo',
        personagem_selecionado: 'samurai',
        perguntas: [
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
        ],
      };

      // Configuração de Personagem e Skin
      const char = (this.gameData.personagem_selecionado || 'samurai').toLowerCase();
      if (char.includes('guerreiro') || char.includes('cavaleiro')) {
        this.activeSkinKey = 'guerreiro_templario';
      } else if (char.includes('mago')) {
        this.activeSkinKey = 'mago_arcanista';
      } else if (char.includes('arqueira')) {
        this.activeSkinKey = 'arqueira_silvestre';
      } else {
        this.activeSkinKey = 'samurai_ronin';
      }
      this.activeSkin = SKINS_CONFIG[this.activeSkinKey];

      // Configuração de Boss
      const cenario = (this.gameData.cenario || 'castelo').toLowerCase();
      if (cenario.includes('montanha')) {
        this.activeBossKey = 'mago';
      } else if (cenario.includes('deserto')) {
        this.activeBossKey = 'spectre';
      } else if (cenario.includes('final') || cenario.includes('vazio')) {
        this.activeBossKey = 'chefe_final';
      } else {
        this.activeBossKey = 'cavaleiro';
      }
      this.activeBoss = BOSSES_CONFIG[this.activeBossKey] || BOSSES_CONFIG.cavaleiro;
      this.currentPhaseIndex = 0;
      this.setupBossPhase(0);

      // Perguntas
      this.questions = this.gameData.perguntas || [];
      this.currentQuestionIndex = 0;

      // BGM
      this.audio.startBGM(true);
    }

    setupBossPhase(idx) {
      const phase = this.activeBoss.phases[idx];
      this.bossHp = phase.hpMax;
      this.bossMaxHp = phase.hpMax;
      this.isStaggered = false;
      this.addFloatingText(`ENTROU NA ${phase.name}!`, phase.barColor, 1020, 320);
    }

    handleClick(x, y) {
      // 1. QTE Click/Touch
      if (this.qte.active) {
        this.handleQTEInput('TAP');
        return;
      }

      // 2. Clique no Botão de Ultimate
      if (this.isUltReady && x >= 40 + 280 + 15 && x <= 40 + 280 + 130 && y >= 670 && y <= 725) {
        this.triggerUltimate();
        return;
      }

      // 3. Clique nas Opções de Resposta
      const cardStartX = 340;
      const cardStartY = 610;
      const cardW = 330;
      const cardH = 55;
      const gapX = 20;
      const gapY = 12;

      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = cardStartX + col * (cardW + gapX);
        const by = cardStartY + row * (cardH + gapY);

        if (x >= bx && x <= bx + cardW && y >= by && y <= by + cardH) {
          this.submitAnswer(i);
          return;
        }
      }
    }

    submitAnswer(idx) {
      if (this.qte.active) return;
      const q = this.questions[this.currentQuestionIndex % this.questions.length];
      if (!q) return;

      const isCorrect = idx === q.indiceRespostaCorreta;

      if (isCorrect) {
        this.audio.playSFX('correct');
        this.streak++;
        this.chargeUltimate(25);
        this.playerAnim = 'attack';
        setTimeout(() => (this.playerAnim = 'idle'), 400);

        // Chance de QTE em Streak >= 2
        if (this.streak >= 2 && Math.random() < 0.5) {
          this.triggerQTE(['A', 'D', 'SPACE'], 'COMBO CRÍTICO! [A] -> [D] -> [ESPAÇO]!', (success) => {
            const mult = success ? 2.5 : 1.0;
            this.damageBoss(Math.round(25 * mult), success);
          });
        } else {
          this.damageBoss(25, false);
        }

        this.setFeedback('Correto! Golpe desferido com sucesso!', '#22c55e');
      } else {
        this.audio.playSFX('wrong');
        this.streak = 0;
        this.playerAnim = 'hurt';
        setTimeout(() => (this.playerAnim = 'idle'), 400);

        // Contra-ataque do Boss
        this.damagePlayer(this.activeBoss.phases[this.currentPhaseIndex].atk);
        this.setFeedback(`Incorreto! Dica: ${q.explicacao || 'Revise a matéria.'}`, '#ef4444');
      }

      // Avança pergunta
      this.currentQuestionIndex++;
    }

    setFeedback(text, color) {
      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
      this.questionFeedback = { text, color };
      this.feedbackTimer = setTimeout(() => {
        this.questionFeedback = null;
      }, 3500);
    }

    damageBoss(dmg, isCrit) {
      this.bossHp = Math.max(0, this.bossHp - dmg);
      this.audio.playSFX(isCrit ? 'crit' : 'hit');
      this.addFloatingText(`-${dmg}`, isCrit ? '#facc15' : '#38bdf8', 1020, 420);

      if (this.bossHp <= 0) {
        if (this.currentPhaseIndex + 1 < this.activeBoss.phases.length) {
          this.currentPhaseIndex++;
          this.setupBossPhase(this.currentPhaseIndex);
        } else {
          // Vitória Total!
          this.audio.playSFX('victory');
          this.addFloatingText('VITÓRIA!', '#22c55e', this.width / 2, this.height / 2);
          setTimeout(() => {
            if (typeof window.notificar_vitoria_js === 'function') {
              window.notificar_vitoria_js();
            }
          }, 1800);
        }
      }
    }

    damagePlayer(dmg) {
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.addFloatingText(`-${dmg}`, '#ef4444', 340, 420);

      if (this.playerHp <= 0) {
        this.addFloatingText('DERROTA...', '#ef4444', this.width / 2, this.height / 2);
        setTimeout(() => {
          if (typeof window.notificar_derrota_js === 'function') {
            window.notificar_derrota_js();
          }
        }, 1800);
      }
    }

    chargeUltimate(val) {
      this.ultCharge = Math.min(100, this.ultCharge + val);
      this.isUltReady = this.ultCharge >= 100;
      if (this.isUltReady) {
        this.audio.playSFX('qte_alert');
      }
    }

    triggerUltimate() {
      if (!this.isUltReady) return;
      this.ultCharge = 0;
      this.isUltReady = false;

      this.triggerQTE(this.activeSkin.qtePattern, `ULTIMATE: ${this.activeSkin.moves[2]}!`, (success) => {
        const dmg = success ? 85 : 45;
        this.damageBoss(dmg, true);
      });
    }

    triggerQTE(keys, label, callback) {
      this.audio.playSFX('qte_alert');
      this.qte = {
        active: true,
        keys,
        currentIndex: 0,
        timeRemaining: 2400,
        totalTime: 2400,
        label,
        onSuccess: callback,
      };
    }

    handleQTEInput(key) {
      if (!this.qte.active) return;
      const expected = this.qte.keys[this.qte.currentIndex];
      const match = key === expected || (expected === 'SPACE' && (key === ' ' || key === 'TAP'));

      if (match) {
        this.audio.playSFX('slash');
        this.qte.currentIndex++;
        if (this.qte.currentIndex >= this.qte.keys.length) {
          this.resolveQTE(true);
        }
      }
    }

    resolveQTE(success) {
      const cb = this.qte.onSuccess;
      this.qte.active = false;
      this.audio.playSFX(success ? 'qte_success' : 'qte_fail');
      if (cb) cb(success);
    }

    addFloatingText(text, color, x, y) {
      this.floatingTexts.push({
        text,
        color,
        x,
        y,
        life: 1.0,
      });
    }

    startLoop() {
      let lastTime = performance.now();
      const frame = (now) => {
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;
        this.update(dt);
        this.render();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    update(dt) {
      this.animTime += dt;

      // QTE Timer
      if (this.qte.active) {
        this.qte.timeRemaining -= dt * 1000;
        if (this.qte.timeRemaining <= 0) {
          this.resolveQTE(false);
        }
      }

      // Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y -= dt * 35;
        ft.life -= dt * 0.9;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // 1. Fundo Parallax
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(0.7, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Linha do Chão
      const groundY = 560;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // 2. Render do Jogador
      const px = 340;
      const py = groundY - 10;
      const breath = Math.sin(this.animTime * 4) * 3;

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(px, py + 10, 40, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura da Skin
      const aura = ctx.createRadialGradient(px, py - 40, 10, px, py - 40, 60);
      aura.addColorStop(0, this.activeSkin.auraColor);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(px, py - 40, 60, 0, Math.PI * 2);
      ctx.fill();

      // Corpo
      ctx.fillStyle = this.activeSkin.primaryColor;
      ctx.fillRect(px - 16, py - 60 + breath, 32, 42);

      // Cabeça
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(px, py - 72 + breath, 14, 0, Math.PI * 2);
      ctx.fill();

      // Olhos
      ctx.fillStyle = this.activeSkin.accentColor;
      ctx.fillRect(px + 2, py - 75 + breath, 8, 4);

      // Nome da Skin
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.activeSkin.name, px, py - 95);

      // 3. Render do Boss
      const bx = 1020;
      const by = groundY - 10;
      const phase = this.activeBoss.phases[this.currentPhaseIndex];

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(bx, by + 12, 60, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura do Boss
      const bossAura = ctx.createRadialGradient(bx, by - 50, 15, bx, by - 50, 80);
      bossAura.addColorStop(0, phase.barColor + '66');
      bossAura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bossAura;
      ctx.beginPath();
      ctx.arc(bx, by - 50, 80, 0, Math.PI * 2);
      ctx.fill();

      // Silhueta do Boss
      ctx.fillStyle = phase.barColor;
      ctx.beginPath();
      ctx.moveTo(bx, by - 120);
      ctx.lineTo(bx + 40, by - 60);
      ctx.lineTo(bx + 30, by);
      ctx.lineTo(bx - 30, by);
      ctx.lineTo(bx - 40, by - 60);
      ctx.closePath();
      ctx.fill();

      // Olhos do Boss
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx - 14, by - 80, 8, 4);
      ctx.fillRect(bx + 6, by - 80, 8, 4);

      // 4. Barra de Vida do Boss (Topo)
      const bBarW = 480;
      const bBarX = (w - bBarW) / 2;
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.fillRect(bBarX - 10, 20, bBarW + 20, 50);

      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`👑 ${this.activeBoss.name} — ${phase.name}`, bBarX, 38);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`FASE ${this.currentPhaseIndex + 1}/${this.activeBoss.phases.length}`, bBarX + bBarW, 38);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bBarX, 46, bBarW, 16);
      ctx.fillStyle = phase.barColor;
      ctx.fillRect(bBarX, 46, bBarW * (this.bossHp / this.bossMaxHp), 16);

      // 5. HUD do Jogador (Esquerda Baixo)
      const pBarX = 40;
      const pBarY = 660;
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.fillRect(pBarX - 10, pBarY - 20, 280 + 130, 80);

      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`VIDA: ${this.playerHp}/${this.playerMaxHp}`, pBarX, pBarY - 5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(pBarX, pBarY, 260, 16);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(pBarX, pBarY, 260 * (this.playerHp / this.playerMaxHp), 16);

      // Ultimate Bar
      ctx.fillStyle = this.isUltReady ? '#facc15' : '#94a3b8';
      ctx.fillText(`ULTIMATE: ${this.ultCharge}%`, pBarX, pBarY + 32);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(pBarX, pBarY + 38, 260, 12);
      ctx.fillStyle = this.isUltReady ? '#facc15' : '#38bdf8';
      ctx.fillRect(pBarX, pBarY + 38, 260 * (this.ultCharge / 100), 12);

      // Botão Ultimate
      if (this.isUltReady) {
        const uX = pBarX + 260 + 15;
        const uY = pBarY - 10;
        ctx.fillStyle = '#eab308';
        ctx.fillRect(uX, uY, 110, 55);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(uX, uY, 110, 55);
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ULTIMATE', uX + 55, uY + 24);
        ctx.font = '10px sans-serif';
        ctx.fillText('[ESPAÇO/TOUCH]', uX + 55, uY + 42);
      }

      // 6. Cartão Pedagógico de Pergunta e Respostas
      this.renderQuestionCard();

      // 7. QTE Overlay (se ativo)
      if (this.qte.active) {
        this.renderQTE();
      }

      // 8. Textos Flutuantes
      this.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.font = '900 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });
    }

    renderQuestionCard() {
      const ctx = this.ctx;
      const q = this.questions[this.currentQuestionIndex % this.questions.length];
      if (!q) return;

      const qX = 340;
      const qY = 575;
      const totalW = 680;

      // Card de Enunciado
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(qX, qY - 45, totalW, 40);
      ctx.strokeRect(qX, qY - 45, totalW, 40);

      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(q.enunciado, qX + totalW / 2, qY - 20);

      // Alternativas
      const cardW = 330;
      const cardH = 55;
      const gapX = 20;
      const gapY = 12;

      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = qX + col * (cardW + gapX);
        const by = qY + 5 + row * (cardH + gapY);

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.fillRect(bx, by, cardW, cardH);
        ctx.strokeRect(bx, by, cardW, cardH);

        // Tecla de atalho
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx + 8, by + 8, 22, 22);
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, bx + 19, by + 23);

        // Texto da alternativa
        const altText = q.alternativas && q.alternativas[i] ? q.alternativas[i] : `Opção ${i + 1}`;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(altText.slice(0, 38), bx + 38, by + 32);
      }

      // Feedback Pedagógico (se ativo)
      if (this.questionFeedback) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(qX, qY - 90, totalW, 36);
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.questionFeedback.color;
        ctx.fillText(this.questionFeedback.text, qX + totalW / 2, qY - 67);
      }
    }

    renderQTE() {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height * 0.42;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.fillRect(cx - 260, cy - 70, 520, 140);
      ctx.strokeRect(cx - 260, cy - 70, 520, 140);

      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15';
      ctx.fillText(this.qte.label, cx, cy - 35);

      // Teclas
      const total = this.qte.keys.length;
      const bSize = 50;
      const gap = 16;
      const startX = cx - ((total * bSize + (total - 1) * gap) / 2) + bSize / 2;

      this.qte.keys.forEach((k, idx) => {
        const kx = startX + idx * (bSize + gap);
        const ky = cy + 10;
        const isPast = idx < this.qte.currentIndex;
        const isCur = idx === this.qte.currentIndex;

        ctx.fillStyle = isPast ? '#22c55e' : isCur ? '#38bdf8' : '#1e293b';
        ctx.fillRect(kx - bSize / 2, ky - bSize / 2, bSize, bSize);
        ctx.strokeStyle = isCur ? '#ffffff' : '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(kx - bSize / 2, ky - bSize / 2, bSize, bSize);

        ctx.font = '900 18px monospace';
        ctx.fillStyle = isPast ? '#000000' : '#ffffff';
        ctx.fillText(k, kx, ky + 6);
      });

      // Timer
      const p = Math.max(0, this.qte.timeRemaining / this.qte.totalTime);
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 220, cy + 50, 440, 8);
      ctx.fillStyle = p > 0.3 ? '#38bdf8' : '#ef4444';
      ctx.fillRect(cx - 220, cy + 50, 440 * p, 8);
    }
  }

  window.addEventListener('load', () => {
    window.estudemyGame = new EstudeMyGame();
  });
})();
