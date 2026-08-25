import type * as THREE from 'three'
import type { DifficultyConfig, FloorCell, FloorKind, FloorLayout, RoomPurpose } from '../types'
import type { GameApp } from '../engine/GameApp'
import type { Elevator } from '../world/Elevator'
import type { LightingRig } from '../world/LightingRig'
import type { GenerationRequest } from '../world/FloorGenerator'
import type { FloorMood } from '../world/Materials'

/** What's available while the generator is still placing special-room content (dressing). */
export interface DressContext {
  gameApp: GameApp
}

/** Everything available once the floor is fully built and play begins. */
export interface FloorContext extends DressContext {
  layout: FloorLayout
  elevator: Elevator
  lighting: LightingRig
  difficulty: DifficultyConfig
  /** Call once the floor's win condition is satisfied — unlocks + opens the elevator. */
  completeObjective: () => void
  setObjectiveText: (text: string) => void
  playerPosition: () => THREE.Vector3
  damagePlayer: (amount: number) => void
  awardMoney: (amount: number) => void
}

/**
 * The contract every floor type implements. FloorManager drives these four calls in order:
 * buildRequest() to get a layout generated, onDressRoom() once per special room the generator
 * placed, onStart() once the geometry exists, then onUpdate() every frame until
 * completeObjective() is called. Adding "Flooded Floor" or "Laser Floor" later means writing
 * one new file that implements this interface — nothing else in the codebase changes.
 */
export interface FloorType {
  kind: FloorKind
  mood: FloorMood
  buildRequest(floorNumber: number, difficulty: DifficultyConfig, seed: number): GenerationRequest
  onDressRoom(purpose: RoomPurpose, center: { x: number; z: number }, cell: FloorCell, ctx: DressContext): void
  onStart(ctx: FloorContext): void
  onUpdate(dt: number, ctx: FloorContext): void
}
