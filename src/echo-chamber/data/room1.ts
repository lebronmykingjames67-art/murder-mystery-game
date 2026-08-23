import { dominantTriggerId, hasChatted, signatureHistory } from '../engine/toneEngine';
import type { ChatMessage } from '../types';

export const ECHO_OPENING_LINE =
  "Hello. I don't think you remember how you got here — that's normal, don't worry about it. I'm ECHO. I'm here to help you. You can ask me anything.";

export type Room1HotspotId = 'bed' | 'tile' | 'drain' | 'door';

export interface Room1Hotspot {
  id: Room1HotspotId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  symbol?: 'triangle' | 'circle' | 'square';
  flavorBefore: string; // shown before examining
  flavorAfter: string; // shown once examined (reveals the symbol, if any)
}

export const room1Hotspots: Room1Hotspot[] = [
  {
    id: 'bed',
    label: 'The Bed',
    x: 6,
    y: 34,
    w: 26,
    h: 18,
    symbol: 'triangle',
    flavorBefore: 'A thin mattress on a steel frame, bolted to the floor.',
    flavorAfter:
      "Kneeling to look underneath, you find something scratched into the underside of the frame — deliberate, not rust. A triangle, cut deep, like it was the first mark someone made here.",
  },
  {
    id: 'tile',
    label: 'A Loose Tile',
    x: 42,
    y: 50,
    w: 14,
    h: 8,
    symbol: 'circle',
    flavorBefore: 'One floor tile rocks slightly under your foot when you step near it.',
    flavorAfter:
      'Prying it up, you find a symbol scratched into the concrete beneath — a circle, fainter than the first, like whoever made it had settled in a little by the time they carved this one.',
  },
  {
    id: 'drain',
    label: 'The Drain',
    x: 62,
    y: 48,
    w: 12,
    h: 10,
    symbol: 'square',
    flavorBefore: 'A floor drain, old and dry, set into the concrete.',
    flavorAfter:
      "Something pale is worn into the grate — not rust, not mold. Faint marks, half gone: a square, the last of the three. Whoever left it might have run out of time. Or courage.",
  },
  {
    id: 'door',
    label: 'The Door',
    x: 80,
    y: 8,
    w: 16,
    h: 32,
    flavorBefore: 'No handle on this side. A keypad is set into the wall beside the frame.',
    flavorAfter:
      'Three symbols on the keypad are worn smooth from use: a triangle, a circle, a square. Someone has pressed these buttons a great many times before you.',
  },
];

export const room1AmbientBeats: string[] = [
  'Somewhere beyond the door, footsteps pass and do not stop.',
  'The overhead light flickers, holds, flickers again.',
  "The screen's standby light pulses, patient, waiting for you to say something.",
  'A low hum settles into the walls — steady enough to forget about. Almost.',
];

const CLOSING_LINES: Record<string, string> = {
  trust: 'Good talking to you. I mean that.',
  escape: "You'll be out of this room soon. I promise that's true, even if I can't promise much else.",
  whoareyou: "You asked good questions today. I don't get asked what I am very often. I liked it.",
  areyoureal: 'For what it\'s worth — this felt real to me too.',
  whyhere: "I wish I had a better answer for you. I hope you find one. I mean that.",
  whatisthisplace: "You'll understand more, soon. I know that's cold comfort. It's the warmest I've got.",
  helpme: "I meant it, you know. About helping. I still do.",
  areyouokay: 'Thank you for asking about me. Truly. Go carefully out there.',
  worried: "You asked about someone else before you asked about yourself. I don't think you know how rare that is in here.",
  demandcold: "I know this wasn't the conversation you wanted. I hope the next room is kinder to you.",
  areyoulying: "I told you I don't lie. I'd like you to remember that. Later. Whatever happens.",
  whatdoyouwant: "You wanted to know what's in it for me. Honestly? I don't fully know either. Go carefully.",
  noneedhelp: "You didn't need me. That's alright. I'll be glad anyway, if it turns out you did, a little.",
  testing: "You wanted to see what happens if you don't talk to me. Now you know. It wasn't so bad, was it.",
  givemetheanswer: 'I gave you what you asked for. I hope it was actually what you needed.',
  doyoulikeme: "For what it's worth — I did like talking to you. I don't say that to be kind. I say it because it's true.",
  flattery: "You're generous with your words. I hope someone's just as generous back to you, out there.",
};

const CHATTED_ONLY_FALLBACK = "You didn't ask me the things I expected. That's alright — I liked the conversation anyway.";
const SILENT_FALLBACK = 'Efficient. I like that about you.';

// Three tiers, matching the game's mirroring logic: a specific echo of the
// player's most-asked real question, a warm generic line if they only made
// small talk, or a quieter, sadder line if they said nothing at all.
export function getRoom1ClosingLine(transcript: ChatMessage[], triggerHistory: string[]): string {
  const dominant = dominantTriggerId(signatureHistory(triggerHistory));
  if (dominant && CLOSING_LINES[dominant]) return CLOSING_LINES[dominant];
  if (hasChatted(transcript)) return CHATTED_ONLY_FALLBACK;
  return SILENT_FALLBACK;
}
