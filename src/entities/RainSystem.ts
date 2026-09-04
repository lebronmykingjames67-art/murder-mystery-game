import * as THREE from 'three'

const DROP_COUNT = 500
const AREA_RADIUS = 45
const HEIGHT = 40
const FALL_SPEED = 38
const STREAK_LENGTH = 1.4
const FADE_RATE = 1.2 // opacity change per second — fades in/out instead of popping with the event

/**
 * Falling rain-streak particles that follow the vehicle. Previously "Rainstorm" was a pure numeric
 * modifier (handling/visibility/payout) with nothing to actually see — this makes the event visible.
 */
export class RainSystem {
  private readonly group = new THREE.Group()
  private readonly geometry: THREE.BufferGeometry
  private readonly material: THREE.LineBasicMaterial
  private readonly lines: THREE.LineSegments
  private readonly dropX: Float32Array
  private readonly dropY: Float32Array
  private readonly dropZ: Float32Array
  private active = false
  private intensity = 0

  constructor(scene: THREE.Scene) {
    this.dropX = new Float32Array(DROP_COUNT)
    this.dropY = new Float32Array(DROP_COUNT)
    this.dropZ = new Float32Array(DROP_COUNT)
    for (let i = 0; i < DROP_COUNT; i++) {
      this.dropX[i] = (Math.random() * 2 - 1) * AREA_RADIUS
      this.dropY[i] = Math.random() * HEIGHT
      this.dropZ[i] = (Math.random() * 2 - 1) * AREA_RADIUS
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROP_COUNT * 2 * 3), 3))
    this.material = new THREE.LineBasicMaterial({ color: 0xaec7e0, transparent: true, opacity: 0, depthWrite: false })
    this.lines = new THREE.LineSegments(this.geometry, this.material)
    this.lines.frustumCulled = false
    this.group.add(this.lines)
    this.group.visible = false
    scene.add(this.group)
    this.writePositions()
  }

  setActive(active: boolean): void {
    this.active = active
  }

  update(dt: number, centerX: number, centerZ: number): void {
    const target = this.active ? 1 : 0
    if (this.intensity !== target) {
      const step = FADE_RATE * dt
      this.intensity = target > this.intensity ? Math.min(target, this.intensity + step) : Math.max(target, this.intensity - step)
    }
    this.group.visible = this.intensity > 0.01
    this.material.opacity = this.intensity * 0.55
    this.group.position.set(centerX, 0, centerZ)
    if (!this.group.visible) return

    const fall = FALL_SPEED * dt
    for (let i = 0; i < DROP_COUNT; i++) {
      this.dropY[i] -= fall
      if (this.dropY[i] < 0) {
        this.dropY[i] = HEIGHT
        this.dropX[i] = (Math.random() * 2 - 1) * AREA_RADIUS
        this.dropZ[i] = (Math.random() * 2 - 1) * AREA_RADIUS
      }
    }
    this.writePositions()
  }

  private writePositions(): void {
    const pos = this.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < DROP_COUNT; i++) {
      const x = this.dropX[i]
      const y = this.dropY[i]
      const z = this.dropZ[i]
      const base = i * 6
      arr[base] = x
      arr[base + 1] = y
      arr[base + 2] = z
      arr[base + 3] = x
      arr[base + 4] = y - STREAK_LENGTH
      arr[base + 5] = z
    }
    pos.needsUpdate = true
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group)
    this.geometry.dispose()
    this.material.dispose()
  }
}
