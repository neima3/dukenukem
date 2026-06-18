import Phaser from 'phaser';
import { Boss } from './Boss';

/** SandWorm — level 4 boss. Emerges from floor; segment body; spits acid. */
export class SandWorm extends Boss {
  private emerge = 0;
  private submerged = true;
  private diveCd = 1500;
  private segments: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'bossWorm', 'worm');
    this.name = 'SAND WORM';
    this.health = this.maxHealth = 900;
    this.damage = 26;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.body!.setSize(90, 90);
    // segment decorations
    for (let i = 0; i < 5; i++) {
      const seg = scene.add.circle(x, y, 30 - i * 3, 0x886633);
      seg.setDepth(7);
      this.segments.push(seg);
    }
  }

  protected onPhase(): void {
    if (this.phase >= 2) this.diveCd = 1100;
    if (this.phase >= 3) this.diveCd = 800;
  }

  protected behave(t: number, dt: number): void {
    const p = this.scene.player;
    if (this.submerged) {
      this.diveCd -= dt;
      this.x = Phaser.Math.Linear(this.x, p.x, 0.04);
      this.y = this.scene.level.groundY + 40;
      this.setAlpha(0.3);
      if (this.diveCd <= 0) {
        this.submerged = false;
        this.emerge = 0;
        this.setAlpha(1);
      }
    } else {
      this.emerge += dt;
      this.y = Phaser.Math.Linear(this.y, this.scene.level.groundY - 60, 0.08);
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = this.phase >= 2 ? 600 : 900;
        const a = Phaser.Math.Angle.Between(this.x, this.y, p.x, p.y - 20);
        for (let i = -1; i <= 1; i++) {
          this.scene.spawnEnemyProjectile(this.x, this.y - 20, Math.cos(a + i * 0.2) * 320, Math.sin(a + i * 0.2) * 320, 14, 60, true);
        }
      }
      if (this.emerge > 2500) {
        this.submerged = true;
        this.diveCd = this.phase >= 3 ? 700 : 1200;
      }
    }
    // trail segments
    this.segments.forEach((seg, i) => {
      const tx = this.x - Math.sin(t / 200 + i) * (i + 1) * 6;
      const ty = this.y + (i + 1) * 22;
      seg.x = Phaser.Math.Linear(seg.x, tx, 0.3);
      seg.y = Phaser.Math.Linear(seg.y, ty, 0.3);
    });
    void dt;
  }

  die(): void {
    this.segments.forEach((s) => s.destroy());
    super.die();
  }
}
