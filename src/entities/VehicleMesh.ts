import * as THREE from 'three'
import type { VehicleDef } from '../types'

export interface VehicleMeshResult {
  group: THREE.Group
  wheels: THREE.Mesh[]
  riderMount: THREE.Object3D
  headlight: THREE.SpotLight
  headlightBulb: THREE.Mesh
}

const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14)

function wheel(): THREE.Mesh {
  const mesh = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }))
  mesh.rotation.z = Math.PI / 2
  return mesh
}

/** Builds a small low-poly vehicle from primitives; forward is local +z. */
export function buildVehicleMesh(def: VehicleDef): VehicleMeshResult {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.55, metalness: 0.15 })
  const accentMat = new THREE.MeshStandardMaterial({ color: def.accentColor, roughness: 0.5 })
  const wheels: THREE.Mesh[] = []
  let riderMount = new THREE.Object3D()

  const addWheel = (x: number, z: number, radius = 0.42): THREE.Mesh => {
    const w = wheel()
    w.scale.setScalar(radius / 0.42)
    w.position.set(x, radius, z)
    group.add(w)
    wheels.push(w)
    return w
  }

  switch (def.bodyStyle) {
    case 'bike':
    case 'ebike': {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 1.5), bodyMat)
      frame.position.set(0, 0.62, 0)
      group.add(frame)
      const seatPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), accentMat)
      seatPost.position.set(0, 0.85, -0.35)
      group.add(seatPost)
      addWheel(0, 0.68, 0.42)
      addWheel(0, -0.68, 0.42)
      riderMount.position.set(0, 0.95, -0.15)
      if (def.bodyStyle === 'ebike') {
        const battery = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.6), accentMat)
        battery.position.set(0, 0.75, 0.1)
        group.add(battery)
      }
      break
    }
    case 'scooter': {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 1.5), bodyMat)
      deck.position.set(0, 0.36, 0)
      group.add(deck)
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), accentMat)
      column.position.set(0, 0.75, 0.68)
      group.add(column)
      addWheel(0, 0.72, 0.36)
      addWheel(0, -0.72, 0.36)
      riderMount.position.set(0, 0.66, -0.1)
      break
    }
    case 'motorbike': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 1.7), bodyMat)
      body.position.set(0, 0.62, 0)
      group.add(body)
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.1), accentMat)
      screen.position.set(0, 0.95, 0.85)
      group.add(screen)
      addWheel(0, 0.78, 0.48)
      addWheel(0, -0.78, 0.48)
      riderMount.position.set(0, 1.0, -0.2)
      break
    }
    case 'car': {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 3.4), bodyMat)
      chassis.position.set(0, 0.55, 0)
      group.add(chassis)
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 1.7), accentMat)
      cabin.position.set(0, 1.05, -0.15)
      group.add(cabin)
      addWheel(0.92, 1.05, 0.46)
      addWheel(-0.92, 1.05, 0.46)
      addWheel(0.92, -1.05, 0.46)
      addWheel(-0.92, -1.05, 0.46)
      riderMount.position.set(0, 1.5, -0.15)
      break
    }
    case 'van': {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.55, 4.4), bodyMat)
      chassis.position.set(0, 1.0, -0.1)
      group.add(chassis)
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 1.1), new THREE.MeshStandardMaterial({ color: 0xdedede }))
      cab.position.set(0, 0.85, 1.85)
      group.add(cab)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.3, 4.4), accentMat)
      stripe.position.set(0, 0.75, -0.1)
      group.add(stripe)
      addWheel(1.05, 1.4, 0.52)
      addWheel(-1.05, 1.4, 0.52)
      addWheel(1.05, -1.5, 0.52)
      addWheel(-1.05, -1.5, 0.52)
      riderMount.position.set(0, 2.0, 1.4)
      break
    }
  }

  const headlightBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2b0, emissiveIntensity: 0.4 }),
  )
  const frontZ = def.bodyStyle === 'van' ? 2.15 : def.bodyStyle === 'car' ? 1.65 : 0.75
  headlightBulb.position.set(0, 0.55, frontZ)
  group.add(headlightBulb)

  // Off by default (intensity 0) — GameEngine switches it on for the player's own vehicle at night.
  const headlight = new THREE.SpotLight(0xfff2c8, 0, 34, Math.PI / 5.5, 0.45, 1.4)
  headlight.position.set(0, 0.6, frontZ)
  const headlightTarget = new THREE.Object3D()
  headlightTarget.position.set(0, 0.1, frontZ + 12)
  group.add(headlightTarget)
  headlight.target = headlightTarget
  group.add(headlight)

  group.add(riderMount)
  return { group, wheels, riderMount, headlight, headlightBulb }
}
