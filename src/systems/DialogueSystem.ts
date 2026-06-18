import Phaser from 'phaser';

/** Floating combat/comedy text. All one-liners are original. */
const KILL_LINES = [
  'Eat lead!', 'Catch!', 'Boom!', 'Wrecked!', 'Too easy!', 'Have some!',
  'Sit down!', 'Scrap metal!', 'GG!', 'Lights out!',
];
const STREAK_LINES = ['RAMPAGE!', 'KILLING SPREE!', 'UNSTOPPABLE!', 'BERSERKER!', 'MASSACRE!'];
const PICKUP_LINES = ['Nice.', 'Oh yeah.', 'Mine now.', 'Gimme.'];
const HURT_LINES = ['Ouch.', 'That all?', 'Cheap shot!'];
const SECRET_LINES = ['Found it!', 'What\'s in here?', 'Jackpot!', 'Secret!'];
const LEVEL_INTRO = [
  'Time to kick ass and chew gum.',
  'Let\'s dance, aliens.',
  'Smells like alien.',
  'Nice view for a kill.',
  'Sands run red.',
  'Party crasher.',
  'Game over, aliens.',
];

export class DialogueSystem {
  scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene; }

  private float(x: number, y: number, text: string, color: string): void {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '18px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 1100,
      onComplete: () => t.destroy(),
    });
  }

  kill(x: number, y: number): void {
    this.float(x, y, KILL_LINES[Math.floor(Math.random() * KILL_LINES.length)], '#ffcc33');
  }
  streak(x: number, y: number, n: number): void {
    const line = STREAK_LINES[Math.min(STREAK_LINES.length - 1, Math.floor(n / 3))];
    this.float(x, y - 20, line, '#ff2d6a');
  }
  pickup(x: number, y: number): void {
    this.float(x, y, PICKUP_LINES[Math.floor(Math.random() * PICKUP_LINES.length)], '#33ff66');
  }
  hurt(x: number, y: number): void {
    this.float(x, y, HURT_LINES[Math.floor(Math.random() * HURT_LINES.length)], '#ff6666');
  }
  secret(x: number, y: number): void {
    this.float(x, y, SECRET_LINES[Math.floor(Math.random() * SECRET_LINES.length)], '#ffcc33');
  }
  intro(index: number): string {
    return LEVEL_INTRO[index] ?? 'Go time.';
  }
  say(text: string, _color = 0xffcc33): void {
    const { width } = this.scene.scale;
    const t = this.scene.add.text(width / 2, 90, text, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffcc33', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60);
    this.scene.tweens.add({ targets: t, alpha: 0, duration: 1800, delay: 600, onComplete: () => t.destroy() });
  }
}
