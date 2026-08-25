import type { CellSizeClass, Direction, FloorCell, FloorKind, FloorLayout, RoomPurpose, SpecialRoom } from '../types'
import { DIRECTIONS, DIR_VECTOR, OPPOSITE_DIR } from '../types'
import { CELL_SIZE } from '../core/constants'
import { Rng } from '../utils/rng'

export interface GenerationRequest {
  floorNumber: number
  kind: FloorKind
  seed: number
  mainPathLength: number
  branchCount: number
  macroRoomCount: number
  /** Purposes that MUST end up placed somewhere — generation retries/falls back if not. */
  requiredPurposes: RoomPurpose[]
  /** Nice-to-have flavor rooms, filled in with whatever branch budget is left. */
  optionalPurposes: RoomPurpose[]
}

function cellKey(x: number, z: number): string {
  return `${x},${z}`
}

export function cellWorldCenter(cell: FloorCell): { x: number; z: number } {
  return { x: cell.x * CELL_SIZE + CELL_SIZE / 2, z: cell.z * CELL_SIZE + CELL_SIZE / 2 }
}

function macroCentroid(cells: Map<string, FloorCell>, macroId: string): { x: number; z: number } {
  let sx = 0
  let sz = 0
  let n = 0
  cells.forEach((c) => {
    if (c.macroId === macroId) {
      const center = cellWorldCenter(c)
      sx += center.x
      sz += center.z
      n++
    }
  })
  return n > 0 ? { x: sx / n, z: sz / n } : { x: 0, z: 0 }
}

/**
 * Grid-based procedural floor generation. A randomized walk carves one guaranteed-connected
 * main path from spawn to the elevator; short branches off that path become the floor's
 * "rooms", each tagged with a purpose the active FloorType uses to place real content. Because
 * every cell is only ever added by connecting it to something already carved, the resulting
 * graph is connected by construction — there is no separate "make sure it's reachable" pass
 * needed for the common case, only a defensive BFS check before handing the layout back.
 */
export function generateFloor(req: GenerationRequest): FloorLayout {
  for (let attempt = 0; attempt < 6; attempt++) {
    const layout = tryGenerate(req, (req.seed + attempt * 7919) >>> 0)
    if (layout && validateLayout(layout, req.requiredPurposes)) return layout
  }
  return fallbackLayout(req)
}

function tryGenerate(req: GenerationRequest, seed: number): FloorLayout | null {
  const rng = new Rng(seed)
  const cells = new Map<string, FloorCell>()

  function makeCell(x: number, z: number, sizeClass: CellSizeClass, purpose: RoomPurpose): FloorCell {
    const cell: FloorCell = { x, z, sizeClass, connections: new Set(), purpose }
    cells.set(cellKey(x, z), cell)
    return cell
  }

  function connect(a: FloorCell, b: FloorCell, dir: Direction): void {
    a.connections.add(dir)
    b.connections.add(OPPOSITE_DIR[dir])
  }

  let cx = 0
  let cz = 0
  const spawnCell = makeCell(cx, cz, 'room', 'spawn')
  let prevCell = spawnCell
  let lastDir: Direction | null = null
  const mainPath: FloorCell[] = [spawnCell]

  for (let i = 0; i < req.mainPathLength; i++) {
    const candidates = rng.shuffle(DIRECTIONS.slice())
    candidates.sort((a, b) => {
      const da = DIR_VECTOR[a]
      const db = DIR_VECTOR[b]
      const scoreA = (cx + da.dx) ** 2 + (cz + da.dz) ** 2
      const scoreB = (cx + db.dx) ** 2 + (cz + db.dz) ** 2
      return scoreB - scoreA
    })
    let placed = false
    for (const dir of candidates) {
      if (lastDir && dir === OPPOSITE_DIR[lastDir]) continue
      const { dx, dz } = DIR_VECTOR[dir]
      const nx = cx + dx
      const nz = cz + dz
      if (cells.has(cellKey(nx, nz))) continue
      const isHub = rng.chance(0.3)
      const nextCell = makeCell(nx, nz, isHub ? 'room' : 'hallway', 'corridor')
      connect(prevCell, nextCell, dir)
      prevCell = nextCell
      cx = nx
      cz = nz
      lastDir = dir
      mainPath.push(nextCell)
      placed = true
      break
    }
    if (!placed) break
  }

  if (mainPath.length < Math.max(4, Math.floor(req.mainPathLength * 0.5))) return null

  const elevatorCell = mainPath[mainPath.length - 1]
  elevatorCell.purpose = 'elevator'
  elevatorCell.sizeClass = 'room'

  const specialRooms: SpecialRoom[] = []
  const purposeQueue: RoomPurpose[] = [...rng.shuffle(req.requiredPurposes.slice()), ...rng.shuffle(req.optionalPurposes.slice())]
  const eligibleAnchors = mainPath.filter((c) => c !== elevatorCell)

  let branchesPlaced = 0
  let guard = 0
  const maxGuard = Math.max(40, req.branchCount * 15)

  while (branchesPlaced < req.branchCount && purposeQueue.length > 0 && guard < maxGuard && eligibleAnchors.length > 0) {
    guard++
    const anchor = rng.pick(eligibleAnchors)
    const dirs = rng.shuffle(DIRECTIONS.slice())
    let startDir: Direction | null = null
    for (const dir of dirs) {
      const { dx, dz } = DIR_VECTOR[dir]
      if (!cells.has(cellKey(anchor.x + dx, anchor.z + dz))) {
        startDir = dir
        break
      }
    }
    if (!startDir) continue

    const branchLen = rng.int(1, 3)
    let curCell = anchor
    let curDir = startDir
    let stepsDone = 0
    for (let s = 0; s < branchLen; s++) {
      const { dx, dz } = DIR_VECTOR[curDir]
      const nx = curCell.x + dx
      const nz = curCell.z + dz
      if (cells.has(cellKey(nx, nz))) break
      const isLast = s === branchLen - 1
      const cell = makeCell(nx, nz, isLast ? 'room' : 'hallway', isLast ? 'generic' : 'corridor')
      connect(curCell, cell, curDir)
      curCell = cell
      stepsDone++
      if (!isLast) {
        const alt = rng.shuffle(DIRECTIONS.slice()).find((d) => d !== OPPOSITE_DIR[curDir] && rng.chance(0.5))
        if (alt) curDir = alt
      }
    }
    if (stepsDone === 0) continue

    const purpose = purposeQueue.shift()
    if (!purpose) break
    curCell.purpose = purpose
    curCell.sizeClass = 'room'

    if (branchesPlaced < req.macroRoomCount) {
      expandToMacroRoom(cells, curCell, rng)
    }

    const center = curCell.macroId ? macroCentroid(cells, curCell.macroId) : cellWorldCenter(curCell)
    specialRooms.push({ purpose, cell: curCell, center })
    branchesPlaced++
  }

  const minX = Math.min(...Array.from(cells.values()).map((c) => c.x))
  const maxX = Math.max(...Array.from(cells.values()).map((c) => c.x))
  const minZ = Math.min(...Array.from(cells.values()).map((c) => c.z))
  const maxZ = Math.max(...Array.from(cells.values()).map((c) => c.z))

  return {
    floorNumber: req.floorNumber,
    kind: req.kind,
    seed,
    cells,
    spawnCell,
    elevatorCell,
    specialRooms,
    minX,
    maxX,
    minZ,
    maxZ,
  }
}

function expandToMacroRoom(cells: Map<string, FloorCell>, anchor: FloorCell, rng: Rng): void {
  const macroId = `macro-${anchor.x}-${anchor.z}`
  anchor.macroId = macroId
  anchor.macroAnchor = true
  anchor.sizeClass = 'macro-room'

  const neighborOffsets: [number, number, Direction][] = [
    [1, 0, 'E'],
    [-1, 0, 'W'],
    [0, 1, 'S'],
    [0, -1, 'N'],
  ]
  const shuffled = rng.shuffle(neighborOffsets)
  let added = 0
  for (const [dx, dz, dir] of shuffled) {
    if (added >= 3) break
    const nx = anchor.x + dx
    const nz = anchor.z + dz
    if (cells.has(cellKey(nx, nz))) continue
    const cell: FloorCell = { x: nx, z: nz, sizeClass: 'macro-room', connections: new Set(), purpose: anchor.purpose, macroId }
    cells.set(cellKey(nx, nz), cell)
    anchor.connections.add(dir)
    cell.connections.add(OPPOSITE_DIR[dir])
    added++
  }
}

function validateLayout(layout: FloorLayout, requiredPurposes: RoomPurpose[]): boolean {
  const visited = new Set<string>()
  const queue: FloorCell[] = [layout.spawnCell]
  visited.add(cellKey(layout.spawnCell.x, layout.spawnCell.z))
  while (queue.length > 0) {
    const cell = queue.shift()!
    for (const dir of cell.connections) {
      const { dx, dz } = DIR_VECTOR[dir]
      const nk = cellKey(cell.x + dx, cell.z + dz)
      if (visited.has(nk)) continue
      const next = layout.cells.get(nk)
      if (!next) continue
      visited.add(nk)
      queue.push(next)
    }
  }
  if (!visited.has(cellKey(layout.elevatorCell.x, layout.elevatorCell.z))) return false
  for (const purpose of requiredPurposes) {
    const found = layout.specialRooms.find((r) => r.purpose === purpose && visited.has(cellKey(r.cell.x, r.cell.z)))
    if (!found) return false
  }
  return true
}

/**
 * Guaranteed-safe minimal floor used only if the randomized generator somehow fails several
 * times in a row. A straight corridor with each required room hung off one side — never
 * pretty, but never a soft-lock either.
 */
function fallbackLayout(req: GenerationRequest): FloorLayout {
  const rng = new Rng(req.seed ^ 0x5bd1e995)
  const cells = new Map<string, FloorCell>()
  const spawnCell: FloorCell = { x: 0, z: 0, sizeClass: 'room', connections: new Set(), purpose: 'spawn' }
  cells.set(cellKey(0, 0), spawnCell)

  const purposes = [...req.requiredPurposes, ...req.optionalPurposes]
  const length = Math.max(purposes.length + 2, 5)
  let prev = spawnCell
  const specialRooms: SpecialRoom[] = []

  for (let i = 1; i <= length; i++) {
    const cell: FloorCell = { x: 0, z: i, sizeClass: i % 2 === 0 ? 'room' : 'hallway', connections: new Set(), purpose: 'corridor' }
    cells.set(cellKey(0, i), cell)
    prev.connections.add('S')
    cell.connections.add('N')

    const purpose = purposes[i - 1]
    if (purpose) {
      const side: Direction = rng.chance(0.5) ? 'E' : 'W'
      const { dx, dz } = DIR_VECTOR[side]
      const branchCell: FloorCell = { x: cell.x + dx, z: cell.z + dz, sizeClass: 'room', connections: new Set(), purpose }
      cells.set(cellKey(branchCell.x, branchCell.z), branchCell)
      cell.connections.add(side)
      branchCell.connections.add(OPPOSITE_DIR[side])
      specialRooms.push({ purpose, cell: branchCell, center: cellWorldCenter(branchCell) })
    }
    prev = cell
  }

  prev.purpose = 'elevator'
  prev.sizeClass = 'room'

  return {
    floorNumber: req.floorNumber,
    kind: req.kind,
    seed: req.seed,
    cells,
    spawnCell,
    elevatorCell: prev,
    specialRooms,
    minX: -1,
    maxX: 1,
    minZ: 0,
    maxZ: length,
  }
}
