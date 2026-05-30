import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './utils/constants';

const GAME_WIDTH = GRID_OFFSET_X + GRID_SIZE * CELL_SIZE + 20;
const GAME_HEIGHT = GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE + 80;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1208',
  scene: [MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
