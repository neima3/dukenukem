import Phaser from 'phaser';
import { save } from '../systems/SaveSystem';
import { audio } from '../systems/AudioSystem';
import { music } from '../audio/musicGen';
import { sfx } from '../audio/sfxGen';
import { LEVELS } from '../levels/levelData';

const PX = "'Press Start 2P', monospace";
const VT = "'VT323', monospace";

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    save.load();
    audio.setMuted(save.muted);
    audio.setSfxVolume(save.sfxVol);
    audio.setMusicVolume(save.musicVol);

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05060a');
    for (let i = 0; i < 160; i++) {
      const s = this.add.rectangle(
        Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3),
        0xffffff, Phaser.Math.FloatBetween(0.2, 1));
      this.tweens.add({ targets: s, y: '+=10', duration: Phaser.Math.Between(2000, 6000), yoyo: true, repeat: -1 });
    }

    // neon horizon
    const band = this.add.rectangle(0, height * 0.62, width, 3, 0xff2d6a, 0.5).setOrigin(0, 0.5).setDepth(-2);

    this.add.text(width / 2, 96, 'REX BRUTUS', {
      fontFamily: PX, fontSize: '52px', color: '#ff2d6a',
    }).setOrigin(0.5).setShadow(0, 0, '#ff2d6a', 16, true, true);
    this.add.text(width / 2, 150, 'ALIEN  APOCALYPSE', {
      fontFamily: PX, fontSize: '16px', color: '#ffcc33',
    }).setOrigin(0.5).setShadow(0, 0, '#ffcc33', 6, true, true);

    this.add.text(width / 2, 196, '— original retro side-scrolling shooter —', {
      fontFamily: VT, fontSize: '22px', color: '#6a6a99',
    }).setOrigin(0.5);

    const items = [
      { label: 'NEW GAME', action: () => this.startLevel(0) },
    ];
    if (save.unlocked > 0) {
      items.unshift({ label: `CONTINUE (Level ${save.unlocked + 1})`, action: () => this.startLevel(save.unlocked) });
    }
    items.push({ label: 'LEVEL SELECT', action: () => this.showLevelSelect() });
    items.push({ label: 'SETTINGS', action: () => this.showSettings() });
    items.push({ label: save.muted ? 'SOUND: OFF' : 'SOUND: ON', action: () => this.toggleSound(items) });
    items.push({ label: 'CONTROLS', action: () => this.showControls() });

    let y = 320;
    const entries: Phaser.GameObjects.Text[] = [];
    const actions: (() => void)[] = [];
    items.forEach((it, i) => {
      const t = this.add.text(width / 2, y, it.label, {
        fontFamily: PX, fontSize: '18px', color: '#cfcfe6',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { t.setColor('#ffcc33'); t.setShadow(0,0,'#ffcc33',8,true,true); sfx.uiSelect(); });
      t.on('pointerout', () => { t.setColor(i === this._menuSel ? '#ffcc33' : '#cfcfe6'); t.setShadow(); });
      t.on('pointerdown', () => { sfx.uiSelect(); it.action(); });
      entries.push(t);
      actions.push(it.action);
      y += 50;
    });

    // keyboard-only navigation (accessibility)
    this._menuEntries = entries;
    this._menuActions = actions;
    this._menuSel = Math.min(this._menuSel, entries.length - 1);
    this._paintMenu();
    const kb = this.input.keyboard!;
    kb.removeAllListeners('keydown-UP'); kb.removeAllListeners('keydown-DOWN'); kb.removeAllListeners('keydown-ENTER');
    kb.on('keydown-UP', () => { this._menuSel = (this._menuSel + entries.length - 1) % entries.length; this._paintMenu(); sfx.uiSelect(); });
    kb.on('keydown-DOWN', () => { this._menuSel = (this._menuSel + 1) % entries.length; this._paintMenu(); sfx.uiSelect(); });
    kb.on('keydown-ENTER', () => { sfx.uiSelect(); actions[this._menuSel]?.(); });

    this.add.text(width / 2, height - 30, `HIGH SCORE  ${save.highScore.toString().padStart(6, '0')}`, {
      fontFamily: PX, fontSize: '12px', color: '#7a7a99',
    }).setOrigin(0.5);

    music.play('menu');
  }

  private _menuEntries: Phaser.GameObjects.Text[] = [];
  private _menuActions: (() => void)[] = [];
  private _menuSel = 0;
  private _paintMenu(): void {
    this._menuEntries.forEach((t, i) => {
      const sel = i === this._menuSel;
      t.setColor(sel ? '#ffcc33' : '#cfcfe6');
      t.setShadow(sel ? 0 : undefined, sel ? 0 : undefined, sel ? '#ffcc33' : '#000', sel ? 10 : 0, true, true);
    });
  }

  private toggleSound(items: { label: string }[]): void {
    const m = !save.muted;
    save.setMuted(m);
    audio.setMuted(m);
    // refresh label
    const soundLabel = items.find((i) => i.label.startsWith('SOUND'));
    if (soundLabel) soundLabel.label = m ? 'SOUND: OFF' : 'SOUND: ON';
    this.scene.restart();
  }

  private showControls(): void {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setInteractive();
    const lines = [
      'CONTROLS',
      '',
      'A / D or ← / → ...... Move',
      'SPACE / W ............ Jump',
      'S / ↓ ............... Crouch',
      'MOUSE ............... Aim',
      'LEFT CLICK .......... Shoot',
      'RIGHT CLICK ......... Throw pipe bomb',
      '1 - 6 ............... Switch weapon',
      'R ................... Reload',
      'E ................... Interact / use',
      'Q ................... Detonate pipe bombs',
      'P / ESC ............. Pause',
      '',
      'click to close',
    ];
    const txt = this.add.text(width / 2, height / 2, lines.join('\n'), {
      fontFamily: VT, fontSize: '26px', color: '#ffe066', align: 'center',
    }).setOrigin(0.5);
    overlay.on('pointerdown', () => { overlay.destroy(); txt.destroy(); });
  }

  private showLevelSelect(): void {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
    this.add.text(width / 2, 80, 'SELECT LEVEL', {
      fontFamily: PX, fontSize: '24px', color: '#ff2d6a',
    }).setOrigin(0.5).setShadow(0,0,'#ff2d6a',10,true,true);

    const colX = [width / 2 - 220, width / 2, width / 2 + 220];
    LEVELS.forEach((lv, i) => {
      const locked = i > save.unlocked;
      const x = colX[i % 3];
      const y = 170 + Math.floor(i / 3) * 140;
      const box = this.add.rectangle(x, y, 180, 110, locked ? 0x1a1a26 : 0x2a2a40, 0.9)
        .setStrokeStyle(2, locked ? 0x333344 : 0xff2d6a).setInteractive({ useHandCursor: !locked });
      const name = this.add.text(x, y - 16, `${i + 1}. ${lv.name}`, {
        fontFamily: 'monospace', fontSize: '16px', color: locked ? '#555566' : '#ffe066', align: 'center',
      }).setOrigin(0.5);
      const sub = this.add.text(x, y + 16, locked ? '🔒 LOCKED' : lv.subtitle, {
        fontFamily: 'monospace', fontSize: '12px', color: locked ? '#444455' : '#9a9ac6', align: 'center',
      }).setOrigin(0.5);
      if (!locked) {
        box.on('pointerover', () => box.setFillStyle(0x3a3a60));
        box.on('pointerout', () => box.setFillStyle(0x2a2a40));
        box.on('pointerdown', () => { sfx.uiSelect(); overlay.destroy(); this.startLevel(i); });
      }
      void name; void sub;
    });

    const close = this.add.text(width / 2, height - 40, 'click outside to close', {
      fontFamily: 'monospace', fontSize: '14px', color: '#555577',
    }).setOrigin(0.5);
    overlay.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // close if clicked on overlay itself
      if (p.y < 150 || p.y > height - 60) { overlay.destroy(); close.destroy(); this.scene.restart(); }
    });
  }

  private showSettings(): void {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
    this.add.text(width / 2, 110, 'SETTINGS', {
      fontFamily: PX, fontSize: '28px', color: '#ff2d6a',
    }).setOrigin(0.5).setShadow(0,0,'#ff2d6a',10,true,true);

    const drawSlider = (label: string, y: number, getValue: () => number, setValue: (v: number) => void): void => {
      this.add.text(width / 2 - 180, y, label, {
        fontFamily: PX, fontSize: '14px', color: '#cfcfe6',
      }).setOrigin(0, 0.5);
      const SEGMENTS = 10;
      const segW = 26, gap = 4;
      const segs: Phaser.GameObjects.Rectangle[] = [];
      const repaint = () => {
        const filled = Math.round(getValue() * SEGMENTS);
        segs.forEach((s, i) => s.setFillStyle(i < filled ? 0x33ff66 : 0x333344));
      };
      for (let i = 0; i < SEGMENTS; i++) {
        const sx = width / 2 - 60 + i * (segW + gap);
        const seg = this.add.rectangle(sx, y, segW, 22, 0x333344).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        seg.on('pointerdown', () => { setValue((i + 1) / SEGMENTS); repaint(); sfx.uiSelect(); });
        segs.push(seg);
      }
      // mute button (sets to 0)
      const mute = this.add.text(width / 2 - 60 + SEGMENTS * (segW + gap) + 10, y, '✕', {
        fontFamily: 'monospace', fontSize: '20px', color: '#ff5555',
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      mute.on('pointerdown', () => { setValue(0); repaint(); });
      repaint();
    };

    drawSlider('SFX', height / 2 - 30,
      () => save.sfxVol,
      (v) => { save.setSfxVol(v); audio.setSfxVolume(v); if (v > 0) audio.setMuted(false); });
    drawSlider('MUSIC', height / 2 + 30,
      () => save.musicVol,
      (v) => { save.setMusicVol(v); audio.setMusicVolume(v); });

    this.add.text(width / 2, height / 2 + 100, 'click a bar to set volume · click outside to close', {
      fontFamily: 'monospace', fontSize: '13px', color: '#6a6a99',
    }).setOrigin(0.5);

    overlay.on('pointerdown', () => { overlay.destroy(); this.scene.restart(); });
  }

  private startLevel(index: number): void {
    music.stop();
    this.scene.start('Game', { level: index });
  }
}
