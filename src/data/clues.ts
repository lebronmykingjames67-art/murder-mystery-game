import type { Clue, Contradiction } from '../types';

export const clues: Clue[] = [
  {
    id: 'coroner-note',
    name: "Hotel Doctor's Note",
    category: 'physical',
    icon: 'note',
    shortDescription: 'Estimated time of death: 11:20–11:50 PM.',
    detail:
      "Dr. Amara Feld, the physician on the hotel's after-hours call list, examined the body before you arrived. Her handwritten note estimates time of death between 11:20 PM and 11:50 PM, based on body temperature and lividity. \"Rough window,\" she wrote, \"but I'd stake my license on it being within those thirty minutes.\"",
    foundIn: 'Room 412, on the writing desk',
  },
  {
    id: 'letter-opener',
    name: 'Engraved Letter Opener',
    category: 'physical',
    icon: 'blade',
    shortDescription: "The murder weapon — Julian's own, engraved J.V.",
    detail:
      "A brass letter opener, its blade dulled by a wipe that didn't quite finish the job. The handle is engraved 'J.V.' — it belonged to Julian Voss himself, part of a desk set that's now missing this one piece. Whoever did this didn't bring a weapon. They found one in the room, in the heat of the moment.",
    foundIn: "Room 412, beside the desk",
    relatedSuspects: ['renata', 'marcus', 'priya'],
  },
  {
    id: 'staged-robbery',
    name: 'A Robbery That Wasn\'t',
    category: 'physical',
    icon: 'drawer',
    shortDescription: 'Drawers ransacked, but wallet and watch untouched.',
    detail:
      "Every drawer in the room stands open, papers spilled across the floor like someone was searching for something — or wanted it to look that way. But Julian's wallet sits in plain sight on the nightstand, three hundred dollars still folded inside it, and a gold watch worth ten times that is still on his wrist. No burglar leaves cash and a watch behind.",
    foundIn: 'Room 412',
  },
  {
    id: 'victims-phone',
    name: "Julian's Phone",
    category: 'physical',
    icon: 'phone',
    shortDescription: 'An 8 AM audit meeting, and an unsent text to Renata.',
    detail:
      'The screen is still on. A calendar reminder reads: "8:00 AM — Meet w/ Halvorsen & Pruitt (Auditors) — Renata\'s numbers." Below it, a text message to Renata Cole sits in the drafts folder, never sent: "We need to talk before tomorrow. Don\'t make this harder than —" It cuts off there.',
    foundIn: "Room 412, on the nightstand",
    relatedSuspects: ['renata'],
  },
  {
    id: 'undamaged-lock',
    name: 'Undamaged Door Lock',
    category: 'physical',
    icon: 'lock',
    shortDescription: 'No forced entry — the killer had a keycard.',
    detail:
      "You run a finger along the electronic lock's faceplate. No pry marks, no scratches, nothing forced. The little green light blinks patiently, exactly as it should. Whoever came through this door either had a keycard of their own, or Julian let them in himself.",
    foundIn: 'Room 412, the entry door',
  },
  {
    id: 'torn-green-fabric',
    name: 'Torn Green Fabric',
    category: 'physical',
    icon: 'fabric',
    shortDescription: 'A scrap of green silk snagged on the stairwell door.',
    detail:
      "Caught in the hinge of the fire stairwell door, a few feet from Room 412: a small scrap of dark green silk, torn clean from something — a dress, a scarf, something with weight to the fabric. Whoever it belonged to left in a hurry, and they didn't take the elevator.",
    foundIn: 'Floor 4, the fire stairwell landing',
    relatedSuspects: ['renata'],
  },
  {
    id: 'scuff-heelprint',
    name: 'Faint Heel Print',
    category: 'physical',
    icon: 'footprint',
    shortDescription: "A small heel print near the desk — not a man's shoe.",
    detail:
      "Pressed faintly into the carpet near the overturned desk chair: a heel print, narrow and small — a woman's dress shoe, by the look of it. Whoever stood here wasn't a large man in work boots. It's not enough on its own, but it narrows the field.",
    foundIn: 'Room 412, near the desk',
  },
  {
    id: 'wine-glasses',
    name: 'Two Wine Glasses',
    category: 'physical',
    icon: 'glass',
    shortDescription: 'An open bottle and two glasses — Julian had a visitor.',
    detail:
      "A bottle of Barolo, three-quarters empty, sits on the side table next to two glasses — one with a faint trace of lipstick on the rim. Whatever happened later, Julian had company earlier in the evening, and it was someone comfortable enough to share a bottle of his good wine.",
    foundIn: 'Room 412, the side table',
    relatedSuspects: ['priya'],
  },
  {
    id: 'keycard-log',
    name: 'Keycard Access Log',
    category: 'physical',
    icon: 'printout',
    shortDescription: 'Room 412 was opened at 11:31 PM by a staff master card.',
    detail:
      "A printout from the door's electronic lock, pulled by hotel security. The last entry before your own: 11:31 PM, opened by a card registered as \"Housekeeping Master 3.\" Not Julian's own key. Not a guest key at all. Someone used a staff card to get into that room.",
    foundIn: 'Lobby, Security Office',
  },
  {
    id: 'security-logbook',
    name: "Night Guard's Logbook",
    category: 'physical',
    icon: 'notebook',
    shortDescription: 'The fire stairwell door on Floor 4 was used at 11:39 PM.',
    detail:
      "The overnight guard keeps a handwritten log of anything his sensors flag. Two entries matter: \"11:05 PM — 4th flr elevator, night mgr (Priya) up, down again 11:12\" and \"11:39 PM — Floor 4 stairwell door sensor tripped, nobody swiped down at lobby level after.\" Someone went down the stairs and slipped out before reaching the ground floor sensor — or left through a floor the guard wasn't watching.",
    foundIn: 'Lobby, Security Office',
    relatedSuspects: ['priya', 'renata'],
  },
  {
    id: 'party-seating-chart',
    name: 'Function Room Seating Chart',
    category: 'physical',
    icon: 'document',
    shortDescription: 'A note about a tense exchange between Julian and Renata.',
    detail:
      "The seating chart from tonight's private investors' dinner has a coffee ring and a staff note scrawled in the margin: \"R. Cole + J. Voss — words near the bar, she knocked over a glass, left early-ish.\" Someone on staff noticed friction between business partners.",
    foundIn: 'Mezzanine, Function Room',
    relatedSuspects: ['renata'],
  },
  {
    id: 'swept-glass',
    name: 'Swept-Up Glass',
    category: 'physical',
    icon: 'shards',
    shortDescription: 'A dustpan of broken glass and a wine stain behind the bar.',
    detail:
      "Behind the bar, tucked out of sight, is a dustpan someone never got around to emptying — broken glass and a dark wine stain on the rag beside it. Consistent with a glass knocked over in an argument, quietly cleaned up so as not to make a scene.",
    foundIn: 'Mezzanine, the Bar',
  },
  {
    id: 'phone-bill-slip',
    name: 'Room 505 Call Log',
    category: 'physical',
    icon: 'printout',
    shortDescription: "A 41-minute outside call from Marcus's room, 11:12–11:53 PM.",
    detail:
      "A guest folio printout from the front desk system: Room 505 placed an outside call at 11:12 PM to a law firm's after-hours line, lasting 41 minutes — ending at 11:53 PM. If the hotel's phone system is right, whoever was in that room was on the phone through the entire window the doctor gave you.",
    foundIn: 'Lobby, Front Desk',
    relatedSuspects: ['marcus'],
  },
  {
    id: 'torn-trust-docs',
    name: 'Torn Trust Documents',
    category: 'physical',
    icon: 'document',
    shortDescription: 'Marcus was written out of the family trust — because of Julian.',
    detail:
      'Balled up in the wastebasket, torn into quarters: a letter from a family trust attorney, addressed to Marcus Voss. Pieced together, one line stands out: "...at Julian\'s recommendation, the trustees have elected to remove Marcus Voss as beneficiary, effective the date of your father\'s passing." A motive, in black and white.',
    foundIn: 'Room 505',
    relatedSuspects: ['marcus'],
  },
  {
    id: 'fake-checkin',
    name: 'The Guest Registered as "Ellison"',
    category: 'physical',
    icon: 'document',
    shortDescription: 'Room 505 was booked under a false name.',
    detail:
      'The guest registry shows Room 505 checked in three days ago under the name "David Ellison," paid in cash, no vehicle on file. Except the signature on the card, once you\'ve seen it elsewhere, is unmistakably Marcus Voss\'s. He didn\'t want anyone at The Grand Meridian — least of all his brother — knowing he was here.',
    foundIn: 'Lobby, Front Desk',
    relatedSuspects: ['marcus'],
  },
  {
    id: 'master-key',
    name: 'Tarnished Brass Key',
    category: 'physical',
    icon: 'key',
    shortDescription: 'An old master key, mislabeled on the housekeeping pegboard.',
    detail:
      "Hanging on the housekeeping pegboard, mislabeled under a tag for a supply closet that doesn't exist: an old brass master key, worn smooth. It looks like it opens something the newer electronic cards don't reach — the maintenance room, maybe.",
    foundIn: 'Floor 3, Housekeeping Storage',
  },
  {
    id: 'rooftop-napkin',
    name: 'Cocktail Napkin & Champagne Flute',
    category: 'physical',
    icon: 'napkin',
    shortDescription: "Renata's handwriting, doing the numbers, hidden on the roof.",
    detail:
      "Tucked behind a planter on the closed rooftop terrace: a single champagne flute with a lipstick mark, and a crumpled cocktail napkin covered in cramped handwriting — figures, subtracted and re-subtracted, circled twice. It matches the handwriting on Renata Cole's expense reports. Someone came up here to think, alone, and do arithmetic they didn't want anyone to see.",
    foundIn: 'Rooftop Terrace',
    relatedSuspects: ['renata'],
  },
  {
    id: 'renata-alibi',
    name: "Renata's Alibi",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: '"I was at the bar with Wes all night. I never left."',
    detail:
      '"I was at the bar, Detective. Ask the bartender — I was there practically the entire night, nursing the same martini, until well past midnight. I never left." Renata\'s account places her at the bar continuously through the time of the murder.',
    foundIn: 'Mezzanine, the Bar',
    relatedSuspects: ['renata'],
  },
  {
    id: 'wes-initial-cover',
    name: "Wes's Account (First Telling)",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: '"Renata was right here all night, practically."',
    detail:
      '"Renata? Yeah, she was right here at the bar practically the whole night. Great tipper, that one." Wes backs up her story without much thought — the easy answer, the loyal one.',
    foundIn: 'Mezzanine, the Bar',
    relatedSuspects: ['renata', 'wes'],
  },
  {
    id: 'wes-account-broken',
    name: "Wes's Account (Revised)",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: 'Renata actually stepped away around 11:30–11:45 PM.',
    detail:
      '"Okay — okay. She stepped out for maybe fifteen minutes, somewhere around 11:30, 11:45. Said she needed air. She came back a little quiet, a little flushed. I didn\'t think anything of it — people step out. I wasn\'t about to volunteer that over nothing." Wes finally admits Renata left the bar during the murder window.',
    foundIn: 'Mezzanine, the Bar',
    relatedSuspects: ['renata', 'wes'],
  },
  {
    id: 'diane-testimony',
    name: "Diane's Account",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: 'Raised voices, a thump, and a woman in green near 412.',
    detail:
      '"Oh, I do sleep light, dear. Around half past eleven I heard voices through the wall — raised, not shouting exactly, but tense. Then a thump, like someone dropped a suitcase. I checked my travel clock, the one my late husband gave me — 11:38, it said. I looked out just after and saw a woman hurrying off toward the stairwell end of the hall. Green dress. Lovely fabric, actually, I remember thinking that even then. Then I must have dozed off again."',
    foundIn: 'Room 410',
    relatedSuspects: ['renata'],
  },
  {
    id: 'priya-initial-denial',
    name: "Priya's Statement (First Telling)",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: '"I checked in on our VIP guests. Nothing unusual."',
    detail:
      '"I make my rounds, Detective, that\'s all. I looked in on all our VIP guests earlier in the evening — a courtesy call, nothing more. I didn\'t see anything unusual with Mr. Voss." Priya is careful, controlled, and — as it turns out — not quite telling the whole truth.',
    foundIn: 'Lobby, Front Desk',
    relatedSuspects: ['priya'],
  },
  {
    id: 'priya-affair-admission',
    name: "Priya's Admission",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: 'She and Julian were involved. She saw him at 11:05 PM.',
    detail:
      '"Fine. Yes. Julian and I — it wasn\'t nothing, whatever that\'s worth now. I brought him a bottle up around eleven, we talked for a few minutes. He seemed distracted, on edge about some work thing, but he was very much alive when I left him — 11:10, maybe 11:12 at the latest. I went straight back down to the desk. I was on a complaint call from a guest in 308 from about 11:15 until after midnight, if you want to check the logs." Priya finally tells the truth about the affair — and gives herself a verifiable alibi in the process.',
    foundIn: 'Lobby, Front Desk',
    relatedSuspects: ['priya'],
  },
  {
    id: 'marcus-denial',
    name: "Marcus's Statement (First Telling)",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: '"I barely knew my brother. I wasn\'t even thinking about him."',
    detail:
      '"Julian and I weren\'t close, Detective. Haven\'t spoken in years, honestly. I\'m just here for... personal reasons. I wasn\'t even thinking about him tonight." Marcus won\'t meet your eyes when he says it.',
    foundIn: 'Room 505',
    relatedSuspects: ['marcus'],
  },
  {
    id: 'marcus-alias-admission',
    name: "Marcus's Admission",
    category: 'testimonial',
    icon: 'quote',
    shortDescription: 'He admits the alias, the debt, and the disinheritance.',
    detail:
      '"Alright — fine! Yes, I checked in under a false name because I didn\'t want Julian to know I was in the building. He got me cut out of our father\'s trust, did you know that? Called me a liability. I came here to confront him about it, face to face, once and for all. I was going to march up there after my call with my lawyer — but by the time I hung up, security was already sealing the floors. I never got the chance." Marcus admits his motive and his lie, but insists his alibi — the 41-minute call — holds.',
    foundIn: 'Room 505',
    relatedSuspects: ['marcus'],
  },
];

export const contradictions: Contradiction[] = [
  {
    id: 'contradiction-bar-alibi',
    clueIds: ['renata-alibi', 'security-logbook'],
    title: "The Bar Alibi Doesn't Hold Up",
    explanation:
      "Renata claims she never left the bar all night. But the night guard's log shows the Floor 4 fire stairwell door was used at 11:39 PM — during the doctor's window for time of death — and nobody swiped in at the lobby level afterward. If she truly never left the bar, that door swings open on its own.",
    unlocksFlag: 'contradiction:bar-alibi-known',
  },
  {
    id: 'contradiction-wes-breaks',
    clueIds: ['renata-alibi', 'wes-account-broken'],
    title: 'Wes Breaks Her Cover',
    explanation:
      "Renata says she was at the bar the entire night. But Wes, once pressed, admits she stepped away for roughly fifteen minutes right around the time of the murder, and came back looking flushed and quiet. Her own bartender contradicts her.",
    unlocksFlag: 'contradiction:wes-breaks-known',
  },
  {
    id: 'contradiction-woman-in-green',
    clueIds: ['renata-alibi', 'diane-testimony'],
    title: 'The Woman in Green',
    explanation:
      "Diane Faraday describes a woman in a green dress hurrying away from Room 412 around 11:39 PM — toward the stairwell, not the elevator. Renata wore a dark green dress to the investors' dinner. And a scrap of green silk was found snagged on that very stairwell door.",
    unlocksFlag: 'contradiction:woman-in-green-known',
  },
  {
    id: 'contradiction-two-glasses',
    clueIds: ['priya-initial-denial', 'wine-glasses'],
    title: 'Two Glasses, One Story',
    explanation:
      "Priya claims she never saw anything unusual and made only a brief courtesy call. But there are two wine glasses in Room 412, one marked with lipstick, and a bottle of Julian's good Barolo three-quarters gone. Someone stayed a while.",
  },
  {
    id: 'contradiction-disinherited',
    clueIds: ['marcus-denial', 'torn-trust-docs'],
    title: 'The Disinherited Brother',
    explanation:
      'Marcus claims he "barely knew" his brother and wasn\'t thinking about him tonight. But torn trust documents in his wastebasket show Julian personally recommended he be cut out of their father\'s estate — a wound that clearly hasn\'t closed.',
  },
];
