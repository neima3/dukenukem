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
});
