import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import type { WeaponId } from '../config';

const ICONS: Record<WeaponId, string> = {
  pistol: 'iconPistol', shotgun: 'iconShotgun', chaingun: 'iconChaingun',
  pipebomb: 'iconPipebomb', rocket: 'iconRocket', devastator: 'iconDevastator',
};
const PX = "'Press Start 2P', monospace";
const VT = "'VT323', monospace";

export class HUDScene extends Phaser.Scene {
  game_scene!: GameScene;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private armorBar!: Phaser.GameObjects.Rectangle;
  private healthTxt!: Phaser.GameObjects.Text;
  private scoreTxt!: Phaser.GameObjects.Text;
  private ammoTxt!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Image;
  private weaponName!: Phaser.GameObjects.Text;
  private secretTxt!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private bossBarWrap!: Phaser.GameObjects.Container;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameTxt!: Phaser.GameObjects.Text;
  private dmgVignette!: Phaser.GameObjects.Rectangle;
  private _lowAmmoTween?: Phaser.Tweens.Tween;

  constructor() { super('HUD'); }

  init(data: { level: number }) {
    this.levelIndex = data.level;
  }
  private levelIndex = 0;

  create(): void {
    const { width, height } = this.scale;

    // top + bottom console strips with neon underlines
    this.add.rectangle(0, 0, width, 64, 0x05060a, 0.55).setOrigin(0).setScrollFactor(0);
    this.add.rectangle(0, 62, width, 2, 0xff2d6a, 0.7).setOrigin(0).setScrollFactor(0);
    this.add.rectangle(0, height - 64, width, 64, 0x05060a, 0.55).setOrigin(0).setScrollFactor(0);
    this.add.rectangle(0, height - 64, width, 2, 0x33ddff, 0.5).setOrigin(0).setScrollFactor(0);

    // health (with glow fill)
    this.add.image(28, 24, 'pickupHealth').setScale(1.2).setScrollFactor(0);
    this.add.rectangle(50, 14, 220, 18, 0x14060a).setOrigin(0).setScrollFactor(0).setStrokeStyle(1, 0x331016);
    this.healthBar = this.add.rectangle(52, 16, 216, 14, 0x33ff66).setOrigin(0).setScrollFactor(0).setDepth(2);
    this.healthBar.setScrollFactor(0);
    this.healthTxt = this.add.text(160, 15, '', { fontFamily: PX, fontSize: '10px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(3);

    // armor
    this.add.image(28, 48, 'pickupArmor').setScale(1.2).setScrollFactor(0);
    this.add.rectangle(50, 38, 220, 18, 0x060a14).setOrigin(0).setScrollFactor(0).setStrokeStyle(1, 0x102233);
    this.armorBar = this.add.rectangle(52, 40, 216, 14, 0x3399ff).setOrigin(0).setScrollFactor(0).setDepth(2);
    this.armorBar.setScrollFactor(0);

    // weapon + ammo (bottom-left)
    this.add.rectangle(16, height - 52, 220, 40, 0x0a0a14, 0.6).setOrigin(0, 0).setScrollFactor(0).setStrokeStyle(1, 0x222238);
    this.weaponIcon = this.add.image(40, height - 32, 'iconPistol').setScrollFactor(0).setScale(2.4);
    this.weaponName = this.add.text(74, height - 50, 'PISTOL', { fontFamily: PX, fontSize: '10px', color: '#ffe066' }).setScrollFactor(0);
    this.ammoTxt = this.add.text(74, height - 30, '∞', { fontFamily: VT, fontSize: '28px', color: '#ffffff' }).setScrollFactor(0);

    // score + secrets (top-right)
    this.scoreTxt = this.add.text(width - 24, 14, 'SCORE 000000', { fontFamily: PX, fontSize: '12px', color: '#ffe066' }).setOrigin(1, 0).setScrollFactor(0).setShadow(0,0,'#ffcc33',6,true,true);
    this.secretTxt = this.add.text(width - 24, 38, 'SECRETS 0/0', { fontFamily: VT, fontSize: '20px', color: '#9a9ac6' }).setOrigin(1, 0).setScrollFactor(0);
    this.add.text(width / 2, 10, `STAGE ${this.levelIndex + 1}`, { fontFamily: PX, fontSize: '12px', color: '#ff2d6a' }).setOrigin(0.5, 0).setScrollFactor(0).setShadow(0,0,'#ff2d6a',8,true,true);
    this.comboTxt = this.add.text(width / 2, 34, '', { fontFamily: PX, fontSize: '10px', color: '#ff6644' }).setOrigin(0.5, 0).setScrollFactor(0).setShadow(0,0,'#ff6644',6,true,true);

    // boss bar (center top, hidden initially)
    this.bossBarWrap = this.add.container(width / 2, 84).setScrollFactor(0).setVisible(false);
    this.bossNameTxt = this.add.text(0, -22, 'BOSS', { fontFamily: PX, fontSize: '11px', color: '#ff2d6a' }).setOrigin(0.5).setShadow(0,0,'#ff2d6a',8,true,true);
    this.add.rectangle(0, 0, 440, 18, 0x1a0408).setOrigin(0.5);
    this.bossBarFill = this.add.rectangle(-220, 0, 440, 18, 0xff2d6a).setOrigin(0, 0.5);
    this.bossBarWrap.add([this.bossNameTxt, this.bossBarFill]);
    this.bossBarWrap.add(this.add.rectangle(0, 0, 440, 18).setStrokeStyle(2, 0xff2d6a).setOrigin(0.5));

    // damage vignette
    this.dmgVignette = this.add.rectangle(0, 0, width, height, 0xff0000, 0).setOrigin(0).setScrollFactor(0).setDepth(50);
  }

  bindGame(g: GameScene): void { this.game_scene = g; }

  update(): void {
    if (!this.game_scene?.player) return;
    const p = this.game_scene.player;
    this.recalcBar(this.healthBar, p.health / p.maxHealth, 0x33ff66);
    this.recalcBar(this.armorBar, p.armor / p.maxArmor, 0x3399ff);
    this.healthTxt.setText(`${Math.ceil(p.health)}`);
    const w = p.currentWeapon;
    this.weaponName.setText(w.name);
    const ammo = w.ammo;
    this.ammoTxt.setText(ammo === Infinity ? '∞' : `${ammo}`);
    // low-ammo feedback (skip the infinite-ammo pistol)
    const lowAmmo = ammo !== Infinity && ammo <= Math.max(4, (w.maxAmmo * 0.12));
    this.ammoTxt.setColor(lowAmmo ? '#ff3344' : '#ffffff');
    if (lowAmmo) {
      this.ammoTxt.setText(`${ammo}  LOW`);
      // gentle pulse on the ammo counter
      if (!this._lowAmmoTween) {
        this._lowAmmoTween = this.tweens.add({ targets: this.ammoTxt, alpha: 0.4, duration: 220, yoyo: true, repeat: 3, onComplete: () => { this._lowAmmoTween = undefined; } });
      }
    } else {
      if (this._lowAmmoTween) { this._lowAmmoTween.stop(); this._lowAmmoTween = undefined; }
      this.ammoTxt.setAlpha(1);
    }
    this.weaponIcon.setTexture(ICONS[w.id]);
    this.scoreTxt.setText('SCORE ' + this.game_scene.score.toString().padStart(6, '0'));
    this.secretTxt.setText(`SECRETS ${this.game_scene.secretsFound}/${this.game_scene.secretsTotal}`);
    this.comboTxt.setText(this.game_scene.combo >= 3 ? `COMBO x${this.game_scene.combo}` : '');
    // tint health bar by value
    this.healthBar.fillColor = p.health > 50 ? 0x33ff66 : p.health > 25 ? 0xffcc33 : 0xff3333;
  }

  private recalcBar(bar: Phaser.GameObjects.Rectangle, frac: number, _color: number): void {
    bar.width = Math.max(0, Math.min(1, frac)) * 216;
  }

  flashDamage(): void {
    this.dmgVignette.setAlpha(0.5);
    this.tweens.add({ targets: this.dmgVignette, alpha: 0, duration: 400 });
  }

  showBossBar(name: string): void {
    this.bossNameTxt.setText(name);
    this.bossBarWrap.setVisible(true);
    this.bossBarFill.width = 440;
  }
  hideBossBar(): void {
    this.tweens.add({ targets: this.bossBarWrap, alpha: 0, duration: 400, onComplete: () => { this.bossBarWrap.setVisible(false); this.bossBarWrap.setAlpha(1); } });
  }
  updateBossBar(frac: number, _name: string): void {
    this.bossBarFill.width = Math.max(0, frac) * 440;
  }
}
