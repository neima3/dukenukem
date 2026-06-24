import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import type { WeaponId } from '../config';

const ICONS: Record<WeaponId, string> = {
  pistol: 'iconPistol', shotgun: 'iconShotgun', chaingun: 'iconChaingun',
  pipebomb: 'iconPipebomb', rocket: 'iconRocket', devastator: 'iconDevastator',
};

export class HUDScene extends Phaser.Scene {
  game_scene!: GameScene;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private armorBar!: Phaser.GameObjects.Rectangle;
  private healthTxt!: Phaser.GameObjects.Text;
  private armorTxt!: Phaser.GameObjects.Text;
  private scoreTxt!: Phaser.GameObjects.Text;
  private ammoTxt!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Image;
  private weaponName!: Phaser.GameObjects.Text;
  private levelTxt!: Phaser.GameObjects.Text;
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
    this.add.rectangle(0, 0, width, 60, 0x000000, 0.45).setOrigin(0);
    this.add.rectangle(0, height - 60, width, 60, 0x000000, 0.45).setOrigin(0);

    // health
    this.add.image(28, 22, 'pickupHealth').setScale(1.1).setScrollFactor(0);
    this.healthBar = this.add.rectangle(50, 16, 200, 14, 0x550000).setOrigin(0).setScrollFactor(0);
    this.healthTxt = this.add.text(50, 14, '', { fontFamily: 'monospace', fontSize: '12px', color: '#33ff66' }).setScrollFactor(0).setDepth(5);
    this.recalcBar(this.healthBar, 1, 0x33ff66);

    // armor
    this.add.image(28, 46, 'pickupArmor').setScale(1.1).setScrollFactor(0);
    this.armorBar = this.add.rectangle(50, 40, 200, 14, 0x002244).setOrigin(0).setScrollFactor(0);
    this.recalcBar(this.armorBar, 0, 0x3399ff);

    // weapon + ammo (bottom-left)
    this.weaponIcon = this.add.image(40, height - 30, 'iconPistol').setScrollFactor(0).setScale(2);
    this.weaponName = this.add.text(70, height - 46, 'PISTOL', { fontFamily: 'monospace', fontSize: '16px', color: '#ffe066' }).setScrollFactor(0);
    this.ammoTxt = this.add.text(70, height - 26, '∞', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setScrollFactor(0);

    // score + secrets (top-right)
    this.scoreTxt = this.add.text(width - 20, 12, 'SCORE 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffe066' }).setOrigin(1, 0).setScrollFactor(0);
    this.secretTxt = this.add.text(width - 20, 36, 'SECRETS 0/0', { fontFamily: 'monospace', fontSize: '12px', color: '#9a9ac6' }).setOrigin(1, 0).setScrollFactor(0);
    this.levelTxt = this.add.text(width / 2, 12, `LEVEL ${this.levelIndex + 1}`, { fontFamily: 'monospace', fontSize: '16px', color: '#ff2d6a' }).setOrigin(0.5, 0).setScrollFactor(0);
    this.comboTxt = this.add.text(width / 2, 36, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ff6644' }).setOrigin(0.5, 0).setScrollFactor(0);

    // boss bar (center top, hidden initially)
    this.bossBarWrap = this.add.container(width / 2, 64).setScrollFactor(0).setVisible(false);
    this.bossNameTxt = this.add.text(0, -20, 'BOSS', { fontFamily: 'monospace', fontSize: '14px', color: '#ff2d6a' }).setOrigin(0.5);
    this.add.rectangle(0, 0, 420, 16, 0x220000).setOrigin(0.5);
    this.bossBarFill = this.add.rectangle(-210, 0, 420, 16, 0xff2d6a).setOrigin(0, 0.5);
    this.bossBarWrap.add([this.bossNameTxt, this.bossBarFill]);
    this.bossBarWrap.add(this.add.rectangle(0, 0, 420, 16).setStrokeStyle(2, 0xff2d6a).setOrigin(0.5));

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
    const w = Math.max(0, Math.min(1, frac)) * 200;
    bar.width = w;
  }

  flashDamage(): void {
    this.dmgVignette.setAlpha(0.5);
    this.tweens.add({ targets: this.dmgVignette, alpha: 0, duration: 400 });
  }

  showBossBar(name: string): void {
    this.bossNameTxt.setText(name);
    this.bossBarWrap.setVisible(true);
    this.bossBarFill.width = 420;
  }
  hideBossBar(): void {
    this.tweens.add({ targets: this.bossBarWrap, alpha: 0, duration: 400, onComplete: () => { this.bossBarWrap.setVisible(false); this.bossBarWrap.setAlpha(1); } });
  }
  updateBossBar(frac: number, _name: string): void {
    this.bossBarFill.width = Math.max(0, frac) * 420;
  }
}
