// One-off content consistency audit — not part of the build. Cross-checks every
// hand-authored string reference (flags, clue ids, suspect ids, room ids) so
// typos in string literals (which TypeScript can't catch) surface before they
// silently break chapter gating, dialogue, or hotspots.
import { floors } from '../src/data/hotel';
import { clues, contradictions } from '../src/data/clues';
import { suspects } from '../src/data/suspects';
import { chapters } from '../src/data/chapters';
import { timeline } from '../src/data/timeline';
import { dialogueBySuspect } from '../src/data/dialogue';
import { solution, weaponOptions, motiveOptions } from '../src/data/case';

const problems: string[] = [];
const warn = (msg: string) => problems.push(msg);

const roomIds = new Set<string>();
const allRooms: { id: string; floorId: string; hotspots?: any[]; unlockFlag?: string }[] = [];
for (const floor of floors) {
  for (const room of floor.rooms) {
    if (roomIds.has(room.id)) warn(`Duplicate room id: ${room.id}`);
    roomIds.add(room.id);
    allRooms.push(room as any);
  }
}

const floorIds = new Set(floors.map((f) => f.id));
const clueIds = new Set(clues.map((c) => c.id));
const suspectIds = new Set(suspects.map((s) => s.id));

// Every flag that is ever *set* somewhere by authored content (used to check
// that gates aren't referencing flags nothing ever sets).
const settableFlags = new Set<string>();
for (const n of [1, 2, 3, 4, 5]) settableFlags.add(`chapter_reached_${n}`);
for (const id of roomIds) settableFlags.add(`visited:${id}`);
for (const id of suspectIds) settableFlags.add(`met:${id}`);
for (const id of clueIds) settableFlags.add(`has-clue:${id}`);
for (const c of contradictions) settableFlags.add(`contradiction-seen:${c.id}`);

function collectSetsFlags(list: (string[] | undefined)[]) {
  for (const arr of list) for (const f of arr ?? []) settableFlags.add(f);
}

// Hotspots + rooms
for (const room of allRooms) {
  for (const h of room.hotspots ?? []) {
    if (h.setsFlags) collectSetsFlags([h.setsFlags]);
    if (h.clueId && !clueIds.has(h.clueId)) warn(`Room ${room.id} hotspot ${h.id} references unknown clueId "${h.clueId}"`);
    if (h.npcId && !suspectIds.has(h.npcId)) warn(`Room ${room.id} hotspot ${h.id} references unknown npcId "${h.npcId}"`);
  }
}

// Dialogue: collect sets-flags/adds-clues, and check requires-*/forbids-* later
for (const [suspectId, d] of Object.entries(dialogueBySuspect)) {
  if (!suspectIds.has(suspectId)) warn(`Dialogue file keyed to unknown suspect "${suspectId}"`);
  for (const g of d.greetings) collectSetsFlags([g.setsFlags]);
  for (const t of d.topics) {
    for (const v of t.variants) {
      collectSetsFlags([v.setsFlags]);
      for (const c of v.addsClues ?? []) {
        if (!clueIds.has(c)) warn(`${suspectId} topic "${t.id}" variant "${v.id}" addsClues unknown clue "${c}"`);
      }
    }
  }
  for (const e of d.evidence) {
    if (!clueIds.has(e.clueId)) warn(`${suspectId} evidence entry references unknown clueId "${e.clueId}"`);
    for (const v of e.variants) {
      collectSetsFlags([v.setsFlags]);
      for (const c of v.addsClues ?? []) {
        if (!clueIds.has(c)) warn(`${suspectId} evidence "${e.clueId}" variant "${v.id}" addsClues unknown clue "${c}"`);
      }
    }
  }
}

// Now that all settable flags are known, check every requires/forbids/unlockFlag reference resolves.
function checkFlagRefs(context: string, requires?: string[], forbids?: string[]) {
  for (const f of requires ?? []) {
    if (!settableFlags.has(f) && !f.startsWith('seen:')) warn(`${context} requiresFlags references flag never set: "${f}"`);
  }
  for (const f of forbids ?? []) {
    if (!settableFlags.has(f) && !f.startsWith('seen:')) warn(`${context} forbidsFlags references flag never set: "${f}"`);
  }
}

for (const floor of floors) {
  if (floor.locked && !settableFlags.has(floor.locked.unlockFlag)) {
    warn(`Floor ${floor.id} locked.unlockFlag never set: "${floor.locked.unlockFlag}"`);
  }
}

for (const room of allRooms) {
  if (room.unlockFlag && !settableFlags.has(room.unlockFlag)) {
    warn(`Room ${room.id} unlockFlag never set: "${room.unlockFlag}"`);
  }
  for (const h of room.hotspots ?? []) {
    checkFlagRefs(`Room ${room.id} hotspot ${h.id}`, h.requiresFlags, h.hideAfterFlags);
  }
}

for (const c of chapters) {
  checkFlagRefs(`Chapter ${c.number}`, c.advanceWhenFlags);
}

for (const t of timeline) {
  checkFlagRefs(`Timeline "${t.id}"`, t.requiresFlags);
}

for (const [suspectId, d] of Object.entries(dialogueBySuspect)) {
  for (const g of d.greetings) checkFlagRefs(`${suspectId} greeting`, g.requiresFlags, g.forbidsFlags);
  for (const t of d.topics) {
    checkFlagRefs(`${suspectId} topic "${t.id}"`, t.requiresFlags, t.forbidsFlags);
    for (const c of t.requiresClues ?? []) if (!clueIds.has(c)) warn(`${suspectId} topic "${t.id}" requiresClues unknown clue "${c}"`);
    for (const v of t.variants) {
      checkFlagRefs(`${suspectId} topic "${t.id}" variant "${v.id}"`, v.requiresFlags, v.forbidsFlags);
      for (const c of v.requiresClues ?? []) if (!clueIds.has(c)) warn(`${suspectId} topic "${t.id}" variant "${v.id}" requiresClues unknown clue "${c}"`);
    }
  }
  for (const e of d.evidence) {
    for (const v of e.variants) {
      checkFlagRefs(`${suspectId} evidence "${e.clueId}" variant "${v.id}"`, v.requiresFlags, v.forbidsFlags);
      for (const c of v.requiresClues ?? []) if (!clueIds.has(c)) warn(`${suspectId} evidence "${e.clueId}" variant "${v.id}" requiresClues unknown clue "${c}"`);
    }
  }
}

// Contradictions
for (const c of contradictions) {
  for (const id of c.clueIds) if (!clueIds.has(id)) warn(`Contradiction "${c.id}" references unknown clue "${id}"`);
}

// Case solution / accusation options
if (!suspectIds.has(solution.killerId)) warn(`case.ts solution.killerId "${solution.killerId}" is not a known suspect`);
if (!weaponOptions.some((w) => w.id === solution.weaponId)) warn(`case.ts solution.weaponId "${solution.weaponId}" not in weaponOptions`);
if (!motiveOptions.some((m) => m.id === solution.motiveId)) warn(`case.ts solution.motiveId "${solution.motiveId}" not in motiveOptions`);
const killerSuspect = suspects.find((s) => s.id === solution.killerId);
if (!killerSuspect?.isKiller) warn(`Suspect "${solution.killerId}" is the case solution but isKiller is not true`);
for (const s of suspects) {
  if (s.isKiller && s.id !== solution.killerId) warn(`Suspect "${s.id}" has isKiller=true but is not case.ts's solution.killerId`);
}

// Every suspect should have a dialogue file
for (const s of suspects) {
  if (!dialogueBySuspect[s.id]) warn(`Suspect "${s.id}" has no dialogue entry`);
}

// Every suspect should be reachable via at least one npc hotspot
const reachableSuspects = new Set<string>();
for (const room of allRooms) for (const h of room.hotspots ?? []) if (h.npcId) reachableSuspects.add(h.npcId);
for (const s of suspects) if (!reachableSuspects.has(s.id)) warn(`Suspect "${s.id}" has no npc hotspot anywhere — unreachable`);

// Every clue should be reachable: either a hotspot clueId, or dialogue addsClues
const reachableClues = new Set<string>();
for (const room of allRooms) for (const h of room.hotspots ?? []) if (h.clueId) reachableClues.add(h.clueId);
for (const d of Object.values(dialogueBySuspect)) {
  for (const t of d.topics) for (const v of t.variants) for (const c of v.addsClues ?? []) reachableClues.add(c);
  for (const e of d.evidence) for (const v of e.variants) for (const c of v.addsClues ?? []) reachableClues.add(c);
}
for (const c of clues) if (!reachableClues.has(c.id)) warn(`Clue "${c.id}" is never granted by any hotspot or dialogue — unreachable`);

// floorId sanity
for (const room of allRooms) {
  const r = room as any;
  if (!floorIds.has(r.floorId)) warn(`Room ${room.id} has unknown floorId "${r.floorId}"`);
}

// dossier field flag refs
for (const s of suspects) {
  for (const f of s.dossierFields) checkFlagRefs(`Suspect ${s.id} dossier field "${f.id}"`, f.requiresFlags);
}

console.log(`Checked ${allRooms.length} rooms, ${clues.length} clues, ${suspects.length} suspects, ${chapters.length} chapters, ${timeline.length} timeline entries.`);
if (problems.length === 0) {
  console.log('AUDIT CLEAN — no reference problems found.');
} else {
  console.log(`AUDIT FOUND ${problems.length} PROBLEM(S):`);
  for (const p of problems) console.log(' - ' + p);
  process.exitCode = 1;
}
