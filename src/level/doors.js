import * as THREE from 'three'
import { doorPosition } from './levelKit.js'

const material = new THREE.MeshStandardMaterial({ color: 0x1a0606, roughness: 0.7, transparent: true, opacity: 0.9 })
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xff3b3b }) // red reads as "locked", distinct from the floor's accent color

/**
 * A toggleable physical barrier filling one doorway. Sits exactly in the gap
 * `buildPerimeterWalls` left open, spanning the full wall height, so locking
 * it seals the doorway completely rather than leaving a gap above it.
 */
export function createDoor(scene, colliders, roomOrigin, side, floorConfig) {
  const { doorWidth, wallHeight, wallThickness } = floorConfig
  const center = doorPosition(roomOrigin, side, floorConfig.chunkSize)
  const horizontal = side === 'N' || side === 'S'
  const size = horizontal
    ? new THREE.Vector3(doorWidth, wallHeight, wallThickness)
    : new THREE.Vector3(wallThickness, wallHeight, doorWidth)

  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(center.x, wallHeight / 2, center.z)
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial)
  edges.position.copy(mesh.position)

  let locked = false
  let collider = null

  function lock() {
    if (locked) return
    locked = true
    scene.add(mesh)
    scene.add(edges)
    collider = {
      min: new THREE.Vector3(mesh.position.x - size.x / 2, 0, mesh.position.z - size.z / 2),
      max: new THREE.Vector3(mesh.position.x + size.x / 2, size.y, mesh.position.z + size.z / 2),
    }
    colliders.push(collider)
  }

  function unlock() {
    if (!locked) return
    locked = false
    scene.remove(mesh)
    scene.remove(edges)
    const index = colliders.indexOf(collider)
    if (index !== -1) colliders.splice(index, 1)
    collider = null
  }

  return {
    lock,
    unlock,
    get locked() {
      return locked
    },
  }
}
