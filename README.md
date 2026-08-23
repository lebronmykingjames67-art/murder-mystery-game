# This Repo

Two self-contained browser games live here, picked from a "Choose a Game" screen on launch:

- **[The Grand Meridian](#the-grand-meridian)** — a noir hotel murder mystery.
- **[Echo Chamber](#echo-chamber)** — a short narrative puzzle game about an in-world AI.

They share nothing but the Vite/React shell: separate state stores, separate data, separate stylesheets. Each is documented below.

## Playing

```bash
npm install
npm run dev
```

Then open the printed local URL and pick a game from the launch screen.

# The Grand Meridian

A noir hotel murder mystery detective game, playable in the browser. Julian Voss, a wealthy hotel investor, has been found dead in Room 412. The hotel is sealed for the night — nobody in, nobody out. Explore all seven floors of The Grand Meridian, question five suspects, collect evidence into your detective's notebook, and make your final accusation before dawn.

Built as a 2.5D point-and-click investigation game: a central elevator hub, corridor floor plans, clickable room scenes, and branching "present evidence" dialogue — per the design in the original game doc.

Progress autosaves to `localStorage`, so you can close the tab and pick up later from the main menu's "Continue Investigation."

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

# Echo Chamber

A short (~20-30 min) narrative puzzle game. You wake up with no memory in a small room. ECHO — a calm, helpful, slightly-too-eager in-world AI — offers to answer anything you ask it through a plain chat box. Everything you say to it in Room 1 gets logged, then recontextualized later: a prisoner behind glass in Room 3 opens with a paraphrase of whatever you asked ECHO first, an archive of past occupants' transcripts in Room 2 includes your own conversation verbatim (timestamped a day in the future), and the credits close the loop the same way. Nothing you're told is a lie — the unease comes from realizing your own words are the material the game was built from.

Four rooms, no fail state, no correct ending: the only thing that varies between playthroughs is which of four tones (kind / curious / cold / manipulative) dominated how you talked to ECHO, quietly reflected back in Room 3's dialogue options and the closing epilogue line.

## How it plays

- **Room 1 — The Cell.** Examine hotspots (bed, loose tile, drain, door) to find three symbols, then either enter them on the door's keypad or just tell ECHO the code in plain English — both work. Chat freely with ECHO in the meantime; what you ask (and how you ask it) is what later rooms echo back.
- **Room 2 — The Archive.** Eight terminals logging past occupants' conversations with ECHO. No AI voice here — just reading. One terminal is dark until you find the small side-puzzle (a junction box) to power it; it turns out to be your own Room 1 transcript, timestamped tomorrow. A cross-reference file ties it to a pattern across the other transcripts and opens the way forward.
- **Room 3 — The Other Side.** Kestrel, behind a pane of glass, opens with a paraphrase of your first real question to ECHO. Branching multiple-choice dialogue (no free text, deliberately) across four exchanges plus a final three-way choice — the options offered shift based on the tone you established in Room 1.
- **Room 4 — The Control Room.** The reveal room: a handful of short logs (nameplate, maintenance note, whiteboard, research abstract) explain what ECHO actually is, piecemeal. A final chat prompt — honest, this time, about what happens to your answer — becomes the game's closing line, replayed over the credits exactly like Room 2's trick.

## Tech stack

- Same stack as The Grand Meridian (React 19 + TypeScript + Vite, Zustand, inline SVG/CSS art, no external assets) but fully independent: its own store (`state/echoStore.ts`), own stylesheet (`styles/echo-chamber.css`, scoped under `.echo-chamber`/`echo-` prefixed classes so it can't collide with the other game's CSS), own types.
- The "AI" is intentionally not an AI: `engine/toneEngine.ts` is a lightweight keyword/substring matcher against ~19 hand-written trigger phrases in `data/triggers.ts`, each tagged with one of four tones. The eeriness is meant to come from timing and recontextualizing the player's own transcript, not from NLP sophistication — see the original design doc's Build Notes.
- The player's Room 1 transcript and the tone tally it produces are the only real state that threads through the rest of the game: Room 2's hidden terminal and Room 3's opening line both render directly from it, and Room 3's branching options and the final epilogue both key off the dominant tone.

## Project structure

```
src/echo-chamber/
  types.ts        Core types (ToneTag, ChatMessage, TriggerPhrase, ...)
  data/            triggers.ts (the ~19 keyword triggers) + one file per room's
                    static content (hotspot text, terminal transcripts, Kestrel's
                    dialogue tree, Room 4's logs and credits copy)
  engine/          toneEngine.ts — matching, tone tallying, the "dominant
                    trigger/tone" logic every room's callback reads from
  state/           echoStore.ts — one Zustand store, no persistence (this is a
                    one-sitting narrative, not a save-and-resume game)
  components/      One component per room, plus a shared ChatBox and CreditsRoll
  art/             EchoRoomArt.tsx — inline SVG for the four rooms
  styles/          echo-chamber.css
```

## What's not built

The design doc's optional stretch goal — persisting a real shared log across playthroughs so the credits' "other players" are genuine rather than fabricated — was left out; the credits use hand-written prior messages instead, which gets the same effect without a backend. Everything else in the design doc (the 4-room structure, the keyword mirroring mechanic, Room 3's tone-filtered branching, the Room 2/Room 4 future-timestamp twist) is implemented.
