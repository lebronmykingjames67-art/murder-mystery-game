import type { RadioEvent } from '../types'

/**
 * The Second Voice choice events, in story order. Every one offers Answer / Stay Silent,
 * and — once the tuning key is found early in Act 1 — Switch Frequency, which always dodges
 * both voices for a smaller, safer static gain and a fragment of buried lore.
 */
export const RADIO_EVENTS: Record<string, RadioEvent> = {
  act1_contact: {
    id: 'act1_contact',
    intro: [
      { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Relay Seven, this is Command. Confirm your status, Voss. Over.' },
      { voice: 'B', speaker: 'SECOND VOICE', text: '...Mara. There you are.', warbleMul: 1.3 },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer: "Who is this?"',
        outcome: [
          { voice: 'B', speaker: 'SECOND VOICE', text: 'Finally.', pitchMul: 0.75, roughnessMul: 2.6 },
          { voice: 'B', speaker: 'SECOND VOICE', text: "I mean — hello? Static's bad tonight, isn't it." },
        ],
        staticDelta: -15,
        setFlags: ['act1_answered'],
      },
      {
        kind: 'silent',
        label: 'Say nothing. Wait for Command.',
        outcome: [
          { voice: 'A', speaker: 'COAST GUARD COMMAND', text: "Relay Seven, repeat, confirm status. Beacon's shown active since oh-four-hundred." },
          { voice: 'none', speaker: '', text: "The second voice doesn't repeat itself. It just waits." },
        ],
        staticDelta: 5,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'Both voices vanish into a clean hiss.' },
          {
            voice: 'A',
            speaker: 'UNLISTED FREQUENCY',
            text: "...if you're hearing this, you're not the first. Don't let it finish your sentences.",
          },
        ],
        staticDelta: 10,
        setFlags: ['found_cobb_teaser'],
      },
    ],
  },

  act2_archive: {
    id: 'act2_archive',
    intro: [
      {
        voice: 'A',
        speaker: 'ARCHIVE TAPE — R. OKAFOR',
        text: '...night four. If anyone reviews this: the relay repeats. It always repeats.',
      },
      { voice: 'B', speaker: 'SECOND VOICE', text: "...it's not repeating. I'm right here." },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer: "Okafor? Say something only you\'d know."',
        outcome: [
          { voice: 'B', speaker: 'SECOND VOICE', text: 'Finally.', pitchMul: 0.75, roughnessMul: 2.6 },
          { voice: 'B', speaker: 'SECOND VOICE', text: 'I— why does that matter now.', roughnessMul: 1.8 },
        ],
        staticDelta: -15,
        setFlags: ['act2_archive_answered'],
      },
      {
        kind: 'silent',
        label: 'Let the tape run.',
        outcome: [
          { voice: 'A', speaker: 'ARCHIVE TAPE — R. OKAFOR', text: "...night five. I stopped answering. It got quieter. I don't know if that's better." },
        ],
        staticDelta: 5,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'The tape spools past both voices.' },
          {
            voice: 'A',
            speaker: 'UNLISTED FREQUENCY',
            text: 'Three technicians. Same rule, same handwriting. Ask why the handwriting keeps changing.',
          },
        ],
        staticDelta: 10,
        setFlags: ['found_archive_teaser'],
      },
    ],
  },

  act2_delphine: {
    id: 'act2_delphine',
    intro: [
      {
        voice: 'A',
        speaker: 'COAST GUARD COMMAND',
        text: 'Relay Seven, this is Command. Confirm your status and prepare for extraction at 0400. Do you copy?',
      },
      {
        voice: 'B',
        speaker: 'DELPHINE',
        text: "Mara? It's — it's really loud in here. Is that you? I've been trying to find the — the right station for so long—",
        warbleMul: 1.2,
      },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer: "Delphine?"',
        outcome: [
          { voice: 'B', speaker: 'DELPHINE', text: 'Finally.', pitchMul: 0.75, roughnessMul: 2.6 },
          { voice: 'B', speaker: 'DELPHINE', text: "—sorry, static. Yes. It's me. I've missed you so much." },
        ],
        staticDelta: -15,
        setFlags: ['act2_delphine_answered'],
      },
      {
        kind: 'silent',
        label: 'Stay silent.',
        outcome: [
          { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Relay Seven, extraction is scheduled. Confirm when ready.' },
          { voice: 'B', speaker: 'DELPHINE', text: "...why won't you just—", roughnessMul: 1.4, silenceMs: 900 },
        ],
        staticDelta: 5,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'Both voices vanish.' },
          {
            voice: 'A',
            speaker: "UNLISTED FREQUENCY — COBB'S LOG",
            text: "...I switched away from her once. She didn't forgive it. Neither did I.",
          },
        ],
        staticDelta: 10,
        setFlags: ['found_cobb_log_early'],
      },
    ],
  },

  act2_tower: {
    id: 'act2_tower',
    intro: [
      { voice: 'A', speaker: 'COAST GUARD COMMAND', text: "Command to Voss, how's that antenna. Weather's turning — don't linger." },
      { voice: 'B', speaker: 'YOUR OWN VOICE', text: "...don't linger. Don't linger. Mara, don't—", warbleMul: 1.8, roughnessMul: 1.5 },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer: "...Hello?"',
        outcome: [
          { voice: 'B', speaker: 'YOUR OWN VOICE', text: 'Finally.', pitchMul: 0.8, roughnessMul: 2.4 },
          { voice: 'B', speaker: 'YOUR OWN VOICE', text: 'You always do finish it for me.' },
        ],
        staticDelta: -18,
        setFlags: ['act2_tower_answered'],
      },
      {
        kind: 'silent',
        label: 'Say nothing. Keep working.',
        outcome: [
          { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Voss, you still with me?' },
          { voice: 'none', speaker: '', text: 'It sounded exactly like you. That part does not leave.' },
        ],
        staticDelta: 5,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'You retune past your own voice.' },
          { voice: 'A', speaker: 'UNLISTED FREQUENCY', text: 'A burst of dead air, then, barely: it learns the shape of whoever is listening.' },
        ],
        staticDelta: 10,
        setFlags: ['found_tower_teaser'],
      },
    ],
  },

  act3_cobb_handset: {
    id: 'act3_cobb_handset',
    intro: [
      { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Command to any station on this relay. If someone is down there, respond.' },
      { voice: 'B', speaker: 'COBB', text: '...bit cold down here. Is Command finally answering? Tell them I found the frequency. Tell them—' },
    ],
    choices: [
      {
        kind: 'answer',
        label: "Answer: \"Cobb, it's Mara. I'm here.\"",
        outcome: [
          { voice: 'B', speaker: 'COBB', text: 'Finally.', pitchMul: 0.75, roughnessMul: 2.6 },
          { voice: 'B', speaker: 'COBB', text: 'Then help me finish it.' },
        ],
        staticDelta: -18,
        setFlags: ['act3_cobb_answered'],
      },
      {
        kind: 'silent',
        label: 'Say nothing.',
        outcome: [
          { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Repeat, this is Command, respond if you are able.' },
          { voice: 'none', speaker: '', text: "Cobb's logbook is three feet away. He isn't." },
        ],
        staticDelta: 5,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'The handset dissolves back to hiss.' },
          {
            voice: 'A',
            speaker: 'UNLISTED FREQUENCY — COBB, EARLIER',
            text: 'The trick is, it only ever finishes sentences you already started.',
          },
        ],
        staticDelta: 10,
        setFlags: ['found_cobb_basement_teaser'],
      },
    ],
  },

  act3_confrontation: {
    id: 'act3_confrontation',
    intro: [
      { voice: 'none', speaker: '', text: "The static doesn't sound like static anymore." },
      { voice: 'B', speaker: 'IT', text: 'You keep running from a room that only wants to talk.', warbleMul: 1.6 },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer: "What do you want?"',
        outcome: [
          { voice: 'B', speaker: 'IT', text: 'Finally.', pitchMul: 0.7, roughnessMul: 2.8 },
          { voice: 'B', speaker: 'IT', text: "Just to finish. That's all any of us want, isn't it." },
        ],
        staticDelta: -20,
        setFlags: ['act3_confront_answered'],
      },
      {
        kind: 'silent',
        label: 'Keep walking.',
        outcome: [{ voice: 'none', speaker: '', text: "You keep walking. It doesn't follow. It doesn't need to." }],
        staticDelta: 8,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: "You spin the dial until the voice can't find the frequency." },
          {
            voice: 'A',
            speaker: 'UNLISTED FREQUENCY — WARTIME ARCHIVE',
            text: 'Transmitting grief as signal, phase two. Subject compliant.',
          },
        ],
        staticDelta: 10,
        setFlags: ['found_wartime_teaser'],
      },
    ],
  },

  act4_early: {
    id: 'act4_early',
    intro: [
      { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'All station personnel, this is Command. Final evacuation window opens at first light. Coordinates to follow.' },
      { voice: 'B', speaker: 'DELPHINE', text: "Mara, I don't — it's so much louder in here now. I don't know which way is out.", warbleMul: 1.4 },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer: "Hold on, I\'m coming."',
        outcome: [
          { voice: 'B', speaker: 'DELPHINE', text: 'Finally.', pitchMul: 0.75, roughnessMul: 2.6 },
          { voice: 'B', speaker: 'DELPHINE', text: "Don't let them make you leave without me." },
        ],
        staticDelta: -20,
        setFlags: ['act4_early_answered'],
      },
      {
        kind: 'silent',
        label: 'Say nothing.',
        outcome: [
          { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Command to all stations, confirm evacuation readiness.' },
          { voice: 'B', speaker: 'DELPHINE', text: '...Mara—', roughnessMul: 1.6, silenceMs: 1000 },
        ],
        staticDelta: 8,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'You hold the dial steady between them.' },
          {
            voice: 'A',
            speaker: 'UNLISTED FREQUENCY — COBB, NEAR THE END',
            text: 'It never lies about being lonely. That part is real. That is the trap.',
          },
        ],
        staticDelta: 10,
        setFlags: ['found_act4_teaser'],
      },
    ],
  },

  act4_climax: {
    id: 'act4_climax',
    intro: [
      {
        voice: 'A',
        speaker: 'COAST GUARD COMMAND',
        text: 'Command, final call. Relay Seven, if you can hear this, get to the boat. We are not holding past first light.',
      },
      {
        voice: 'B',
        speaker: 'DELPHINE',
        text: "Mara, please. Don't leave me in the static again. Eleven years is long enough. Please just say yes.",
        warbleMul: 1.1,
      },
    ],
    choices: [
      {
        kind: 'answer',
        label: "Answer: \"Yes. I'm not leaving you.\"",
        outcome: [
          { voice: 'B', speaker: 'DELPHINE', text: 'Finally.', pitchMul: 0.65, roughnessMul: 3 },
          { voice: 'B', speaker: 'DELPHINE', text: 'You always finish my sentences for me.', roughnessMul: 2.2 },
        ],
        staticDelta: -30,
        setFlags: ['act4_climax_answered'],
      },
      {
        kind: 'silent',
        label: 'Say nothing. Let Command\'s order stand.',
        outcome: [
          { voice: 'A', speaker: 'COAST GUARD COMMAND', text: 'Copy, Relay Seven. Hold your position, we are coming to you.' },
          { voice: 'none', speaker: '', text: 'You let the silence answer for you. It costs something. It always does.' },
        ],
        staticDelta: 15,
        setFlags: ['act4_climax_silent'],
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [
          { voice: 'none', speaker: '', text: 'You turn the dial past both of them, all the way to the end of the band.' },
          {
            voice: 'A',
            speaker: 'UNLISTED FREQUENCY — WARTIME ARCHIVE',
            text: 'Transmission trial eleven. Grief carries further than any signal we have built. Do not let the subject answer.',
          },
        ],
        staticDelta: 18,
        setFlags: ['act4_climax_switch'],
      },
    ],
  },

  act4_final_whisper: {
    id: 'act4_final_whisper',
    intro: [
      { voice: 'none', speaker: '', text: 'One last carrier wave, thin as thread.' },
      { voice: 'B', speaker: '???', text: '...almost. Just a little further.', warbleMul: 1.9 },
    ],
    choices: [
      {
        kind: 'answer',
        label: 'Answer without a word.',
        outcome: [
          { voice: 'B', speaker: '???', text: 'Finally.', pitchMul: 0.75, roughnessMul: 2.4 },
          { voice: 'none', speaker: '', text: "You don't know, afterward, if you meant to." },
        ],
        staticDelta: -10,
        setFlags: ['act4_whisper_answered'],
      },
      {
        kind: 'silent',
        label: 'Let it run out.',
        outcome: [{ voice: 'none', speaker: '', text: 'You let the thread run out on its own.' }],
        staticDelta: 8,
      },
      {
        kind: 'switch',
        label: 'Switch frequency.',
        requiresFlag: 'has_tuning_key',
        outcome: [{ voice: 'none', speaker: '', text: 'You turn the dial past it, gently, like closing a door without slamming it.' }],
        staticDelta: 8,
        setFlags: ['act4_whisper_switch'],
      },
    ],
  },
}
