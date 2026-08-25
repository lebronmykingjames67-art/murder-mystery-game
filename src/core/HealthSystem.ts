import { useGameStore } from '../state/store'
import { audioManager } from './AudioManager'

/**
 * Owns the rules around taking damage: a brief invulnerability window so a single hazard
 * (e.g. standing in an electrified puddle) can't delete your whole health bar in one frame,
 * plus wiring the damage into sound. The numeric health value itself lives in the store so
 * the HUD can react to it directly.
 */
export class HealthSystem {
  private invulnTimer = 0
  onDamaged: (() => void) | null = null
  onDied: (() => void) | null = null

  update(dt: number): void {
    if (this.invulnTimer > 0) this.invulnTimer -= dt
  }

  applyDamage(amount: number): void {
    if (amount <= 0) return
    if (this.invulnTimer > 0) return
    const store = useGameStore.getState()
    if (store.health <= 0) return
    this.invulnTimer = 0.5
    store.damage(amount)
    audioManager.damage()
    this.onDamaged?.()
    if (store.health - amount <= 0) {
      this.onDied?.()
    }
  }

  heal(amount: number): void {
    useGameStore.getState().heal(amount)
  }

  reset(): void {
    this.invulnTimer = 0
  }
}
