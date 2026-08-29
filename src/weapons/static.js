import * as THREE from 'three'
import { rayBoxDistance } from '../physics.js'

const UP = new THREE.Vector3(0, 1, 0)

function randomConeDirection(baseDir, maxAngleDegrees) {
  const maxAngle = THREE.MathUtils.degToRad(maxAngleDegrees)
  let axis = new THREE.Vector3().crossVectors(baseDir, UP)
  if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0)
  axis.normalize()
  axis.applyAxisAngle(baseDir, Math.random() * Math.PI * 2)
  return baseDir.clone().applyAxisAngle(axis, Math.random() * maxAngle)
}

function nearestLevelHit(origin, dir, colliders, maxDist) {
  let nearest = maxDist
  for (const box of colliders) {
    const t = rayBoxDistance(origin, dir, box)
    if (t !== null && t < nearest) nearest = t
  }
  return nearest
}

function falloffDamage(cfg, distance) {
  const t = THREE.MathUtils.clamp(distance / cfg.damageFalloffDistance, 0, 1)
  return THREE.MathUtils.lerp(cfg.damageClose, cfg.minDamage, t)
}

/**
 * STATIC — shotgun; massive knockback on the shooter (fire at the floor to
 * rocket-jump), damage drops off hard past 8 units (DESIGN.md Section 7).
 * Hitscan: no traveling projectiles, so it doesn't touch the bullet pool.
 */
export function fireStatic(config, controller, origin, aimDir, world, callbacks = {}) {
  const cfg = config.weapons.static
  const { colliders, enemyManager } = world

  for (let i = 0; i < cfg.pelletCount; i++) {
    const dir = randomConeDirection(aimDir, cfg.spreadDegrees)
    const levelDist = nearestLevelHit(origin, dir, colliders, cfg.range)
    const enemyHit = enemyManager.raycast(origin, dir, levelDist)

    if (enemyHit) {
      const hitPoint = origin.clone().addScaledVector(dir, enemyHit.distance)
      const damage = falloffDamage(cfg, enemyHit.distance)
      if (enemyHit.enemy.type === 'warden' && enemyManager.isWithinShield(enemyHit.enemy, hitPoint)) {
        if (controller.takeDamage(damage)) callbacks.onPlayerHit?.(hitPoint, damage)
        callbacks.onShieldBlock?.(hitPoint)
      } else {
        enemyManager.damageEnemy(enemyHit.enemy, damage)
        callbacks.onEnemyHit?.(hitPoint, damage, enemyHit.enemy)
      }
    } else if (levelDist < cfg.range) {
      callbacks.onWallHit?.(origin.clone().addScaledVector(dir, levelDist))
    }
  }

  controller.velocity.addScaledVector(aimDir, -cfg.knockback)
}
