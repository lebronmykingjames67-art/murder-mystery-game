import { useGameStore } from '../state/store'
import { PLAYER } from './constants'

/**
 * Sprint stamina with an "exhaustion" rule: once you run yourself all the way out, you can't
 * immediately re-trigger sprint the instant regen ticks you back over 0 — you have to recover
 * to a real threshold first. Makes chase floors feel like a real gamble instead of a stutter
 * of sprint-taps at the margin.
 */
export class StaminaSystem {
  private regenDelayTimer = 0
  private exhausted = false

  update(dt: number, wantsSprint: boolean, isMoving: boolean): boolean {
    const store = useGameStore.getState()
    const canAffordSprint = !this.exhausted && store.stamina > 0
    const sprinting = wantsSprint && isMoving && canAffordSprint

    if (sprinting) {
      const next = store.stamina - PLAYER.staminaDrainPerSecond * dt
      store.setStamina(next)
      this.regenDelayTimer = PLAYER.staminaRegenDelay
      if (next <= 0) this.exhausted = true
    } else {
      if (this.regenDelayTimer > 0) {
        this.regenDelayTimer -= dt
      } else if (store.stamina < store.maxStamina) {
        store.setStamina(store.stamina + PLAYER.staminaRegenPerSecond * dt)
      }
      if (this.exhausted && store.stamina >= store.maxStamina * 0.25) {
        this.exhausted = false
      }
    }

    return sprinting
  }

  reset(): void {
    this.regenDelayTimer = 0
    this.exhausted = false
  }
}
