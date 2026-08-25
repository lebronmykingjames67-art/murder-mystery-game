import * as THREE from 'three'

// No external texture pipeline — small canvas-generated speckle textures give surfaces a
// lived-in variation without spending real art time on them, per the brief's priority order
// (lighting and layout matter far more than texture fidelity for a prototype like this).

const textureCache = new Map<string, THREE.CanvasTexture>()

function speckleTexture(baseHex: string, speckleHex: string, density: number): THREE.CanvasTexture {
  const key = `${baseHex}:${speckleHex}:${density}`
  const cached = textureCache.get(key)
  if (cached) return cached

  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = baseHex
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = speckleHex
  const count = Math.floor(size * size * density)
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const s = Math.random() * 1.6 + 0.3
    ctx.globalAlpha = Math.random() * 0.5 + 0.15
    ctx.fillRect(x, y, s, s)
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  textureCache.set(key, texture)
  return texture
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>()

function cachedMaterial(key: string, factory: () => THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const existing = materialCache.get(key)
  if (existing) return existing
  const mat = factory()
  materialCache.set(key, mat)
  return mat
}

export type FloorMood = 'neutral' | 'chase' | 'puzzle' | 'loot' | 'darkness' | 'chaos' | 'lobby'

const MOOD_TINTS: Record<FloorMood, { wall: string; wallSpeckle: string; floor: string; floorSpeckle: string; trim: string }> = {
  lobby: { wall: '#2a2d33', wallSpeckle: '#33373f', floor: '#1c1e22', floorSpeckle: '#26292f', trim: '#c9a24b' },
  neutral: { wall: '#3a3d42', wallSpeckle: '#45484e', floor: '#26282c', floorSpeckle: '#2f3236', trim: '#7d828a' },
  chase: { wall: '#2c2b30', wallSpeckle: '#37353b', floor: '#1a1a1d', floorSpeckle: '#232326', trim: '#5a565f' },
  puzzle: { wall: '#26343a', wallSpeckle: '#2f4148', floor: '#1b2528', floorSpeckle: '#233034', trim: '#3ce2c8' },
  loot: { wall: '#3a3226', wallSpeckle: '#463d2c', floor: '#241f18', floorSpeckle: '#2e271c', trim: '#e2b23c' },
  darkness: { wall: '#1e1e22', wallSpeckle: '#26262b', floor: '#131316', floorSpeckle: '#19191c', trim: '#8a2e2e' },
  chaos: { wall: '#332330', wallSpeckle: '#40293c', floor: '#201823', floorSpeckle: '#291f2c', trim: '#c94f4f' },
}

export function wallMaterial(mood: FloorMood): THREE.MeshStandardMaterial {
  const t = MOOD_TINTS[mood]
  return cachedMaterial(`wall:${mood}`, () => {
    const tex = speckleTexture(t.wall, t.wallSpeckle, 0.02)
    tex.repeat.set(1.4, 0.9)
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.05 })
  })
}

export function floorMaterial(mood: FloorMood): THREE.MeshStandardMaterial {
  const t = MOOD_TINTS[mood]
  return cachedMaterial(`floor:${mood}`, () => {
    const tex = speckleTexture(t.floor, t.floorSpeckle, 0.035)
    tex.repeat.set(2, 2)
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.08 })
  })
}

export function ceilingMaterial(mood: FloorMood): THREE.MeshStandardMaterial {
  const t = MOOD_TINTS[mood]
  return cachedMaterial(`ceiling:${mood}`, () => new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.95, metalness: 0.02 }))
}

export function trimMaterial(mood: FloorMood): THREE.MeshStandardMaterial {
  const t = MOOD_TINTS[mood]
  return cachedMaterial(`trim:${mood}`, () => new THREE.MeshStandardMaterial({ color: t.trim, roughness: 0.5, metalness: 0.4, emissive: new THREE.Color(t.trim).multiplyScalar(0.15) }))
}

export const metalMaterial = cachedMaterial('metal', () => new THREE.MeshStandardMaterial({ color: '#8b8f96', roughness: 0.35, metalness: 0.85 }))

export const glassMaterial = cachedMaterial(
  'glass',
  () => new THREE.MeshStandardMaterial({ color: '#bcd6de', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 }),
)

export const doorMaterial = cachedMaterial('door', () => new THREE.MeshStandardMaterial({ color: '#565c64', roughness: 0.55, metalness: 0.35 }))
export const doorLockedMaterial = cachedMaterial('door-locked', () => new THREE.MeshStandardMaterial({ color: '#5a3030', roughness: 0.55, metalness: 0.3 }))
export const elevatorDoorMaterial = cachedMaterial('elevator-door', () => new THREE.MeshStandardMaterial({ color: '#c9a24b', roughness: 0.3, metalness: 0.75 }))

export function emissivePanel(color: string, intensity = 1): THREE.MeshStandardMaterial {
  return cachedMaterial(`emissive:${color}:${intensity}`, () => {
    const c = new THREE.Color(color)
    return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: intensity, roughness: 0.4, metalness: 0.1 })
  })
}

export function moodTint(mood: FloorMood) {
  return MOOD_TINTS[mood]
}
