import * as THREE from 'three'

/** Builds a soft radial-glow CanvasTexture — no binary assets, matches the rest of the game's procedural art. */
function buildGlowTexture(color: string): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.45, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

/** A glowing sky-disc sprite (sun or moon) — always renders on top of fog/distance so it reads as an infinitely-far sky object. */
export function buildSkySprite(color: string, scale: number): THREE.Sprite {
  const texture = buildGlowTexture(color)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: false, opacity: 0 })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(scale, scale, 1)
  sprite.renderOrder = -1
  return sprite
}

export function disposeSkySprite(sprite: THREE.Sprite): void {
  ;(sprite.material as THREE.SpriteMaterial).map?.dispose()
  ;(sprite.material as THREE.SpriteMaterial).dispose()
}
