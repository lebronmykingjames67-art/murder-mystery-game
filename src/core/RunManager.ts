import { useGameStore } from '../state/store'
import { rewardForFloor } from './constants'
import { UPGRADE_EFFECTS } from '../systems/UpgradeSystem'
import { audioManager } from './AudioManager'

/**
 * Owns the run economy: how much a completed floor is actually worth (base reward, a little
 * randomness, the luck upgrade), and the sound/side-effects around cash-out / risk-it / death.
 * The numbers themselves live in the store (so the HUD reacts to them); this is the "what
 * should happen" layer on top.
 */
export class RunManager {
  startRun(): void {
    useGameStore.getState().startNewRun()
  }

  rewardForFloor(floorNumber: number): number {
    const base = rewardForFloor(floorNumber)
    const luckLevel = useGameStore.getState().upgradeLevels.luck
    const luckBonus = 1 + UPGRADE_EFFECTS.luck(luckLevel)
    const roll = 1 + (Math.random() * 2 - 1) * 0.15
    return Math.max(1, Math.round(base * roll * luckBonus))
  }

  completeFloor(floorNumber: number): number {
    const reward = this.rewardForFloor(floorNumber)
    useGameStore.getState().completeFloor(reward)
    audioManager.floorComplete()
    return reward
  }

  cashOut(): void {
    useGameStore.getState().cashOut()
    audioManager.cashOut()
  }

  riskIt(): void {
    useGameStore.getState().riskIt()
    audioManager.riskIt()
  }

  failRun(): void {
    useGameStore.getState().failRun()
    audioManager.death()
  }
}
