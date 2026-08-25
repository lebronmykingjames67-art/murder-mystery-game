import * as THREE from 'three'
import { boxMesh, cylinder } from './Geometries'
import { metalMaterial } from './Materials'

// Small set of reusable decorative primitives — crates, shelving, pipes, a fire extinguisher —
// built from boxes/cylinders so the building reads as "used" without needing any art assets.
// These are purely visual; callers register collision separately for anything blocking.

const crateMat = new THREE.MeshStandardMaterial({ color: '#6b5230', roughness: 0.85, metalness: 0.05 })
const shelfMat = new THREE.MeshStandardMaterial({ color: '#4a4e55', roughness: 0.6, metalness: 0.4 })
const pipeMat = new THREE.MeshStandardMaterial({ color: '#5c6570', roughness: 0.4, metalness: 0.7 })
const extinguisherMat = new THREE.MeshStandardMaterial({ color: '#a33232', roughness: 0.4, metalness: 0.3 })
const deskMat = new THREE.MeshStandardMaterial({ color: '#3d3227', roughness: 0.7, metalness: 0.1 })
const chairMat = new THREE.MeshStandardMaterial({ color: '#26282c', roughness: 0.7, metalness: 0.1 })

export function crate(size = 0.6): THREE.Group {
  const g = new THREE.Group()
  const m = boxMesh(crateMat, size, size, size)
  m.position.y = size / 2
  g.add(m)
  return g
}

export function crateStack(): THREE.Group {
  const g = new THREE.Group()
  const a = crate(0.7)
  g.add(a)
  const b = crate(0.5)
  b.position.set(0.15, 0.7, 0.05)
  g.add(b)
  return g
}

export function shelfUnit(width = 1.4, height = 2, depth = 0.5): THREE.Group {
  const g = new THREE.Group()
  const back = boxMesh(shelfMat, width, height, 0.06)
  back.position.set(0, height / 2, -depth / 2 + 0.03)
  g.add(back)
  const shelfCount = 4
  for (let i = 0; i < shelfCount; i++) {
    const shelf = boxMesh(shelfMat, width, 0.05, depth)
    shelf.position.set(0, (height / (shelfCount - 1)) * i + 0.03, 0)
    g.add(shelf)
  }
  const legL = boxMesh(shelfMat, 0.06, height, 0.06)
  legL.position.set(-width / 2 + 0.03, height / 2, 0)
  g.add(legL)
  const legR = boxMesh(shelfMat, 0.06, height, 0.06)
  legR.position.set(width / 2 - 0.03, height / 2, 0)
  g.add(legR)
  return g
}

export function wallPipe(length: number, vertical = false): THREE.Mesh {
  const geom = cylinder(0.06, 0.06, length, 8)
  const mesh = new THREE.Mesh(geom, pipeMat)
  if (!vertical) mesh.rotation.z = Math.PI / 2
  return mesh
}

export function fireExtinguisher(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(cylinder(0.09, 0.11, 0.5, 10), extinguisherMat)
  body.position.y = 0.25
  g.add(body)
  const cap = new THREE.Mesh(cylinder(0.06, 0.06, 0.08, 10), metalMaterial)
  cap.position.y = 0.54
  g.add(cap)
  const mount = boxMesh(metalMaterial, 0.14, 0.05, 0.04)
  mount.position.set(0, 0.4, -0.08)
  g.add(mount)
  return g
}

export function desk(): THREE.Group {
  const g = new THREE.Group()
  const top = boxMesh(deskMat, 1.3, 0.06, 0.65)
  top.position.y = 0.74
  g.add(top)
  const legPositions: [number, number][] = [
    [-0.6, -0.28],
    [0.6, -0.28],
    [-0.6, 0.28],
    [0.6, 0.28],
  ]
  legPositions.forEach(([x, z]) => {
    const leg = boxMesh(deskMat, 0.05, 0.74, 0.05)
    leg.position.set(x, 0.37, z)
    g.add(leg)
  })
  return g
}

export function chair(): THREE.Group {
  const g = new THREE.Group()
  const seat = boxMesh(chairMat, 0.42, 0.05, 0.42)
  seat.position.y = 0.46
  g.add(seat)
  const back = boxMesh(chairMat, 0.42, 0.5, 0.05)
  back.position.set(0, 0.7, -0.19)
  g.add(back)
  const legPositions: [number, number][] = [
    [-0.17, -0.17],
    [0.17, -0.17],
    [-0.17, 0.17],
    [0.17, 0.17],
  ]
  legPositions.forEach(([x, z]) => {
    const leg = boxMesh(chairMat, 0.04, 0.46, 0.04)
    leg.position.set(x, 0.23, z)
    g.add(leg)
  })
  return g
}

const lockerMat = new THREE.MeshStandardMaterial({ color: '#333a40', roughness: 0.6, metalness: 0.35 })

export function locker(): THREE.Group {
  const g = new THREE.Group()
  const body = boxMesh(lockerMat, 0.7, 1.9, 0.6)
  body.position.y = 0.95
  g.add(body)
  const seam = boxMesh(new THREE.MeshStandardMaterial({ color: '#1c1f22', roughness: 0.7 }), 0.02, 1.9, 0.61)
  seam.position.set(0, 0.95, 0)
  g.add(seam)
  const handle = boxMesh(metalMaterial, 0.05, 0.16, 0.05)
  handle.position.set(0.28, 1.05, 0.33)
  g.add(handle)
  return g
}

const cashMat = new THREE.MeshStandardMaterial({ color: '#3a7d4a', roughness: 0.6, metalness: 0.1, emissive: '#0a3315', emissiveIntensity: 0.25 })

export function cashStack(scale = 1): THREE.Group {
  const g = new THREE.Group()
  const layers = 3 + Math.round(scale)
  for (let i = 0; i < layers; i++) {
    const bill = boxMesh(cashMat, 0.22 * scale, 0.02, 0.1 * scale)
    bill.position.set((Math.random() - 0.5) * 0.02, 0.02 + i * 0.022, (Math.random() - 0.5) * 0.02)
    bill.rotation.y = (Math.random() - 0.5) * 0.5
    g.add(bill)
  }
  return g
}

export function electricalBox(): THREE.Group {
  const g = new THREE.Group()
  const box = boxMesh(shelfMat, 0.4, 0.55, 0.15)
  box.position.y = 1.3
  g.add(box)
  const stripe = boxMesh(new THREE.MeshStandardMaterial({ color: '#e0a415', roughness: 0.5 }), 0.4, 0.04, 0.16)
  stripe.position.y = 1.3
  g.add(stripe)
  return g
}
