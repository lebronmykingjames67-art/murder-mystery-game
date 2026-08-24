import * as THREE from 'three'

const BASE_INTENSITY = 4.5

export class Flashlight {
  light: THREE.SpotLight
  on = true
  private prop: THREE.Group
  private bulb: THREE.Mesh

  constructor(camera: THREE.Object3D) {
    this.light = new THREE.SpotLight(0xfff1d8, BASE_INTENSITY, 15, Math.PI / 7, 0.55, 1.7)
    this.light.position.set(0.15, -0.1, 0.05)
    const target = new THREE.Object3D()
    target.position.set(0, -0.15, -1)
    camera.add(this.light)
    camera.add(target)
    this.light.target = target

    const built = buildFlashlightProp()
    this.prop = built.group
    this.bulb = built.bulb
    this.prop.position.set(0.24, -0.22, -0.42)
    this.prop.rotation.set(0.05, 0.25, 0.05)
    camera.add(this.prop)
  }

  toggle() {
    this.on = !this.on
    this.light.visible = this.on
    const mat = this.bulb.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = this.on ? 2.2 : 0
  }

  /** intensity 0 = perfectly stable, 1 = maximum corruption flicker */
  update(corruption: number) {
    if (!this.on) return
    if (Math.random() < corruption * 0.1) {
      this.light.intensity = BASE_INTENSITY * (0.1 + Math.random() * 0.35)
    } else {
      this.light.intensity = BASE_INTENSITY
    }
  }
}

function buildFlashlightProp(): { group: THREE.Group; bulb: THREE.Mesh } {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.036, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.55, metalness: 0.5 }),
  )
  body.rotation.z = Math.PI / 2
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.026, 0.09, 10),
    new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.8 }),
  )
  grip.rotation.z = Math.PI / 2
  grip.position.x = 0.1
  const bulb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.033, 0.033, 0.015, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff1d8, emissive: 0xfff1d8, emissiveIntensity: 2.2 }),
  )
  bulb.rotation.z = Math.PI / 2
  bulb.position.x = -0.12
  g.add(body, grip, bulb)
  return { group: g, bulb }
}
