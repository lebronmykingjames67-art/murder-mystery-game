import type { SuspectDialogue } from '../../types';

export const renataDialogue: SuspectDialogue = {
  suspectId: 'renata',
  greetings: [
    {
      forbidsFlags: ['greeted:renata'],
      lines: [
        { speaker: 'narration', text: 'Renata Cole sits at the end of the bar, a martini she has not touched in some time sweating a ring onto the wood.' },
        { speaker: 'suspect', text: "You must be the detective. I'd say it's a pleasure, but I imagine we'd both know that was a lie." },
        { speaker: 'suspect', text: 'Ask what you need to ask. I have nothing to hide.' },
      ],
      setsFlags: ['greeted:renata'],
    },
    {
      requiresFlags: ['renata-alibi-broken'],
      lines: [{ speaker: 'suspect', text: "Back again. I hope this is productive for you, Detective, because it certainly isn't pleasant for me." }],
    },
    {
      requiresFlags: ['greeted:renata'],
      lines: [{ speaker: 'suspect', text: 'Detective. Something else?' }],
    },
  ],
  topics: [
    {
      id: 'about-julian',
      label: 'Ask about her relationship with Julian',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Julian and I built the Meridian Group from a single mid-market property to six, over fifteen years. We were partners. Successful ones." },
            { speaker: 'suspect', text: "We didn't always agree. Show me two partners who do." },
          ],
        },
      ],
    },
    {
      id: 'about-partnership',
      label: 'Ask about the state of the partnership',
      variants: [
        {
          id: 'confronted',
          requiresClues: ['victims-phone'],
          lines: [
            { speaker: 'detective', text: "Julian had a meeting scheduled with outside auditors for eight this morning. About your numbers." },
            { speaker: 'suspect', text: 'Something flickers behind her eyes and is gone almost as fast.' },
            { speaker: 'suspect', text: "Julian and I had a disagreement about a set of figures. Accounting is not a science, Detective, whatever people like to pretend. I was already addressing his concerns." },
            { speaker: 'suspect', text: "I'd advise you not to read a business dispute as a motive. My lawyer would say the same, and rather more forcefully." },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "The partnership is — was — extremely healthy. I don't know what you're fishing for, Detective, but you'll need to be more specific." },
          ],
        },
      ],
    },
    {
      id: 'about-alibi',
      label: 'Ask where she was tonight',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['renata-alibi-broken'],
          lines: [{ speaker: 'suspect', text: "I told you. I stepped out for air, for perhaps fifteen minutes. That is not a crime, whatever you'd like it to be." }],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "I was at the bar, Detective. Ask the bartender — I was there practically the entire night, nursing this same, now thoroughly unpleasant, martini. I never left." },
          ],
          addsClues: ['renata-alibi'],
        },
      ],
    },
    {
      id: 'about-marcus',
      label: 'Ask about Marcus Voss',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Julian's brother. A sad, grasping little man who thinks the world owes him for the misfortune of being born second." },
            { speaker: 'suspect', text: "If he's skulking around this hotel under a fake name, I'd start there, Detective, before you waste more time on me." },
          ],
        },
      ],
    },
    {
      id: 'about-party',
      label: 'Ask about the party',
      variants: [
        {
          id: 'confronted',
          requiresClues: ['party-seating-chart'],
          lines: [
            { speaker: 'detective', text: 'Staff say you and Julian had words near the bar. A glass was knocked over.' },
            { speaker: 'suspect', text: "I'm clumsy when I'm irritated. It happens at every function I've ever attended. It was nothing — a scheduling disagreement, not the stuff of headlines." },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "A perfectly ordinary evening celebrating fifteen years of a partnership I am now apparently expected to have murdered my way out of." },
          ],
        },
      ],
    },
  ],
  evidence: [
    {
      clueId: 'security-logbook',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['renata-alibi-broken'],
          lines: [{ speaker: 'suspect', text: "Yes, I know what the logbook says. I've already conceded I stepped out. I have nothing further to add." }],
        },
        {
          id: 'break',
          lines: [
            { speaker: 'detective', text: 'The stairwell door on Floor 4 was used at 11:39. Nobody swiped back in downstairs after. You said you never left the bar.' },
            { speaker: 'suspect', text: 'For the first time, she is quiet a beat too long.' },
            { speaker: 'suspect', text: "...Fine. I stepped out. Fifteen minutes, perhaps. I needed air and I didn't think it worth mentioning, because it isn't. People leave bars, Detective. It's rather the point of them, eventually." },
            { speaker: 'suspect', text: 'She does not explain where, exactly, she went for that air.' },
          ],
          setsFlags: ['renata-alibi-broken'],
        },
      ],
    },
    {
      clueId: 'diane-testimony',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['renata-alibi-broken'],
          lines: [{ speaker: 'suspect', text: "The woman next door and her green dress. Yes, I heard. I've already told you what I was doing." }],
        },
        {
          id: 'break',
          lines: [
            { speaker: 'detective', text: "A witness saw a woman in a green dress near Room 412 around 11:39. You wore green tonight." },
            { speaker: 'suspect', text: "So did at least three other women at that party, I'd wager, and half the drapery in this hotel. But — yes. I was in the hallway briefly. I did not go into that room." },
            { speaker: 'suspect', text: "I have told you what happened. I stepped out. I came back. I would like very much for that to be the end of it." },
          ],
          setsFlags: ['renata-alibi-broken'],
        },
      ],
    },
    {
      clueId: 'victims-phone',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: 'She reads the unsent text without any visible reaction, which is itself a kind of reaction.' },
            { speaker: 'suspect', text: "Julian was upset. I was going to smooth it over in the morning, as adults do, in meetings, with lawyers present if necessary. I never got the chance, apparently — for reasons that have nothing to do with me." },
          ],
        },
      ],
    },
    {
      clueId: 'torn-green-fabric',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Green silk. How specific. I'd suggest checking the dinner's dress code before you accuse a swatch of fabric of murder, Detective." },
            { speaker: 'suspect', text: 'Her composure is very good. Not perfect. Very good.' },
          ],
        },
      ],
    },
    {
      clueId: 'keycard-log',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "I couldn't tell you the first thing about how the staff manage their key inventory. That's rather the point of having staff." },
          ],
        },
      ],
    },
    {
      clueId: 'letter-opener',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "That belonged to Julian. A gift, I believe, from some minor dignitary at a ribbon-cutting years ago. I never imagined it would end up... like that." },
          ],
        },
      ],
    },
  ],
  defaultEvidenceReaction: [
    { speaker: 'suspect', text: "She glances at it with practiced disinterest. \"I don't see what that has to do with me, Detective.\"" },
  ],
  farewell: 'Renata returns her attention to the martini, composed as ever — though she does not, you notice, actually drink it.',
};
