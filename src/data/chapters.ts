import type { Chapter } from '../types';

export const chapters: Chapter[] = [
  {
    number: 1,
    title: 'Arrival',
    goalText: 'Examine the crime scene in Room 412, then speak with the night manager.',
  },
  {
    number: 2,
    title: 'First Sweep',
    goalText: 'Canvas the Mezzanine — the party staff and guests may have seen something.',
    advanceWhenFlags: ['visited:floor4-room-412', 'met:priya'],
  },
  {
    number: 3,
    title: 'Confrontations',
    goalText: 'Press your witnesses on their stories, and see what the upper floors are hiding.',
    advanceWhenFlags: ['met:wes', 'met:renata', 'visited:lobby-security-office'],
  },
  {
    number: 4,
    title: 'The Twist',
    goalText: "Someone's alibi just broke. Find out what else this hotel is hiding.",
    advanceWhenFlags: ['met:marcus', 'has-clue:master-key', 'renata-alibi-broken'],
  },
  {
    number: 5,
    title: 'The Reckoning',
    goalText: 'You have enough to make your case. Return to the Lobby when you\'re ready to accuse.',
    advanceWhenFlags: ['visited:roof-terrace', 'priya-affair-revealed'],
  },
];

export function getChapter(number: number): Chapter {
  return chapters.find((c) => c.number === number) ?? chapters[0];
}
