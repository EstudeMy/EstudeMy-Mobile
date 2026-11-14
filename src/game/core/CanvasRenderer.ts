/**
 * CanvasRenderer - Renderizador Gráfico 2D em Pixel Art e Aspect Ratio 16:9
 * Otimizado para 60 FPS com suporte a Parallax, Partículas, Auras de Skins e QTE Overlay.
 */

import { FloatingCombatTextItem } from '../systems/CombatSystem';
import { QTEState } from '../systems/QTESystem';
import { SkinDefinition } from '../types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private virtualWidth = 1366;
  private virtualHeight = 768;
  private particles: Particle[] = [];
  private parallaxOffset = 0;

  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  }

  public resize(): void {
    if (!this.canvas) return;
    this.canvas.width = this.virtualWidth;
    this.canvas.height = this.virtualHeight;
  }

  public clear(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);
  }

  /**
   * Renderiza o fundo em Parallax Scrolling baseado no cenário temático
   */
  public renderParallax(scenery: string, deltaTime: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.virtualWidth;
    const h = this.virtualHeight;

    this.parallaxOffset += deltaTime * 20;

    // 1. Céu Gradiente Base
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
    if (scenery === 'montanha') {
      skyGradient.addColorStop(0, '#020617');
      skyGradient.addColorStop(0.7, '#0f172a');
      skyGradient.addColorStop(1, '#1e3a8a');
    } else if (scenery === 'deserto') {
      skyGradient.addColorStop(0, '#1c1917');
      skyGradient.addColorStop(0.6, '#451a03');
      skyGradient.addColorStop(1, '#9a3412');
    } else if (scenery === 'vazio_cosmico') {
      skyGradient.addColorStop(0, '#000000');
      skyGradient.addColorStop(0.5, '#090514');
      skyGradient.addColorStop(1, '#2e1065');
    } else {
      // Castelo / Padrão
      skyGradient.addColorStop(0, '#090a0f');
      skyGradient.addColorStop(0.6, '#0f172a');
      skyGradient.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h);

    // 2. Estrelas / Fragmentos Flutuantes no Céu
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const starX = (i * 37 + (this.parallaxOffset * 0.1) * (i % 3 + 1)) % w;
      const starY = (i * 23) % (h * 0.55);
      const radius = (i % 3 === 0) ? 2 : 1;
      ctx.globalAlpha = 0.3 + (Math.sin(this.parallaxOffset * 0.05 + i) * 0.3 + 0.3);
      ctx.beginPath();
      ctx.arc(starX, starY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Montanhas / Muralhas Distantes (Camada Lenta)
    ctx.fillStyle = scenery === 'deserto' ? '#78350f' : scenery === 'montanha' ? '#1e293b' : '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.65);
    for (let x = 0; x <= w; x += 150) {
      const peakHeight = Math.sin((x + this.parallaxOffset * 0.2) * 0.005) * 80 + (h * 0.55);
      ctx.lineTo(x, peakHeight);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // 4. Plataforma de Batalha (Chão Frontal)
    const groundY = h * 0.72;
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, h);
    groundGradient.addColorStop(0, '#1e293b');
    groundGradient.addColorStop(0.15, '#0f172a');
    groundGradient.addColorStop(1, '#020617');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Linha de luz neon na borda da arena
    ctx.strokeStyle = scenery === 'deserto' ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
  }

  /**
   * Renderiza o Jogador com a Aura visual da sua Skin e Animações
   */
  public renderPlayer(
    x: number,
    y: number,
    skin: SkinDefinition,
    animationState: string,
    isUltReady: boolean,
    animTime: number
  ): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Sombra suave sob os pés
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 20, 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura Luminosa da Skin Ativa
    const pulse = Math.sin(animTime * 4) * 0.2 + 0.8;
    const auraRadius = isUltReady ? 75 : 55;
    const auraGradient = ctx.createRadialGradient(x, y - 40, 10, x, y - 40, auraRadius);
    auraGradient.addColorStop(0, isUltReady ? 'rgba(234, 179, 8, 0.55)' : skin.spriteTheme.auraColor);
    auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(x, y - 40, auraRadius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Se estiver com Ultimate Pronta, adiciona anel de energia pulsante
    if (isUltReady) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(x, y - 40, (auraRadius + 10) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Desenha o corpo / silhueta RPG do herói estilizado
    ctx.save();
    ctx.translate(x, y);

    // Pequeno pulso de respiração (Idle breathing)
    const breath = animationState === 'idle' ? Math.sin(animTime * 3) * 2 : 0;

    // Capa / Detalhes de Costas
    ctx.fillStyle = skin.spriteTheme.accentColor;
    ctx.beginPath();
    ctx.moveTo(-18, -60 + breath);
    ctx.lineTo(-32, 0);
    ctx.lineTo(-12, 10);
    ctx.lineTo(0, -50 + breath);
    ctx.fill();

    // Tronco / Armadura Principal
    ctx.fillStyle = skin.spriteTheme.primaryColor;
    ctx.fillRect(-16, -65 + breath, 32, 42);

    // Cabeça / Elmo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -78 + breath, 15, 0, Math.PI * 2);
    ctx.fill();

    // Viseira / Olhos iluminados
    ctx.fillStyle = skin.spriteTheme.accentColor;
    ctx.fillRect(2, -81 + breath, 10, 4);

    // Lâmina / Arma da Skin
    const weaponAngle = animationState.includes('golpe') ? Math.PI * 0.35 : -Math.PI * 0.15;
    ctx.save();
    ctx.translate(14, -45 + breath);
    ctx.rotate(weaponAngle);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -38, 6, 44);
    ctx.fillStyle = skin.spriteTheme.accentColor;
    ctx.fillRect(-4, 0, 14, 5);
    ctx.restore();

    ctx.restore();

    // Nome e Título da Skin acima do herói
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(skin.name, x, y - 110);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = skin.spriteTheme.accentColor;
    ctx.fillText(skin.title, x, y - 96);
  }

  /**
   * Renderiza o Boss e suas Múltiplas Barras de Vida
   */
  public renderBoss(
    x: number,
    y: number,
    name: string,
    currentHp: number,
    maxHp: number,
    phaseNumber: number,
    totalPhases: number,
    barColor: string,
    animTime: number,
    isStaggered: boolean
  ): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Sombra do Boss
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y + 25, 75, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo do Boss
    ctx.save();
    ctx.translate(x, y);

    const staggerShake = isStaggered ? (Math.random() * 8 - 4) : 0;
    ctx.translate(staggerShake, 0);

    // Aura sombria do Boss
    const bossAura = ctx.createRadialGradient(0, -60, 20, 0, -60, 95);
    bossAura.addColorStop(0, barColor + '88');
    bossAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bossAura;
    ctx.beginPath();
    ctx.arc(0, -60, 95, 0, Math.PI * 2);
    ctx.fill();

    // Silhueta Imponente do Chefe
    ctx.fillStyle = isStaggered ? '#94a3b8' : barColor;
    ctx.beginPath();
    ctx.moveTo(0, -145);
    ctx.lineTo(45, -70);
    ctx.lineTo(35, 10);
    ctx.lineTo(-35, 10);
    ctx.lineTo(-45, -70);
    ctx.closePath();
    ctx.fill();

    // Olhos flamejantes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-18, -100, 10, 5);
    ctx.fillRect(8, -100, 10, 5);

    ctx.restore();

    // HUD DO BOSS: Múltiplas Barras de Vida no Topo da Tela
    const hudW = 460;
    const hudH = 18;
    const hudX = (this.virtualWidth - hudW) / 2;
    const hudY = 32;

    // Moldura de Fundo
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(hudX - 10, hudY - 24, hudW + 20, hudH + 34);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(hudX - 10, hudY - 24, hudW + 20, hudH + 34);

    // Nome e Indicador de Fases (Ex: "FASE 1/3")
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`👑 ${name.toUpperCase()}`, hudX, hudY - 6);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`FASE ${phaseNumber}/${totalPhases}`, hudX + hudW, hudY - 6);

    // Barra de Vida Fundo
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hudX, hudY, hudW, hudH);

    // Preenchimento da Barra da Fase Atual
    const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));
    ctx.fillStyle = barColor;
    ctx.fillRect(hudX, hudY, hudW * hpRatio, hudH);

    // Texto de HP numérico
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${currentHp} / ${maxHp} HP`, hudX + hudW / 2, hudY + 13);
  }

  /**
   * Renderiza os textos flutuantes de combate (dano, crítico, cura)
   */
  public renderFloatingTexts(items: FloatingCombatTextItem[], deltaTime: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    items.forEach((item, idx) => {
      const baseX = item.target === 'player' ? 320 : 1020;
      const baseY = 380 - (idx * 26);

      ctx.save();
      ctx.font = item.isCrit ? '900 24px system-ui, sans-serif' : 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';

      // Sombra preta para alto contraste
      ctx.fillStyle = '#000000';
      ctx.fillText(item.text, baseX + 2, baseY + 2);

      // Texto colorido
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, baseX, baseY);
      ctx.restore();
    });
  }

  /**
   * Renderiza a interface de Quick Time Events (QTE)
   */
  public renderQTEOverlay(qte: QTEState): void {
    if (!this.ctx || !qte.isActive || !qte.prompt) return;
    const ctx = this.ctx;
    const w = this.virtualWidth;
    const h = this.virtualHeight;

    const centerX = w / 2;
    const centerY = h * 0.45;

    // Escurecimento de foco na tela
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);

    // Caixa central do QTE
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    const boxW = 540;
    const boxH = 160;
    ctx.fillRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH);
    ctx.strokeRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH);

    // Título / Instrução
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.fillText(qte.prompt.label, centerX, centerY - 42);

    // Teclas / Botões virtuais na tela
    const keys = qte.prompt.keys;
    const totalKeys = keys.length;
    const keyBoxSize = 56;
    const gap = 20;
    const startX = centerX - ((totalKeys * keyBoxSize + (totalKeys - 1) * gap) / 2) + keyBoxSize / 2;

    keys.forEach((key, idx) => {
      const kX = startX + idx * (keyBoxSize + gap);
      const kY = centerY + 6;
      const isCurrent = idx === qte.currentKeyIndex;
      const isPast = idx < qte.currentKeyIndex;

      // Moldura do botão da tecla
      ctx.fillStyle = isPast ? '#22c55e' : isCurrent ? '#38bdf8' : '#1e293b';
      ctx.fillRect(kX - keyBoxSize / 2, kY - keyBoxSize / 2, keyBoxSize, keyBoxSize);
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#475569';
      ctx.lineWidth = isCurrent ? 3 : 1.5;
      ctx.strokeRect(kX - keyBoxSize / 2, kY - keyBoxSize / 2, keyBoxSize, keyBoxSize);

      // Texto da tecla
      ctx.font = '900 20px system-ui, monospace';
      ctx.fillStyle = isPast ? '#000000' : '#ffffff';
      ctx.fillText(key, kX, kY + 7);
    });

    // Barra de Tempo Restante
    const timerW = boxW - 60;
    const timerH = 10;
    const timerX = centerX - timerW / 2;
    const timerY = centerY + boxH / 2 - 20;

    ctx.fillStyle = '#334155';
    ctx.fillRect(timerX, timerY, timerW, timerH);

    ctx.fillStyle = qte.progressPercent > 0.3 ? '#38bdf8' : '#ef4444';
    ctx.fillRect(timerX, timerY, timerW * qte.progressPercent, timerH);
  }

  /**
   * Renderiza a HUD inferior do jogador (Vida e Barra de Ultimate)
   */
  public renderPlayerHUD(hp: number, maxHp: number, ultCharge: number, isUltReady: boolean): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const hudX = 40;
    const hudY = this.virtualHeight - 90;
    const barW = 280;
    const barH = 18;

    // Fundo da HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(hudX - 10, hudY - 26, barW + 150, 78);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hudX - 10, hudY - 26, barW + 150, 78);

    // Barra de Vida
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`VIDA: ${hp}/${maxHp}`, hudX, hudY - 6);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hudX, hudY, barW, barH);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(hudX, hudY, barW * (hp / maxHp), barH);

    // Barra de Ultimate
    const ultY = hudY + 28;
    ctx.fillStyle = isUltReady ? '#facc15' : '#94a3b8';
    ctx.fillText(`ULTIMATE: ${ultCharge}%`, hudX, ultY - 6);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hudX, ultY, barW, 12);
    ctx.fillStyle = isUltReady ? '#facc15' : '#38bdf8';
    ctx.fillRect(hudX, ultY, barW * (ultCharge / 100), 12);

    // Botão de Acionamento da Ultimate
    if (isUltReady) {
      const btnX = hudX + barW + 18;
      const btnY = hudY - 8;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(btnX, btnY, 110, 52);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, 110, 52);

      ctx.font = '900 13px system-ui, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ ULTIMATE', btnX + 55, btnY + 24);
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText('[ESPAÇO/TOUCH]', btnX + 55, btnY + 40);
    }
  }
}

export const canvasRenderer = new CanvasRenderer();
