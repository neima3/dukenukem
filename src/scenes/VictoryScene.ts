import Phaser from 'phaser';
import { save } from '../systems/SaveSystem';
import { sfx } from '../audio/sfxGen';
import { music } from '../audio/musicGen';
import { audio } from '../systems/AudioSystem';

export class VictoryScene extends Phaser.Scene {
  constructor() { super('Victory'); }

  create(data: { score: number }): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#04002a');
    save.submitScore(data.score);

    // fireworks
    this.time.addEvent({ loop: true, delay: 600, callback: () => {
      const x = Phaser.Math.Between(width * 0.2, width * 0.8);
      const y = Phaser.Math.Between(height * 0.2, height * 0.5);
      const colors = [0xff2d6a, 0x33ff66, 0xffcc33, 0x33ffff, 0xff8833];
      const c = Phaser.Math.RND.pick(colors);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const p = this.add.rectangle(x, y, 4, 4, c);
        this.tweens.add({ targets: p, x: x + Math.cos(a) * 120, y: y + Math.sin(a) * 120, alpha: 0, duration: 900, onComplete: () => p.destroy() });
      }
    } });

    this.add.text(width / 2, 140, 'EARTH SAVED', {
      fontFamily: 'monospace', fontSize: '88px', color: '#33ff66', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#33ff66', 8, true, true);

    this.add.text(width / 2, 240, 'Rex Brutus drinks a beer. The end.', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffcc33',
    }).setOrigin(0.5);

    this.add.text(width / 2, 340, `FINAL SCORE  ${data.score.toString().padStart(6, '0')}`, {
      fontFamily: 'monospace', fontSize: '34px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add.text(width / 2, 390, `HIGH SCORE   ${save.highScore.toString().padStart(6, '0')}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#9a9ac6',
    }).setOrigin(0.5);

    this.add.text(width / 2, 470, 'THANKS FOR PLAYING', {
      fontFamily: 'monospace', fontSize: '20px', color: '#7a7a99',
    }).setOrigin(0.5);

    const menu = this.add.text(width / 2, 580, '[ MAIN MENU ]', {
      fontFamily: 'monospace', fontSize: '26px', color: '#cfcfe6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerover', () => menu.setColor('#ffcc33'));
    menu.on('pointerout', () => menu.setColor('#cfcfe6'));
    menu.on('pointerdown', () => { sfx.uiSelect(); music.stop(); this.scene.start('Menu'); });

    music.stinger('victory');
    audio.resume();
  }
}
