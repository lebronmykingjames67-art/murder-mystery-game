import type { PageDef } from '../types'

/** Story pages are always reachable and gate nothing. Hidden pages (6 total) unlock the secret ending. */
export const PAGES: Record<string, PageDef> = {
  rule_corkboard: {
    id: 'rule_corkboard',
    title: 'Pinned to the corkboard',
    hidden: false,
    body: [
      'DO NOT ANSWER THE SECOND VOICE. IT ONLY WANTS TO FINISH THE SENTENCE.',
      'Underlined four times, in at least three different hands. One of them looks close to yours, if your hand were shaking.',
      'Below it, smaller: "It is very patient. You will not be."',
    ],
  },

  cobb_final_log: {
    id: 'cobb_final_log',
    title: "Warden Cobb's logbook — final entries",
    hidden: false,
    body: [
      "Day 340. Command thinks I'm still doing maintenance sweeps. I stopped logging the real ones weeks ago.",
      "Day 344. It knows her name now. I never said it out loud down here. I checked the tapes twice.",
      'Day 351. I understand what the rule means now. Not "it will hurt you." "It will finish you." There is a difference and I did not used to know it.',
      "Day 359. I'm going to answer. If it can sound this much like her, some part of it has to be her. I've decided that's enough.",
      '— no further entries —',
    ],
  },

  page_dock_bottle: {
    id: 'page_dock_bottle',
    title: 'A note, sealed in a tin by the dock',
    hidden: true,
    body: [
      'If you found this, you came by boat, which means the road washed out again, which means it is still eleven years ago as far as this place is concerned.',
      'Bring your own light. The tower keeps its own hours.',
      '— left by the first one, whoever that was —',
    ],
  },

  page_fusebox: {
    id: 'page_fusebox',
    title: 'Taped inside the fuse box',
    hidden: true,
    body: [
      'Breaker 4 trips itself around 2 a.m. every night. Not a fault. Checked it three times.',
      'It trips right when the second frequency gets strong enough to carry. I think the station is trying to stop itself.',
      'Leave breaker 4 alone if you can stand the dark.',
    ],
  },

  page_archive_drawer: {
    id: 'page_archive_drawer',
    title: 'Folded inside a reel case',
    hidden: true,
    body: [
      'Personnel roster, eleven years, redacted past the third name.',
      'Every technician requested this posting. Nobody was assigned it.',
      'Somewhere upstairs there is a form asking "reason for interest in Relay Seven." Every answer on file is a name of someone dead.',
    ],
  },

  page_tower_box: {
    id: 'page_tower_box',
    title: 'Inside a weatherproof box at the tower base',
    hidden: true,
    body: [
      'Antenna was not built to spec. The extra dish, the one facing inland instead of out to sea — that one predates the relay station by decades.',
      'Wartime coastal listening post, before it was ever a relay. Nobody decommissioned the inland dish. It is still wired in.',
      'It was never built to send messages out. It was built to bring something back.',
    ],
  },

  page_cobb_drawer: {
    id: 'page_cobb_drawer',
    title: "In Cobb's desk drawer, under a photograph",
    hidden: true,
    body: [
      'A photo of a woman who is not Delphine, on the back: "K. — I should have switched the frequency."',
      'A separate scrap, same handwriting, much older ink: "Ask the next one to forgive me for not warning them properly. I could not find the words without saying her name, and I promised myself I would not."',
    ],
  },

  page_basement_loop: {
    id: 'page_basement_loop',
    title: 'Behind a loose panel, the corridor that should not turn this way',
    hidden: true,
    body: [
      'The hallway you are standing in was poured straight, once. There are old blueprints under this panel that agree with you.',
      'The station does not just answer in a voice that isn\'t there. Given enough answers, it rearranges the parts of itself that are.',
      'Whatever project this was originally, "grief" was the transmission medium and "listening" was the vulnerability. Nobody patched the vulnerability. They just stopped writing it down.',
    ],
  },
}

export const HIDDEN_PAGE_IDS = Object.values(PAGES)
  .filter((p) => p.hidden)
  .map((p) => p.id)
