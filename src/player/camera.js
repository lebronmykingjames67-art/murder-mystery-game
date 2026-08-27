import * as THREE from 'three'

function expDecay(current, target, dt, smoothTime) {
  // Reaches ~99% of the way to target within `smoothTime` seconds, independent of frame rate.
  const t = 1 - Math.pow(0.01, dt / smoothTime)
  return current + (target - current) * t
}

/**
 * Cosmetic camera layer on top of the player body: FOV kick, strafe roll,
 * head bob, eye-height easing (stand/slide), and a screen-shake hook for
 * later phases. Reads controller state; never writes to it.
 */
export class CameraRig {
  constructor(config, camera) {
    this.config = config
    this.camera = camera
    this.fov = config.camera.baseFov
    this.roll = 0
    this.eyeHeight = config.camera.standEyeHeight
    this.bobPhase = 0
    this.shakeTimer = 0
    this.shakeIntensity = 0
    camera.fov = this.fov
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity
    this.shakeTimer = Math.min(duration, this.config.camera.shakeMaxDuration)
  }

  update(dt, controller) {
    const cam = this.config.camera

    const targetFov = controller.input?.sprint && controller.grounded && !controller.sliding ? cam.sprintFov : cam.baseFov
    this.fov = expDecay(this.fov, targetFov, dt, cam.fovEaseTime)
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov
      this.camera.updateProjectionMatrix()
    }

    const strafe = controller.strafeInput ?? 0
    const targetRoll = -strafe * THREE.MathUtils.degToRad(cam.strafeRollDegrees)
    this.roll = expDecay(this.roll, targetRoll, dt, cam.fovEaseTime)

    const targetEyeHeight = controller.sliding || controller.crouched ? cam.slideEyeHeight : cam.standEyeHeight
    this.eyeHeight = expDecay(this.eyeHeight, targetEyeHeight, dt, 0.15)

    let bobOffset = 0
    if (cam.bobEnabled && controller.grounded && controller.horizontalSpeed > 0.1 && !controller.sliding) {
      this.bobPhase += controller.horizontalSpeed * dt * cam.bobFrequency
      bobOffset = Math.sin(this.bobPhase * Math.PI * 2) * cam.bobAmplitude
    }

    let shakeX = 0
    let shakeY = 0
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt
      const falloff = Math.max(this.shakeTimer, 0) / this.config.camera.shakeMaxDuration
      shakeX = (Math.random() * 2 - 1) * this.shakeIntensity * falloff
      shakeY = (Math.random() * 2 - 1) * this.shakeIntensity * falloff
    }

    this.camera.position.set(
      controller.feet.x + shakeX,
      controller.feet.y + this.eyeHeight + bobOffset,
      controller.feet.z
    )
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = controller.yaw
    this.camera.rotation.x = controller.pitch + shakeY * 0.02
    this.camera.rotation.z = this.roll
  }
}
