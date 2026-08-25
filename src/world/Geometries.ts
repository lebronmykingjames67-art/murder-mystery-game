import * as THREE from 'three'

// A handful of shared, cached geometries reused (via per-mesh scale/position) across the
// entire building instead of allocating new geometry per wall/prop. Keeps floor generation
// cheap no matter how many rooms a run ends up walking through.

let unitBoxGeom: THREE.BoxGeometry | null = null
export function unitBox(): THREE.BoxGeometry {
  if (!unitBoxGeom) unitBoxGeom = new THREE.BoxGeometry(1, 1, 1)
  return unitBoxGeom
}

let unitPlaneGeom: THREE.PlaneGeometry | null = null
export function unitPlane(): THREE.PlaneGeometry {
  if (!unitPlaneGeom) unitPlaneGeom = new THREE.PlaneGeometry(1, 1)
  return unitPlaneGeom
}

const cylinderCache = new Map<string, THREE.CylinderGeometry>()
export function cylinder(radiusTop: number, radiusBottom: number, height: number, segments = 16): THREE.CylinderGeometry {
  const key = `${radiusTop}:${radiusBottom}:${height}:${segments}`
  const existing = cylinderCache.get(key)
  if (existing) return existing
  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments)
  cylinderCache.set(key, geom)
  return geom
}

let unitSphereGeom: THREE.SphereGeometry | null = null
export function unitSphere(): THREE.SphereGeometry {
  if (!unitSphereGeom) unitSphereGeom = new THREE.SphereGeometry(0.5, 16, 12)
  return unitSphereGeom
}

/** Convenience: a box mesh built from the shared unit geometry, scaled/positioned in place. */
export function boxMesh(material: THREE.Material, width: number, height: number, depth: number): THREE.Mesh {
  const mesh = new THREE.Mesh(unitBox(), material)
  mesh.scale.set(width, height, depth)
  return mesh
}
