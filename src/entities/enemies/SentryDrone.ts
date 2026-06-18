import Phaser from 'phaser';
import { Enemy } from './Enemy';

/** SentryDrone — flying, swoops at player in waves. No gravity. */
export class SentryDrone extends Enemy {
  private bob = Math.random() * Math.PI * 2;
  private swoopCd = 1200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'enemyDrone', 'drone');
    this.health = this.maxHealth = 22;
    this.speed = 130;
    this.damage = 12;
    this.scoreValue = 150;
    this.detectRange = 640;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.body!.setSize(24, 24);
  }

  protected behave(t: number, dt: number): void {
    this.bob += dt * 0.005;
    this.setVelocityY(Math.sin(this.bob) * 30);
    this.setVelocityX(0);
    if (this.seePlayer()) {
      this.state = 'aggro';
      this.facePlayer();
      const p = this.scene.player;
      const dx = p.x - this.x;
      this.swoopCd -= dt;
      if (this.swoopCd <= 0) {
        this.swoopCd = 2200;
        const a = Phaser.Math.Angle.Between(this.x, this.y, p.x, p.y);
        this.setVelocity(Math.cos(a) * this.speed * 1.6, Math.sin(a) * this.speed * 1.6);
      } else {
        this.setVelocityX(Math.sign(dx) * this.speed * 0.6);
      }
      // hover tracking vertically toward player
      const dy = p.y - 30 - this.y;
      this.setVelocityY(this.body!.velocity.y + Math.sign(dy) * 30);
    }
    void t;
  }
}
