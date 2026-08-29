import * as THREE from 'three'
import { sphereBoxCollision, reflect } from '../physics.js'

const UP = new THREE.Vector3(0, 1, 0)
const scratchReflect = new THREE.Vector3()

/** SPLITTER — semi-auto pistol; bullets ricochet once off walls and split into two smaller bullets on the bounce (DESIGN.md Section 7). */
export function fireSplitter(pool, config, origin, direction) {
  const cfg = config.weapons.splitter
  return pool.spawn({
    position: origin,
    velocity: direction.clone().multiplyScalar(cfg.bulletSpeed),
    radius: cfg.bulletRadius,
    damage: cfg.damage,
    life: cfg.bulletLife,
    bouncesRemaining: 1,
  })
}

function spawnSplitPair(pool, config, bullet, reflectedDir) {
  const cfg = config.weapons.splitter
  let axis = scratchReflect.crossVectors(reflectedDir, UP)
  if (axis.lengthSq() < 1e-6) axis = scratchReflect.set(1, 0, 0)
  axis.normalize()
  const half = THREE.MathUtils.degToRad(cfg.splitSpreadDegrees / 2)

  for (const sign of [1, -1]) {
    const dir = reflectedDir.clone().applyAxisAngle(axis, half * sign)
    pool.spawn({
      position: bullet.position,
      velocity: dir.multiplyScalar(cfg.bulletSpeed),
      radius: cfg.bulletRadius * 0.7,
      damage: bullet.damage * cfg.splitDamageScale,
      life: cfg.bulletLife * 0.6,
      bouncesRemaining: 0,
    })
  }
}

export function updateSplitterBullets(pool, dt, config, world, callbacks = {}) {
  const { colliders, enemyManager, controller } = world

  for (const bullet of pool.bullets) {
    if (!bullet.active) continue

    bullet.life -= dt
    if (bullet.life <= 0) {
      pool.kill(bullet)
      continue
    }

    bullet.position.addScaledVector(bullet.velocity, dt)
    bullet.mesh.position.copy(bullet.position)

    if (bullet.targetsPlayer) {
      const chestHeight = controller.feet.y + controller.height * 0.5
      const dist = Math.hypot(
        controller.feet.x - bullet.position.x,
        chestHeight - bullet.position.y,
        controller.feet.z - bullet.position.z
      )
      if (dist < bullet.radius + controller.radius) {
        if (controller.takeDamage(bullet.damage)) callbacks.onPlayerHit?.(bullet.position, bullet.damage)
        pool.kill(bullet)
      }
      continue
    }

    const hitEnemy = enemyManager.findSphereHit(bullet.position, bullet.radius)
    if (hitEnemy) {
      if (hitEnemy.type === 'warden' && enemyManager.isWithinShield(hitEnemy, bullet.position)) {
        const speed = bullet.velocity.length()
        const toPlayer = new THREE.Vector3(controller.feet.x, hitEnemy.position.y, controller.feet.z)
          .sub(bullet.position)
          .normalize()
        bullet.velocity.copy(toPlayer).multiplyScalar(speed)
        pool.markReflected(bullet)
        callbacks.onShieldBlock?.(bullet.position)
      } else {
        enemyManager.damageEnemy(hitEnemy, bullet.damage)
        callbacks.onEnemyHit?.(bullet.position, bullet.damage, hitEnemy)
        pool.kill(bullet)
      }
      continue
    }

    for (const box of colliders) {
      const hit = sphereBoxCollision(bullet.position, bullet.radius, box)
      if (!hit) continue
      if (bullet.bouncesRemaining > 0) {
        bullet.position.addScaledVector(hit.normal, hit.penetration + 0.01)
        reflect(bullet.velocity, hit.normal)
        spawnSplitPair(pool, config, bullet, bullet.velocity.clone().normalize())
        callbacks.onWallBounce?.(bullet.position)
      }
      pool.kill(bullet)
      break
    }
  }
}
