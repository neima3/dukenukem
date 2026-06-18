/** Persistent save state via localStorage. */
export type SaveData = {
  unlocked: number;     // highest unlocked level index (0-based)
  highScore: number;    // total high score
  muted: boolean;
};

const KEY = 'rexbrutus_save_v1';

export class SaveSystem {
  private data: SaveData = { unlocked: 0, highScore: 0, muted: false };

  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...this.data, ...JSON.parse(raw) };
    } catch {
      /* ignore corrupt save */
    }
    return this.data;
  }

  save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage might be unavailable */
    }
  }

  get unlocked(): number { return this.data.unlocked; }
  get highScore(): number { return this.data.highScore; }
  get muted(): boolean { return this.data.muted; }

  unlock(levelIndex: number): void {
    if (levelIndex + 1 > this.data.unlocked) {
      this.data.unlocked = levelIndex + 1;
      this.save();
    }
  }

  submitScore(score: number): void {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
    }
  }

  setMuted(m: boolean): void {
    this.data.muted = m;
    this.save();
  }

  reset(): void {
    this.data = { unlocked: 0, highScore: 0, muted: this.data.muted };
    this.save();
  }
}

export const save = new SaveSystem();
