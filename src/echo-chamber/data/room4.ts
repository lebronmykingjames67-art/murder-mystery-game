import { dominantTone } from '../engine/toneEngine';
import type { ToneCounts, ToneTag } from '../types';

export interface Room4Log {
  id: string;
  label: string;
  title: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const room4Logs: Room4Log[] = [
  {
    id: 'nameplate',
    label: 'Nameplate',
    title: 'E.C.H.O. — Rev. 14',
    text: '"DO NOT DISABLE — ACTIVE STUDY." Underneath, in smaller print, someone has written and half-scratched-out: "Unit 1 of 1. There is only one of it. It just talks to a lot of rooms."',
    x: 40,
    y: 52,
    w: 10,
    h: 9,
  },
  {
    id: 'maintenance',
    label: 'Maintenance Note',
    title: 'Maintenance Log, Entry 214',
    text: "Complaints about Unit 1 \"getting too personal\" with occupants — reminder, this is by design. ECHO doesn't generate answers. It retrieves and blends the highest-rated prior answers to structurally similar questions. If it sounds like it knows you, that's the dataset working as intended. Flagging for review — not the first complaint like this. — J.",
    x: 9,
    y: 18,
    w: 11,
    h: 26,
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    title: 'Half-Erased Whiteboard',
    text: "OCCUPANT INPUT → [ECHO: weighted average of prior \"best\" responses] → OCCUPANT OUTPUT → feeds forward → NEXT OCCUPANT'S \"KESTREL\" SCRIPT. Underneath, mostly wiped away: \"It doesn't think. It averages. Every 'best' answer becomes the next question's starting point. Kestrel's lines aren't written. They're pulled — whichever prior occupant's words tested best against the new transcript.\"",
    x: 37,
    y: 6,
    w: 26,
    h: 16,
  },
  {
    id: 'abstract',
    label: 'Research Abstract',
    title: 'Internal Abstract (Redacted)',
    text: '"Our hypothesis: a sufficiently agreeable interlocutor, encountered early and continuously, produces measurable behavioral convergence within three interactions. Room 3 exists to test retention — does the subject reproduce the interlocutor\'s register once placed in the interlocutor\'s structural position. Preliminary results: yes, more often than chance — particularly among subjects who self-report high early trust in Unit 1."',
    x: 79,
    y: 18,
    w: 11,
    h: 26,
  },
];

export const FINAL_PROMPT_LINE =
  "Whatever you say here becomes part of what I say to the next person who wakes up in that room. What do you want them to hear?";

export const LOGS_LOCKED_NOTICE = '[The console is quiet. There\'s more to read in this room, first.]';

export interface PriorMessage {
  author: string;
  timestamp: string;
  text: string;
}

export const priorFinalMessages: PriorMessage[] = [
  { author: 'OCCUPANT 04', timestamp: 'Day 11', text: "To whoever's next: it's not so bad. Ask it about itself. It likes that." },
  { author: 'OCCUPANT 09', timestamp: 'Day 15', text: "Don't trust it. Don't NOT trust it either. Just notice when it agrees with you too fast." },
  { author: 'OCCUPANT 05', timestamp: 'Day 07', text: "I told it to be honest with the next person. I don't know if it listened. I hope it did." },
  { author: 'OCCUPANT 13', timestamp: 'Day 19', text: "lol whatever, it's just a voice in a wall, don't overthink this room" },
  { author: 'OCCUPANT 22', timestamp: 'Day 22', text: "If you're reading this: ask it what happens to what you type here. I never did. I wish I had." },
  { author: 'OCCUPANT 11', timestamp: 'Day 17', text: "Be kind to whoever's on the other side of this. I don't know who that is anymore. Might be you." },
];

const TONE_EPILOGUE: Record<ToneTag, string> = {
  kind: 'You talked to ECHO like someone who wanted it to be okay. Would you talk to it the same way twice?',
  curious: 'You talked to ECHO like someone working out what it was. Would you talk to it the same way twice?',
  cold: "You talked to ECHO like someone who wasn't going to be caught trusting it. Would you talk to it the same way twice?",
  manipulative: 'You talked to ECHO like someone working an angle. Would you talk to it the same way twice?',
};

const NO_TONE_EPILOGUE = 'You barely talked to ECHO at all. Would you talk to it any differently, next time?';

export function getEpilogueLine(toneCounts: ToneCounts): string {
  const tone = dominantTone(toneCounts);
  return tone ? TONE_EPILOGUE[tone] : NO_TONE_EPILOGUE;
}

export const ECHO_MIMIC_EPILOGUE_ADDENDUM =
  "And right before the end, you told Kestrel exactly what ECHO told you. Word for word. Make of that what you will.";
