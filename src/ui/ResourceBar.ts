import Phaser from 'phaser';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../utils/constants';

export class ResourceBar {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  turnText!: Phaser.GameObjects.Text;
  goldText!: Phaser.GameObjects.Text;
  energyText!: Phaser.GameObjects.Text;
  phaseText!: Phaser.GameObjects.Text;
  chainsText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(30);
    this.build();
  }

  private build(): void {
    const w = GRID_OFFSET_X + GRID_SIZE * CELL_SIZE + 20;
    const h = 50;

    const bg = this.scene.add.rectangle(w / 2, h / 2, w, h, COLORS.PANEL_BG, 0.9);
    bg.setStrokeStyle(2, COLORS.PANEL_BORDER);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(15, h / 2, '🌾 生态多米诺', {
      fontSize: '18px',
      fontFamily: 'Courier New, monospace',
      color: '#c9a227',
      stroke: '#000',
      strokeThickness: 2,
    });
    title.setOrigin(0, 0.5);
    this.container.add(title);

    // Turn
    this.turnText = this.scene.add.text(220, h / 2, 'Turn: 1', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#f5e6c8',
      stroke: '#000',
      strokeThickness: 2,
    });
    this.turnText.setOrigin(0, 0.5);
    this.container.add(this.turnText);

    // Gold
    this.goldText = this.scene.add.text(330, h / 2, '💰 10', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 2,
    });
    this.goldText.setOrigin(0, 0.5);
    this.container.add(this.goldText);

    // Energy
    this.energyText = this.scene.add.text(420, h / 2, '⚡ 3', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#3498db',
      stroke: '#000',
      strokeThickness: 2,
    });
    this.energyText.setOrigin(0, 0.5);
    this.container.add(this.energyText);

    // Phase
    this.phaseText = this.scene.add.text(500, h / 2, '规划阶段', {
      fontSize: '12px',
      fontFamily: 'Courier New, monospace',
      color: '#888',
      stroke: '#000',
      strokeThickness: 1,
    });
    this.phaseText.setOrigin(0, 0.5);
    this.container.add(this.phaseText);
  }

  update(turn: number, gold: number, energy: number, phase: string, chains: number): void {
    this.turnText.setText(`Turn: ${turn}`);
    this.goldText.setText(`💰 ${gold}`);
    this.energyText.setText(`⚡ ${energy}`);
    this.phaseText.setText(phase);
  }
}
