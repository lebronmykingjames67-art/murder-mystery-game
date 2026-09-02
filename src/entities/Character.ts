import * as THREE from 'three'

export type CharacterState = 'mounted' | 'walkingOut' | 'atStop' | 'walkingBack'

interface Sequence {
  onArrive: () => void
  onDone: () => void
  fromLocal: THREE.Vector3
  toWorld: THREE.Vector3
  mountWorld: THREE.Vector3
}

const OUT_DURATION = 1.1
const HOLD_DURATION = 0.9
const BACK_DURATION = 1.1

/** The visible 3rd-person rider. Detaches from the vehicle for a short walk-and-hand-off beat. */
export class Character {
  readonly group: THREE.Group
  private bagMesh: THREE.Mesh
  private headMesh: THREE.Mesh
  private bobPhase = 0

  state: CharacterState = 'mounted'
  private t = 0
  private seq: Sequence | null = null
  private walkFrom = new THREE.Vector3()
  private walkTo = new THREE.Vector3()

  constructor(scene: THREE.Scene, bodyColor: number) {
    this.group = new THREE.Group()

    const jacket = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 })
    const skin = new THREE.MeshStandardMaterial({ color: 0xe0a978, roughness: 0.8 })
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 })

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), jacket)
    torso.position.y = 0.55
    this.group.add(torso)

    this.headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), skin)
    this.headMesh.position.y = 1.0
    this.group.add(this.headMesh)

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), jacket)
    helmet.position.y = 1.05
    this.group.add(helmet)

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.38, 3, 6), jacket)
      arm.position.set(side * 0.28, 0.55, 0)
      arm.rotation.z = side * 0.25
      this.group.add(arm)
    }

    this.bagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.18), bagMat)
    this.bagMesh.position.set(0, 0.6, -0.24)
    this.bagMesh.visible = false
    this.group.add(this.bagMesh)

    scene.add(this.group)
  }

  setCarrying(carrying: boolean): void {
    this.bagMesh.visible = carrying
  }

  isBusy(): boolean {
    return this.state !== 'mounted'
  }

  /** Kick off the walk-to-marker / hand-off / walk-back beat. Vehicle input should be locked meanwhile. */
  startDismount(vehicleWorldPos: THREE.Vector3, markerWorldPos: THREE.Vector3, onArrive: () => void, onDone: () => void): void {
    if (this.state !== 'mounted') return
    this.state = 'walkingOut'
    this.t = 0
    this.walkFrom.copy(vehicleWorldPos)
    this.walkTo.copy(markerWorldPos)
    this.group.position.copy(vehicleWorldPos)
    this.seq = {
      onArrive,
      onDone,
      fromLocal: new THREE.Vector3(),
      toWorld: markerWorldPos.clone(),
      mountWorld: vehicleWorldPos.clone(),
    }
  }

  update(dt: number): void {
    this.bobPhase += dt * 6
    if (this.state === 'mounted' || !this.seq) return

    this.t += dt
    if (this.state === 'walkingOut') {
      const p = Math.min(1, this.t / OUT_DURATION)
      this.group.position.lerpVectors(this.walkFrom, this.walkTo, easeInOut(p))
      this.group.position.y = Math.sin(p * Math.PI) * 0.02
      this.group.lookAt(this.walkTo.x, this.group.position.y, this.walkTo.z)
      if (p >= 1) {
        this.state = 'atStop'
        this.t = 0
        this.seq.onArrive()
      }
    } else if (this.state === 'atStop') {
      this.group.position.y = 0.06 + Math.sin(this.bobPhase * 1.5) * 0.015
      if (this.t >= HOLD_DURATION) {
        this.state = 'walkingBack'
        this.t = 0
      }
    } else if (this.state === 'walkingBack') {
      const p = Math.min(1, this.t / BACK_DURATION)
      this.group.position.lerpVectors(this.walkTo, this.walkFrom, easeInOut(p))
      this.group.position.y = Math.sin(p * Math.PI) * 0.02
      this.group.lookAt(this.walkFrom.x, this.group.position.y, this.walkFrom.z)
      if (p >= 1) {
        this.state = 'mounted'
        const done = this.seq.onDone
        this.seq = null
        done()
      }
    }
  }
}

function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
}
