import Phaser from 'phaser';
import { GAME } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05060a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GAME.GRAVITY }, debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene, VictoryScene],
});

const boot = document.getElementById('boot');
if (boot) boot.remove();
