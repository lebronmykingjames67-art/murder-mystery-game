# Delivery Rush

This branch auto-deploys to Vercel on every push.

A 3rd-person arcade delivery driving game, playable in the browser. You're a courier dropped into a five-district city with an ever-refilling order board: accept a job, drive to the pickup, hand it off, race the clock to the drop-off, get paid. Money buys faster vehicles and upgrades; Reputation is a one-way unlock track that opens new districts, shortcut routes, and harder contract tiers. Weather, traffic jams, road closures, rush hour, and flash VIP orders keep every shift different.

Built from the [Delivery Rush game design document](.) as a full 3D chase-cam game: low-poly city built from primitives, an arcade vehicle-physics model, a road-graph + A* navigation layer, and a data-driven random-event system — per the doc's own recommended build order and technical architecture.

## Playing

```bash
npm install
npm run dev
```

Then open the printed local URL and click **Start Shift**. Progress (cash, Rep, owned vehicles/upgrades, unlocked districts/routes) autosaves to `localStorage`.

## Controls

| Input | Action |
|---|---|
| W A S D / Arrow keys | Steer / accelerate / brake |
| Space | Handbrake / drift |
| Shift | Boost |
| E | Interact — pick up, deliver, or open the Depot shop when in range |
| Tab | Order Board |
| M | City Map |
| Esc | Pause |

## How it plays

- **Order Board** (Tab) lists 3–5 live jobs; accepting one shows a marker on your minimap and a live route line drawn along the actual road graph. Your cargo capacity (starting at 1) caps how many you can carry at once — a bigger vehicle or Cargo Rig upgrade lets you batch multiple deliveries into one efficient loop.
- **Pickup/drop-off** is a short, lightweight beat: get close, press E, your rider dismounts and jogs to the door while the camera pulls in tighter, then remounts. Fragile/Cold cargo has a condition stat that degrades on hard collisions — deliver it rough and the payout (and eventually the order itself) suffers.
- **Payout** = base pay + a tip that decays the longer you take, with a VIP bonus and a late penalty (floored around 20% of base — a late delivery still pays something). A small bonus rewards juggling multiple concurrent orders.
- **Reputation** is earned per delivery (bonus for on-time, bigger for VIP) and gates the map: four more districts (Old Town, Suburbs, Industrial Docks, Uptown/Financial) sit behind locked connector roads — physically barricaded in the world — that open as your Rep climbs, plus a Rep-gated shortcut alley in Old Town. Check the City Map (M) to see what's unlocked and what's next.
- **The Depot** (the glowing pad at the center of Downtown Core) is your hub: buy and equip one of six vehicle tiers (bicycle → e-bike → scooter → motorbike → car → van) and spend cash on four upgrade slots per vehicle (Engine, Tires, Cargo, Utility).
- **Random events** roll every ~60–95s (plus Rush Hour on a fixed timer): rainstorms, traffic jams, road closures, VIP flash orders, and mystery-box order waves, each modifying navigation, timing, payout, or handling.
- A day/night cycle lights the city over an ~8-minute loop; night drives pay a little more and see a little less.

## Tech stack

- React 19 + TypeScript + Vite for the app shell and UI overlay
- **Three.js** for the 3D world — low-poly primitives only, no external model/texture assets, so the whole city is generated in code
- Zustand as the one-way bridge from the imperative game engine to the React HUD
- All game feel — engine note, pickup/drop-off chimes, the payout "cha-ching" (pitch/volume scaled to payout size), countdown heartbeat, event stings — is synthesized live via the WebAudio API; there are no binary audio assets

## Project structure

Mirrors the GDD's suggested architecture:

```
src/
  core/       GameEngine (orchestrates everything per frame), GameLoop, RoadGraph (node/edge
              graph + A*), ChaseCamera, InputManager, AudioManager, SaveSystem
  entities/   PlayerVehicle (arcade physics), Character (3rd-person rider + dismount beat),
              VehicleMesh (low-poly builder per vehicle tier), TrafficAgent (AI traffic)
  systems/    OrderSystem, PayoutSystem, ReputationSystem, UpgradeSystem, EventManager
              (data-driven GameEvent objects with condition/apply/revert)
  world/      CityBuilder (procedural city geometry from RoadGraph + district data), labels
  data/       vehicles.ts, districts.ts, events.ts, orderPools.ts — all game tuning as data
  state/      gameStore.ts (Zustand store the engine writes into every frame/mutation)
  ui/         HUD, OrderBoard, ShopScreen, MapScreen, Minimap, PauseMenu, StartScreen, Toasts
```

The engine layer (`core/`, `entities/`, `systems/`, `world/`) is plain TypeScript with no React dependency; `App.tsx` mounts a `<canvas>`, constructs `GameEngine` on it, and everything else is a React overlay reading from the Zustand store.

## Scope notes — what's simplified from the full design doc

Built out well past the doc's own MVP cut (§14: one district, no events, flat payouts) but still scoped down in a few places for an AI-authored, single-pass build:

- **World**: all 5 districts are procedurally generated and reachable (not just 1), but they're stitched in a cross layout around the Depot rather than needing to individually hand-place every road; the Night District is a lighting mode (day/night cycle + a modest payout/visibility swing) applied to the existing city rather than a seventh separate map, exactly as the doc itself suggests as a cost-saving option.
- **Random events**: 6 of the 10 listed events are implemented (Rainstorm, Traffic Jam, Road Closure, Rush Hour, VIP Flash Order, Mystery Box), covering all four required effect categories (navigation/timing/payout/handling). Pothole Patch, Bike Thief, Street Festival, and Power Outage are natural follow-ons on the same `EventManager` (condition/apply/revert) pattern.
- **Multi-stop orders**: rather than a single order with several internal stops, "multi-stop" is the emergent result of carrying several concurrent single-stop orders (raised cargo capacity) and choosing your own route between them — with a small payout bonus for juggling more than one at a time. Orders are still flagged `isMultiStop` in the data model for a future dedicated implementation.
- **Upgrade slots**: each vehicle has all four slot types from the doc (Engine, Tires, Cargo, Utility) with 3 levels each, but each slot is a single upgrade path rather than a branching either/or choice.
- **Assets**: everything is low-poly primitives and procedural geometry/audio, per the doc's own guidance that this keeps asset production tractable for an AI-authored codebase — no GLTF models or audio files to source.
