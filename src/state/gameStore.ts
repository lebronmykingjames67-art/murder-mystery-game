import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccusationChoice, ClueId, DialogueLine, FlagId, SuspectId } from '../types';
import { chapters } from '../data/chapters';
import { clues, contradictions } from '../data/clues';
import { getFloor, getRoom } from '../data/hotel';
import { getSuspectDialogue } from '../data/dialogue';
import { evaluateAccusation } from '../data/case';
import { flagsSatisfied } from '../engine/conditions';
import { effectiveRoomKind } from '../engine/rooms';
import { resolveEvidence, resolveGreeting, resolveTopic } from '../engine/dialogueEngine';
import { SAVE_STORAGE_KEY } from './persistence';

export type ViewName = 'menu' | 'intro' | 'elevator' | 'floor' | 'room' | 'dialogue' | 'accusation' | 'ending';

interface DialogueRuntime {
  suspectId: SuspectId;
  lines: DialogueLine[];
  lineIndex: number;
  pendingFlags: string[];
  pendingClues: string[];
  onComplete: 'hub' | 'close';
}

interface Popup {
  title: string;
  text: string;
  kind: 'flavor' | 'clue' | 'locked';
}

interface Toast {
  id: number;
  text: string;
}

interface ChapterBanner {
  number: number;
  title: string;
  goalText: string;
}

interface CommitPatch {
  flags?: (FlagId | undefined)[];
  clues?: ClueId[];
}

interface PersistedShape {
  started: boolean;
  chapter: number;
  flags: Record<string, true>;
  collectedClues: ClueId[];
  currentFloorId: string;
  wrongAccusationCount: number;
}

interface GameStore extends PersistedShape {
  view: ViewName;
  currentRoomId: string | null;
  dialogue: DialogueRuntime | null;
  popup: Popup | null;
  toast: Toast | null;
  notebookOpen: boolean;
  notebookTab: 'clues' | 'suspects' | 'timeline';
  selectedNotebookClueId: ClueId | null;
  accusationResult: { correct: boolean; lines: string[] } | null;
  chapterBanner: ChapterBanner | null;

  commit: (patch: CommitPatch) => void;

  newGame: () => void;
  continueGame: () => void;
  goToMenu: () => void;
  beginFromIntro: () => void;

  goToElevator: () => void;
  travelToFloor: (floorId: string) => void;
  enterRoom: (roomId: string) => void;
  leaveRoom: () => void;
  interactHotspot: (hotspotId: string) => void;
  dismissPopup: () => void;

  startDialogue: (suspectId: SuspectId) => void;
  chooseTopic: (topicId: string) => void;
  presentEvidence: (clueId: ClueId) => void;
  advanceDialogueLine: () => void;
  endDialogue: () => void;

  toggleNotebook: (open?: boolean) => void;
  setNotebookTab: (tab: 'clues' | 'suspects' | 'timeline') => void;
  selectNotebookClue: (id: ClueId | null) => void;

  goToAccusation: () => void;
  submitAccusation: (choice: AccusationChoice) => void;
  closeAccusationResult: () => void;

  dismissChapterBanner: () => void;
  dismissToast: () => void;
  restartGame: () => void;
}

function computeCommit(
  state: Pick<GameStore, 'flags' | 'chapter' | 'collectedClues' | 'chapterBanner' | 'toast'>,
  patch: CommitPatch,
): Partial<GameStore> {
  const additions = new Set<string>();
  for (const f of patch.flags ?? []) {
    if (f) additions.add(f);
  }

  let nextCollected = state.collectedClues;
  let nextToast = state.toast;

  if (patch.clues && patch.clues.length > 0) {
    const seen = new Set(state.collectedClues);
    const newlyAdded: string[] = [];
    for (const c of patch.clues) {
      if (!seen.has(c)) {
        seen.add(c);
        newlyAdded.push(c);
      }
    }
    if (newlyAdded.length > 0) {
      nextCollected = [...state.collectedClues, ...newlyAdded];
      for (const c of newlyAdded) additions.add(`has-clue:${c}`);

      for (const contradiction of contradictions) {
        const [a, b] = contradiction.clueIds;
        if (seen.has(a) && seen.has(b)) {
          const seenFlag = `contradiction-seen:${contradiction.id}`;
          if (!state.flags[seenFlag] && !additions.has(seenFlag)) {
            additions.add(seenFlag);
            if (contradiction.unlocksFlag) additions.add(contradiction.unlocksFlag);
            nextToast = { id: Date.now() + Math.random(), text: `Contradiction found — "${contradiction.title}"` };
          }
        }
      }
    }
  }

  const nextFlags: Record<string, true> = { ...state.flags };
  for (const f of additions) nextFlags[f] = true;

  let chapter = state.chapter;
  let banner = state.chapterBanner;
  for (const c of chapters) {
    if (c.number <= chapter) continue;
    if (c.advanceWhenFlags && flagsSatisfied(nextFlags, c.advanceWhenFlags)) {
      chapter = c.number;
      nextFlags[`chapter_reached_${c.number}`] = true;
      banner = { number: c.number, title: c.title, goalText: c.goalText };
    } else {
      break;
    }
  }

  return { flags: nextFlags, collectedClues: nextCollected, chapter, chapterBanner: banner, toast: nextToast };
}

const initialTransient = {
  view: 'menu' as ViewName,
  currentRoomId: null as string | null,
  dialogue: null as DialogueRuntime | null,
  popup: null as Popup | null,
  toast: null as Toast | null,
  notebookOpen: false,
  notebookTab: 'clues' as const,
  selectedNotebookClueId: null as ClueId | null,
  accusationResult: null as { correct: boolean; lines: string[] } | null,
  chapterBanner: null as ChapterBanner | null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      started: false,
      chapter: 1,
      flags: {},
      collectedClues: [],
      currentFloorId: 'lobby',
      wrongAccusationCount: 0,
      ...initialTransient,

      commit: (patch) => set((s) => computeCommit(s, patch)),

      newGame: () =>
        set({
          started: true,
          chapter: 1,
          flags: {},
          collectedClues: [],
          currentFloorId: 'lobby',
          wrongAccusationCount: 0,
          ...initialTransient,
          view: 'intro',
        }),

      continueGame: () => {
        const state = get();
        if (!state.started) {
          get().newGame();
          return;
        }
        set({ view: 'elevator', dialogue: null, popup: null, accusationResult: null });
      },

      goToMenu: () => set({ view: 'menu' }),
      beginFromIntro: () => set({ view: 'elevator' }),

      goToElevator: () => set({ view: 'elevator', currentRoomId: null }),

      travelToFloor: (floorId) => {
        const state = get();
        const floor = getFloor(floorId);
        if (!floor) return;
        if (floor.locked && !state.flags[floor.locked.unlockFlag]) {
          set({ popup: { title: floor.name, text: floor.locked.reasonText, kind: 'locked' } });
          return;
        }
        const chats = floor.ambientChats;
        const line = chats && chats.length > 0 ? chats[Math.floor(Math.random() * chats.length)] : null;
        set({
          currentFloorId: floorId,
          currentRoomId: null,
          view: 'floor',
          toast: line ? { id: Date.now(), text: line } : state.toast,
        });
      },

      enterRoom: (roomId) => {
        const state = get();
        const room = getRoom(roomId);
        if (!room) return;
        const effectiveKind = effectiveRoomKind(room, state.flags);

        if (effectiveKind === 'locked') {
          set({ popup: { title: room.name, text: room.lockedReason ?? 'This room is locked.', kind: 'locked' } });
          return;
        }
        if (effectiveKind === 'flavor') {
          set({ popup: { title: room.name, text: room.flavorText ?? '', kind: 'flavor' } });
          return;
        }
        get().commit({ flags: [`visited:${roomId}`] });
        set({ currentRoomId: roomId, view: 'room' });
      },

      leaveRoom: () => set({ currentRoomId: null, view: 'floor' }),

      interactHotspot: (hotspotId) => {
        const state = get();
        if (!state.currentRoomId) return;
        const room = getRoom(state.currentRoomId);
        const hotspot = room?.hotspots?.find((h) => h.id === hotspotId);
        if (!room || !hotspot) return;
        if (!flagsSatisfied(state.flags, hotspot.requiresFlags)) return;
        if (hotspot.hideAfterFlags && flagsSatisfied(state.flags, hotspot.hideAfterFlags)) return;

        if (hotspot.kind === 'clue' && hotspot.clueId) {
          const clueId = hotspot.clueId;
          get().commit({ flags: hotspot.setsFlags, clues: [clueId] });
          const clue = clues.find((c) => c.id === clueId);
          if (clue) set({ popup: { title: clue.name, text: clue.detail, kind: 'clue' } });
          return;
        }
        if (hotspot.kind === 'npc' && hotspot.npcId) {
          if (hotspot.setsFlags?.length) get().commit({ flags: hotspot.setsFlags });
          get().startDialogue(hotspot.npcId);
          return;
        }
        get().commit({ flags: hotspot.setsFlags });
        set({ popup: { title: hotspot.label, text: hotspot.flavorText ?? '', kind: 'flavor' } });
      },

      dismissPopup: () => set({ popup: null }),

      startDialogue: (suspectId) => {
        const dialogue = getSuspectDialogue(suspectId);
        if (!dialogue) return;
        get().commit({ flags: [`met:${suspectId}`] });
        const state = get();
        const greeting = resolveGreeting(dialogue, state.flags);
        const lines = greeting?.lines ?? [{ speaker: 'narration', text: '...' }];
        set({
          view: 'dialogue',
          dialogue: {
            suspectId,
            lines,
            lineIndex: 0,
            pendingFlags: greeting?.setsFlags ?? [],
            pendingClues: [],
            onComplete: 'hub',
          },
        });
      },

      chooseTopic: (topicId) => {
        const state = get();
        if (!state.dialogue) return;
        const dialogue = getSuspectDialogue(state.dialogue.suspectId);
        if (!dialogue) return;
        const variant = resolveTopic(dialogue, topicId, state.flags, state.collectedClues);
        if (!variant) return;
        get().commit({ flags: [`seen:${state.dialogue.suspectId}:topic:${topicId}`] });
        set({
          dialogue: {
            ...state.dialogue,
            lines: variant.lines,
            lineIndex: 0,
            pendingFlags: variant.setsFlags ?? [],
            pendingClues: variant.addsClues ?? [],
            onComplete: 'hub',
          },
        });
      },

      presentEvidence: (clueId) => {
        const state = get();
        if (!state.dialogue) return;
        const dialogue = getSuspectDialogue(state.dialogue.suspectId);
        if (!dialogue) return;
        const result = resolveEvidence(dialogue, clueId, state.flags, state.collectedClues);
        get().commit({ flags: [`seen:${state.dialogue.suspectId}:evidence:${clueId}`] });
        set({
          dialogue: {
            ...state.dialogue,
            lines: result.lines,
            lineIndex: 0,
            pendingFlags: result.setsFlags ?? [],
            pendingClues: result.addsClues ?? [],
            onComplete: 'hub',
          },
        });
      },

      advanceDialogueLine: () => {
        const state = get();
        if (!state.dialogue) return;
        const { lines, lineIndex, pendingFlags, pendingClues, onComplete, suspectId } = state.dialogue;
        if (lineIndex + 1 < lines.length) {
          set({ dialogue: { ...state.dialogue, lineIndex: lineIndex + 1 } });
          return;
        }
        get().commit({ flags: pendingFlags, clues: pendingClues });
        if (onComplete === 'close') {
          set({ dialogue: null, view: 'room' });
        } else {
          set({ dialogue: { suspectId, lines: [], lineIndex: 0, pendingFlags: [], pendingClues: [], onComplete: 'hub' } });
        }
      },

      endDialogue: () => {
        const state = get();
        if (!state.dialogue) return;
        const dialogue = getSuspectDialogue(state.dialogue.suspectId);
        set({
          dialogue: {
            ...state.dialogue,
            lines: [{ speaker: 'narration', text: dialogue?.farewell ?? 'You step away.' }],
            lineIndex: 0,
            pendingFlags: [],
            pendingClues: [],
            onComplete: 'close',
          },
        });
      },

      toggleNotebook: (open) => set((s) => ({ notebookOpen: open ?? !s.notebookOpen })),
      setNotebookTab: (tab) => set({ notebookTab: tab }),
      selectNotebookClue: (id) => set({ selectedNotebookClueId: id }),

      goToAccusation: () => set({ view: 'accusation', accusationResult: null }),

      submitAccusation: (choice) => {
        const result = evaluateAccusation(choice);
        if (result.correct) {
          set({ view: 'ending', accusationResult: null });
        } else {
          set((s) => ({ accusationResult: result, wrongAccusationCount: s.wrongAccusationCount + 1 }));
        }
      },

      closeAccusationResult: () => set({ accusationResult: null, view: 'elevator' }),

      dismissChapterBanner: () => set({ chapterBanner: null }),
      dismissToast: () => set({ toast: null }),

      restartGame: () => get().newGame(),
    }),
    {
      name: SAVE_STORAGE_KEY,
      partialize: (state) => ({
        started: state.started,
        chapter: state.chapter,
        flags: state.flags,
        collectedClues: state.collectedClues,
        currentFloorId: state.currentFloorId,
        wrongAccusationCount: state.wrongAccusationCount,
      }),
    },
  ),
);
