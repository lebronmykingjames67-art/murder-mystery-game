import type { Suspect } from '../types';

export const suspects: Suspect[] = [
  {
    id: 'renata',
    name: 'Renata Cole',
    role: "Victim's Business Partner",
    colorTag: '#8a3b3b',
    initials: 'RC',
    bio: "Co-founder of the Voss-Cole Hospitality Group. Impeccably dressed, impeccably composed — the kind of person who answers questions with questions.",
    isKiller: true,
    dossierFields: [
      {
        id: 'relationship',
        label: 'Relationship to Victim',
        text: "Business partner of fifteen years. Co-owns the Meridian Group's hotel portfolio with Julian Voss.",
      },
      {
        id: 'alibi',
        label: 'Alibi',
        text: 'Claims she was at the Mezzanine bar continuously from the end of the dinner party until well past midnight.',
        requiresFlags: ['met:renata'],
      },
      {
        id: 'alibi-status',
        label: 'Alibi — Status',
        text: 'BROKEN. The bartender confirms she stepped away for roughly fifteen minutes during the murder window, and a neighboring guest saw a woman in a green dress near Room 412 at the same time.',
        requiresFlags: ['renata-alibi-broken'],
      },
      {
        id: 'motive',
        label: 'Motive',
        text: "Julian had discovered irregularities in the partnership's accounts and scheduled a meeting with outside auditors for 8:00 the next morning. Exposure would have ended her career, and likely her freedom.",
        requiresFlags: ['has-clue:victims-phone'],
      },
      {
        id: 'opportunity',
        label: 'Opportunity',
        text: "A staff master keycard was used to open Room 412 at 11:31 PM. Renata was seen near the front desk shortly before that card went missing from its drawer.",
        requiresFlags: ['has-clue:keycard-log'],
      },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Voss',
    role: "Victim's Estranged Brother",
    colorTag: '#3b5c8a',
    initials: 'MV',
    bio: 'Checked in three nights ago under a false name. Jumpy, defensive, and conspicuously unwilling to explain why he\'s at his brother\'s hotel at all.',
    isKiller: false,
    dossierFields: [
      {
        id: 'relationship',
        label: 'Relationship to Victim',
        text: "Julian's younger half-brother. By his own account, the two hadn't spoken in years.",
      },
      {
        id: 'identity',
        label: 'True Identity',
        text: 'Checked in as "David Ellison." The signature on the registration card matches Marcus Voss.',
        requiresFlags: ['has-clue:fake-checkin'],
      },
      {
        id: 'motive',
        label: 'Motive',
        text: 'Recently disinherited from the family trust at Julian\'s recommendation. Came to the hotel under a false name, reportedly to confront him about it.',
        requiresFlags: ['has-clue:torn-trust-docs'],
      },
      {
        id: 'alibi',
        label: 'Alibi',
        text: 'Hotel phone records show a 41-minute outside call from Room 505 to a law firm, from 11:12 PM to 11:53 PM — spanning the entire estimated time of death.',
        requiresFlags: ['has-clue:phone-bill-slip'],
      },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Anand',
    role: 'Hotel Night Manager',
    colorTag: '#6b4f8a',
    initials: 'PA',
    bio: "Runs the overnight shift like a ship's captain. Warm with guests, sharp with staff, and very, very protective of the hotel's reputation — and her own.",
    isKiller: false,
    dossierFields: [
      {
        id: 'relationship',
        label: 'Relationship to Victim',
        text: 'Officially, a VIP guest under her care. The truth is more complicated.',
      },
      {
        id: 'statement',
        label: 'Initial Statement',
        text: 'Claims she made only a brief courtesy call on Julian earlier in the evening and saw nothing unusual.',
        requiresFlags: ['met:priya'],
      },
      {
        id: 'truth',
        label: 'The Truth',
        text: 'She and Julian were involved. She brought him wine around 11:00 PM and left him alive around 11:10–11:12 PM, then returned to the desk to handle a guest complaint call logged until after midnight.',
        requiresFlags: ['priya-affair-revealed'],
      },
      {
        id: 'motive',
        label: 'Possible Motive',
        text: 'None found. If anything, Julian\'s death costs her a relationship she was trying hard to keep quiet.',
        requiresFlags: ['priya-affair-revealed'],
      },
    ],
  },
  {
    id: 'wes',
    name: 'Wes Okafor',
    role: 'Bartender, Mezzanine Lounge',
    colorTag: '#8a7a3b',
    initials: 'WO',
    bio: "Been slinging drinks at The Grand Meridian for six years. Knows everyone's order and most people's secrets. Loyal to a fault.",
    isKiller: false,
    dossierFields: [
      {
        id: 'relationship',
        label: 'Relationship to Victim',
        text: 'Served him drinks a handful of times over the years. No particular relationship.',
      },
      {
        id: 'account',
        label: 'Initial Account',
        text: 'Says Renata was at the bar practically all night.',
        requiresFlags: ['met:wes'],
      },
      {
        id: 'revised-account',
        label: 'Revised Account',
        text: 'Admits, once pressed, that Renata stepped away for about fifteen minutes around 11:30–11:45 PM and returned looking flushed and quiet.',
        requiresFlags: ['renata-alibi-broken'],
      },
      {
        id: 'motive',
        label: 'Possible Motive',
        text: 'None. Never left the bar himself — a dozen patrons can confirm it.',
      },
    ],
  },
  {
    id: 'diane',
    name: 'Diane Faraday',
    role: 'Guest, Room 410',
    colorTag: '#3b8a5c',
    initials: 'DF',
    bio: "A sprightly widow on an extended stay, next door to Room 412. Sweet, chatty, prone to dozing off mid-sentence — and sharper than she lets on.",
    isKiller: false,
    dossierFields: [
      {
        id: 'relationship',
        label: 'Relationship to Victim',
        text: "Neighbor. Exchanged pleasantries with Julian in the hallway a few times, nothing more.",
      },
      {
        id: 'testimony',
        label: 'Testimony',
        text: 'Heard raised voices and a thump through the wall around 11:38 PM, and saw a woman in a green dress hurrying toward the stairwell shortly after.',
        requiresFlags: ['met:diane'],
      },
      {
        id: 'motive',
        label: 'Possible Motive',
        text: 'None. Was in her own room the entire night — she\'s the one who heard the murder happen next door.',
      },
    ],
  },
];
