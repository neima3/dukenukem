import Phaser from 'phaser';
import { Boss } from './Boss';

/** HoverTank — level 1 boss. Frontal cannon + missiles; weak vent underneath. */
export class HoverTank extends Boss {
  private bob = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'bossTank', 'tank');
    this.name = 'HOVER TANK';
    this.health = this.maxHealth = 500;
    this.damage = 22;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.body!.setSize(180, 70);
    this.body!.setOffset(10, 30);
  }

  protected behave(t: number, dt: number): void {
    this.bob += dt * 0.003;
    const p = this.scene.player;
    const targetX = p.x + 220 * (p.x > this.x ? 1 : -1);
    this.x = Phaser.Math.Linear(this.x, targetX, 0.02);
    this.y = this.scene.level.groundY - 60 + Math.sin(this.bob) * 10;
    this.setFlipX(p.x > this.x);

    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.phase >= 3 ? 700 : this.phase >= 2 ? 1000 : 1500;
      const a = Phaser.Math.Angle.Between(this.x, this.y - 10, p.x, p.y - 20);
      this.scene.spawnEnemyProjectile(this.x - this.facing * 60, this.y - 20, Math.cos(a) * 320, Math.sin(a) * 320, 14);
      if (this.phase >= 2) {
        this.scene.spawnEnemyProjectile(this.x, this.y - 30, Math.cos(a - 0.3) * 280, Math.sin(a - 0.3) * 280, 14);
        this.scene.spawnEnemyProjectile(this.x, this.y - 30, Math.cos(a + 0.3) * 280, Math.sin(a + 0.3) * 280, 14);
      }
      if (this.phase >= 3) {
        // lobbed missile
        this.scene.spawnEnemyProjectile(this.x, this.y, 120 * this.facing, -260, 16, 200, true);
      }
    }
    void t;
  }
}
