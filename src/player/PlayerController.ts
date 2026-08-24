import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import type { InputState } from '../engine/Input'
import { resolvePosition, type ColliderSource } from './Collision'

const EYE_HEIGHT = 1.7
const CROUCH_HEIGHT = EYE_HEIGHT * 0.55
const HIDE_HEIGHT = EYE_HEIGHT * 0.4
const RADIUS = 0.35
const SPEED = 3.2
const CROUCH_SPEED = 1.5

export class PlayerController {
  controls: PointerLockControls
  crouching = false
  isMoving = false
  hidden = false
  /** External movement lock (dialogue, menus, hiding, ...) — callers compose this each frame; it is not implied by `hidden` alone. */
  frozen = false
  private colliders: ColliderSource[] = []
  private bobT = 0

  constructor(
    public camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    private input: InputState,
  ) {
    this.controls = new PointerLockControls(camera, domElement)
  }

  get object(): THREE.Object3D {
    return this.controls.object
  }

  teleport(pos: THREE.Vector3, yaw: number) {
    this.object.position.set(pos.x, EYE_HEIGHT, pos.z)
    this.object.rotation.set(0, yaw, 0)
    this.bobT = 0
  }

  setColliders(colliders: ColliderSource[]) {
    this.colliders = colliders
  }

  setHidden(v: boolean) {
    this.hidden = v
  }

  update(dt: number) {
    if (this.frozen) {
      this.isMoving = false
      const targetY = this.hidden ? HIDE_HEIGHT : EYE_HEIGHT
      this.object.position.y += (targetY - this.object.position.y) * Math.min(1, dt * 6)
      return
    }

    this.crouching = this.input.isDown('ControlLeft') || this.input.isDown('KeyC')
    const speed = this.crouching ? CROUCH_SPEED : SPEED

    const forwardInput = (this.input.isDown('KeyW') ? 1 : 0) - (this.input.isDown('KeyS') ? 1 : 0)
    const strafeInput = (this.input.isDown('KeyD') ? 1 : 0) - (this.input.isDown('KeyA') ? 1 : 0)
    const len = Math.hypot(forwardInput, strafeInput)
    this.isMoving = len > 0

    if (len > 0) {
      const norm = 1 / len
      const f = forwardInput * norm * speed * dt
      const s = strafeInput * norm * speed * dt
      if (f !== 0) this.controls.moveForward(f)
      if (s !== 0) this.controls.moveRight(s)
    }

    resolvePosition(this.object.position, RADIUS, this.colliders)

    this.bobT += this.isMoving ? dt * (this.crouching ? 6 : 9) : 0
    const targetY = (this.crouching ? CROUCH_HEIGHT : EYE_HEIGHT) + (this.isMoving ? Math.sin(this.bobT) * 0.035 : 0)
    this.object.position.y += (targetY - this.object.position.y) * Math.min(1, dt * 8)
  }
}
