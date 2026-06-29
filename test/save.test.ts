import { describe, it, expect, beforeEach } from 'vitest';
import { save } from '../src/systems/SaveSystem';

describe('SaveSystem', () => {
  beforeEach(() => {
    // fresh in-memory localStorage per test
    const store = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    } as Storage;
    save.wipe(); // start each test from factory defaults
  });

  it('starts empty and loads defaults', () => {
    const data = save.load();
    expect(data.unlocked).toBe(0);
    expect(data.highScore).toBe(0);
    expect(data.muted).toBe(false);
  });

  it('persists unlocked level across reload', () => {
    save.load();
    save.unlock(3);
    // simulate reload by reloading from storage
    save.load();
    expect(save.unlocked).toBe(4);
  });

  it('unlock never decreases progress', () => {
    save.load();
    save.unlock(5);
    save.unlock(1);
    expect(save.unlocked).toBe(6);
  });

  it('only raises the high score', () => {
    save.load();
    save.submitScore(1000);
    save.submitScore(500);
    expect(save.highScore).toBe(1000);
    save.submitScore(2000);
    expect(save.highScore).toBe(2000);
  });

  it('remembers the muted preference', () => {
    save.load();
    save.setMuted(true);
    save.load();
    expect(save.muted).toBe(true);
  });

  it('qualifies() gates the board', () => {
    save.load();
    expect(save.qualifies(0)).toBe(false);
    expect(save.qualifies(500)).toBe(true); // empty board
  });

  it('keeps the leaderboard sorted and capped at 10', () => {
    save.load();
    for (let i = 0; i < 12; i++) save.submitEntry('AAA', (i + 1) * 1000);
    const board = save.leaderboard;
    expect(board.length).toBe(10);
    // highest first
    expect(board[0].score).toBeGreaterThanOrEqual(board[1].score);
    expect(board[0].score).toBe(12000);
    // newest tie ranks first among equal scores
    save.submitEntry('ZZZ', 12000);
    expect(save.leaderboard[0].name).toBe('ZZZ');
  });

  it('normalizes initials to 3 uppercase chars', () => {
    save.load();
    save.submitEntry('rex', 9999);
    expect(save.leaderboard[0].name).toBe('REX');
    save.submitEntry('toolong', 1);
    expect(save.leaderboard.find((e) => e.score === 1)?.name).toBe('TOO');
  });
});
