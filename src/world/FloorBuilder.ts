import * as THREE from 'three'
import type { Direction, FloorCell, FloorLayout, RoomPurpose, SceneHandle } from '../types'
import { DIR_VECTOR } from '../types'
import { CELL_SIZE, DOOR_WIDTH, HALLWAY_WIDTH, WALL_THICKNESS } from '../core/constants'
import type { GameApp } from '../engine/GameApp'
import { buildWall, buildFloorAndCeiling } from './WallBuilder'
import { cellWorldCenter } from './FloorGenerator'
import { Door } from './Door'
import { Elevator, CAB_WIDTH } from './Elevator'
import { LightingRig } from './LightingRig'
import { makeTextSign } from './Signage'
import * as Props from './Props'
import type { FloorMood } from './Materials'
import { Rng } from '../utils/rng'

const ELEVATOR_GAP = CAB_WIDTH + 0.2

const PURPOSE_LABEL: Partial<Record<RoomPurpose, string>> = {
  storage: 'STORAGE',
  office: 'OFFICE B12',
  utility: 'UTILITY',
  key: 'MAINTENANCE',
  'loot-safe': 'STORAGE',
  'loot-risky': 'RESTRICTED ACCESS',
  'switch-a': 'PANEL A',
  'switch-b': 'PANEL B',
  'switch-c': 'PANEL C',
  'switch-d': 'PANEL D',
  clue: 'RECORDS',
  hazard: 'CAUTION',
  'event-anchor': 'CONTROL ROOM',
  'hiding-spot': 'SUPPLY CLOSET',
  generic: 'ROOM',
}

export interface BuiltFloor {
  handle: SceneHandle
  elevator: Elevator
  lighting: LightingRig
  spawnYaw: number
}

export interface FloorBuilderOptions {
  mood: FloorMood
  onElevatorEntered: () => void
  /** Called once per special room so the active FloorType can drop in real content/enemies. */
  onDressRoom?: (purpose: RoomPurpose, center: { x: number; z: number }, cell: FloorCell) => void
}

function boundaryKey(dir: Direction, ax: number, az: number, bx: number, bz: number): string {
  if (dir === 'N' || dir === 'S') return `H:${ax}:${Math.min(az, bz)}`
  return `V:${Math.min(ax, bx)}:${az}`
}

export function buildFloor(gameApp: GameApp, layout: FloorLayout, opts: FloorBuilderOptions): BuiltFloor {
  const { worldRoot, collision, interaction } = gameApp
  const mood = opts.mood
  const rng = new Rng(layout.seed ^ 0x2545f491)
  const lighting = new LightingRig(worldRoot, gameApp.scene, mood)

  buildFloorAndCeiling(
    worldRoot,
    mood,
    layout.minX * CELL_SIZE - 0.4,
    (layout.maxX + 1) * CELL_SIZE + 0.4,
    layout.minZ * CELL_SIZE - 0.4,
    (layout.maxZ + 1) * CELL_SIZE + 0.4,
  )

  const doors: Door[] = []
  const builtBoundaries = new Set<string>()
  const cellsArr = Array.from(layout.cells.values())

  for (const cell of cellsArr) {
    const center = cellWorldCenter(cell)
    const dirs: Direction[] = ['N', 'S', 'E', 'W']
    for (const dir of dirs) {
      const { dx, dz } = DIR_VECTOR[dir]
      const nx = cell.x + dx
      const nz = cell.z + dz
      const key = boundaryKey(dir, cell.x, cell.z, nx, nz)
      if (builtBoundaries.has(key)) continue
      builtBoundaries.add(key)

      const neighbor = layout.cells.get(`${nx},${nz}`)
      const half = CELL_SIZE / 2
      const alongX = dir === 'N' || dir === 'S'
      const boundaryX = alongX ? center.x : center.x + dx * half
      const boundaryZ = alongX ? center.z + dz * half : center.z

      const connected = cell.connections.has(dir) && !!neighbor
      const sameMacro = connected && !!cell.macroId && cell.macroId === neighbor!.macroId

      if (sameMacro) continue // fully open interior between macro-room members

      if (!connected) {
        buildWall(worldRoot, collision, mood, boundaryX, boundaryZ, alongX ? CELL_SIZE : WALL_THICKNESS, alongX ? WALL_THICKNESS : CELL_SIZE)
        continue
      }

      const involvesRoom = cell.sizeClass !== 'hallway' || neighbor!.sizeClass !== 'hallway'
      const isElevatorBoundary = cell === layout.elevatorCell || neighbor === layout.elevatorCell
      // The elevator cab (see Elevator.ts) is wider than a normal doorway, so its boundary
      // needs a matching wider gap or the cab's own side walls would clip through the stubs.
      const gap = isElevatorBoundary ? ELEVATOR_GAP : involvesRoom ? DOOR_WIDTH : HALLWAY_WIDTH
      const stubLength = (CELL_SIZE - gap) / 2
      const stubOffset = gap / 2 + stubLength / 2

      if (alongX) {
        buildWall(worldRoot, collision, mood, boundaryX - stubOffset, boundaryZ, stubLength, WALL_THICKNESS)
        buildWall(worldRoot, collision, mood, boundaryX + stubOffset, boundaryZ, stubLength, WALL_THICKNESS)
      } else {
        buildWall(worldRoot, collision, mood, boundaryX, boundaryZ - stubOffset, WALL_THICKNESS, stubLength)
        buildWall(worldRoot, collision, mood, boundaryX, boundaryZ + stubOffset, WALL_THICKNESS, stubLength)
      }

      if (involvesRoom && !isElevatorBoundary) {
        const door = new Door({
          position: new THREE.Vector3(boundaryX, 0, boundaryZ),
          direction: dir,
          passageWidth: gap,
          variant: 'normal',
          collision,
        })
        worldRoot.add(door.group)
        if (door.interactable) interaction.register(door.interactable)
        doors.push(door)
      }
    }
  }

  // Elevator: sits inside the elevator cell, doors facing back along its one connection.
  const elevatorDir = Array.from(layout.elevatorCell.connections)[0] ?? 'S'
  const elevatorCenter = cellWorldCenter(layout.elevatorCell)
  const elevator = new Elevator({
    position: new THREE.Vector3(elevatorCenter.x, 0, elevatorCenter.z),
    facing: elevatorDir,
    mood,
    floorNumber: layout.floorNumber,
    startLocked: true,
    collision,
    onEntered: opts.onElevatorEntered,
    onClosingStart: () => {
      gameApp.player.inputLocked = true
    },
    trackDisposable: (r) => gameApp.trackDisposable(r),
  })
  worldRoot.add(elevator.group)
  interaction.register(elevator.interactable)

  const elevatorSign = makeTextSign('ELEVATOR', { subtext: 'LOCKED', width: 1.0, height: 0.4, fontSize: 46, accent: '#8a2e2e' })
  gameApp.trackDisposable(elevatorSign.texture)
  elevatorSign.mesh.position.set(elevatorCenter.x, 2.6, elevatorCenter.z)
  elevatorSign.mesh.rotation.y = Math.PI
  worldRoot.add(elevatorSign.mesh)

  // Lighting fixtures + dressing + wayfinding signs.
  for (const cell of cellsArr) {
    const center = cellWorldCenter(cell)
    if (cell === layout.elevatorCell) continue
    const flicker = mood === 'darkness' || mood === 'chaos'
    if (cell.sizeClass !== 'hallway' || rng.chance(0.55)) {
      lighting.addFixture(new THREE.Vector3(center.x, 3.1, center.z), { flicker, severity: mood === 'darkness' ? 0.75 : 0.4 })
    }
  }

  for (const room of layout.specialRooms) {
    const label = PURPOSE_LABEL[room.purpose]
    if (label) {
      const sign = makeTextSign(label, { width: 0.85, height: 0.32, fontSize: 42 })
      gameApp.trackDisposable(sign.texture)
      const dir = Array.from(room.cell.connections)[0]
      const facing = dir ? DIR_VECTOR[dir] : { dx: 0, dz: -1 }
      sign.mesh.position.set(room.center.x - facing.dx * (CELL_SIZE / 2 - 0.1), 2.3, room.center.z - facing.dz * (CELL_SIZE / 2 - 0.1))
      sign.mesh.rotation.y = Math.atan2(facing.dx, facing.dz)
      worldRoot.add(sign.mesh)
    }
    dressGenericRoom(worldRoot, room.purpose, room.center, rng)
    opts.onDressRoom?.(room.purpose, room.center, room.cell)
  }

  const spawnCenter = cellWorldCenter(layout.spawnCell)
  const spawnDir = Array.from(layout.spawnCell.connections)[0]
  const spawnFacing = spawnDir ? DIR_VECTOR[spawnDir] : { dx: 0, dz: -1 }
  const spawnYaw = Math.atan2(-spawnFacing.dx, -spawnFacing.dz)

  return {
    elevator,
    lighting,
    spawnYaw,
    handle: {
      spawnX: spawnCenter.x,
      spawnZ: spawnCenter.z,
      spawnYaw,
      update: (dt, playerPos) => {
        elevator.update(dt, playerPos)
        doors.forEach((d) => d.update(dt, playerPos))
        lighting.update(dt)
      },
    },
  }
}

function dressGenericRoom(root: THREE.Group, purpose: RoomPurpose, center: { x: number; z: number }, rng: Rng): void {
  const place = (obj: THREE.Object3D, ox: number, oz: number, yaw = 0) => {
    obj.position.set(center.x + ox, 0, center.z + oz)
    obj.rotation.y = yaw
    root.add(obj)
  }
  switch (purpose) {
    case 'storage':
      place(Props.shelfUnit(2, 2, 0.5), -2.6, -2.6, rng.range(0, Math.PI * 2))
      place(Props.crateStack(), 1.8, 2, 0)
      place(Props.crate(0.55), 2.6, -2.2, 0.4)
      break
    case 'office':
      place(Props.desk(), 0, -2.4, Math.PI)
      place(Props.chair(), 0, -1.6, 0)
      place(Props.shelfUnit(1.6, 1.8, 0.4), -3, 2.6, Math.PI / 2)
      break
    case 'utility':
      place(Props.electricalBox(), -3.2, 0, Math.PI / 2)
      place(Props.wallPipe(3, false), 0, -3.3, 0)
      place(Props.fireExtinguisher(), 3.2, -3.2, -Math.PI / 2)
      break
    case 'generic':
      if (rng.chance(0.5)) place(Props.crate(0.6), rng.range(-2, 2), rng.range(-2, 2), rng.range(0, Math.PI * 2))
      break
    default:
      break
  }
}
