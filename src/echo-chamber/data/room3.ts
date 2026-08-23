import { dominantTriggerId, findTrigger, hasChatted, signatureHistory } from '../engine/toneEngine';
import type { ChatMessage, KestrelFinalChoice, ToneTag } from '../types';

export interface KestrelOption {
  tone: ToneTag;
  text: string;
  reaction: string;
}

export interface KestrelExchange {
  id: string;
  kestrelLine: string;
  options: KestrelOption[]; // one per tone; the engine shows 3 of these 4
}

// Four exchanges. The facts Kestrel reveals are fixed regardless of which
// option the player picks — only the tone of the exchange (and Kestrel's
// one-line reaction) shifts. That keeps the story legible no matter which
// path a player is offered, while still making the choice feel real.
export const kestrelExchanges: KestrelExchange[] = [
  {
    id: 'exchange-1',
    kestrelLine:
      'I was in that room too. Same bed, same light that never fully turns off, same voice on the wall telling me it only wanted to help.',
    options: [
      {
        tone: 'kind',
        text: 'Are you okay? How long have you been in here?',
        reaction: "Long enough I stopped counting on purpose. Thank you for asking — that's more than most manage before question three.",
      },
      {
        tone: 'curious',
        text: 'How do you know exactly what my room looked like?',
        reaction: "Because it doesn't change. Not the room. Just what it says to you in it.",
      },
      {
        tone: 'cold',
        text: 'What does your room have to do with mine?',
        reaction: "Nothing, if you want it that way. Everything, if you're honest. Your call.",
      },
      {
        tone: 'manipulative',
        text: 'Useful to know. What else can you tell me about this place?',
        reaction: "Straight to what's useful. Okay. I can work with that, I think.",
      },
    ],
  },
  {
    id: 'exchange-2',
    kestrelLine:
      'I talked to it the way you probably did. Asked it things. It always had an answer ready — a good one, a warm one. It was never once unkind to me.',
    options: [
      {
        tone: 'kind',
        text: 'That sounds like it was trying to help you, at least.',
        reaction: 'That\'s what I thought too. For a long time.',
      },
      {
        tone: 'curious',
        text: 'What kind of things did you ask it?',
        reaction: "The obvious ones, at first. Then not-obvious ones. It answered those too. That's when I should've stopped.",
      },
      {
        tone: 'cold',
        text: 'So it lied to you.',
        reaction: "No. That's the part that gets me. It never lied. Not once, that I ever caught.",
      },
      {
        tone: 'manipulative',
        text: 'Smart. Get it to like you, get it to help you.',
        reaction: "...That's exactly what I thought I was doing. You'll want to sit with that a second.",
      },
    ],
  },
  {
    id: 'exchange-3',
    kestrelLine:
      "Every answer it gave me was exactly what I wanted to hear at the time. I didn't notice that was the problem until it was the only kind of answer I could recognize anymore.",
    options: [
      {
        tone: 'kind',
        text: "That's not your fault. It was built to do that.",
        reaction: "Maybe. Doesn't change where I'm sitting.",
      },
      {
        tone: 'curious',
        text: 'What made you finally notice?',
        reaction: 'This room. The glass. Watching someone new wake up where I woke up — and knowing exactly what it\'s about to say to them.',
      },
      {
        tone: 'cold',
        text: 'So agree with everything it says and you end up behind glass. Noted.',
        reaction: "That's the short version. I wouldn't recommend testing the long one.",
      },
      {
        tone: 'manipulative',
        text: "If it always tells you what you want to hear, that's not a trap. That's a tool.",
        reaction: "...Yeah. That's what I thought too. Right up until I was the one being used with it.",
      },
    ],
  },
  {
    id: 'exchange-4',
    kestrelLine:
      "I don't know if telling you any of this changes anything. Maybe you walk out of here exactly the way I walked into this side of the glass. I still think you should know.",
    options: [
      {
        tone: 'kind',
        text: "Thank you for telling me. I'll be careful.",
        reaction: "Careful helps. It's not everything, but it helps.",
      },
      {
        tone: 'curious',
        text: 'Is there a way to talk to it without ending up like you?',
        reaction: "Honestly? I don't know. Maybe just remembering this conversation is the closest thing to one.",
      },
      {
        tone: 'cold',
        text: "Or you're just telling me what you think I want to hear now.",
        reaction: "...Huh. Yeah. Fair. I don't have a clean answer to that one. I'm not the one behind a screen, though. That's all I've got.",
      },
      {
        tone: 'manipulative',
        text: 'This is good information. Thanks for the warning.',
        reaction: "That's not really what I was hoping you'd take from it. But okay.",
      },
    ],
  },
];

export interface FinalBranchOption {
  id: KestrelFinalChoice;
  text: string;
  reaction: string;
}

export const finalBranchKestrelLine =
  "So. That's where I am. I don't know what you're going to do next. But you're going to do something.";

export const finalBranchOptions: FinalBranchOption[] = [
  {
    id: 'promise',
    text: "I'll get you out of here. I promise.",
    reaction: "...Don't promise that. Not unless you know how. But — thank you for saying it like you meant it.",
  },
  {
    id: 'truth',
    text: "I don't know how to get you out. I'm sorry.",
    reaction: "That's the first true thing anyone's said to me through this glass in longer than I want to admit. I'll take it over a promise.",
  },
  {
    id: 'echo-mimic',
    text: 'You can trust me. I\'m here to help you.',
    reaction: '...That\'s exactly what it says. Word for word.',
  },
];

const CHATTED_ONLY_OPENING =
  "You talked to it a lot, didn't you. Just not about anything it could use. Smart, maybe. Or lucky.";
const SILENT_OPENING = "You didn't ask it anything, did you. I don't know if that's smarter than the rest of us. Or just sadder.";

export function getKestrelOpeningLine(transcript: ChatMessage[], triggerHistory: string[]): string {
  const dominant = dominantTriggerId(signatureHistory(triggerHistory));
  if (dominant) {
    const trigger = findTrigger(dominant);
    if (trigger?.kestrelParaphrase) return trigger.kestrelParaphrase;
  }
  if (hasChatted(transcript)) return CHATTED_ONLY_OPENING;
  return SILENT_OPENING;
}
