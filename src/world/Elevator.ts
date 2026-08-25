import * as THREE from 'three'
import type { Direction, Interactable } from '../types'
import { DIR_VECTOR } from '../types'
import { WALL_HEIGHT, WALL_THICKNESS } from '../core/constants'
import type { CollisionWorld, DynamicBoxHandle } from '../engine/CollisionWorld'
import { boxMesh } from './Geometries'
import { elevatorDoorMaterial, metalMaterial, wallMaterial, emissivePanel, type FloorMood } from './Materials'
import { makeFloorReadout } from './Signage'
import { audioManager } from '../core/AudioManager'

export const CAB_WIDTH = 2.6
const CAB_DEPTH = 2.2
const DOOR_ANIM_SECONDS = 0.9

const UP = new THREE.Vector3(0, 1, 0)

export function yawForOutwardDir(dir: Direction): number {
  const { dx, dz } = DIR_VECTOR[dir]
  return Math.atan2(-dx, -dz)
}

export interface ElevatorOptions {
  position: THREE.Vector3
  facing: Direction
  mood: FloorMood
  floorNumber: number
  startLocked: boolean
  collision: CollisionWorld
  onEntered: () => void
  /** Fires the instant the doors start closing behind the player — good moment to freeze input. */
  onClosingStart?: () => void
  trackDisposable: (r: { dispose: () => void }) => void
}

/**
 * A physical elevator cab: sliding doors, a floor readout, and a trigger volume the player
 * walks into. Used both for the lobby's "start a run" elevator and for the locked elevator at
 * the end of every generated floor. Nobody clicks a button in a menu to change floors — they
 * walk into this exact object and the doors close around them.
 */
export class Elevator {
  readonly group = new THREE.Group()
  readonly interactable: Interactable
  private doorL: THREE.Mesh
  private doorR: THREE.Mesh
  private indicatorLight: THREE.Mesh
  private doorT: number
  private doorTarget: number
  private locked: boolean
  private used = false
  private worldPos = new THREE.Vector3()
  private yaw: number
  private onEntered: () => void
  private onClosingStart?: () => void
  private closingCallbackFired = false
  private doorwayCollision: DynamicBoxHandle

  constructor(opts: ElevatorOptions) {
    this.locked = opts.startLocked
    this.doorT = this.locked ? 0 : 1
    this.doorTarget = this.doorT
    this.onEntered = opts.onEntered
    this.onClosingStart = opts.onClosingStart
    this.worldPos.copy(opts.position)
    this.yaw = yawForOutwardDir(opts.facing)

    this.group.position.copy(opts.position)
    this.group.rotation.y = this.yaw

    const outward = DIR_VECTOR[opts.facing]
    const doorwayAlongX = opts.facing === 'N' || opts.facing === 'S'
    this.doorwayCollision = opts.collision.addDynamicWallSegment(
      opts.position.x + outward.dx * (CAB_DEPTH / 2),
      opts.position.z + outward.dz * (CAB_DEPTH / 2),
      doorwayAlongX ? CAB_WIDTH : WALL_THICKNESS,
      doorwayAlongX ? WALL_THICKNESS : CAB_WIDTH,
      this.locked,
    )

    const wallMat = wallMaterial(opts.mood)
    const back = boxMesh(metalMaterial, CAB_WIDTH, WALL_HEIGHT, 0.15)
    back.position.set(0, WALL_HEIGHT / 2, CAB_DEPTH / 2 - 0.08)
    this.group.add(back)

    const sideL = boxMesh(wallMat, 0.15, WALL_HEIGHT, CAB_DEPTH)
    sideL.position.set(-CAB_WIDTH / 2 + 0.08, WALL_HEIGHT / 2, 0)
    this.group.add(sideL)
    const sideR = boxMesh(wallMat, 0.15, WALL_HEIGHT, CAB_DEPTH)
    sideR.position.set(CAB_WIDTH / 2 - 0.08, WALL_HEIGHT / 2, 0)
    this.group.add(sideR)

    const ceiling = boxMesh(wallMat, CAB_WIDTH, 0.12, CAB_DEPTH)
    ceiling.position.set(0, WALL_HEIGHT - 0.06, 0)
    this.group.add(ceiling)

    const floor = boxMesh(metalMaterial, CAB_WIDTH, 0.1, CAB_DEPTH)
    floor.position.set(0, 0.05, 0)
    this.group.add(floor)

    // Header above the doors carries the frame + floor readout.
    const header = boxMesh(metalMaterial, CAB_WIDTH + 0.3, 0.35, 0.3)
    header.position.set(0, WALL_HEIGHT - 0.2, -CAB_DEPTH / 2)
    this.group.add(header)

    this.indicatorLight = boxMesh(emissivePanel(this.locked ? '#8a2e2e' : '#3ce27c', 1.4), 0.5, 0.12, 0.05)
    this.indicatorLight.position.set(0, WALL_HEIGHT - 0.2, -CAB_DEPTH / 2 - 0.16)
    this.group.add(this.indicatorLight)

    const readout = makeFloorReadout(opts.floorNumber)
    opts.trackDisposable(readout.texture)
    readout.mesh.position.set(0, WALL_HEIGHT - 0.55, -CAB_DEPTH / 2 - 0.16)
    this.group.add(readout.mesh)

    const doorGeomWidth = CAB_WIDTH / 2 - 0.02
    this.doorL = boxMesh(elevatorDoorMaterial, doorGeomWidth, WALL_HEIGHT - 0.4, 0.08)
    this.doorL.position.set(-doorGeomWidth / 2, (WALL_HEIGHT - 0.4) / 2, -CAB_DEPTH / 2)
    this.group.add(this.doorL)

    this.doorR = boxMesh(elevatorDoorMaterial, doorGeomWidth, WALL_HEIGHT - 0.4, 0.08)
    this.doorR.position.set(doorGeomWidth / 2, (WALL_HEIGHT - 0.4) / 2, -CAB_DEPTH / 2)
    this.group.add(this.doorR)

    this.applyDoorTransform()

    // Only shows a prompt while locked ("try it, it's locked"). Once open there is nothing
    // to press — the walk-in trigger in update() is what actually moves the game forward,
    // matching the brief: the player physically walks into the elevator, nothing is clicked.
    this.interactable = {
      id: `elevator-${Math.random().toString(36).slice(2)}`,
      kind: 'elevator',
      object: this.group,
      promptText: '[E] LOCKED',
      range: 3,
      enabled: this.locked,
      onInteract: () => {
        if (this.locked) audioManager.doorOpen(true)
      },
    }
  }

  private applyDoorTransform(): void {
    const doorGeomWidth = CAB_WIDTH / 2 - 0.02
    const openOffset = doorGeomWidth * 0.92
    this.doorL.position.x = -doorGeomWidth / 2 - openOffset * this.doorT
    this.doorR.position.x = doorGeomWidth / 2 + openOffset * this.doorT
  }

  open(): void {
    if (this.locked) return
    this.doorTarget = 1
    this.doorwayCollision.setEnabled(false)
    audioManager.doorOpen()
  }

  unlock(): void {
    this.locked = false
    this.interactable.enabled = false
    // Materials from world/Materials.ts are cached/shared, so swap the reference rather than
    // mutating the shared instance's color (that would recolor every user of that cache entry).
    this.indicatorLight.material = emissivePanel('#3ce27c', 1.4)
    audioManager.elevatorDing()
    this.open()
  }

  /** Advances door animation and checks the walk-in trigger. Call every frame. */
  update(dt: number, playerWorldPos: THREE.Vector3): void {
    const rate = 1 / DOOR_ANIM_SECONDS
    if (this.doorT < this.doorTarget) this.doorT = Math.min(this.doorTarget, this.doorT + rate * dt)
    else if (this.doorT > this.doorTarget) this.doorT = Math.max(this.doorTarget, this.doorT - rate * dt)
    this.applyDoorTransform()

    if (this.used) {
      // Keep watching for the close animation to finish every frame — this must NOT be
      // short-circuited by an early return, or onEntered() would never fire.
      if (!this.closingCallbackFired && this.doorT <= 0.02 && this.doorTarget === 0) {
        this.closingCallbackFired = true
        this.onEntered()
      }
      return
    }
    if (this.locked) return

    const rel = new THREE.Vector3(playerWorldPos.x - this.worldPos.x, 0, playerWorldPos.z - this.worldPos.z)
    rel.applyAxisAngle(UP, -this.yaw)
    const insideCab = Math.abs(rel.x) < CAB_WIDTH / 2 - 0.3 && rel.z > -CAB_DEPTH / 2 + 0.2 && rel.z < CAB_DEPTH / 2 - 0.2

    if (insideCab && this.doorTarget === 1 && this.doorT >= 0.98) {
      this.used = true
      this.closingCallbackFired = false
      this.doorTarget = 0
      this.doorwayCollision.setEnabled(true)
      audioManager.doorClose()
      this.onClosingStart?.()
    }
  }
}
