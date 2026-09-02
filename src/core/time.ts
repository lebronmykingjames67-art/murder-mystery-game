/** Shared day/night cycle constants so the HUD clock and the engine's lighting stay in sync. */
export const DAY_LENGTH = 480
// Shift the cycle so a fresh session starts mid-morning instead of at midnight.
export const DAY_PHASE_OFFSET = DAY_LENGTH * 0.35

export function dayCycle(simNow: number): number {
  return ((simNow + DAY_PHASE_OFFSET) % DAY_LENGTH) / DAY_LENGTH
}
