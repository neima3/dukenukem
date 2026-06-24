/** Persistent save state via localStorage. */
export type SaveData = {
  unlocked: number;     // highest unlocked level index (0-based)
  highScore: number;    // total high score
  muted: boolean;
  sfxVol: number;       // 0..1
  musicVol: number;     // 0..1
};

const KEY = 'rexbrutus_save_v1';

export class SaveSystem {
  private data: SaveData = { unlocked: 0, highScore: 0, muted: false, sfxVol: 0.6, musicVol: 0.35 };

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
  get sfxVol(): number { return this.data.sfxVol; }
  get musicVol(): number { return this.data.musicVol; }

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

  setSfxVol(v: number): void {
    this.data.sfxVol = clamp01(v);
    this.save();
  }

  setMusicVol(v: number): void {
    this.data.musicVol = clamp01(v);
    this.save();
  }

  reset(): void {
    const keepSfx = this.data.sfxVol;
    const keepMusic = this.data.musicVol;
    const keepMuted = this.data.muted;
    this.data = { unlocked: 0, highScore: 0, muted: keepMuted, sfxVol: keepSfx, musicVol: keepMusic };
    this.save();
  }
}

export const save = new SaveSystem();

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
