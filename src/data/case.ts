import type { AccusationChoice, AccusationOption, CaseSolution, Rebuttal } from '../types';

export const solution: CaseSolution = {
  killerId: 'renata',
  weaponId: 'letter-opener',
  motiveId: 'embezzlement-exposure',
};

export const weaponOptions: AccusationOption[] = [
  { id: 'letter-opener', label: "The engraved letter opener from Julian's own desk" },
  { id: 'crystal-ashtray', label: 'A heavy crystal ashtray from the minibar' },
  { id: 'champagne-bottle', label: "A shattered champagne bottle from the party" },
  { id: 'bare-hands', label: 'No weapon at all — a struggle and a fall' },
  { id: 'kitchen-knife', label: "A knife taken from the restaurant kitchen" },
];

export const motiveOptions: AccusationOption[] = [
  { id: 'embezzlement-exposure', label: 'He was about to expose her financial fraud' },
  { id: 'inheritance', label: 'Bitterness over a lost inheritance' },
  { id: 'affair-gone-wrong', label: 'A love affair that turned violent' },
  { id: 'blackmail', label: 'Silencing a blackmailer' },
  { id: 'robbery', label: 'A robbery that went wrong' },
];

export const rebuttals: Rebuttal[] = [
  {
    id: 'close-but-unproven',
    priority: 100,
    condition: (a, s) => a.suspectId === s.killerId && (a.weaponId !== s.weaponId || a.motiveId !== s.motiveId),
    lines: [
      "You've got the right person. Renata Cole did it — you can feel it too, can't you?",
      "But an accusation isn't a conviction. If you can't say exactly what she used and exactly why she did it, her lawyer will tear this apart before you finish the sentence.",
      "Go back over the evidence. The letter opener was hers to find, not to bring. And the motive is sitting on the victim's own phone.",
    ],
  },
  {
    id: 'wrong-marcus',
    priority: 10,
    condition: (a) => a.suspectId === 'marcus',
    lines: [
      "Marcus Voss had every reason to hate his brother — disinherited, humiliated, checked in under a false name to confront him.",
      "But the hotel's own phone records put him on a 41-minute call to his lawyer from 11:12 to 11:53 PM — a call that spans the entire window the doctor gave you for time of death.",
      "Whatever Marcus came here to do, he never got the chance. He's guilty of a lie, not a murder.",
    ],
  },
  {
    id: 'wrong-priya',
    priority: 10,
    condition: (a) => a.suspectId === 'priya',
    lines: [
      "Priya Anand lied to you, that much is true — about the affair, about seeing Julian at all. People lie to protect what they love, not just what they've done.",
      "But she left Room 412 alive and well around 11:10 PM, and the front desk logs put her on a guest complaint call from 11:15 PM straight through past midnight — covering the entire window in question.",
      "She had a secret. She didn't have an opportunity.",
    ],
  },
  {
    id: 'wrong-wes',
    priority: 10,
    condition: (a) => a.suspectId === 'wes',
    lines: [
      "Wes covered for a guest he liked — that's a bad habit for a bartender, not a motive for murder.",
      "A dozen patrons can place him behind that bar all night, pouring drinks, never out of sight for more than a minute or two. He had no relationship with Julian Voss at all, let alone a reason to kill him.",
      "You're chasing the wrong loyalty.",
    ],
  },
  {
    id: 'wrong-diane',
    priority: 10,
    condition: (a) => a.suspectId === 'diane',
    lines: [
      "Diane Faraday is many things — nosy, a little scattered, entirely too fond of her travel clock — but she is not your killer.",
      "She was in her own room the entire night. She's the reason you have a timeline at all; she's the one who heard it happen through the wall.",
      "Maybe let the woman get some sleep.",
    ],
  },
  {
    id: 'fallback',
    priority: 0,
    condition: () => true,
    lines: [
      "That doesn't add up, Detective. The evidence tells a different story.",
      "Go back over the notebook — the timeline, the contradictions, the things people said before you had proof and after.",
    ],
  },
];

export function evaluateAccusation(choice: AccusationChoice): { correct: boolean; lines: string[] } {
  if (
    choice.suspectId === solution.killerId &&
    choice.weaponId === solution.weaponId &&
    choice.motiveId === solution.motiveId
  ) {
    return { correct: true, lines: [] };
  }
  const sorted = [...rebuttals].sort((a, b) => b.priority - a.priority);
  const match = sorted.find((r) => r.condition(choice, solution));
  return { correct: false, lines: match ? match.lines : rebuttals[rebuttals.length - 1].lines };
}
