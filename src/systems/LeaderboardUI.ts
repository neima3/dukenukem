import Phaser from 'phaser';
import { save } from './SaveSystem';

const PX = "'Press Start 2P', monospace";
const VT = "'VT323', monospace";

/** Render the leaderboard rows starting at (x, y). Returns the created text objects. */
export function drawLeaderboard(scene: Phaser.Scene, x: number, y: number, count = 10): Phaser.GameObjects.Text[] {
  const rows: Phaser.GameObjects.Text[] = [];
  const board = save.leaderboard.slice(0, count);
  for (let i = 0; i < count; i++) {
    const e = board[i];
    const rank = `${(i + 1).toString().padStart(2, '0')}`;
    const name = e ? e.name : '---';
    const score = e ? e.score.toString().padStart(6, '0') : '000000';
    const color = i === 0 ? '#ffcc33' : i < 3 ? '#ff2d6a' : '#9a9ac6';
    const t = scene.add.text(x, y + i * 26, `${rank}  ${name}  ${score}`, {
      fontFamily: PX, fontSize: '12px', color,
    }).setOrigin(0.5, 0).setShadow(0, 0, color, i < 3 ? 6 : 0, true, true);
    rows.push(t);
  }
  return rows;
}

export { PX, VT };

/**
 * Arcade 3-initial keyboard entry. Renders 3 slots at (cx, cy); resolves with
 * the uppercased initials (3 chars) when the player presses Enter.
 */
export function runNameEntry(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  done: (initials: string) => void,
): void {
  const initials = ['A', 'A', 'A'];
  let pos = 0;
  const slots = initials.map((c, i) => scene.add.text(cx - 60 + i * 60, cy, c, {
    fontFamily: PX, fontSize: '40px', color: i === 0 ? '#ffcc33' : '#cfcfe6',
  }).setOrigin(0.5).setShadow(0, 0, i === 0 ? '#ffcc33' : '#000', 8, true, true));

  const repaint = () => slots.forEach((s, i) => { s.text = initials[i]; s.setColor(i === pos ? '#ffcc33' : '#cfcfe6'); });
  scene.tweens.add({ targets: () => slots[pos], scale: { from: 1, to: 1.12 }, duration: 320, yoyo: true, repeat: -1 });

  const kb = scene.input.keyboard!;
  kb.on('keydown', (ev: Phaser.Input.Keyboard.KeyboardPlugin) => {
    const key = (ev as unknown as KeyboardEvent).key;
    if (/^[a-zA-Z0-9]$/.test(key) && pos < 3) {
      initials[pos] = key.toUpperCase(); pos = Math.min(3, pos + 1); repaint();
    } else if (key === 'Backspace' && pos > 0) {
      pos--; initials[pos] = 'A'; repaint();
    } else if (key === 'Enter') {
      kb.removeAllListeners('keydown');
      done(initials.join(''));
    }
  });
}
