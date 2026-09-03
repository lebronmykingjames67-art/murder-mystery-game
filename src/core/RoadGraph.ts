import type { RoadEdge, RoadNode, VehicleTierId } from '../types'
import { CONNECTORS, DISTRICTS, SHORTCUT_ROUTE_ID } from '../data/districts'

/** How far traffic (and the route line) sits to the left of a road's centerline, in world units. */
export const LANE_OFFSET = 2.1

export interface PathfindContext {
  vehicleTier: VehicleTierId
  unlockedRoutes: Set<string>
}

export interface PathResult {
  nodeIds: string[]
  edgeIds: string[]
  totalDistance: number
}

interface AStarEntry {
  nodeId: string
  g: number
  f: number
  cameFromEdge: string | null
}

/** Simple deterministic PRNG so city layout is stable across reloads without storing extra data. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822519)
    h = Math.imul(h ^ (h >>> 13), 3266489917)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

export class RoadGraph {
  readonly nodes = new Map<string, RoadNode>()
  readonly edges = new Map<string, RoadEdge>()
  private readonly adjacency = new Map<string, string[]>()
  private readonly districtGrid = new Map<string, Map<string, string>>()

  constructor() {
    for (const district of DISTRICTS) this.buildDistrictGrid(district)
    this.buildConnectors()
    this.buildShortcut()
  }

  static nodeId(districtId: string, col: number, row: number): string {
    return `${districtId}_${col}_${row}`
  }

  private buildDistrictGrid(district: (typeof DISTRICTS)[number]): void {
    const grid = new Map<string, string>()
    this.districtGrid.set(district.id, grid)
    const rand = seededRandom(district.id)
    const centerCol = Math.floor(district.gridCols / 2)
    const centerRow = Math.floor(district.gridRows / 2)
    const isDowntown = district.id === 'downtown'

    for (let row = 0; row < district.gridRows; row++) {
      for (let col = 0; col < district.gridCols; col++) {
        const id = RoadGraph.nodeId(district.id, col, row)
        const isBoundary = col === 0 || row === 0 || col === district.gridCols - 1 || row === district.gridRows - 1
        const isDepot = isDowntown && col === centerCol && row === centerRow
        const isPOI = isDepot || (!isBoundary && rand() < 0.55)
        const node: RoadNode = {
          id,
          x: district.origin.x + col * district.blockSize,
          z: district.origin.z + row * district.blockSize,
          districtId: district.id,
          isIntersection: true,
          isPOI,
          poiName: isDepot ? 'Courier Depot' : undefined,
        }
        this.nodes.set(id, node)
        grid.set(`${col},${row}`, id)
      }
    }

    for (let row = 0; row < district.gridRows; row++) {
      for (let col = 0; col < district.gridCols; col++) {
        const id = grid.get(`${col},${row}`)!
        if (col + 1 < district.gridCols) this.addEdge(id, grid.get(`${col + 1},${row}`)!, { baseSpeedLimit: 14 })
        if (row + 1 < district.gridRows) this.addEdge(id, grid.get(`${col},${row + 1}`)!, { baseSpeedLimit: 14 })
      }
    }
  }

  private buildConnectors(): void {
    for (const spec of CONNECTORS) {
      const fromId = this.districtGrid.get(spec.fromDistrict)?.get(`${spec.fromGrid[0]},${spec.fromGrid[1]}`)
      const toId = this.districtGrid.get(spec.toDistrict)?.get(`${spec.toGrid[0]},${spec.toGrid[1]}`)
      if (!fromId || !toId) continue
      this.addEdge(fromId, toId, {
        baseSpeedLimit: 22,
        locked: true,
        unlockRouteId: spec.id,
        isConnector: true,
        connectorRouteId: spec.id,
      })
    }
  }

  private buildShortcut(): void {
    const grid = this.districtGrid.get('oldtown')
    if (!grid) return
    const a = grid.get('1,1')
    const b = grid.get('3,3')
    if (!a || !b) return
    this.addEdge(a, b, {
      baseSpeedLimit: 12,
      locked: true,
      unlockRouteId: SHORTCUT_ROUTE_ID,
      vehicleOnly: ['bicycle', 'ebike', 'scooter'],
    })
  }

  private addEdge(
    fromId: string,
    toId: string,
    opts: {
      baseSpeedLimit: number
      locked?: boolean
      unlockRouteId?: string
      vehicleOnly?: VehicleTierId[]
      isConnector?: boolean
      connectorRouteId?: string
    },
  ): RoadEdge {
    const from = this.nodes.get(fromId)!
    const to = this.nodes.get(toId)!
    const distance = Math.hypot(to.x - from.x, to.z - from.z)
    const id = `e_${fromId}__${toId}`
    const edge: RoadEdge = {
      id,
      from: fromId,
      to: toId,
      distance,
      baseSpeedLimit: opts.baseSpeedLimit,
      locked: opts.locked ?? false,
      unlockRouteId: opts.unlockRouteId,
      vehicleOnly: opts.vehicleOnly ?? [],
      weightMultiplier: 1,
      closed: false,
      isConnector: opts.isConnector ?? false,
      connectorRouteId: opts.connectorRouteId,
    }
    this.edges.set(id, edge)
    this.pushAdjacency(fromId, id)
    this.pushAdjacency(toId, id)
    return edge
  }

  private pushAdjacency(nodeId: string, edgeId: string): void {
    const list = this.adjacency.get(nodeId)
    if (list) list.push(edgeId)
    else this.adjacency.set(nodeId, [edgeId])
  }

  getNode(id: string): RoadNode | undefined {
    return this.nodes.get(id)
  }

  getEdge(id: string): RoadEdge | undefined {
    return this.edges.get(id)
  }

  edgesAt(nodeId: string): RoadEdge[] {
    return (this.adjacency.get(nodeId) ?? []).map((id) => this.edges.get(id)!).filter(Boolean)
  }

  otherEnd(edge: RoadEdge, nodeId: string): string {
    return edge.from === nodeId ? edge.to : edge.from
  }

  private edgeUsable(edge: RoadEdge, ctx: PathfindContext): boolean {
    if (edge.closed) return false
    if (edge.locked && !(edge.unlockRouteId && ctx.unlockedRoutes.has(edge.unlockRouteId))) return false
    if (edge.vehicleOnly.length > 0 && !edge.vehicleOnly.includes(ctx.vehicleTier)) return false
    return true
  }

  findPath(fromId: string, toId: string, ctx: PathfindContext): PathResult | null {
    if (fromId === toId) return { nodeIds: [fromId], edgeIds: [], totalDistance: 0 }
    const goal = this.nodes.get(toId)
    if (!goal || !this.nodes.get(fromId)) return null

    const open = new Map<string, AStarEntry>()
    const closed = new Set<string>()
    const heuristic = (id: string): number => {
      const n = this.nodes.get(id)!
      return Math.hypot(n.x - goal.x, n.z - goal.z)
    }
    open.set(fromId, { nodeId: fromId, g: 0, f: heuristic(fromId), cameFromEdge: null })
    const cameFrom = new Map<string, { prevNode: string; edgeId: string }>()

    while (open.size > 0) {
      let currentId = ''
      let best = Infinity
      for (const [id, entry] of open) {
        if (entry.f < best) {
          best = entry.f
          currentId = id
        }
      }
      const current = open.get(currentId)!
      if (currentId === toId) {
        const nodeIds: string[] = [currentId]
        const edgeIds: string[] = []
        let cursor = currentId
        while (cameFrom.has(cursor)) {
          const link = cameFrom.get(cursor)!
          edgeIds.unshift(link.edgeId)
          nodeIds.unshift(link.prevNode)
          cursor = link.prevNode
        }
        return { nodeIds, edgeIds, totalDistance: current.g }
      }
      open.delete(currentId)
      closed.add(currentId)

      for (const edge of this.edgesAt(currentId)) {
        if (!this.edgeUsable(edge, ctx)) continue
        const neighborId = this.otherEnd(edge, currentId)
        if (closed.has(neighborId)) continue
        const tentativeG = current.g + edge.distance * edge.weightMultiplier
        const existing = open.get(neighborId)
        if (!existing || tentativeG < existing.g) {
          open.set(neighborId, { nodeId: neighborId, g: tentativeG, f: tentativeG + heuristic(neighborId), cameFromEdge: edge.id })
          cameFrom.set(neighborId, { prevNode: currentId, edgeId: edge.id })
        }
      }
    }
    return null
  }

  poisInDistricts(unlockedDistricts: Set<string>): RoadNode[] {
    const result: RoadNode[] = []
    for (const node of this.nodes.values()) {
      if (node.isPOI && unlockedDistricts.has(node.districtId) && !node.poiName) result.push(node)
    }
    return result
  }

  depotNode(): RoadNode {
    return [...this.nodes.values()].find((n) => n.poiName === 'Courier Depot')!
  }

  nearestNode(x: number, z: number, unlockedDistricts?: Set<string>): RoadNode | undefined {
    let best: RoadNode | undefined
    let bestDist = Infinity
    for (const node of this.nodes.values()) {
      if (unlockedDistricts && !unlockedDistricts.has(node.districtId)) continue
      const d = Math.hypot(node.x - x, node.z - z)
      if (d < bestDist) {
        bestDist = d
        best = node
      }
    }
    return best
  }

  pickRandomOpenEdge(unlockedDistricts: Set<string>): RoadEdge | undefined {
    const candidates = [...this.edges.values()].filter((e) => {
      if (e.closed || e.locked) return false
      const from = this.nodes.get(e.from)!
      const to = this.nodes.get(e.to)!
      return unlockedDistricts.has(from.districtId) && unlockedDistricts.has(to.districtId)
    })
    if (candidates.length === 0) return undefined
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
}
