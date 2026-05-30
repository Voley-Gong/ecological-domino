import Phaser from 'phaser';
import { COLORS, GRID_OFFSET_X, GRID_SIZE, CELL_SIZE } from '../utils/constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = 400;
    const cy = 300;

    // Background
    const bg = this.add.rectangle(cx, cy, 800, 600, COLORS.SOIL_DARK);

    // Title
    const title = this.add.text(cx, cy - 100, '🌾 生态多米诺 🌾', {
      fontSize: '36px',
      fontFamily: 'Courier New, monospace',
      color: '#c9a227',
      stroke: '#000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Subtitle
    const sub = this.add.text(cx, cy - 50, 'Ecological Domino', {
      fontSize: '18px',
      fontFamily: 'Courier New, monospace',
      color: '#888',
      stroke: '#000',
      strokeThickness: 2,
    });
    sub.setOrigin(0.5);

    // Description
    const desc = this.add.text(cx, cy + 20, '疾病是燃料，不是威胁\n放置作物引发连锁反应，将真菌转化为金币!', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      color: '#f5e6c8',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center',
    });
    desc.setOrigin(0.5);

    // Start button
    const btnBg = this.add.rectangle(cx, cy + 100, 200, 50, 0x2a4a1e, 1);
    btnBg.setStrokeStyle(2, COLORS.GOLD);
    btnBg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(cx, cy + 100, '开始游戏 ▶', {
      fontSize: '18px',
      fontFamily: 'Courier New, monospace',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 2,
    });
    btnText.setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x3a5a2e));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x2a4a1e));
    btnBg.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Crop preview
    const crops = ['🌿 捕蝇草 (触发器)', '🌻 向日葵 (放大器)', '🎃 南瓜 (终结器)'];
    let yy = cy + 160;
    for (const c of crops) {
      const t = this.add.text(cx, yy, c, {
        fontSize: '13px',
        fontFamily: 'Courier New, monospace',
        color: '#aaa',
        stroke: '#000',
        strokeThickness: 1,
      });
      t.setOrigin(0.5);
      yy += 22;
    }
  }
}
