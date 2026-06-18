export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  TILE: 32,
  GRAVITY: 1400,
  PLAYER_SPEED: 260,
  PLAYER_JUMP: 560,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_MAX_ARMOR: 100,
};

export const COLORS = {
  player: 0xff2d6a,
  playerSkin: 0xffb38a,
  playerBand: 0x1b1b2a,
  vest: 0x2a2a3a,
  pistol: 0xc0c0d0,
  shotgun: 0x8a5a2a,
  chaingun: 0x444455,
  rocket: 0xb0b0c0,
  devastator: 0x33ddaa,
  pipebomb: 0x3a3a3a,
  bullet: 0xffe066,
  enemyLizard: 0x55cc66,
  enemyBrain: 0xcc66cc,
  enemyPig: 0xcc8855,
  enemyDrone: 0x66ccff,
  enemyHeavy: 0xff6644,
  boss1: 0x666677,
  boss2: 0xaa8855,
  boss3: 0xaa33ff,
  health: 0x33ff66,
  armor: 0x3399ff,
  ammo: 0xffcc33,
  fuel: 0x33ffff,
  explosion: 0xff8833,
  hudBg: 0x0a0a14,
  hudFg: 0xffe066,
  spark: 0xffd633,
} as const;

export type Palette = {
  bg0: number;
  bg1: number;
  bg2: number;
  tile: number;
  tileDark: number;
  accent: number;
  fog: number;
};

export const PALETTES: Record<string, Palette> = {
  city:    { bg0: 0x0a0a1a, bg1: 0x1a1530, bg2: 0x2a1a40, tile: 0x4a4a5a, tileDark: 0x2a2a36, accent: 0xff2d6a, fog: 0x120a1a },
  sewers:  { bg0: 0x05100c, bg1: 0x0c2018, bg2: 0x143028, tile: 0x2a4038, tileDark: 0x182820, accent: 0x33ff99, fog: 0x0a1810 },
  roofs:   { bg0: 0x080018, bg1: 0x180a30, bg2: 0x2a0a40, tile: 0x3a2a4a, tileDark: 0x221a30, accent: 0xff33dd, fog: 0x140022 },
  desert:  { bg0: 0x1a0e02, bg1: 0x2a1808, bg2: 0x3a2410, tile: 0x6a4a28, tileDark: 0x4a3018, accent: 0xffcc33, fog: 0x2a1808 },
  base:    { bg0: 0x04040a, bg1: 0x0a0a1a, bg2: 0x14142a, tile: 0x2a3a5a, tileDark: 0x181f33, accent: 0x33ddff, fog: 0x08081a },
  ship:    { bg0: 0x02040a, bg1: 0x080a1a, bg2: 0x10142a, tile: 0x3a2a5a, tileDark: 0x241a33, accent: 0xaa33ff, fog: 0x04040a },
};

export type WeaponId = 'pistol' | 'shotgun' | 'chaingun' | 'pipebomb' | 'rocket' | 'devastator';

export const WEAPONS: Record<WeaponId, {
  name: string;
  color: number;
  damage: number;
  rate: number;       // ms between shots
  automatic: boolean;
  ammoPerShot: number;
  spread: number;     // radians
  projectiles: number;
  speed: number;      // px/sec
  explosion?: number; // radius
  isExplosive?: boolean;
}> = {
  pistol:     { name: 'PISTOL',     color: COLORS.pistol,     damage: 18, rate: 320, automatic: false, ammoPerShot: 0, spread: 0.01, projectiles: 1, speed: 900 },
  shotgun:    { name: 'SHOTGUN',    color: COLORS.shotgun,    damage: 11, rate: 720, automatic: false, ammoPerShot: 1, spread: 0.18, projectiles: 7, speed: 780 },
  chaingun:   { name: 'CHAINGUN',   color: COLORS.chaingun,   damage: 9,  rate: 80,  automatic: true,  ammoPerShot: 1, spread: 0.07, projectiles: 1, speed: 1000 },
  pipebomb:   { name: 'PIPE BOMB',  color: COLORS.pipebomb,   damage: 120,rate: 500, automatic: false, ammoPerShot: 1, spread: 0,    projectiles: 1, speed: 420, explosion: 130, isExplosive: true },
  rocket:     { name: 'ROCKET',     color: COLORS.rocket,     damage: 90, rate: 800, automatic: false, ammoPerShot: 1, spread: 0,    projectiles: 1, speed: 620, explosion: 110, isExplosive: true },
  devastator: { name: 'DEVASTATOR', color: COLORS.devastator, damage: 60, rate: 140, automatic: true,  ammoPerShot: 1, spread: 0.04, projectiles: 1, speed: 760, explosion: 70,  isExplosive: true },
};
