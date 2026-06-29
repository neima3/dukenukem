import Phaser from 'phaser';
import { save } from '../systems/SaveSystem';
import { sfx } from '../audio/sfxGen';
import { music } from '../audio/musicGen';
import { audio } from '../systems/AudioSystem';
import { drawLeaderboard, runNameEntry, PX, VT } from '../systems/LeaderboardUI';

export class VictoryScene extends Phaser.Scene {
  constructor() { super('Victory'); }

  create(data: { score: number }): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#04002a');
    save.submitScore(data.score);

    // fireworks
    this.time.addEvent({ loop: true, delay: 600, callback: () => {
      const x = Phaser.Math.Between(width * 0.2, width * 0.8);
      const y = Phaser.Math.Between(height * 0.2, height * 0.45);
      const colors = [0xff2d6a, 0x33ff66, 0xffcc33, 0x33ffff, 0xff8833];
      const c = Phaser.Math.RND.pick(colors);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const p = this.add.rectangle(x, y, 4, 4, c);
        this.tweens.add({ targets: p, x: x + Math.cos(a) * 120, y: y + Math.sin(a) * 120, alpha: 0, duration: 900, onComplete: () => p.destroy() });
      }
    } });

    this.add.text(width / 2, 80, 'EARTH SAVED', {
      fontFamily: PX, fontSize: '36px', color: '#33ff66',
    }).setOrigin(0.5).setShadow(0, 0, '#33ff66', 14, true, true);
    this.add.text(width / 2, 128, 'Rex Brutus cracks open a cold one.', {
      fontFamily: VT, fontSize: '24px', color: '#ffcc33',
    }).setOrigin(0.5);
    this.add.text(width / 2, 168, `FINAL SCORE  ${data.score.toString().padStart(6, '0')}`, {
      fontFamily: PX, fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0,0,'#ffffff',6,true,true);

    if (save.qualifies(data.score)) {
      this.add.text(width / 2, 210, 'NEW HIGH SCORE — ENTER INITIALS', {
        fontFamily: VT, fontSize: '22px', color: '#33ff66',
      }).setOrigin(0.5);
      runNameEntry(this, width / 2, 270, (initials) => {
        save.submitEntry(initials, data.score);
        sfx.pickup();
        this.scene.restart({ ...data });
      });
    } else {
      this.add.text(width / 2, 215, 'LEADERBOARD', {
        fontFamily: PX, fontSize: '14px', color: '#ff2d6a',
      }).setOrigin(0.5).setShadow(0,0,'#ff2d6a',8,true,true);
      drawLeaderboard(this, width / 2, 245, 8);
    }

    const menu = this.add.text(width / 2, height - 60, 'MENU', {
      fontFamily: PX, fontSize: '14px', color: '#cfcfe6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerover', () => menu.setColor('#ffcc33'));
    menu.on('pointerout', () => menu.setColor('#cfcfe6'));
    menu.on('pointerdown', () => { sfx.uiSelect(); music.stop(); this.scene.start('Menu'); });
    this.input.keyboard?.once('keydown-ESC', () => { music.stop(); this.scene.start('Menu'); });

    music.stinger('victory');
    audio.resume();
  }
}
