import Phaser from 'phaser';
import { generateAll } from '../art/spriteGen';
import { audio } from '../systems/AudioSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Everything procedural — nothing to load from disk. Just init audio busses.
    audio.init();
  }

  create(): void {
    generateAll(this);

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05060a');
    for (let i = 0; i < 140; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 1),
      );
    }

    const t = this.add.text(width / 2, height / 2, 'REX BRUTUS', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#ff2d6a',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 56, 'ALIEN APOCALYPSE', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffcc33',
    }).setOrigin(0.5);
    this.add.text(width / 2, height - 40, 'assets synthesized', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444466',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: t,
      scale: { from: 0.9, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.input.once('pointerdown', () => {
      audio.resume();
      this.scene.start('Menu');
    });
    this.input.keyboard?.once('keydown-SPACE', () => {
      audio.resume();
      this.scene.start('Menu');
    });
  }
}
