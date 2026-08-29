import * as THREE from 'three'

// Shared geometric primitives used by both weapons/ (bullet vs. level/enemy
// collision) and enemies/ (pushing enemy spheres out of level geometry).
// Player-vs-level collision has its own capsule sweep in player/collision.js;
// everything here treats moving things as points or spheres, which is all
// bullets and enemies need.

/** Reflects `velocity` across `normal` in place (assumes normal is unit length). */
export function reflect(velocity, normal) {
  const d = 2 * velocity.dot(normal)
  velocity.x -= d * normal.x
  velocity.y -= d * normal.y
  velocity.z -= d * normal.z
}

/**
 * Closest-point sphere-vs-AABB test. Returns { normal, penetration } if the
 * sphere at `position` with `radius` overlaps `box`, else null. `normal`
 * points from the box surface toward the sphere center, so it doubles as a
 * bounce normal for a bullet that just hit that face.
 */
export function sphereBoxCollision(position, radius, box) {
  const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x)
  const closestY = THREE.MathUtils.clamp(position.y, box.min.y, box.max.y)
  const closestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z)

  const dx = position.x - closestX
  const dy = position.y - closestY
  const dz = position.z - closestZ
  const distSq = dx * dx + dy * dy + dz * dz
  if (distSq > radius * radius) return null

  const dist = Math.sqrt(distSq)
  const normal =
    dist > 1e-5 ? new THREE.Vector3(dx / dist, dy / dist, dz / dist) : new THREE.Vector3(0, 1, 0)
  return { normal, penetration: radius - dist }
}

/** Pushes a sphere out of every overlapping box in `colliders`, in place. */
export function pushSphereOutOfColliders(position, radius, colliders) {
  for (const box of colliders) {
    const hit = sphereBoxCollision(position, radius, box)
    if (hit) position.addScaledVector(hit.normal, hit.penetration)
  }
}

/** Ray-vs-AABB (slab method). Returns the nearest positive hit distance along a unit `dir`, or null. */
export function rayBoxDistance(origin, dir, box) {
  let tmin = -Infinity
  let tmax = Infinity

  for (const axis of ['x', 'y', 'z']) {
    const o = origin[axis]
    const d = dir[axis]
    if (Math.abs(d) < 1e-8) {
      if (o < box.min[axis] || o > box.max[axis]) return null
      continue
    }
    let t1 = (box.min[axis] - o) / d
    let t2 = (box.max[axis] - o) / d
    if (t1 > t2) [t1, t2] = [t2, t1]
    tmin = Math.max(tmin, t1)
    tmax = Math.min(tmax, t2)
    if (tmin > tmax) return null
  }

  if (tmax < 0) return null
  return tmin >= 0 ? tmin : tmax
}

/** Ray-vs-sphere. Returns the nearest positive hit distance along a unit `dir`, or null. */
export function raySphereDistance(origin, dir, center, radius) {
  const m = new THREE.Vector3().subVectors(origin, center)
  const b = m.dot(dir)
  const c = m.dot(m) - radius * radius
  if (c > 0 && b > 0) return null
  const discriminant = b * b - c
  if (discriminant < 0) return null
  const t = -b - Math.sqrt(discriminant)
  return t >= 0 ? t : null
}

/** True if `point` falls within the frontal arc (in degrees) of something at `fromCenter` facing `facingYaw`. */
export function withinFrontalArc(fromCenter, point, facingYaw, arcDegrees) {
  const toPoint = new THREE.Vector2(point.x - fromCenter.x, point.z - fromCenter.z)
  if (toPoint.lengthSq() < 1e-8) return true
  toPoint.normalize()
  const facing = new THREE.Vector2(-Math.sin(facingYaw), -Math.cos(facingYaw))
  const cosHalfArc = Math.cos(THREE.MathUtils.degToRad(arcDegrees / 2))
  return facing.dot(toPoint) >= cosHalfArc
}
