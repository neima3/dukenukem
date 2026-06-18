import Phaser from 'phaser';
import { Enemy } from './Enemy';

/** HeavyGunner — suppressive hitscan-ish burst from range. Forces movement. */
export class HeavyGunner extends Enemy {
  private burstLeft = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'enemyHeavy', 'heavy');
    this.health = this.maxHealth = 80;
    this.speed = 40;
    this.damage = 14;
    this.scoreValue = 250;
    this.detectRange = 700;
    this.body!.setSize(30, 38);
    this.body!.setOffset(3, 4);
  }

  protected behave(_t: number, dt: number): void {
    this.setVelocityX(0);
    if (this.seePlayer()) {
      this.state = 'aggro';
      this.facePlayer();
      const d = this.distToPlayer();
      if (d > 420) this.setVelocityX(this.speed * this.facing);
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        if (this.burstLeft <= 0) {
          this.burstLeft = 4;
          this.fireCooldown = 1600;
        } else {
          this.burstLeft--;
          this.fireCooldown = 130;
          this.shoot();
        }
      }
    } else {
      this.state = 'idle';
    }
  }

  private shoot(): void {
    const p = this.scene.player;
    const a = Phaser.Math.Angle.Between(this.x, this.y - 22, p.x, p.y - 20);
    // tracer-like fast projectile
    this.scene.spawnEnemyProjectile(this.x + this.facing * 20, this.y - 24, Math.cos(a) * 720, Math.sin(a) * 720, 10);
  }
}
