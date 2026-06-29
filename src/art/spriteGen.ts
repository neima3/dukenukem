import Phaser from 'phaser';
import { COLORS } from '../config';

/**
 * Procedural sprite generator. Draws all game art to Phaser textures at boot.
 * Everything is original artwork drawn from code — no external image assets.
 *
 * Outlines + shading are produced with a stamp pass: each sprite's paint
 * function is run once per outline offset in a dark color, then again in the
 * real colors, all composited onto one texture.
 */

type G = Phaser.GameObjects.Graphics;
type Paint = (g: G) => void;

const OUTLINE = 0x07070d;

// stamp state (set by outlinePaint) — primitives read these
let OX = 0, OY = 0, OVERRIDE: number | null = null;

function px(g: G, x: number, y: number, w: number, h: number, color: number, alpha = 1): void {
  g.fillStyle(OVERRIDE ?? color, OVERRIDE != null ? 1 : alpha);
  g.fillRect(x + OX, y + OY, w, h);
}
function fc(g: G, cx: number, cy: number, r: number, color: number, alpha = 1): void {
  g.fillStyle(OVERRIDE ?? color, OVERRIDE != null ? 1 : alpha);
  g.fillCircle(cx + OX, cy + OY, r);
}
function fellipse(g: G, cx: number, cy: number, w: number, h: number, color: number, alpha = 1): void {
  g.fillStyle(OVERRIDE ?? color, OVERRIDE != null ? 1 : alpha);
  g.fillEllipse(cx + OX, cy + OY, w, h);
}
function ftri(g: G, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: number, alpha = 1): void {
  g.fillStyle(OVERRIDE ?? color, OVERRIDE != null ? 1 : alpha);
  g.fillTriangle(x1 + OX, y1 + OY, x2 + OX, y2 + OY, x3 + OX, y3 + OY);
}

function newG(scene: Phaser.Scene): G {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

/** Build a texture, stamping a 1px dark outline around the combined silhouette. */
function outlined(scene: Phaser.Scene, key: string, w: number, h: number, paint: Paint, pad = 1): void {
  const g = newG(scene);
  const offsets: Array<[number, number]> = [[-pad, 0], [pad, 0], [0, -pad], [0, pad], [-pad, -pad], [pad, pad], [-pad, pad], [pad, -pad]];
  OVERRIDE = OUTLINE;
  for (const [ox, oy] of offsets) { OX = ox; OY = oy; paint(g); }
  OVERRIDE = null; OX = 0; OY = 0;
  paint(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Texture without outline (used for tiny particles/bullets). */
function plain(scene: Phaser.Scene, key: string, w: number, h: number, paint: Paint): void {
  const g = newG(scene);
  paint(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** lighten/darken a color by amt in [-1,1] for cheap shading */
function shade(hex: number, amt: number): number {
  let r = (hex >> 16) & 0xff, gr = (hex >> 8) & 0xff, b = hex & 0xff;
  const f = amt < 0 ? 0 : 255;
  const t = Math.abs(amt);
  r = Math.round((f - r) * t + r); gr = Math.round((f - gr) * t + gr); b = Math.round((f - b) * t + b);
  return (r << 16) | (gr << 8) | b;
}

// ---------------------------- sprites ----------------------------

type PlayerPhase = 'idle' | 'w1' | 'w2' | 'crouch' | 'jump';
function paintPlayer(g: G, phase: PlayerPhase): void {
  const C = COLORS;
  const leg = shade(C.vest, -0.25);
  // legs differ by phase (walk cycle / crouch / jump tuck)
  if (phase === 'crouch') {
    px(g, 7, 34, 8, 8, leg); px(g, 17, 34, 8, 8, leg);
    px(g, 8, 41, 6, 2, 0x050507); px(g, 17, 41, 6, 2, 0x050507);
  } else if (phase === 'jump') {
    px(g, 8, 30, 7, 10, leg); px(g, 17, 30, 7, 10, leg);
    px(g, 6, 36, 4, 4, 0x050507); px(g, 22, 36, 4, 4, 0x050507);
  } else if (phase === 'w1') {
    px(g, 6, 32, 7, 12, leg); px(g, 19, 32, 7, 12, leg);
    px(g, 6, 42, 6, 2, 0x050507); px(g, 19, 42, 6, 2, 0x050507);
  } else if (phase === 'w2') {
    px(g, 10, 32, 7, 12, leg); px(g, 15, 32, 7, 12, leg);
    px(g, 10, 42, 6, 2, 0x050507); px(g, 15, 42, 6, 2, 0x050507);
  } else {
    px(g, 8, 32, 7, 12, leg); px(g, 17, 32, 7, 12, leg);
    px(g, 9, 42, 6, 2, 0x050507); px(g, 17, 42, 6, 2, 0x050507);
  }
  // torso
  px(g, 7, 16, 18, 18, C.player);
  px(g, 9, 18, 14, 12, C.vest);
  px(g, 9, 18, 14, 2, shade(C.vest, 0.18));
  px(g, 11, 20, 4, 8, shade(C.player, 0.12));
  px(g, 17, 20, 4, 8, shade(C.player, -0.12));
  // head + bandana + sunglasses
  px(g, 10, 4, 12, 12, C.playerSkin);
  px(g, 10, 4, 12, 4, C.player);
  px(g, 10, 3, 12, 1, shade(C.player, 0.25));
  px(g, 10, 6, 12, 3, 0x080808);
  px(g, 14, 7, 4, 2, 0x334466);
  px(g, 13, 12, 6, 1, 0x551111);
  px(g, 24, 20, 6, 3, 0x222233); // gun
}

function drawPlayer(scene: Phaser.Scene): void {
  (['idle', 'w1', 'w2', 'crouch', 'jump'] as PlayerPhase[]).forEach((p) => {
    const key = p === 'idle' ? 'player' : `player${p.charAt(0).toUpperCase()}${p.slice(1)}`;
    outlined(scene, key, 32, 44, (g) => paintPlayer(g, p));
  });
}

function drawParticle(scene: Phaser.Scene): void {
  plain(scene, 'pix', 4, 4, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(2, 2, 2); });
}

function drawBullet(scene: Phaser.Scene): void {
  plain(scene, 'bullet', 8, 4, (g) => {
    px(g, 0, 1, 8, 2, COLORS.bullet);
    px(g, 6, 0, 2, 4, 0xffffff, 0.9);
  });
  plain(scene, 'bulletPlasma', 10, 4, (g) => { px(g, 0, 1, 10, 2, COLORS.devastator); });
}

function drawRocket(scene: Phaser.Scene): void {
  outlined(scene, 'rocket', 16, 10, (g) => {
    px(g, 0, 2, 14, 6, COLORS.rocket);
    px(g, 0, 2, 14, 2, shade(COLORS.rocket, 0.2));
    px(g, 12, 1, 4, 8, 0xff6644);
    px(g, 14, 3, 2, 4, COLORS.spark);
    px(g, 0, 3, 3, 4, 0x888899);
  });
}

function drawPipe(scene: Phaser.Scene): void {
  outlined(scene, 'pipebomb', 14, 12, (g) => {
    px(g, 0, 1, 10, 10, COLORS.pipebomb);
    px(g, 0, 1, 10, 2, shade(COLORS.pipebomb, 0.2));
    px(g, 2, 3, 3, 3, 0xff4444);
    px(g, 10, -1, 2, 6, 0x884400);
  });
}

function drawEnemy(scene: Phaser.Scene, key: string, body: number, shape: 'grunt' | 'brain' | 'brute' | 'drone' | 'heavy'): void {
  const dark = OUTLINE;
  const hi = shade(body, 0.22), lo = shade(body, -0.22);
  if (shape === 'grunt') {
    outlined(scene, key, 30, 40, (g) => {
      px(g, 8, 26, 6, 12, lo); px(g, 16, 26, 6, 12, lo);
      px(g, 7, 10, 16, 18, body);
      px(g, 7, 10, 16, 3, hi);
      px(g, 8, 0, 14, 12, body);
      px(g, 8, 0, 14, 3, hi);
      px(g, 10, 4, 3, 3, 0xffee44); px(g, 17, 4, 3, 3, 0xffee44);
      px(g, 8, 8, 14, 2, dark);
      px(g, 23, 14, 5, 8, 0x553333);
    });
  } else if (shape === 'brain') {
    outlined(scene, key, 30, 30, (g) => {
      px(g, 4, 8, 22, 16, body);
      px(g, 6, 4, 18, 6, shade(body, 0.15));
      px(g, 2, 12, 4, 10, lo); px(g, 24, 12, 4, 10, lo);
      px(g, 10, 10, 4, 4, 0xff88ff); px(g, 16, 10, 4, 4, 0xff88ff);
      px(g, 11, 11, 1, 1, 0xffffff);
    });
  } else if (shape === 'brute') {
    outlined(scene, key, 40, 44, (g) => {
      px(g, 10, 28, 9, 14, lo); px(g, 21, 28, 9, 14, lo);
      px(g, 6, 12, 28, 18, body);
      px(g, 6, 12, 28, 4, hi);
      px(g, 8, 0, 24, 14, body);
      px(g, 8, 0, 24, 4, hi);
      px(g, 16, 10, 8, 6, 0xddaa88);
      px(g, 18, 14, 2, 2, 0x111111); px(g, 22, 14, 2, 2, 0x111111);
      px(g, 10, 4, 5, 4, 0x331a1a); px(g, 25, 4, 5, 4, 0x331a1a);
      px(g, 0, 16, 6, 10, 0x442211);
    });
  } else if (shape === 'drone') {
    outlined(scene, key, 28, 28, (g) => {
      fc(g, 14, 14, 12, body);
      fc(g, 14, 11, 12, body); // slight highlight bias upward
      fc(g, 14, 14, 7, 0xffffff);
      fc(g, 14, 14, 3, 0xff2222);
      px(g, 2, 12, 3, 4, body); px(g, 23, 12, 3, 4, body);
    });
  } else {
    outlined(scene, key, 36, 42, (g) => {
      px(g, 9, 28, 7, 12, lo); px(g, 20, 28, 7, 12, lo);
      px(g, 6, 12, 24, 18, body);
      px(g, 6, 12, 24, 4, hi);
      px(g, 8, 0, 20, 14, body);
      px(g, 11, 5, 4, 4, 0xffff66); px(g, 21, 5, 4, 4, 0xffff66);
      px(g, 28, 14, 8, 10, 0x555566);
      px(g, 0, 14, 6, 8, 0x555566);
    });
  }
}

function drawBoss(scene: Phaser.Scene, key: string, body: number, kind: 'tank' | 'worm' | 'lord'): void {
  const hi = shade(body, 0.2), lo = shade(body, -0.25);
  if (kind === 'tank') {
    outlined(scene, key, 200, 110, (g) => {
      px(g, 10, 20, 180, 60, body);
      px(g, 10, 20, 180, 6, hi);
      px(g, 30, 10, 140, 20, body);
      px(g, 0, 40, 20, 30, lo); px(g, 180, 40, 20, 30, lo);
      px(g, 80, 50, 40, 40, 0x222233);
      px(g, 90, 60, 8, 8, 0xff3322);
      px(g, 40, 30, 10, 10, 0xffaa00); px(g, 150, 30, 10, 10, 0xffaa00);
    });
  } else if (kind === 'worm') {
    outlined(scene, key, 120, 120, (g) => {
      fc(g, 60, 60, 56, body);
      fc(g, 60, 54, 56, hi);
      fellipse(g, 60, 60, 70, 50, 0x220a0a);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const tx = 60 + Math.cos(a) * 28, ty = 60 + Math.sin(a) * 20;
        px(g, Math.floor(tx - 2), Math.floor(ty - 4), 4, 8, 0xeecc88);
      }
    });
  } else {
    outlined(scene, key, 160, 160, (g) => {
      fc(g, 80, 80, 70, body);
      fc(g, 80, 74, 70, hi);
      fellipse(g, 80, 80, 48, 48, 0x220044);
      fc(g, 80, 80, 20, 0xff2200);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const tx = 80 + Math.cos(a) * 70, ty = 80 + Math.sin(a) * 70;
        px(g, Math.floor(tx - 3), Math.floor(ty - 10), 6, 14, 0x8833cc);
      }
    });
  }
}

function drawTiles(scene: Phaser.Scene): void {
  // solid block with bevel
  outlined(scene, 'tile', 32, 32, (g) => {
    px(g, 0, 0, 32, 32, 0x3a3a4a);
    px(g, 0, 0, 32, 3, 0x5a5a6a);
    px(g, 0, 29, 32, 3, 0x222230);
    px(g, 6, 8, 4, 4, 0x2a2a38); px(g, 20, 14, 5, 3, 0x2a2a38); px(g, 10, 20, 3, 4, 0x2a2a38);
  });
  plain(scene, 'tileSecret', 32, 32, (g) => {
    px(g, 0, 0, 32, 32, 0x40384a);
    px(g, 0, 0, 32, 2, 0x6a5a7a);
    px(g, 4, 6, 24, 2, 0x2a2230); px(g, 4, 16, 24, 2, 0x2a2230); px(g, 4, 26, 24, 2, 0x2a2230);
  });
  plain(scene, 'tileBg', 32, 32, (g) => { px(g, 0, 0, 32, 32, 0x1a1a2a, 0.6); });
  // hazard spikes
  outlined(scene, 'hazard', 32, 32, (g) => {
    px(g, 0, 24, 32, 8, 0x551122);
    for (let i = 0; i < 4; i++) {
      const sx = i * 8;
      ftri(g, sx, 24, sx + 8, 24, sx + 4, 8, 0xff5522);
    }
  });
}

function drawPickups(scene: Phaser.Scene): void {
  const mk = (key: string, w: number, h: number, paint: Paint, outline = true) => {
    (outline ? outlined : plain)(scene, key, w, h, paint);
  };
  mk('pickupHealth', 20, 20, (g) => {
    px(g, 4, 4, 12, 12, 0x141414); px(g, 4, 4, 12, 2, 0x2a2a2a);
    px(g, 8, 6, 4, 8, COLORS.health); px(g, 6, 8, 8, 4, COLORS.health);
  });
  mk('pickupArmor', 20, 20, (g) => {
    px(g, 4, 4, 12, 12, 0x141414);
    px(g, 5, 5, 10, 4, COLORS.armor); px(g, 7, 9, 6, 8, COLORS.armor);
  });
  mk('pickupAmmo', 20, 20, (g) => {
    px(g, 5, 5, 10, 10, 0x141400); px(g, 7, 4, 6, 3, COLORS.ammo); px(g, 7, 10, 6, 3, COLORS.ammo);
  });
  mk('pickupFuel', 20, 20, (g) => {
    px(g, 6, 4, 8, 12, 0x113333); px(g, 8, 6, 4, 8, COLORS.fuel);
  });
  const wp: Array<[string, number]> = [
    ['pickupShotgun', COLORS.shotgun], ['pickupChaingun', COLORS.chaingun],
    ['pickupPipebomb', COLORS.pipebomb], ['pickupRocket', COLORS.rocket], ['pickupDevastator', COLORS.devastator],
  ];
  for (const [key, color] of wp) {
    mk(key, 24, 18, (g) => { px(g, 0, 6, 20, 6, color); px(g, 0, 6, 20, 1, shade(color, 0.25)); px(g, 18, 4, 6, 10, 0x222233); });
  }
  mk('exit', 48, 64, (g) => {
    px(g, 0, 0, 48, 64, 0x1a1a2a); px(g, 4, 4, 40, 56, 0x2a2a3a);
    px(g, 6, 8, 36, 4, COLORS.health); px(g, 6, 18, 36, 4, COLORS.health); px(g, 6, 28, 36, 4, COLORS.health); px(g, 6, 38, 36, 4, COLORS.health);
  }, false);
  mk('secret', 20, 20, (g) => {
    fc(g, 10, 10, 9, COLORS.ammo);
    fc(g, 10, 8, 9, shade(COLORS.ammo, 0.25));
  });
}

function drawWeaponIcons(scene: Phaser.Scene): void {
  const mk = (key: string, w: number, h: number, paint: Paint) => outlined(scene, key, w, h, paint);
  mk('iconPistol', 16, 12, (g) => { px(g, 0, 4, 12, 3, COLORS.pistol); px(g, 10, 4, 4, 6, COLORS.pistol); });
  mk('iconShotgun', 22, 12, (g) => { px(g, 0, 4, 16, 3, COLORS.shotgun); px(g, 14, 3, 6, 5, COLORS.shotgun); });
  mk('iconChaingun', 20, 12, (g) => { px(g, 0, 3, 14, 5, COLORS.chaingun); px(g, 12, 5, 6, 2, 0x222233); });
  mk('iconPipebomb', 14, 14, (g) => { px(g, 2, 4, 8, 8, COLORS.pipebomb); px(g, 8, 1, 2, 4, 0x884400); });
  mk('iconRocket', 18, 12, (g) => { px(g, 0, 4, 14, 4, COLORS.rocket); px(g, 12, 3, 4, 6, 0xff6644); });
  mk('iconDevastator', 18, 14, (g) => { px(g, 0, 4, 12, 4, COLORS.devastator); px(g, 10, 2, 6, 8, COLORS.devastator); });
}

export function generateAll(scene: Phaser.Scene): void {
  drawParticle(scene);
  drawPlayer(scene);
  drawBullet(scene);
  drawRocket(scene);
  drawPipe(scene);
  drawEnemy(scene, 'enemyLizard', COLORS.enemyLizard, 'grunt');
  drawEnemy(scene, 'enemyBrain', COLORS.enemyBrain, 'brain');
  drawEnemy(scene, 'enemyPig', COLORS.enemyPig, 'brute');
  drawEnemy(scene, 'enemyDrone', COLORS.enemyDrone, 'drone');
  drawEnemy(scene, 'enemyHeavy', COLORS.enemyHeavy, 'heavy');
  drawBoss(scene, 'bossTank', COLORS.boss1, 'tank');
  drawBoss(scene, 'bossWorm', COLORS.boss2, 'worm');
  drawBoss(scene, 'bossLord', COLORS.boss3, 'lord');
  drawTiles(scene);
  drawPickups(scene);
  drawWeaponIcons(scene);
}
