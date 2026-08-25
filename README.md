# ONE MORE FLOOR

A first-person 3D risk/reward game, playable in the browser. You climb a mysterious building
one procedurally generated floor at a time. Every floor completed adds to your run's earnings.
After each floor you choose: **cash out** and bank what you've earned, or **risk it** and ride
the elevator to the next, harder floor — where dying loses everything from that run.

There is no map, no top-down view, no menu-driven combat. You walk the halls in first person,
you find the elevator with your own eyes, and the risk/cash-out decision is the only real menu
in the game.

## Playing

```bash
npm install
npm run dev
```

Then open the printed local URL, click **PLAY**, and click into the window to lock your mouse.

- **WASD** — move
- **Mouse** — look
- **Shift** — sprint (drains stamina)
- **Space** — jump
- **E** / left click — interact with whatever's under the crosshair
- **Esc** — pause

## How it plays

- The **lobby** is a physical 3D space — walk up to the elevator to start a run, or to the
  upgrade/cosmetic/stats kiosks to spend bank money or check your record.
- Each **floor** is procedurally generated (a graph of corridors and rooms, always with a valid
  path from spawn to elevator) and belongs to one of five types that rotate as you go deeper:
  - **Chase** — something is hunting you; find the elevator, use noise and hiding spots to
    survive.
  - **Puzzle** — activate three (or four) panels scattered through the floor in the order a
    note elsewhere tells you.
  - **Loot** — a timer, cash scattered everywhere, and the best of it in the riskiest rooms.
  - **Darkness** — no enemy, just failing lights and bad visibility to navigate through.
  - **Chaos** — short, unpredictable events (blackouts, speed changes, surprise rewards) on an
    irregular clock.
- Reach the elevator, and it locks the run's decision in front of you: **CASH OUT** (bank
  everything, return to the lobby) or **RISK IT** (ride to the next floor — die and the run's
  earnings are gone, but bank money and progression are always safe).

## Tech stack

- React 19 + TypeScript + Vite for the shell/UI
- **three.js**, driven imperatively (not React-Three-Fiber) — the game loop, collision and
  rendering all live outside React's render cycle; React only draws the HUD/menus on top of the
  canvas by reading from a Zustand store the engine updates
- Zustand for state that the UI needs to react to (health/stamina, run money, bank, upgrades,
  screen/modal state), persisted to `localStorage` — run money is deliberately never persisted,
  so a run is always genuinely at risk
- No external art or audio assets: geometry is built from a handful of shared primitives with
  canvas-generated speckle textures, and every sound (footsteps, doors, alarms, the ambient
  music bed) is synthesized at runtime with the WebAudio API

## Project structure

```
src/
  core/         GameManager (top-level screen/state orchestration), RunManager, SaveSystem,
                AudioManager, InputManager, HealthSystem, StaminaSystem, DifficultyManager
  engine/       GameApp (renderer + main loop), PlayerController, FirstPersonCamera,
                CollisionWorld, InteractionSystem
  world/        FloorGenerator (procedural layout), FloorBuilder (layout -> geometry),
                Lobby, Elevator, Door, LightingRig, Materials, Props, Signage, Pathfinding
  floors/       FloorType interface + ChaseFloor/PuzzleFloor/LootFloor/DarknessFloor/
                ChaosFloor, each owning its own objective and content placement
  ai/           EnemyAI (patrol/investigate/search/chase/lost state machine)
  systems/      UpgradeSystem, CosmeticSystem (data + effect definitions)
  state/        The Zustand store
  ui/           React HUD and menu components
```

## Adding a new floor type

Implement the `FloorType` interface (`src/floors/FloorType.ts`) — what rooms to request from
the generator, what to place in them, and what happens each frame — and register it in
`src/floors/registry.ts`. Nothing else needs to change; `FloorManager` and the risk/reward loop
are entirely floor-type-agnostic.

## What's not built

Multiplayer, a minimap/overlay map (deliberately — the brief is no-map-as-navigation), and the
"future floor types" called out in the design brief (Flooded, Security, Laser, Zero-Gravity,
Mirror, Speed, Boss, Giant Warehouse) are left for later; the architecture is built so each is
just one more file implementing `FloorType`.
