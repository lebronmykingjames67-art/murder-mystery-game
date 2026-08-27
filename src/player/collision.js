// Hand-written capsule-vs-AABB collision.
//
// The player is a vertical capsule: a circle of `radius` in the XZ plane,
// extruded from feet (position.y) to head (position.y + height), with the
// cap curvature ignored for broad-phase purposes (a "vertical cylinder"
// simplification of the capsule — cheap, and it's what keeps the pass
// symmetric between the X and Z sweeps below).
//
// Each axis is swept and resolved independently (X, then Z, then Y) so a
// diagonal move against a wall slides along it instead of snagging on the
// box corner where the two axes would otherwise fight each other.

const EPSILON = 1e-4

// A horizontal collision against a box whose top is within this much above
// the capsule's feet auto-steps onto it instead of blocking (stairs), rather
// than requiring a jump for every riser. Taller obstacles still block/push
// out as normal. This doesn't re-check headroom against the rest of the
// level at the stepped-up height — fine for this hand-built test room,
// worth revisiting once the chunk-based level generator lands.
const MAX_STEP_HEIGHT = 0.5

function boxHorizontalOverlap(box, radius, x, z) {
  const expandedMinX = box.min.x - radius
  const expandedMaxX = box.max.x + radius
  const expandedMinZ = box.min.z - radius
  const expandedMaxZ = box.max.z + radius
  return x > expandedMinX && x < expandedMaxX && z > expandedMinZ && z < expandedMaxZ
}

function verticalRangesOverlap(box, feet, height) {
  return feet < box.max.y && feet + height > box.min.y
}

/** Sweep the capsule along a single horizontal axis and push it back out of any box it now overlaps. */
function resolveHorizontalAxis(capsule, boxes, axis) {
  for (const box of boxes) {
    if (!verticalRangesOverlap(box, capsule.feet.y, capsule.height)) continue
    if (!boxHorizontalOverlap(box, capsule.radius, capsule.feet.x, capsule.feet.z)) continue

    const rise = box.max.y - capsule.feet.y
    if (rise > 0 && rise <= MAX_STEP_HEIGHT) {
      capsule.feet.y = box.max.y
      continue
    }

    if (axis === 'x') {
      const expandedMin = box.min.x - capsule.radius
      const expandedMax = box.max.x + capsule.radius
      const fromLeft = capsule.feet.x - expandedMin
      const fromRight = expandedMax - capsule.feet.x
      capsule.feet.x += fromLeft < fromRight ? -fromLeft : fromRight
      capsule.velocity.x = 0
    } else {
      const expandedMin = box.min.z - capsule.radius
      const expandedMax = box.max.z + capsule.radius
      const fromNear = capsule.feet.z - expandedMin
      const fromFar = expandedMax - capsule.feet.z
      capsule.feet.z += fromNear < fromFar ? -fromNear : fromFar
      capsule.velocity.z = 0
    }
  }
}

/** Resolve vertical movement: landing on box tops, bumping heads on box undersides. */
function resolveVerticalAxis(capsule, boxes) {
  capsule.grounded = false

  for (const box of boxes) {
    if (!boxHorizontalOverlap(box, capsule.radius, capsule.feet.x, capsule.feet.z)) continue

    const headY = capsule.feet.y + capsule.height

    // Falling (or resting) onto the box's top surface.
    if (capsule.velocity.y <= 0 && capsule.feet.y < box.max.y && headY > box.max.y) {
      capsule.feet.y = box.max.y
      capsule.velocity.y = 0
      capsule.grounded = true
      continue
    }

    // Rising into the box's underside.
    if (capsule.velocity.y > 0 && headY > box.min.y && capsule.feet.y < box.min.y) {
      capsule.feet.y = box.min.y - capsule.height
      capsule.velocity.y = 0
    }
  }
}

/**
 * Advance a capsule {feet: Vector3, velocity: Vector3, radius, height} by
 * `dt` against a flat list of AABB colliders ({min: Vector3, max: Vector3}),
 * mutating it in place. Sets capsule.grounded.
 */
export function stepCapsule(capsule, boxes, dt) {
  capsule.feet.x += capsule.velocity.x * dt
  resolveHorizontalAxis(capsule, boxes, 'x')

  capsule.feet.z += capsule.velocity.z * dt
  resolveHorizontalAxis(capsule, boxes, 'z')

  capsule.feet.y += capsule.velocity.y * dt
  resolveVerticalAxis(capsule, boxes)
}

/** True if raising `capsule.height` to `targetHeight` would not intersect any box (used to stand up out of a slide). */
export function hasHeadroom(capsule, boxes, targetHeight) {
  const headY = capsule.feet.y + targetHeight + EPSILON
  for (const box of boxes) {
    if (!boxHorizontalOverlap(box, capsule.radius, capsule.feet.x, capsule.feet.z)) continue
    if (capsule.feet.y < box.max.y && headY > box.min.y) return false
  }
  return true
}
