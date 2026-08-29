import * as THREE from 'three'
import { pushSphereOutOfColliders } from '../physics.js'

const WIDTH = 2.4
const HEIGHT = 2.2
const DEPTH = 0.9

const bodyGeometry = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH)
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.8 })
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x22e8ff })
const shieldGeometry = new THREE.PlaneGeometry(WIDTH, HEIGHT)
const shieldMaterial = new THREE.MeshBasicMaterial({
  color: 0x8ff2ff,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
})

function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

/**
 * WARDEN — heavy, a glowing shield across its front 120 degrees reflects
 * bullets back at the shooter; flank it or bait it into turning
 * (DESIGN.md Section 9). It slowly rotates to face the player, at a capped
 * turn rate, which is exactly what makes flanking possible.
 */
export function createWarden(scene, config, position, facingYaw = 0) {
  const cfg = config.enemies.warden
  const mesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
  mesh.position.copy(position)
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeometry), edgeMaterial))

  const shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
  shield.position.set(0, 0, -DEPTH / 2 - 0.02)
  shield.rotation.y = Math.PI
  mesh.add(shield)

  scene.add(mesh)
  mesh.rotation.y = facingYaw

  return {
    type: 'warden',
    mesh,
    position: mesh.position,
    yaw: facingYaw,
    radius: cfg.radius,
    health: cfg.health,
    maxHealth: cfg.health,
    contactDamage: cfg.contactDamage,
    contactCooldownMax: cfg.contactCooldown,
    contactCooldown: 0,
    dead: false,
  }
}

export function updateWarden(warden, dt, config, playerPosition, colliders) {
  const cfg = config.enemies.warden
  const dx = playerPosition.x - warden.position.x
  const dz = playerPosition.z - warden.position.z
  const dist = Math.hypot(dx, dz)

  if (dist > 0.01) {
    const desiredYaw = Math.atan2(-dx, -dz)
    const maxTurn = THREE.MathUtils.degToRad(cfg.turnSpeedDegrees) * dt
    const delta = angleDelta(warden.yaw, desiredYaw)
    warden.yaw += THREE.MathUtils.clamp(delta, -maxTurn, maxTurn)
  }

  const chaseDistance = dist - (warden.radius + 1.5)
  if (chaseDistance > 0) {
    warden.position.x += (dx / dist) * cfg.speed * dt
    warden.position.z += (dz / dist) * cfg.speed * dt
  }

  pushSphereOutOfColliders(warden.position, warden.radius, colliders)
  warden.mesh.rotation.y = warden.yaw

  if (warden.contactCooldown > 0) warden.contactCooldown -= dt
}
