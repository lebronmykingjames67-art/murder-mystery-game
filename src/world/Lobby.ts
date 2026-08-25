import * as THREE from 'three'
import type { GameApp } from '../engine/GameApp'
import type { SceneHandle, Interactable } from '../types'
import { WALL_THICKNESS } from '../core/constants'
import { buildWall, buildFloorAndCeiling } from './WallBuilder'
import { Elevator } from './Elevator'
import { LightingRig } from './LightingRig'
import { makeTextSign } from './Signage'
import { boxMesh } from './Geometries'
import { metalMaterial, trimMaterial } from './Materials'
import * as Props from './Props'
import { useGameStore } from '../state/store'
import { audioManager } from '../core/AudioManager'

const MOOD = 'lobby' as const

function kiosk(root: THREE.Group, x: number, z: number, yaw: number, title: string, subtitle: string, onUse: () => void): Interactable {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = yaw

  const podium = boxMesh(metalMaterial, 0.7, 1.05, 0.5)
  podium.position.set(0, 0.525, 0)
  group.add(podium)
  const screen = boxMesh(trimMaterial(MOOD), 0.55, 0.35, 0.05)
  screen.position.set(0, 1.15, 0.2)
  screen.rotation.x = -0.5
  group.add(screen)

  const sign = makeTextSign(title, { subtext: subtitle, width: 0.9, height: 0.42 })
  sign.mesh.position.set(0, 1.75, 0)
  group.add(sign.mesh)

  root.add(group)

  return {
    id: `kiosk-${title}`,
    kind: 'station',
    object: group,
    promptText: `[E] ${title}`,
    range: 2.8,
    enabled: true,
    onInteract: () => {
      audioManager.uiClick()
      onUse()
    },
  }
}

export function buildLobby(gameApp: GameApp, onStartRun: () => void): SceneHandle {
  const { worldRoot, collision, interaction } = gameApp
  const lighting = new LightingRig(worldRoot, gameApp.scene, MOOD)

  // Main hall.
  buildFloorAndCeiling(worldRoot, MOOD, -10, 10, -5, 8.4)
  // South (entry) wall, full width.
  buildWall(worldRoot, collision, MOOD, 0, -5, 14, WALL_THICKNESS)
  // North wall, gapped for the elevator doorway (2.8 wide, centered on X=0).
  buildWall(worldRoot, collision, MOOD, -4.2, 5, 5.6, WALL_THICKNESS)
  buildWall(worldRoot, collision, MOOD, 4.2, 5, 5.6, WALL_THICKNESS)
  // West wall, gapped for the upgrade alcove.
  buildWall(worldRoot, collision, MOOD, -7, -4, WALL_THICKNESS, 2)
  buildWall(worldRoot, collision, MOOD, -7, 4, WALL_THICKNESS, 2)
  // East wall, gapped for the cosmetic alcove.
  buildWall(worldRoot, collision, MOOD, 7, -4, WALL_THICKNESS, 2)
  buildWall(worldRoot, collision, MOOD, 7, 4, WALL_THICKNESS, 2)

  // Upgrade alcove (west).
  buildWall(worldRoot, collision, MOOD, -10, 0, WALL_THICKNESS, 6)
  buildWall(worldRoot, collision, MOOD, -8.5, 3, 3, WALL_THICKNESS)
  buildWall(worldRoot, collision, MOOD, -8.5, -3, 3, WALL_THICKNESS)

  // Cosmetic alcove (east).
  buildWall(worldRoot, collision, MOOD, 10, 0, WALL_THICKNESS, 6)
  buildWall(worldRoot, collision, MOOD, 8.5, 3, 3, WALL_THICKNESS)
  buildWall(worldRoot, collision, MOOD, 8.5, -3, 3, WALL_THICKNESS)

  // Lighting fixtures.
  lighting.addFixture(new THREE.Vector3(0, 3.2, 0))
  lighting.addFixture(new THREE.Vector3(-8.5, 3.2, 0))
  lighting.addFixture(new THREE.Vector3(8.5, 3.2, 0))
  lighting.addFixture(new THREE.Vector3(0, 3.2, -3.5))
  lighting.addFixture(new THREE.Vector3(0, 3.2, 4))

  // Title sign over the entrance, facing into the hall.
  const titleSign = makeTextSign('ONE MORE FLOOR', { subtext: 'RISK IT ALL. FLOOR BY FLOOR.', width: 3.2, height: 1.1, fontSize: 60 })
  titleSign.mesh.position.set(0, 2.6, -4.95)
  titleSign.mesh.rotation.y = Math.PI
  worldRoot.add(titleSign.mesh)

  // Elevator, recessed into the north wall, doors open and inviting.
  const elevator = new Elevator({
    position: new THREE.Vector3(0, 0, 6.1),
    facing: 'N',
    mood: MOOD,
    floorNumber: 0,
    startLocked: false,
    collision,
    onEntered: onStartRun,
    onClosingStart: () => {
      gameApp.player.inputLocked = true
    },
    trackDisposable: (r) => gameApp.trackDisposable(r),
  })
  worldRoot.add(elevator.group)
  interaction.register(elevator.interactable)

  const startSign = makeTextSign('START RUN', { subtext: 'WALK IN TO BEGIN', width: 1.1, height: 0.4, fontSize: 48 })
  startSign.mesh.position.set(0, 2.4, 4.85)
  worldRoot.add(startSign.mesh)

  // Stations.
  const upgradeKiosk = kiosk(worldRoot, -8.5, 0.4, 0, 'UPGRADES', 'SPEND BANK MONEY', () => useGameStore.getState().openModal('upgrades'))
  interaction.register(upgradeKiosk)
  const cosmeticKiosk = kiosk(worldRoot, 8.5, 0.4, Math.PI, 'COSMETICS', 'LOOK THE PART', () => useGameStore.getState().openModal('cosmetics'))
  interaction.register(cosmeticKiosk)
  const statsKiosk = kiosk(worldRoot, 5.2, -3.8, Math.PI * 0.78, 'RUN STATS', 'YOUR RECORD', () => useGameStore.getState().openModal('stats'))
  interaction.register(statsKiosk)

  // Environmental detail.
  const shelfW = Props.shelfUnit(2.4, 1.9, 0.4)
  shelfW.position.set(-9.7, 0, -1.6)
  shelfW.rotation.y = Math.PI / 2
  worldRoot.add(shelfW)

  const crates = Props.crateStack()
  crates.position.set(-9.4, 0, 1.8)
  worldRoot.add(crates)

  const ext = Props.fireExtinguisher()
  ext.position.set(-6.85, 0, -4.6)
  worldRoot.add(ext)

  const elecBox = Props.electricalBox()
  elecBox.position.set(6.85, 0, -4.6)
  elecBox.rotation.y = -Math.PI / 2
  worldRoot.add(elecBox)

  const pipe = Props.wallPipe(6, false)
  pipe.position.set(-6.9, 3.0, 0)
  worldRoot.add(pipe)

  return {
    spawnX: 0,
    spawnZ: -3.5,
    spawnYaw: Math.PI,
    update: (dt, playerPos) => {
      elevator.update(dt, playerPos)
      lighting.update(dt)
    },
  }
}
