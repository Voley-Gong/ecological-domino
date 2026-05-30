import Phaser from 'phaser';
import { COLORS, GRID_SIZE, CELL_SIZE, GRID_OFFSET_X } from '../utils/constants';

export class EndTurnButton {
  scene: Phaser.Scene;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  enabled: boolean = true;
  onClick: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const bx = 10 + 90;
    const by = 530;

    this.bg = scene.add.rectangle(bx, by, 160, 40, 0x2a4a1e, 1);
    this.bg.setStrokeStyle(2, COLORS.GOLD);
    this.bg.setDepth(30);
    this.bg.setInteractive({ useHandCursor: true });

    this.text = scene.add.text(bx, by, '结束回合 ▶', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 2,
    });
    this.text.setOrigin(0.5);
    this.text.setDepth(30);

    this.bg.on('pointerover', () => {
      if (this.enabled) this.bg.setFillStyle(0x3a5a2e);
    });
    this.bg.on('pointerout', () => {
      if (this.enabled) this.bg.setFillStyle(0x2a4a1e);
    });
    this.bg.on('pointerdown', () => {
      if (this.enabled) this.onClick?.();
    });
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    this.bg.setAlpha(v ? 1 : 0.4);
    this.bg.setFillStyle(v ? 0x2a4a1e : 0x1a1a1a);
  }
}
