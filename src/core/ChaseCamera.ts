import * as THREE from 'three'

export interface ChaseTarget {
  x: number
  z: number
  heading: number
}

/** Spring-arm 3rd-person chase camera: lags/softens on turns, pulls in tighter for on-foot beats. */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera
  private currentPos = new THREE.Vector3(0, 6, 12)
  private currentLook = new THREE.Vector3()
  private focusMode = false
  private initialized = false

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 1400)
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  setFocusMode(on: boolean): void {
    this.focusMode = on
  }

  /** Pushes an externally-clamped position (e.g. pulled out of a building) back into the spring-arm state, so next frame's lerp resumes from the corrected spot instead of fighting its way back toward the wall it was just pulled out of. */
  correctPosition(pos: THREE.Vector3): void {
    this.currentPos.copy(pos)
    this.camera.position.copy(pos)
  }

  snapTo(target: ChaseTarget): void {
    const back = 11
    const height = 6.2
    this.currentPos.set(target.x - Math.sin(target.heading) * back, height, target.z - Math.cos(target.heading) * back)
    this.currentLook.set(target.x, 2.2, target.z)
    this.camera.position.copy(this.currentPos)
    this.camera.lookAt(this.currentLook)
    this.initialized = true
  }

  update(dt: number, target: ChaseTarget, speedFraction: number): void {
    if (!this.initialized) {
      this.snapTo(target)
      return
    }
    const back = (this.focusMode ? 5.5 : 9.5) + speedFraction * 2.2
    const height = this.focusMode ? 3.0 : 5.4 + speedFraction * 0.8
    const lookHeight = this.focusMode ? 1.55 : 2.1

    const desired = new THREE.Vector3(
      target.x - Math.sin(target.heading) * back,
      height,
      target.z - Math.cos(target.heading) * back,
    )
    const posLerp = 1 - Math.pow(0.0035, dt)
    const lookLerp = 1 - Math.pow(0.0012, dt)
    this.currentPos.lerp(desired, THREE.MathUtils.clamp(posLerp, 0, 1))
    this.currentLook.lerp(new THREE.Vector3(target.x, lookHeight, target.z), THREE.MathUtils.clamp(lookLerp, 0, 1))

    this.camera.position.copy(this.currentPos)
    this.camera.lookAt(this.currentLook)
  }
}
