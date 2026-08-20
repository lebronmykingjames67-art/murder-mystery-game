import type { SuspectDialogue } from '../../types';

export const dianeDialogue: SuspectDialogue = {
  suspectId: 'diane',
  greetings: [
    {
      forbidsFlags: ['greeted:diane'],
      lines: [
        { speaker: 'suspect', text: "Oh! A visitor. And a detective, no less — how exciting, in a dreadful sort of way. I'm Diane. Diane Faraday, Room 410, forever and always it feels like at this point." },
        { speaker: 'suspect', text: "I suppose you're here about poor Mr. Voss. Terrible business. I barely slept a wink — well, I did doze off eventually, but barely, beforehand, is what I mean." },
        { speaker: 'suspect', text: 'Sit, sit, if you can find a spot not covered in doilies. Ask away, dear.' },
      ],
      setsFlags: ['greeted:diane'],
    },
    {
      requiresFlags: ['greeted:diane'],
      lines: [{ speaker: 'suspect', text: "Back again! Do sit down. Or don't, I'm not the boss of you." }],
    },
  ],
  topics: [
    {
      id: 'about-julian',
      label: 'Ask what she knew of Julian Voss',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Lovely man, in the hallway sense — held the elevator once, complimented my brooch. We weren't close, you understand, just the sort of neighborly acquaintance you strike up on a long stay." },
            { speaker: 'suspect', text: "He always seemed to be on his telephone. I remember thinking, that man needs a hobby that isn't work. And now — well." },
            { speaker: 'suspect', text: 'She trails off, dabbing at her eyes with a napkin that appears to already have doilies embroidered on it.' },
          ],
        },
      ],
    },
    {
      id: 'about-tonight',
      label: 'Ask what she heard tonight',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Oh, I do sleep light, dear, always have — a blessing and a curse, my husband used to say, God rest him. Around half past eleven I heard voices through the wall. Raised, not shouting exactly, but tense. The kind of tense you can feel through drywall." },
            { speaker: 'suspect', text: "Then a thump — like someone dropped a suitcase, only worse, if that makes sense. It didn't, at the time, either. I checked my travel clock — the one my husband gave me, I do love that clock — and it said 11:38. I remember because I thought, goodness, that's terribly late for a thump." },
            { speaker: 'suspect', text: "I got up and peeked out the peephole, just a moment later, and saw a woman hurrying off down the hall toward the stairwell end. Green dress. Lovely fabric, actually, I remember thinking that even then, isn't that silly." },
            { speaker: 'suspect', text: "And then I'm afraid I must have dozed off again, because the next thing I knew there were an awful lot of people in the hallway and someone was saying the word \"police.\"" },
          ],
          addsClues: ['diane-testimony'],
        },
      ],
    },
    {
      id: 'about-clock',
      label: 'Ask about her travel clock',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Oh, this old thing? My husband gave it to me on our thirtieth anniversary, said a woman who travels as much as I do ought to always know exactly what time it is, wherever she lands." },
            { speaker: 'suspect', text: "I check it constantly. Compulsively, my daughter says. But I promise you, dear, whatever else I might get muddled — and I do get muddled — the time on that clock, I trust completely." },
          ],
        },
      ],
    },
    {
      id: 'about-herself',
      label: 'Ask about her stay at the hotel',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Six weeks now! My condominium's being redone — a whole saga, don't get me started, it involves a contractor named Gary who I have Opinions about." },
            { speaker: 'suspect', text: "The Grand Meridian has been lovely, murder notwithstanding. Wonderful little chocolates on the pillow." },
          ],
        },
      ],
    },
  ],
  evidence: [
    {
      clueId: 'torn-green-fabric',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: 'She peers at it, adjusting her glasses twice.' },
            { speaker: 'suspect', text: "Oh, yes — that could very well be it. That's just the shade, and that lovely weight of silk. I have an eye for fabric, dear, forty years on a sewing circle will do that to a woman." },
          ],
        },
      ],
    },
    {
      clueId: 'coroner-note',
      variants: [
        {
          id: 'default',
          lines: [
            { speaker: 'suspect', text: "Between 11:20 and 11:50, it says? Well, that fits right along with my thump at 11:38, doesn't it. I do love being corroborated. Is that the word? Corroborated." },
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
            { speaker: 'suspect', text: "That stairwell door does squeak terribly, now that you mention it — I've complained about it to housekeeping twice. Never fixed, typical." },
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
            { speaker: 'suspect', text: 'She goes a little pale.' },
            { speaker: 'suspect', text: "Oh my. Oh, that's — I think I'd like to sit back down now, if it's all the same to you." },
          ],
        },
      ],
    },
  ],
  defaultEvidenceReaction: [
    { speaker: 'suspect', text: "She squints at it politely. \"I'm afraid that doesn't ring any bells, dear. But I do like the little pouch you're keeping it all in.\"" },
  ],
  farewell: 'Diane waves you off warmly, already reaching for a paperback with a very dramatic cover.',
};
