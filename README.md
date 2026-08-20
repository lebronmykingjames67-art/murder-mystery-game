# The Grand Meridian

A noir hotel murder mystery detective game, playable in the browser. Julian Voss, a wealthy hotel investor, has been found dead in Room 412. The hotel is sealed for the night — nobody in, nobody out. Explore all seven floors of The Grand Meridian, question five suspects, collect evidence into your detective's notebook, and make your final accusation before dawn.

Built as a 2.5D point-and-click investigation game: a central elevator hub, corridor floor plans, clickable room scenes, and branching "present evidence" dialogue — per the design in the original game doc.

## Playing

```bash
npm install
npm run dev
```

Then open the printed local URL. Progress autosaves to `localStorage`, so you can close the tab and pick up later from the main menu's "Continue Investigation."

## How it plays

- **Elevator** is the hub — pick a floor. Some floors are locked until you've made enough progress.
- **Floor plans** show every door on that floor. Most are flavor (knock, nothing there); a handful are real rooms with things to find.
- **Rooms** have clickable hotspots: physical evidence, notes, and people to talk to.
- **Dialogue** is topic-based, Ace-Attorney style: ask suspects about topics, and present evidence from your notebook to get reactions, break alibis, and unlock the truth.
- **Notebook** (top right) has three tabs: **Clues** (with automatic contradiction-flagging once you've collected both sides of a lie), **Suspects** (dossiers that fill in as you learn more), and **Timeline** (the night reconstructed — gaps show as "???" until you find the evidence to fill them).
- **Accusation** is available any time from the Lobby. Name the killer, the weapon, and the motive. Get it wrong and the detective explains why — no permanent fail state, just go back and keep digging.

## Tech stack

- React 19 + TypeScript + Vite
- Zustand for game state, persisted to `localStorage`
- No game engine, no external art assets — rooms and clue icons are generated with stylized inline SVG/CSS so the whole hotel reads as one consistent illustrated world
- All content (rooms, hotspots, clues, dialogue trees, timeline, chapter gating, the case solution) is plain data in `src/data/`, evaluated by a small condition/dialogue engine in `src/engine/` — adding a room or a line of dialogue never requires touching UI code

## Project structure

```
src/
  types/          Core domain types (Clue, Suspect, DialogueTopic, Room, Floor, ...)
  data/            All game content: hotel.ts (map), clues.ts, suspects.ts,
                    timeline.ts, chapters.ts, case.ts (solution + rebuttals),
                    dialogue/ (one file per suspect)
  engine/          Pure functions: flag/clue condition evaluation, dialogue
                    resolution, room lock state
  state/           Zustand store (gameStore.ts) + localStorage persistence
  components/      UI, organized by feature (elevator, floor, room, dialogue,
                    notebook, accusation, intro, layout, art)
  styles/          Hand-written CSS (no framework), one file per feature area
scripts/
  audit.ts         `npm run audit:content` — cross-checks every hand-authored
                    string reference (flags, clue ids, suspect ids, room ids)
                    against what the data actually defines, so a typo in a
                    flag name can't silently break chapter gating or a locked
                    door again
```

## The case

Five suspects, one of them lying about more than the others. The solution (killer, weapon, motive) lives entirely in `src/data/case.ts` — everything else in the dialogue and clue data was written to support that one solution, so if you want to change who did it, that's the file to start from (though dialogue reactions are written suspect-specific, so swapping the killer isn't just a one-line change).

## What's not built

The original design doc's "optional fun extras" — a randomized New-Game+ killer mode, achievements beyond the two shown on the ending screen, a headline ticker — were left out to keep the core mystery (map, cast, evidence, dialogue, notebook, accusation) complete and polished rather than spreading thinner across stretch goals. The stairwell is implemented as a real room with a clue rather than a full secondary traversal route between floors.
