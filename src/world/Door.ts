import * as THREE from 'three'
import type { Direction, Interactable } from '../types'
import { WALL_HEIGHT, WALL_THICKNESS } from '../core/constants'
import type { CollisionWorld, DynamicBoxHandle } from '../engine/CollisionWorld'
import { boxMesh } from './Geometries'
import { doorMaterial, doorLockedMaterial } from './Materials'
import { audioManager } from '../core/AudioManager'

export type DoorVariant = 'normal' | 'locked' | 'automatic' | 'emergency'

const DOOR_ANIM_SECONDS = 0.6
const PROXIMITY_RANGE = 2.4

export interface DoorOptions {
  position: THREE.Vector3
  direction: Direction
  passageWidth: number
  variant: DoorVariant
  collision: CollisionWorld
  canOpen?: () => boolean
  lockedMessage?: string
  onOpened?: () => void
}

/**
 * A physical sliding door: two panels that part and tuck against the flanking wall segments,
 * exactly like the elevator doors. `locked` doors re-check `canOpen()` on every interact
 * attempt, so a door doesn't need to be told externally the instant a switch or keycard makes
 * it openable — the player just tries the door again and it works.
 */
export class Door {
  readonly group = new THREE.Group()
  readonly interactable: Interactable | null = null
  private panelA: THREE.Mesh
  private panelB: THREE.Mesh
  private panelWidth: number
  private doorT = 0
  private doorTarget = 0
  private opened = false
  private collisionHandle: DynamicBoxHandle
  private variant: DoorVariant
  private canOpen?: () => boolean
  private onOpened?: () => void
  private lockedMessage?: string
  private worldPos: THREE.Vector3
  private alongX: boolean

  constructor(opts: DoorOptions) {
    this.variant = opts.variant
    this.canOpen = opts.canOpen
    this.onOpened = opts.onOpened
    this.lockedMessage = opts.lockedMessage
    this.worldPos = opts.position.clone()
    this.alongX = opts.direction === 'N' || opts.direction === 'S'

    const doorHeight = WALL_HEIGHT - 0.5
    const thickness = WALL_THICKNESS * 1.05
    const mat = opts.variant === 'locked' ? doorLockedMaterial : doorMaterial
    this.panelWidth = opts.passageWidth / 2 - 0.03

    if (this.alongX) {
      this.panelA = boxMesh(mat, this.panelWidth, doorHeight, thickness)
      this.panelB = boxMesh(mat, this.panelWidth, doorHeight, thickness)
    } else {
      this.panelA = boxMesh(mat, thickness, doorHeight, this.panelWidth)
      this.panelB = boxMesh(mat, thickness, doorHeight, this.panelWidth)
    }
    this.panelA.position.set(opts.position.x, doorHeight / 2, opts.position.z)
    this.panelB.position.set(opts.position.x, doorHeight / 2, opts.position.z)
    this.group.add(this.panelA, this.panelB)

    this.collisionHandle = opts.collision.addDynamicWallSegment(
      opts.position.x,
      opts.position.z,
      this.alongX ? opts.passageWidth : WALL_THICKNESS,
      this.alongX ? WALL_THICKNESS : opts.passageWidth,
      true,
    )

    this.applyDoorTransform()

    if (opts.variant !== 'automatic') {
      this.interactable = {
        id: `door-${Math.random().toString(36).slice(2)}`,
        kind: 'door',
        object: this.group,
        promptText: this.currentPromptText(),
        range: 2.6,
        enabled: true,
        onInteract: () => this.tryOpen(),
      }
    }
  }

  private currentPromptText(): string {
    if (this.opened) return '[E] OPEN DOOR'
    if (this.variant === 'locked' && !(this.canOpen?.() ?? true)) return `[E] ${this.lockedMessage ?? 'LOCKED'}`
    return '[E] OPEN DOOR'
  }

  private applyDoorTransform(): void {
    const openOffset = this.panelWidth * 0.95 + 0.03
    if (this.alongX) {
      this.panelA.position.x = this.worldPos.x - this.panelWidth / 2 - openOffset * this.doorT
      this.panelB.position.x = this.worldPos.x + this.panelWidth / 2 + openOffset * this.doorT
    } else {
      this.panelA.position.z = this.worldPos.z - this.panelWidth / 2 - openOffset * this.doorT
      this.panelB.position.z = this.worldPos.z + this.panelWidth / 2 + openOffset * this.doorT
    }
  }

  private tryOpen(): void {
    if (this.opened) return
    if (this.variant === 'locked' && !(this.canOpen?.() ?? true)) {
      audioManager.doorOpen(true)
      if (this.interactable) this.interactable.promptText = this.currentPromptText()
      return
    }
    this.opened = true
    this.doorTarget = 1
    this.collisionHandle.setEnabled(false)
    audioManager.doorOpen(false)
    this.onOpened?.()
    if (this.interactable) this.interactable.promptText = '[E] OPEN DOOR'
  }

  update(dt: number, playerWorldPos?: THREE.Vector3): void {
    if (this.variant === 'automatic' && !this.opened && playerWorldPos) {
      const dist = Math.hypot(playerWorldPos.x - this.worldPos.x, playerWorldPos.z - this.worldPos.z)
      if (dist < PROXIMITY_RANGE) this.tryOpen()
    }

    if (this.variant === 'locked' && !this.opened && this.interactable) {
      const text = this.currentPromptText()
      if (this.interactable.promptText !== text) this.interactable.promptText = text
    }

    if (this.doorT < this.doorTarget) {
      this.doorT = Math.min(this.doorTarget, this.doorT + dt / DOOR_ANIM_SECONDS)
      this.applyDoorTransform()
    }
  }

  isOpen(): boolean {
    return this.opened
  }
}
