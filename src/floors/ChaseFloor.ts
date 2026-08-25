import type { FloorCell, Interactable, RoomPurpose } from '../types'
import type { DressContext, FloorContext, FloorType } from './FloorType'
import type { GenerationRequest } from '../world/FloorGenerator'
import type { DifficultyConfig } from '../types'
import { EnemyAI } from '../ai/EnemyAI'
import * as Props from '../world/Props'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { Rng } from '../utils/rng'

interface PendingNoise {
  x: number
  z: number
  loudness: number
}

/**
 * CHASE = SURVIVAL. A hostile AI hunts the floor while the player looks for the elevator (it
 * starts unlocked — the whole objective is staying alive long enough to reach it). Hiding
 * spots let the player break the chase outright rather than only running.
 */
export class ChaseFloor implements FloorType {
  kind = 'chase' as const
  mood = 'chase' as const

  private enemy: EnemyAI | null = null
  private hidden = false
  private activeHidingSpot: string | null = null
  private hidingSpots = new Map<string, Interactable>()
  private pendingNoise: PendingNoise | null = null
  private rng = new Rng(Date.now() & 0xffffffff)

  buildRequest(floorNumber: number, difficulty: DifficultyConfig, seed: number): GenerationRequest {
    return {
      floorNumber,
      kind: 'chase',
      seed,
      mainPathLength: difficulty.mainPathLength,
      branchCount: difficulty.branchCount,
      macroRoomCount: 1,
      requiredPurposes: ['hiding-spot', 'hiding-spot'],
      optionalPurposes: ['generic', 'generic', 'storage', 'hiding-spot'],
    }
  }

  onDressRoom(purpose: RoomPurpose, center: { x: number; z: number }, _cell: FloorCell, ctx: DressContext): void {
    if (purpose !== 'hiding-spot') return
    const id = `hide-${center.x.toFixed(1)}-${center.z.toFixed(1)}`
    const group = Props.locker()
    group.position.set(center.x + 1.2, 0, center.z + 1.2)
    group.rotation.y = this.rng.range(0, Math.PI * 2)
    ctx.gameApp.worldRoot.add(group)

    const interactable = {
      id,
      kind: 'hiding-spot' as const,
      object: group,
      promptText: '[E] HIDE',
      range: 2,
      enabled: true,
      onInteract: () => this.toggleHide(id, ctx),
    }
    this.hidingSpots.set(id, interactable)
    ctx.gameApp.interaction.register(interactable)
  }

  private toggleHide(id: string, ctx: DressContext): void {
    const interactable = this.hidingSpots.get(id)
    if (this.hidden && this.activeHidingSpot === id) {
      this.hidden = false
      this.activeHidingSpot = null
      ctx.gameApp.player.inputLocked = false
      if (interactable) interactable.promptText = '[E] HIDE'
      useGameStore.getState().pushToast('You step out.', 'info')
    } else if (!this.hidden) {
      this.hidden = true
      this.activeHidingSpot = id
      ctx.gameApp.player.inputLocked = true
      if (interactable) interactable.promptText = '[E] LEAVE'
      useGameStore.getState().pushToast('Hidden. [E] to leave.', 'info')
    }
  }

  onStart(ctx: FloorContext): void {
    ctx.setObjectiveText('FIND THE ELEVATOR')
    useGameStore.getState().pushToast('Something else is on this floor.', 'danger')

    const cells = Array.from(ctx.layout.cells.values())
    const far = cells.filter((c) => Math.hypot(c.x - ctx.layout.spawnCell.x, c.z - ctx.layout.spawnCell.z) > 3 && c !== ctx.layout.elevatorCell)
    const spawnCell = far.length > 0 ? this.rng.pick(far) : ctx.layout.elevatorCell
    this.enemy = new EnemyAI(ctx.layout, ctx.gameApp.collision, ctx.difficulty, spawnCell, ctx.layout.seed)
    ctx.gameApp.worldRoot.add(this.enemy.group)

    ctx.gameApp.player.onFootstep = (pos, sprinting) => {
      this.pendingNoise = { x: pos.x, z: pos.z, loudness: sprinting ? 1.7 : 1.0 }
    }

    // The elevator on a chase floor is not gated by an objective — surviving to reach it IS
    // the objective — so unlock it immediately, it just still has to be found.
    ctx.elevator.unlock()
    audioManager.setMusicIntensity('tense')
  }

  onUpdate(dt: number, ctx: FloorContext): void {
    if (!this.enemy) return
    const playerPos = ctx.playerPosition()

    this.enemy.update(dt, {
      playerPosition: playerPos,
      playerHidden: this.hidden,
      noiseEvent: this.pendingNoise,
    })
    this.pendingNoise = null

    if (this.enemy.isCatchingPlayer(playerPos)) {
      ctx.damagePlayer(18)
    }

    const state = this.enemy.state
    if (state === 'chase') audioManager.setMusicIntensity('chase')
    else if (state === 'investigate' || state === 'lost' || state === 'search') audioManager.setMusicIntensity('danger')
    else audioManager.setMusicIntensity('tense')
  }
}
