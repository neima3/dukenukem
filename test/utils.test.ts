import { describe, it, expect } from 'vitest';
import { clamp, mulberry32, segmentAABB, weaponRefill, splashDamage, difficultyForLevel } from '../src/utils';

describe('clamp', () => {
  it('clamps within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it('handles equal bounds', () => {
    expect(clamp(3, 3, 3)).toBe(3);
  });
});

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });
  it('produces values in [0,1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('differs for different seeds', () => {
    const a = Array.from({ length: 5 }, () => mulberry32(1)());
    const b = Array.from({ length: 5 }, () => mulberry32(2)());
    expect(a).not.toEqual(b);
  });
});

describe('segmentAABB', () => {
  const box = { minX: 10, minY: 10, maxX: 20, maxY: 20 };
  it('detects a segment crossing the box', () => {
    expect(segmentAABB(0, 15, 30, 15, box.minX, box.minY, box.maxX, box.maxY)).toBe(true);
    expect(segmentAABB(15, 0, 15, 30, box.minX, box.minY, box.maxX, box.maxY)).toBe(true);
  });
  it('rejects a segment that misses', () => {
    expect(segmentAABB(0, 0, 5, 5, box.minX, box.minY, box.maxX, box.maxY)).toBe(false);
    expect(segmentAABB(30, 30, 40, 40, box.minX, box.minY, box.maxX, box.maxY)).toBe(false);
  });
  it('detects a segment starting inside the box', () => {
    expect(segmentAABB(15, 15, 100, 100, box.minX, box.minY, box.maxX, box.maxY)).toBe(true);
  });
});

describe('weaponRefill', () => {
  it('returns positive ammo for known weapons', () => {
    expect(weaponRefill('shotgun')).toBe(12);
    expect(weaponRefill('chaingun')).toBe(60);
    expect(weaponRefill('rocket')).toBe(4);
    expect(weaponRefill('devastator')).toBe(25);
    expect(weaponRefill('pipebomb')).toBe(4);
  });
  it('returns 0 for the pistol / unknown', () => {
    expect(weaponRefill('pistol')).toBe(0);
    expect(weaponRefill('nonsense')).toBe(0);
  });
});

describe('splashDamage', () => {
  it('deals full damage at the center', () => {
    expect(splashDamage(100, 0, 100)).toBe(100);
  });
  it('decays linearly to ~30% at the radius edge', () => {
    expect(splashDamage(100, 100, 100)).toBeCloseTo(30, 5);
    expect(splashDamage(100, 50, 100)).toBeCloseTo(65, 5);
  });
  it('deals no damage at or beyond the radius', () => {
    expect(splashDamage(100, 100, 100)).toBeLessThanOrEqual(100);
    expect(splashDamage(100, 101, 100)).toBe(0);
    expect(splashDamage(100, 999, 100)).toBe(0);
  });
  it('is monotonic (closer = more damage)', () => {
    const near = splashDamage(120, 10, 130);
    const mid = splashDamage(120, 65, 130);
    const far = splashDamage(120, 120, 130);
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
  });
  it('is safe with zero radius', () => {
    expect(splashDamage(100, 0, 0)).toBe(0);
  });
});

describe('difficultyForLevel', () => {
  it('is neutral on level 0', () => {
    expect(difficultyForLevel(0)).toEqual({ hp: 1, dmg: 1, speed: 1 });
  });
  it('ramps up with the level index', () => {
    const early = difficultyForLevel(0);
    const late = difficultyForLevel(5);
    expect(late.hp).toBeGreaterThan(early.hp);
    expect(late.dmg).toBeGreaterThan(early.dmg);
    expect(late.speed).toBeGreaterThan(early.speed);
  });
  it('never reduces stats below neutral for negative input', () => {
    const d = difficultyForLevel(-3);
    expect(d.hp).toBe(1);
    expect(d.dmg).toBe(1);
    expect(d.speed).toBe(1);
  });
});
