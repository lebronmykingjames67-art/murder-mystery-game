import * as THREE from 'three'

/** A collider is a function so doors/props can stop blocking once opened/removed, without rebuilding the list. */
export type ColliderSource = () => THREE.Box3 | null

export function resolvePosition(pos: THREE.Vector3, radius: number, colliders: ColliderSource[]) {
  for (const source of colliders) {
    const box = source()
    if (!box) continue
    const closestX = Math.max(box.min.x, Math.min(pos.x, box.max.x))
    const closestZ = Math.max(box.min.z, Math.min(pos.z, box.max.z))
    const dx = pos.x - closestX
    const dz = pos.z - closestZ
    const distSq = dx * dx + dz * dz
    if (distSq < radius * radius) {
      if (distSq > 1e-9) {
        const dist = Math.sqrt(distSq)
        const push = radius - dist
        pos.x += (dx / dist) * push
        pos.z += (dz / dist) * push
      } else {
        const overlapX = Math.min(pos.x - box.min.x, box.max.x - pos.x)
        const overlapZ = Math.min(pos.z - box.min.z, box.max.z - pos.z)
        const cx = (box.min.x + box.max.x) / 2
        const cz = (box.min.z + box.max.z) / 2
        if (overlapX < overlapZ) pos.x += (pos.x - cx > 0 ? 1 : -1) * (overlapX + radius)
        else pos.z += (pos.z - cz > 0 ? 1 : -1) * (overlapZ + radius)
      }
    }
  }
}
