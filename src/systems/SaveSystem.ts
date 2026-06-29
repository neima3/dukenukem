/** Persistent save state via localStorage. */
export type ScoreEntry = { name: string; score: number };

export type SaveData = {
  unlocked: number;     // highest unlocked level index (0-based)
  highScore: number;    // single best score (kept for the menu footer)
  muted: boolean;
  sfxVol: number;       // 0..1
  musicVol: number;     // 0..1
  scores: ScoreEntry[]; // top-10 leaderboard (newest tied entry first)
};

const KEY = 'rexbrutus_save_v1';
const MAX_SCORES = 10;

export class SaveSystem {
  private data: SaveData = { unlocked: 0, highScore: 0, muted: false, sfxVol: 0.6, musicVol: 0.35, scores: [] };

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

  /** Top-10 leaderboard, highest first. */
  get leaderboard(): ScoreEntry[] { return this.data.scores.slice(); }

  /** True if `score` would make the top-10 board. */
  qualifies(score: number): boolean {
    if (score <= 0) return false;
    if (this.data.scores.length < MAX_SCORES) return true;
    return score > (this.data.scores[this.data.scores.length - 1]?.score ?? 0);
  }

  /** Insert a name/score into the board (desc by score, newest tie first), trim to 10. */
  submitEntry(name: string, score: number): void {
    const entry: ScoreEntry = { name: (name || '---').slice(0, 3).toUpperCase(), score };
    // insert before the first entry with a strictly lower score (=> newest-first on ties)
    let i = 0;
    while (i < this.data.scores.length && this.data.scores[i].score > score) i++;
    this.data.scores.splice(i, 0, entry);
    this.data.scores = this.data.scores.slice(0, MAX_SCORES);
    if (score > this.data.highScore) this.data.highScore = score;
    this.save();
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
    const keepScores = this.data.scores;
    this.data = { unlocked: 0, highScore: 0, muted: keepMuted, sfxVol: keepSfx, musicVol: keepMusic, scores: keepScores };
    this.save();
  }

  /** Full wipe to factory defaults (used by "reset all" UI and tests). */
  wipe(): void {
    this.data = { unlocked: 0, highScore: 0, muted: false, sfxVol: 0.6, musicVol: 0.35, scores: [] };
    this.save();
  }
}

export const save = new SaveSystem();

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
