import * as THREE from 'three'

const FACE_COLOR = 0x0a0d12

/**
 * Bundles the geometry-building helper used across all chunks with one
 * floor's accent color (DESIGN.md Section 14: cyan/amber/magenta/acid
 * green/white per floor), so a chunk's build() function never has to know
 * which floor it's on.
 */
export function createLevelKit(accentColor) {
  const faceMaterial = new THREE.MeshStandardMaterial({ color: FACE_COLOR, roughness: 0.9, metalness: 0.1 })
  const edgeMaterial = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.85 })

  /** Adds a solid dark box with glowing edge lines at `center`, sized `size`, and registers its AABB as a collider. */
  function addBox(scene, colliders, center, size) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const mesh = new THREE.Mesh(geometry, faceMaterial)
    mesh.position.copy(center)
    scene.add(mesh)

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial)
    edges.position.copy(center)
    scene.add(edges)

    colliders.push({
      min: new THREE.Vector3(center.x - size.x / 2, center.y - size.y / 2, center.z - size.z / 2),
      max: new THREE.Vector3(center.x + size.x / 2, center.y + size.y / 2, center.z + size.z / 2),
    })
  }

  return { addBox, accentColor, faceMaterial, edgeMaterial }
}

/**
 * Builds a chunk's four perimeter walls. `sides` maps 'N'|'S'|'E'|'W' to
 * 'open' (a doorway-width gap, flanked by two wall segments), 'closed' (one
 * full wall segment), or 'skip' (build nothing — used when the neighboring
 * room on that side already built the shared wall, so boundaries between
 * two placed rooms are only ever built once).
 */
export function buildPerimeterWalls(kit, scene, colliders, origin, floorConfig, sides) {
  const { chunkSize, wallHeight, wallThickness, doorWidth } = floorConfig
  const half = chunkSize / 2
  const segW = (chunkSize - doorWidth) / 2
  const V3 = THREE.Vector3

  const horizontal = [
    ['N', -1],
    ['S', 1],
  ]
  for (const [side, zSign] of horizontal) {
    const mode = sides[side] ?? 'closed'
    if (mode === 'skip') continue
    const z = origin.z + zSign * half
    if (mode === 'open') {
      kit.addBox(scene, colliders, new V3(origin.x - (doorWidth / 2 + segW / 2), wallHeight / 2, z), new V3(segW, wallHeight, wallThickness))
      kit.addBox(scene, colliders, new V3(origin.x + (doorWidth / 2 + segW / 2), wallHeight / 2, z), new V3(segW, wallHeight, wallThickness))
    } else {
      kit.addBox(scene, colliders, new V3(origin.x, wallHeight / 2, z), new V3(chunkSize, wallHeight, wallThickness))
    }
  }

  const vertical = [
    ['W', -1],
    ['E', 1],
  ]
  for (const [side, xSign] of vertical) {
    const mode = sides[side] ?? 'closed'
    if (mode === 'skip') continue
    const x = origin.x + xSign * half
    if (mode === 'open') {
      kit.addBox(scene, colliders, new V3(x, wallHeight / 2, origin.z - (doorWidth / 2 + segW / 2)), new V3(wallThickness, wallHeight, segW))
      kit.addBox(scene, colliders, new V3(x, wallHeight / 2, origin.z + (doorWidth / 2 + segW / 2)), new V3(wallThickness, wallHeight, segW))
    } else {
      kit.addBox(scene, colliders, new V3(x, wallHeight / 2, origin.z), new V3(wallThickness, wallHeight, chunkSize))
    }
  }
}

/** World-space center of the doorway gap on `side` of a room centered at `origin`. */
export function doorPosition(origin, side, chunkSize) {
  const half = chunkSize / 2
  switch (side) {
    case 'N':
      return new THREE.Vector3(origin.x, 0, origin.z - half)
    case 'S':
      return new THREE.Vector3(origin.x, 0, origin.z + half)
    case 'E':
      return new THREE.Vector3(origin.x + half, 0, origin.z)
    case 'W':
      return new THREE.Vector3(origin.x - half, 0, origin.z)
    default:
      throw new Error(`Unknown side: ${side}`)
  }
}

export const OPPOSITE_SIDE = { N: 'S', S: 'N', E: 'W', W: 'E' }
export const SIDE_OFFSET = {
  N: { x: 0, z: -1 },
  S: { x: 0, z: 1 },
  E: { x: 1, z: 0 },
  W: { x: -1, z: 0 },
}
