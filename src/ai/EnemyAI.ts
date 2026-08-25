import * as THREE from 'three'
import type { DifficultyConfig, EnemyState, FloorCell, FloorLayout } from '../types'
import type { CollisionWorld } from '../engine/CollisionWorld'
import { bfsPath, cellAtWorld, randomCell } from '../world/Pathfinding'
import { cellWorldCenter } from '../world/FloorGenerator'
import { CELL_SIZE } from '../core/constants'
import { Rng } from '../utils/rng'
import { audioManager } from '../core/AudioManager'

const BODY_RADIUS = 0.34
const WAYPOINT_TOLERANCE = 0.35
const LOS_GRACE_SECONDS = 1.1
const SEARCH_DURATION = 7
const CATCH_RADIUS = 0.95

export interface EnemyPerception {
  playerPosition: THREE.Vector3
  playerHidden: boolean
  /** Set only on the frame a noise actually happened (a footstep, a dropped object, etc). */
  noiseEvent: { x: number; z: number; loudness: number } | null
}

/**
 * A single hunter AI for Chase floors: patrol -> investigate -> search -> chase -> lost, in a
 * loop. It never reads the player's raw position outside of an explicit sight or hearing
 * check, and it paths only along the floor's real corridor graph (via BFS), so it can never
 * cut through a wall or teleport onto the player.
 */
export class EnemyAI {
  readonly group = new THREE.Group()
  state: EnemyState = 'idle'

  private position = new THREE.Vector3()
  private facingYaw = 0
  private layout: FloorLayout
  private collision: CollisionWorld
  private difficulty: DifficultyConfig
  private rng: Rng
  private currentCell: FloorCell
  private path: FloorCell[] = []
  private waypointIndex = 0
  private stateTimer = 0
  private lastKnownTarget = new THREE.Vector3()
  private losTimer = 0
  private stuckTimer = 0
  private stuckReference = new THREE.Vector3()
  private growlCooldown = 0
  private repathCooldown = 0

  constructor(layout: FloorLayout, collision: CollisionWorld, difficulty: DifficultyConfig, spawnCell: FloorCell, seed: number) {
    this.layout = layout
    this.collision = collision
    this.difficulty = difficulty
    this.rng = new Rng(seed)
    this.currentCell = spawnCell
    const c = cellWorldCenter(spawnCell)
    this.position.set(c.x, 0, c.z)
    this.stuckReference.copy(this.position)

    const bodyMat = new THREE.MeshStandardMaterial({ color: '#0a0a0d', roughness: 0.95, metalness: 0.05 })
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff2a2a', emissiveIntensity: 2.4, roughness: 0.4 })
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 4, 8), bodyMat)
    body.position.y = 0.92
    this.group.add(body)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), bodyMat)
    head.position.y = 1.6
    this.group.add(head)
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat)
    eyeL.position.set(-0.08, 1.62, -0.19)
    this.group.add(eyeL)
    const eyeR = eyeL.clone()
    eyeR.position.x = 0.08
    this.group.add(eyeR)

    this.group.position.copy(this.position)
    this.stateTimer = this.rng.range(0.4, 1.4)
  }

  getPosition(): THREE.Vector3 {
    return this.position
  }

  private syncCurrentCell(): void {
    const cell = cellAtWorld(this.layout, this.position.x, this.position.z, CELL_SIZE)
    if (cell) this.currentCell = cell
  }

  private repathTo(target: FloorCell): void {
    this.path = bfsPath(this.layout, this.currentCell, target)
    this.waypointIndex = this.path[0] === this.currentCell ? 1 : 0
  }

  private repathToWorld(x: number, z: number): void {
    const target = cellAtWorld(this.layout, x, z, CELL_SIZE)
    this.repathTo(target ?? randomCell(this.layout, this.rng))
  }

  private pickPatrolTarget(): void {
    this.repathTo(randomCell(this.layout, this.rng, this.currentCell))
  }

  /** Moves toward the current waypoint; returns true once the whole path has been walked. */
  private followPath(dt: number, speed: number): boolean {
    if (this.waypointIndex >= this.path.length) return true
    const target = cellWorldCenter(this.path[this.waypointIndex])
    const dx = target.x - this.position.x
    const dz = target.z - this.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < WAYPOINT_TOLERANCE) {
      this.waypointIndex++
      return this.waypointIndex >= this.path.length
    }
    const nx = dx / dist
    const nz = dz / dist
    const resolved = this.collision.resolveMove(this.position.x, this.position.z, this.position.x + nx * speed * dt, this.position.z + nz * speed * dt, BODY_RADIUS)
    this.position.x = resolved.x
    this.position.z = resolved.z
    this.facingYaw = Math.atan2(nx, nz)
    this.syncCurrentCell()
    return false
  }

  private canSee(perception: EnemyPerception): boolean {
    if (perception.playerHidden) return false
    const dx = perception.playerPosition.x - this.position.x
    const dz = perception.playerPosition.z - this.position.z
    const dist = Math.hypot(dx, dz)
    if (dist > this.difficulty.enemyDetectionRadius) return false
    if (dist > 0.6) {
      const angleToPlayer = Math.atan2(dx, dz)
      let diff = angleToPlayer - this.facingYaw
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      const halfFov = (this.difficulty.enemyFovDegrees * Math.PI) / 180 / 2
      if (Math.abs(diff) > halfFov) return false
    }
    if (this.collision.blocksLineOfSight(this.position.x, this.position.z, perception.playerPosition.x, perception.playerPosition.z)) return false
    return true
  }

  private hears(noise: { x: number; z: number; loudness: number }): boolean {
    const dist = Math.hypot(noise.x - this.position.x, noise.z - this.position.z)
    return dist < this.difficulty.enemyHearingRadius * noise.loudness
  }

  private enterChase(): void {
    if (this.state !== 'chase') audioManager.alarm()
    this.state = 'chase'
    this.stateTimer = 0
    this.losTimer = 0
  }

  update(dt: number, perception: EnemyPerception): void {
    this.stateTimer += dt
    this.repathCooldown -= dt
    const sees = this.canSee(perception)

    if (sees) this.lastKnownTarget.copy(perception.playerPosition)

    switch (this.state) {
      case 'idle':
        if (this.stateTimer > 1.2) {
          this.state = 'patrol'
          this.pickPatrolTarget()
        }
        break

      case 'patrol': {
        if (sees) {
          this.enterChase()
          break
        }
        if (perception.noiseEvent && this.hears(perception.noiseEvent)) {
          this.lastKnownTarget.set(perception.noiseEvent.x, 0, perception.noiseEvent.z)
          this.repathToWorld(perception.noiseEvent.x, perception.noiseEvent.z)
          this.state = 'investigate'
          this.stateTimer = 0
          break
        }
        const done = this.followPath(dt, this.difficulty.enemySpeed * 0.5)
        if (done) this.pickPatrolTarget()
        break
      }

      case 'investigate': {
        if (sees) {
          this.enterChase()
          break
        }
        if (perception.noiseEvent && this.hears(perception.noiseEvent) && this.repathCooldown <= 0) {
          this.lastKnownTarget.set(perception.noiseEvent.x, 0, perception.noiseEvent.z)
          this.repathToWorld(perception.noiseEvent.x, perception.noiseEvent.z)
          this.repathCooldown = 0.6
        }
        const done = this.followPath(dt, this.difficulty.enemySpeed * 0.72)
        if (done) {
          this.state = 'search'
          this.stateTimer = 0
          this.pickPatrolTarget()
        }
        break
      }

      case 'search': {
        if (sees) {
          this.enterChase()
          break
        }
        if (perception.noiseEvent && this.hears(perception.noiseEvent)) {
          this.repathToWorld(perception.noiseEvent.x, perception.noiseEvent.z)
        }
        const done = this.followPath(dt, this.difficulty.enemySpeed * 0.6)
        if (done) this.pickPatrolTarget()
        if (this.stateTimer > SEARCH_DURATION) {
          this.state = 'patrol'
          this.stateTimer = 0
          this.pickPatrolTarget()
        }
        break
      }

      case 'chase': {
        if (sees) {
          this.losTimer = 0
          if (this.repathCooldown <= 0) {
            this.repathToWorld(perception.playerPosition.x, perception.playerPosition.z)
            this.repathCooldown = 0.35
          }
          this.followPath(dt, this.difficulty.enemySpeed)
        } else {
          this.losTimer += dt
          this.followPath(dt, this.difficulty.enemySpeed)
          if (this.losTimer > LOS_GRACE_SECONDS) {
            this.state = 'lost'
            this.stateTimer = 0
            this.repathToWorld(this.lastKnownTarget.x, this.lastKnownTarget.z)
          }
        }
        break
      }

      case 'lost': {
        if (sees) {
          this.enterChase()
          break
        }
        const done = this.followPath(dt, this.difficulty.enemySpeed * 0.8)
        if (done || this.stateTimer > 3.5) {
          this.state = 'search'
          this.stateTimer = 0
          this.pickPatrolTarget()
        }
        break
      }
    }

    // Stuck recovery: if barely moved for a while despite trying to, force a fresh target.
    if (this.state !== 'idle') {
      this.stuckTimer += dt
      if (this.stuckTimer > 1.6) {
        const moved = Math.hypot(this.position.x - this.stuckReference.x, this.position.z - this.stuckReference.z)
        this.stuckReference.copy(this.position)
        this.stuckTimer = 0
        if (moved < 0.15) {
          const wasPatrolling = this.state === 'patrol'
          this.syncCurrentCell()
          this.pickPatrolTarget()
          if (!wasPatrolling) this.state = 'search'
        }
      }
    }

    this.group.position.set(this.position.x, 0, this.position.z)
    this.group.rotation.y = this.facingYaw

    this.growlCooldown -= dt
    if (this.growlCooldown <= 0 && this.state !== 'idle' && this.state !== 'patrol') {
      const dist = Math.hypot(perception.playerPosition.x - this.position.x, perception.playerPosition.z - this.position.z)
      const factor = Math.max(0, 1 - dist / 14)
      if (factor > 0.05) audioManager.enemyGrowl(factor)
      this.growlCooldown = this.rng.range(1.6, 2.8)
    }
  }

  distanceToPlayer(playerPos: THREE.Vector3): number {
    return Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z)
  }

  isCatchingPlayer(playerPos: THREE.Vector3): boolean {
    return this.state === 'chase' && this.distanceToPlayer(playerPos) < CATCH_RADIUS
  }
}
