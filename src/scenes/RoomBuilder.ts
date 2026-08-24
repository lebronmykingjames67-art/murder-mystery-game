import * as THREE from 'three'
import type { ColliderSource } from '../player/Collision'
import type { InteractableData } from '../player/Interaction'
import type { PageDef } from '../types'

let seq = 0
export function nextId(prefix: string) {
  return `${prefix}-${seq++}`
}

// ---------- materials ----------

export function wallMat(color = 0x2a2a2f) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.02 })
}
export function floorMat(color = 0x18181b) {
  return new THREE.MeshStandardMaterial({ color, roughness: 1 })
}
export function ceilingMat(color = 0x121214) {
  return new THREE.MeshStandardMaterial({ color, roughness: 1 })
}
export function doorMat(color = 0x39301f) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05 })
}
export function propMat(color = 0x2c2620, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 })
}
export function metalMat(color = 0x44464c) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.7 })
}
export function emissiveMat(color: number, intensity = 1.5) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 })
}

// ---------- canvas text texture (paper / corkboard notes) ----------

export function paperTexture(lines: string[], opts: { bg?: string; fg?: string; title?: string } = {}): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 320
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = opts.bg ?? '#d8cfa8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
  ctx.fillStyle = opts.fg ?? '#1a1a1a'
  ctx.font = '600 15px Georgia, serif'
  let y = 34
  if (opts.title) {
    ctx.fillText(opts.title, 16, y)
    y += 26
  }
  ctx.font = '13px Georgia, serif'
  for (const line of lines) {
    wrapText(ctx, line, 16, y, canvas.width - 32, 17)
    y += 17 * Math.max(1, Math.ceil(ctx.measureText(line).width / (canvas.width - 32))) + 8
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      ctx.fillText(line, x, cy)
      line = word + ' '
      cy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, cy)
}

// ---------- geometry primitives ----------

export function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function worldBox(mesh: THREE.Object3D): ColliderSource {
  mesh.updateWorldMatrix(true, false)
  const box = new THREE.Box3().setFromObject(mesh)
  return () => box
}

// ---------- walls with door/hallway openings ----------

export interface Opening {
  center: number
  width: number
}

/** A straight wall along local X, thickness along local Z, centered on `length`. Leaves gaps for `openings`. */
export function buildWallSegments(
  length: number,
  height: number,
  thickness: number,
  openings: Opening[],
  mat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group()
  const sorted = [...openings].sort((a, b) => a.center - b.center)
  let cursor = -length / 2
  for (const op of sorted) {
    const segEnd = op.center - op.width / 2
    if (segEnd - cursor > 0.02) {
      const w = segEnd - cursor
      addBox(group, w, height, thickness, mat, cursor + w / 2, height / 2, 0)
    }
    cursor = Math.max(cursor, op.center + op.width / 2)
  }
  const tailW = length / 2 - cursor
  if (tailW > 0.02) addBox(group, tailW, height, thickness, mat, cursor + tailW / 2, height / 2, 0)
  return group
}

export interface RoomSpec {
  /** footprint center */
  x: number
  z: number
  width: number // extent along X
  depth: number // extent along Z
  height?: number
  wallColor?: number
  floorColor?: number
  ceilingColor?: number
  /** openings per side, in local coordinates along that wall's own axis (0 = wall center) */
  north?: Opening[] // -Z side
  south?: Opening[] // +Z side
  east?: Opening[] // +X side
  west?: Opening[] // -X side
  noCeiling?: boolean
}

export interface BuiltRoom {
  group: THREE.Group
  colliders: ColliderSource[]
}

export function buildRoom(spec: RoomSpec): BuiltRoom {
  const height = spec.height ?? 2.6
  const thickness = 0.2
  const group = new THREE.Group()
  const colliders: ColliderSource[] = []

  const floor = addBox(group, spec.width, 0.2, spec.depth, floorMat(spec.floorColor), spec.x, -0.1, spec.z)
  void floor
  if (!spec.noCeiling) addBox(group, spec.width, 0.2, spec.depth, ceilingMat(spec.ceilingColor), spec.x, height + 0.1, spec.z)

  const wMat = wallMat(spec.wallColor)

  const north = buildWallSegments(spec.width, height, thickness, spec.north ?? [], wMat)
  north.position.set(spec.x, 0, spec.z - spec.depth / 2)
  group.add(north)

  const south = buildWallSegments(spec.width, height, thickness, spec.south ?? [], wMat)
  south.position.set(spec.x, 0, spec.z + spec.depth / 2)
  group.add(south)

  // east/west walls: rotated -90° so their local opening-center axis maps directly to a
  // world-Z offset from the room center (same sign convention as north/south use for world-X).
  const east = buildWallSegments(spec.depth, height, thickness, spec.east ?? [], wMat)
  east.position.set(spec.x + spec.width / 2, 0, spec.z)
  east.rotation.y = -Math.PI / 2
  group.add(east)

  const west = buildWallSegments(spec.depth, height, thickness, spec.west ?? [], wMat)
  west.position.set(spec.x - spec.width / 2, 0, spec.z)
  west.rotation.y = -Math.PI / 2
  group.add(west)

  for (const wallGroup of [north, south, east, west]) {
    wallGroup.updateWorldMatrix(true, false)
    for (const child of wallGroup.children) {
      colliders.push(worldBox(child))
    }
  }

  return { group, colliders }
}

// ---------- doors ----------

export interface DoorOptions {
  position: THREE.Vector3
  yaw?: number
  width?: number
  height?: number
  isLocked?: () => boolean
  lockedMessage?: string
  openLabel?: string
  onOpen?: () => void
  onLockedTry?: () => void
}

export interface DoorHandle {
  group: THREE.Group
  collider: ColliderSource
  isOpen: () => boolean
}

export function buildDoor(opts: DoorOptions): DoorHandle {
  const width = opts.width ?? 1.05
  const height = opts.height ?? 2.05
  const thickness = 0.08

  const pivot = new THREE.Group()
  pivot.position.copy(opts.position)
  const baseYaw = opts.yaw ?? 0
  pivot.rotation.y = baseYaw

  const leaf = addBox(pivot, width, height, thickness, doorMat(), width / 2, height / 2, 0)
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), metalMat(0x8a8a90))
  handle.position.set(width - 0.12, height / 2, thickness)
  pivot.add(handle)

  // must cascade to children (leaf) — updateWorldMatrix(true, false) only refreshes pivot itself,
  // which previously left leaf.matrixWorld at its stale identity default and misplaced the collider.
  pivot.updateMatrixWorld(true)
  const closedBox = new THREE.Box3().setFromObject(leaf)

  let open = false
  const data: InteractableData = {
    id: nextId('door'),
    range: 2.6,
    prompt: () => (opts.isLocked?.() ? (opts.lockedMessage ?? 'Locked') : (opts.openLabel ?? 'Open')),
    enabled: () => !open,
    onInteract: () => {
      if (opts.isLocked?.()) {
        opts.onLockedTry?.()
        return
      }
      if (open) return
      open = true
      swingOpen(pivot, baseYaw + Math.PI * 0.52)
      opts.onOpen?.()
    },
  }
  pivot.userData.interactable = data

  return {
    group: pivot,
    collider: () => (open ? null : closedBox),
    isOpen: () => open,
  }
}

function swingOpen(pivot: THREE.Object3D, targetY: number) {
  const startY = pivot.rotation.y
  const start = performance.now()
  const duration = 750
  function step(now: number) {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    pivot.rotation.y = startY + (targetY - startY) * eased
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ---------- lights ----------

export function addFlickerLight(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  color = 0xffe2b0,
  intensity = 1.1,
  distance = 6,
): { light: THREE.PointLight; update: (corruption: number) => void } {
  const light = new THREE.PointLight(color, intensity, distance, 2)
  light.position.set(x, y, z)
  parent.add(light)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), emissiveMat(color, 2))
  bulb.position.set(x, y, z)
  parent.add(bulb)
  const update = (corruption: number) => {
    const flickerChance = 0.01 + corruption * 0.05
    if (Math.random() < flickerChance) {
      light.intensity = intensity * (Math.random() * 0.4)
    } else {
      light.intensity = intensity
    }
  }
  return { light, update }
}

// ---------- generic interactable props ----------

export function makeInteractable(
  obj: THREE.Object3D,
  data: InteractableData,
): THREE.Object3D {
  obj.userData.interactable = data
  return obj
}

/** A pinned page / note the player can walk up to and read — drives the Logbook overlay. */
export function addReadable(
  parent: THREE.Object3D,
  opts: {
    x: number
    y: number
    z: number
    yaw?: number
    width?: number
    height?: number
    label: string
    page: PageDef
    onRead: (page: PageDef) => void
  },
): THREE.Mesh {
  const w = opts.width ?? 0.5
  const h = opts.height ?? 0.65
  const tex = paperTexture(opts.page.body, { title: opts.page.title })
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }),
  )
  mesh.position.set(opts.x, opts.y, opts.z)
  mesh.rotation.y = opts.yaw ?? 0
  parent.add(mesh)
  makeInteractable(mesh, {
    id: nextId('readable'),
    range: 2.2,
    prompt: opts.label,
    onInteract: () => opts.onRead(opts.page),
  })
  return mesh
}

export function addProp(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  collideList?: ColliderSource[],
): THREE.Mesh {
  const mesh = addBox(parent, w, h, d, mat, x, y, z)
  if (collideList) collideList.push(worldBox(mesh))
  return mesh
}
