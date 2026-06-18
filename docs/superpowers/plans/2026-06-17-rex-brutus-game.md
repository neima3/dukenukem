# REX BRUTUS: ALIEN APOCALYPSE — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fun, complete, original 2D side-scrolling action shooter (6 levels, 6 weapons, 3 bosses) to `duke.neima.me` via Coolify, all art/audio procedural.

**Architecture:** Phaser 3 + TypeScript + Vite. Static build served by `nginx:alpine`. Scenes for each game phase; entities (player/enemies/bosses) are FSMs; weapons are pooled projectiles; art + audio generated at runtime from code (no external assets). Secrets + localStorage save.

**Tech Stack:** Phaser 3.80, TypeScript (strict), Vite, WebAudio, nginx, Docker, Coolify, GitHub.

---

## File Structure

```
package.json, tsconfig.json, vite.config.ts, Dockerfile, nginx.conf, .gitignore, .env (gitignored)
index.html
public/ (favicon etc)
src/
  main.ts
  config.ts
  scenes/{BootScene,MenuScene,GameScene,HUDScene,CutsceneScene,GameOverScene,VictoryScene}.ts
  entities/Player.ts
  entities/enemies/{LizardTrooper,BrainCrawler,PigBrute,SentryDrone,HeavyGunner}.ts
  entities/enemies/Enemy.ts            (base)
  entities/bosses/{HoverTank,SandWorm,AlienOverlord}.ts
  entities/bosses/Boss.ts              (base)
  weapons/{Weapon,Pistol,Shotgun,Chaingun,PipeBomb,Rocket,Devastator,Projectile}.ts
  systems/{InputSystem,AudioSystem,SaveSystem,ParticleSystem,Spawner,DialogueSystem}.ts
  levels/{levelData,level1..level6}.ts
  art/spriteGen.ts
  audio/{musicGen,sfxGen}.ts
docs/superpowers/{specs,plans}/...
scripts/fetch-secrets.sh
```

---

## Task 1: Project scaffold + Docker + placeholder Coolify deploy

**Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `Dockerfile`, `nginx.conf`, `.gitignore`, `.env.example`

- [ ] `npm create vite` baseline; add `phaser`; TS strict.
- [ ] Minimal `main.ts` booting a single scene that renders "REX BRUTUS" text on a starfield.
- [ ] `Dockerfile` (multi-stage: node build → nginx:alpine serve `dist/`).
- [ ] `nginx.conf` (SPA fallback, cache headers).
- [ ] `.gitignore` (node_modules, dist, .env).
- [ ] Local `npm run build` passes; serve dist locally, confirm visible.
- [ ] Commit.

## Task 2: Boot scene + procedural texture generator + audio system skeleton

**Files:** `src/scenes/BootScene.ts`, `src/art/spriteGen.ts`, `src/systems/AudioSystem.ts`, `src/audio/sfxGen.ts`, `src/audio/musicGen.ts`

- [ ] `spriteGen.ts`: functions to draw player, each enemy, each weapon pickup, tiles, bullets, pickups into Phaser textures via `Graphics`/`CanvasTexture`.
- [ ] `BootScene`: generate all textures, then start Menu.
- [ ] `AudioSystem`: WebAudio master gain, mute, resume on first input, SFX + music buses.
- [ ] `sfxGen.ts`/`musicGen.ts`: synth functions (shoot, explosion, hurt, pickup; per-level loops).
- [ ] Commit.

## Task 3: Menu + Save system + Input system

**Files:** `src/scenes/MenuScene.ts`, `src/systems/SaveSystem.ts`, `src/systems/InputSystem.ts`, `src/config.ts`

- [ ] `config.ts`: tuning constants (gravity, speeds, HP, damage, level registry).
- [ ] `SaveSystem`: get/set progress + highscore in localStorage.
- [ ] `InputSystem`: keyboard + mouse state, paused handling.
- [ ] `MenuScene`: title, Start, Continue (if save), controls help, audio toggle.
- [ ] Commit.

## Task 4: GameScene core + Player + Pistol + one enemy (vertical slice)

**Files:** `src/scenes/GameScene.ts`, `src/entities/Player.ts`, `src/scenes/HUDScene.ts`, `src/weapons/{Weapon,Pistol,Projectile}.ts`, `src/entities/enemies/Enemy.ts`, `src/entities/enemies/LizardTrooper.ts`, `src/levels/levelData.ts`, `src/levels/level1.ts`, `src/systems/{ParticleSystem,Spawner,DialogueSystem}.ts`

- [ ] Tilemap builder from level data; camera follow; parallax bg.
- [ ] `Player`: arcade physics, move/jump/crouch, mouse-aim, fire, health/armor, hit reactions, one-liner hooks.
- [ ] `Weapon` base + `Pistol` + pooled `Projectile`.
- [ `LizardTrooper` FSM: idle→aggro→shoot→dead; drops ammo.
- [ ] `HUDScene`: health/armor/ammo/score/weapon.
- [ ] `ParticleSystem`: muzzle, blood, explosion, sparks.
- [ ] Level 1 playable end-to-end (no boss yet), reach exit → next.
- [ ] Commit.

## Task 5: Full weapon set

**Files:** `src/weapons/{Shotgun,Chaingun,PipeBomb,Rocket,Devastator}.ts`, updates to `Player`/`HUDScene`

- [ ] Each weapon with distinct behavior + SFX; weapon-switch hotkeys 1-6; ammo mgmt; pickups grant ammo/unlock.
- [ ] Commit.

## Task 6: Full enemy set

**Files:** enemies `BrainCrawler,PigBrute,SentryDrone,HeavyGunner`

- [ ] Each FSM implemented; pooled; balanced vs config.
- [ ] Commit.

## Task 7: Secrets + Spawner + Dialogue polish

- [ ] Destructible tiles + hidden alcoves; secret counter in HUD/end screen.
- [ ] Spawner waves from level data; one-liners on streaks/pickups/level start.
- [ ] Commit.

## Task 8: Bosses

**Files:** `entities/bosses/{Boss,HoverTank,SandWorm,AlienOverlord}.ts`

- [ ] Each boss FSM + health bar + defeat → level complete.
- [ ] Commit.

## Task 9: Levels 2-6 content + Cutscene/Victory/GameOver

- [ ] Levels 2-6 tilemaps/enemies/pickups/secrets wired; distinct palettes; bosses placed.
- [ ] `CutsceneScene` (between-level quips), `GameOverScene`, `VictoryScene` + stingers.
- [ ] Commit.

## Task 10: Final build, deploy pipeline, Coolify + DNS, verify

- [ ] Push private repo `neima3/dukenukem`.
- [ ] `scripts/fetch-secrets.sh` pulls from 1Password into `.env`.
- [ ] Coolify project + service (Dockerfile build) + domain `duke.neima.me`; verify HTTPS.
- [ ] Smoke test production; fix; done.

---

## Self-Review

- **Spec coverage:** weapons (T5), enemies (T6), bosses (T8), levels 1-6 (T4/T9), save (T3), secrets (T7), procedural art/audio (T2), deploy (T1/T10), controls (T3/T4). HUD T4. Cutscenes T9. ✓
- **Placeholders:** none; tasks name concrete files.
- **Type consistency:** `Weapon`/`Projectile`/`Enemy`/`Boss`/`SaveSystem`/`AudioSystem` names reused consistently.

**Execution mode:** inline (user requested no further questions). Proceeding task-by-task with commits.
