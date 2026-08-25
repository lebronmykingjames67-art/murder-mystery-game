import type { GameApp } from '../engine/GameApp'
import { computeDifficulty } from '../core/DifficultyManager'
import { generateFloor } from '../world/FloorGenerator'
import { buildFloor, type BuiltFloor } from '../world/FloorBuilder'
import { createFloorType } from './registry'
import type { DressContext, FloorContext, FloorType } from './FloorType'
import type { FloorKind } from '../types'
import { FLOOR_KIND_ORDER } from '../types'
import { useGameStore } from '../state/store'
import { audioManager } from '../core/AudioManager'
import { makeSeed } from '../utils/rng'

/**
 * Generates and runs one floor at a time: pick a FloorType for the floor number, generate its
 * layout, build the geometry, hand content-placement to the FloorType, then drive its
 * onUpdate() every frame until it calls completeObjective(). Nothing here knows what a Chase
 * or Puzzle floor actually does — that's entirely encapsulated in floors/*.ts.
 */
export class FloorManager {
  private floorType: FloorType | null = null
  private built: BuiltFloor | null = null
  private ctx: FloorContext | null = null
  private objectiveComplete = false

  onFloorComplete: ((floorNumber: number) => void) | null = null

  enterFloor(gameApp: GameApp, floorNumber: number): FloorKind {
    gameApp.clearWorld()
    gameApp.player.onFootstep = null
    this.objectiveComplete = false

    const difficulty = computeDifficulty(floorNumber)
    const kind = FLOOR_KIND_ORDER[(floorNumber - 1) % FLOOR_KIND_ORDER.length]
    const floorType = createFloorType(kind)
    this.floorType = floorType

    const seed = makeSeed()
    const request = floorType.buildRequest(floorNumber, difficulty, seed)
    const layout = generateFloor(request)

    const dressCtx: DressContext = { gameApp }
    const built = buildFloor(gameApp, layout, {
      mood: floorType.mood,
      onElevatorEntered: () => this.onFloorComplete?.(floorNumber),
      onDressRoom: (purpose, center, cell) => floorType.onDressRoom(purpose, center, cell, dressCtx),
    })
    this.built = built

    const ctx: FloorContext = {
      gameApp,
      layout,
      elevator: built.elevator,
      lighting: built.lighting,
      difficulty,
      completeObjective: () => this.completeObjective(),
      setObjectiveText: (text) => useGameStore.getState().setObjectiveText(text),
      playerPosition: () => gameApp.player.position,
      damagePlayer: (amount) => gameApp.health.applyDamage(amount),
      awardMoney: (amount) => useGameStore.getState().addRunMoney(amount),
    }
    this.ctx = ctx

    gameApp.player.spawnAt(built.handle.spawnX, built.handle.spawnZ, built.spawnYaw)
    audioManager.setMusicIntensity('calm')
    floorType.onStart(ctx)
    return kind
  }

  private completeObjective(): void {
    if (this.objectiveComplete) return
    this.objectiveComplete = true
    this.built?.elevator.unlock()
    useGameStore.getState().pushToast('Objective complete. Elevator unlocked.', 'success')
  }

  update(dt: number, gameApp: GameApp): void {
    if (!this.built || !this.ctx || !this.floorType) return
    this.built.handle.update(dt, gameApp.player.position)
    this.floorType.onUpdate(dt, this.ctx)
  }
}
