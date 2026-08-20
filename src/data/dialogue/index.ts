import type { SuspectDialogue, SuspectId } from '../../types';
import { renataDialogue } from './renata';
import { marcusDialogue } from './marcus';
import { priyaDialogue } from './priya';
import { wesDialogue } from './wes';
import { dianeDialogue } from './diane';

export const dialogueBySuspect: Record<SuspectId, SuspectDialogue> = {
  renata: renataDialogue,
  marcus: marcusDialogue,
  priya: priyaDialogue,
  wes: wesDialogue,
  diane: dianeDialogue,
};

export function getSuspectDialogue(id: SuspectId): SuspectDialogue | undefined {
  return dialogueBySuspect[id];
}
