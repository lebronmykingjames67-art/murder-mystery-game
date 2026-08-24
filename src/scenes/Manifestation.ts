import * as THREE from 'three'

export type ManifestationState = 'patrol' | 'alert' | 'hunt'

/** A patrolling, faceless presence. Detection scales with flashlight use; catching the player is a soft fail (reset, not game over). */
export class Manifestation {
  mesh: THREE.Group
  state: ManifestationState = 'patrol'
  private waypoints: THREE.Vector3[]
  private wpIndex = 0
  private alertMeter = 0
  private readonly patrolSpeed = 0.85
  private readonly huntSpeed = 2.5

  constructor(waypoints: THREE.Vector3[], startPos: THREE.Vector3) {
    this.waypoints = waypoints
    this.mesh = buildFigure()
    this.mesh.position.copy(startPos)
  }

  update(dt: number, playerPos: THREE.Vector3, playerHidden: boolean, flashlightOn: boolean): { caught: boolean; alert01: number } {
    const distToPlayer = this.mesh.position.distanceTo(playerPos)
    const detectRange = flashlightOn ? 9 : 5.5
    const visible = !playerHidden && distToPlayer < detectRange

    if (this.state !== 'hunt') {
      if (visible) {
        this.alertMeter += dt * (flashlightOn ? 1.3 : 0.7)
        this.state = 'alert'
      } else {
        this.alertMeter = Math.max(0, this.alertMeter - dt * 0.5)
        if (this.state === 'alert' && this.alertMeter <= 0) this.state = 'patrol'
      }
      if (this.alertMeter > 3.2) this.state = 'hunt'
    }

    let caught = false

    if (this.state === 'hunt') {
      const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position)
      dir.y = 0
      const dist = dir.length()
      if (dist > 0.01) dir.normalize()
      this.mesh.position.addScaledVector(dir, this.huntSpeed * dt)
      this.faceDirection(dir)

      if (dist < 1.1) {
        caught = true
        this.state = 'patrol'
        this.alertMeter = 0
      } else if (playerHidden || dist > 13) {
        this.state = 'patrol'
        this.alertMeter = 0
      }
    } else {
      const target = this.waypoints[this.wpIndex]
      const dir = new THREE.Vector3().subVectors(target, this.mesh.position)
      dir.y = 0
      const dist = dir.length()
      if (dist < 0.3) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length
      } else {
        dir.normalize()
        this.mesh.position.addScaledVector(dir, this.patrolSpeed * dt)
        this.faceDirection(dir)
      }
    }

    return { caught, alert01: Math.min(1, this.alertMeter / 3.2) }
  }

  resetTo(pos: THREE.Vector3) {
    this.mesh.position.copy(pos)
    this.state = 'patrol'
    this.alertMeter = 0
    this.wpIndex = 0
  }

  private faceDirection(dir: THREE.Vector3) {
    if (dir.lengthSq() < 1e-6) return
    this.mesh.rotation.y = Math.atan2(-dir.x, -dir.z)
  }
}

function buildFigure(): THREE.Group {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c,
    roughness: 1,
    emissive: 0x220f0f,
    emissiveIntensity: 0.5,
  })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 1.85, 8), mat)
  body.position.y = 0.95
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat)
  head.position.y = 2.0
  g.add(body, head)
  return g
}
