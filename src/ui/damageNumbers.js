import * as THREE from 'three'

const POOL_SIZE = 40
const LIFE = 0.7
const RISE = 1.1

/** Pooled floating damage numbers: DOM text projected from a 3D hit point each frame, rising and fading out. */
export function createDamageNumbers(camera) {
  const container = document.createElement('div')
  container.id = 'damage-numbers'
  document.body.appendChild(container)

  const pool = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const el = document.createElement('div')
    el.className = 'damage-number'
    container.appendChild(el)
    pool.push({ el, active: false, worldPos: new THREE.Vector3(), age: 0 })
  }

  function spawn(worldPosition, amount, color = '#eafcff') {
    const item = pool.find((p) => !p.active)
    if (!item) return
    item.active = true
    item.age = 0
    item.worldPos.copy(worldPosition)
    item.el.textContent = Math.max(1, Math.round(amount))
    item.el.style.color = color
  }

  const projected = new THREE.Vector3()

  function update(dt) {
    for (const item of pool) {
      if (!item.active) continue
      item.age += dt
      if (item.age >= LIFE) {
        item.active = false
        item.el.style.display = 'none'
        continue
      }

      const t = item.age / LIFE
      projected.copy(item.worldPos)
      projected.y += t * RISE
      projected.project(camera)

      if (projected.z > 1) {
        item.el.style.display = 'none'
        continue
      }

      item.el.style.display = 'block'
      item.el.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`
      item.el.style.top = `${(1 - (projected.y * 0.5 + 0.5)) * window.innerHeight}px`
      item.el.style.opacity = String(1 - t)
    }
  }

  return { spawn, update }
}
