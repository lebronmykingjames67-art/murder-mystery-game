import * as THREE from 'three'
import { buildPerimeterWalls } from './levelKit.js'

const V3 = THREE.Vector3

function floorSlab(kit, scene, colliders, origin, chunkSize) {
  kit.addBox(scene, colliders, new V3(origin.x, -0.5, origin.z), new V3(chunkSize, 1, chunkSize))
}

/**
 * The hand-made chunk library (DESIGN.md Section 10): ~40x40 room shapes
 * with door sockets on a subset of N/S/E/W. `doors` lists every socket a
 * chunk COULD use; the generator decides, per room, which are actually
 * open (connected), closed (sealed), or skipped (built by a neighbor) —
 * see levelKit.buildPerimeterWalls.
 *
 * Every build(kit, scene, colliders, origin, sides, floorConfig) returns
 * { spawnMarker } — a safe standable point inside the room.
 */
export const CHUNKS = [
  {
    id: 'plain-cross',
    doors: ['N', 'S', 'E', 'W'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      floorSlab(kit, scene, colliders, origin, floorConfig.chunkSize)
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)
      for (const [dx, dz] of [
        [-7, -7],
        [7, 7],
      ]) {
        kit.addBox(scene, colliders, new V3(origin.x + dx, 3, origin.z + dz), new V3(1.4, 6, 1.4))
      }
      return { spawnMarker: new V3(origin.x, 0.15, origin.z) }
    },
  },
  {
    id: 'pillar-field',
    doors: ['N', 'S', 'E', 'W'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      floorSlab(kit, scene, colliders, origin, floorConfig.chunkSize)
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)
      for (const [dx, dz] of [
        [-8, -8],
        [8, -8],
        [-8, 8],
        [8, 8],
      ]) {
        kit.addBox(scene, colliders, new V3(origin.x + dx, 3, origin.z + dz), new V3(1.4, 6, 1.4))
      }
      return { spawnMarker: new V3(origin.x, 0.15, origin.z) }
    },
  },
  {
    id: 'wide-hall',
    doors: ['E', 'W'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      floorSlab(kit, scene, colliders, origin, floorConfig.chunkSize)
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)
      // Open in the middle on purpose — good ground for flanking a Warden.
      return { spawnMarker: new V3(origin.x, 0.15, origin.z) }
    },
  },
  {
    id: 'corner-room',
    doors: ['N', 'E'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      floorSlab(kit, scene, colliders, origin, floorConfig.chunkSize)
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)
      kit.addBox(scene, colliders, new V3(origin.x - 4, 2.5, origin.z + 4), new V3(3, 5, 3))
      return { spawnMarker: new V3(origin.x, 0.15, origin.z) }
    },
  },
  {
    id: 'stairs-room',
    doors: ['N', 'S'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      floorSlab(kit, scene, colliders, origin, floorConfig.chunkSize)
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)

      const stepCount = 5
      const stepRise = 0.4
      const stepDepth = 1.6
      const startZ = origin.z - 6
      for (let i = 0; i < stepCount; i++) {
        const stepY = stepRise * (i + 1)
        kit.addBox(scene, colliders, new V3(origin.x, stepY / 2, startZ + i * stepDepth), new V3(6, stepY, stepDepth))
      }
      const mezzanineY = stepRise * stepCount
      kit.addBox(
        scene,
        colliders,
        new V3(origin.x, mezzanineY - 0.15, startZ + stepCount * stepDepth + 1.5),
        new V3(6, 0.3, 3)
      )
      return { spawnMarker: new V3(origin.x, 0.15, origin.z + 12) }
    },
  },
  {
    id: 'gap-gauntlet',
    doors: ['N', 'S'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)

      // Three floor segments spanning the full room (door to door), each pad
      // butted right up against the doorway or the next gap — no segment is
      // ever short of its neighbor, so there's no accidental void underfoot.
      const segments = [
        [-20, -12], // pad0: from the N doorway
        [-12, -9], // gap (3)
        [-9, -1], // pad1
        [-1, 3], // gap (4)
        [3, 20], // pad2: to the S doorway
      ]
      for (let i = 0; i < segments.length; i += 2) {
        const [zMin, zMax] = segments[i]
        const depth = zMax - zMin
        kit.addBox(scene, colliders, new V3(origin.x, -0.5, origin.z + (zMin + zMax) / 2), new V3(8, 1, depth))
      }
      return { spawnMarker: new V3(origin.x, 0.15, origin.z - 17) }
    },
  },
  {
    id: 'quiet-room',
    doors: ['N', 'S'],
    build(kit, scene, colliders, origin, sides, floorConfig) {
      floorSlab(kit, scene, colliders, origin, floorConfig.chunkSize)
      buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides)
      return { spawnMarker: new V3(origin.x, 0.15, origin.z) }
    },
  },
]

export function getChunkById(id) {
  const chunk = CHUNKS.find((c) => c.id === id)
  if (!chunk) throw new Error(`Unknown chunk: ${id}`)
  return chunk
}
