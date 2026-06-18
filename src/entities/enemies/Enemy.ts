import Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { EnemyType } from '../../levels/levelData';

export type EnemyState = 'idle' | 'aggro' | 'attack' | 'hurt' | 'dead';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene;
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  scoreValue: number;
  state: EnemyState = 'idle';
  facing: -1 | 1 = -1;
  fireCooldown = 0;
  detectRange = 520;
  attackRange = 420;
  alive = true;
  aggroTime = 0;

  constructor(scene: GameScene, x: number, y: number, texture: string, type: EnemyType) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.type = type;
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(false);
    this.setDepth(5);
    scene.enemies.add(this);
    this.health = this.maxHealth = 30;
    this.speed = 90;
    this.damage = 12;
    this.scoreValue = 100;
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.health -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => { if (this.alive) this.clearTint(); });
    sfxHit();
    if (this.health <= 0) this.die();
    else {
      this.state = 'aggro';
      this.aggroTime = 5000;
    }
  }

  die(): void {
    if (!this.alive) return;
    this.alive = false;
    this.state = 'dead';
    this.scene.particles.blood(this.x, this.y - this.height / 2);
    sfxDie();
    this.scene.onEnemyKilled(this);
    this.disableBody(true, true);
    this.destroy();
  }

  protected seePlayer(): boolean {
    const p = this.scene.player;
    if (!p) return false;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    return Math.abs(dx) < this.detectRange && Math.abs(dy) < 200 && this.scene.hasLineOfSight(this.x, this.y - 10, p.x, p.y - 20);
  }

  protected facePlayer(): void {
    const p = this.scene.player;
    if (!p) return;
    this.facing = p.x < this.x ? -1 : 1;
    this.setFlipX(this.facing < 0);
  }

  protected distToPlayer(): number {
    const p = this.scene.player;
    return Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
  }

  /** default: walk toward player, touch damage */
  protected behaveGround(_t: number, dt: number): void {
    this.setVelocityX(0);
    if (this.seePlayer() || this.aggroTime > 0) {
      this.state = 'aggro';
      this.aggroTime -= dt;
      this.facePlayer();
      this.setVelocityX(this.speed * this.facing);
    } else {
      this.state = 'idle';
    }
    this.fireCooldown -= dt;
  }

  update(time: number, dt: number): void {
    if (!this.alive) return;
    this.behave(time, dt);
    // fell off
    if (this.y > this.scene.level.height + 200) this.die();
  }

  protected abstract behave(time: number, dt: number): void;
  /** called by overlap with player */
  touchPlayer(): void {
    if (!this.alive) return;
    this.scene.player.takeDamage(this.damage, this.x);
  }
}

// lazy imports to avoid circular deps
import { sfx as sfxMod } from '../../audio/sfxGen';
function sfxHit(): void { sfxMod.enemyHit(); }
function sfxDie(): void { sfxMod.enemyDie(); }
