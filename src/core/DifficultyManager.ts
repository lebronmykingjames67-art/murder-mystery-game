import type { DifficultyConfig } from '../types'
import { rewardForFloor } from './constants'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function difficultyLabel(floorNumber: number): string {
  if (floorNumber <= 1) return 'Easy'
  if (floorNumber === 2) return 'Easy/Medium'
  if (floorNumber === 3) return 'Medium'
  if (floorNumber === 4) return 'Medium/Hard'
  if (floorNumber === 5) return 'Hard'
  return 'Very Hard'
}

/**
 * Difficulty grows with floor number across several axes at once (layout size, AI acuity,
 * timers, event frequency, reward) — never just enemy health, per the brief.
 */
export function computeDifficulty(floorNumber: number): DifficultyConfig {
  const t = Math.min(1, Math.max(0, (floorNumber - 1) / 9))
  return {
    floorNumber,
    label: difficultyLabel(floorNumber),
    gridTargetCells: Math.round(lerp(10, 26, t)),
    mainPathLength: Math.round(lerp(7, 15, t)),
    branchCount: Math.round(lerp(3, 7, t)),
    rewardBase: rewardForFloor(floorNumber),
    rewardVariance: 0.15,
    enemySpeed: lerp(3.1, 4.3, t),
    enemyDetectionRadius: lerp(7, 11, t),
    enemyFovDegrees: lerp(100, 130, t),
    enemyHearingRadius: lerp(6, 10, t),
    switchCount: floorNumber < 6 ? 3 : 4,
    lootTimerSeconds: lerp(95, 65, t),
    eventIntervalSeconds: lerp(22, 11, t),
    darknessSeverity: lerp(0.35, 0.9, t),
  }
}
