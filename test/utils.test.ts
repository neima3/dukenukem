import { describe, it, expect } from 'vitest';
import { clamp, mulberry32, segmentAABB, weaponRefill } from '../src/utils';

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
