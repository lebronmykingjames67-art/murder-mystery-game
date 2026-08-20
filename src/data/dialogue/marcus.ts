import type { SuspectDialogue } from '../../types';

export const marcusDialogue: SuspectDialogue = {
  suspectId: 'marcus',
  greetings: [
    {
      forbidsFlags: ['greeted:marcus'],
      lines: [
        { speaker: 'narration', text: 'The man in Room 505 startles when the door opens, like he was expecting someone else — or dreading it.' },
        { speaker: 'suspect', text: "Yes? Sorry — can I help you?" },
        { speaker: 'detective', text: "I'm the detective looking into what happened tonight. And you're not David Ellison, are you." },
        { speaker: 'suspect', text: "He goes very still." },
        { speaker: 'suspect', text: "...I'd like a lawyer before I say anything else stupid." },
        { speaker: 'detective', text: "You're not under arrest. I just have questions." },
        { speaker: 'suspect', text: "Right. Of course. Questions." },
      ],
      setsFlags: ['greeted:marcus'],
    },
    {
      requiresFlags: ['marcus-revealed'],
      lines: [{ speaker: 'suspect', text: "He looks exhausted, but a little less like he's about to bolt. \"Detective. Go ahead.\"" }],
    },
    {
      requiresFlags: ['greeted:marcus'],
      lines: [{ speaker: 'suspect', text: 'He doesn\'t quite meet your eyes. "What now."' }],
    },
  ],
  topics: [
    {
      id: 'about-julian',
      label: 'Ask about his relationship with Julian',
      variants: [
        {
          id: 'revealed',
          requiresFlags: ['marcus-revealed'],
          lines: [
            { speaker: 'suspect', text: "We were close once. Before our father died, before Julian decided I was a — what was the word the lawyers used — a \"liability\" to the estate." },
            { speaker: 'suspect', text: "I loved my brother. I also hated him a little, near the end. Both things were true." },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Julian and I weren't close, Detective. Haven't really spoken in years, honestly. I'm just here for — personal reasons. I wasn't even thinking about him tonight." },
          ],
          addsClues: ['marcus-denial'],
        },
      ],
    },
    {
      id: 'about-himself',
      label: 'Ask why he checked in under a false name',
      variants: [
        {
          id: 'revealed',
          requiresFlags: ['marcus-revealed'],
          lines: [
            { speaker: 'suspect', text: "I didn't want Julian knowing I was in the building until I was ready. He had a way of getting ahead of things — lawyers, security, whatever it took to keep me at arm's length." },
            { speaker: 'suspect', text: "I just wanted to talk to him myself, for once, without an intermediary." },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "That's — I'd rather not get into that right now, if it's all the same to you." },
          ],
        },
      ],
    },
    {
      id: 'about-alibi',
      label: 'Ask what he was doing tonight',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "I was on the phone most of the night, if you must know. A personal matter. Long call." },
            { speaker: 'suspect', text: "You can check with the front desk, I'm sure they log that sort of thing." },
          ],
        },
      ],
    },
    {
      id: 'about-plans',
      label: 'Ask what he planned to do tonight',
      requiresFlags: ['marcus-revealed'],
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "I was going to go up and see him. Face to face, finally, once I was off the phone with my lawyer — I wanted the trust language straight in my head before I said anything I couldn't take back." },
            { speaker: 'suspect', text: "By the time I hung up, security was already sealing the floors. I never got the chance." },
            { speaker: 'suspect', text: "I know exactly how that sounds. I've had a while to sit here and think about how that sounds." },
          ],
        },
      ],
    },
  ],
  evidence: [
    {
      clueId: 'fake-checkin',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['marcus-revealed'],
          lines: [{ speaker: 'suspect', text: "Yes, I know. I've already told you why." }],
        },
        {
          id: 'reveal',
          lines: [
            { speaker: 'detective', text: 'You checked in three days ago as "David Ellison." Cash, no ID on file. That\'s a strange way to visit your brother.' },
            { speaker: 'suspect', text: 'He sinks onto the edge of the bed.' },
            { speaker: 'suspect', text: "Alright — fine! Yes, I checked in under a false name because I didn't want Julian to know I was here. He got me cut out of our father's trust, did you know that? Called me a \"liability\" to the estate, in writing." },
            { speaker: 'suspect', text: "I came here to confront him about it, face to face, once and for all. That's it. That's the whole terrible secret." },
          ],
          setsFlags: ['marcus-revealed'],
          addsClues: ['marcus-alias-admission'],
        },
      ],
    },
    {
      clueId: 'torn-trust-docs',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['marcus-revealed'],
          lines: [{ speaker: 'suspect', text: "Those are mine, yes. Go ahead and read them if you haven't already. I'm not proud of tearing them up, but I'm not sorry either." }],
        },
        {
          id: 'reveal',
          lines: [
            { speaker: 'detective', text: 'These were in your wastebasket. A trust attorney\'s letter — you were removed as a beneficiary. At Julian\'s recommendation.' },
            { speaker: 'suspect', text: 'He closes his eyes for a second.' },
            { speaker: 'suspect', text: "There it is. Yes. My own brother decided I couldn't be trusted with a cent of our father's money, and made sure the lawyers put it in writing." },
            { speaker: 'suspect', text: "I checked in under a false name so I could talk to him about it without his assistant running interference. That's the truth, all of it, finally." },
          ],
          setsFlags: ['marcus-revealed'],
          addsClues: ['marcus-alias-admission'],
        },
      ],
    },
    {
      clueId: 'victims-phone',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Renata? So it wasn't just me he was ready to cut loose. That's almost funny, in the worst way." },
            { speaker: 'suspect', text: "My brother had a talent for making people expendable right up until the moment it caught up with him." },
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
            { speaker: 'suspect', text: "Our father gave him that desk set when Julian took over the family's first property. I got a watch. Guess which one of us he thought was actually going somewhere." },
            { speaker: 'suspect', text: 'He looks away from it.' },
          ],
        },
      ],
    },
    {
      clueId: 'security-logbook',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Renata was where? Huh. Guess I'm not the only one in this hotel with something to hide tonight." },
          ],
        },
      ],
    },
    {
      clueId: 'diane-testimony',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "A woman in green, near his room. That's not me, obviously — but I won't pretend I'm sorry it isn't pointing my way." },
          ],
        },
      ],
    },
  ],
  defaultEvidenceReaction: [
    { speaker: 'suspect', text: "He glances at it and looks away. \"I don't know anything about that, I'm afraid.\"" },
  ],
  farewell: "Marcus sits back down on the edge of the bed, looking, for the first time all night, like a man with nowhere left to hide anything.",
};
