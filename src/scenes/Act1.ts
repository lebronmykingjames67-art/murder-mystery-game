import * as THREE from 'three'
import type { SceneBuilder } from '../engine/SceneManager'
import { buildStationInterior } from './StationInterior'
import { buildDoor, addProp, addReadable, makeInteractable, nextId, propMat, emissiveMat, floorMat } from './RoomBuilder'
import { runRadioEvent, readPage } from './sceneUtils'
import { RADIO_EVENTS } from '../data/dialogue'
import { PAGES } from '../data/pages'
import type { ColliderSource } from '../player/Collision'

export const buildAct1: SceneBuilder = (ctx) => {
  const { game, audio, overlay, goTo } = ctx
  const root = new THREE.Group()
  const colliders: ColliderSource[] = []
  const interactables: THREE.Object3D[] = []

  // ---- exterior dock ----
  const dockGround = new THREE.Mesh(new THREE.PlaneGeometry(26, 24), floorMat(0x14181c))
  dockGround.rotation.x = -Math.PI / 2
  dockGround.position.set(0, 0, 15)
  root.add(dockGround)

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 24),
    new THREE.MeshStandardMaterial({ color: 0x060a10, roughness: 0.3, metalness: 0.15 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(0, -0.03, 30)
  root.add(water)

  const boat = new THREE.Group()
  addProp(boat, 1.6, 0.5, 3.2, 0, 0.25, 0, propMat(0x1c1f22))
  addProp(boat, 1.2, 0.35, 0.15, 0, 0.55, -1.35, propMat(0x14171a))
  boat.position.set(2.8, 0, 21)
  boat.rotation.y = 0.15
  root.add(boat)

  const towerFar = new THREE.Group()
  addProp(towerFar, 0.3, 8.5, 0.3, 0, 4.25, 0, propMat(0x0c0c0e))
  const beacon = addProp(towerFar, 0.22, 0.22, 0.22, 0, 8.7, 0, emissiveMat(0xe8a25c, 1.6))
  towerFar.position.set(-9, 0, 9)
  root.add(towerFar)

  const stationDoor = buildDoor({
    position: new THREE.Vector3(-0.525, 0, 3),
    isLocked: () => false,
    openLabel: 'Open the station door',
  })
  root.add(stationDoor.group)
  interactables.push(stationDoor.group)
  colliders.push(stationDoor.collider)

  const bottle = addReadable(root, {
    x: 3.4,
    y: 0.4,
    z: 19,
    width: 0.35,
    height: 0.45,
    label: 'A sealed tin, half-buried',
    page: PAGES.page_dock_bottle,
    onRead: (page) => readPage(ctx, page),
  })
  interactables.push(bottle)

  // ---- station interior ----
  const station = buildStationInterior({
    exteriorOpen: true,
    archiveOpen: false,
    basementOpen: false,
    towerOpen: false,
    radioLocked: () => !game.hasFlag('power_restored'),
    onRadioLockedTry: () => overlay.showThought('Locked. Needs power — check the hallway.'),
    onReadPage: (page) => readPage(ctx, page),
  })
  root.add(station.group)
  colliders.push(...station.colliders)
  interactables.push(...station.interactables)

  makeInteractable(station.fuseBox, {
    id: nextId('fusebox'),
    range: 2,
    prompt: () => (game.hasFlag('power_restored') ? 'Power restored' : 'Flip the breaker'),
    enabled: () => !game.hasFlag('power_restored'),
    onInteract: () => {
      game.setFlag('power_restored')
      audio.playStaticBurst(0.35, 0.5)
      overlay.showThought('Lights stutter on somewhere down the hall.')
    },
  })
  interactables.push(station.fuseBox)

  const fusePage = addReadable(station.group, {
    x: -5.9,
    y: 1.1,
    z: -5.85,
    yaw: Math.PI,
    width: 0.34,
    height: 0.44,
    label: 'A note taped inside the panel',
    page: PAGES.page_fusebox,
    onRead: (page) => readPage(ctx, page),
  })
  interactables.push(fusePage)

  makeInteractable(station.keyProp, {
    id: nextId('key'),
    range: 2,
    prompt: 'Take the tuning key',
    enabled: () => !game.hasFlag('has_tuning_key'),
    onInteract: () => {
      game.setFlag('has_tuning_key')
      station.keyProp.visible = false
      overlay.showThought('A small brass tuning key. Cold. You pocket it.')
    },
  })
  interactables.push(station.keyProp)

  makeInteractable(station.radioConsole, {
    id: nextId('radio'),
    range: 2.2,
    prompt: 'Pick up the handset',
    enabled: () => !game.hasSeen('act1_contact'),
    onInteract: () => {
      void (async () => {
        await runRadioEvent(ctx, RADIO_EVENTS.act1_contact, 'act1_contact')
        await overlay.fadeToBlack()
        goTo('act2')
      })()
    },
  })
  interactables.push(station.radioConsole)

  let lingerTimer = 0
  let teased = false

  const update = (dt: number, _elapsed: number, playerPos: THREE.Vector3) => {
    for (const fl of station.flickerLights) fl.update(1 - game.state.staticMeter / 100)
    audio.update(dt)
    audio.setDread((1 - game.state.staticMeter / 100) * 0.55)

    if (!teased && !ctx.radioUI.active && playerPos.z > 9 && playerPos.z < 19) {
      lingerTimer += dt
      if (lingerTimer > 8) {
        teased = true
        overlay.showThought("She's not supposed to know your name yet.", 5000)
      }
    } else if (playerPos.z <= 9) {
      lingerTimer = 0
    }

    const t = performance.now() * 0.002
    ;(beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4 + Math.sin(t) * 0.7
  }

  return {
    root,
    colliders,
    interactables,
    spawn: { position: new THREE.Vector3(1, 0, 20), yaw: 0 },
    ambient: 0.035,
    fogColor: 0x0a0c10,
    fogNear: 3,
    fogFar: 24,
    backgroundColor: 0x05060a,
    update,
  }
}
