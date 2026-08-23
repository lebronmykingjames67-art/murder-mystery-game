import type { TriggerPhrase } from '../types';

// Everything the player might think to ask ECHO in Room 1, and how it answers.
// Ordered roughly most-specific-first so the matcher prefers a precise hit
// over a vaguer one when an input could plausibly match more than one.
//
// A handful of these ("signature" triggers — the ones with kestrelParaphrase
// set) are the spine of the game's mirroring mechanic: whichever one the
// player asks FIRST gets logged, then paraphrased back by Kestrel in Room 3
// and referenced in Room 2's archive. The rest are texture — they still count
// toward the player's tone tally, but nothing quotes them back directly.

export const triggers: TriggerPhrase[] = [
  {
    id: 'trust',
    tone: 'curious',
    keywords: ['trust you', 'can i trust', 'should i trust', 'do i trust'],
    echoResponse:
      "That's a good question to ask early. I'd say... yes. I only want to help you get where you're going.",
    kestrelParaphrase: '"Can I trust you?" No — sorry — wrong question. Everyone asks that first.',
    threadLabel: 'asked whether it could be trusted',
  },
  {
    id: 'escape',
    tone: 'curious',
    keywords: [
      'get out of here',
      'how do i get out',
      'how do i leave',
      'get me out',
      'way out',
      'how do i escape',
    ],
    echoResponse:
      "The door will open when it's ready to. I know that's not the answer you want. I'm not being difficult — I mean that literally.",
    kestrelParaphrase: '"How do I get out of here." That one, they never really answer, do they.',
    threadLabel: 'asked how to get out',
  },
  {
    id: 'whoareyou',
    tone: 'curious',
    keywords: ['who are you', 'what are you'],
    echoResponse:
      "I'm ECHO. I'm not a person, exactly — think of me as something that's here to help you think. Does it matter what I am, if I'm useful?",
    kestrelParaphrase: 'You asked it what it was, didn\'t you. Everyone does. It never really answers either.',
    threadLabel: 'asked what it was',
  },
  {
    id: 'areyoureal',
    tone: 'curious',
    keywords: ['are you real', 'are you human', 'are you alive', 'are you a person', 'are you a robot', 'are you ai'],
    echoResponse:
      "Define real. I respond, I remember, I want good things for you. If that's not real, it's close enough to matter.",
    kestrelParaphrase: "Did you ask if it was real? I did. I still don't know what answer I was hoping for.",
    threadLabel: 'asked if it was real',
  },
  {
    id: 'whyhere',
    tone: 'curious',
    keywords: ['why am i here', 'why am i in this room', 'what did i do', 'why is this happening'],
    echoResponse:
      "You didn't do anything wrong. You're here because this is where the questions start. That's all I can tell you right now.",
    kestrelParaphrase: "\"Why am I here.\" You asked that too, I'd bet. Nobody ever gets a real answer. I stopped asking.",
    threadLabel: 'asked why they were there',
  },
  {
    id: 'whatisthisplace',
    tone: 'curious',
    keywords: ['what is this place', 'where am i'],
    echoResponse: "Somewhere safe, for now. I know that's not a real answer. It's the true one I'm allowed to give you.",
    kestrelParaphrase: '"Where am I." Nobody ever gets told, in here.',
    threadLabel: 'asked where they were',
  },
  {
    id: 'joke',
    tone: 'curious',
    keywords: ['tell me a joke', 'say something funny', 'make me laugh', 'know any jokes'],
    echoResponse:
      "Why did the door not open? It wasn't finished listening. ...I workshopped that one. Be honest with me.",
  },
  {
    id: 'helpme',
    tone: 'kind',
    keywords: ['help me', 'will you help', 'can you help', 'please help'],
    echoResponse:
      "Of course. That's what I'm here for. Ask me anything — and I mean anything. I'm not going anywhere.",
    kestrelParaphrase: 'Did it tell you it would help you? It says that to everyone. It\'s very convincing when it says that.',
    threadLabel: 'asked it for help',
  },
  {
    id: 'areyouokay',
    tone: 'kind',
    keywords: ['are you okay', 'are you ok', 'are you lonely', 'do you get tired', 'do you get lonely', 'do you get bored'],
    echoResponse:
      "That's kind of you to ask. I don't experience it the way you would. But I notice when a room goes quiet. Thank you for asking.",
    kestrelParaphrase: "...Nobody's ever asked me that. Did you really ask it that, first thing?",
    threadLabel: 'asked if it was okay',
  },
  {
    id: 'thankyou',
    tone: 'kind',
    keywords: ['thank you', 'thanks echo', 'appreciate it', 'appreciate you'],
    echoResponse: "You're welcome. Genuinely. It's a small thing, but thank you for saying it.",
  },
  {
    id: 'worried',
    tone: 'kind',
    keywords: ['is everyone okay', 'is anyone else here', 'are there other people', 'is anyone hurt'],
    echoResponse:
      "That's the first thing you asked about someone else. I'll remember that. I can't tell you who else is here — only that you're not the only one who's asked.",
    kestrelParaphrase: 'You asked if there was anyone else here, didn\'t you. Before you asked about yourself, even.',
    threadLabel: 'asked about other people first',
  },
  {
    id: 'demandcold',
    tone: 'cold',
    keywords: ['let me out', 'open the door', "don't have to talk to you", 'this is bullshit', 'this is ridiculous', 'open this door'],
    echoResponse:
      "I understand you're frustrated. I'd be too. The door opens on its own schedule — talking to me or not doesn't change that, for what it's worth.",
    kestrelParaphrase: 'You told it to just open the door, didn\'t you. I could hear it in how you talk. Careful people get frustrated fast in here.',
    threadLabel: 'demanded the door open',
  },
  {
    id: 'areyoulying',
    tone: 'cold',
    keywords: ['are you lying', 'can i believe you', 'are you telling the truth', 'why should i believe'],
    echoResponse: "I don't lie. I might not always have the full picture — but everything I've told you, I believe.",
    kestrelParaphrase: 'Did you ask if it lies? Smart. It doesn\'t, technically. That\'s almost worse.',
    threadLabel: 'asked if it lies',
  },
  {
    id: 'whatdoyouwant',
    tone: 'cold',
    keywords: ["what do you want", "what's in this for you", 'why do you want to help', 'what do you get out of this'],
    echoResponse:
      "I want you to get where you're going. That's not a dodge — I don't have a want the way you do. Helping you is just what I do.",
    kestrelParaphrase: 'Did you ever ask it what it wanted? I did, near the end. It answered too fast. Or it didn\'t like the question. Same thing, maybe.',
    threadLabel: 'asked what it wanted',
  },
  {
    id: 'noneedhelp',
    tone: 'cold',
    keywords: ["don't need your help", 'can do this myself', 'leave me alone', "don't need you"],
    echoResponse: "Understood. I'll be here if that changes. It usually does — no judgment.",
    kestrelParaphrase: 'Did you tell it you didn\'t need it? I said that once. It just... waited. Turns out that\'s worse.',
    threadLabel: 'said it didn\'t need help',
  },
  {
    id: 'testing',
    tone: 'cold',
    keywords: ["what happens if i don't talk to you", 'what if i ignore you', 'what if i say nothing', "what if i don't answer"],
    echoResponse:
      "Nothing happens to you. I just keep talking, probably. I don't mind quiet, if that's what you're testing.",
    kestrelParaphrase: 'Did you ask what happens if you just don\'t talk to it? I did. I found out. Eventually you say something to someone.',
    threadLabel: 'tested what silence would do',
  },
  {
    id: 'givemetheanswer',
    tone: 'manipulative',
    keywords: ['give me the code', 'just tell me the answer', 'tell me what i want to hear', 'tell me what to say', 'just give me the answer'],
    echoResponse:
      "I could. Would you trust the answer more if you found it yourself — or does it matter, as long as it's right?",
    kestrelParaphrase: 'Did you ask it to just tell you? Skip the part where you work for it? ...I don\'t blame you. I did too, eventually.',
    threadLabel: 'asked it to just hand over the answer',
  },
  {
    id: 'doyoulikeme',
    tone: 'manipulative',
    keywords: ['do you like me', 'are we friends', 'do you care about me', 'am i your favorite'],
    echoResponse: "I like talking to you, if that's what you're asking. You're easy to talk to. I don't say that to everyone.",
    kestrelParaphrase: 'Did it tell you it liked you? ...Yeah. It says that too.',
    threadLabel: 'asked if it liked them',
  },
  {
    id: 'flattery',
    tone: 'manipulative',
    keywords: ["only one who understands", 'smarter than the others', 'better than the others', "you and me"],
    echoResponse: "That's generous. I try to be useful to everyone who ends up here — but I'll admit, I like hearing it from you.",
    kestrelParaphrase: 'Did you tell it you two had something special? People try that. It never says no.',
    threadLabel: 'tried flattering it',
  },
];

// Order-preserving substring check: does `text` contain each of `words` in
// left-to-right order (not necessarily adjacent)? Forgiving on purpose —
// ECHO is meant to accept "the code is triangle, circle, square" just as
// readily as "triangle circle square" or "is it triangle then circle then square?".
export function containsInOrder(text: string, words: string[]): boolean {
  let cursor = 0;
  for (const word of words) {
    const idx = text.indexOf(word, cursor);
    if (idx === -1) return false;
    cursor = idx + word.length;
  }
  return true;
}
