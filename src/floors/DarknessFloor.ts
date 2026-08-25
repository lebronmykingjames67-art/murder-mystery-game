import type { FloorCell, RoomPurpose, DifficultyConfig } from '../types'
import type { DressContext, FloorContext, FloorType } from './FloorType'
import type { GenerationRequest } from '../world/FloorGenerator'
import * as Props from '../world/Props'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { Rng } from '../utils/rng'

const FLAVOR_TOASTS = [
  'Something shifted in the dark.',
  'You hear dripping water somewhere close.',
  'The air is colder here.',
  'A shape you can’t quite place, then nothing.',
]

/**
 * DARKNESS = EXPLORATION/TENSION. No enemy, no puzzle — just bad visibility and an environment
 * that keeps getting worse. Lights flicker and cut out on their own schedule, forcing the
 * player to keep moving and re-orient rather than lean on a fully lit floor plan.
 */
export class DarknessFloor implements FloorType {
  kind = 'darkness' as const
  mood = 'darkness' as const

  private rng = new Rng(Date.now() & 0xffffffff)
  private eventTimer = 6
  private severity = 0.4
  private baseInterval = 16

  buildRequest(floorNumber: number, difficulty: DifficultyConfig, seed: number): GenerationRequest {
    this.rng = new Rng(seed ^ 0x0d4a2b)
    this.severity = difficulty.darknessSeverity
    this.baseInterval = difficulty.eventIntervalSeconds
    this.eventTimer = this.rng.range(4, 8)

    return {
      floorNumber,
      kind: 'darkness',
      seed,
      mainPathLength: difficulty.mainPathLength,
      branchCount: difficulty.branchCount,
      macroRoomCount: 0,
      requiredPurposes: ['hazard'],
      optionalPurposes: ['generic', 'generic', 'storage', 'hiding-spot'],
    }
  }

  onDressRoom(purpose: RoomPurpose, center: { x: number; z: number }, _cell: FloorCell, ctx: DressContext): void {
    if (purpose !== 'hazard') return
    const debris = Props.crateStack()
    debris.position.set(center.x + this.rng.range(-1, 1), 0, center.z + this.rng.range(-1, 1))
    debris.rotation.y = this.rng.range(0, Math.PI * 2)
    ctx.gameApp.worldRoot.add(debris)
  }

  onStart(ctx: FloorContext): void {
    ctx.setObjectiveText('FIND THE ELEVATOR')
    useGameStore.getState().pushToast('The power on this floor is failing.', 'warning')
    ctx.lighting.setAllFlicker(true, this.severity)
    audioManager.setMusicIntensity('danger')
    // No lock to fight through here — the floor itself is the obstacle.
    ctx.completeObjective()
  }

  onUpdate(dt: number, ctx: FloorContext): void {
    this.eventTimer -= dt
    if (this.eventTimer > 0) return
    this.eventTimer = this.baseInterval * this.rng.range(0.7, 1.3)

    const roll = this.rng.next()
    if (roll < 0.35) {
      ctx.lighting.blackout(this.rng.range(1.5, 3.5))
      audioManager.switchWrong()
      useGameStore.getState().pushToast('The lights just cut out.', 'danger')
    } else if (roll < 0.65) {
      this.severity = Math.min(1, this.severity + 0.12)
      ctx.lighting.setAllFlicker(true, this.severity)
      audioManager.enemyGrowl(0.15)
      useGameStore.getState().pushToast('The flickering is getting worse.', 'warning')
    } else {
      useGameStore.getState().pushToast(this.rng.pick(FLAVOR_TOASTS), 'info')
    }
  }
}
