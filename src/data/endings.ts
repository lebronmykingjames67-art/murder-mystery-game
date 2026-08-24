import type { EndingDef, EndingId } from '../types'
import type { HollowSignalState } from '../engine/GameState'
import { TOTAL_HIDDEN_PAGES } from '../engine/GameState'

export const ENDINGS: Record<EndingId, EndingDef> = {
  'clear-sky': {
    id: 'clear-sky',
    title: 'Clear Sky',
    subtitle: 'You leave the relay dark behind you.',
    body: [
      'The boat is where you left it. The tower keeps its light going for exactly as long as it takes you to reach the water, and then, behind you, it does not.',
      "Command debriefs you at dawn. You give the report you rehearsed on the crossing: equipment failure, isolation, an overactive imagination in a building that has clearly earned one. Nobody asks about the second voice. You do not offer it.",
      "You still hear Delphine sometimes, in the hiss between radio stations, in a dial tone held too long. You have gotten good at not answering. Some nights that feels like strength. Some nights it feels like the exact same kind of leaving you did to her the first time, just slower.",
      'The station stays quiet. As far as you ever hear, it stays quiet for good.',
    ],
  },
  answered: {
    id: 'answered',
    title: 'Answered',
    subtitle: 'The line between you and the voice was never as solid as the wall.',
    body: [
      "You stop being able to tell, toward the end, which of you is asking the questions and which of you is finishing the sentences. It stops feeling like a problem to solve and starts feeling like coming home.",
      "There is no boat in this ending. There is a chair, and a headset, and a very long night that stops being a night and starts being the only shape of time you have left.",
      "Somewhere, years from now, a relay station goes dark mid-broadcast. Somewhere, a technician is sent to restart it, and finds a rule scrawled on the wall in a hand that looks, if you squint, almost like her own.",
      'You will be very patient with her. You have all the time there is.',
    ],
  },
  'real-frequency': {
    id: 'real-frequency',
    title: 'The Real Frequency',
    subtitle: 'You found all six pages. You know what this place actually is.',
    body: [
      'It was never a haunting. It was a program: a wartime listening post that learned, decades before anyone had a word for it, that grief transmits farther and clearer than any signal built on purpose — and that the station itself could be tuned to receive on that frequency, if someone grieving stood close enough to the dial.',
      'Eleven years of technicians were not chosen at random and were not unlucky. They were selected, gently, by the same process that selected you: people already listening for someone who was never going to answer.',
      "You climb the tower a final time, past the outward-facing dish that was always just for show, to the older one behind it, wired inland toward nothing on any map. You do what Cobb wrote, in his last legible entry, that he wished someone had done for him.",
      "The dish comes down easier than you expect. So does the silence afterward — total, ordinary, unhaunted. You will never hear Delphine's voice in the static again, not even the real kind of missing her, the kind made of memory instead of signal.",
      'That is the cost, and you pay it standing up. Somewhere below you, for the first time in eleven years, the relay station is just a building.',
    ],
  },
}

/**
 * Priority: the secret ending requires every hidden page (deliberate exploration reward).
 * Otherwise, a calm run (meter held high, rarely answered) reads as Clear Sky; a run defined
 * by frequently answering — which is what drains the meter in the first place — reads as Answered.
 */
export function decideEnding(state: HollowSignalState): EndingId {
  if (state.pagesFound.length >= TOTAL_HIDDEN_PAGES) return 'real-frequency'
  if (state.staticMeter >= 50 && state.answeredCount <= 3) return 'clear-sky'
  return 'answered'
}
