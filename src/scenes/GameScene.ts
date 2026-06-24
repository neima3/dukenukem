import Phaser from 'phaser';
import { GAME } from '../config';
import { segmentAABB, weaponRefill, splashDamage, difficultyForLevel } from '../utils';
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
import { TouchControls } from '../systems/TouchControls';
import { audio } from '../systems/AudioSystem';
import { music } from '../audio/musicGen';
import { sfx } from '../audio/sfxGen';
import { save } from '../systems/SaveSystem';

export type Inputs = {
  left: boolean; right: boolean; up: boolean; down: boolean;
  jumpPressed: boolean; jumpHeld: boolean; fire: boolean;
  weaponSlot: number | null; cycle: number; detonate: boolean;
  aimOverride: number | null; // touch auto-aim angle toward nearest enemy
};

export class GameScene extends Phaser.Scene implements GameLike {
  level!: LevelData;
  levelIndex = 0;
  player!: Player;
  enemies!: Phaser.Physics.Arcade.Group;
  bosses!: Phaser.Physics.Arcade.Group;
  projectiles!: ProjectilePool;
  enemyProjectiles!: Phaser.Physics.Arcade.Group;
  pickups!: Phaser.Physics.Arcade.Group;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  particles!: ParticleSystem;
  dialogue!: DialogueSystem;
  inputSys!: InputSystem;
  touch!: TouchControls;

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
  bossWalls: Phaser.GameObjects.Rectangle[] = [];

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
    this.touch = new TouchControls(this);
    this.touch.create();

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

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => { music.stop(); this.time.timeScale = 1; });
  }

  update(time: number, dt: number): void {
    if (this.paused) return;
    const inp = this.makeInputs();
    if (this.player.active) this.player.update(time, dt, inp);
    this._prevTouchJump = this.touch.state.jump;
    // combo decay
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    // pipe bomb lifecycle (auto-detonate expired)
    this.updatePipes(dt);
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
    const t = this.touch.state;
    const fire = pointer.isDown || t.fire;
    // touch auto-aim: snap toward the nearest enemy when firing on a touch device
    let aimOverride: number | null = null;
    if (this.touch.enabled && t.fire) {
      const nearest = this.nearestEnemyTo(this.player.x, this.player.y - 20);
      if (nearest) {
        const e = nearest as Enemy;
        aimOverride = Phaser.Math.Angle.Between(this.player.x, this.player.y - 20, e.x, e.y - e.height / 2);
      } else {
        aimOverride = this.player.facing >= 0 ? 0 : Math.PI;
      }
    }
    return {
      left: inp.left || t.left,
      right: inp.right || t.right,
      up: inp.up,
      down: inp.down,
      jumpPressed: inp.isJumpPressed() || (t.jump && !this._prevTouchJump),
      jumpHeld: inp.jumpHeld || t.jump,
      fire,
      weaponSlot: inp.weaponKey(),
      cycle: inp.consumeWheelCycle(),
      detonate: inp.isDetonatePressed() || t.detonate,
      aimOverride,
    };
  }

  private _prevTouchJump = false;

  /** Nearest living enemy or boss to a point. */
  private nearestEnemyTo(x: number, y: number): Enemy | Boss | null {
    let best: Enemy | Boss | null = null;
    let bestD = Infinity;
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (!e.alive) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    for (const b of this.bosses.getChildren() as Boss[]) {
      if (!b.alive) continue;
      const d = (b.x - x) ** 2 + (b.y - y) ** 2;
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
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
    // per-level difficulty ramp
    const diff = difficultyForLevel(this.levelIndex);
    e.maxHealth = Math.round(e.maxHealth * diff.hp);
    e.health = e.maxHealth;
    e.damage = Math.round(e.damage * diff.dmg);
    e.speed *= diff.speed;
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
    // lock the arena: walls ahead of and behind the player so the fight is contained
    const wallX = this.player.x + 360;
    const backX = this.player.x - 200;
    this.bossWalls = [
      this.add.rectangle(wallX, this.level.groundY, 40, 400, this.level.palette.tileDark).setOrigin(0.5, 0),
      this.add.rectangle(backX, this.level.groundY, 40, 400, this.level.palette.tileDark).setOrigin(0.5, 0),
    ];
    for (const w of this.bossWalls) this.solids.add(w, true);
    let boss: Boss;
    switch (kind) {
      case 'tank': boss = new HoverTank(this, wallX + 200, this.level.groundY - 60); break;
      case 'worm': boss = new SandWorm(this, this.player.x + 300, this.level.groundY); break;
      case 'lord': boss = new AlienOverlord(this, wallX + 240, this.level.groundY - 200); break;
    }
    this.hud.showBossBar(boss.name);
    // dramatic telegraph: slow-mo + flash + named banner
    this.time.timeScale = 0.35;
    this.cameras.main.flash(700, 255, 80, 80);
    this.add.text(this.cameras.main.worldView.centerX, this.level.groundY - 240, boss.name, {
      fontFamily: 'monospace', fontSize: '52px', color: '#ff2d6a', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(70).setAlpha(0);
    this.tweens.add({ targets: [this], timeScale: { from: 0.35, to: 1 }, duration: 900 });
    const banner = this.add.text(this.cameras.main.worldView.centerX, this.level.groundY - 240, 'BOSS', {
      fontFamily: 'monospace', fontSize: '64px', color: '#ffcc33', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(71).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, duration: 200, yoyo: true, hold: 600, onComplete: () => banner.destroy() });
  }

  // ---- combat callbacks ----
  hitEnemy(pr: Projectile, e: Enemy): void {
    if (!pr.active || !e.alive) return;
    // pipe bombs are thrown, not contact-fused: pass through enemies until detonated
    if (pr.weapon === 'pipebomb') return;
    if (pr.isExplosive) {
      this.explode(pr.x, pr.y, pr.explosionRadius, pr.damage);
      pr.deactivate();
    } else {
      e.takeDamage(pr.damage);
      this.particles.sparks(pr.x, pr.y);
      pr.deactivate();
    }
  }

  hitBoss(pr: Projectile, b: Boss): void {
    if (!pr.active || !b.alive) return;
    if (pr.weapon === 'pipebomb') return;
    if (pr.isExplosive) {
      this.explode(pr.x, pr.y, pr.explosionRadius, pr.damage);
      pr.deactivate();
    } else {
      b.takeDamage(pr.damage);
      this.particles.sparks(pr.x, pr.y);
      pr.deactivate();
    }
  }

  hitSolid(pr: Projectile, s: any): void {
    if (!pr.active) return;
    // pipe bombs come to rest on solids instead of vanishing
    if (pr.weapon === 'pipebomb') {
      const body = pr.body as Phaser.Physics.Arcade.Body;
      if (body) { body.reset(pr.x, pr.y); body.setVelocity(0, 0); body.setAllowGravity(false); }
      return;
    }
    if (pr.isExplosive) {
      this.explode(pr.x, pr.y, pr.explosionRadius, pr.damage);
      pr.deactivate();
    } else {
      pr.deactivate();
    }
    // secret block destruction (destructible walls)
    if (s?.isSecret) {
      s.isSecret = false;
      this.particles.sparks(pr.x, pr.y);
      s.destroy?.();
    }
  }

  private explode(x: number, y: number, r: number, baseDamage = 60): void {
    this.particles.explosion(x, y, r);
    this.shake(10, 300);
    // splash with linear falloff, scaled per weapon
    this.enemies.getChildren().forEach((e) => {
      const en = e as Enemy;
      if (en.alive) {
        const d = Phaser.Math.Distance.Between(x, y, en.x, en.y - en.height / 2);
        if (d <= r) en.takeDamage(splashDamage(baseDamage, d, r));
      }
    });
    this.bosses.getChildren().forEach((b) => {
      const bo = b as Boss;
      if (bo.alive) {
        const d = Phaser.Math.Distance.Between(x, y, bo.x, bo.y - bo.height / 2);
        if (d <= r) bo.takeDamage(splashDamage(baseDamage, d, r));
      }
    });
    // self-splash: gentler (⅓) so rockets aren't punishing at the edge
    const pd = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y - 20);
    if (pd <= r) this.player.takeDamage(splashDamage(baseDamage, pd, r) * 0.33);
  }

  detonatePipes(): void {
    const armed = this.pipes.filter((p) => p.active);
    if (armed.length === 0) return;
    armed.forEach((p) => {
      this.explode(p.x, p.y, 140, 120);
      p.deactivate();
    });
    this.cleanupPipes();
    sfx.explosion();
  }

  /** Auto-detonate expired pipe bombs; called each frame. */
  updatePipes(_dt: number): void {
    if (this.pipes.length === 0) return;
    for (const p of this.pipes) {
      if (!p.active) continue;
      if (p.born >= p.lifeMs) {
        this.explode(p.x, p.y, 140, 120);
        p.deactivate();
      }
    }
    this.cleanupPipes();
  }

  private cleanupPipes(): void {
    this.pipes = this.pipes.filter((p) => p.active);
  }

  registerProjectile(p: Projectile): void {
    if (p.weapon === 'pipebomb') this.pipes.push(p);
  }

  spawnEnemyProjectile(x: number, y: number, vx: number, vy: number, damage: number, gravity = 0, explosive = false): void {
    // pooled: reuse an inactive sprite if available
    const s = (this.enemyProjectiles.get(x, y, 'bullet') as EnemyProjectile)
      || (this.enemyProjectiles.create(x, y, 'bullet') as EnemyProjectile);
    s.damage = damage;
    s.explosive = explosive;
    s.setActive(true).setVisible(true).enableBody(true, x, y, true, true);
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(!!gravity);
    s.setTint(explosive ? 0xff3322 : 0xff5533);
    s.setVelocity(vx, vy);
    s.setDepth(7);
    s.setScale(1.4);
    s.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
    // auto-recycle after 3s if it hasn't hit anything
    this.time.delayedCall(3000, () => { if (s.active) this.killEnemyProjectile(s); });
  }

  private killEnemyProjectile(s: Phaser.Physics.Arcade.Sprite): void {
    if (!s.active) return;
    const e = s as EnemyProjectile;
    this.particles.sparks(s.x, s.y);
    if (e.explosive) this.explode(s.x, s.y, 90, e.damage || 14);
    s.disableBody(true, true);
  }

  hitPlayer(pr: Projectile | EnemyProjectile): void {
    const e = pr as EnemyProjectile;
    if (!e.active) return;
    if (e.explosive) {
      this.explode(e.x, e.y, 90, e.damage || 14);
    } else {
      this.player.takeDamage(e.damage ?? 10, e.x);
    }
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
    // tear down the arena walls so the player can reach the exit
    for (const w of this.bossWalls) {
      this.solids.remove(w);
      w.destroy();
    }
    this.bossWalls = [];
    this.time.timeScale = 1;
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
  /** Raycast segment against level platforms; returns false if a solid blocks the shot. */
  hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const platforms = this.level.platforms;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (segmentAABB(x1, y1, x2, y2, p.x, p.y, p.x + p.w, p.y + p.h)) return false;
    }
    return true;
  }
  shake(intensity: number, duration: number): void { this.cameras.main.shake(duration, intensity / 1000); }

  togglePause(): void {
    if (this.dying) return;
    this.paused = !this.paused;
    this.touch?.setVisible(!this.paused);
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
export { segmentAABB, weaponRefill } from '../utils';

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
