import Phaser from 'phaser';
import { Enemy } from './Enemy';

/** LizardTrooper — ranged grunt. Walks toward player, fires occasional pellets. */
export class LizardTrooper extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'enemyLizard', 'lizard');
    this.health = this.maxHealth = 36;
    this.speed = 70;
    this.damage = 10;
    this.scoreValue = 100;
    this.detectRange = 560;
    this.body!.setSize(24, 36);
  }

  protected behave(_t: number, dt: number): void {
    this.setVelocityX(0);
    if (this.seePlayer()) {
      this.state = 'aggro';
      this.facePlayer();
      const d = this.distToPlayer();
      if (d > 260) this.setVelocityX(this.speed * this.facing);
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = 1400;
        this.shoot();
      }
    } else {
      this.state = 'idle';
    }
  }

  private shoot(): void {
    const p = this.scene.player;
    const a = Phaser.Math.Angle.Between(this.x, this.y - 20, p.x, p.y - 20);
    this.scene.spawnEnemyProjectile(this.x + this.facing * 14, this.y - 20, Math.cos(a) * 360, Math.sin(a) * 360, 8);
  }
}
