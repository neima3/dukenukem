/** Pure, framework-agnostic helpers shared by game logic and tests. */

export type WeaponId = 'pistol' | 'shotgun' | 'chaingun' | 'pipebomb' | 'rocket' | 'devastator';

/** Clamp a number into [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Deterministic seeded PRNG (mulberry32). Returns a function in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Slab-method segment vs AABB intersection. */
export function segmentAABB(
  x1: number, y1: number, x2: number, y2: number,
  minX: number, minY: number, maxX: number, maxY: number,
): boolean {
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  if (Math.abs(dx) < 1e-8) {
    if (x1 < minX || x1 > maxX) return false;
  } else {
    let t1 = (minX - x1) / dx, t2 = (maxX - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-8) {
    if (y1 < minY || y1 > maxY) return false;
  } else {
    let t1 = (minY - y1) / dy, t2 = (maxY - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** Ammo granted by an ammo pickup for a given weapon id. */
export function weaponRefill(id: string): number {
  switch (id) {
    case 'shotgun': return 12;
    case 'chaingun': return 60;
    case 'pipebomb': return 4;
    case 'rocket': return 4;
    case 'devastator': return 25;
    default: return 0;
  }
}

/**
 * Per-level difficulty multipliers for HP and damage. Keeps early levels
 * gentle while letting the late campaign hit harder. Indices beyond the
 * campaign length continue to ramp.
 */
export function difficultyForLevel(levelIndex: number): { hp: number; dmg: number; speed: number } {
  const t = Math.max(0, levelIndex);
  return {
    hp: 1 + 0.12 * t,     // +12% enemy HP per level
    dmg: 1 + 0.08 * t,    // +8% enemy damage per level
    speed: 1 + 0.03 * t,  // +3% enemy speed per level
  };
}

/**
 * Explosion splash damage with linear falloff.
 * Full `base` at the center, decaying to ~30% at the radius edge.
 * `distance` > `radius` yields 0.
 */
export function splashDamage(base: number, distance: number, radius: number): number {
  if (radius <= 0) return 0;
  if (distance > radius) return 0;
  const falloff = 1 - 0.7 * (distance / radius);
  return Math.max(0, base * falloff);
}
