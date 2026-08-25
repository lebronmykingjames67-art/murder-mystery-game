import * as THREE from 'three'
import { CAMERA } from '../core/constants'

export interface CameraUpdateInput {
  eyePosition: THREE.Vector3
  horizontalSpeedFactor: number // 0 = idle, 1 = walk pace, >1 = sprint pace
  grounded: boolean
  strafeInput: number // -1..1, used for a very subtle lean
}

/**
 * Owns the perspective camera and everything that makes it feel like a body is carrying it:
 * mouse look, walk/sprint bob, a landing spring, and a brief damage kick. Deliberately gentle —
 * the brief is explicit that the camera should never feel "excessively shaky".
 */
export class FirstPersonCamera {
  readonly camera: THREE.PerspectiveCamera
  yaw = 0
  pitch = 0

  private bobPhase = 0
  private bobAmount = 0 // smoothed 0..1 blend toward the target bob amplitude
  private landOffset = 0
  private landVelocity = 0
  private damageTimer = 0
  private leanRoll = 0
  private targetFov: number
  private currentFov: number

  constructor(aspect: number) {
    this.targetFov = CAMERA.fovDefault
    this.currentFov = CAMERA.fovDefault
    this.camera = new THREE.PerspectiveCamera(CAMERA.fovDefault, aspect, 0.1, 220)
    this.camera.rotation.order = 'YXZ'
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  setBaseFov(fov: number): void {
    this.targetFov = fov
  }

  applyLook(dx: number, dy: number, sensitivity: number): void {
    this.yaw -= dx * sensitivity * 0.0022
    this.pitch -= dy * sensitivity * 0.0022
    const limit = Math.PI / 2 - 0.02
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
  }

  triggerLanding(impactStrength: number): void {
    this.landVelocity -= impactStrength
  }

  triggerDamageKick(): void {
    this.damageTimer = 0.35
  }

  update(dt: number, input: CameraUpdateInput, sprinting: boolean): void {
    // Bob: blend the amplitude toward the target so starting/stopping doesn't snap.
    const moving = input.horizontalSpeedFactor > 0.05 && input.grounded
    const targetAmount = moving ? 1 : 0
    this.bobAmount += (targetAmount - this.bobAmount) * Math.min(1, dt * 8)

    const freq = sprinting ? CAMERA.bobSprintFrequency : CAMERA.bobWalkFrequency
    const amp = sprinting ? CAMERA.bobSprintAmplitude : CAMERA.bobWalkAmplitude
    if (moving) {
      this.bobPhase += dt * freq * Math.max(0.4, input.horizontalSpeedFactor)
    }
    const bobY = Math.sin(this.bobPhase) * amp * this.bobAmount
    const bobX = Math.cos(this.bobPhase * 0.5) * amp * 0.5 * this.bobAmount

    // Landing spring: critically-damped-ish oscillator settling back to 0.
    const stiffness = 140
    const damping = 14
    this.landVelocity += (-stiffness * this.landOffset - damping * this.landVelocity) * dt
    this.landOffset += this.landVelocity * dt

    // Subtle lean into strafe direction.
    const targetLean = -input.strafeInput * 0.035
    this.leanRoll += (targetLean - this.leanRoll) * Math.min(1, dt * 6)

    // Damage kick: short decaying shake, biased so it reads as a "hit" not noise.
    let damageRoll = 0
    let damagePitch = 0
    if (this.damageTimer > 0) {
      const t = this.damageTimer
      this.damageTimer = Math.max(0, this.damageTimer - dt)
      const decay = t / 0.35
      damageRoll = Math.sin(t * 50) * 0.05 * decay
      damagePitch = Math.sin(t * 33) * 0.03 * decay
    }

    this.camera.position.set(
      input.eyePosition.x + bobX,
      input.eyePosition.y + bobY + this.landOffset,
      input.eyePosition.z,
    )
    this.camera.rotation.set(this.pitch + damagePitch, this.yaw, this.leanRoll + damageRoll)

    this.currentFov += (this.targetFov - this.currentFov) * Math.min(1, dt * 6)
    if (Math.abs(this.camera.fov - this.currentFov) > 0.01) {
      this.camera.fov = this.currentFov
      this.camera.updateProjectionMatrix()
    }
  }

  getForward(out: THREE.Vector3): THREE.Vector3 {
    out.set(Math.sin(this.yaw) * -1, 0, Math.cos(this.yaw) * -1)
    return out.normalize()
  }

  getRight(out: THREE.Vector3): THREE.Vector3 {
    out.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    return out.normalize()
  }
}
