import Phaser from 'phaser';
import { generateAll } from '../art/spriteGen';
import { audio } from '../systems/AudioSystem';
import { COLORS } from '../config';

const PX = "'Press Start 2P', monospace";

export class BootScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Container[] = [];

  constructor() { super('Boot'); }

  preload(): void {
    audio.init();
  }

  create(): void {
    generateAll(this);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05060a');

    // parallax starfield (3 layers)
    this.stars = [];
    for (let layer = 0; layer < 3; layer++) {
      const c = this.add.container(0, 0).setDepth(-10 + layer).setScrollFactor(0.15 + layer * 0.15);
      const n = 50 + layer * 30;
      for (let i = 0; i < n; i++) {
        const s = this.add.rectangle(
          Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
          layer === 2 ? 3 : 2, layer === 2 ? 3 : 2,
          layer === 2 ? 0xffe066 : 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
        c.add(s);
        this.tweens.add({ targets: s, alpha: { from: s.alpha, to: 0.1 }, duration: Phaser.Math.Between(1200, 3600), yoyo: true, repeat: -1 });
      }
      this.stars.push(c);
    }

    // neon horizon band
    const band = this.add.rectangle(0, height * 0.78, width, 4, COLORS.player, 0.6).setOrigin(0, 0.5).setDepth(-5);
    this.tweens.add({ targets: band, alpha: { from: 0.2, to: 0.8 }, duration: 1600, yoyo: true, repeat: -1 });

    // logo plate (procedural alien-skull mark)
    this.drawLogo(width / 2, height * 0.30);

    // title with glow
    const title = this.add.text(width / 2, height * 0.46, 'REX BRUTUS', {
      fontFamily: PX, fontSize: '56px', color: '#ff2d6a',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2d6a', 18, true, true);
    this.tweens.add({ targets: title, scale: { from: 0.96, to: 1.03 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(width / 2, height * 0.55, 'ALIEN  APOCALYPSE', {
      fontFamily: PX, fontSize: '18px', color: '#ffcc33',
    }).setOrigin(0.5).setShadow(0, 0, '#ffcc33', 8, true, true);

    // blinking start prompt
    const prompt = this.add.text(width / 2, height * 0.72, 'CLICK  OR  PRESS  SPACE', {
      fontFamily: PX, fontSize: '12px', color: '#cfcfe6',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: { from: 1, to: 0.15 }, duration: 650, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height - 28, 'v1.0 · an original retro shooter', {
      fontFamily: "'VT323', monospace", fontSize: '18px', color: '#444466',
    }).setOrigin(0.5);

    const enter = () => { audio.resume(); this.cameras.main.fadeOut(400, 0, 0, 0, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => { if (p >= 1) this.scene.start('Menu'); }); };
    this.input.once('pointerdown', enter);
    this.input.keyboard?.once('keydown-SPACE', enter);
  }

  /** Procedural alien-skull emblem inside a neon ring. */
  private drawLogo(cx: number, cy: number): void {
    const c = this.add.container(cx, cy).setDepth(2);
    const ring = this.add.circle(0, 0, 56, 0x000000, 0).setStrokeStyle(3, COLORS.player, 0.9);
    const ring2 = this.add.circle(0, 0, 64, 0x000000, 0).setStrokeStyle(1, COLORS.ammo, 0.5);
    // dome
    const dome = this.add.rectangle(0, -6, 44, 36, 0x14142a).setOrigin(0.5, 0.5);
    dome.setFillStyle(); // noop guard
    dome.setFillStyle(0x14142a);
    const jaw = this.add.triangle(0, 22, -16, 0, 16, 0, 0, 22, 0x14142a);
    // eyes
    const le = this.add.rectangle(-11, -2, 10, 10, COLORS.player).setAngle(45);
    const re = this.add.rectangle(11, -2, 10, 10, COLORS.player).setAngle(45);
    this.tweens.add({ targets: [le, re], alpha: { from: 1, to: 0.4 }, duration: 700, yoyo: true, repeat: -1 });
    c.add([ring2, ring, dome, jaw, le, re]);
    this.tweens.add({ targets: c, angle: { from: -2, to: 2 }, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
