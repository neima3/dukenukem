import { describe, it, expect } from 'vitest';
import { WEAPONS, PALETTES, GAME } from '../src/config';

describe('WEAPONS config', () => {
  const ids = Object.keys(WEAPONS);

  it('defines all six weapons', () => {
    expect(ids).toEqual(
      expect.arrayContaining(['pistol', 'shotgun', 'chaingun', 'pipebomb', 'rocket', 'devastator']),
    );
    expect(ids.length).toBe(6);
  });

  it.each(ids)('%s has sane damage/rate/speed', (id) => {
    const w = WEAPONS[id as keyof typeof WEAPONS];
    expect(w.damage).toBeGreaterThan(0);
    expect(w.rate).toBeGreaterThanOrEqual(40);   // at least ~25 shots/sec max
    expect(w.rate).toBeLessThan(2000);
    expect(w.speed).toBeGreaterThan(300);
    expect(w.projectiles).toBeGreaterThanOrEqual(1);
    expect(w.spread).toBeGreaterThanOrEqual(0);
  });

  it('pistol is the infinite-ammo baseline', () => {
    expect(WEAPONS.pistol.ammoPerShot).toBe(0);
    expect(WEAPONS.pistol.projectiles).toBe(1);
    expect(WEAPONS.pistol.spread).toBeLessThanOrEqual(0.02);
  });

  it('shotgun fires a spread of pellets', () => {
    expect(WEAPONS.shotgun.projectiles).toBeGreaterThan(1);
    expect(WEAPONS.shotgun.spread).toBeGreaterThan(0);
  });

  it('explosive weapons declare an explosion radius', () => {
    for (const id of ids) {
      const w = WEAPONS[id as keyof typeof WEAPONS];
      if (w.isExplosive) expect(w.explosion).toBeGreaterThan(0);
    }
  });
});

describe('PALETTES', () => {
  it('has a palette per environment used by the campaign', () => {
    for (const key of ['city', 'sewers', 'roofs', 'desert', 'base', 'ship']) {
      expect(PALETTES[key]).toBeDefined();
      const p = PALETTES[key];
      expect(p.bg0).toBeLessThanOrEqual(p.bg2);
      expect(p.tile).not.toBe(p.tileDark);
    }
  });
});

describe('GAME constants', () => {
  it('physics tuning is positive and sane', () => {
    expect(GAME.GRAVITY).toBeGreaterThan(0);
    expect(GAME.PLAYER_JUMP).toBeGreaterThan(0);
    expect(GAME.PLAYER_SPEED).toBeGreaterThan(0);
    expect(GAME.PLAYER_MAX_HEALTH).toBe(100);
  });
});
