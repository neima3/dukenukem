import Phaser from 'phaser';

/** Centralized keyboard + mouse state. Attach to a scene's keyboard/mouse. */
export class InputSystem {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys('W,A,S,D,R,E,Q,ONE,TWO,THREE,FOUR,FIVE,SIX,P,SPACE,SHIFT') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  get left(): boolean { return this.cursors.left.isDown || this.keys.A.isDown; }
  get right(): boolean { return this.cursors.right.isDown || this.keys.D.isDown; }
  get up(): boolean { return this.cursors.up.isDown || this.keys.W.isDown; }
  get down(): boolean { return this.cursors.down.isDown || this.keys.S.isDown; }
  get jumpHeld(): boolean { return this.cursors.space.isDown || this.keys.W.isDown || this.cursors.up.isDown; }
  get reload(): boolean { return this.keys.R.isDown; }

  isJumpPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up);
  }
  isInteractPressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.E); }
  isDetonatePressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.Q); }
  isPausePressed(): boolean { return Phaser.Input.Keyboard.JustDown(this.keys.P); }

  weaponKey(): number | null {
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) return 1;
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) return 2;
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) return 3;
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) return 4;
    if (Phaser.Input.Keyboard.JustDown(this.keys.FIVE)) return 5;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SIX)) return 6;
    return null;
  }

  get cursorKeys() { return this.cursors; }
  get rawKeys() { return this.keys; }
}
