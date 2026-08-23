// Core types for ECHO CHAMBER.
// Content (trigger phrases, room text, Kestrel's dialogue tree) is authored as
// plain data against these shapes — see data/*.ts. The only "AI" here is a
// lightweight keyword matcher (engine/toneEngine.ts); the eeriness is meant to
// come from recontextualizing the player's own words, not from NLP sophistication.

export type ToneTag = 'kind' | 'curious' | 'cold' | 'manipulative';

export type Speaker = 'player' | 'echo';

export interface ChatMessage {
  speaker: Speaker;
  text: string;
  triggerId?: string; // which TriggerPhrase this matched, if speaker === 'player'
}

// A single pre-written thing the player might say to ECHO, and how ECHO answers it.
export interface TriggerPhrase {
  id: string;
  tone: ToneTag;
  // Substrings checked against the normalized (lowercased, punctuation-stripped)
  // player input. Any match counts. Ordered list is checked most-specific-first.
  keywords: string[];
  echoResponse: string;
  // Used verbatim (or lightly reworded) as Kestrel's Room 3 opening line when this
  // was the player's first signature question in Room 1. Optional: purely-flavor
  // triggers (jokes, thanks) don't need a callback.
  kestrelParaphrase?: string;
  // Short human-readable label for Room 2's "thread" puzzle, e.g. "asked about trust".
  threadLabel?: string;
}

export interface TriggerMatch {
  trigger: TriggerPhrase;
  response: string;
}

export interface ToneCounts {
  kind: number;
  curious: number;
  cold: number;
  manipulative: number;
}

export type EchoScreen =
  | 'title'
  | 'room1'
  | 'room2'
  | 'room3'
  | 'room4'
  | 'credits';

export interface Room1PuzzleState {
  foundSymbols: Set<'triangle' | 'circle' | 'square'>;
  keypadEntry: Array<'triangle' | 'circle' | 'square'>;
  solved: boolean;
}

export type KestrelFinalChoice = 'promise' | 'truth' | 'echo-mimic';
