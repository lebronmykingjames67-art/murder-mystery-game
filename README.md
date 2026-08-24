# Hollow Signal

A first-person psychological horror game, playable in the browser. Mara Voss, a night-shift radio technician, is sent to restart a decommissioned relay station after it goes dark mid-broadcast. The station has one rule, posted on every wall: *never answer the second voice.*

Built as a genuinely first-person 3D game — WASD + mouse-look, a handheld flashlight as the primary light source, and raycast interaction with the world. No map, no minimap, no top-down anything: everything you know about the station comes from having walked it.

## Playing

```bash
npm install
npm run dev
```

Then open the printed local URL, click **New Broadcast**, and click the canvas to lock your mouse.

- **WASD** — move
- **Mouse** — look
- **F** — toggle flashlight
- **E** / left-click (when unlocked) — interact
- **C** / Ctrl — crouch
- **1 / 2 / 3** — choose during a radio transmission
- **Esc** — release the mouse (click the canvas again to resume)

Progress autosaves to `localStorage` at the start of each Act, so "Continue" on the main menu picks up where you left off.

## The central mechanic

At scripted points, the radio picks up two overlapping transmissions — the real one (Command, or a survivor) and a mimic that has learned to sound like people Mara loves. Each time, you choose to **Answer**, **Stay Silent**, or (once you've found the tuning key in Act 1) **Switch Frequency**. This happens nine times across the five Acts, escalating in ambiguity as it gets harder to tell which voice is real.

Every choice moves the Static Meter — never shown as a literal bar, only felt: how badly lights flicker, how much the subtitle text glitches, how loud the dread bed underneath everything gets. How you answer, and how many of the six pages hidden around the station you find, decides which of three endings you get.

## Tech stack

- **Three.js** for the 3D scene, rendered to a single WebGL canvas with `PointerLockControls` for movement/look
- **Web Audio API**, entirely procedural — no audio files. Static is filtered white noise; the "voices" are stylized formant-ish murmurs (detuned oscillators + a syllable envelope) pitched and warbled differently per speaker, panned with raw `PannerNode`s so they get louder as you physically approach their source; a separate dread-bed drone and heartbeat react to the Static Meter
- **EffectComposer** with a small custom shader (chromatic aberration, scanlines, grain, slice-glitch) that scales with corruption — the game's only "UI" for how far gone you are
- TypeScript, Vite, no UI framework — DOM overlays for the radio/logbook/menu are plain, hand-built elements, kept deliberately separate from the WebGL layer
- `localStorage` for save/continue

No external art or audio assets: rooms are low-poly blockouts (boxes, planes, primitives) built from a small shared toolkit, and paper/note textures are drawn to `<canvas>` at runtime.

## Project structure

```
src/
  main.ts            Bootstraps renderer/camera/systems, owns the render loop
  types.ts            Shared content types (dialogue, pages, endings)
  engine/
    GameState.ts       Static Meter, flags, choice counts, save/load
    Input.ts            Keyboard state
    SceneManager.ts      Swaps whole Acts, wires colliders/interactables/spawn into the player
  player/
    PlayerController.ts  PointerLockControls wrapper: movement, crouch, hide, head-bob
    Collision.ts          Circle-vs-AABB resolution against a list of collider sources
    Flashlight.ts          Camera-mounted SpotLight + held prop mesh
    Interaction.ts          Center-screen raycast against tagged interactable objects
  audio/
    AudioEngine.ts         Procedural static, voice murmur synthesis, dread bed, heartbeat
  ui/
    Overlay.ts, RadioUI.ts, Logbook.ts, MainMenu.ts, PostFX.ts
  scenes/
    RoomBuilder.ts          Shared primitives: walls-with-openings, doors, props, readables
    StationInterior.ts       The recurring foyer/hallway/radio room/archive/basement floor plan
    Act1.ts .. Act5.ts        Each Act's unique geometry + wiring
    Manifestation.ts          The Act 3 patrol/detection entity
    sceneUtils.ts             Shared radio-event and logbook-page helpers
  data/
    dialogue.ts             All nine Second Voice events, in full
    pages.ts                 Story pages + the six hidden collectible pages
    endings.ts               The three endings and the threshold logic that picks one
```

## The five Acts

1. **Arrival** — restore power, find the radio room, take the first call.
2. **Signal** — the station's archive reveals this has happened before; repair the tower antenna outside.
3. **Descent** — Cobb's body, his logbook, and a presence that patrols the basement in the dark.
4. **Choice** — the station degrades badly; the hardest Second Voice choice decides your ending path.
5. **Signoff** — one of three endings, decided by how much you answered and what you found.

## Endings

- **Clear Sky** — static meter held high, rarely answered: Mara leaves, the station goes dark for good.
- **Answered** — static meter low, answered often: the boundary between Mara and the voice dissolves.
- **The Real Frequency** (secret) — find all six hidden logbook pages to unlock the true ending: the phenomenon was a wartime experiment in transmitting grief, and destroying the tower ends the cycle at the cost of ever hearing Delphine again.

## What's not built

The design doc's stretch goals — Mara's visible hands/arms beyond the flashlight prop, fully continuous non-Euclidean corridors (Act 3's twist is a single scripted reconnection rather than a general system), and voice lines as real recorded/TTS audio rather than stylized procedural murmur — were left out to keep the core loop (walk, look, listen, choose) complete across all five Acts rather than spreading thinner. The Static Meter's exact ending thresholds are a simple, documented cutoff (`src/data/endings.ts`) rather than a tuned curve.
