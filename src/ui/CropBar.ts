import { CropType, CROP_DEFS } from '../data/crops';
import { COLORS } from '../utils/constants';
import Phaser from 'phaser';

export class CropBar {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  selectedCrop: CropType | null = null;
  buttons: { type: CropType; bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text }[] = [];
  onCropSelected: ((type: CropType | null) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(30);
    this.build();
  }

  private build(): void {
    const panelX = 10;
    const panelY = 60;
    const panelW = 180;
    const panelH = 400;

    // Panel background
    const bg = this.scene.add.rectangle(
      panelX + panelW / 2, panelY + panelH / 2,
      panelW, panelH,
      COLORS.PANEL_BG, 0.9
    );
    bg.setStrokeStyle(2, COLORS.PANEL_BORDER);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(panelX + panelW / 2, panelY + 20, '作物栏', {
      fontSize: '16px',
      fontFamily: 'Courier New, monospace',
      color: '#c9a227',
      stroke: '#000',
      strokeThickness: 2,
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const types = [CropType.FLYTRAP, CropType.SUNFLOWER, CropType.PUMPKIN];
    let yOff = panelY + 55;

    for (const type of types) {
      const def = CROP_DEFS[type];
      const btnBg = this.scene.add.rectangle(panelX + panelW / 2, yOff + 50, panelW - 20, 100, 0x2a1f0f, 1);
      btnBg.setStrokeStyle(1, 0x5a4520);
      btnBg.setInteractive({ useHandCursor: true });

      const icon = this.scene.add.text(panelX + 25, yOff + 15, def.icon, {
        fontSize: '28px',
      });

      const nameText = this.scene.add.text(panelX + 60, yOff + 12, `${def.name}`, {
        fontSize: '14px',
        fontFamily: 'Courier New, monospace',
        color: '#f5e6c8',
      });

      const costText = this.scene.add.text(panelX + 60, yOff + 32, `${def.cost}💰 ${def.description}`, {
        fontSize: '10px',
        fontFamily: 'Courier New, monospace',
        color: '#c9a227',
        wordWrap: { width: 100 },
      });

      const roleText = this.scene.add.text(panelX + 60, yOff + 62, `[${def.role.toUpperCase()}]`, {
        fontSize: '10px',
        fontFamily: 'Courier New, monospace',
        color: '#888',
      });

      btnBg.on('pointerover', () => {
        if (this.selectedCrop !== type) {
          btnBg.setFillStyle(0x3a2f1f);
        }
      });
      btnBg.on('pointerout', () => {
        if (this.selectedCrop !== type) {
          btnBg.setFillStyle(0x2a1f0f);
        }
      });
      btnBg.on('pointerdown', () => {
        this.selectCrop(type);
      });

      this.container.add([btnBg, icon, nameText, costText, roleText]);
      this.buttons.push({ type, bg: btnBg, icon: nameText, label: costText });
      yOff += 110;
    }
  }

  selectCrop(type: CropType | null): void {
    // Deselect old
    for (const btn of this.buttons) {
      if (btn.type === this.selectedCrop) {
        btn.bg.setStrokeStyle(1, 0x5a4520);
        btn.bg.setFillStyle(0x2a1f0f);
      }
    }

    this.selectedCrop = type;

    // Select new
    for (const btn of this.buttons) {
      if (btn.type === type) {
        btn.bg.setStrokeStyle(2, COLORS.GOLD_BRIGHT);
        btn.bg.setFillStyle(0x3a2f1f);
      }
    }

    this.onCropSelected?.(type);
  }

  updateGold(gold: number): void {
    // Could visually dim crops you can't afford
    for (const btn of this.buttons) {
      const def = CROP_DEFS[btn.type];
      if (gold < def.cost) {
        btn.bg.setAlpha(0.5);
      } else {
        btn.bg.setAlpha(1);
      }
    }
  }
}
