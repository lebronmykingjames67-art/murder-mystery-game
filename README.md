# AFTERIMAGE

A first-person roguelite prototype: every death leaves a ghost of you behind, built from how you actually played. Full concept and the phased build plan live in [`DESIGN.md`](./DESIGN.md).

This is **Phase 1 — Movement** (see `DESIGN.md` Section 19): one grey test room and the full movement kit, no combat yet. Movement is the foundation everything else is built on, so it's the only thing in scope here.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL and click the start screen to lock the mouse.

## What's in Phase 1

- Pointer-lock first-person controls (walk, sprint, jump, dash, slide, bunny-hop) tuned to the exact numbers in `DESIGN.md` Section 6
- One ~84×84 grey test room: a 9-step staircase, three jump gaps of increasing width, a low tunnel that only a slide fits under, four pillars to strafe around, and a raised platform reachable only by jumping and dashing mid-air
- Hand-written capsule-vs-AABB collision on a fixed 60Hz timestep, resolved one axis at a time (`src/player/collision.js`)
- Black-background, cyan-wireframe art direction (`DESIGN.md` Section 14)
- A dev overlay (press <kbd>\`</kbd>) with live FPS/speed/grounded/dash-cooldown readouts and sliders bound directly to every value in `config.js`, so movement can be retuned without restarting

No enemies, no shooting, no HUD beyond the dev overlay — those start in Phase 2.

## Project structure

```
src/
  main.js            entry point: renderer/scene setup, pointer lock, input, the fixed-timestep loop
  config.js           every tuning number from DESIGN.md Section 6
  player/
    controller.js    movement, dash, slide, bunny-hop, jump (coyote time + jump buffer)
    camera.js         FOV kick, strafe roll, head bob, eye-height easing, a screen-shake hook
    collision.js      capsule vs axis-aligned box sweep, resolved one axis at a time
  level/
    testRoom.js       the Phase 1 test room geometry + its collider list
  ui/
    devOverlay.js      backtick-toggled stats + live config sliders
```

`weapons/`, `enemies/`, `ghosts/`, and `audio/` (per `DESIGN.md` Section 18's module layout) land in later phases.

## Tuning

Every number in `src/config.js` is live-editable from the dev overlay while playing. If something feels off, tune it there first, then port the value back into `config.js` once it feels right.

## Tech

Vite + vanilla JavaScript (no framework) + [three.js](https://threejs.org/). No build step beyond Vite; no game engine.
