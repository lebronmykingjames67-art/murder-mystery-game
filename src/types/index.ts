// Core domain types shared across core/, entities/, systems/, ui/.
// Kept engine-agnostic (no Three.js imports) so systems stay easily testable.

export interface Vec2 {
  x: number
  z: number
}

// ---------------------------------------------------------------------------
// Road graph
// ---------------------------------------------------------------------------

export interface RoadNode {
  id: string
  x: number
  z: number
  districtId: string
  /** True for real intersections; false for mid-block filler nodes (rare). */
  isIntersection: boolean
  /** Interesting nodes eligible as pickup/dropoff/depot points. */
  isPOI: boolean
  poiName?: string
}

export type VehicleTierId = 'bicycle' | 'ebike' | 'scooter' | 'motorbike' | 'car' | 'van'

export interface RoadEdge {
  id: string
  from: string
  to: string
  distance: number
  baseSpeedLimit: number
  /** Shortcut edge that must be unlocked (route unlock) before pathfinding may use it. */
  locked: boolean
  unlockRouteId?: string
  /** Only these vehicle tiers may use this edge (e.g. pedestrian/bike paths). Empty = all. */
  vehicleOnly: VehicleTierId[]
  /** >1 while a Traffic Jam / Rush Hour event is active on this edge. */
  weightMultiplier: number
  /** True while a Road Closure event has removed this edge from the graph. */
  closed: boolean
  /** Connects two different districts; used for barrier placement. */
  isConnector: boolean
  connectorRouteId?: string
}

// ---------------------------------------------------------------------------
// Vehicles & upgrades
// ---------------------------------------------------------------------------

export interface VehicleDef {
  id: VehicleTierId
  name: string
  cost: number
  topSpeed: number
  acceleration: number
  handling: number
  cargoCapacity: number
  color: number
  accentColor: number
  unlockLabel?: string
  weatherResistant?: boolean
  bodyStyle: 'bike' | 'ebike' | 'scooter' | 'motorbike' | 'car' | 'van'
}

export type UpgradeSlotType = 'engine' | 'tires' | 'cargo' | 'utility'

export interface UpgradeLevelDef {
  level: number
  cost: number
  description: string
  effect: {
    topSpeed?: number
    acceleration?: number
    handling?: number
    cargoCapacity?: number
    fragileRetention?: number
    boostCapacity?: number
    pickupSpeedMultiplier?: number
  }
}

export interface UpgradeSlotDef {
  slot: UpgradeSlotType
  name: string
  levels: UpgradeLevelDef[]
}

// ---------------------------------------------------------------------------
// Districts
// ---------------------------------------------------------------------------

export type TrafficDensity = 'low' | 'medium' | 'medium-high' | 'high' | 'variable'

export interface DistrictConnectorDef {
  id: string
  toDistrictId: string
  fromNodeGrid: [number, number]
  toNodeGrid: [number, number]
  label: string
  savingsLabel: string
  vehicleOnly?: VehicleTierId[]
}

export interface DistrictDef {
  id: string
  name: string
  unlockRep: number
  gridCols: number
  gridRows: number
  blockSize: number
  origin: Vec2
  trafficDensity: TrafficDensity
  groundColor: number
  roadColor: number
  buildingPalette: number[]
  minBuildingHeight: number
  maxBuildingHeight: number
  sparse?: boolean
  description: string
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type ItemType = 'Food' | 'Package' | 'Fragile' | 'Cold' | 'Documents' | 'Hazmat'
export type SpecialFlag = 'Fragile' | 'RushHour' | 'VIP' | 'MysteryBox'
export type OrderState = 'board' | 'toPickup' | 'toDropoff' | 'completed' | 'failed'

export interface Order {
  id: string
  pickupNodeId: string
  dropoffNodeId: string
  pickupLabel: string
  dropoffLabel: string
  itemType: ItemType
  distance: number
  basePayout: number
  timeLimit: number
  tipPotential: number
  difficultyTier: number
  isMultiStop: boolean
  specialFlags: SpecialFlag[]
  state: OrderState
  createdAt: number
  boardExpiresAt: number
  acceptedAt: number | null
  pickedUpAt: number | null
  /** 0-100, only meaningful for Fragile/Cold cargo. */
  condition: number
  mysteryRevealed: boolean
}

export interface DeliveryResult {
  order: Order
  payout: number
  tip: number
  late: boolean
  conditionAtDropoff: number
  vip: boolean
  mystery: boolean
}

// ---------------------------------------------------------------------------
// Random events
// ---------------------------------------------------------------------------

export type GameEventTypeId =
  | 'rainstorm'
  | 'trafficJam'
  | 'roadClosure'
  | 'rushHour'
  | 'vipFlashOrder'
  | 'mysteryBoxWave'

export interface GameEventDef {
  id: GameEventTypeId
  name: string
  description: string
  icon: string
  minDuration: number
  maxDuration: number
  weight: number
  scheduled: boolean
  intervalSeconds?: number
  oneShot: boolean
}

export interface GlobalModifiers {
  payoutMultiplier: number
  visibility: number
  handling: number
}

// ---------------------------------------------------------------------------
// Save data
// ---------------------------------------------------------------------------

export interface SaveData {
  version: number
  cash: number
  rep: number
  xp: number
  level: number
  ownedVehicles: VehicleTierId[]
  equippedVehicle: VehicleTierId
  upgrades: Partial<Record<VehicleTierId, Partial<Record<UpgradeSlotType, number>>>>
  unlockedDistricts: string[]
  unlockedRoutes: string[]
  cargoBonusSlots: number
  ownedProperties: string[]
  staff: StaffMember[]
}

// ---------------------------------------------------------------------------
// Business: hired staff & property
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: string
  name: string
  vehicleTier: VehicleTierId
  hiredAt: number
}

export interface PropertyDef {
  id: string
  name: string
  cost: number
  capacity: number
  unlockRep: number
  description: string
}

export interface RunStats {
  deliveriesCompleted: number
  deliveriesFailed: number
  totalEarned: number
}

// ---------------------------------------------------------------------------
// World / physics
// ---------------------------------------------------------------------------

export interface Collider {
  x: number
  z: number
  radius: number
  kind: 'building' | 'barrier' | 'prop'
  routeId?: string
}

// ---------------------------------------------------------------------------
// Turn-by-turn navigation
// ---------------------------------------------------------------------------

export interface NavInfo {
  maneuver: 'left' | 'right' | 'arrive'
  distance: number
  targetLabel: string
}
