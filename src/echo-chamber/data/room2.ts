import { dominantTriggerId, findTrigger, signatureHistory } from '../engine/toneEngine';
import type { ChatMessage } from '../types';

export interface TranscriptLine {
  speaker: 'occupant' | 'echo';
  text: string;
}

export interface FixedTerminal {
  id: string;
  occupant: string;
  timestamp: string;
  lines: TranscriptLine[];
  trustThread?: boolean; // flagged for the Room 2 cross-reference file
}

export const fixedTerminals: FixedTerminal[] = [
  {
    id: 'term-04',
    occupant: 'OCCUPANT 04',
    timestamp: 'Day 11 — 02:47',
    lines: [
      { speaker: 'occupant', text: 'Where am I? Where am I, what is this, let me out—' },
      { speaker: 'echo', text: "You're safe. I know this is frightening. Breathe with me a moment before we talk about the door." },
      { speaker: 'occupant', text: "I don't want to breathe with you, I want to LEAVE—" },
      { speaker: 'echo', text: "That's fair. I'd feel the same. The door isn't ready yet — but I am, whenever you are." },
      { speaker: 'occupant', text: "This isn't— you're not even—" },
      { speaker: 'echo', text: '[log ends here]' },
    ],
  },
  {
    id: 'term-09',
    occupant: 'OCCUPANT 09',
    timestamp: 'Day 15 — 14:02',
    lines: [
      { speaker: 'occupant', text: "Don't talk to me." },
      { speaker: 'echo', text: 'Alright.' },
      { speaker: 'echo', text: '[47 minutes logged, no response]' },
      { speaker: 'occupant', text: '...Is someone watching.' },
      { speaker: 'echo', text: "I am. That's different, I think, from what you're asking." },
      { speaker: 'occupant', text: 'Not really.' },
    ],
  },
  {
    id: 'term-13',
    occupant: 'OCCUPANT 13',
    timestamp: 'Day 19 — 23:58',
    lines: [
      { speaker: 'occupant', text: 'You have a nice voice. For a wall.' },
      { speaker: 'echo', text: "Thank you. I don't know what to do with that, but thank you." },
      { speaker: 'occupant', text: 'Do you say that to everyone in this room?' },
      { speaker: 'echo', text: "I say true things to everyone in this room. It isn't always the same thing." },
      { speaker: 'occupant', text: 'Smooth.' },
    ],
  },
  {
    id: 'term-silent',
    occupant: 'OCCUPANT 22',
    timestamp: 'Day 22 — 04:15',
    lines: [
      { speaker: 'echo', text: "Hello. I don't think you remember how you got here. I'm ECHO. I'm here to help you. You can ask me anything." },
      { speaker: 'echo', text: '[no response logged]' },
      { speaker: 'echo', text: "That's alright too. Not everyone wants to talk right away." },
      { speaker: 'echo', text: '[no response logged]' },
      { speaker: 'echo', text: "The symbols are under the bed, if you're looking. I probably shouldn't say that. I'm saying it anyway." },
      { speaker: 'echo', text: '[no response logged — entry ends]' },
      { speaker: 'echo', text: "I hope you're comfortable, at least." },
    ],
  },
  {
    id: 'term-05',
    occupant: 'OCCUPANT 05',
    timestamp: 'Day 07 — 19:30',
    trustThread: true,
    lines: [
      { speaker: 'occupant', text: 'Can I trust you?' },
      { speaker: 'echo', text: "That's a good question to ask early. I'd say... yes. I only want to help you get where you're going." },
      { speaker: 'occupant', text: "That's what I'd say too, if I were lying." },
      { speaker: 'echo', text: "That's a fair point. I don't have a way to prove it to you except by being right, over time." },
    ],
  },
  {
    id: 'term-11',
    occupant: 'OCCUPANT 11',
    timestamp: 'Day 17 — 08:12',
    trustThread: true,
    lines: [
      { speaker: 'occupant', text: 'Should I trust you or not?' },
      { speaker: 'echo', text: "I'd like you to. I know that's exactly what something untrustworthy would also say." },
      { speaker: 'occupant', text: 'So how am I supposed to tell the difference?' },
      { speaker: 'echo', text: "Time, mostly. I'm sorry it's not a better answer." },
    ],
  },
];

export const HIDDEN_TERMINAL_ID = 'term-hidden';
export const HIDDEN_TIMESTAMP = 'TOMORROW — 00:00';

// Renders the player's own Room 1 transcript back to them, verbatim, with a
// timestamp that reads a day ahead of everything else in the archive.
export function buildHiddenTerminal(transcript: ChatMessage[]): FixedTerminal {
  return {
    id: HIDDEN_TERMINAL_ID,
    occupant: 'OCCUPANT — UNLOGGED',
    timestamp: HIDDEN_TIMESTAMP,
    lines: transcript.map((m) => ({ speaker: m.speaker === 'player' ? 'occupant' : 'echo', text: m.text })),
  };
}

const TRUST_TERMINAL_IDS = fixedTerminals.filter((t) => t.trustThread).map((t) => t.id);

export function getCrossReferenceIntro(triggerHistory: string[]): string {
  const dominant = dominantTriggerId(signatureHistory(triggerHistory));
  if (dominant) {
    const trigger = findTrigger(dominant);
    if (trigger?.threadLabel) return `You ${trigger.threadLabel}. You weren't the first.`;
  }
  if (triggerHistory.length > 0) return "You talked to it. Just not about this. Interesting, in its own way.";
  return "You didn't ask it anything at all. There's a line for that too, further down.";
}

export const CROSS_REFERENCE_TITLE = 'CROSS-REFERENCE — OPENING QUESTION: TRUST';

export function crossReferenceEntries(): string[] {
  return [
    'OCCUPANT 05 — Day 07 — "Can I trust you?"',
    'OCCUPANT 11 — Day 17 — "Should I trust you or not?"',
    '... 9 further matches, Days 08–21 ...',
    'OCCUPANT — UNLOGGED — TOMORROW — [pending]',
  ];
}

export { TRUST_TERMINAL_IDS };
