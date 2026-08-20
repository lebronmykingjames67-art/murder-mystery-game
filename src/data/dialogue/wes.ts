import type { SuspectDialogue } from '../../types';

export const wesDialogue: SuspectDialogue = {
  suspectId: 'wes',
  greetings: [
    {
      forbidsFlags: ['greeted:wes'],
      lines: [
        { speaker: 'suspect', text: "Detective! Wes — I've been on this bar since six. Figured someone would come talk to me eventually, given, well." },
        { speaker: 'suspect', text: "He gestures vaguely upward, toward the floors above." },
        { speaker: 'suspect', text: "Ask away. I see a lot from back here, whether I mean to or not." },
      ],
      setsFlags: ['greeted:wes'],
    },
    {
      requiresFlags: ['renata-alibi-broken'],
      lines: [{ speaker: 'suspect', text: "He looks a little sheepish. \"Back again, huh. Guess I've got a bit of a guilty conscience tonight.\"" }],
    },
    {
      requiresFlags: ['greeted:wes'],
      lines: [{ speaker: 'suspect', text: 'What else can I get you, Detective? Figuratively speaking.' }],
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
            { speaker: 'suspect', text: "Mr. Voss? Not really my regular. He'd come down for the odd scotch, tip fine, never much of a talker. Seemed stressed tonight, actually, now that you mention it." },
          ],
        },
      ],
    },
    {
      id: 'about-renata',
      label: "Ask about Renata Cole's evening",
      variants: [
        {
          id: 'broken',
          requiresFlags: ['renata-alibi-broken'],
          lines: [
            { speaker: 'suspect', text: "Yeah, I already told you the real version. She stepped out for a bit, came back quiet. I wasn't trying to lie to you, Detective, I just — she's always been decent to me. Didn't want to hand you something on a hunch." },
          ],
        },
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Renata? Yeah, she was right here at the bar practically the whole night. Great tipper, that one. Always has been, since I started." },
          ],
          addsClues: ['wes-initial-cover'],
        },
      ],
    },
    {
      id: 'about-party',
      label: 'Ask about the party earlier',
      requiresClues: ['party-seating-chart'],
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "That anniversary dinner? Started civil enough. Then Ms. Cole and Mr. Voss had some kind of spat near the service end of the bar — she knocked a glass right off the rail. I swept it up so it wouldn't become A Whole Thing." },
            { speaker: 'suspect', text: "Didn't hear what it was about. Wasn't really trying to." },
          ],
        },
      ],
    },
    {
      id: 'about-marcus',
      label: 'Ask if he knows the guest in 505',
      requiresClues: ['fake-checkin'],
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: '"Ellison"? Sent a whiskey soda up once, few nights back. Quiet guy, tipped through room service, never came down himself. Didn\'t know he was anybody\'s brother.' },
          ],
        },
      ],
    },
    {
      id: 'about-job',
      label: 'Ask how long he\'s worked here',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Six years behind this exact bar. You learn to read a room fast in this job — who's celebrating, who's hiding something, who's about to cry into their whiskey." },
            { speaker: 'suspect', text: "Tonight's the first time I've had no idea what to make of the room at all." },
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
          lines: [{ speaker: 'suspect', text: "Yeah. That's the door I figured you'd find eventually. I already told you what I saw." }],
        },
        {
          id: 'break',
          lines: [
            { speaker: 'detective', text: 'The fire stairwell door on Floor 4 was used at 11:39. You told me Renata never left the bar.' },
            { speaker: 'suspect', text: 'He sets down the glass he was drying.' },
            { speaker: 'suspect', text: "Okay — okay. She stepped out for maybe fifteen minutes, somewhere around eleven-thirty, eleven-forty-five. Said she needed air. Came back a little quiet, a little flushed. I didn't think anything of it at the time — people step out." },
            { speaker: 'suspect', text: "I wasn't about to volunteer that over nothing, you understand? She's never been anything but good to me." },
          ],
          setsFlags: ['renata-alibi-broken'],
          addsClues: ['wes-account-broken'],
        },
      ],
    },
    {
      clueId: 'diane-testimony',
      variants: [
        {
          id: 'repeat',
          requiresFlags: ['renata-alibi-broken'],
          lines: [{ speaker: 'suspect', text: "Yeah, I heard about the neighbor's story too. Matches what I already told you." }],
        },
        {
          id: 'break',
          lines: [
            { speaker: 'detective', text: 'A guest on Floor 4 saw a woman in green near Room 412 right around when you say Renata was gone.' },
            { speaker: 'suspect', text: 'He winces.' },
            { speaker: 'suspect', text: "Yeah. Alright. She did step away — about fifteen minutes, said she needed air. I didn't love not telling you that, for what it's worth. She's always tipped me well, looked out for me. Didn't seem fair to hand her to you over a guess." },
          ],
          setsFlags: ['renata-alibi-broken'],
          addsClues: ['wes-account-broken'],
        },
      ],
    },
    {
      clueId: 'victims-phone',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Whoa. That's — yeah, that's not good, huh. I don't know anything about their business stuff. Sounds like more than a spilled drink, though." },
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
            { speaker: 'suspect', text: "Man. I sent a bottle up to that room once, saw a whole desk set like that on the blotter. Didn't think anything of it at the time. Why would you." },
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
            { speaker: 'suspect', text: "Green silk, huh." },
            { speaker: 'suspect', text: 'He glances toward the end of the bar, where Renata is sitting, and doesn\'t finish the thought out loud.' },
          ],
        },
      ],
    },
  ],
  defaultEvidenceReaction: [
    { speaker: 'suspect', text: "He turns it over, shrugs. \"Not really my department, Detective. I just pour the drinks.\"" },
  ],
  farewell: "Wes goes back to polishing a glass that was already clean, the way people do when they need something to do with their hands.",
};
