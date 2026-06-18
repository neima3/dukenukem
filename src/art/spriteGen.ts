import Phaser from 'phaser';
import { COLORS } from '../config';

/**
 * Procedural sprite generator. Draws all game art to Phaser textures at boot
 * using Graphics + CanvasTexture. No external image assets are used.
 * Everything here is original artwork drawn from code.
 */

type G = Phaser.GameObjects.Graphics;

function px(g: G, x: number, y: number, w: number, h: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function toTexture(g: G, scene: Phaser.Scene, key: string, w: number, h: number): void {
  g.generateTexture(key, w, h);
  g.destroy();
}

function newG(scene: Phaser.Scene): G {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

/** Player — muscular hero with sunglasses, bandana, vest. Facing right. 32x44. */
function drawPlayer(scene: Phaser.Scene): void {
  const g = newG(scene);
  const C = COLORS;
  // legs
  px(g, 8, 32, 7, 12, C.vest);
  px(g, 17, 32, 7, 12, C.vest);
  px(g, 9, 42, 6, 2, 0x111122);
  px(g, 17, 42, 6, 2, 0x111122);
  // torso (muscle vest)
  px(g, 7, 16, 18, 18, C.player);
  px(g, 9, 18, 14, 12, C.vest);
  px(g, 11, 20, 4, 8, C.player);  // arm
  px(g, 17, 20, 4, 8, C.player);  // arm
  // head + bandana + sunglasses
  px(g, 10, 4, 12, 12, C.playerSkin);
  px(g, 10, 4, 12, 4, C.player);       // bandana
  px(g, 10, 6, 12, 3, 0x080808);       // sunglasses
  px(g, 14, 7, 4, 2, 0x222244);        // lens shine
  // grin
  px(g, 13, 12, 6, 1, 0x551111);
  toTexture(g, scene, 'player', 32, 44);

  // left-facing version (flip handled in code via setFlipX, but keep a hurt flash too)
}

/** Blood/impact particle dot. */
function drawParticle(scene: Phaser.Scene): void {
  const g = newG(scene);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(2, 2, 2);
  toTexture(g, scene, 'pix', 4, 4);
}

/** Pistol bullet (small tracer). */
function drawBullet(scene: Phaser.Scene): void {
  const g = newG(scene);
  px(g, 0, 1, 8, 2, COLORS.bullet);
  px(g, 6, 0, 2, 4, 0xffffff, 0.9);
  toTexture(g, scene, 'bullet', 8, 4);

  const g2 = newG(scene);
  px(g2, 0, 1, 10, 2, COLORS.devastator);
  toTexture(g2, scene, 'bulletPlasma', 10, 4);
}

/** Rocket. */
function drawRocket(scene: Phaser.Scene): void {
  const g = newG(scene);
  px(g, 0, 2, 14, 6, COLORS.rocket);
  px(g, 12, 1, 4, 8, 0xff6644);   // tip
  px(g, 14, 3, 2, 4, COLORS.spark);
  px(g, 0, 3, 3, 4, 0x888899);    // fins
  toTexture(g, scene, 'rocket', 16, 10);
}

/** Pipe bomb (thrown). */
function drawPipe(scene: Phaser.Scene): void {
  const g = newG(scene);
  px(g, 0, 0, 10, 10, COLORS.pipebomb);
  px(g, 2, 2, 3, 3, 0xff4444);   // blinker
  px(g, 10, -2, 2, 6, 0x884400); // fuse
  toTexture(g, scene, 'pipebomb', 14, 10);
}

/** Generic enemy sprite drawer — builds a labeled texture with given palette + shape. */
function drawEnemy(
  scene: Phaser.Scene,
  key: string,
  body: number,
  shape: 'grunt' | 'brain' | 'brute' | 'drone' | 'heavy',
): void {
  const g = newG(scene);
  const dark = 0x000000;
  if (shape === 'grunt') {
    // Lizard trooper — reptilian humanoid, 30x40
    px(g, 8, 26, 6, 12, body); px(g, 16, 26, 6, 12, body);
    px(g, 7, 10, 16, 18, body);
    px(g, 8, 0, 14, 12, body); // head
    px(g, 10, 4, 3, 3, 0xffee44); // eye
    px(g, 17, 4, 3, 3, 0xffee44);
    px(g, 8, 8, 14, 2, dark); // mouth
    px(g, 23, 14, 5, 8, 0x553333); // gun arm
    toTexture(g, scene, key, 30, 40);
  } else if (shape === 'brain') {
    // Brain crawler — blobby with tendrils, 30x30
    px(g, 4, 8, 22, 16, body);
    px(g, 6, 4, 18, 6, body);
    px(g, 2, 12, 4, 10, body); // tendrils
    px(g, 24, 12, 4, 10, body);
    px(g, 10, 10, 4, 4, 0xff66ff); // eyes
    px(g, 16, 10, 4, 4, 0xff66ff);
    toTexture(g, scene, key, 30, 30);
  } else if (shape === 'brute') {
    // Pig brute — big & tanky, 40x44
    px(g, 10, 28, 9, 14, body); px(g, 21, 28, 9, 14, body);
    px(g, 6, 12, 28, 18, body);
    px(g, 8, 0, 24, 14, body); // big head
    px(g, 16, 10, 8, 6, 0xddaa88); // snout
    px(g, 18, 14, 2, 2, 0x111111); // nostril
    px(g, 22, 14, 2, 2, 0x111111);
    px(g, 10, 4, 5, 4, 0x331a1a); // eye
    px(g, 25, 4, 5, 4, 0x331a1a);
    px(g, 0, 16, 6, 10, 0x442211); // gun arm
    toTexture(g, scene, key, 40, 44);
  } else if (shape === 'drone') {
    // Sentry drone — floating eyeball-bot, 28x28
    g.fillStyle(body, 1);
    g.fillCircle(14, 14, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(14, 14, 7);
    g.fillStyle(0xff2222, 1);
    g.fillCircle(14, 14, 3);
    px(g, 2, 12, 3, 4, body); px(g, 23, 12, 3, 4, body); // side fins
    toTexture(g, scene, key, 28, 28);
  } else {
    // Heavy gunner — stocky with shoulder cannon, 36x42
    px(g, 9, 28, 7, 12, body); px(g, 20, 28, 7, 12, body);
    px(g, 6, 12, 24, 18, body);
    px(g, 8, 0, 20, 14, body);
    px(g, 11, 5, 4, 4, 0xffff66); px(g, 21, 5, 4, 4, 0xffff66);
    px(g, 28, 14, 8, 10, 0x555566); // cannon
    px(g, 0, 14, 6, 8, 0x555566);
    toTexture(g, scene, key, 36, 42);
  }
}

/** Boss sprites — big multi-piece. We draw a body texture; bosses compose more in code. */
function drawBoss(scene: Phaser.Scene, key: string, body: number, kind: 'tank' | 'worm' | 'lord'): void {
  const g = newG(scene);
  if (kind === 'tank') {
    // HoverTank — 200x110
    px(g, 10, 20, 180, 60, body);
    px(g, 30, 10, 140, 20, body);
    px(g, 0, 40, 20, 30, 0x444455); // treads/skids
    px(g, 180, 40, 20, 30, 0x444455);
    px(g, 80, 50, 40, 40, 0x222233); // main cannon
    px(g, 90, 60, 8, 8, 0xff3322);   // vent weakpoint
    px(g, 40, 30, 10, 10, 0xffaa00); // lights
    px(g, 150, 30, 10, 10, 0xffaa00);
    toTexture(g, scene, key, 200, 110);
  } else if (kind === 'worm') {
    // SandWorm head — 120x120 (segments added in code)
    g.fillStyle(body, 1);
    g.fillCircle(60, 60, 56);
    g.fillStyle(0x220a0a, 1);
    g.fillEllipse(60, 60, 70, 50); // maw
    // teeth
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tx = 60 + Math.cos(a) * 28, ty = 60 + Math.sin(a) * 20;
      px(g, Math.floor(tx - 2), Math.floor(ty - 4), 4, 8, 0xeecc88);
    }
    toTexture(g, scene, key, 120, 120);
  } else {
    // Alien Overlord — 160x160
    g.fillStyle(body, 1);
    g.fillCircle(80, 80, 70);
    g.fillStyle(0x220044, 1);
    g.fillCircle(80, 80, 48);
    g.fillStyle(0xff2200, 1);
    g.fillCircle(80, 80, 20); // core eye
    // spikes
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tx = 80 + Math.cos(a) * 70, ty = 80 + Math.sin(a) * 70;
      g.fillStyle(0x8833cc, 1);
      g.fillRect(Math.floor(tx - 3), Math.floor(ty - 10), 6, 14);
    }
    toTexture(g, scene, key, 160, 160);
  }
}

/** Tile textures. */
function drawTiles(scene: Phaser.Scene): void {
  // solid block
  const g = newG(scene);
  px(g, 0, 0, 32, 32, 0x3a3a4a);
  px(g, 0, 0, 32, 4, 0x5a5a6a);
  px(g, 0, 28, 32, 4, 0x222230);
  for (let i = 0; i < 6; i++) px(g, 2 + i * 5, 8 + ((i * 7) % 16), 2, 2, 0x2a2a38);
  toTexture(g, scene, 'tile', 32, 32);

  // destructible secret wall (slightly different)
  const g2 = newG(scene);
  px(g2, 0, 0, 32, 32, 0x40384a);
  px(g2, 0, 0, 32, 2, 0x6a5a7a);
  px(g2, 4, 6, 24, 2, 0x2a2230); px(g2, 4, 16, 24, 2, 0x2a2230); px(g2, 4, 26, 24, 2, 0x2a2230);
  toTexture(g2, scene, 'tileSecret', 32, 32);

  // background detail tile (non-colliding)
  const g3 = newG(scene);
  px(g3, 0, 0, 32, 32, 0x1a1a2a, 0.6);
  toTexture(g3, scene, 'tileBg', 32, 32);

  // hazard (spikes/lava) 32x32
  const g4 = newG(scene);
  px(g4, 0, 24, 32, 8, 0x551122);
  for (let i = 0; i < 4; i++) {
    const sx = i * 8;
    g4.fillStyle(0xff5522, 1);
    g4.fillTriangle(sx, 24, sx + 8, 24, sx + 4, 8);
  }
  toTexture(g4, scene, 'hazard', 32, 32);
}

/** Pickup sprites. */
function drawPickups(scene: Phaser.Scene): void {
  const mk = (key: string, w: number, h: number, draw: (g: G) => void) => {
    const g = newG(scene);
    draw(g);
    toTexture(g, scene, key, w, h);
  };
  mk('pickupHealth', 20, 20, (g) => {
    px(g, 4, 4, 12, 12, 0x222222);
    px(g, 8, 6, 4, 8, COLORS.health);
    px(g, 6, 8, 8, 4, COLORS.health);
  });
  mk('pickupArmor', 20, 20, (g) => {
    px(g, 4, 4, 12, 12, 0x222222);
    px(g, 5, 5, 10, 4, COLORS.armor);
    px(g, 7, 9, 6, 8, COLORS.armor);
  });
  mk('pickupAmmo', 20, 20, (g) => {
    px(g, 5, 5, 10, 10, 0x222200);
    px(g, 7, 4, 6, 3, COLORS.ammo);
    px(g, 7, 10, 6, 3, COLORS.ammo);
  });
  mk('pickupFuel', 20, 20, (g) => {
    px(g, 6, 4, 8, 12, 0x223333);
    px(g, 8, 6, 4, 8, COLORS.fuel);
  });
  // weapon pickups (use weapon color, box shape)
  const wp: Array<[string, number]> = [
    ['pickupShotgun', COLORS.shotgun],
    ['pickupChaingun', COLORS.chaingun],
    ['pickupPipebomb', COLORS.pipebomb],
    ['pickupRocket', COLORS.rocket],
    ['pickupDevastator', COLORS.devastator],
  ];
  for (const [key, color] of wp) {
    mk(key, 24, 18, (g) => {
      px(g, 0, 6, 20, 6, color);
      px(g, 18, 4, 6, 10, 0x222233);
    });
  }
  // door / exit
  mk('exit', 48, 64, (g) => {
    px(g, 0, 0, 48, 64, 0x1a1a2a);
    px(g, 4, 4, 40, 56, 0x2a2a3a);
    px(g, 6, 8, 36, 4, COLORS.health);
    px(g, 6, 16, 36, 4, COLORS.health);
    px(g, 6, 24, 36, 4, COLORS.health);
  });
  // secret bonus (star)
  mk('secret', 20, 20, (g) => {
    g.fillStyle(COLORS.ammo, 1);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 9 : 4;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push([10 + Math.cos(a) * r, 10 + Math.sin(a) * r]);
    }
    g.fillPoints(pts, true);
  });
}

/** Weapon HUD icons. */
function drawWeaponIcons(scene: Phaser.Scene): void {
  const mk = (key: string, draw: (g: G) => void, w: number, h: number) => {
    const g = newG(scene);
    draw(g);
    toTexture(g, scene, key, w, h);
  };
  mk('iconPistol', (g) => { px(g, 0, 4, 12, 3, COLORS.pistol); px(g, 10, 4, 4, 6, COLORS.pistol); }, 16, 12);
  mk('iconShotgun', (g) => { px(g, 0, 4, 16, 3, COLORS.shotgun); px(g, 14, 3, 6, 5, COLORS.shotgun); }, 22, 12);
  mk('iconChaingun', (g) => { px(g, 0, 3, 14, 5, COLORS.chaingun); px(g, 12, 5, 6, 2, 0x222233); }, 20, 12);
  mk('iconPipebomb', (g) => { px(g, 2, 4, 8, 8, COLORS.pipebomb); px(g, 8, 1, 2, 4, 0x884400); }, 14, 14);
  mk('iconRocket', (g) => { px(g, 0, 4, 14, 4, COLORS.rocket); px(g, 12, 3, 4, 6, 0xff6644); }, 18, 12);
  mk('iconDevastator', (g) => { px(g, 0, 4, 12, 4, COLORS.devastator); px(g, 10, 2, 6, 8, COLORS.devastator); }, 18, 14);
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
