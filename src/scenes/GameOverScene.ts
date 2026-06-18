import Phaser from 'phaser';
import { save } from '../systems/SaveSystem';
import { sfx } from '../audio/sfxGen';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: { level: number; score: number }): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#100008');
    save.submitScore(data.score);

    this.add.text(width / 2, height / 2 - 120, 'YOU DIED', {
      fontFamily: 'monospace', fontSize: '96px', color: '#ff2244', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2244', 8, true, true);

    this.add.text(width / 2, height / 2 - 10, `SCORE  ${data.score.toString().padStart(6, '0')}`, {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffcc33',
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, `REACHED LEVEL ${data.level + 1}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#9a9ac6',
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 70, `HIGH SCORE  ${save.highScore.toString().padStart(6, '0')}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#7a7a99',
    }).setOrigin(0.5);

    const retry = this.add.text(width / 2, height / 2 + 150, '[ RETRY LEVEL ]', {
      fontFamily: 'monospace', fontSize: '26px', color: '#cfcfe6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setColor('#ffcc33'));
    retry.on('pointerout', () => retry.setColor('#cfcfe6'));
    retry.on('pointerdown', () => { sfx.uiSelect(); this.scene.start('Game', { level: data.level }); });

    const menu = this.add.text(width / 2, height / 2 + 200, '[ MAIN MENU ]', {
      fontFamily: 'monospace', fontSize: '20px', color: '#7a7a99',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerover', () => menu.setColor('#ffcc33'));
    menu.on('pointerout', () => menu.setColor('#7a7a99'));
    menu.on('pointerdown', () => { sfx.uiSelect(); this.scene.start('Menu'); });

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game', { level: data.level }));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Menu'));
  }
}
