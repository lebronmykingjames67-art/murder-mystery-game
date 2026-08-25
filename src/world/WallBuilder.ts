import * as THREE from 'three'
import type { CollisionWorld } from '../engine/CollisionWorld'
import { WALL_HEIGHT } from '../core/constants'
import { boxMesh } from './Geometries'
import { wallMaterial, floorMaterial, ceilingMaterial, type FloorMood } from './Materials'

/** A static wall segment: mesh + matching collider, centered at (cx, cz). */
export function buildWall(
  root: THREE.Group,
  collision: CollisionWorld,
  mood: FloorMood,
  cx: number,
  cz: number,
  width: number,
  depth: number,
): void {
  const mesh = boxMesh(wallMaterial(mood), width, WALL_HEIGHT, depth)
  mesh.position.set(cx, WALL_HEIGHT / 2, cz)
  root.add(mesh)
  collision.addWallSegment(cx, cz, width, depth)
}

/** A floor slab spanning [x0,x1] x [z0,z1] (world space), plus a matching ceiling slab. */
export function buildFloorAndCeiling(root: THREE.Group, mood: FloorMood, x0: number, x1: number, z0: number, z1: number): void {
  const w = x1 - x0
  const d = z1 - z0
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2

  const floor = boxMesh(floorMaterial(mood), w, 0.2, d)
  floor.position.set(cx, -0.1, cz)
  root.add(floor)

  const ceiling = boxMesh(ceilingMaterial(mood), w, 0.15, d)
  ceiling.position.set(cx, WALL_HEIGHT + 0.075, cz)
  root.add(ceiling)
}
