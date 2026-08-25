import * as THREE from 'three'
import { boxMesh } from './Geometries'

export const VIEWMODEL_LAYER = 1

/**
 * A minimal first-person viewmodel — just two forearm blocks hanging in frame — so the suit
 * cosmetic slot actually has something visible to show, and so movement has a little more
 * physical presence than a bare floating camera. Attached to the main camera (rides along with
 * head bob/look for free) but marked on a dedicated render layer: GameApp renders it with a
 * second, fixed-narrow-FOV camera in its own pass, because sharing the main (user-adjustable,
 * often-wide) FOV would grossly distort geometry sitting this close to the eye.
 */
export class Viewmodel {
  private group = new THREE.Group()
  private leftArm: THREE.Mesh
  private rightArm: THREE.Mesh
  private material: THREE.MeshStandardMaterial
  private bobPhase = 0
  private currentColor = ''

  constructor(camera: THREE.PerspectiveCamera, suitColor: string) {
    this.material = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.75, metalness: 0.1 })
    this.currentColor = suitColor

    // Kept short relative to its distance from the camera on purpose — a viewmodel this close
    // to the eye tapers dramatically under perspective if it's long, and starts looking like a
    // wedge instead of a forearm.
    this.leftArm = boxMesh(this.material, 0.075, 0.075, 0.24)
    this.leftArm.position.set(-0.16, -0.19, -0.62)
    this.leftArm.rotation.set(0.12, 0.2, 0.06)

    this.rightArm = boxMesh(this.material, 0.075, 0.075, 0.24)
    this.rightArm.position.set(0.16, -0.19, -0.62)
    this.rightArm.rotation.set(0.12, -0.2, -0.06)

    // A camera only "sees" lights that share one of its enabled layers, and viewmodelCamera
    // (GameApp) is restricted to VIEWMODEL_LAYER precisely so it never double-draws the world —
    // which means none of the room's actual lights would reach these meshes. Give the
    // viewmodel its own small fixed rig instead, same trick real FPS viewmodels use to stay
    // readable regardless of how dark the room actually is.
    const ambient = new THREE.AmbientLight('#ffffff', 1.1)
    const key = new THREE.DirectionalLight('#ffffff', 1.4)
    key.position.set(0.4, 0.6, 0.3)
    // A DirectionalLight's direction comes from position -> target, and .target defaults to a
    // separate Object3D fixed at the world origin — without parenting it here too, the light's
    // effective direction would swing wildly as the camera (and this whole group) moves
    // through the world instead of staying fixed relative to the viewmodel.
    key.target.position.set(0, 0, -1)
    this.group.add(ambient, key, key.target, this.leftArm, this.rightArm)
    this.group.traverse((obj) => obj.layers.set(VIEWMODEL_LAYER))
    camera.add(this.group)
  }

  setSuitColor(color: string): void {
    if (color === this.currentColor) return
    this.currentColor = color
    this.material.color.set(color)
  }

  update(dt: number, planarSpeed: number, grounded: boolean): void {
    const moving = planarSpeed > 0.6 && grounded
    this.bobPhase += dt * (moving ? 9 : 2.2)
    const amp = moving ? 0.016 : 0.004
    this.leftArm.position.y = -0.19 + Math.sin(this.bobPhase) * amp
    this.rightArm.position.y = -0.19 + Math.sin(this.bobPhase + Math.PI) * amp
  }
}
