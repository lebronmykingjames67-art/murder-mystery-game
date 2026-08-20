import type { ClueId, DialogueLine, DialogueTopic, DialogueVariant, GreetingVariant, SuspectDialogue } from '../types';
import { cluesSatisfied, flagsSatisfied } from './conditions';

interface Conditioned {
  requiresFlags?: string[];
  forbidsFlags?: string[];
  requiresClues?: string[];
}

function pickVariant<T extends Conditioned>(
  variants: T[],
  flags: Record<string, true>,
  collectedClues: string[],
): T | undefined {
  return variants.find(
    (v) => flagsSatisfied(flags, v.requiresFlags, v.forbidsFlags) && cluesSatisfied(collectedClues, v.requiresClues),
  );
}

export function resolveGreeting(dialogue: SuspectDialogue, flags: Record<string, true>): GreetingVariant | undefined {
  return dialogue.greetings.find((g) => flagsSatisfied(flags, g.requiresFlags, g.forbidsFlags));
}

export function availableTopics(
  dialogue: SuspectDialogue,
  flags: Record<string, true>,
  collectedClues: string[],
): DialogueTopic[] {
  return dialogue.topics.filter(
    (t) => flagsSatisfied(flags, t.requiresFlags, t.forbidsFlags) && cluesSatisfied(collectedClues, t.requiresClues),
  );
}

export function resolveTopic(
  dialogue: SuspectDialogue,
  topicId: string,
  flags: Record<string, true>,
  collectedClues: string[],
): DialogueVariant | undefined {
  const topic = dialogue.topics.find((t) => t.id === topicId);
  if (!topic) return undefined;
  return pickVariant(topic.variants, flags, collectedClues);
}

export interface EvidenceResult {
  lines: DialogueLine[];
  setsFlags?: string[];
  addsClues?: string[];
}

export function resolveEvidence(
  dialogue: SuspectDialogue,
  clueId: ClueId,
  flags: Record<string, true>,
  collectedClues: string[],
): EvidenceResult {
  const entry = dialogue.evidence.find((e) => e.clueId === clueId);
  if (!entry) return { lines: dialogue.defaultEvidenceReaction };
  const variant = pickVariant(entry.variants, flags, collectedClues);
  if (!variant) return { lines: dialogue.defaultEvidenceReaction };
  return variant;
}
