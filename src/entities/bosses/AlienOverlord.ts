import Phaser from 'phaser';
import { Boss } from './Boss';

/** AlienOverlord — final boss. 3 phases: grounded barrage → flight → overload spiral. */
export class AlienOverlord extends Boss {
  private t = 0;
  private flying = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'bossLord', 'lord');
    this.name = 'ALIEN OVERLORD';
    this.health = this.maxHealth = 1600;
    this.damage = 30;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.body!.setSize(120, 120);
    this.body!.setOffset(20, 20);
  }

  protected onPhase(): void {
    this.flying = this.phase >= 2;
    this.scene.shake(10, 400);
    if (this.phase >= 3) this.scene.time.delayedCall(300, () => this.scene.dialogue.say('OVERLOAD IMMINENT...', 0xaa33ff));
  }

  protected behave(time: number, dt: number): void {
    this.t += dt;
    const p = this.scene.player;
    if (this.flying) {
      const a = time / 600;
      this.x = Phaser.Math.Linear(this.x, p.x + Math.cos(a) * 180, 0.05);
      this.y = Phaser.Math.Linear(this.y, this.scene.level.groundY - 220 + Math.sin(a * 1.5) * 40, 0.05);
    } else {
      this.x = Phaser.Math.Linear(this.x, this.scene.level.width - 300, 0.02);
      this.y = Phaser.Math.Linear(this.y, this.scene.level.groundY - 120 + Math.sin(this.t / 500) * 14, 0.08);
    }

    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.phase >= 3 ? 250 : this.phase >= 2 ? 420 : 700;
      this.attack(p);
    }
  }

  private attack(p: { x: number; y: number }): void {
    if (this.phase >= 3) {
      // spiral
      for (let i = 0; i < 6; i++) {
        const a = (this.t / 200) + (i / 6) * Math.PI * 2;
        this.scene.spawnEnemyProjectile(this.x, this.y - 60, Math.cos(a) * 260, Math.sin(a) * 260, 12);
      }
    } else if (this.phase >= 2) {
      // aimed triple + lob
      const a = Phaser.Math.Angle.Between(this.x, this.y - 60, p.x, p.y - 20);
      for (let i = -1; i <= 1; i++) this.scene.spawnEnemyProjectile(this.x, this.y - 60, Math.cos(a + i * 0.15) * 420, Math.sin(a + i * 0.15) * 420, 14);
      this.scene.spawnEnemyProjectile(this.x, this.y - 60, 0, 200, 14, 200, true);
    } else {
      const a = Phaser.Math.Angle.Between(this.x, this.y - 60, p.x, p.y - 20);
      this.scene.spawnEnemyProjectile(this.x, this.y - 60, Math.cos(a) * 380, Math.sin(a) * 380, 14);
    }
  }
}
