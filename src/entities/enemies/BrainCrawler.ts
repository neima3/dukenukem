import Phaser from 'phaser';
import { Enemy } from './Enemy';

/** BrainCrawler — melee ambusher. Lurks until player near, leaps to attack. */
export class BrainCrawler extends Enemy {
  private leapCd = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene as any, x, y, 'enemyBrain', 'brain');
    this.health = this.maxHealth = 28;
    this.speed = 110;
    this.damage = 14;
    this.scoreValue = 120;
    this.detectRange = 360;
    this.body!.setSize(26, 24);
    this.body!.setOffset(2, 6);
  }

  protected behave(_t: number, dt: number): void {
    this.setVelocityX(0);
    this.leapCd -= dt;
    if (this.seePlayer()) {
      this.state = 'aggro';
      this.facePlayer();
      const d = this.distToPlayer();
      if (d > 80) this.setVelocityX(this.speed * this.facing);
      if (d < 140 && this.leapCd <= 0 && this.body!.blocked.down) {
        this.leapCd = 1800;
        this.setVelocityY(-380);
        this.setVelocityX(this.facing * 180);
      }
    } else {
      this.state = 'idle';
    }
  }
}
