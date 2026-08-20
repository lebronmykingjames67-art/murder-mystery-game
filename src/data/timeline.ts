import type { TimelineEntry } from '../types';

export const timeline: TimelineEntry[] = [
  {
    id: 'tl-dinner-start',
    time: '7:00 PM',
    sortKey: 0,
    title: "The Investors' Dinner Begins",
    description:
      'A private dinner in the Function Room for Julian Voss, Renata Cole, and a handful of Meridian Group investors. Staff describe it as cordial, if a little stiff.',
  },
  {
    id: 'tl-cocktails',
    time: '8:30 PM',
    sortKey: 90,
    title: 'The Party Moves to the Bar',
    description: 'Dinner wraps and the group drifts to the Mezzanine bar for cocktails. Wes is on shift all night.',
  },
  {
    id: 'tl-tense-exchange',
    time: '~9:45 PM',
    sortKey: 165,
    title: 'Words Near the Bar',
    description:
      'Julian and Renata have a tense exchange near the bar. A glass is knocked over. Staff notice, but nobody makes much of it at the time.',
    requiresFlags: ['has-clue:party-seating-chart'],
  },
  {
    id: 'tl-keycard-returned',
    time: '10:50 PM',
    sortKey: 230,
    title: 'A Staff Keycard Left Unattended',
    description:
      "Sometime before 11:00, the \"Housekeeping Master 3\" card is back in its drawer at the front desk — unattended, in a lobby full of guests drifting between the party and their rooms.",
    requiresFlags: ['has-clue:keycard-log'],
  },
  {
    id: 'tl-julian-returns',
    time: '~11:00 PM',
    sortKey: 240,
    title: 'Julian Returns to 412',
    description: 'The party winding down, Julian excuses himself and heads up to his suite alone.',
    requiresFlags: ['visited:floor4-room-412'],
  },
  {
    id: 'tl-priya-visit',
    time: '11:05 PM',
    sortKey: 245,
    title: "Priya's Visit",
    description:
      "Priya Anand brings Julian a bottle of wine — a courtesy, and more than that. They talk for a few minutes. He seems distracted, on edge about something at work.",
    requiresFlags: ['priya-affair-revealed'],
  },
  {
    id: 'tl-marcus-call-start',
    time: '11:12 PM',
    sortKey: 252,
    title: "Marcus Dials His Lawyer",
    description: 'From Room 505, registered under a false name, Marcus places a 41-minute call to a law firm.',
    requiresFlags: ['has-clue:phone-bill-slip'],
  },
  {
    id: 'tl-priya-leaves',
    time: '11:10–11:12 PM',
    sortKey: 253,
    title: 'Priya Leaves 412',
    description:
      'Priya says goodnight and returns to the front desk. By her account, and the hotel logs, Julian is alive and well when she leaves him.',
    requiresFlags: ['priya-affair-revealed'],
  },
  {
    id: 'tl-renata-steps-away',
    time: '~11:30 PM',
    sortKey: 270,
    title: 'Renata Steps Away From the Bar',
    description: 'Renata leaves the bar for what Wes eventually admits was "about fifteen minutes," saying she needed air.',
    requiresFlags: ['renata-alibi-broken'],
  },
  {
    id: 'tl-card-used',
    time: '11:31 PM',
    sortKey: 271,
    title: 'Room 412 Is Opened',
    description: 'The electronic lock on Room 412 is opened with the "Housekeeping Master 3" staff card.',
    requiresFlags: ['has-clue:keycard-log'],
  },
  {
    id: 'tl-thump',
    time: '11:38 PM',
    sortKey: 278,
    title: 'Raised Voices, Then a Thump',
    description: 'Diane Faraday, in Room 410, hears tense voices through the wall, then a thump like something falling.',
    requiresFlags: ['has-clue:diane-testimony'],
  },
  {
    id: 'tl-green-dress',
    time: '11:39 PM',
    sortKey: 279,
    title: 'The Woman in Green',
    description:
      'Diane glimpses a woman in a green dress hurrying toward the stairwell end of the hall. The fire stairwell door sensor trips the same minute — and nobody swipes in at the lobby afterward.',
    requiresFlags: ['has-clue:diane-testimony'],
  },
  {
    id: 'tl-body-found',
    time: '11:47 PM',
    sortKey: 287,
    title: 'The Body Is Discovered',
    description:
      "Julian misses a scheduled call with an overseas partner. When he doesn't answer his phone, a staff member is sent up to check on him — and finds him dead on the floor of Room 412.",
  },
  {
    id: 'tl-marcus-call-end',
    time: '11:53 PM',
    sortKey: 293,
    title: "Marcus's Call Ends",
    description: "Marcus's call to his lawyer ends — 41 minutes after it began, well after the hotel is already sealed.",
    requiresFlags: ['has-clue:phone-bill-slip'],
  },
  {
    id: 'tl-lockdown',
    time: 'Shortly after',
    sortKey: 300,
    title: 'The Hotel Locks Down',
    description:
      'Hotel management seals every exit. Nobody leaves, nobody new arrives. You are called in to solve it before the police take over at dawn.',
  },
];
