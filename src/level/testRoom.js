import * as THREE from 'three'

const EDGE_COLOR = 0x22e8ff
const FACE_COLOR = 0x0a0d12

const faceMaterial = new THREE.MeshStandardMaterial({
  color: FACE_COLOR,
  roughness: 0.9,
  metalness: 0.1,
})
const edgeMaterial = new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: 0.85 })

/**
 * Adds a solid dark box with glowing cyan wireframe edges at `center`, sized
 * `size`, and registers its AABB as a collider. Every piece of the test
 * room's geometry goes through this so the art direction (Section 14) and
 * the collider list stay in lock-step.
 */
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

/**
 * Builds the Phase 1 movement test room (~84x84 units) and returns
 * { colliders, spawn, fallResetY }.
 *
 * Ground plan (a single floor slab covers everything except the dash-gap
 * void, so missing a jump elsewhere just drops you harmlessly back to it):
 *   - southwest: spawn + a 9-step staircase up to a mezzanine
 *   - south-central: a causeway with three gaps of increasing width
 *   - center: a full-width low ceiling band that only a slide fits under
 *   - northeast of that: four pillars to strafe around
 *   - north: the floor ends at a ledge; beyond it, reachable only by
 *     jumping and dashing mid-air, is a raised platform
 */
export function buildTestRoom(scene) {
  const colliders = []
  const bound = 42
  const wallHeight = 8
  const wallThickness = 1

  // Main floor: covers the whole room except the dash-gap void (z: 23 to 31.3).
  const floorDepth = 65
  const floorCenterZ = -bound + floorDepth / 2
  addBox(scene, colliders, new THREE.Vector3(0, -0.5, floorCenterZ), new THREE.Vector3(bound * 2, 1, floorDepth))

  addBox(scene, colliders, new THREE.Vector3(0, wallHeight / 2, -bound), new THREE.Vector3(bound * 2, wallHeight, wallThickness))
  addBox(scene, colliders, new THREE.Vector3(0, wallHeight / 2, bound), new THREE.Vector3(bound * 2, wallHeight, wallThickness))
  addBox(scene, colliders, new THREE.Vector3(-bound, wallHeight / 2, 0), new THREE.Vector3(wallThickness, wallHeight, bound * 2))
  addBox(scene, colliders, new THREE.Vector3(bound, wallHeight / 2, 0), new THREE.Vector3(wallThickness, wallHeight, bound * 2))

  // --- Stairs: 9 steps climbing from z=-34 to z=-16, up to y=3.6 ---
  const stepCount = 9
  const stepRise = 0.4
  const stepDepth = 2
  const stairsX = -30
  const stairsStartZ = -34
  for (let i = 0; i < stepCount; i++) {
    const stepY = stepRise * (i + 1)
    const stepZ = stairsStartZ + i * stepDepth
    addBox(scene, colliders, new THREE.Vector3(stairsX, stepY / 2, stepZ), new THREE.Vector3(6, stepY, stepDepth))
  }
  const mezzanineY = stepRise * stepCount
  addBox(scene, colliders, new THREE.Vector3(stairsX, mezzanineY - 0.15, stairsStartZ + stepCount * stepDepth + 2), new THREE.Vector3(6, 0.3, 4))

  // --- Causeway: three gaps of increasing width, low enough to jump onto from the floor ---
  const causewayY = 0.9
  const causewayThickness = 0.4
  const causewayZ = -28
  const causewayDepth = 5
  const gapWidths = [3, 4.5, 6]
  const padWidth = 4
  let cursorX = -6 + padWidth / 2
  addBox(scene, colliders, new THREE.Vector3(cursorX, causewayY, causewayZ), new THREE.Vector3(padWidth, causewayThickness, causewayDepth))
  for (const gap of gapWidths) {
    cursorX += padWidth / 2 + gap + padWidth / 2
    addBox(scene, colliders, new THREE.Vector3(cursorX, causewayY, causewayZ), new THREE.Vector3(padWidth, causewayThickness, causewayDepth))
  }

  // --- Low ceiling band, full width so it can't be walked around: only a slide fits under it ---
  const clearance = 1.2
  addBox(scene, colliders, new THREE.Vector3(0, clearance + 0.15, 5), new THREE.Vector3(bound * 2, 0.3, 10))

  // --- Four pillars to strafe around, north of the ceiling band ---
  const pillarPositions = [
    [18, 16],
    [28, 16],
    [18, 20],
    [28, 20],
  ]
  for (const [x, z] of pillarPositions) {
    addBox(scene, colliders, new THREE.Vector3(x, 3, z), new THREE.Vector3(1.4, 6, 1.4))
  }

  // --- Raised platform beyond the floor's north edge (z=23), reachable only by jump+dash ---
  // Plain sprint-jump range is ~8.2 units; the gap here is 8.3, and the
  // platform sits low (0.6) and deep (8 units) so a well-timed dash clears it.
  addBox(scene, colliders, new THREE.Vector3(0, 0.3, 35.3), new THREE.Vector3(10, 0.6, 8))

  const ambient = new THREE.HemisphereLight(0x2a3d4d, 0x03040a, 1.1)
  scene.add(ambient)
  const key = new THREE.DirectionalLight(0x8fd8ff, 0.5)
  key.position.set(20, 30, 10)
  scene.add(key)

  return {
    colliders,
    spawn: new THREE.Vector3(stairsX, 0.15, -38),
    fallResetY: -15,
  }
}
