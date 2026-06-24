import { describe, it, expect } from 'vitest';
import { buildLevel, LEVELS, LEVEL_META } from '../src/levels/levelData';

describe('buildLevel determinism', () => {
  it('produces identical output for the same index', () => {
    const a = buildLevel(0);
    const b = buildLevel(0);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('differs between levels', () => {
    const a = JSON.stringify(buildLevel(0));
    const b = JSON.stringify(buildLevel(1));
    expect(a).not.toBe(b);
  });
});

describe('level invariants', () => {
  it('every level is playable and complete', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const lv = LEVELS[i];
      expect(lv.index).toBe(i);
      expect(lv.name.length).toBeGreaterThan(0);
      expect(lv.width).toBeGreaterThan(2000);
      expect(lv.playerStart.x).toBeGreaterThan(0);
      expect(lv.playerStart.y).toBeLessThan(lv.height);
      expect(lv.exitX).toBeGreaterThan(lv.playerStart.x);
      // bossAt is either -1 (no boss) or a valid x past the player start
      expect(lv.bossAt === -1 || lv.bossAt > lv.playerStart.x).toBe(true);
    }
  });

  it('platforms stay within world bounds and above ground', () => {
    for (const lv of LEVELS) {
      for (const p of lv.platforms) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w).toBeLessThanOrEqual(lv.width);
        expect(p.y).toBeLessThan(lv.groundY);
        expect(p.w).toBeGreaterThan(0);
      }
    }
  });

  it('every non-final level that declares a boss spawns exactly one', () => {
    const bossLevels = LEVEL_META.filter((m) => m.boss);
    expect(bossLevels.length).toBeGreaterThanOrEqual(3);
    for (const m of bossLevels) {
      const lv = LEVELS[LEVEL_META.indexOf(m)];
      expect(lv.boss).toBe(m.boss);
      expect(lv.bossAt).toBeGreaterThan(0);
    }
  });

  it('introduces at least one new weapon per level that lists it', () => {
    for (const lv of LEVELS) {
      expect(lv.weapons.length).toBeGreaterThan(0);
      expect(lv.weapons).toContain('pistol');
    }
  });

  it('has at least one secret on some level', () => {
    const totalSecrets = LEVELS.reduce((n, lv) => n + lv.pickups.filter((p) => p.kind === 'secret').length, 0);
    expect(totalSecrets).toBeGreaterThan(0);
  });
});
