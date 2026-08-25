import type { FloorCell, RoomPurpose, DifficultyConfig } from '../types'
import type { DressContext, FloorContext, FloorType } from './FloorType'
import type { GenerationRequest } from '../world/FloorGenerator'
import * as Props from '../world/Props'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { Rng } from '../utils/rng'

/**
 * CHAOS = UNPREDICTABILITY. A grab-bag of short, safe, reversible events fires on an
 * irregular clock — a speed change, a blackout, a surprise reward, a false alarm. None of them
 * can strand the player (nothing ever locks a door or blocks a route), so "random" never
 * becomes "unfair", just memorable.
 */
export class ChaosFloor implements FloorType {
  kind = 'chaos' as const
  mood = 'chaos' as const

  private rng = new Rng(Date.now() & 0xffffffff)
  private eventTimer = 5
  private baseInterval = 16
  private revertTimer = 0
  private revertFn: (() => void) | null = null

  buildRequest(floorNumber: number, difficulty: DifficultyConfig, seed: number): GenerationRequest {
    this.rng = new Rng(seed ^ 0x9c33f1)
    this.baseInterval = difficulty.eventIntervalSeconds
    this.eventTimer = this.rng.range(3, 6)
    this.revertTimer = 0
    this.revertFn = null

    return {
      floorNumber,
      kind: 'chaos',
      seed,
      mainPathLength: difficulty.mainPathLength,
      branchCount: Math.max(difficulty.branchCount, 5),
      macroRoomCount: 1,
      requiredPurposes: ['event-anchor', 'event-anchor'],
      optionalPurposes: ['generic', 'loot-safe', 'storage'],
    }
  }

  onDressRoom(purpose: RoomPurpose, center: { x: number; z: number }, _cell: FloorCell, ctx: DressContext): void {
    if (purpose !== 'event-anchor') return
    const prop = this.rng.chance(0.5) ? Props.electricalBox() : Props.crateStack()
    prop.position.set(center.x, 0, center.z)
    prop.rotation.y = this.rng.range(0, Math.PI * 2)
    ctx.gameApp.worldRoot.add(prop)
  }

  onStart(ctx: FloorContext): void {
    ctx.setObjectiveText('FIND THE ELEVATOR — EXPECT ANYTHING')
    useGameStore.getState().pushToast('Nothing on this floor stays the same for long.', 'warning')
    audioManager.setMusicIntensity('danger')
    ctx.completeObjective()
  }

  onUpdate(dt: number, ctx: FloorContext): void {
    if (this.revertTimer > 0) {
      this.revertTimer -= dt
      if (this.revertTimer <= 0) {
        this.revertFn?.()
        this.revertFn = null
      }
    }

    this.eventTimer -= dt
    if (this.eventTimer > 0) return
    this.eventTimer = this.baseInterval * 0.6 * this.rng.range(0.7, 1.3)
    this.triggerRandomEvent(ctx)
  }

  private triggerRandomEvent(ctx: FloorContext): void {
    const events: (() => void)[] = [
      () => this.eventBlackout(ctx),
      () => this.eventSpeedChange(ctx),
      () => this.eventAlarm(),
      () => this.eventBonusReward(ctx),
      () => this.eventFlickerBurst(ctx),
      () => this.eventStaminaJolt(),
    ]
    this.rng.pick(events)()
  }

  private eventBlackout(ctx: FloorContext): void {
    ctx.lighting.blackout(this.rng.range(1, 2.5))
    useGameStore.getState().pushToast('The lights just died.', 'danger')
  }

  private eventSpeedChange(ctx: FloorContext): void {
    const haste = this.rng.chance(0.5)
    ctx.gameApp.player.moveMultiplier = haste ? 1.5 : 0.6
    useGameStore.getState().pushToast(haste ? 'You feel unusually fast.' : 'Your legs feel heavy.', 'warning')
    this.revertFn = () => {
      ctx.gameApp.player.moveMultiplier = 1
    }
    this.revertTimer = 6
  }

  private eventAlarm(): void {
    audioManager.alarm()
    useGameStore.getState().pushToast('An alarm blares, then stops. Nothing happened.', 'info')
  }

  private eventBonusReward(ctx: FloorContext): void {
    const playerPos = ctx.playerPosition()
    const angle = this.rng.range(0, Math.PI * 2)
    const dist = this.rng.range(2, 4)
    const x = playerPos.x + Math.cos(angle) * dist
    const z = playerPos.z + Math.sin(angle) * dist
    const value = Math.round(this.rng.range(80, 220))
    const group = Props.cashStack(1.4)
    group.position.set(x, 0, z)
    ctx.gameApp.worldRoot.add(group)
    const id = `chaos-reward-${Date.now()}-${Math.round(x)}-${Math.round(z)}`
    ctx.gameApp.interaction.register({
      id,
      kind: 'loot',
      object: group,
      promptText: `[E] TAKE $${value}`,
      range: 2,
      enabled: true,
      onInteract: () => {
        ctx.gameApp.interaction.unregister(id)
        ctx.gameApp.worldRoot.remove(group)
        audioManager.money()
        useGameStore.getState().addRunMoney(value)
      },
    })
    useGameStore.getState().pushToast('Something valuable just appeared nearby.', 'success')
  }

  private eventFlickerBurst(ctx: FloorContext): void {
    ctx.lighting.setAllFlicker(true, 0.85)
    useGameStore.getState().pushToast('The lights are going haywire.', 'warning')
    this.revertFn = () => ctx.lighting.setAllFlicker(true, 0.4)
    this.revertTimer = 5
  }

  private eventStaminaJolt(): void {
    const store = useGameStore.getState()
    const boost = this.rng.chance(0.5)
    store.setStamina(boost ? store.maxStamina : store.stamina * 0.3)
    useGameStore.getState().pushToast(boost ? 'A jolt of adrenaline.' : 'Sudden exhaustion.', boost ? 'success' : 'warning')
  }
}
