import Phaser from 'phaser';
import { GAME, COLORS } from '../config';
import type { WeaponId } from '../config';
import type { GameScene } from '../scenes/GameScene';
import { Weapon, makeWeapon } from '../weapons/Weapon';
import { sfx } from '../audio/sfxGen';

type Facing = -1 | 1;

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene;
  health = GAME.PLAYER_MAX_HEALTH;
  maxHealth = GAME.PLAYER_MAX_HEALTH;
  armor = 0;
  maxArmor = GAME.PLAYER_MAX_ARMOR;
  facing: Facing = 1;
  crouching = false;
  invuln = 0;          // ms of i-frames
  fuel = 0;            // jetpack fuel
  maxFuel = 100;
  jetpacking = false;
  grounded = false;

  weapons = new Map<WeaponId, Weapon>();
  currentWeaponId: WeaponId = 'pistol';
  firing = false;
  fireAngle = 0;

  coyote = 0;
  jumpsLeft = 1;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body!.setSize(20, 40);
    this.body!.setOffset(6, 4);
    this.setCollideWorldBounds(false);
    this.setMaxVelocity(400, 1200);
    this.setDepth(10);

    this.weapons.set('pistol', makeWeapon('pistol'));
  }

  get currentWeapon(): Weapon {
    return this.weapons.get(this.currentWeaponId)!;
  }

  addWeapon(id: WeaponId, ammo?: number): void {
    const existing = this.weapons.get(id);
    if (existing) {
      if (ammo != null) existing.ammo = Math.min(existing.maxAmmo, existing.ammo + ammo);
    } else {
      this.weapons.set(id, makeWeapon(id, ammo));
    }
    this.selectWeapon(id);
  }

  addAmmo(id: WeaponId, amount: number): void {
    const w = this.weapons.get(id);
    if (w) w.ammo = Math.min(w.maxAmmo, w.ammo + amount);
    else this.addWeapon(id, amount);
  }

  selectWeapon(id: WeaponId): void {
    if (!this.weapons.has(id) || this.currentWeaponId === id) return;
    this.currentWeaponId = id;
    sfx.switchWeapon();
  }

  selectBySlot(slot: number): void {
    const order: WeaponId[] = ['pistol', 'shotgun', 'chaingun', 'pipebomb', 'rocket', 'devastator'];
    const id = order[slot - 1];
    if (id) this.selectWeapon(id);
  }

  cycleWeapon(dir: number): void {
    const order: WeaponId[] = ['pistol', 'shotgun', 'chaingun', 'pipebomb', 'rocket', 'devastator'];
    const owned = order.filter((w) => this.weapons.has(w));
    if (owned.length === 0) return;
    const idx = owned.indexOf(this.currentWeaponId);
    const next = (idx + dir + owned.length) % owned.length;
    this.selectWeapon(owned[next]);
  }

  takeDamage(amount: number, fromX?: number): void {
    if (this.invuln > 0 || this.scene.dying) return;
    let dmg = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, dmg * 0.6);
      this.armor -= absorbed;
      dmg -= absorbed;
    }
    this.health -= dmg;
    this.invuln = 600;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.clearTint());
    sfx.hurt();
    this.scene.shake(8, 200);
    if (fromX != null) {
      this.setVelocityX(this.x < fromX ? -180 : 180);
      this.setVelocityY(-220);
    }
    this.scene.hud.flashDamage();
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    sfx.pickup();
  }
  addArmor(amount: number): void {
    this.armor = Math.min(this.maxArmor, this.armor + amount);
    sfx.armor();
  }
  addFuel(amount: number): void {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    sfx.pickup();
  }

  private die(): void {
    this.scene.dying = true;
    this.disableBody();
    this.scene.particles.explosion(this.x, this.y - 20, 60);
    sfx.explosion();
    this.scene.time.delayedCall(900, () => this.scene.onPlayerDeath());
  }

  update(time: number, dt: number, input: ReturnType<GameScene['makeInputs']>): void {
    if (this.scene.dying) return;
    if (this.invuln > 0) this.invuln -= dt;

    // facing + aim
    const pointer = this.scene.input.activePointer;
    const targetAngle = input.aimOverride != null
      ? input.aimOverride
      : Phaser.Math.Angle.Between(this.x, this.y - 20, pointer.worldX, pointer.worldY);
    this.fireAngle = targetAngle;
    this.facing = input.aimOverride != null
      ? (Math.cos(targetAngle) >= 0 ? 1 : -1)
      : (pointer.worldX < this.x ? -1 : 1);
    this.setFlipX(this.facing < 0);

    // horizontal movement
    const speed = GAME.PLAYER_SPEED;
    let vx = 0;
    if (input.left) vx -= speed;
    if (input.right) vx += speed;

    // grounded must be current-frame before crouch/jetpack/coyote read it
    this.grounded = this.body!.blocked.down || this.body!.touching.down;
    if (this.grounded) { this.coyote = 120; this.jumpsLeft = 1; }
    else this.coyote -= dt;

    // crouch
    this.crouching = input.down && this.grounded && !this.jetpacking;
    if (this.crouching) vx *= 0.4;

    this.setVelocityX(vx);

    if (input.jumpPressed && this.coyote > 0) {
      this.setVelocityY(-GAME.PLAYER_JUMP);
      this.coyote = 0;
      sfx.jump();
      this.scene.particles.dust(this.x, this.y);
    }

    // jetpack
    this.jetpacking = input.jumpHeld && this.fuel > 0 && !this.grounded && this.body!.velocity.y > -100;
    if (this.jetpacking) {
      this.fuel = Math.max(0, this.fuel - dt * 0.06);
      this.setVelocityY(-180);
      if (Math.random() > 0.4) this.scene.particles.jet(this.x, this.y);
    }

    // weapon switching
    const slot = input.weaponSlot;
    if (slot) this.selectBySlot(slot);
    if (input.cycle !== 0) { this.cycleWeapon(input.cycle); }

    // firing
    this.firing = input.fire;
    if (this.firing) {
      const muzzleX = this.x + Math.cos(targetAngle) * 22;
      const muzzleY = (this.y - 22) + Math.sin(targetAngle) * 22;
      this.currentWeapon.tryFire(this.scene, time, muzzleX, muzzleY, targetAngle);
    }

    // detonate pipe bombs
    if (input.detonate) this.scene.detonatePipes();

    // fell off the world
    if (this.y > this.scene.level.height + 100) {
      this.health = 0;
      this.die();
    }

    // animation tweaks via scale to simulate walk
    if (this.grounded && Math.abs(vx) > 10) {
      this.setAngle(Math.sin(time / 60) * 2);
    } else {
      this.setAngle(0);
    }
    // crouch squish (visual only)
    this.setScale(1, this.crouching ? 0.85 : 1);

    // tint pulse when low health
    if (this.health <= 25 && this.invuln <= 0) {
      this.setTint(0xff6666);
    } else if (this.invuln <= 0) {
      this.clearTint();
    }
  }
}

export { COLORS };
