import * as THREE from 'three'
import type { FirstPersonCamera } from './FirstPersonCamera'
import type { InputManager } from '../core/InputManager'
import type { CollisionWorld } from './CollisionWorld'
import { StaminaSystem } from '../core/StaminaSystem'
import { PLAYER } from '../core/constants'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { UPGRADE_EFFECTS } from '../systems/UpgradeSystem'

const FLOOR_Y = 0

export class PlayerController {
  readonly position = new THREE.Vector3(0, FLOOR_Y, 0)
  readonly stamina = new StaminaSystem()
  grounded = true
  moveMultiplier = 1 // upgrade/effect hook (speed upgrade, chaos-floor slow/haste events)
  inputLocked = false // true during elevator transitions / cutscenes

  onFootstep: ((position: THREE.Vector3, sprinting: boolean) => void) | null = null

  private camera: FirstPersonCamera
  private input: InputManager
  private collision: CollisionWorld
  private velocityY = 0
  private horizVelocity = new THREE.Vector3()
  private footstepDistance = 0
  private lastSprinting = false
  private forward = new THREE.Vector3()
  private right = new THREE.Vector3()
  private wishDir = new THREE.Vector3()

  constructor(camera: FirstPersonCamera, input: InputManager, collision: CollisionWorld) {
    this.camera = camera
    this.input = input
    this.collision = collision
  }

  spawnAt(x: number, z: number, yawRadians: number): void {
    this.position.set(x, FLOOR_Y, z)
    this.velocityY = 0
    this.horizVelocity.set(0, 0, 0)
    this.grounded = true
    this.camera.yaw = yawRadians
    this.camera.pitch = 0
    this.footstepDistance = 0
    this.stamina.reset()
  }

  getEyePosition(out: THREE.Vector3): THREE.Vector3 {
    out.set(this.position.x, this.position.y + PLAYER.eyeHeight, this.position.z)
    return out
  }

  getYaw(): number {
    return this.camera.yaw
  }

  update(dt: number, sensitivity: number): void {
    if (!this.inputLocked) {
      const { dx, dy } = this.input.consumeMouseDelta()
      this.camera.applyLook(dx, dy, sensitivity)
      if (Math.abs(dx) + Math.abs(dy) > 2) this.markTutorial('look')
    } else {
      this.input.consumeMouseDelta()
    }

    let mx = 0
    let mz = 0
    if (!this.inputLocked) {
      if (this.input.isDown('KeyW')) mz -= 1
      if (this.input.isDown('KeyS')) mz += 1
      if (this.input.isDown('KeyA')) mx -= 1
      if (this.input.isDown('KeyD')) mx += 1
    }
    const hasInput = mx !== 0 || mz !== 0
    if (hasInput) this.markTutorial('move')

    this.camera.getForward(this.forward)
    this.camera.getRight(this.right)

    this.wishDir.set(0, 0, 0)
    if (hasInput) {
      this.wishDir.addScaledVector(this.forward, -mz)
      this.wishDir.addScaledVector(this.right, mx)
      if (this.wishDir.lengthSq() > 0) this.wishDir.normalize()
    }

    const wantsSprint = !this.inputLocked && (this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight'))
    const sprinting = this.stamina.update(dt, wantsSprint, hasInput && this.grounded)
    if (sprinting) this.markTutorial('sprint')
    const speedUpgradeBonus = 1 + UPGRADE_EFFECTS.speed(useGameStore.getState().upgradeLevels.speed)
    const targetSpeed = (sprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed) * this.moveMultiplier * speedUpgradeBonus

    const targetVel = this.wishDir.clone().multiplyScalar(hasInput ? targetSpeed : 0)
    const rate = hasInput ? PLAYER.acceleration : PLAYER.deceleration
    const control = this.grounded ? 1 : PLAYER.airControl
    const lerpT = Math.min(1, rate * control * dt)
    this.horizVelocity.lerp(targetVel, lerpT)

    // Jump.
    if (!this.inputLocked && this.grounded && this.input.wasPressed('Space')) {
      this.velocityY = PLAYER.jumpSpeed
      this.grounded = false
      audioManager.jump()
      this.markTutorial('jump')
    }

    this.velocityY -= PLAYER.gravity * dt
    this.position.y += this.velocityY * dt

    if (this.position.y <= FLOOR_Y) {
      if (!this.grounded) {
        const impact = Math.max(0, -this.velocityY)
        this.camera.triggerLanding(Math.min(impact * 0.05, 0.4))
        audioManager.land(impact > 6.5)
      }
      this.position.y = FLOOR_Y
      this.velocityY = 0
      this.grounded = true
    }

    const desiredX = this.position.x + this.horizVelocity.x * dt
    const desiredZ = this.position.z + this.horizVelocity.z * dt
    const resolved = this.collision.resolveMove(this.position.x, this.position.z, desiredX, desiredZ, PLAYER.radius)
    this.position.x = resolved.x
    this.position.z = resolved.z

    // Footsteps: trigger by distance walked rather than time, so pace matches stride.
    const planarSpeed = Math.hypot(this.horizVelocity.x, this.horizVelocity.z)
    if (this.grounded && planarSpeed > 0.6) {
      this.footstepDistance += planarSpeed * dt
      const strideLength = sprinting ? 2.3 : 1.9
      if (this.footstepDistance >= strideLength) {
        this.footstepDistance = 0
        audioManager.footstep(sprinting)
        this.onFootstep?.(this.position, sprinting)
      }
    }
    this.lastSprinting = sprinting

    const eye = this.getEyePosition(new THREE.Vector3())
    this.camera.update(
      dt,
      {
        eyePosition: eye,
        horizontalSpeedFactor: planarSpeed / PLAYER.walkSpeed,
        grounded: this.grounded,
        strafeInput: mx,
      },
      sprinting,
    )
  }

  isSprinting(): boolean {
    return this.lastSprinting
  }

  getSpeed(): number {
    return Math.hypot(this.horizVelocity.x, this.horizVelocity.z)
  }

  private markTutorial(key: string): void {
    const store = useGameStore.getState()
    if (!store.tutorialSeen[key]) store.markTutorialSeen(key)
  }
}
