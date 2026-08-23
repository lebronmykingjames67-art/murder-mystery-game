import { triggers, containsInOrder } from '../data/triggers';
import type { ChatMessage, ToneCounts, ToneTag, TriggerMatch } from '../types';

// Deliberately not NLP: lowercase, strip punctuation, substring-match against
// ~18 hand-written trigger phrases. The eeriness of the game is meant to come
// from timing and recontextualization of the player's own words, not from
// any sophistication here — see BUILD NOTES in the design doc.

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchTrigger(rawInput: string): TriggerMatch | null {
  const text = normalize(rawInput);
  if (!text) return null;
  for (const trigger of triggers) {
    if (trigger.keywords.some((kw) => text.includes(kw))) {
      return { trigger, response: trigger.echoResponse };
    }
  }
  return null;
}

const CODE_WORDS = ['triangle', 'circle', 'square'] as const;

// Accepts the puzzle code spoken in plain English to ECHO, e.g.
// "the code is triangle, circle, square" — forgiving of extra words, but the
// three symbol names must appear in the correct left-to-right order.
export function matchesSpokenCode(rawInput: string): boolean {
  const text = normalize(rawInput);
  return containsInOrder(text, [...CODE_WORDS]);
}

export const emptyToneCounts: ToneCounts = { kind: 0, curious: 0, cold: 0, manipulative: 0 };

export function addTone(counts: ToneCounts, tone: ToneTag): ToneCounts {
  return { ...counts, [tone]: counts[tone] + 1 };
}

// Ties lean toward the gentler reading first — curious, the default "engaged
// but noncommittal" register, then kind, then the two harsher tones.
const TONE_TIE_PRIORITY: ToneTag[] = ['curious', 'kind', 'cold', 'manipulative'];

export function dominantTone(counts: ToneCounts): ToneTag | null {
  const total = counts.kind + counts.curious + counts.cold + counts.manipulative;
  if (total === 0) return null;
  let best: ToneTag = TONE_TIE_PRIORITY[0];
  for (const tone of TONE_TIE_PRIORITY) {
    if (counts[tone] > counts[best]) best = tone;
  }
  return best;
}

// The tone the player leaned on least — used by Room 3 to quietly withhold
// the one response option they've least earned the right to see.
export function weakestTone(counts: ToneCounts): ToneTag {
  const reversed = [...TONE_TIE_PRIORITY].reverse();
  let worst: ToneTag = reversed[0];
  for (const tone of reversed) {
    if (counts[tone] < counts[worst]) worst = tone;
  }
  return worst;
}

export const TONE_LABEL: Record<ToneTag, string> = {
  kind: 'kind',
  curious: 'curious',
  cold: 'cold',
  manipulative: 'manipulative',
};

const signatureTriggerIds = new Set(triggers.filter((t) => t.kestrelParaphrase).map((t) => t.id));

// The subset of the player's matched-trigger history that Room 2 and Room 3
// are allowed to quote back at them (the ones with a Kestrel paraphrase
// authored). Order preserved, duplicates kept — needed for the frequency count.
export function signatureHistory(triggerHistory: string[]): string[] {
  return triggerHistory.filter((id) => signatureTriggerIds.has(id));
}

// Most-asked signature trigger, ties broken toward whichever was asked first.
// Null means the player never asked ECHO one of the ~13 "signature" questions
// (they may still have chatted — see hasChatted below — just not about those).
export function dominantTriggerId(history: string[]): string | null {
  if (history.length === 0) return null;
  const counts = new Map<string, number>();
  for (const id of history) counts.set(id, (counts.get(id) ?? 0) + 1);
  let best = history[0];
  let bestCount = counts.get(best)!;
  for (const id of history) {
    const c = counts.get(id)!;
    if (c > bestCount) {
      best = id;
      bestCount = c;
    }
  }
  return best;
}

export function findTrigger(id: string) {
  return triggers.find((t) => t.id === id);
}

export function hasChatted(transcript: ChatMessage[]): boolean {
  return transcript.some((m) => m.speaker === 'player');
}

// Room 3's branching options: authored as one option per tone, but the game
// quietly withholds whichever tone the player has least earned — a small,
// legible way for Kestrel's choices to reflect who the player has been so far.
export function filterByWeakestTone<T extends { tone: ToneTag }>(items: T[], counts: ToneCounts): T[] {
  const drop = weakestTone(counts);
  return items.filter((item) => item.tone !== drop);
}
