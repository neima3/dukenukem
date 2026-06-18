import Phaser from 'phaser';
import { GAME } from '../config';
import { LEVELS, type LevelData, type PickupSpawn, type EnemyType, type BossType } from '../levels/levelData';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/enemies/Enemy';
import { LizardTrooper } from '../entities/enemies/LizardTrooper';
import { BrainCrawler } from '../entities/enemies/BrainCrawler';
import { PigBrute } from '../entities/enemies/PigBrute';
import { SentryDrone } from '../entities/enemies/SentryDrone';
import { HeavyGunner } from '../entities/enemies/HeavyGunner';
import { Boss } from '../entities/bosses/Boss';
import { HoverTank } from '../entities/bosses/HoverTank';
import { SandWorm } from '../entities/bosses/SandWorm';
import { AlienOverlord } from '../entities/bosses/AlienOverlord';
import { Projectile, ProjectilePool, type GameLike } from '../weapons/Weapon';
import { ParticleSystem } from '../systems/ParticleSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InputSystem } from '../systems/InputSystem';
import { audio } from '../systems/AudioSystem';
import { music } from '../audio/musicGen';
import { sfx } from '../audio/sfxGen';
import { save } from '../systems/SaveSystem';

export type Inputs = {
  left: boolean; right: boolean; up: boolean; down: boolean;
  jumpPressed: boolean; jumpHeld: boolean; fire: boolean;
  weaponSlot: number | null; cycle: number; detonate: boolean;
};

export class GameScene extends Phaser.Scene implements GameLike {
  level!: LevelData;
  levelIndex = 0;
  player!: Player;
  enemies!: Phaser.Physics.Arcade.Group;
  bosses!: Phaser.Physics.Arcade.Group;
  projectiles = new ProjectilePool(this);
  enemyProjectiles!: Phaser.Physics.Arcade.Group;
  pickups!: Phaser.Physics.Arcade.Group;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  particles!: ParticleSystem;
  dialogue!: DialogueSystem;
  inputSys!: InputSystem;

  score = 0;
  secretsFound = 0;
  secretsTotal = 0;
  combo = 0;
  comboTimer = 0;
  dying = false;
  paused = false;
  bossSpawned = false;
  exitOpen = false;
  pipes: Projectile[] = [];

  hud!: HUDLike;
  private bg!: Phaser.GameObjects.Container;
  private exitDoor!: Phaser.GameObjects.Image;
  private pauseText?: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  init(data: { level: number }) {
    this.levelIndex = data.level ?? 0;
    this.level = LEVELS[this.levelIndex];
    this.score = 0;
    this.secretsFound = 0;
    this.combo = 0;
    this.dying = false;
    this.paused = false;
    this.bossSpawned = false;
    this.exitOpen = !this.level.boss;
    this.pipes = [];
  }

  create(): void {
    audio.resume();
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height + 300);
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main.setBackgroundColor(this.level.palette.fog);

    this.buildBackground();
    this.buildSolids();

    this.enemies = this.physics.add.group({ runChildUpdate: true });
    this.bosses = this.physics.add.group({ runChildUpdate: true });
    this.pickups = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({ runChildUpdate: true });
    this.projectiles = new ProjectilePool(this, 100);

    this.player = new Player(this, this.level.playerStart.x, this.level.playerStart.y);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, -200, 80);

    this.particles = new ParticleSystem(this);
    this.dialogue = new DialogueSystem(this);
    this.inputSys = new InputSystem(this);

    this.spawnLevelEntities();

    // colliders
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.bosses, this.solids);
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => (e as Enemy).touchPlayer());
    this.physics.add.overlap(this.player, this.bosses, (_p, b) => (b as Boss).touchPlayer());
    this.physics.add.overlap(this.projectiles.group, this.enemies, (pr, e) => this.hitEnemy(pr as Projectile, e as Enemy));
    this.physics.add.overlap(this.projectiles.group, this.bosses, (pr, b) => this.hitBoss(pr as Projectile, b as Boss));
    this.physics.add.overlap(this.projectiles.group, this.solids, (pr, s) => this.hitSolid(pr as Projectile, s));
    this.physics.add.overlap(this.enemyProjectiles, this.player, (pr) => this.hitPlayer(pr as Projectile));
    this.physics.add.overlap(this.enemyProjectiles, this.solids, (pr) => this.killEnemyProjectile(pr as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.pickups, (_p, pk) => this.collectPickup(pk as PickupSprite));
    this.physics.add.overlap(this.player, this.solids);

    // hazards (damage zones) handled via zone overlaps
    this.level.hazards.forEach((h) => {
      const z = this.add.zone(h.x + h.w / 2, h.y, h.w, 24) as unknown as Phaser.GameObjects.Zone;
      this.physics.add.existing(z, true);
      this.physics.add.overlap(this.player, z, () => {
        if ((this.player.invuln <= 0)) this.player.takeDamage(8);
      });
      // draw spikes
      for (let sx = 0; sx < h.w; sx += 16) {
        this.add.image(h.x + sx + 8, h.y, 'hazard').setOrigin(0.5, 0.5);
      }
    });

    // exit door
    this.exitDoor = this.add.image(this.level.exitX, this.level.groundY - 32, 'exit').setDepth(4);

    // secret count
    this.secretsTotal = this.level.pickups.filter((p) => p.kind === 'secret').length;

    // launch HUD
    if (!this.scene.isActive('HUD')) this.scene.launch('HUD', { level: this.levelIndex });
    else this.scene.get('HUD').scene.restart({ level: this.levelIndex });
    this.hud = this.scene.get('HUD') as unknown as HUDLike;
    this.hud.bindGame(this);

    // intro line
    this.time.delayedCall(300, () => this.dialogue.say(this.dialogue.intro(this.levelIndex)));

    // music
    music.play(this.level.music);

    // pause key
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => music.stop());
  }

  update(time: number, dt: number): void {
    if (this.paused) return;
    const inp = this.makeInputs();
    if (this.player.active) this.player.update(time, dt, inp);
    // combo decay
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    // boss trigger
    if (!this.bossSpawned && this.level.boss && this.player.x > this.level.bossAt) {
      this.spawnBoss(this.level.boss);
    }
    // exit
    if (this.exitOpen && Math.abs(this.player.x - this.exitDoor.x) < 40) {
      this.completeLevel();
    }
  }

  makeInputs(): Inputs {
    const inp = this.inputSys;
    const pointer = this.input.activePointer;
    return {
      left: inp.left,
      right: inp.right,
      up: inp.up,
      down: inp.down,
      jumpPressed: inp.isJumpPressed(),
      jumpHeld: inp.jumpHeld,
      fire: pointer.isDown,
      weaponSlot: inp.weaponKey(),
      cycle: 0,
      detonate: inp.isDetonatePressed(),
    };
  }

  // ---- world building ----
  private buildBackground(): void {
    const pal = this.level.palette;
    const w = this.level.width, h = this.level.height;
    this.bg = this.add.container(0, 0).setDepth(-10);
    // gradient via rectangles (lerp bg0 -> bg2)
    const c0 = Phaser.Display.Color.IntegerToColor(pal.bg0);
    const c2 = Phaser.Display.Color.IntegerToColor(pal.bg2);
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const rcol = Math.round(c0.red + (c2.red - c0.red) * t);
      const gcol = Math.round(c0.green + (c2.green - c0.green) * t);
      const bcol = Math.round(c0.blue + (c2.blue - c0.blue) * t);
      const r = this.add.rectangle(0, (i * h) / 24, w, h / 24 + 1,
        (rcol << 16) | (gcol << 8) | bcol).setOrigin(0, 0);
      this.bg.add(r);
    }
    // parallax silhouette layer
    const l2 = this.add.renderTexture(0, 0, w, h).setOrigin(0, 0).setDepth(-8).setScrollFactor(0.5);
    l2.fill(pal.bg1, 1);
    for (let i = 0; i < w / 160; i++) {
      const bh = Phaser.Math.Between(140, 320);
      l2.fill(pal.tileDark, 1);
      void bh;
    }
    // stars in far back
    const star = this.add.particles(0, 0, 'pix', {
      x: { min: 0, max: w }, y: { min: 0, max: h * 0.7 },
      lifespan: 0, quantity: 0, scale: { start: 0.5, end: 0.5 },
      alpha: { min: 0.2, max: 0.6 }, tint: 0xffffff,
    });
    star.setDepth(-9).setScrollFactor(0.15);
  }

  private buildSolids(): void {
    this.solids = this.physics.add.staticGroup();
    const pal = this.level.palette;
    // ground band
    const gy = this.level.groundY;
    const ground = this.add.rectangle(this.level.width / 2, gy + 200, this.level.width, 400, pal.tile).setOrigin(0.5, 0);
    this.add.rectangle(this.level.width / 2, gy + 4, this.level.width, 8, pal.tileDark, 0.8).setOrigin(0.5, 0).setDepth(-1);
    this.solids.add(ground, true);
    // platforms
    for (const p of this.level.platforms) {
      const r = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, pal.tile).setOrigin(0.5, 0.5);
      this.add.rectangle(p.x + p.w / 2, p.y, p.w, 4, pal.tileDark, 0.8).setOrigin(0.5, 0).setDepth(-1);
      this.solids.add(r, true);
    }
    // secret blocks (look like tiles, destructible)
    for (const s of this.level.secretBlocks) {
      const r = this.add.rectangle(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, pal.tileDark).setOrigin(0.5, 0.5);
      (r as any).isSecret = true;
      this.solids.add(r, true);
    }
    // boundary walls (invisible)
    const lw = this.add.rectangle(-20, gy, 40, 600, 0x000000).setOrigin(0.5, 0);
    this.solids.add(lw, true);
  }

  private spawnLevelEntities(): void {
    for (const e of this.level.enemies) this.spawnEnemy(e.type, e.x, e.y);
    for (const p of this.level.pickups) this.spawnPickup(p);
  }

  private spawnEnemy(type: EnemyType, x: number, y: number): Enemy {
    let e: Enemy;
    switch (type) {
      case 'lizard': e = new LizardTrooper(this, x, y); break;
      case 'brain': e = new BrainCrawler(this, x, y); break;
      case 'pig': e = new PigBrute(this, x, y); break;
      case 'drone': e = new SentryDrone(this, x, y); break;
      case 'heavy': e = new HeavyGunner(this, x, y); break;
    }
    return e;
  }

  private spawnPickup(p: PickupSpawn): void {
    let texture = 'pickupHealth';
    if (p.kind === 'health') texture = 'pickupHealth';
    else if (p.kind === 'armor') texture = 'pickupArmor';
    else if (p.kind === 'ammo') texture = 'pickupAmmo';
    else if (p.kind === 'fuel') texture = 'pickupFuel';
    else if (p.kind === 'secret') texture = 'secret';
    else if (p.kind === 'weapon') {
      texture = 'pickup' + (p.weapon.charAt(0).toUpperCase() + p.weapon.slice(1).replace('bomb', 'bomb'));
      const map: Record<string, string> = { shotgun: 'pickupShotgun', chaingun: 'pickupChaingun', pipebomb: 'pickupPipebomb', rocket: 'pickupRocket', devastator: 'pickupDevastator' };
      texture = map[p.weapon] ?? 'pickupAmmo';
    }
    const s = this.physics.add.sprite(p.x, p.y, texture) as PickupSprite;
    s.pickupKind = p.kind;
    s.weapon = (p as any).weapon;
    s.setDepth(6);
    s.setImmovable(true);
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.tweens.add({ targets: s, y: s.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.pickups.add(s);
  }

  private spawnBoss(kind: BossType): void {
    this.bossSpawned = true;
    this.exitOpen = false;
    // lock arena: add wall ahead of player
    const wallX = this.player.x + 360;
    const wall = this.add.rectangle(wallX, this.level.groundY, 40, 400, this.level.palette.tileDark).setOrigin(0.5, 0);
    this.solids.add(wall, true);
    let boss: Boss;
    switch (kind) {
      case 'tank': boss = new HoverTank(this, wallX + 200, this.level.groundY - 60); break;
      case 'worm': boss = new SandWorm(this, this.player.x + 300, this.level.groundY); break;
      case 'lord': boss = new AlienOverlord(this, wallX + 240, this.level.groundY - 200); break;
    }
    this.hud.showBossBar(boss.name);
    this.dialogue.say('BOSS!', this.level.palette.accent);
  }

  // ---- combat callbacks ----
  hitEnemy(pr: Projectile, e: Enemy): void {
    if (!pr.active || !e.alive) return;
    if (pr.weapon === 'pipebomb' && pr.armed) return; // pipe bombs sit as armed=false? armed=false means thrown; handle detonation separately
    if (pr.isExplosive && pr.armed) {
      this.explode(pr.x, pr.y, pr.explosionRadius);
      pr.deactivate();
    } else {
      e.takeDamage(pr.damage);
      this.particles.sparks(pr.x, pr.y);
      pr.deactivate();
    }
  }

  hitBoss(pr: Projectile, b: Boss): void {
    if (!pr.active || !b.alive) return;
    if (pr.isExplosive && pr.armed) {
      this.explode(pr.x, pr.y, pr.explosionRadius);
      pr.deactivate();
    } else {
      b.takeDamage(pr.damage);
      this.particles.sparks(pr.x, pr.y);
      pr.deactivate();
    }
  }

  hitSolid(pr: Projectile, s: any): void {
    if (!pr.active) return;
    if (pr.isExplosive && pr.armed && pr.weapon !== 'pipebomb') {
      this.explode(pr.x, pr.y, pr.explosionRadius);
      pr.deactivate();
    } else if (pr.weapon !== 'pipebomb') {
      pr.deactivate();
    }
    // secret block destruction
    if (s?.isSecret) {
      s.destroy();
      this.particles.sparks(pr.x, pr.y);
      s.isSecret = false;
    }
  }

  private explode(x: number, y: number, r: number): void {
    this.particles.explosion(x, y, r);
    this.shake(10, 300);
    // damage enemies in radius
    this.enemies.getChildren().forEach((e) => {
      const en = e as Enemy;
      if (en.alive && Phaser.Math.Distance.Between(x, y, en.x, en.y - en.height / 2) < r) {
        en.takeDamage(60);
      }
    });
    this.bosses.getChildren().forEach((b) => {
      const bo = b as Boss;
      if (bo.alive && Phaser.Math.Distance.Between(x, y, bo.x, bo.y - bo.height / 2) < r) bo.takeDamage(45);
    });
    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y - 20) < r) {
      this.player.takeDamage(8);
    }
  }

  detonatePipes(): void {
    const armed = this.pipes.filter((p) => p.active);
    if (armed.length === 0) return;
    armed.forEach((p) => {
      this.explode(p.x, p.y, 140);
      p.deactivate();
    });
    this.pipes = [];
  }

  registerProjectile(p: Projectile): void {
    if (p.weapon === 'pipebomb') this.pipes.push(p);
  }

  spawnEnemyProjectile(x: number, y: number, vx: number, vy: number, damage: number, gravity = 0, explosive = false): void {
    const s = this.physics.add.sprite(x, y, 'bullet') as EnemyProjectile;
    s.damage = damage;
    s.explosive = explosive;
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(!!gravity);
    s.setTint(0xff5533);
    s.setVelocity(vx, vy);
    s.setDepth(7);
    s.setScale(1.4);
    s.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
    this.enemyProjectiles.add(s);
    this.time.delayedCall(3000, () => { if (s.active) this.killEnemyProjectile(s); });
  }

  private killEnemyProjectile(s: Phaser.Physics.Arcade.Sprite): void {
    if (s.active) { this.particles.sparks(s.x, s.y); s.destroy(); }
  }

  hitPlayer(pr: Projectile | EnemyProjectile): void {
    const e = pr as EnemyProjectile;
    if (!e.active) return;
    this.player.takeDamage(e.damage ?? 10, e.x);
    this.killEnemyProjectile(e);
  }

  private collectPickup(p: PickupSprite): void {
    if (!p.active) return;
    switch (p.pickupKind) {
      case 'health': this.player.heal(35); break;
      case 'armor': this.player.addArmor(40); break;
      case 'ammo':
        if (p.weapon) { this.player.addAmmo(p.weapon, weaponRefill(p.weapon)); this.dialogue.pickup(p.x, p.y); }
        break;
      case 'fuel': this.player.addFuel(60); break;
      case 'weapon':
        if (p.weapon) { this.player.addWeapon(p.weapon, weaponRefill(p.weapon)); this.dialogue.say('NEW WEAPON: ' + p.weapon.toUpperCase()); }
        break;
      case 'secret':
        this.secretsFound++;
        this.score += 1000;
        this.dialogue.secret(p.x, p.y);
        sfx.secret();
        break;
    }
    this.particles.pickup(p.x, p.y);
    if (p.pickupKind !== 'secret') sfx.pickup();
    p.destroy();
  }

  // ---- events ----
  onEnemyKilled(e: Enemy): void {
    this.combo++;
    this.comboTimer = 3000;
    this.score += e.scoreValue * Math.min(5, 1 + Math.floor(this.combo / 3));
    this.dialogue.kill(e.x, e.y - e.height);
    if (this.combo >= 3 && this.combo % 3 === 0) {
      this.dialogue.streak(e.x, e.y - e.height, this.combo);
      sfx.quip();
    }
    // ammo drop chance
    if (Math.random() > 0.6) {
      const kinds: PickupSpawn['kind'][] = ['health', 'ammo', 'armor'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      this.spawnPickup({ kind, x: e.x, y: e.y - 20, weapon: this.player.currentWeaponId } as PickupSpawn);
    }
  }

  onBossKilled(_b: Boss): void {
    this.score += _b.scoreValue;
    this.exitOpen = true;
    this.time.delayedCall(1400, () => {
      this.add.text(this.cameras.main.worldView.centerX, this.level.groundY - 220, 'EXIT OPEN', {
        fontFamily: 'monospace', fontSize: '36px', color: '#33ff66', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(60);
      this.dialogue.say('Path clear. Move out.');
    });
  }

  onPlayerDeath(): void {
    music.stop();
    music.stinger('gameover');
    this.time.delayedCall(300, () => this.scene.start('GameOver', { level: this.levelIndex, score: this.score }));
  }

  private completeLevel(): void {
    if (this.paused) return;
    this.paused = true;
    save.unlock(this.levelIndex);
    save.submitScore(this.score);
    music.stinger('victory');
    const isLast = this.levelIndex >= LEVELS.length - 1;
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(700, () => {
      if (isLast) this.scene.start('Victory', { score: this.score });
      else this.scene.start('Game', { level: this.levelIndex + 1 });
    });
  }

  // ---- helpers ----
  hasLineOfSight(_x1: number, _y1: number, _x2: number, _y2: number): boolean { return true; }
  shake(intensity: number, duration: number): void { this.cameras.main.shake(duration, intensity / 1000); }

  togglePause(): void {
    if (this.dying) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      music.stop();
      const { width, height } = this.scale;
      this.pauseText = this.add.text(width / 2, height / 2, 'PAUSED\nPress ESC to resume\nQ to quit', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffcc33', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
      this.pauseText.setDepth(100);
      this.input.keyboard?.once('keydown-Q', () => { music.stop(); this.scene.start('Menu'); });
    } else {
      this.physics.resume();
      music.play(this.level.music);
      this.pauseText?.destroy();
    }
  }
}

// helpers
function weaponRefill(id: string): number {
  switch (id) {
    case 'shotgun': return 12;
    case 'chaingun': return 60;
    case 'pipebomb': return 4;
    case 'rocket': return 4;
    case 'devastator': return 25;
    default: return 0;
  }
}

type PickupSprite = Phaser.Physics.Arcade.Sprite & {
  pickupKind: PickupSpawn['kind']; weapon?: import('../config').WeaponId;
};
type EnemyProjectile = Phaser.Physics.Arcade.Sprite & { damage: number; explosive: boolean };
type HUDLike = Phaser.Scene & {
  bindGame(g: GameScene): void;
  showBossBar(name: string): void;
  hideBossBar(): void;
  updateBossBar(frac: number, name: string): void;
  flashDamage(): void;
};

// hasLineOfSight stub: raycast against solids — simplified to true for performance/playability
export {};
