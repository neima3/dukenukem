import Phaser from 'phaser';

/**
 * On-screen touch controls for mobile. Renders fixed-position buttons over the
 * game (scrollFactor 0) and tracks their pressed state. The host reads `state`
 * each frame and merges it into the Inputs object.
 *
 * Aim on touch is auto-assisted: when fire is held, the player snaps its aim to
 * the nearest enemy (see GameScene.makeInputs), so no virtual aim stick needed.
 */
export type TouchState = {
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
  detonate: boolean;
};

export class TouchControls {
  scene: Phaser.Scene;
  enabled: boolean;
  state: TouchState = { left: false, right: false, jump: false, fire: false, detonate: false };
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enabled = isTouchDevice();
  }

  /** Build the on-screen controls. Call once after the scene is created. */
  create(): void {
    if (!this.enabled) return;
    const { width, height } = this.scene.scale;

    const mk = (x: number, y: number, r: number, label: string, color: number, key: keyof TouchState): void => {
      const c = this.scene.add.container(x, y).setDepth(200).setScrollFactor(0);
      const ring = this.scene.add.circle(0, 0, r, color, 0.25).setStrokeStyle(3, color, 0.8);
      const txt = this.scene.add.text(0, 0, label, {
        fontFamily: 'monospace', fontSize: `${Math.round(r)}px`, color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      c.add([ring, txt]);
      // hit area slightly larger for thumbs
      const hit = this.scene.add.zone(x, y, r * 2.6, r * 2.6).setDepth(201).setScrollFactor(0).setInteractive();
      hit.on('pointerdown', () => { this.state[key] = true; ring.setFillStyle(color, 0.5); });
      hit.on('pointerup', () => { this.state[key] = false; ring.setFillStyle(color, 0.25); });
      hit.on('pointerout', () => { this.state[key] = false; ring.setFillStyle(color, 0.25); });
      this.buttons.push(c);
    };

    // movement (left cluster)
    mk(90, height - 90, 42, '◀', 0x3399ff, 'left');
    mk(210, height - 90, 42, '▶', 0x3399ff, 'right');
    mk(150, height - 180, 36, '↑', 0x33ddaa, 'jump');
    // fire + detonate (right cluster)
    mk(width - 90, height - 90, 52, '🔥', 0xff2d6a, 'fire');
    mk(width - 170, height - 70, 30, 'Q', 0xffcc33, 'detonate');
  }

  /** Hide/show (e.g. during pause). */
  setVisible(v: boolean): void {
    for (const b of this.buttons) b.setVisible(v);
  }
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints || 0) > 0 ||
    window.matchMedia?.('(pointer: coarse)').matches
  );
}
