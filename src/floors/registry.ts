import type { FloorKind } from '../types'
import type { FloorType } from './FloorType'
import { ChaseFloor } from './ChaseFloor'
import { PuzzleFloor } from './PuzzleFloor'
import { LootFloor } from './LootFloor'
import { DarknessFloor } from './DarknessFloor'
import { ChaosFloor } from './ChaosFloor'

const FACTORIES: Record<FloorKind, () => FloorType> = {
  chase: () => new ChaseFloor(),
  puzzle: () => new PuzzleFloor(),
  loot: () => new LootFloor(),
  darkness: () => new DarknessFloor(),
  chaos: () => new ChaosFloor(),
}

export function createFloorType(kind: FloorKind): FloorType {
  return FACTORIES[kind]()
}
