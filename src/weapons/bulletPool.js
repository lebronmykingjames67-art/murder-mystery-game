import * as THREE from 'three'

const POOL_SIZE = 200
const geometry = new THREE.SphereGeometry(1, 6, 6)
const playerOwnedMaterial = new THREE.MeshBasicMaterial({ color: 0x22e8ff })
const reflectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b3b })

/**
 * Object pool of traveling projectiles (Splitter's bullets) so nothing
 * allocates during gameplay. Static is pure hitscan and doesn't use this.
 */
export function createBulletPool(scene) {
  const bullets = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(geometry, playerOwnedMaterial)
    mesh.visible = false
    scene.add(mesh)
    bullets.push({
      active: false,
      mesh,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      radius: 0.12,
      damage: 0,
      life: 0,
      bouncesRemaining: 0,
      targetsPlayer: false,
    })
  }

  function spawn({ position, velocity, radius, damage, life, bouncesRemaining, targetsPlayer = false }) {
    const bullet = bullets.find((b) => !b.active)
    if (!bullet) return null
    bullet.active = true
    bullet.position.copy(position)
    bullet.velocity.copy(velocity)
    bullet.radius = radius
    bullet.damage = damage
    bullet.life = life
    bullet.bouncesRemaining = bouncesRemaining
    bullet.targetsPlayer = targetsPlayer
    bullet.mesh.visible = true
    bullet.mesh.material = targetsPlayer ? reflectedMaterial : playerOwnedMaterial
    bullet.mesh.scale.setScalar(radius)
    bullet.mesh.position.copy(position)
    return bullet
  }

  function markReflected(bullet) {
    bullet.targetsPlayer = true
    bullet.mesh.material = reflectedMaterial
  }

  function kill(bullet) {
    bullet.active = false
    bullet.mesh.visible = false
  }

  return { bullets, spawn, kill, markReflected }
}
