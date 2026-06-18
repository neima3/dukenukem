# REX BRUTUS: ALIEN APOCALYPSE — Game Design Spec

**Date:** 2026-06-17
**Status:** Approved
**Owner:** neima3

## 1. Summary

A 2D side-scrolling action shooter inspired by the early-90s MS-DOS shooter
genre. A sunglasses-wearing, muscle-bound action hero (**Rex Brutus**) fights an
alien invasion across 6 levels, quipping one-liners and wielding an escalating
arsenal. All art, code, and audio are 100% original and procedurally generated —
no external or copyrighted assets are used. The product is original IP; the
private deployment subdomain `duke.neima.me` is the owner's choice.

This is **not** a reproduction of any existing game. It is a new game in the same
genre, with original characters, level designs, enemy designs, art, and audio.

## 2. Goals & Non-Goals

**Goals**
- Genuinely fun, replayable browser game playable in one click (no install).
- Polished retro feel: pixel art, chiptune, screen shake, particles, one-liners.
- 6-level campaign with 3 bosses, 6 weapons, secrets, save progress.
- Trivially deployable as a static site to Coolify.

**Non-Goals (this release)**
- Multiplayer / online leaderboards (local high score only).
- Mobile-native builds (responsive touch controls are best-effort).
- Localization beyond English.
- External asset packs (everything is procedural/original).

## 3. Tech Stack

- **Engine:** Phaser 3.80 (2D game engine: physics, sprites, tilemaps, audio, input)
- **Language:** TypeScript (strict)
- **Bundler:** Vite (fast dev server + optimized static build)
- **Art:** Procedurally generated sprites, drawn to Phaser textures at boot via
  Graphics/CanvasTexture. No external image assets.
- **Audio:** WebAudio API — synthesized chiptune music + SFX. No external audio.
- **Runtime target:** Modern evergreen browsers (Chrome/Firefox/Safari/Edge),
  desktop primary.
- **Deploy:** Static `dist/` served by `nginx:alpine` in Docker, on Coolify.

## 4. Architecture

```
src/
  main.ts                # Phaser game bootstrap, scene registration
  config.ts              # Game constants (physics, sizes, tuning)
  scenes/
    BootScene.ts         # create procedural textures, init audio
    PreloadScene.ts      # (reserved; procedural assets need little preload)
    MenuScene.ts         # title, start, continue, options
    GameScene.ts         # core per-level gameplay loop
    HUDScene.ts          # health/armor/ammo/score/weapon overlay
    CutsceneScene.ts     # between-level dialogue/one-liners
    GameOverScene.ts
    VictoryScene.ts
  entities/
    Player.ts            # movement, weapons, health, input mapping
    enemies/
      LizardTrooper.ts   # basic ranged grunt
      BrainCrawler.ts    # ceiling/wall melee ambush
      PigBrute.ts        # tanky shotgun melee
      SentryDrone.ts     # flying, swooping
      HeavyGunner.ts     # hitscan suppressor
    bosses/
      HoverTank.ts       # level 1 boss
      SandWorm.ts        # level 4 boss
      AlienOverlord.ts   # final, multi-phase
  weapons/
    Weapon.ts            # base class
    Pistol.ts Shotgun.ts Chaingun.ts PipeBomb.ts Rocket.ts Devastator.ts
    Projectile.ts        # pooled bullets/rockets
  systems/
    InputSystem.ts
    AudioSystem.ts       # wraps WebAudio synth + music sequencer
    SaveSystem.ts        # localStorage: progress + high score
    ParticleSystem.ts    # blood, sparks, explosions, muzzle flash
    Spawner.ts           # wave/spawn direction from level data
    DialogueSystem.ts    # one-liners + cutscene text
  levels/
    levelData.ts         # registry + metadata
    level1.ts ... level6.ts   # tilemap, spawns, secrets, pickups, boss
  art/
    spriteGen.ts         # all procedural sprite drawing functions
  audio/
    musicGen.ts          # chiptune patterns per level + victory/gameover
    sfxGen.ts            # shoot/explosion/hurt/pickup/quips
```

### Data flow
- `GameScene` loads a `LevelData` object → builds tilemap, spawns enemies/pickups,
  wires triggers and the boss.
- `Player` owns current `Weapon`; weapons emit `Projectile`s via a pool.
- Enemies are simple FSMs (idle/aggro/attack/dead); they read player position.
- `HUDScene` reads game state every frame; `SaveSystem` persists on level
  complete and death.
- `AudioSystem` is a singleton over WebAudio; `DialogueSystem` triggers one-liner
  SFX on kill streaks / pickups / level start.

## 5. Gameplay Design

### Player
- Move (left/right), jump, crouch, aim with mouse, shoot, switch weapon (1-6),
  reload, interact (E), throw pipe bomb + detonate.
- Health (0-100), Armor (0-100, absorbs fraction of damage).
- Temporary jetpack (fuel pickup) for rooftop level.
- Brief invulnerability + knockback on hit; screen shake on big hits.

### Weapons
| # | Weapon | Ammo | Behavior |
|---|--------|------|----------|
| 1 | Pistol | ∞ | Default, single-shot, medium RoF, always available |
| 2 | Shotgun | shells | Spread of pellets, high burst, short range |
| 3 | Chaingun | bullets | Very high RoF, spread, sustained |
| 4 | Pipe Bomb | bombs | Thrown, remote-detonated, AoE |
| 5 | Rocket | rockets | Direct-fire explosive, AoE |
| 6 | Devastator | cells | Rapid micro-rockets, endgame |

### Enemies
- **LizardTrooper** — ranged grunt, low HP, drops ammo.
- **BrainCrawler** — wall/ceiling ambusher, melee.
- **PigBrute** — tanky, shotgun burst, closes distance.
- **SentryDrone** — flying, swooping, spawns in waves.
- **HeavyGunner** — suppressive hitscan, forces movement.

### Bosses
- **HoverTank (L1)** — frontal cannon + missiles; weak vent on underside.
- **SandWorm (L4)** — emerges from floor, segment damage, spits acid.
- **Alien Overlord (L6)** — 3 phases: grounded → flight → overload; multiple
  attack patterns.

### Pickups
- Medkit (+health), Armor vest, Ammo crates (per weapon), Weapon pickup (unlocks),
  Jetpack fuel, Secret bonus (score).

### Secrets
- Destructible walls (subtle texture difference) and hidden alcoves with
  weapon/ammo/health caches. Count shown on level-complete screen.

### Progression & save
- Unlocked levels persisted to `localStorage`; Continue resumes highest unlocked.
- High score persisted per level + total.

### Difficulty
- Single "Normal" baseline; damage/HP tuning constants centralized in
  `config.ts` so an Easy/Hard pass is trivial later.

## 6. Levels

1. **Downtown Invasion** — city street tiles, storefronts, broken cars. Teaches
   movement + pistol/shotgun. Boss: HoverTank.
2. **City Sewers** — tight corridors, dark palette, water hazard, BrainCrawlers.
   Introduces chaingun.
3. **Red-Light Rooftops** — vertical scaffolding, neon palette, SentryDrones,
   jetpack section. Introduces pipe bombs.
4. **Desert Approach** — wide dusty expanse, vehicle enemies, long sightlines.
   Introduces rockets. Boss: SandWorm.
5. **Alien Base** — claustrophobic metal corridors, traps, PigBrute squads,
   HeavyGunners. Introduces Devastator.
6. **The Mothership** — escalating arena fights, mid-boss rush, final boss
   Alien Overlord (3 phases). Victory cutscene + score.

Each level: 3-6 minutes typical, distinct palette/tileset, ≥1 secret, ≥1 new
enemy or weapon beat, ends on boss or cutscene.

## 7. Art Direction (all procedural)

- Chunky 16-bit pixel look; small base sprites scaled up with `ROUND_ZERO`
  texture filtering for crisp pixels.
- Parallax backgrounds (2-3 layers per level), palette-coded.
- Particle systems: muzzle flash, blood, sparks, smoke, explosions, debris.
- Effects: screen shake, hit flash, damage vignette, combo popups.

## 8. Audio Direction (all synthesized)

- **Music:** per-level chiptune loop (square/triangle/saw + noise via WebAudio),
  distinct tempo/key per level; victory & game-over stingers.
- **SFX:** shoot (per weapon), explosion, enemy hit/death, player hurt, pickup,
  jump, reload, one-liner vocoder-ish blips (no real voice).
- Mute toggle + volume in options; respects autoplay policies (unlocks on first
  input).

## 9. Controls

| Action | Binding |
|--------|---------|
| Move | A/D or ←/→ |
| Jump | Space or W/↑ |
| Crouch | S/↓ |
| Aim | Mouse |
| Shoot | Left mouse |
| Alt-fire / throw | Right mouse |
| Switch weapon | 1-6 or wheel |
| Reload | R |
| Interact / use | E |
| Detonate pipe bombs | Q |
| Pause | Esc or P |

Touch: on-screen D-pad + aim joystick (best-effort, behind a responsive check).

## 10. Deployment

- **Repo:** private GitHub repo `neima3/dukenukem`.
- **Build:** `npm run build` → `dist/` (static).
- **Container:** `Dockerfile` using `nginx:alpine`, copies `dist/` to
  `/usr/share/nginx/html`, exposes port 80. Coolify builds & deploys on push.
- **Domain:** `duke.neima.me` (CNAME to Coolify service in the user's DNS).
- **Secrets:** stored in a gitignored `.env` at repo root; populated from
  1Password via `op`. Includes: `GITHUB_TOKEN`, `COOLIFY_TOKEN`,
  `COOLIFY_BASE_URL`, and any deploy-webhook values. A `scripts/fetch-secrets.sh`
  reads items from 1Password and writes `.env`.

## 11. Testing & Quality

- TypeScript strict; `tsc --noEmit` must pass.
- Vite dev server smoke test per scene.
- Manual playthrough checklist per level (reach exit, boss dies, secret findable,
  save persists).
- Lighthouse pass on the built site (basic perf, since it's static + canvas).
- No test framework mandated; if added, Vitest.

## 12. Originality & Legal Safeguards

- No sprites, tilesets, sounds, music, character names, level layouts, or
  distinctive mechanics copied from any existing game.
- All visual assets are generated at runtime from code authored for this project.
- All audio is synthesized at runtime from code authored for this project.
- In-game branding uses only original names: hero "Rex Brutus", original enemy
  names, original level names. No third-party trademarks appear in the product.
- The deployment subdomain `duke.neima.me` is the owner's private choice; the
  shipped product is original IP.

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Scope (6 levels + 3 bosses) is large | Centralized tuning/config; reuse systems across levels; ship level-by-level so the build is always playable. |
| Procedural art may look rough | Iterate on sprite generators; lean on particles/palette/post-FX for polish. |
| Audio synthesis bugs across browsers | WebAudio init only after first user gesture; feature-detect. |
| Coolify/DNS config blockers | Validate deployment early with a placeholder index page before the full game. |

## 14. Build Order (summary; detailed plan follows)

1. Scaffold Vite + Phaser + TS project; Dockerfile; placeholder deploy to
   Coolify to validate the pipeline end-to-end with a "hello" page.
2. Boot/Menu/Game scenes, procedural texture generator, player + pistol + one
   enemy, basic HUD — vertical slice of Level 1.
3. Weapon set, enemy set, particles, audio system.
4. Levels 1-6 content + bosses.
5. Save system, cutscenes, victory/gameover, polish pass.
6. Final deploy + verification on `duke.neima.me`.
