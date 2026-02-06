# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Robot Survival is a retro browser arcade game built with vanilla JavaScript ES modules, HTML5 Canvas, and Web Audio API. Firebase/Firestore handles the leaderboard backend. There is no build system, bundler, or package manager — files are served directly.

## Running the Project

Serve the project root with any static HTTP server (e.g. `npx serve .`, VS Code Live Server, or Python `http.server`). Open `index.html` for the game, `highscores.html` for the leaderboard.

Firebase credentials live in `js/firebase-secrets.js` (gitignored). The app will not load scores without it.

## Architecture

### Module System

All game systems are **singleton objects** exported as ES modules. The dependency flow is:

```
index.html
  ├── js/game.js (orchestrator — imports everything)
  │     ├── js/config.js (CONFIG constants: world size, player stats, enemy types, etc.)
  │     ├── js/player.js, enemy.js, bullet.js, camera.js
  │     ├── js/particle.js, currency.js, orb.js, teleportfx.js
  │     ├── js/input.js, audio.js, renderer.js, upgrades.js
  │     ├── js/i18n.js (EN/FR localization)
  │     └── js/firebase-config.js → js/firebase-secrets.js
  └── js/attract-mode.js (start screen animation, independent)
```

`highscores.html` loads `js/highscores.js` directly (not through game.js).

### Game Loop & State Machine

`Game.gameLoop()` calls `Game.update()` then `Renderer.render()` at ~60 FPS via `requestAnimationFrame`.

**`Game.state` values:** `menu` → `playing` → `paused` | `upgrade` | `waveAnnouncement` | `deathSequence` | `teleporting` | `revive` | `gameOver`

Each state guards which systems update. The `update()` method early-returns based on state. The renderer draws overlays (pause, upgrade screen, wave announcement) conditionally based on state.

### Rendering Pipeline

All rendering goes through `Renderer` using a single canvas context. The `Camera` module converts world coordinates to screen coordinates with zoom (default 1.25x). Drawing order: floor grid → world boundaries (electric walls) → player → bullets → enemies → currency → orbs → particles → UI overlays.

### Entity Pattern

Enemies, bullets, currency, particles, and orbs are managed as arrays (`Enemy.list[]`, `Bullet.list[]`, etc.) on their singleton modules. Each module has `init()` (reset), `update()` (per-frame logic), and rendering is done by `Renderer`.

### Wave & Difficulty Scaling

Enemy count, health, and speed scale with wave number. A bonus wave system triggers when the player hasn't earned enough upgrades. Enemy types: basic (scout), fast (interceptor), tank (crusher), splitter (shredder).

### Upgrade System (`upgrades.js`)

13+ upgrades with priority-based random selection. Cost increases by 1.4x each time. Upgrades are generated dynamically at selection time — names and descriptions use `i18n.t()` with parameter interpolation for current/next/max values.

### i18n System (`i18n.js`)

- `i18n.t('key', {param: value})` for translated strings with interpolation
- `data-i18n="key"` attributes on HTML elements for static text
- `data-i18n-placeholder="key"` for input placeholders
- `i18n.applyTranslations()` updates all tagged DOM elements
- Language persisted in `localStorage` key `lang`, defaults to `'en'`
- `.lang-toggle` buttons auto-update their label text

### Firebase Integration

Anonymous auth via `getCurrentUser()`. Scores saved to Firestore `highscores` collection with fields: `userId`, `playerName`, `score`, `time`, `kills`, `timestamp`. Rank calculated server-side via `getCountFromServer`.

## Key Conventions

- **No build step** — all imports use bare ES module syntax with explicit `.js` extensions
- **Firebase SDK** loaded from CDN (`https://www.gstatic.com/firebasejs/10.7.1/`)
- **`Game` object** is both exported and set on `window.Game` (used by `Upgrades` which references `Game.lives`, `Game.wave`, etc. without importing)
- **File encoding** — some files have BOM; arrow characters (`→`) may appear as `?` when read in certain encodings. Use Unicode escapes (`\u2192`) in JS strings
- **Comments** are a mix of French and English
- **CONFIG** in `config.js` is the single source of truth for all game balance values

## File Encoding Warning

When editing `upgrades.js` or other files that contained special characters (arrows, emojis), use Unicode escape sequences in JavaScript strings rather than literal characters to avoid encoding corruption.
