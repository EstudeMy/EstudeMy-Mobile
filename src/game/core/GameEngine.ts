/**
 * GameEngine - Motor Principal do Jogo com Loop a 60 FPS, Controle de Cenas e Ponte Host
 */

import { canvasRenderer } from './CanvasRenderer';
import { combatSystem } from '../systems/CombatSystem';
import { bossSystem } from '../systems/BossSystem';
import { qteSystem } from '../systems/QTESystem';
import { cutsceneSystem } from '../systems/CutsceneSystem';
import { skinSystem } from '../systems/SkinSystem';
import { questionBridgeSystem } from '../systems/QuestionBridgeSystem';
import { audioSystem } from './AudioSystem';
import { eventBus } from './EventBus';
import { INTRO_CUTSCENE } from '../data/narrativeScript';
import { STAGES_DATA } from '../data/stagesData';
import { GameModeId } from '../types';

export class GameEngine {
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animTime: number = 0;
  private activeScenery: string = 'castelo';
  private playerAnimationState: string = 'idle';
  private activeMode: GameModeId = 'campanha';

  public init(canvas: HTMLCanvasElement): void {
    canvasRenderer.init(canvas);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Teclado (Ambiente Web)
    window.addEventListener('keydown', (e) => {
      audioSystem.initContext();

      if (qteSystem.isQTEActive()) {
        const key = e.code === 'Space' ? 'SPACE' : e.key.toUpperCase();
        qteSystem.handleInput(key);
      } else if (e.code === 'Space') {
        // Se a barra de Ultimate estiver pronta, dispara
        combatSystem.executeUltimate();
      }
    });

    // Toque / Clique (Mobile WebView e Web)
    window.addEventListener('pointerdown', () => {
      audioSystem.initContext();

      if (qteSystem.isQTEActive()) {
        qteSystem.handleInput('TAP');
      }
    });

    // Escuta animações de ataque do jogador
    eventBus.on('PLAYER_ATTACKED', () => {
      this.playerAnimationState = 'golpe';
      setTimeout(() => {
        this.playerAnimationState = 'idle';
      }, 450);
    });
  }

  public startGame(gameData: any, mode: GameModeId = 'campanha'): void {
    this.activeMode = mode;
    this.animTime = 0;

    // 1. Configurar Personagem e Skin Selecionados
    const charId = (gameData?.personagem_selecionado || 'samurai').toLowerCase();
    skinSystem.setCharacter(charId as any);

    // 2. Identificar Cenário e Chefe da Trilha
    const cenarioRaw = (gameData?.cenario || 'castelo').toLowerCase();
    const stage = STAGES_DATA[cenarioRaw] || STAGES_DATA.castelo;
    this.activeScenery = stage.sceneryId;

    // 3. Carregar Perguntas Pedagógicas da Fase
    const perguntas = gameData?.perguntas || [];
    questionBridgeSystem.loadQuestions(perguntas, mode);

    // 4. Inicializar Combate e Chefe da Fase
    const bossId = stage.bossId;
    combatSystem.initCombat(bossId);

    // 5. Se for Modo Campanha, dispara prólogo narrativo
    if (mode === 'campanha') {
      cutsceneSystem.playCutscene(INTRO_CUTSCENE);
    } else {
      audioSystem.playMusic(stage.musicTrack);
    }

    // Inicia o Loop de Renderização
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;
    this.animTime += deltaTime;

    // Atualiza subsistemas
    cutsceneSystem.update(deltaTime);

    // Renderiza a cena atual
    this.render(deltaTime);

    requestAnimationFrame((t) => this.loop(t));
  }

  private render(deltaTime: number): void {
    canvasRenderer.clear();

    // 1. Fundo em Parallax Scrolling
    canvasRenderer.renderParallax(this.activeScenery, deltaTime);

    // 2. Renderização do Jogador
    const skin = skinSystem.getActiveSkin();
    const playerState = combatSystem.getPlayerState();
    const playerX = 340;
    const playerY = 560;

    canvasRenderer.renderPlayer(
      playerX,
      playerY,
      skin,
      this.playerAnimationState,
      playerState.isUltReady,
      this.animTime
    );

    // 3. Renderização do Chefe
    const boss = bossSystem.getState();
    if (boss && !boss.isDefeated) {
      const bossX = 1040;
      const bossY = 550;

      canvasRenderer.renderBoss(
        bossX,
        bossY,
        boss.definition.name,
        boss.currentHp,
        boss.maxHp,
        boss.currentPhaseIndex + 1,
        boss.definition.totalPhases,
        boss.currentPhase.barColor,
        this.animTime,
        boss.isStaggered
      );
    }

    // 4. HUD Inferior do Jogador
    canvasRenderer.renderPlayerHUD(
      playerState.hp,
      playerState.maxHp,
      playerState.ultCharge,
      playerState.isUltReady
    );

    // 5. Overlay de QTE (se ativo)
    if (qteSystem.isQTEActive()) {
      canvasRenderer.renderQTEOverlay(qteSystem.getState());
    }
  }

  public stop(): void {
    this.isRunning = false;
    audioSystem.stopMusic();
  }
}

export const gameEngine = new GameEngine();
