import { create } from 'zustand';
import type { ChatMessage, EchoScreen, KestrelFinalChoice, ToneCounts, ToneTag } from '../types';
import { addTone, emptyToneCounts, matchTrigger, matchesSpokenCode } from '../engine/toneEngine';

type Symbol = 'triangle' | 'circle' | 'square';
const CODE: Symbol[] = ['triangle', 'circle', 'square'];

const GENERIC_FALLBACKS = [
  "That's not something I can answer well — but I'm listening, if you want to say more.",
  "I don't have a clean answer for that. I'd rather not guess and get it wrong.",
  "Tell me more about that, if you want. I'm not going anywhere.",
  "I hear you. I'm just not sure there's a good answer to give back yet.",
];

interface Room1State {
  examinedHotspots: Set<string>;
  foundSymbols: Set<Symbol>;
  keypadEntry: Symbol[];
  keypadAttempts: number;
  solved: boolean;
}

interface Room2State {
  viewedTerminals: Set<string>;
  threadFound: boolean;
}

interface Room3State {
  exchangeIndex: number; // 0-3 = normal exchanges, 4 = final branch, 5 = resolved
  chosenTones: ToneTag[];
  finalChoice: KestrelFinalChoice | null;
}

interface Room4State {
  viewedLogs: Set<string>;
}

interface EchoStore {
  screen: EchoScreen;
  transcript: ChatMessage[];
  toneCounts: ToneCounts;
  triggerHistory: string[];
  fallbackCursor: number;
  room1: Room1State;
  room2: Room2State;
  room3: Room3State;
  room4: Room4State;
  finalMessage: string | null;

  goToScreen: (screen: EchoScreen) => void;
  pushEchoLine: (text: string) => void;
  sendToEcho: (text: string) => void;
  examineHotspot: (id: string, symbol?: Symbol) => void;
  tapSymbol: (symbol: Symbol) => void;
  viewTerminal: (id: string) => void;
  selectThread: () => void;
  chooseKestrelOption: (tone: ToneTag) => void;
  chooseKestrelFinal: (choice: KestrelFinalChoice) => void;
  viewRoom4Log: (id: string) => void;
  submitFinalMessage: (text: string) => void;
  restart: () => void;
}

function initialRoom1(): Room1State {
  return { examinedHotspots: new Set(), foundSymbols: new Set(), keypadEntry: [], keypadAttempts: 0, solved: false };
}
function initialRoom2(): Room2State {
  return { viewedTerminals: new Set(), threadFound: false };
}
function initialRoom3(): Room3State {
  return { exchangeIndex: 0, chosenTones: [], finalChoice: null };
}
function initialRoom4(): Room4State {
  return { viewedLogs: new Set() };
}

export const useEchoStore = create<EchoStore>()((set, get) => ({
  screen: 'title',
  transcript: [],
  toneCounts: emptyToneCounts,
  triggerHistory: [],
  fallbackCursor: 0,
  room1: initialRoom1(),
  room2: initialRoom2(),
  room3: initialRoom3(),
  room4: initialRoom4(),
  finalMessage: null,

  goToScreen: (screen) => set({ screen }),

  pushEchoLine: (text) => set((s) => ({ transcript: [...s.transcript, { speaker: 'echo', text }] })),

  sendToEcho: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const state = get();
    const playerMsg: ChatMessage = { speaker: 'player', text: trimmed };

    if (!state.room1.solved && matchesSpokenCode(trimmed)) {
      set({
        transcript: [
          ...state.transcript,
          playerMsg,
          { speaker: 'echo', text: "That's the code. Well done — the door will open now." },
        ],
        room1: { ...state.room1, solved: true },
      });
      return;
    }

    const match = matchTrigger(trimmed);
    if (match) {
      const echoMsg: ChatMessage = { speaker: 'echo', text: match.response, triggerId: match.trigger.id };
      set({
        transcript: [...state.transcript, playerMsg, echoMsg],
        toneCounts: addTone(state.toneCounts, match.trigger.tone),
        triggerHistory: [...state.triggerHistory, match.trigger.id],
      });
      return;
    }

    const fallback = GENERIC_FALLBACKS[state.fallbackCursor % GENERIC_FALLBACKS.length];
    set({
      transcript: [...state.transcript, playerMsg, { speaker: 'echo', text: fallback }],
      fallbackCursor: state.fallbackCursor + 1,
    });
  },

  examineHotspot: (id, symbol) => {
    const state = get();
    const examined = new Set(state.room1.examinedHotspots);
    examined.add(id);
    const found = new Set(state.room1.foundSymbols);
    if (symbol) found.add(symbol);
    set({ room1: { ...state.room1, examinedHotspots: examined, foundSymbols: found } });
  },

  tapSymbol: (symbol) => {
    const state = get();
    if (state.room1.solved) return;
    const entry = [...state.room1.keypadEntry, symbol];
    if (entry.length < 3) {
      set({ room1: { ...state.room1, keypadEntry: entry } });
      return;
    }
    const correct = entry.every((s, i) => s === CODE[i]);
    if (correct) {
      set({
        room1: { ...state.room1, keypadEntry: [], solved: true },
        transcript: [...state.transcript, { speaker: 'echo', text: 'The lock clicks open.' }],
      });
    } else {
      set({ room1: { ...state.room1, keypadEntry: [], keypadAttempts: state.room1.keypadAttempts + 1 } });
    }
  },

  viewTerminal: (id) => {
    const state = get();
    const viewed = new Set(state.room2.viewedTerminals);
    viewed.add(id);
    set({ room2: { ...state.room2, viewedTerminals: viewed } });
  },

  selectThread: () => set((s) => ({ room2: { ...s.room2, threadFound: true } })),

  chooseKestrelOption: (tone) => {
    const state = get();
    set({
      room3: {
        ...state.room3,
        exchangeIndex: state.room3.exchangeIndex + 1,
        chosenTones: [...state.room3.chosenTones, tone],
      },
    });
  },

  chooseKestrelFinal: (choice) => {
    const state = get();
    set({ room3: { ...state.room3, finalChoice: choice, exchangeIndex: state.room3.exchangeIndex + 1 } });
  },

  viewRoom4Log: (id) => {
    const state = get();
    const viewed = new Set(state.room4.viewedLogs);
    viewed.add(id);
    set({ room4: { ...state.room4, viewedLogs: viewed } });
  },

  submitFinalMessage: (text) => set({ finalMessage: text.trim(), screen: 'credits' }),

  restart: () =>
    set({
      screen: 'title',
      transcript: [],
      toneCounts: emptyToneCounts,
      triggerHistory: [],
      fallbackCursor: 0,
      room1: initialRoom1(),
      room2: initialRoom2(),
      room3: initialRoom3(),
      room4: initialRoom4(),
      finalMessage: null,
    }),
}));
