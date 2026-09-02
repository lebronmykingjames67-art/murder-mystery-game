import type { DistrictDef } from '../types'

// Districts are arranged in a cross around Downtown Core (the depot district),
// stitched together by connector edges declared in each district's `connectors`.
// City geometry is generated procedurally from these grid params (see world/CityBuilder.ts),
// so adding a district is a data change, not new hand-authored geometry.
export const DISTRICTS: DistrictDef[] = [
  {
    id: 'downtown',
    name: 'Downtown Core',
    unlockRep: 0,
    gridCols: 7,
    gridRows: 7,
    blockSize: 36,
    origin: { x: -108, z: -108 },
    trafficDensity: 'low',
    groundColor: 0x2b2f36,
    roadColor: 0x35363a,
    buildingPalette: [0x4a5568, 0x5a6478, 0x3f4854, 0x6b7280],
    minBuildingHeight: 10,
    maxBuildingHeight: 34,
    description: 'Grid streets, low traffic. The tutorial district — home to the Depot.',
  },
  {
    id: 'oldtown',
    name: 'Old Town',
    unlockRep: 2,
    gridCols: 8,
    gridRows: 8,
    blockSize: 22,
    origin: { x: -88, z: -400 },
    trafficDensity: 'medium',
    groundColor: 0x33302a,
    roadColor: 0x413c33,
    buildingPalette: [0x8a5a3c, 0x9c6b44, 0x74492e, 0xa8794f],
    minBuildingHeight: 8,
    maxBuildingHeight: 20,
    description: 'Narrow alleys, one-way streets. Shortcuts reward skill.',
  },
  {
    id: 'suburbs',
    name: 'Suburbs',
    unlockRep: 4,
    gridCols: 6,
    gridRows: 6,
    blockSize: 58,
    origin: { x: 400, z: -108 },
    trafficDensity: 'low',
    groundColor: 0x2e3a2b,
    roadColor: 0x3a3d3a,
    buildingPalette: [0x6b8f5c, 0x7a9a6a, 0x5c7a52, 0x8aab7a],
    minBuildingHeight: 5,
    maxBuildingHeight: 12,
    sparse: true,
    description: 'Wide roads, long distances. Rewards speed/vehicle stats over agility.',
  },
  {
    id: 'docks',
    name: 'Industrial Docks',
    unlockRep: 6,
    gridCols: 6,
    gridRows: 6,
    blockSize: 40,
    origin: { x: -108, z: 380 },
    trafficDensity: 'medium-high',
    groundColor: 0x2a2624,
    roadColor: 0x3a352f,
    buildingPalette: [0x5c5248, 0x726556, 0x8a5a2e, 0x4a4038],
    minBuildingHeight: 12,
    maxBuildingHeight: 26,
    description: 'Potholes, forklifts, gates. Vehicle durability matters.',
  },
  {
    id: 'uptown',
    name: 'Uptown / Financial',
    unlockRep: 8,
    gridCols: 7,
    gridRows: 7,
    blockSize: 30,
    origin: { x: -580, z: -108 },
    trafficDensity: 'high',
    groundColor: 0x22252b,
    roadColor: 0x2f3238,
    buildingPalette: [0x1f2937, 0x374151, 0x111827, 0x475569],
    minBuildingHeight: 30,
    maxBuildingHeight: 70,
    description: 'Dense traffic, doormen, no-parking zones. High-value/VIP orders live here.',
  },
]

// Connector edges stitching districts together. Declared once, from either side;
// RoadGraph resolves node ids from the grid coordinates against each district's own grid.
export interface ConnectorSpec {
  id: string
  fromDistrict: string
  fromGrid: [number, number]
  toDistrict: string
  toGrid: [number, number]
  label: string
  savingsLabel: string
  unlockRep: number
}

export const CONNECTORS: ConnectorSpec[] = [
  {
    id: 'route_oldtown_bridge',
    fromDistrict: 'downtown',
    fromGrid: [3, 6],
    toDistrict: 'oldtown',
    toGrid: [4, 0],
    label: 'North Bridge to Old Town',
    savingsLabel: 'Opens Old Town contracts',
    unlockRep: 2,
  },
  {
    id: 'route_suburbs_parkway',
    fromDistrict: 'downtown',
    fromGrid: [6, 3],
    toDistrict: 'suburbs',
    toGrid: [0, 3],
    label: 'East Parkway to Suburbs',
    savingsLabel: 'Opens Suburbs contracts',
    unlockRep: 4,
  },
  {
    id: 'route_docks_causeway',
    fromDistrict: 'downtown',
    fromGrid: [3, 0],
    toDistrict: 'docks',
    toGrid: [3, 5],
    label: 'South Causeway to Industrial Docks',
    savingsLabel: 'Opens Industrial Docks contracts',
    unlockRep: 6,
  },
  {
    id: 'route_uptown_overpass',
    fromDistrict: 'downtown',
    fromGrid: [0, 3],
    toDistrict: 'uptown',
    toGrid: [6, 3],
    label: 'West Overpass to Uptown/Financial',
    savingsLabel: 'Opens Uptown/Financial VIP contracts',
    unlockRep: 8,
  },
]

// Elm St. Alley: an intra-district shortcut in Old Town, unlocked via Rep rather than
// district access — a legible, spatial progression reward per GDD 7.2.
export const SHORTCUT_ROUTE_ID = 'route_elm_st_alley'
export const SHORTCUT_UNLOCK_REP = 3

// Downtown Core is a 7x7 grid, so (3,3) is always its exact center node.
export const DEPOT_NODE_ID = 'downtown_3_3'

/** Parses a `${districtId}_${col}_${row}` node id back into a world position, without needing a live RoadGraph. */
export function positionForNodeId(nodeId: string): { x: number; z: number; districtId: string } | null {
  const lastUnderscore = nodeId.lastIndexOf('_')
  const secondLastUnderscore = nodeId.lastIndexOf('_', lastUnderscore - 1)
  if (lastUnderscore === -1 || secondLastUnderscore === -1) return null
  const districtId = nodeId.slice(0, secondLastUnderscore)
  const col = Number(nodeId.slice(secondLastUnderscore + 1, lastUnderscore))
  const row = Number(nodeId.slice(lastUnderscore + 1))
  const district = DISTRICTS.find((d) => d.id === districtId)
  if (!district || Number.isNaN(col) || Number.isNaN(row)) return null
  return { x: district.origin.x + col * district.blockSize, z: district.origin.z + row * district.blockSize, districtId }
}
