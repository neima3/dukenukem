import Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { BossType } from '../../levels/levelData';
import { sfx } from '../../audio/sfxGen';

export abstract class Boss extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene;
  kind: BossType;
  health: number;
  maxHealth: number;
  damage: number;
  alive = true;
  phase = 1;
  fireCooldown = 0;
  facing: -1 | 1 = -1;
  name = 'BOSS';
  scoreValue = 5000;

  constructor(scene: GameScene, x: number, y: number, texture: string, kind: BossType) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = kind;
    this.setOrigin(0.5, 1);
    this.setDepth(8);
    this.setCollideWorldBounds(false);
    this.health = this.maxHealth = 200;
    this.damage = 20;
    scene.bosses.add(this);
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.health -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => { if (this.alive) this.clearTint(); });
    sfx.bossHit();
    const phaseBefore = this.phase;
    if (this.health <= this.maxHealth * 0.66 && this.phase < 2) this.phase = 2;
    if (this.health <= this.maxHealth * 0.33 && this.phase < 3) this.phase = 3;
    if (phaseBefore !== this.phase) this.onPhase();
    this.scene.hud.updateBossBar(this.health / this.maxHealth, this.name);
    if (this.health <= 0) this.die();
  }

  protected onPhase(): void { /* override */ }

  die(): void {
    if (!this.alive) return;
    this.alive = false;
    this.scene.hud.hideBossBar();
    this.scene.particles.explosion(this.x, this.y - this.height / 2, 140);
    sfx.bossDie();
    this.scene.shake(16, 800);
    this.scene.onBossKilled(this);
    // death cascade
    let n = 4;
    const tick = (): void => {
      if (n-- <= 0) { this.disableBody(true, true); this.destroy(); return; }
      this.scene.particles.explosion(
        this.x + Phaser.Math.Between(-60, 60),
        this.y - this.height / 2 + Phaser.Math.Between(-40, 40),
        60,
      );
      sfx.bossDie();
      this.scene.time.delayedCall(180, tick);
    };
    this.scene.time.delayedCall(200, tick);
  }

  touchPlayer(): void {
    if (!this.alive) return;
    this.scene.player.takeDamage(this.damage, this.x);
  }

  update(time: number, dt: number): void {
    if (!this.alive) return;
    this.fireCooldown -= dt;
    this.behave(time, dt);
  }

  protected abstract behave(time: number, dt: number): void;
}
