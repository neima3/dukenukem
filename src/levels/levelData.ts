import { PALETTES, type Palette, type WeaponId } from '../config';
import { mulberry32 } from '../utils';

export type EnemyType = 'lizard' | 'brain' | 'pig' | 'drone' | 'heavy';
export type BossType = 'tank' | 'worm' | 'lord';

export type EnemySpawn = { type: EnemyType; x: number; y: number };
export type PickupSpawn =
  | { kind: 'health'; x: number; y: number }
  | { kind: 'armor'; x: number; y: number }
  | { kind: 'ammo'; x: number; y: number; weapon?: WeaponId }
  | { kind: 'fuel'; x: number; y: number }
  | { kind: 'weapon'; x: number; y: number; weapon: WeaponId }
  | { kind: 'secret'; x: number; y: number };

export type LevelData = {
  index: number;
  name: string;
  subtitle: string;
  palette: Palette;
  paletteKey: string;
  music: string;
  width: number;       // px
  height: number;      // px (= viewport height for ground level scroll)
  groundY: number;     // top Y of ground band (px)
  platforms: Array<{ x: number; y: number; w: number; h: number }>;
  hazards: Array<{ x: number; y: number; w: number }>;
  secretBlocks: Array<{ x: number; y: number; w: number; h: number }>;
  playerStart: { x: number; y: number };
  enemies: EnemySpawn[];
  pickups: PickupSpawn[];
  boss: BossType | null;
  bossAt: number;      // x where boss spawns (px)
  exitX: number;       // x of exit door (px)
  intro: string;       // one-liner on level start
  weapons: WeaponId[]; // weapons introduced/available
};

export const LEVEL_META: Array<{
  name: string; subtitle: string; paletteKey: keyof typeof PALETTES;
  music: string; length: number; groundY: number; density: number;
  boss: BossType | null; weapons: WeaponId[]; intro: string;
  enemyPool: EnemyType[]; hazards: boolean; vertical: boolean;
}> = [
  {
    name: 'Downtown Invasion', subtitle: 'City streets under siege',
    paletteKey: 'city', music: 'city', length: 6400, groundY: 600, density: 0.6,
    boss: 'tank', weapons: ['pistol', 'shotgun'], intro: 'Time to kick ass and chew gum.',
    enemyPool: ['lizard', 'lizard', 'drone'], hazards: false, vertical: false,
  },
  {
    name: 'City Sewers', subtitle: 'Something stirs down here',
    paletteKey: 'sewers', music: 'sewers', length: 6800, groundY: 600, density: 0.7,
    boss: null, weapons: ['pistol', 'shotgun', 'chaingun'], intro: 'Smells like alien.',
    enemyPool: ['brain', 'brain', 'lizard'], hazards: true, vertical: false,
  },
  {
    name: 'Red-Light Rooftops', subtitle: 'Up on the roof',
    paletteKey: 'roofs', music: 'roofs', length: 7000, groundY: 580, density: 0.75,
    boss: null, weapons: ['pistol', 'shotgun', 'chaingun', 'pipebomb'], intro: 'Nice view for a kill.',
    enemyPool: ['drone', 'drone', 'brain', 'lizard'], hazards: true, vertical: true,
  },
  {
    name: 'Desert Approach', subtitle: 'Into the wastes',
    paletteKey: 'desert', music: 'desert', length: 7400, groundY: 600, density: 0.8,
    boss: 'worm', weapons: ['pistol', 'shotgun', 'chaingun', 'pipebomb', 'rocket'], intro: 'Sands run red.',
    enemyPool: ['pig', 'lizard', 'heavy'], hazards: false, vertical: false,
  },
  {
    name: 'Alien Base', subtitle: 'Deep in the hive',
    paletteKey: 'base', music: 'base', length: 7600, groundY: 600, density: 0.9,
    boss: null, weapons: ['pistol', 'shotgun', 'chaingun', 'pipebomb', 'rocket', 'devastator'], intro: 'Party crasher.',
    enemyPool: ['pig', 'heavy', 'brain', 'drone'], hazards: true, vertical: false,
  },
  {
    name: 'The Mothership', subtitle: 'Final showdown',
    paletteKey: 'ship', music: 'ship', length: 7200, groundY: 600, density: 1.0,
    boss: 'lord', weapons: ['pistol', 'shotgun', 'chaingun', 'pipebomb', 'rocket', 'devastator'], intro: 'Game over, aliens.',
    enemyPool: ['pig', 'heavy', 'drone', 'brain'], hazards: true, vertical: false,
  },
];

/** Generate a fully-playable LevelData from metadata. Deterministic per index. */
export function buildLevel(index: number): LevelData {
  const meta = LEVEL_META[index];
  const rng = mulberry32((index + 1) * 98765);
  const TILE = 32;
  const palette = PALETTES[meta.paletteKey];
  const W = meta.length;
  const H = GAME_HEIGHT;
  const groundY = meta.groundY;

  const platforms: LevelData['platforms'] = [];
  const hazards: LevelData['hazards'] = [];
  const secretBlocks: LevelData['secretBlocks'] = [];
  const enemies: EnemySpawn[] = [];
  const pickups: PickupSpawn[] = [];

  // ground is implicit (a continuous solid band). Add platform chunks + gaps.
  let x = 500;
  while (x < W - 800) {
    const gap = meta.hazards && rng() > 0.5 ? 64 + Math.floor(rng() * 64) : 0;
    x += gap;
    if (meta.hazards && gap > 0) {
      hazards.push({ x: x - gap, y: groundY + 28, w: gap });
    }
    // floating platform
    if (rng() > 0.35) {
      const pw = 96 + Math.floor(rng() * 160);
      const py = groundY - 96 - Math.floor(rng() * (meta.vertical ? 260 : 120));
      platforms.push({ x, y: py, w: pw, h: 24 });
      // chance of a secret block embedded above
      if (rng() > 0.55) {
        secretBlocks.push({ x: x + pw / 2 - 32, y: py - 40, w: 64, h: 32 });
        pickups.push({ kind: 'secret', x: x + pw / 2, y: py - 64 });
      }
      // pickup on platform
      if (rng() > 0.5) {
        const kinds: PickupSpawn['kind'][] = ['health', 'armor', 'ammo'];
        const kind = kinds[Math.floor(rng() * kinds.length)];
        pickups.push({ kind, x: x + pw / 2, y: py - 20, weapon: meta.weapons[Math.floor(rng() * meta.weapons.length)] } as PickupSpawn);
      }
    }
    // ground enemy
    if (rng() < meta.density) {
      const type = meta.enemyPool[Math.floor(rng() * meta.enemyPool.length)];
      enemies.push({ type, x: x + 60, y: groundY - 40 });
    }
    // flying drone occasionally
    if (meta.enemyPool.includes('drone') && rng() > 0.7) {
      enemies.push({ type: 'drone', x: x + 120, y: groundY - 200 - Math.floor(rng() * 120) });
    }
    x += 240 + Math.floor(rng() * 200);
  }

  // weapon pickups introduced mid-level (first occurrence)
  const introduce = meta.weapons.filter((w) => w !== 'pistol' && (index === 0 || !LEVEL_META.slice(0, index).some((m) => m.weapons.includes(w))));
  introduce.forEach((w, i) => {
    pickups.push({ kind: 'weapon', x: 700 + i * 600, y: groundY - 40, weapon: w });
  });

  // a couple of guaranteed health/armor on the ground
  pickups.push({ kind: 'health', x: 1400, y: groundY - 40 });
  pickups.push({ kind: 'armor', x: 3000, y: groundY - 40 });
  pickups.push({ kind: 'ammo', x: 2200, y: groundY - 40, weapon: meta.weapons[1] });

  const exitX = W - 200;
  const bossAt = meta.boss ? W - 1200 : -1;

  return {
    index,
    name: meta.name,
    subtitle: meta.subtitle,
    palette,
    paletteKey: meta.paletteKey as string,
    music: meta.music,
    width: W,
    height: H,
    groundY,
    platforms,
    hazards,
    secretBlocks,
    playerStart: { x: 120, y: groundY - 80 },
    enemies,
    pickups,
    boss: meta.boss,
    bossAt,
    exitX,
    intro: meta.intro,
    weapons: meta.weapons,
  };
}

const GAME_HEIGHT = 720;

export const LEVELS: LevelData[] = LEVEL_META.map((_, i) => buildLevel(i));
