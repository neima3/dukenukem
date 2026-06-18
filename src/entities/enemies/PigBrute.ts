import Phaser from 'phaser';
import { Enemy } from './Enemy';

/** PigBrute — tanky, closes distance, shotgun burst at close range. */
export class PigBrute extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'enemyPig', 'pig');
    this.health = this.maxHealth = 120;
    this.speed = 60;
    this.damage = 18;
    this.scoreValue = 200;
    this.detectRange = 600;
    this.body!.setSize(34, 40);
    this.body!.setOffset(3, 4);
  }

  protected behave(_t: number, dt: number): void {
    this.setVelocityX(0);
    if (this.seePlayer()) {
      this.state = 'aggro';
      this.facePlayer();
      const d = this.distToPlayer();
      if (d > 180) this.setVelocityX(this.speed * this.facing);
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && d < 360) {
        this.fireCooldown = 1700;
        this.burst();
      }
    } else {
      this.state = 'idle';
    }
  }

  private burst(): void {
    const p = this.scene.player;
    const a = Phaser.Math.Angle.Between(this.x, this.y - 20, p.x, p.y - 20);
    for (let i = -1; i <= 1; i++) {
      const aa = a + i * 0.18;
      this.scene.spawnEnemyProjectile(this.x + this.facing * 16, this.y - 22, Math.cos(aa) * 420, Math.sin(aa) * 420, 9);
    }
  }
}
