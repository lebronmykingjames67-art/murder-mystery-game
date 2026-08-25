import type { FloorCell, FloorLayout } from '../types'
import { DIR_VECTOR } from '../types'
import type { Rng } from '../utils/rng'

function key(c: FloorCell): string {
  return `${c.x},${c.z}`
}

/** BFS over the floor's cell graph — always valid since the graph is connected by construction. */
export function bfsPath(layout: FloorLayout, from: FloorCell, to: FloorCell): FloorCell[] {
  if (from === to) return [from]
  const cameFrom = new Map<string, FloorCell>()
  const visited = new Set<string>([key(from)])
  const queue: FloorCell[] = [from]
  let reached = false

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur === to) {
      reached = true
      break
    }
    for (const dir of cur.connections) {
      const { dx, dz } = DIR_VECTOR[dir]
      const nk = `${cur.x + dx},${cur.z + dz}`
      if (visited.has(nk)) continue
      const next = layout.cells.get(nk)
      if (!next) continue
      visited.add(nk)
      cameFrom.set(nk, cur)
      queue.push(next)
    }
  }

  if (!reached && !visited.has(key(to))) return [from]

  const path: FloorCell[] = [to]
  let cur = to
  while (cur !== from) {
    const prev = cameFrom.get(key(cur))
    if (!prev) break
    path.push(prev)
    cur = prev
  }
  return path.reverse()
}

export function randomCell(layout: FloorLayout, rng: Rng, exclude?: FloorCell): FloorCell {
  const arr = Array.from(layout.cells.values()).filter((c) => c !== exclude)
  return rng.pick(arr.length > 0 ? arr : Array.from(layout.cells.values()))
}

export function cellAtWorld(layout: FloorLayout, worldX: number, worldZ: number, cellSize: number): FloorCell | undefined {
  const cx = Math.floor(worldX / cellSize)
  const cz = Math.floor(worldZ / cellSize)
  return layout.cells.get(`${cx},${cz}`)
}
