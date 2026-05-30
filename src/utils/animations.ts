import Phaser from 'phaser';

export function pulseAlpha(
  scene: Phaser.Scene,
  target: { alpha: number },
  min = 0.4,
  max = 1.0,
  duration = 800
): void {
  scene.tweens.add({
    targets: target,
    alpha: { from: min, to: max },
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

export function bobUpDown(
  scene: Phaser.Scene,
  target: { y: number },
  amount = 3,
  duration = 1200
): void {
  scene.tweens.add({
    targets: target,
    y: { from: target.y, to: target.y + amount },
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

export function shakeCamera(scene: Phaser.Scene, intensity = 0.01, duration = 300): void {
  scene.cameras.main.shake(duration, intensity);
}

export function floatTextUp(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string | number = '#ffd700',
  size = 20
): void {
  const txt = scene.add.text(x, y, text, {
    fontSize: `${size}px`,
    fontFamily: 'Courier New, monospace',
    color: typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color,
    stroke: '#000',
    strokeThickness: 3,
  });
  txt.setOrigin(0.5);
  txt.setDepth(100);
  scene.tweens.add({
    targets: txt,
    y: y - 60,
    alpha: { from: 1, to: 0 },
    duration: 1200,
    ease: 'Power2',
    onComplete: () => txt.destroy(),
  });
}

export function flashCell(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  size: number,
  duration = 400
): void {
  const rect = scene.add.rectangle(x, y, size, size, color, 0.5);
  rect.setDepth(50);
  scene.tweens.add({
    targets: rect,
    alpha: { from: 0.6, to: 0 },
    scaleX: { from: 1, to: 1.3 },
    scaleY: { from: 1, to: 1.3 },
    duration,
    onComplete: () => rect.destroy(),
  });
}

export function chainDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
