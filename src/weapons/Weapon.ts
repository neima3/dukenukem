import Phaser from 'phaser';
import { WEAPONS, type WeaponId } from '../config';
import { sfx } from '../audio/sfxGen';

/** Pooled projectile (bullet/rocket/pipe). */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  weapon!: WeaponId;
  damage = 10;
  speed = 800;
  isExplosive = false;
  explosionRadius = 0;
  lifeMs = 1400;
  born = 0;
  isEnemy = false;
  armed = true;       // pipe bombs become armed (detonatable) when false
  spawnX = 0; spawnY = 0;

  constructor(scene: Phaser.Scene, texture: string) {
    super(scene, 0, 0, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  fire(x: number, y: number, vx: number, vy: number, opts: Partial<Projectile>): void {
    this.enableBody(true, x, y, true, true);
    this.weapon = opts.weapon ?? 'pistol';
    this.damage = opts.damage ?? 10;
    this.speed = opts.speed ?? 800;
    this.isExplosive = opts.isExplosive ?? false;
    this.explosionRadius = opts.explosionRadius ?? 0;
    this.lifeMs = opts.lifeMs ?? 1400;
    this.isEnemy = opts.isEnemy ?? false;
    this.armed = opts.armed ?? true;
    this.born = 0;
    this.spawnX = x; this.spawnY = y;
    this.setVelocity(vx, vy);
    this.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
    this.body!.setSize(this.width * 0.6, this.height * 0.6);
    if (this.weapon === 'rocket' || this.weapon === 'devastator') this.setTexture(this.weapon === 'rocket' ? 'rocket' : 'bulletPlasma');
    else if (this.weapon === 'pipebomb') this.setTexture('pipebomb');
    else this.setTexture('bullet');
    if (this.weapon === 'pipebomb') {
      this.setGravityY(600);
      this.setCollideWorldBounds(false);
    } else {
      this.setGravityY(0);
    }
  }

  update(_t: number, dt: number): void {
    if (!this.active) return;
    this.born += dt;
    if (this.born >= this.lifeMs) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.disableBody(true, true);
  }
}

/** Manages a pool of projectiles. */
export class ProjectilePool {
  group: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, preallocate = 80) {
    this.group = scene.physics.add.group({
      classType: Projectile,
      maxSize: 240,
      runChildUpdate: true,
      allowGravity: false,
      collideWorldBounds: false,
    });
    for (let i = 0; i < preallocate; i++) {
      const p = new Projectile(scene, 'bullet');
      p.disableBody(true, true);
      this.group.add(p);
    }
  }

  spawn(): Projectile {
    const p = this.group.get() as Projectile;
    if (!p) {
      const np = new Projectile(this.group.scene, 'bullet');
      this.group.add(np);
      return np;
    }
    return p;
  }
}

/** Base weapon. Subclasses tweak firing pattern via `fire`. */
export abstract class Weapon {
  id: WeaponId;
  name: string;
  ammo = Infinity;
  maxAmmo = Infinity;
  lastFired = 0;
  def: typeof WEAPONS[WeaponId];

  constructor(id: WeaponId) {
    this.id = id;
    this.def = WEAPONS[id];
    this.name = this.def.name;
  }

  get rate(): number { return this.def.rate; }
  get automatic(): boolean { return this.def.automatic; }

  canFire(now: number): boolean {
    if (now - this.lastFired < this.rate) return false;
    if (this.ammo < this.def.ammoPerShot) return false;
    return true;
  }

  tryFire(scene: GameLike, now: number, x: number, y: number, angle: number): boolean {
    if (!this.canFire(now)) return false;
    this.lastFired = now;
    if (this.def.ammoPerShot > 0) this.ammo -= this.def.ammoPerShot;
    this.fire(scene, x, y, angle);
    this.playSfx();
    scene.particles.muzzle(x, y, angle);
    scene.shake(2, 60);
    return true;
  }

  protected fire(scene: GameLike, x: number, y: number, angle: number): void {
    for (let i = 0; i < this.def.projectiles; i++) {
      const spread = (this.def.spread > 0)
        ? (i / Math.max(1, this.def.projectiles - 1) - 0.5) * this.def.spread * 2
        : (Math.random() - 0.5) * this.def.spread * 2;
      const a = angle + spread;
      const vx = Math.cos(a) * this.def.speed;
      const vy = Math.sin(a) * this.def.speed;
      const p = scene.projectiles.spawn();
      p.fire(x, y, vx, vy, {
        weapon: this.id,
        damage: this.def.damage,
        speed: this.def.speed,
        isExplosive: !!this.def.isExplosive,
        explosionRadius: this.def.explosion ?? 0,
        lifeMs: this.id === 'pipebomb' ? 6000 : 1600,
        armed: this.id !== 'pipebomb',
      });
      scene.registerProjectile(p);
    }
  }

  protected playSfx(): void {
    switch (this.id) {
      case 'pistol': sfx.shoot(); break;
      case 'shotgun': sfx.shotgun(); break;
      case 'chaingun': sfx.chaingun(); break;
      case 'pipebomb': sfx.reload(); break;
      case 'rocket': sfx.rocket(); break;
      case 'devastator': sfx.chaingun(); break;
    }
  }
}

export class Pistol extends Weapon { constructor() { super('pistol'); this.ammo = Infinity; this.maxAmmo = Infinity; } }
export class Shotgun extends Weapon { constructor(ammo = 12) { super('shotgun'); this.ammo = ammo; this.maxAmmo = 60; } }
export class Chaingun extends Weapon { constructor(ammo = 80) { super('chaingun'); this.ammo = ammo; this.maxAmmo = 300; } }
export class PipeBomb extends Weapon { constructor(ammo = 6) { super('pipebomb'); this.ammo = ammo; this.maxAmmo = 20; } }
export class Rocket extends Weapon { constructor(ammo = 6) { super('rocket'); this.ammo = ammo; this.maxAmmo = 20; } }
export class Devastator extends Weapon { constructor(ammo = 40) { super('devastator'); this.ammo = ammo; this.maxAmmo = 120; } }

export function makeWeapon(id: WeaponId, ammo?: number): Weapon {
  switch (id) {
    case 'pistol': return new Pistol();
    case 'shotgun': return new Shotgun(ammo);
    case 'chaingun': return new Chaingun(ammo);
    case 'pipebomb': return new PipeBomb(ammo);
    case 'rocket': return new Rocket(ammo);
    case 'devastator': return new Devastator(ammo);
  }
}

/** Minimal interface weapons need from the scene, to avoid circular imports. */
export interface GameLike {
  projectiles: ProjectilePool;
  particles: { muzzle(x: number, y: number, angle: number): void; explosion(x: number, y: number, r: number): void };
  shake(intensity: number, duration: number): void;
  registerProjectile(p: Projectile): void;
}
