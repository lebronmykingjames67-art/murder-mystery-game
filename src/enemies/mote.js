import * as THREE from 'three'
import { pushSphereOutOfColliders } from '../physics.js'

const geometry = new THREE.OctahedronGeometry(0.5, 0)
const material = new THREE.MeshStandardMaterial({ color: 0x0a0d12, emissive: 0x22e8ff, emissiveIntensity: 0.9 })
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x22e8ff })

/** MOTE — small, floats, drifts toward the player, dies in one hit (DESIGN.md Section 9). */
export function createMote(scene, config, position) {
  const cfg = config.enemies.mote
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial))
  scene.add(mesh)

  return {
    type: 'mote',
    mesh,
    position: mesh.position,
    baseY: position.y,
    bobPhase: Math.random() * Math.PI * 2,
    radius: cfg.radius,
    health: cfg.health,
    maxHealth: cfg.health,
    contactDamage: cfg.contactDamage,
    contactCooldownMax: cfg.contactCooldown,
    contactCooldown: 0,
    dead: false,
  }
}

export function updateMote(mote, dt, config, playerPosition, colliders) {
  const cfg = config.enemies.mote
  const dx = playerPosition.x - mote.position.x
  const dz = playerPosition.z - mote.position.z
  const dist = Math.hypot(dx, dz)
  if (dist > 0.01) {
    mote.position.x += (dx / dist) * cfg.speed * dt
    mote.position.z += (dz / dist) * cfg.speed * dt
  }

  mote.bobPhase += dt * 2.2
  mote.position.y = mote.baseY + Math.sin(mote.bobPhase) * 0.2

  pushSphereOutOfColliders(mote.position, mote.radius, colliders)
  mote.mesh.rotation.y += dt * 1.5

  if (mote.contactCooldown > 0) mote.contactCooldown -= dt
}
