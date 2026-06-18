import Phaser from 'phaser';

/** Particle helpers built on Phaser's particle emitters using the 'pix' texture. */
export class ParticleSystem {
  scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private emit(x: number, y: number, count: number, color: number, speed: number, lifespan: number, scale: number, gravityY = 400): void {
    const emitter = this.scene.add.particles(x, y, 'pix', {
      speed: { min: speed * 0.3, max: speed },
      angle: { min: 0, max: 360 },
      lifespan,
      quantity: count,
      scale: { start: scale, end: 0 },
      tint: color,
      gravityY,
      blendMode: 'ADD',
      emitting: false,
    });
    emitter.explode(count);
    this.scene.time.delayedCall(lifespan + 50, () => emitter.destroy());
  }

  muzzle(x: number, y: number, angle: number): void {
    const e = this.scene.add.particles(x, y, 'pix', {
      speed: { min: 80, max: 200 },
      angle: { min: (angle * 180 / Math.PI) - 18, max: (angle * 180 / Math.PI) + 18 },
      lifespan: 120,
      quantity: 6,
      scale: { start: 1.2, end: 0 },
      tint: 0xffe066,
      blendMode: 'ADD',
      emitting: false,
    });
    e.explode(6);
    this.scene.time.delayedCall(160, () => e.destroy());
  }

  blood(x: number, y: number): void {
    this.emit(x, y, 14, 0x66ff66, 220, 500, 1.2);
  }
  sparks(x: number, y: number): void {
    this.emit(x, y, 8, 0xffd633, 180, 300, 1, 100);
  }
  dust(x: number, y: number): void {
    this.emit(x, y, 6, 0x888899, 80, 300, 1, 0);
  }
  jet(x: number, y: number): void {
    this.emit(x, y, 2, 0x33ffff, 120, 240, 0.9, -200);
  }
  pickup(x: number, y: number): void {
    this.emit(x, y, 10, 0x33ff66, 120, 400, 1, -100);
  }
  explosion(x: number, y: number, radius: number): void {
    this.emit(x, y, 30, 0xff8833, 320, 600, 2.4);
    this.emit(x, y, 18, 0xffe066, 200, 500, 1.8);
    this.emit(x, y, 10, 0x666666, 140, 800, 2, 60);
    const flash = this.scene.add.circle(x, y, radius, 0xffffff, 0.8);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 2.5, duration: 220, onComplete: () => flash.destroy() });
  }
}
