import * as THREE from 'three'
import {
  buildRoom,
  buildDoor,
  addProp,
  addFlickerLight,
  addReadable,
  propMat,
  metalMat,
  paperTexture,
  type DoorHandle,
} from './RoomBuilder'
import type { ColliderSource } from '../player/Collision'
import type { PageDef } from '../types'
import { PAGES } from '../data/pages'

/**
 * The station's interior floor plan is identical across Acts 1-4 (same building, same night) —
 * only which doors are unlocked/open changes. Coordinates here are load-bearing: keep them in
 * sync with anything that reasons about world position (spawns, the manifestation, etc).
 */
export interface StationOptions {
  exteriorOpen: boolean
  archiveOpen: boolean
  basementOpen: boolean
  towerOpen: boolean
  radioLocked: () => boolean
  basementLocked?: () => boolean
  onRadioLockedTry?: () => void
  onRadioOpen?: () => void
  onBasementLockedTry?: () => void
  onBasementOpen?: () => void
  onReadPage: (page: PageDef) => void
  corruptedProps?: boolean
}

export interface StationResult {
  group: THREE.Group
  colliders: ColliderSource[]
  interactables: THREE.Object3D[]
  radioConsole: THREE.Mesh
  radioDoor: DoorHandle
  basementDoor?: DoorHandle
  keyProp: THREE.Mesh
  fuseBox: THREE.Mesh
  archiveDesk?: THREE.Mesh
  flickerLights: { update: (corruption: number) => void }[]
}

export function buildStationInterior(opts: StationOptions): StationResult {
  const group = new THREE.Group()
  const colliders: ColliderSource[] = []
  const interactables: THREE.Object3D[] = []
  const flickerLights: { update: (corruption: number) => void }[] = []

  // ---- FOYER (0,0,0) 7x6 ----
  const foyer = buildRoom({
    x: 0,
    z: 0,
    width: 7,
    depth: 6,
    wallColor: opts.corruptedProps ? 0x241f22 : undefined,
    south: opts.exteriorOpen ? [{ center: 0, width: 1.4 }] : [],
    north: [{ center: -1.5, width: 1.3 }],
    east: opts.archiveOpen ? [{ center: 0, width: 1.3 }] : [],
    west: opts.basementOpen ? [{ center: 0, width: 1.3 }] : [],
  })
  group.add(foyer.group)
  colliders.push(...foyer.colliders)
  flickerLights.push(addFlickerLight(group, 0, 2.3, 0.5, 0xffd9a0, 1.05, 7.5))

  const corkboard = addReadable(group, {
    x: -3.39,
    y: 1.6,
    z: -1.6,
    yaw: Math.PI / 2,
    width: 1.5,
    height: 1.05,
    label: 'Read the corkboard',
    page: PAGES.rule_corkboard,
    onRead: opts.onReadPage,
  })
  interactables.push(corkboard)

  // ---- HALLWAY (-1.5,0,-6) 3x6 — deliberately unlit; the flashlight owns this space ----
  const hallway = buildRoom({ x: -1.5, z: -6, width: 3, depth: 6, south: [{ center: 0, width: 1.3 }], north: [{ center: 0, width: 1.3 }], west: [{ center: 0, width: 1.4 }] })
  group.add(hallway.group)
  colliders.push(...hallway.colliders)
  addProp(group, 0.55, 0.18, 0.55, -1.5, 2.5, -6, metalMat(0x18181a)) // dead ceiling fixture, unlit

  // ---- FUSE ALCOVE (-4.5,0,-6) 3x3 ----
  const alcove = buildRoom({ x: -4.5, z: -6, width: 3, depth: 3, east: [{ center: 0, width: 1.4 }] })
  group.add(alcove.group)
  colliders.push(...alcove.colliders)

  const fuseBox = addProp(group, 0.5, 0.72, 0.14, -5.9, 1.35, -6, metalMat(0x3a3d42), colliders)
  const keyProp = addProp(group, 0.16, 0.03, 0.24, -5.55, 1.05, -5.15, metalMat(0xb08a3e))

  // ---- RADIO ROOM (-1.5,0,-11.5) 5x5 ----
  const radioRoom = buildRoom({
    x: -1.5,
    z: -11.5,
    width: 5,
    depth: 5,
    south: [{ center: 0, width: 1.3 }],
    west: opts.towerOpen ? [{ center: 0, width: 1.3 }] : [],
  })
  group.add(radioRoom.group)
  colliders.push(...radioRoom.colliders)
  flickerLights.push(addFlickerLight(group, -1.5, 2.2, -12.7, 0xe8a25c, 0.95, 6.5))

  const radioConsole = addProp(group, 1.5, 1.0, 0.7, -1.5, 0.5, -13.3, propMat(0x2a241c), colliders)
  addProp(group, 1.5, 0.06, 0.7, -1.5, 1.03, -13.3, metalMat(0x333338))
  addProp(group, 0.3, 0.3, 0.06, -1.5, 1.15, -12.94, metalMat(0xcf9a52))

  const radioDoor = buildDoor({
    position: new THREE.Vector3(-2.15, 0, -9),
    isLocked: opts.radioLocked,
    lockedMessage: 'Locked. Needs power.',
    onLockedTry: opts.onRadioLockedTry,
    onOpen: opts.onRadioOpen,
  })
  group.add(radioDoor.group)
  interactables.push(radioDoor.group)
  colliders.push(radioDoor.collider)

  // ---- BASEMENT LANDING (-5.5,0,0) 4x5, optional ----
  let basementDoor: DoorHandle | undefined
  if (opts.basementOpen) {
    const landing = buildRoom({ x: -5.5, z: 0, width: 4, depth: 5, east: [{ center: 0, width: 1.3 }] })
    group.add(landing.group)
    colliders.push(...landing.colliders)
    addProp(group, 1.8, 0.12, 3.4, -6.6, 0.06, 0, propMat(0x161412), colliders)
    basementDoor = buildDoor({
      position: new THREE.Vector3(-3.85, 0, -0.65),
      isLocked: opts.basementLocked ?? (() => true),
      lockedMessage: 'Locked.',
      onLockedTry: opts.onBasementLockedTry,
      onOpen: opts.onBasementOpen,
    })
    group.add(basementDoor.group)
    interactables.push(basementDoor.group)
    colliders.push(basementDoor.collider)
  }

  // ---- ARCHIVE (5.5,0,0) 4x5, optional ----
  let archiveDesk: THREE.Mesh | undefined
  if (opts.archiveOpen) {
    const archive = buildRoom({ x: 5.5, z: 0, width: 4, depth: 5, west: [{ center: 0, width: 1.3 }] })
    group.add(archive.group)
    colliders.push(...archive.colliders)
    flickerLights.push(addFlickerLight(group, 5.5, 2.2, 0, 0xdcd0a8, 0.85, 6))
    archiveDesk = addProp(group, 2.4, 0.9, 0.6, 5.9, 0.45, 1.7, propMat(0x2a2620), colliders)
    addProp(group, 1.6, 1.8, 0.4, 6.9, 0.9, -1.4, propMat(0x201d18), colliders)
    const reelShelf = addProp(group, 0.9, 1.4, 0.35, 4.4, 0.7, -1.7, propMat(0x1e1c19), colliders)
    reelShelf.material = new THREE.MeshStandardMaterial({
      map: paperTexture(['REEL 04', 'REEL 07', 'REEL 11'], { title: 'ARCHIVE' }),
      roughness: 0.9,
    })
  }

  interactables.push(fuseBox, keyProp)

  return {
    group,
    colliders,
    interactables,
    radioConsole,
    radioDoor,
    basementDoor,
    keyProp,
    fuseBox,
    archiveDesk,
    flickerLights,
  }
}
