import * as THREE from 'three'
import { createBulletPool } from './bulletPool.js'
import { fireSplitter, updateSplitterBullets } from './splitter.js'
import { fireStatic } from './static.js'

const forward = new THREE.Vector3()

/**
 * Owns the two equipped weapons (DESIGN.md Section 7's "you carry two at a
 * time"): per-weapon charge that drains on fire and refills on landed hits,
 * fire-rate cooldowns, switching, and dispatch into the Splitter/Static
 * firing logic.
 */
export function createWeaponSystem(scene, config) {
  const pool = createBulletPool(scene)

  const weapons = {
    splitter: { key: 'splitter', name: 'SPLITTER', charge: config.weapons.splitter.maxCharge, maxCharge: config.weapons.splitter.maxCharge, cooldown: 0 },
    static: { key: 'static', name: 'STATIC', charge: config.weapons.static.maxCharge, maxCharge: config.weapons.static.maxCharge, cooldown: 0 },
  }
  let activeKey = 'splitter'

  function switchTo(key) {
    if (weapons[key]) activeKey = key
  }

  function refill(key, callbacks) {
    return (pos, dmg, enemy) => {
      const cfg = config.weapons[key]
      weapons[key].charge = Math.min(weapons[key].charge + config.weapons.chargeRefillOnHit, cfg.maxCharge)
      callbacks.onEnemyHit?.(pos, dmg, enemy)
    }
  }

  function update(dt, input, controller, camera, world, callbacks = {}) {
    for (const weapon of Object.values(weapons)) {
      if (weapon.cooldown > 0) weapon.cooldown -= dt
    }

    if (input.switchToSplitter) switchTo('splitter')
    if (input.switchToStatic) switchTo('static')

    if (input.firePressed) {
      const active = weapons[activeKey]
      const cfg = config.weapons[activeKey]
      if (active.cooldown <= 0 && active.charge >= cfg.chargeCost) {
        active.cooldown = cfg.fireCooldown
        active.charge -= cfg.chargeCost

        const origin = camera.position.clone()
        const dir = camera.getWorldDirection(forward).clone()

        if (activeKey === 'splitter') {
          fireSplitter(pool, config, origin, dir)
        } else {
          fireStatic(config, controller, origin, dir, world, {
            onEnemyHit: refill('static', callbacks),
            onPlayerHit: callbacks.onPlayerHit,
            onShieldBlock: callbacks.onShieldBlock,
            onWallHit: callbacks.onWallHit,
          })
        }
        callbacks.onFire?.(activeKey)
      }
    }

    updateSplitterBullets(pool, dt, config, world, {
      onEnemyHit: refill('splitter', callbacks),
      onPlayerHit: callbacks.onPlayerHit,
      onShieldBlock: callbacks.onShieldBlock,
      onWallBounce: callbacks.onWallHit,
    })
  }

  return {
    update,
    switchTo,
    weapons,
    pool,
    getActiveKey: () => activeKey,
    getActive: () => weapons[activeKey],
  }
}
