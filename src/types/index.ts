// Core domain types shared across the engine, world generation, floor logic and UI.
// Keeping these in one place means every system agrees on the same shapes.

export type Screen =
  | 'boot'
  | 'menu'
  | 'lobby'
  | 'run'
  | 'floor-complete'
  | 'risk-decision'
  | 'run-failed'
  | 'cashed-out'

export type ModalType = 'pause' | 'upgrades' | 'cosmetics' | 'settings' | 'stats' | null

export type FloorKind = 'chase' | 'puzzle' | 'loot' | 'darkness' | 'chaos'

export const FLOOR_KIND_ORDER: FloorKind[] = ['chase', 'puzzle', 'loot', 'darkness', 'chaos']

export type Direction = 'N' | 'S' | 'E' | 'W'

export const DIRECTIONS: Direction[] = ['N', 'S', 'E', 'W']

export const DIR_VECTOR: Record<Direction, { dx: number; dz: number }> = {
  N: { dx: 0, dz: -1 },
  S: { dx: 0, dz: 1 },
  E: { dx: 1, dz: 0 },
  W: { dx: -1, dz: 0 },
}

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
}

export type CellSizeClass = 'hallway' | 'room' | 'macro-room'

/** What a room is used for — drives content placement and prop dressing, not geometry rules. */
export type RoomPurpose =
  | 'corridor'
  | 'spawn'
  | 'elevator'
  | 'generic'
  | 'storage'
  | 'office'
  | 'utility'
  | 'key'
  | 'loot-safe'
  | 'loot-risky'
  | 'switch-a'
  | 'switch-b'
  | 'switch-c'
  | 'switch-d'
  | 'clue'
  | 'hazard'
  | 'event-anchor'
  | 'hiding-spot'

export interface FloorCell {
  x: number
  z: number
  sizeClass: CellSizeClass
  connections: Set<Direction>
  purpose: RoomPurpose
  macroId?: string
  macroAnchor?: boolean
}

export interface SpecialRoom {
  purpose: RoomPurpose
  cell: FloorCell
  /** World-space center of this room (accounts for macro-room spans). */
  center: { x: number; z: number }
}

export interface FloorLayout {
  floorNumber: number
  kind: FloorKind
  seed: number
  cells: Map<string, FloorCell>
  spawnCell: FloorCell
  elevatorCell: FloorCell
  specialRooms: SpecialRoom[]
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface DifficultyConfig {
  floorNumber: number
  label: string
  gridTargetCells: number
  mainPathLength: number
  branchCount: number
  rewardBase: number
  rewardVariance: number
  enemySpeed: number
  enemyDetectionRadius: number
  enemyFovDegrees: number
  enemyHearingRadius: number
  switchCount: number
  lootTimerSeconds: number
  eventIntervalSeconds: number
  darknessSeverity: number
}

export type InteractableKind =
  | 'door'
  | 'elevator'
  | 'switch'
  | 'loot'
  | 'keycard'
  | 'note'
  | 'hiding-spot'
  | 'station'
  | 'lever'

export interface InteractionContext {
  playerPosition: import('three').Vector3
}

export interface Interactable {
  id: string
  kind: InteractableKind
  object: import('three').Object3D
  promptText: string
  /** Max distance (meters) at which this can be triggered. */
  range: number
  enabled: boolean
  onInteract: (ctx: InteractionContext) => void
  /** Optional: called every frame this object is the focused target (for hover feedback). */
  onFocus?: () => void
  onBlur?: () => void
}

export type EnemyState = 'idle' | 'patrol' | 'investigate' | 'search' | 'chase' | 'lost'

export interface UpgradeDef {
  id: 'stamina' | 'health' | 'luck' | 'speed' | 'time'
  name: string
  description: string
  maxLevel: number
  baseCost: number
  costGrowth: number
}

export interface CosmeticDef {
  id: string
  name: string
  slot: 'suit' | 'visor' | 'trim'
  color: string
  cost: number
}

export interface RunStats {
  totalRuns: number
  totalDeaths: number
  highestFloor: number
  totalMoneyEarned: number
  totalMoneyCashedOut: number
  floorsCompleted: number
  bestRunPayout: number
  longestRunSeconds: number
}

export interface SettingsState {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  mouseSensitivity: number
  fov: number
  fullscreen: boolean
}

export interface SaveData {
  version: number
  bankMoney: number
  upgradeLevels: Record<UpgradeDef['id'], number>
  ownedCosmetics: string[]
  equippedCosmetics: Partial<Record<CosmeticDef['slot'], string>>
  bestFloor: number
  stats: RunStats
  settings: SettingsState
}

/** What any scene builder (Lobby, a generated floor) hands back to GameManager. */
export interface SceneHandle {
  spawnX: number
  spawnZ: number
  spawnYaw: number
  update: (dt: number, playerPos: import('three').Vector3) => void
}

export interface MoneyPopup {
  id: number
  amount: number
  x: number
  y: number
}

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'warning' | 'danger' | 'success'
}
