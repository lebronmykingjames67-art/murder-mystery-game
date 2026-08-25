import type { FloorCell, RoomPurpose, DifficultyConfig } from '../types'
import type { DressContext, FloorContext, FloorType } from './FloorType'
import type { GenerationRequest } from '../world/FloorGenerator'
import * as Props from '../world/Props'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { UPGRADE_EFFECTS } from '../systems/UpgradeSystem'
import { Rng } from '../utils/rng'

interface Pickup {
  id: string
  taken: boolean
}

/**
 * LOOT = GREED. A time limit, cash scattered everywhere, and the best of it sitting in the
 * riskiest, farthest-flung rooms. The elevator is never locked — the only real opponent here
 * is the clock, and once it hits zero the floor stops being safe to linger in.
 */
export class LootFloor implements FloorType {
  kind = 'loot' as const
  mood = 'loot' as const

  private timeRemaining = 90
  private timerExpired = false
  private pickups = new Map<string, Pickup>()
  private rng = new Rng(Date.now() & 0xffffffff)
  private toastCooldown = 0
  private drainTimer = 0

  buildRequest(floorNumber: number, difficulty: DifficultyConfig, seed: number): GenerationRequest {
    this.rng = new Rng(seed ^ 0x77aa11)
    const timeBonus = UPGRADE_EFFECTS.time(useGameStore.getState().upgradeLevels.time)
    this.timeRemaining = difficulty.lootTimerSeconds + timeBonus
    this.timerExpired = false
    this.pickups.clear()

    return {
      floorNumber,
      kind: 'loot',
      seed,
      mainPathLength: difficulty.mainPathLength,
      branchCount: Math.max(difficulty.branchCount, 5),
      macroRoomCount: 1,
      requiredPurposes: ['loot-safe', 'loot-safe', 'loot-risky', 'loot-risky'],
      optionalPurposes: ['loot-risky', 'loot-safe', 'generic'],
    }
  }

  onDressRoom(purpose: RoomPurpose, center: { x: number; z: number }, _cell: FloorCell, ctx: DressContext): void {
    if (purpose !== 'loot-safe' && purpose !== 'loot-risky') return
    const risky = purpose === 'loot-risky'
    const count = risky ? this.rng.int(2, 4) : this.rng.int(1, 3)
    for (let i = 0; i < count; i++) {
      const ox = this.rng.range(-2.4, 2.4)
      const oz = this.rng.range(-2.4, 2.4)
      this.placePickup(center.x + ox, center.z + oz, risky, ctx)
    }
  }

  private placePickup(x: number, z: number, risky: boolean, ctx: DressContext): void {
    const scale = risky ? this.rng.range(1.2, 2) : this.rng.range(0.8, 1.3)
    const value = Math.round((risky ? this.rng.range(150, 420) : this.rng.range(25, 90)) * (1 + this.luckBonus()))
    const group = Props.cashStack(scale)
    group.position.set(x, 0, z)
    ctx.gameApp.worldRoot.add(group)

    const id = `loot-${x.toFixed(2)}-${z.toFixed(2)}`
    this.pickups.set(id, { id, taken: false })

    ctx.gameApp.interaction.register({
      id,
      kind: 'loot',
      object: group,
      promptText: `[E] TAKE $${value}`,
      range: 2,
      enabled: true,
      onInteract: () => {
        const pickup = this.pickups.get(id)
        if (!pickup || pickup.taken) return
        pickup.taken = true
        ctx.gameApp.interaction.unregister(id)
        ctx.gameApp.worldRoot.remove(group)
        audioManager.money()
        useGameStore.getState().addRunMoney(value, this.screenPos())
      },
    })
  }

  private screenPos(): { x: number; y: number } {
    // Approximate: popups don't need pixel-perfect placement, just a plausible on-screen spot.
    return { x: 50 + this.rng.range(-8, 8), y: 45 + this.rng.range(-6, 6) }
  }

  private luckBonus(): number {
    return UPGRADE_EFFECTS.luck(useGameStore.getState().upgradeLevels.luck)
  }

  onStart(ctx: FloorContext): void {
    ctx.setObjectiveText(`GRAB LOOT — ${Math.ceil(this.timeRemaining)}s LEFT`)
    useGameStore.getState().pushToast('Grab everything you can before time runs out.', 'info')
    audioManager.setMusicIntensity('tense')
    // Nothing gates the elevator on a loot floor — the clock is the whole challenge.
    ctx.completeObjective()
  }

  onUpdate(dt: number, ctx: FloorContext): void {
    if (!this.timerExpired) {
      this.timeRemaining -= dt
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0
        this.timerExpired = true
        audioManager.alarm()
        useGameStore.getState().pushToast('TIME UP — GET TO THE ELEVATOR', 'danger')
        ctx.setObjectiveText('TIME UP — REACH THE ELEVATOR NOW')
        audioManager.setMusicIntensity('chase')
      } else {
        ctx.setObjectiveText(`GRAB LOOT — ${Math.ceil(this.timeRemaining)}s LEFT`)
        if (this.timeRemaining < 15) audioManager.setMusicIntensity('danger')
      }
    } else {
      this.toastCooldown -= dt
      // HealthSystem debounces damage with a short invulnerability window (meant for discrete
      // hits like an enemy hitting you), so a continuous per-frame trickle would mostly get
      // eaten by it. Apply this as spaced-out chunks instead, comfortably past that window.
      this.drainTimer -= dt
      if (this.drainTimer <= 0) {
        this.drainTimer = 0.6
        ctx.damagePlayer(1.6)
      }
      if (this.toastCooldown <= 0) {
        this.toastCooldown = 2.5
        useGameStore.getState().pushToast('This floor is coming down. Move.', 'warning')
      }
    }
  }
}
