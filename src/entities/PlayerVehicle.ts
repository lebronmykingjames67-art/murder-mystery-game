import * as THREE from 'three'
import { buildVehicleMesh, type VehicleMeshResult } from './VehicleMesh'
import { Character } from './Character'
import type { Collider, GlobalModifiers, VehicleDef } from '../types'

export interface VehicleRuntimeStats {
  topSpeed: number
  acceleration: number
  handling: number
}

export interface VehicleInputState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  handbrake: boolean
  boost: boolean
}

export interface VehicleUpdateResult {
  collided: boolean
  hardImpact: boolean
  nearMiss: boolean
}

const PLAYER_RADIUS = 0.9
const WORLD_HALF = 5000

export class PlayerVehicle {
  x = 0
  z = 0
  heading = 0
  speed = 0
  boostMeter = 100
  locked = false

  readonly character: Character
  private scene: THREE.Scene
  private mesh: VehicleMeshResult
  private wheelSpin = 0

  constructor(scene: THREE.Scene, def: VehicleDef) {
    this.scene = scene
    this.mesh = buildVehicleMesh(def)
    scene.add(this.mesh.group)
    this.character = new Character(scene, 0xff7a1a)
    this.mesh.riderMount.add(this.character.group)
    this.character.group.position.set(0, 0, 0)
  }

  setVehicleDef(def: VehicleDef): void {
    this.scene.remove(this.mesh.group)
    this.mesh = buildVehicleMesh(def)
    this.scene.add(this.mesh.group)
    if (this.character.state === 'mounted') {
      this.mesh.riderMount.add(this.character.group)
      this.character.group.position.set(0, 0, 0)
    }
    this.mesh.group.position.set(this.x, 0, this.z)
    this.mesh.group.rotation.y = this.heading
  }

  teleport(x: number, z: number, heading = 0): void {
    this.x = x
    this.z = z
    this.heading = heading
    this.speed = 0
    this.mesh.group.position.set(x, 0, z)
    this.mesh.group.rotation.y = heading
  }

  worldPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.x, 0, this.z)
  }

  riderWorldPosition(): THREE.Vector3 {
    const v = new THREE.Vector3()
    this.mesh.riderMount.getWorldPosition(v)
    return v
  }

  setCarrying(count: number): void {
    this.character.setCarrying(count > 0)
  }

  /**
   * Detaches the rider from the vehicle mount into world space for the walk-to-marker beat,
   * then reattaches once done. Positions passed to the Character are always world-space.
   */
  beginDismount(markerWorldPos: THREE.Vector3, onArrive: () => void, onDone: () => void): void {
    if (this.character.isBusy()) return
    const fromWorld = this.riderWorldPosition()
    this.scene.attach(this.character.group)
    this.character.startDismount(fromWorld, markerWorldPos, onArrive, () => {
      this.mesh.riderMount.add(this.character.group)
      this.character.group.position.set(0, 0, 0)
      this.character.group.rotation.set(0, 0, 0)
      onDone()
    })
  }

  update(
    dt: number,
    input: VehicleInputState,
    stats: VehicleRuntimeStats,
    modifiers: GlobalModifiers,
    colliders: Collider[],
  ): VehicleUpdateResult {
    this.character.update(dt)
    if (this.locked || this.character.isBusy()) {
      this.speed *= Math.max(0, 1 - dt * 6)
      return { collided: false, hardImpact: false, nearMiss: false }
    }

    const boosting = input.boost && this.boostMeter > 4
    const throttle = input.forward ? 1 : input.backward ? -0.6 : 0
    const targetTop = stats.topSpeed * (boosting ? 1.55 : 1)

    if (throttle !== 0) {
      this.speed += throttle * stats.acceleration * dt
    } else {
      const decel = stats.acceleration * 0.9 * dt
      if (Math.abs(this.speed) <= decel) this.speed = 0
      else this.speed -= Math.sign(this.speed) * decel
    }
    this.speed = THREE.MathUtils.clamp(this.speed, -targetTop * 0.45, targetTop)

    if (boosting && Math.abs(this.speed) > 0.5) {
      this.boostMeter = Math.max(0, this.boostMeter - 30 * dt)
    } else {
      this.boostMeter = Math.min(100, this.boostMeter + 8 * dt)
    }

    const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    const speedFactor = THREE.MathUtils.clamp(Math.abs(this.speed) / Math.max(1, stats.topSpeed * 0.35), 0.12, 1)
    const handlingMul = modifiers.handling * (input.handbrake ? 1.7 : 1)
    const dir = this.speed < 0 ? -1 : 1
    this.heading += steerInput * stats.handling * handlingMul * speedFactor * dir * dt

    const dx = Math.sin(this.heading) * this.speed * dt
    const dz = Math.cos(this.heading) * this.speed * dt
    let nx = THREE.MathUtils.clamp(this.x + dx, -WORLD_HALF, WORLD_HALF)
    let nz = THREE.MathUtils.clamp(this.z + dz, -WORLD_HALF, WORLD_HALF)

    let collided = false
    let hardImpact = false
    let nearMiss = false
    for (const c of colliders) {
      const ddx = nx - c.x
      const ddz = nz - c.z
      const dist = Math.hypot(ddx, ddz)
      const minDist = c.radius + PLAYER_RADIUS
      if (dist < minDist) {
        collided = true
        if (Math.abs(this.speed) > 7) hardImpact = true
        if (dist > 0.0001) {
          const push = minDist - dist
          nx += (ddx / dist) * push
          nz += (ddz / dist) * push
        }
        this.speed *= 0.35
      } else if (dist < minDist + 1.6) {
        nearMiss = true
      }
    }

    this.x = nx
    this.z = nz
    this.mesh.group.position.set(this.x, 0, this.z)
    this.mesh.group.rotation.y = this.heading

    const leanTarget = input.handbrake ? -steerInput * 0.22 : -steerInput * 0.06
    const currentLean = this.mesh.group.rotation.z
    this.mesh.group.rotation.z = currentLean + (leanTarget - currentLean) * Math.min(1, dt * 6)

    this.wheelSpin += this.speed * dt * 1.6
    for (const w of this.mesh.wheels) w.rotation.x = this.wheelSpin

    return { collided, hardImpact, nearMiss }
  }
}
