import Phaser from 'phaser';
import { GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, COLORS, cellToPixel, pixelToCell } from '../utils/constants';
import { CropBar } from '../ui/CropBar';
import { ResourceBar } from '../ui/ResourceBar';
import { EndTurnButton } from '../ui/EndTurnButton';
import { GridSystem } from '../systems/GridSystem';
import { ChainEngine, ChainResult } from '../systems/ChainEngine';
import { DiseaseAI } from '../systems/DiseaseAI';
import { WaveManager } from '../systems/WaveManager';
import { Crop, CropState } from '../entities/Crop';
import { Disease } from '../entities/Disease';
import { CropType, CROP_DEFS, CropRole } from '../data/crops';
import { GamePhase, GameState } from '../systems/types';
import { chainDelay } from '../utils/animations';
import { floatTextUp, flashCell, shakeCamera, bobUpDown, pulseAlpha } from '../utils/animations';
import { Point } from '../utils/pathfinder';

export class GameScene extends Phaser.Scene {
  // Systems
  grid!: GridSystem;
  chainEngine!: ChainEngine;
  diseaseAI!: DiseaseAI;
  waveManager!: WaveManager;

  // UI
  cropBar!: CropBar;
  resourceBar!: ResourceBar;
  endTurnButton!: EndTurnButton;

  // Game state
  state: GameState = {
    turn: 1,
    gold: 10,
    energy: 3,
    phase: 'planning',
    totalChains: 0,
    totalGoldEarned: 0,
    totalDiseasesCleared: 0,
  };

  // Visual objects
  cellSprites: Phaser.GameObjects.Rectangle[][] = [];
  cellIcons: (Phaser.GameObjects.Text | null)[][] = [];
  cellDiseaseBgs: (Phaser.GameObjects.Container | null)[][] = [];
  nutrientParticles: Phaser.GameObjects.Arc[] = [];
  chainPreviewGraphics!: Phaser.GameObjects.Graphics;
  hoverHighlight!: Phaser.GameObjects.Rectangle;
  validPlacements: Phaser.GameObjects.Rectangle[] = [];

  // Status bar at bottom
  statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.grid = new GridSystem();
    this.chainEngine = new ChainEngine(this.grid);
    this.diseaseAI = new DiseaseAI();
    this.waveManager = new WaveManager(this.grid);

    this.buildGrid();
    this.buildUI();
    this.setupInput();
    this.refreshVisuals();
    this.updatePhaseDisplay();
  }

  // ─── Grid Rendering ──────────────────────────────────
  private buildGrid(): void {
    for (let r = 0; r < GRID_SIZE; r++) {
      this.cellSprites[r] = [];
      this.cellIcons[r] = [];
      this.cellDiseaseBgs[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const { x, y } = cellToPixel(c, r);
        const rect = this.add.rectangle(x, y, CELL_SIZE - 2, CELL_SIZE - 2, COLORS.CELL_EMPTY);
        rect.setStrokeStyle(1, COLORS.CELL_BORDER);
        rect.setDepth(5);
        rect.setInteractive();
        this.cellSprites[r][c] = rect;

        const icon = this.add.text(x, y, '', {
          fontSize: '28px',
          align: 'center',
        });
        icon.setOrigin(0.5);
        icon.setDepth(10);
        this.cellIcons[r][c] = icon;
        this.cellDiseaseBgs[r][c] = null;
      }
    }

    // Hover highlight
    this.hoverHighlight = this.add.rectangle(0, 0, CELL_SIZE - 4, CELL_SIZE - 4, COLORS.HIGHLIGHT_HOVER, 0.3);
    this.hoverHighlight.setDepth(8);
    this.hoverHighlight.setVisible(false);

    // Chain preview line
    this.chainPreviewGraphics = this.add.graphics();
    this.chainPreviewGraphics.setDepth(15);
  }

  private buildUI(): void {
    this.resourceBar = new ResourceBar(this);
    this.cropBar = new CropBar(this);
    this.endTurnButton = new EndTurnButton(this);

    this.cropBar.onCropSelected = (type) => {
      this.showValidPlacements(type);
    };

    this.endTurnButton.onClick = () => {
      if (this.state.phase === 'planning') {
        this.endTurn();
      }
    };

    // Status bar
    const statusY = GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE + 20;
    const statusX = GRID_OFFSET_X;
    this.statusText = this.add.text(statusX, statusY, '', {
      fontSize: '13px',
      fontFamily: 'Courier New, monospace',
      color: '#aaa',
      stroke: '#000',
      strokeThickness: 2,
    });
    this.statusText.setDepth(30);

    // Instructions
    this.add.text(statusX, statusY + 25,
      '左键选择作物→点击格子放置 | 右键取消选择 | 目标: 让连锁反应将疾病转化为金币!',
      {
        fontSize: '11px',
        fontFamily: 'Courier New, monospace',
        color: '#666',
        stroke: '#000',
        strokeThickness: 1,
      }
    ).setDepth(30);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const cell = pixelToCell(pointer.x, pointer.y);
      if (cell) {
        const { x, y } = cellToPixel(cell.col, cell.row);
        this.hoverHighlight.setPosition(x, y);
        this.hoverHighlight.setVisible(true);
        this.showChainPreview(cell.col, cell.row);
      } else {
        this.hoverHighlight.setVisible(false);
        this.chainPreviewGraphics.clear();
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.state.phase !== 'planning') return;
      if (pointer.rightButtonDown()) {
        this.cropBar.selectCrop(null);
        this.hideValidPlacements();
        this.chainPreviewGraphics.clear();
        return;
      }

      const cell = pixelToCell(pointer.x, pointer.y);
      if (!cell) return;

      if (this.cropBar.selectedCrop) {
        this.placeCrop(this.cropBar.selectedCrop, cell.col, cell.row);
      }
    });

    // Right-click to deselect
    this.input.mouse?.disableContextMenu();
  }

  // ─── Crop Placement ──────────────────────────────────
  private placeCrop(type: CropType, col: number, row: number): void {
    const def = CROP_DEFS[type];
    if (this.state.gold < def.cost) {
      const pos2 = cellToPixel(col, row);
      floatTextUp(this, pos2.x, pos2.y, '金币不足!', '#ff4444');
      return;
    }
    if (!this.grid.isEmpty(col, row)) {
      const pos3 = cellToPixel(col, row);
      floatTextUp(this, pos3.x, pos3.y, '格子已被占用', '#ff4444');
      return;
    }

    const crop = new Crop(type, col, row);
    this.grid.placeCrop(crop);
    this.state.gold -= def.cost;

    const { x, y } = cellToPixel(col, row);
    floatTextUp(this, x, y, `-${def.cost}💰`, '#ffa500');
    flashCell(this, x, y, def.color, CELL_SIZE);

    this.refreshVisuals();
    this.updateUI();
  }

  // ─── Valid Placement Highlights ──────────────────────
  private showValidPlacements(type: CropType | null): void {
    this.hideValidPlacements();
    if (!type) return;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid.isEmpty(c, r)) {
          const { x, y } = cellToPixel(c, r);
          const hl = this.add.rectangle(x, y, CELL_SIZE - 2, CELL_SIZE - 2, COLORS.HIGHLIGHT_VALID, 0.15);
          hl.setDepth(6);
          this.validPlacements.push(hl);
        }
      }
    }
  }

  private hideValidPlacements(): void {
    for (const hl of this.validPlacements) hl.destroy();
    this.validPlacements = [];
  }

  // ─── Chain Preview ───────────────────────────────────
  private showChainPreview(col: number, row: number): void {
    this.chainPreviewGraphics.clear();
    if (!this.cropBar.selectedCrop) return;
    const def = CROP_DEFS[this.cropBar.selectedCrop];
    if (!this.grid.isEmpty(col, row)) return;

    const previewPoints = this.chainEngine.previewChain(col, row, def.role);

    if (previewPoints.length > 1) {
      this.chainPreviewGraphics.lineStyle(2, 0x00d4ff, 0.6);
      const start = cellToPixel(previewPoints[0].col, previewPoints[0].row);
      this.chainPreviewGraphics.beginPath();
      this.chainPreviewGraphics.moveTo(start.x, start.y);
      for (let i = 1; i < previewPoints.length; i++) {
        const p = cellToPixel(previewPoints[i].col, previewPoints[i].row);
        this.chainPreviewGraphics.lineTo(p.x, p.y);
      }
      this.chainPreviewGraphics.strokePath();
    }
  }

  // ─── Turn Flow ───────────────────────────────────────
  private async endTurn(): Promise<void> {
    this.endTurnButton.setEnabled(false);
    this.hideValidPlacements();
    this.chainPreviewGraphics.clear();

    // Phase 2: Disease Phase
    this.state.phase = 'disease';
    this.updatePhaseDisplay();
    await this.executeDiseasePhase();
    await chainDelay(400);

    // Phase 3: Chain Phase
    this.state.phase = 'chain';
    this.updatePhaseDisplay();
    await this.executeChainPhase();
    await chainDelay(300);

    // Phase 4: Cleanup
    this.state.phase = 'cleanup';
    this.updatePhaseDisplay();
    await this.executeCleanupPhase();
    await chainDelay(300);

    // Check game over
    const diseaseCount = this.grid.diseaseCount();
    if (diseaseCount >= GRID_SIZE * GRID_SIZE * 0.6) {
      this.state.phase = 'gameover';
      this.updatePhaseDisplay();
      this.showGameOver();
      return;
    }

    // Next turn
    this.state.turn++;
    this.state.energy = 3;
    this.state.phase = 'planning';

    // Gold income
    const income = 2 + Math.floor(this.state.turn / 3);
    this.state.gold += income;

    this.updateUI();
    this.refreshVisuals();
    this.updatePhaseDisplay();
    this.endTurnButton.setEnabled(true);
  }

  private async executeDiseasePhase(): Promise<void> {
    // Spawn new wave
    const newDiseases = this.waveManager.spawnWave(this.state.turn);

    // Animate new diseases appearing
    for (const d of newDiseases) {
      const { x, y } = cellToPixel(d.col, d.row);
      flashCell(this, x, y, d.isSuper ? COLORS.DISEASE_SUPER : COLORS.DISEASE, CELL_SIZE);
      floatTextUp(this, x, y, d.isSuper ? '超级真菌!' : '真菌', '#9b59b6', 14);
      await chainDelay(200);
    }

    this.refreshVisuals();
    await chainDelay(300);

    // Spread existing diseases
    const spreadDiseases = this.diseaseAI.spreadAll(this.grid);
    for (const d of spreadDiseases) {
      const { x, y } = cellToPixel(d.col, d.row);
      flashCell(this, x, y, COLORS.DISEASE, CELL_SIZE, 300);
      await chainDelay(100);
    }

    this.refreshVisuals();
    this.updateUI();
  }

  private async executeChainPhase(): Promise<void> {
    let allResults: ChainResult[] = this.chainEngine.resolveChains();
    let chainNum = 0;

    while (allResults.length > 0) {
      for (const result of allResults) {
        chainNum++;
        await this.animateChainResult(result, chainNum);
        this.state.gold += result.goldEarned;
        this.state.totalChains++;
        this.state.totalGoldEarned += result.goldEarned;
        this.state.totalDiseasesCleared += result.diseasesCleared;
      }
      this.refreshVisuals();
      this.updateUI();
      // Check for more chains
      allResults = this.chainEngine.resolveChains();
    }
  }

  private async animateChainResult(result: ChainResult, chainNum: number): Promise<void> {
    for (const step of result.steps) {
      const fromPos = cellToPixel(step.sourceCol, step.sourceRow);
      const toPos = cellToPixel(step.targetCol, step.targetRow);

      // Flash source
      const srcColor = step.type === 'trigger' ? COLORS.DISEASE : COLORS.NUTRIENT;
      flashCell(this, fromPos.x, fromPos.y, srcColor, CELL_SIZE);

      await chainDelay(150);

      // Animate nutrient particle
      const particle = this.add.circle(fromPos.x, fromPos.y, 6, COLORS.NUTRIENT, 0.9);
      particle.setDepth(50);
      this.nutrientParticles.push(particle);

      // Glow trail
      const glow = this.add.circle(fromPos.x, fromPos.y, 12, COLORS.NUTRIENT, 0.3);
      glow.setDepth(49);

      await new Promise<void>((resolve) => {
        this.tweens.add({
          targets: [particle, glow],
          x: toPos.x,
          y: toPos.y,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            particle.destroy();
            glow.destroy();
            resolve();
          },
        });
      });

      // Target flash
      const targetColor = step.type === 'finish' ? COLORS.GOLD_BRIGHT : COLORS.NUTRIENT;
      flashCell(this, toPos.x, toPos.y, targetColor, CELL_SIZE);

      if (step.type === 'trigger') {
        floatTextUp(this, toPos.x, toPos.y, `+${step.value} 酶`, '#00d4ff', 14);
      } else if (step.type === 'amplify') {
        floatTextUp(this, toPos.x, toPos.y, `×1.5 → ${step.value}`, '#f1c40f', 16);
      }

      await chainDelay(250);
    }

    // Finisher explosion
    if (result.goldEarned > 0) {
      const finishStep = result.steps[result.steps.length - 1];
      const { x, y } = cellToPixel(finishStep.targetCol, finishStep.targetRow);

      // Screen shake
      shakeCamera(this, 0.015, 400);

      // Gold burst particles
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const dist = 40 + Math.random() * 30;
        const p = this.add.circle(x, y, 4, COLORS.GOLD_BRIGHT, 0.9);
        p.setDepth(60);
        this.tweens.add({
          targets: p,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          alpha: 0,
          duration: 600,
          ease: 'Power2',
          onComplete: () => p.destroy(),
        });
      }

      // Big score text
      floatTextUp(this, x, y, `+${result.goldEarned} 💰`, '#ffd700', 28);
      floatTextUp(this, x, y + 20, `连锁 #${chainNum}! 长度 ${result.chainLength}`, '#00d4ff', 16);

      await chainDelay(600);
    }

    this.refreshVisuals();
  }

  private async executeCleanupPhase(): Promise<void> {
    // Wither expired crops
    const crops = this.grid.getAllCrops();
    let withered = 0;
    for (const crop of crops) {
      const died = crop.tickLifespan();
      if (died) {
        const { x, y } = cellToPixel(crop.col, crop.row);
        floatTextUp(this, x, y, '枯萎 💀', '#888', 14);
        this.grid.removeCrop(crop);
        withered++;
      }
    }

    this.refreshVisuals();
    this.updateUI();
  }

  // ─── Visuals ─────────────────────────────────────────
  private refreshVisuals(): void {
    // Remove old disease visuals
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.cellDiseaseBgs[r][c]) {
          this.cellDiseaseBgs[r][c]!.destroy();
          this.cellDiseaseBgs[r][c] = null;
        }
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid.get(c, r);
        const { x, y } = cellToPixel(c, r);
        const icon = this.cellIcons[r][c];

        if (cell.kind === 'empty') {
          this.cellSprites[r][c].setFillStyle(COLORS.CELL_EMPTY);
          icon?.setText('');
        } else if (cell.kind === 'crop') {
          const crop = cell.crop;
          const def = crop.def;
          this.cellSprites[r][c].setFillStyle(COLORS.CELL_TILLED);
          icon?.setText(def.icon);
          icon?.setColor('#ffffff');

          // State visual cues
          if (crop.state === CropState.ACTIVE) {
            const alpha = Math.max(0.4, crop.lifespanRemaining / crop.def.lifespan);
            icon?.setAlpha(alpha);
          } else {
            icon?.setAlpha(1);
          }
        } else if (cell.kind === 'disease') {
          const disease = cell.disease;
          this.cellSprites[r][c].setFillStyle(disease.isSuper ? 0x5a2060 : 0x3a1540);
          icon?.setText(disease.isSuper ? '🍄' : '🦠');

          // Pulsing disease background
          const pulse = this.add.circle(x, y, CELL_SIZE / 2 - 4, disease.isSuper ? COLORS.DISEASE_SUPER : COLORS.DISEASE, 0.2);
          pulse.setDepth(4);
          pulseAlpha(this, pulse, 0.1, 0.35, 800);
          const container = this.add.container(0, 0);
          container.add(pulse);
          this.cellDiseaseBgs[r][c] = container;
        }
      }
    }
  }

  private updateUI(): void {
    const phaseNames: Record<GamePhase, string> = {
      planning: '📋 规划阶段',
      disease: '🦠 疾病阶段',
      chain: '⛓️ 连锁阶段',
      cleanup: '🧹 清理阶段',
      gameover: '💀 游戏结束',
    };

    this.resourceBar.update(
      this.state.turn,
      this.state.gold,
      this.state.energy,
      phaseNames[this.state.phase],
      this.state.totalChains
    );
    this.cropBar.updateGold(this.state.gold);

    const dc = this.grid.diseaseCount();
    const cc = this.grid.cropCount();
    this.statusText.setText(
      `📊 连锁: ${this.state.totalChains} | 疾病: ${dc} | 作物: ${cc} | 总收入: ${this.state.totalGoldEarned}💰`
    );
  }

  private updatePhaseDisplay(): void {
    this.updateUI();
  }

  private showGameOver(): void {
    const cx = GRID_OFFSET_X + (GRID_SIZE * CELL_SIZE) / 2;
    const cy = GRID_OFFSET_Y + (GRID_SIZE * CELL_SIZE) / 2;

    const overlay = this.add.rectangle(cx, cy, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE, 0x000000, 0.7);
    overlay.setDepth(80);

    const title = this.add.text(cx, cy - 40, '🌾 游戏结束 🌾', {
      fontSize: '28px',
      fontFamily: 'Courier New, monospace',
      color: '#c9a227',
      stroke: '#000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(81);

    const stats = this.add.text(cx, cy + 10, `存活 ${this.state.turn} 回合\n连锁 ${this.state.totalChains} 次\n总收入 ${this.state.totalGoldEarned} 💰`, {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#f5e6c8',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center',
    });
    stats.setOrigin(0.5);
    stats.setDepth(81);

    const restart = this.add.text(cx, cy + 80, '[ 点击重新开始 ]', {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#3498db',
      stroke: '#000',
      strokeThickness: 2,
    });
    restart.setOrigin(0.5);
    restart.setDepth(81);
    restart.setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
