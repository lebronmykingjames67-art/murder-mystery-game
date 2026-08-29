import { withinFrontalArc, raySphereDistance } from '../physics.js'
import { createMote, updateMote } from './mote.js'
import { createWarden, updateWarden } from './warden.js'

/** Owns the live enemy list: spawning, per-frame update, contact damage, and the hit queries weapons need. */
export function createEnemyManager(scene, config) {
  const enemies = []

  function spawnMote(position) {
    const mote = createMote(scene, config, position)
    enemies.push(mote)
    return mote
  }

  function spawnWarden(position, facingYaw = 0) {
    const warden = createWarden(scene, config, position, facingYaw)
    enemies.push(warden)
    return warden
  }

  function killEnemy(enemy) {
    if (enemy.dead) return
    enemy.dead = true
    scene.remove(enemy.mesh)
    const index = enemies.indexOf(enemy)
    if (index !== -1) enemies.splice(index, 1)
  }

  function damageEnemy(enemy, amount) {
    if (enemy.dead) return false
    enemy.health -= amount
    if (enemy.health <= 0) killEnemy(enemy)
    return true
  }

  function isWithinShield(warden, point) {
    return withinFrontalArc(warden.position, point, warden.yaw, config.enemies.warden.shieldArcDegrees)
  }

  /** Nearest living enemy whose sphere overlaps a sphere at `position`/`radius` (used by Splitter's traveling bullets). */
  function findSphereHit(position, radius) {
    let nearest = null
    let nearestDist = Infinity
    for (const enemy of enemies) {
      const dist = position.distanceTo(enemy.position)
      if (dist < radius + enemy.radius && dist < nearestDist) {
        nearest = enemy
        nearestDist = dist
      }
    }
    return nearest
  }

  /** Nearest enemy hit by a ray (used by Static's hitscan pellets). Returns { enemy, distance } or null. */
  function raycast(origin, dir, maxDist) {
    let nearest = null
    let nearestT = Infinity
    for (const enemy of enemies) {
      const t = raySphereDistance(origin, dir, enemy.position, enemy.radius)
      if (t !== null && t < maxDist && t < nearestT) {
        nearest = enemy
        nearestT = t
      }
    }
    return nearest ? { enemy: nearest, distance: nearestT } : null
  }

  function update(dt, controller, colliders, callbacks = {}) {
    for (const enemy of enemies) {
      if (enemy.type === 'mote') updateMote(enemy, dt, config, controller.feet, colliders)
      else updateWarden(enemy, dt, config, controller.feet, colliders)

      if (enemy.contactCooldown > 0) continue
      const chestHeight = controller.feet.y + controller.height * 0.5
      const dx = controller.feet.x - enemy.position.x
      const dy = chestHeight - enemy.position.y
      const dz = controller.feet.z - enemy.position.z
      const touching = Math.hypot(dx, dy, dz) < enemy.radius + controller.radius + 0.25
      if (touching && controller.takeDamage(enemy.contactDamage)) {
        enemy.contactCooldown = enemy.contactCooldownMax
        callbacks.onPlayerHit?.(enemy.position, enemy.contactDamage)
      }
    }
  }

  return { enemies, spawnMote, spawnWarden, update, damageEnemy, killEnemy, isWithinShield, findSphereHit, raycast }
}
