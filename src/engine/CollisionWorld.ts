// Flat registry of axis-aligned wall boxes for the currently active scene (lobby or one
// generated floor). Deliberately simple 2D (XZ) collision — floors are single-level, so a
// brute-force loop over a few hundred boxes per frame is cheap and avoids the complexity
// (and bug surface) of a physics engine for a prototype of this scope.

export interface WallBox {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface DynamicBox extends WallBox {
  enabled: boolean
}

export interface DynamicBoxHandle {
  setEnabled: (v: boolean) => void
}

export class CollisionWorld {
  private boxes: WallBox[] = []
  private dynamicBoxes: DynamicBox[] = []

  clear(): void {
    this.boxes = []
    this.dynamicBoxes = []
  }

  addBox(box: WallBox): void {
    this.boxes.push(box)
  }

  /** Adds a wall centered at (cx, cz) with the given width along X and depth along Z. */
  addWallSegment(cx: number, cz: number, width: number, depth: number): void {
    this.boxes.push({
      minX: cx - width / 2,
      maxX: cx + width / 2,
      minZ: cz - depth / 2,
      maxZ: cz + depth / 2,
    })
  }

  /** A box that can be toggled on/off at runtime — used for doors that open and close. */
  addDynamicWallSegment(cx: number, cz: number, width: number, depth: number, initiallyEnabled: boolean): DynamicBoxHandle {
    const box: DynamicBox = {
      minX: cx - width / 2,
      maxX: cx + width / 2,
      minZ: cz - depth / 2,
      maxZ: cz + depth / 2,
      enabled: initiallyEnabled,
    }
    this.dynamicBoxes.push(box)
    return {
      setEnabled: (v: boolean) => {
        box.enabled = v
      },
    }
  }

  private collidesAt(x: number, z: number, radius: number): boolean {
    for (let i = 0; i < this.boxes.length; i++) {
      const b = this.boxes[i]
      const cx = Math.max(b.minX, Math.min(x, b.maxX))
      const cz = Math.max(b.minZ, Math.min(z, b.maxZ))
      const dx = x - cx
      const dz = z - cz
      if (dx * dx + dz * dz < radius * radius) return true
    }
    for (let i = 0; i < this.dynamicBoxes.length; i++) {
      const b = this.dynamicBoxes[i]
      if (!b.enabled) continue
      const cx = Math.max(b.minX, Math.min(x, b.maxX))
      const cz = Math.max(b.minZ, Math.min(z, b.maxZ))
      const dx = x - cx
      const dz = z - cz
      if (dx * dx + dz * dz < radius * radius) return true
    }
    return false
  }

  /** Resolves a desired XZ move against all registered walls, sliding along surfaces. */
  resolveMove(currentX: number, currentZ: number, desiredX: number, desiredZ: number, radius: number): { x: number; z: number } {
    let x = currentX
    let z = currentZ

    if (!this.collidesAt(desiredX, currentZ, radius)) {
      x = desiredX
    }
    if (!this.collidesAt(x, desiredZ, radius)) {
      z = desiredZ
    }
    return { x, z }
  }

  circleIntersectsAny(x: number, z: number, radius: number): boolean {
    return this.collidesAt(x, z, radius)
  }

  private segmentHitsBox(x0: number, z0: number, x1: number, z1: number, b: WallBox): boolean {
    const dx = x1 - x0
    const dz = z1 - z0
    let tmin = 0
    let tmax = 1
    if (Math.abs(dx) < 1e-9) {
      if (x0 < b.minX || x0 > b.maxX) return false
    } else {
      let t1 = (b.minX - x0) / dx
      let t2 = (b.maxX - x0) / dx
      if (t1 > t2) [t1, t2] = [t2, t1]
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) return false
    }
    if (Math.abs(dz) < 1e-9) {
      if (z0 < b.minZ || z0 > b.maxZ) return false
    } else {
      let t1 = (b.minZ - z0) / dz
      let t2 = (b.maxZ - z0) / dz
      if (t1 > t2) [t1, t2] = [t2, t1]
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) return false
    }
    return tmin <= tmax
  }

  /**
   * True if a straight line between two points crosses a solid wall — used for AI
   * line-of-sight. Open doors (disabled dynamic boxes) don't block sight, matching what the
   * player would actually be able to see through.
   */
  blocksLineOfSight(x0: number, z0: number, x1: number, z1: number): boolean {
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.segmentHitsBox(x0, z0, x1, z1, this.boxes[i])) return true
    }
    for (let i = 0; i < this.dynamicBoxes.length; i++) {
      const b = this.dynamicBoxes[i]
      if (!b.enabled) continue
      if (this.segmentHitsBox(x0, z0, x1, z1, b)) return true
    }
    return false
  }
}
