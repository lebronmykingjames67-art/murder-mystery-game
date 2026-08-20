// Core domain types for The Grand Meridian.
// Content (rooms, clues, dialogue, suspects) is authored as data against these
// shapes, so new rooms/suspects/lines can be added without touching engine code.

export type FlagId = string;
export type ClueId = string;
export type SuspectId = string;
export type RoomId = string;
export type FloorId = string;

// ---------------------------------------------------------------------------
// Clues / evidence
// ---------------------------------------------------------------------------

export type ClueCategory = 'physical' | 'testimonial';

export interface Clue {
  id: ClueId;
  name: string;
  category: ClueCategory;
  icon: string; // key into the clue icon registry (art/ClueIcon.tsx)
  shortDescription: string; // one-liner shown on pickup toast + notebook grid
  detail: string; // full notebook entry text
  foundIn: string; // human-readable location, for flavor ("Room 412, victim's desk")
  relatedSuspects?: SuspectId[];
}

export interface Contradiction {
  id: string;
  clueIds: [ClueId, ClueId];
  title: string;
  explanation: string;
  unlocksFlag?: FlagId; // set automatically once both clues are collected
}

// ---------------------------------------------------------------------------
// Suspects & dossiers
// ---------------------------------------------------------------------------

export interface DossierField {
  id: string;
  label: string;
  text: string;
  requiresFlags?: FlagId[];
}

export interface Suspect {
  id: SuspectId;
  name: string;
  alias?: string;
  role: string;
  colorTag: string; // hex accent used for portrait/frame theming
  initials: string;
  bio: string;
  isKiller: boolean;
  dossierFields: DossierField[];
}

// ---------------------------------------------------------------------------
// Dialogue
// ---------------------------------------------------------------------------

export type Speaker = 'suspect' | 'detective' | 'narration';

export interface DialogueLine {
  speaker: Speaker;
  text: string;
}

export interface DialogueVariant {
  id: string;
  requiresFlags?: FlagId[];
  forbidsFlags?: FlagId[];
  requiresClues?: ClueId[];
  lines: DialogueLine[];
  setsFlags?: FlagId[];
  addsClues?: ClueId[];
}

export interface DialogueTopic {
  id: string;
  label: string;
  requiresFlags?: FlagId[];
  forbidsFlags?: FlagId[];
  requiresClues?: ClueId[];
  variants: DialogueVariant[]; // first variant whose conditions pass is used
}

export interface EvidenceEntry {
  clueId: ClueId;
  variants: DialogueVariant[];
}

export interface GreetingVariant {
  requiresFlags?: FlagId[];
  forbidsFlags?: FlagId[];
  lines: DialogueLine[];
  setsFlags?: FlagId[];
}

export interface SuspectDialogue {
  suspectId: SuspectId;
  greetings: GreetingVariant[]; // first match wins; last should be unconditional fallback
  topics: DialogueTopic[];
  evidence: EvidenceEntry[];
  defaultEvidenceReaction: DialogueLine[]; // used when a presented clue has no specific entry
  farewell: string;
  unavailable?: {
    // shown instead of a conversation if requiresFlags below aren't met (e.g. not discovered yet)
    requiresFlags?: FlagId[];
    text: string;
  };
}

// ---------------------------------------------------------------------------
// Rooms / floors / hotspots
// ---------------------------------------------------------------------------

export type HotspotKind = 'clue' | 'npc' | 'flavor' | 'exit' | 'note';

export interface Hotspot {
  id: string;
  label: string;
  x: number; // percentage 0-100 within the room scene
  y: number;
  w: number;
  h: number;
  kind: HotspotKind;
  clueId?: ClueId; // kind: 'clue'
  npcId?: SuspectId; // kind: 'npc'
  flavorText?: string; // kind: 'flavor' | 'note'
  requiresFlags?: FlagId[]; // hotspot hidden until satisfied
  hideAfterFlags?: FlagId[]; // hotspot hidden once satisfied (e.g. clue already taken)
  setsFlags?: FlagId[]; // granted on interaction (in addition to clue pickup)
}

export type RoomKind = 'scene' | 'flavor' | 'locked';
export type RoomArtKey =
  | 'lobby-desk'
  | 'lobby-lounge'
  | 'lobby-entrance'
  | 'security-office'
  | 'bar'
  | 'restaurant'
  | 'function-room'
  | 'guestroom-crime'
  | 'guestroom-neighbor'
  | 'guestroom-plain'
  | 'guestroom-hidden'
  | 'vending-nook'
  | 'laundry'
  | 'housekeeping'
  | 'stairwell'
  | 'maintenance'
  | 'rooftop';

export interface Room {
  id: RoomId;
  floorId: FloorId;
  doorNumber: string; // "412" or "Front Desk"
  name: string;
  kind: RoomKind;
  unlockFlag?: FlagId; // when kind === 'locked', becomes `unlockedKind` once set
  unlockedKind?: RoomKind;
  lockedReason?: string;
  flavorText?: string; // kind: 'flavor'
  description?: string; // kind: 'scene', shown on entry
  art?: RoomArtKey;
  hotspots?: Hotspot[];
}

export interface Floor {
  id: FloorId;
  displayNumber: string; // 'Lobby' | 'M' | '2' ... '5' | 'Roof'
  name: string;
  subtitle?: string;
  rooms: Room[];
  locked?: { reasonText: string; unlockFlag: FlagId };
  ambientChats?: string[]; // elevator small-talk lines usable en route to this floor
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  id: string;
  time: string; // "7:00 PM"
  sortKey: number; // minutes since midnight, for ordering
  title: string;
  description: string;
  requiresFlags?: FlagId[]; // empty/undefined = known from the start
}

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export interface Chapter {
  number: number;
  title: string;
  goalText: string;
  advanceWhenFlags?: FlagId[]; // all required to advance INTO this chapter; chapter 1 has none
}

// ---------------------------------------------------------------------------
// Case solution & accusation
// ---------------------------------------------------------------------------

export interface AccusationOption {
  id: string;
  label: string;
}

export interface CaseSolution {
  killerId: SuspectId;
  weaponId: string;
  motiveId: string;
}

export interface AccusationChoice {
  suspectId: SuspectId;
  weaponId: string;
  motiveId: string;
}

export interface Rebuttal {
  id: string;
  condition: (accused: AccusationChoice, solution: CaseSolution) => boolean;
  priority: number; // higher checked first
  lines: string[];
}
