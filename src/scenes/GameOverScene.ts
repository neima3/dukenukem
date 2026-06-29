import Phaser from 'phaser';
import { save } from '../systems/SaveSystem';
import { sfx } from '../audio/sfxGen';
import { drawLeaderboard, runNameEntry, PX, VT } from '../systems/LeaderboardUI';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: { level: number; score: number }): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#100008');

    this.add.text(width / 2, 90, 'YOU DIED', {
      fontFamily: PX, fontSize: '40px', color: '#ff2244',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2244', 14, true, true);

    this.add.text(width / 2, 150, `SCORE  ${data.score.toString().padStart(6, '0')}`, {
      fontFamily: PX, fontSize: '16px', color: '#ffcc33',
    }).setOrigin(0.5);
    this.add.text(width / 2, 182, `REACHED STAGE ${data.level + 1}`, {
      fontFamily: VT, fontSize: '22px', color: '#9a9ac6',
    }).setOrigin(0.5);

    save.submitScore(data.score);

    if (save.qualifies(data.score)) {
      this.nameEntry(data, width, height);
    } else {
      this.showButtons(data, width, height);
      this.add.text(width / 2, 230, 'LEADERBOARD', { fontFamily: PX, fontSize: '14px', color: '#ff2d6a' }).setOrigin(0.5).setShadow(0,0,'#ff2d6a',8,true,true);
      drawLeaderboard(this, width / 2, 260, 8);
    }
  }

  /** Arcade 3-initial entry via keyboard. */
  private nameEntry(data: { level: number; score: number }, width: number, _height: number): void {
    this.add.text(width / 2, 230, 'NEW HIGH SCORE!', {
      fontFamily: PX, fontSize: '14px', color: '#33ff66',
    }).setOrigin(0.5).setShadow(0, 0, '#33ff66', 8, true, true);
    this.add.text(width / 2, 262, 'ENTER YOUR INITIALS', {
      fontFamily: VT, fontSize: '22px', color: '#cfcfe6',
    }).setOrigin(0.5);

    runNameEntry(this, width / 2, 330, (initials) => {
      save.submitEntry(initials, data.score);
      sfx.pickup();
      this.scene.restart({ ...data });
    });
  }

  private showButtons(data: { level: number; score: number }, width: number, height: number): void {
    const by = height - 120;
    const retry = this.add.text(width / 2 - 130, by, 'RETRY', {
      fontFamily: PX, fontSize: '14px', color: '#cfcfe6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setColor('#ffcc33'));
    retry.on('pointerout', () => retry.setColor('#cfcfe6'));
    retry.on('pointerdown', () => { sfx.uiSelect(); this.scene.start('Game', { level: data.level }); });

    const menu = this.add.text(width / 2 + 130, by, 'MENU', {
      fontFamily: PX, fontSize: '14px', color: '#7a7a99',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerover', () => menu.setColor('#ffcc33'));
    menu.on('pointerout', () => menu.setColor('#7a7a99'));
    menu.on('pointerdown', () => { sfx.uiSelect(); this.scene.start('Menu'); });

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game', { level: data.level }));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Menu'));
  }
}
