import type { SuspectDialogue } from '../../types';

export const priyaDialogue: SuspectDialogue = {
  suspectId: 'priya',
  greetings: [
    {
      forbidsFlags: ['greeted:priya'],
      lines: [
        { speaker: 'suspect', text: "Detective. Thank you for coming so quickly — I'm Priya Anand, night manager. I'm the one who called you in." },
        { speaker: 'suspect', text: "I want this handled quietly and correctly, in that order. The Grand Meridian has never had so much as a noise complaint make the papers. I'd like to keep it that way, if we can." },
        { speaker: 'detective', text: "I'll need your full cooperation to do that." },
        { speaker: 'suspect', text: "Of course. Ask me anything." },
      ],
      setsFlags: ['greeted:priya'],
    },
    {
      requiresFlags: ['greeted:priya'],
      forbidsFlags: ['priya-affair-revealed'],
      lines: [{ speaker: 'suspect', text: 'Detective. What can I do for you.' }],
    },
    {
      requiresFlags: ['priya-affair-revealed'],
      lines: [{ speaker: 'suspect', text: "Detective. I suppose you have more questions. I'll try to actually answer them this time." }],
    },
  ],
  topics: [
    {
      id: 'about-julian',
      label: 'Ask about Julian Voss',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Mr. Voss has owned a stake in this hotel for eleven years. Comes in maybe once a quarter, always the Executive Suite, always very particular about his coffee." },
            { speaker: 'suspect', text: "He was tense this trip, if I'm honest. More than usual. On his phone constantly." },
          ],
        },
      ],
    },
    {
      id: 'last-seen',
      label: 'Ask when she last saw him',
      variants: [
        {
          id: 'truth',
          requiresFlags: ['priya-affair-revealed'],
          lines: [
            { speaker: 'suspect', text: "I already told you — eleven, ten or eleven, up in 412. I left him alive. That hasn't changed no matter how many times you ask." },
          ],
        },
        {
          id: 'denial',
          lines: [
            { speaker: 'suspect', text: "I make my rounds most nights — a courtesy call on our VIP guests, nothing more. I looked in on Mr. Voss earlier in the evening." },
            { speaker: 'suspect', text: "Nothing unusual. He seemed fine. That's really all there is to it." },
          ],
          addsClues: ['priya-initial-denial'],
        },
      ],
    },
    {
      id: 'about-hotel',
      label: 'Ask about tonight at the hotel',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "We locked the building down the moment the body was found — every exit sealed, every guest accounted for and asked to stay in their room or a common area." },
            { speaker: 'suspect', text: "It's been a very long night for all of us. I'd like it to be over." },
          ],
        },
      ],
    },
    {
      id: 'about-renata',
      label: 'Ask about Renata Cole',
      variants: [
        {
          id: 'broken',
          requiresFlags: ['renata-alibi-broken'],
          lines: [
            { speaker: 'suspect', text: "Renata... she's always been so composed. If her story about the bar doesn't hold together, that troubles me more than I'd like to admit." },
            { speaker: 'suspect', text: "She and Julian built this place up together. I never imagined—" },
            { speaker: 'suspect', text: 'She stops herself there.' },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Ms. Cole is Mr. Voss's business partner. Very controlled, very exacting. Frankly, she scares the junior staff a little." },
            { speaker: 'suspect', text: "I noticed some friction between them tonight at the party. Business partners argue. I didn't think much of it." },
          ],
        },
      ],
    },
    {
      id: 'about-marcus',
      label: 'Ask about the guest in Room 505',
      requiresClues: ['fake-checkin'],
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "\"David Ellison,\" yes. Checked in three nights ago, paid cash, asked not to be disturbed. We don't usually pry — discretion is part of the service here." },
            { speaker: 'detective', text: 'That name is an alias. His real name is Marcus Voss.' },
            { speaker: 'suspect', text: "...Julian's brother? I had no idea. He never once came down to the desk himself — always called up for anything he needed." },
          ],
        },
      ],
    },
  ],
  evidence: [
    {
      clueId: 'wine-glasses',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['priya-affair-revealed'],
          lines: [{ speaker: 'suspect', text: "Yes, I know how that looks. I already told you everything, Detective." }],
        },
        {
          id: 'confession',
          lines: [
            { speaker: 'detective', text: 'Two glasses. One with lipstick on the rim. Julian didn\'t pour himself a second glass of wine, Priya.' },
            { speaker: 'suspect', text: 'She is quiet for a long moment.' },
            { speaker: 'suspect', text: "Fine. Yes. Julian and I — it wasn't nothing, whatever that's worth now." },
            { speaker: 'suspect', text: "I brought him a bottle up around eleven. We talked for a few minutes. He seemed distracted — on edge about some work thing, he wouldn't say what. He was very much alive when I left him. Eleven-ten, maybe eleven-twelve at the latest." },
            { speaker: 'suspect', text: "I went straight back down to the desk. I was on a complaint call from a guest in 308 from about 11:15 until well after midnight, if you want to check the logs. I have nothing left to hide from you now." },
          ],
          setsFlags: ['priya-affair-revealed'],
          addsClues: ['priya-affair-admission'],
        },
      ],
    },
    {
      clueId: 'keycard-log',
      variants: [
        {
          id: 'connects-dots',
          requiresFlags: ['renata-alibi-broken'],
          lines: [
            { speaker: 'suspect', text: 'She studies the printout, and something changes in her face.' },
            { speaker: 'suspect', text: "\"Housekeeping Master 3\" is kept in the top drawer, right here at the desk. I return it there after my rounds — I did that night, around a quarter to eleven." },
            { speaker: 'suspect', text: "The desk isn't always attended every second. Anyone passing through the lobby after that could have taken it. Renata came through here not long after the party started breaking up..." },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "That's one of our staff master cards. I keep it in the desk drawer between uses — it's meant to stay there unless housekeeping signs it out formally." },
            { speaker: 'suspect', text: 'She frowns at the timestamp. "Nobody signed it out that late. It shouldn\'t have been anywhere near Room 412."' },
          ],
        },
      ],
    },
    {
      clueId: 'victims-phone',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: 'She reads the unsent text twice.' },
            { speaker: 'suspect', text: "I didn't know it had gotten this bad between them. He mentioned \"a work thing\" to me, that same night — I assumed it was ordinary business stress. I should have asked more." },
          ],
        },
      ],
    },
    {
      clueId: 'fake-checkin',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "A false name, on my registry." },
            { speaker: 'suspect', text: "I'm embarrassed to say I never verify ID for a returning-seeming guest paying cash. That's a policy I'll be revisiting after tonight." },
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
            { speaker: 'suspect', text: "Green silk... Renata wore a dark green dress to the dinner tonight. I remember complimenting it, actually." },
            { speaker: 'suspect', text: 'She looks unsettled by her own sentence.' },
          ],
        },
      ],
    },
  ],
  defaultEvidenceReaction: [
    { speaker: 'suspect', text: "She studies it for a moment. \"I'm honestly not sure what you'd like me to say about that, Detective.\"" },
  ],
  farewell: 'Priya nods once, already reaching for her paperwork — keeping busy seems to be the only thing holding her together tonight.',
};
