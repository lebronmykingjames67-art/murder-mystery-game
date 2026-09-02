import * as THREE from 'three'

/** Renders text to a canvas and returns a camera-facing sprite. Avoids needing a loaded font/GLTF. */
export function makeLabelSprite(text: string, opts: { color?: string; bg?: string; scale?: number } = {}): THREE.Sprite {
  const color = opts.color ?? '#ffffff'
  const bg = opts.bg ?? 'rgba(10,14,20,0.82)'
  const canvas = document.createElement('canvas')
  const padding = 24
  const fontSize = 40
  const ctx = canvas.getContext('2d')!
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`
  const width = Math.ceil(ctx.measureText(text).width) + padding * 2
  const height = fontSize + padding * 2
  canvas.width = width
  canvas.height = height
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const radius = 14
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.arcTo(width, 0, width, height, radius)
  ctx.arcTo(width, height, 0, height, radius)
  ctx.arcTo(0, height, 0, 0, radius)
  ctx.arcTo(0, 0, width, 0, radius)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = color
  ctx.fillText(text, width / 2, height / 2 + 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true })
  const sprite = new THREE.Sprite(material)
  const scale = opts.scale ?? 0.026
  sprite.scale.set(width * scale, height * scale, 1)
  return sprite
}
