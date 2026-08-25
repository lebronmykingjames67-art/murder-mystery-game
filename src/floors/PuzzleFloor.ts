import * as THREE from 'three'
import type { FloorCell, RoomPurpose } from '../types'
import { DIR_VECTOR } from '../types'
import type { DressContext, FloorContext, FloorType } from './FloorType'
import type { GenerationRequest } from '../world/FloorGenerator'
import type { DifficultyConfig } from '../types'
import { CELL_SIZE } from '../core/constants'
import { boxMesh } from '../world/Geometries'
import { metalMaterial, emissivePanel } from '../world/Materials'
import { makeTextSign } from '../world/Signage'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { Rng } from '../utils/rng'

type SwitchId = 'a' | 'b' | 'c' | 'd'

const SWITCH_COLOR: Record<SwitchId, string> = {
  a: '#e05a5a',
  b: '#5ac8e0',
  c: '#e0c85a',
  d: '#8fe05a',
}
const SWITCH_NAME: Record<SwitchId, string> = { a: 'RED', b: 'CYAN', c: 'AMBER', d: 'GREEN' }
const SWITCH_PURPOSE: Record<SwitchId, RoomPurpose> = {
  a: 'switch-a',
  b: 'switch-b',
  c: 'switch-c',
  d: 'switch-d',
}

interface SwitchRig {
  light: THREE.Mesh
}

/**
 * PUZZLE = THINKING. Three (or four, on harder floors) physical panels scattered through the
 * floor must be activated in the correct order — a note elsewhere states the order as a color
 * sequence. Activating out of order buzzes and resets progress; nothing about the puzzle lives
 * in a menu, it's all switches and a note bolted to the world.
 */
export class PuzzleFloor implements FloorType {
  kind = 'puzzle' as const
  mood = 'puzzle' as const

  private order: SwitchId[] = []
  private nextIndex = 0
  private switches = new Map<SwitchId, SwitchRig>()
  private switchCount = 3
  private rng = new Rng(Date.now() & 0xffffffff)
  private pendingComplete: (() => void) | null = null

  buildRequest(floorNumber: number, difficulty: DifficultyConfig, seed: number): GenerationRequest {
    this.rng = new Rng(seed ^ 0x1a2b3c)
    this.switchCount = Math.min(4, difficulty.switchCount)
    const ids: SwitchId[] = (['a', 'b', 'c', 'd'] as SwitchId[]).slice(0, this.switchCount)
    this.order = this.rng.shuffle(ids)
    this.nextIndex = 0
    this.switches.clear()

    // Each switch id maps to its own distinct room purpose, so every one is guaranteed a room,
    // plus one more for the clue note.
    const requiredPurposes: RoomPurpose[] = [...ids.map((id) => SWITCH_PURPOSE[id]), 'clue']

    return {
      floorNumber,
      kind: 'puzzle',
      seed,
      mainPathLength: difficulty.mainPathLength,
      branchCount: Math.max(difficulty.branchCount, this.switchCount + 2),
      macroRoomCount: 0,
      requiredPurposes,
      optionalPurposes: ['storage', 'generic'],
    }
  }

  onDressRoom(purpose: RoomPurpose, center: { x: number; z: number }, cell: FloorCell, ctx: DressContext): void {
    if (purpose === 'clue') {
      this.buildClueSign(center, cell, ctx)
      return
    }
    if (purpose !== 'switch-a' && purpose !== 'switch-b' && purpose !== 'switch-c' && purpose !== 'switch-d') return

    // Assign the next not-yet-placed switch id that maps to this purpose slot.
    const id = this.order.find((candidate) => SWITCH_PURPOSE[candidate] === purpose && !this.switches.has(candidate))
    if (!id) return
    this.buildSwitchPanel(id, center, cell, ctx)
  }

  // Mirrors FloorBuilder's wayfinding-sign placement exactly (back wall, opposite the entry
  // doorway) so switch panels and clue notes land in the same, already-proven spot signs do.
  private wallSpot(center: { x: number; z: number }, cell: FloorCell): { x: number; z: number; yaw: number } {
    const entryDir = Array.from(cell.connections)[0]
    const facing = entryDir ? DIR_VECTOR[entryDir] : { dx: 0, dz: -1 }
    return {
      x: center.x - facing.dx * (CELL_SIZE / 2 - 0.15),
      z: center.z - facing.dz * (CELL_SIZE / 2 - 0.15),
      yaw: Math.atan2(facing.dx, facing.dz),
    }
  }

  private buildSwitchPanel(id: SwitchId, center: { x: number; z: number }, cell: FloorCell, ctx: DressContext): void {
    const spot = this.wallSpot(center, cell)
    const group = new THREE.Group()
    group.position.set(spot.x, 0, spot.z)
    group.rotation.y = spot.yaw

    const housing = boxMesh(metalMaterial, 0.6, 0.8, 0.12)
    housing.position.set(0, 1.3, 0.06)
    group.add(housing)

    const light = boxMesh(emissivePanel('#3a2a2a', 0.4), 0.36, 0.36, 0.05)
    light.position.set(0, 1.3, 0.13)
    group.add(light)

    const label = makeTextSign(`PANEL ${id.toUpperCase()}`, { subtext: SWITCH_NAME[id], width: 0.7, height: 0.3, fontSize: 40, accent: SWITCH_COLOR[id] })
    label.mesh.position.set(0, 1.85, 0.07)
    group.add(label.mesh)

    ctx.gameApp.worldRoot.add(group)
    this.switches.set(id, { light })

    ctx.gameApp.interaction.register({
      id: `switch-${id}`,
      kind: 'switch',
      object: group,
      promptText: `[E] ACTIVATE PANEL ${id.toUpperCase()}`,
      range: 2.4,
      enabled: true,
      onInteract: () => this.activate(id),
    })
  }

  private buildClueSign(center: { x: number; z: number }, cell: FloorCell, ctx: DressContext): void {
    const spot = this.wallSpot(center, cell)
    const sequence = this.order.map((id) => SWITCH_NAME[id]).join(' → ')
    const sign = makeTextSign(sequence, { subtext: 'ACTIVATION ORDER', width: 1.5, height: 0.55, fontSize: 34, accent: '#8ff0e0' })
    ctx.gameApp.trackDisposable(sign.texture)
    sign.mesh.position.set(spot.x, 1.6, spot.z)
    sign.mesh.rotation.y = spot.yaw
    ctx.gameApp.worldRoot.add(sign.mesh)
  }

  private setSwitchLit(id: SwitchId, lit: boolean): void {
    const rig = this.switches.get(id)
    if (!rig) return
    rig.light.material = lit ? emissivePanel(SWITCH_COLOR[id], 2.2) : emissivePanel('#3a2a2a', 0.4)
  }

  private activate(id: SwitchId): void {
    const expected = this.order[this.nextIndex]
    if (id === expected) {
      this.setSwitchLit(id, true)
      this.nextIndex++
      audioManager.switchOn()
      if (this.nextIndex >= this.order.length) {
        this.pendingComplete?.()
        useGameStore.getState().pushToast('Sequence complete. Elevator unlocked.', 'success')
      } else {
        useGameStore.getState().pushToast(`${SWITCH_NAME[id]} engaged.`, 'info')
      }
    } else if (!this.isAlreadyActivated(id)) {
      audioManager.switchWrong()
      useGameStore.getState().pushToast('Wrong order — panels reset.', 'warning')
      this.order.forEach((candidate) => this.setSwitchLit(candidate, false))
      this.nextIndex = 0
    }
  }

  private isAlreadyActivated(id: SwitchId): boolean {
    return this.order.indexOf(id) < this.nextIndex
  }

  onStart(ctx: FloorContext): void {
    this.pendingComplete = ctx.completeObjective
    ctx.setObjectiveText(`ACTIVATE ${this.switchCount} PANELS IN ORDER`)
    useGameStore.getState().pushToast('Find the note. Activate the panels in order.', 'info')
    audioManager.setMusicIntensity('calm')
  }

  onUpdate(): void {
    // Puzzle floors have no per-frame simulation beyond the interactables already wired up.
  }
}
