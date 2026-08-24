import * as THREE from 'three'
import type { SceneBuilder } from '../engine/SceneManager'
import { buildRoom, addProp, addFlickerLight, addReadable, makeInteractable, nextId, propMat, metalMat } from './RoomBuilder'
import { runRadioEvent, readPage } from './sceneUtils'
import { RADIO_EVENTS } from '../data/dialogue'
import { PAGES } from '../data/pages'
import { Manifestation } from './Manifestation'
import type { ColliderSource } from '../player/Collision'

const DEEP_ENTRY = new THREE.Vector3(0, 0, -21)

export const buildAct3: SceneBuilder = (ctx) => {
  const { game, audio, overlay, goTo, teleportPlayer, isPlayerHidden, isFlashlightOn } = ctx
  const root = new THREE.Group()
  const colliders: ColliderSource[] = []
  const interactables: THREE.Object3D[] = []
  const flickerLights: { update: (c: number) => void }[] = []

  const addRoom = (spec: Parameters<typeof buildRoom>[0]) => {
    const r = buildRoom(spec)
    root.add(r.group)
    colliders.push(...r.colliders)
    return r
  }

  // ---- Entry landing (spawn) ----
  addRoom({ x: 0, z: 0, width: 4, depth: 4, floorColor: 0x131110, north: [{ center: 0, width: 1.3 }] })
  flickerLights.push(addFlickerLight(root, 0, 2.2, 0.5, 0xd9c79a, 0.8, 6))

  // ---- Corridor 1 ----
  addRoom({ x: 0, z: -5, width: 3, depth: 6, floorColor: 0x121010, south: [{ center: 0, width: 1.3 }], north: [{ center: 0, width: 1.3 }] })

  // ---- Junction ----
  addRoom({
    x: 0,
    z: -10,
    width: 4,
    depth: 4,
    floorColor: 0x121010,
    south: [{ center: 0, width: 1.3 }],
    west: [{ center: 0, width: 1.3 }],
    north: [{ center: 0, width: 1.3 }],
  })

  // ---- Cobb's room, west of the junction ----
  addRoom({ x: -5, z: -10, width: 5, depth: 5, floorColor: 0x14100e, east: [{ center: 0, width: 1.3 }] })
  flickerLights.push(addFlickerLight(root, -5, 2.2, -10, 0xe8a25c, 0.7, 6))

  const body = addProp(root, 0.5, 0.35, 1.7, -6, 0.18, -9, propMat(0x1c1a1f))
  body.rotation.y = 0.3
  const handset = addProp(root, 0.2, 0.1, 0.35, -6.4, 0.9, -11.4, metalMat(0x2c2c30))

  makeInteractable(handset, {
    id: nextId('cobb-handset'),
    range: 2,
    prompt: () => (game.hasSeen('act3_cobb_handset') ? 'Still humming, faintly' : "Cobb's handset — still live"),
    enabled: () => !game.hasSeen('act3_cobb_handset'),
    onInteract: () => {
      void runRadioEvent(ctx, RADIO_EVENTS.act3_cobb_handset, 'act3_cobb_handset')
    },
  })
  interactables.push(handset)

  const cobbLog = addReadable(root, {
    x: -6.6,
    y: 0.95,
    z: -8.6,
    yaw: Math.PI * 0.15,
    width: 0.42,
    height: 0.32,
    label: "Read Cobb's logbook",
    page: PAGES.cobb_final_log,
    onRead: (page) => {
      readPage(ctx, page)
      game.setFlag('cobb_log_found')
    },
  })
  interactables.push(cobbLog)

  const cobbDrawerPage = addReadable(root, {
    x: -3.4,
    y: 0.75,
    z: -12.3,
    yaw: -Math.PI / 2,
    width: 0.3,
    height: 0.4,
    label: 'A drawer, slightly open',
    page: PAGES.page_cobb_drawer,
    onRead: (page) => readPage(ctx, page),
  })
  interactables.push(cobbDrawerPage)

  // ---- Corridor 2 — walks like it should dead-end. It doesn't. ----
  addRoom({ x: 0, z: -14, width: 3, depth: 4, floorColor: 0x0e0d0d, south: [{ center: 0, width: 1.3 }] })
  addProp(root, 0.5, 0.18, 0.5, 0, 2.5, -14, metalMat(0x141416)) // another dead fixture

  let twisted = false

  // ---- Deep room (reached only via the corridor-2 twist) ----
  const deep = addRoom({ x: 0, z: -24, width: 8, depth: 8, floorColor: 0x0c0b0b })
  flickerLights.push(addFlickerLight(root, -2.5, 2.2, -24, 0xb7a998, 0.55, 7))
  flickerLights.push(addFlickerLight(root, 2.5, 2.2, -22, 0xb7a998, 0.45, 6))
  void deep

  const lockerA = addProp(root, 0.7, 2.0, 0.6, -3.2, 1.0, -20.8, metalMat(0x25272c), colliders)
  const lockerB = addProp(root, 0.7, 2.0, 0.6, 2.9, 1.0, -26.6, metalMat(0x25272c), colliders)
  const hideExit = new THREE.Vector3(0, 0, -22)

  for (const locker of [lockerA, lockerB]) {
    let hiding = false
    makeInteractable(locker, {
      id: nextId('locker'),
      range: 1.6,
      prompt: () => (hiding ? 'Come out' : 'Hide'),
      onInteract: () => {
        hiding = !hiding
        ctx.setHidden(hiding)
        overlay.setVignette(hiding ? 0.9 : 0)
      },
    })
    interactables.push(locker)
  }

  const basementLoopPage = addReadable(root, {
    x: -3.5,
    y: 0.9,
    z: -27,
    yaw: Math.PI / 2,
    width: 0.32,
    height: 0.42,
    label: 'Behind a loose panel',
    page: PAGES.page_basement_loop,
    onRead: (page) => readPage(ctx, page),
  })
  interactables.push(basementLoopPage)

  const exitDoorProp = addProp(root, 1.2, 2.1, 0.2, 0, 1.05, -27.9, propMat(0x2c261a))
  makeInteractable(exitDoorProp, {
    id: nextId('basement-exit'),
    range: 2.4,
    prompt: () => (game.hasSeen('act3_confrontation') ? 'Climb back up to the station' : 'Sealed. Something has to give first.'),
    enabled: () => game.hasSeen('act3_confrontation'),
    onInteract: () => {
      void (async () => {
        await overlay.fadeToBlack()
        goTo('act4')
      })()
    },
  })
  interactables.push(exitDoorProp)

  const manifestation = new Manifestation(
    [new THREE.Vector3(-2.5, 0, -21.5), new THREE.Vector3(2.5, 0, -21.5), new THREE.Vector3(2.5, 0, -26.5), new THREE.Vector3(-2.5, 0, -26.5)],
    new THREE.Vector3(-2.5, 0, -21.5),
  )
  root.add(manifestation.mesh)

  let confrontationFired = false

  const update = (dt: number, _elapsed: number, playerPos: THREE.Vector3) => {
    for (const fl of flickerLights) fl.update(1 - game.state.staticMeter / 100)
    audio.update(dt)
    audio.setDread((1 - game.state.staticMeter / 100) * 0.55)

    if (!twisted && game.hasFlag('cobb_log_found') && playerPos.z < -15.2) {
      twisted = true
      overlay.showThought('This should be a dead end. It is not, anymore.', 4500)
      teleportPlayer(DEEP_ENTRY, Math.PI)
      return
    }

    if (playerPos.z < -16 && !ctx.radioUI.active) {
      const result = manifestation.update(dt, playerPos, isPlayerHidden(), isFlashlightOn())
      overlay.setVignette(isPlayerHidden() ? 0.9 : result.alert01 * 0.55)
      if (result.caught) {
        audio.playStaticBurst(0.8, 0.6)
        game.setStatic(-12)
        overlay.showThought('It had you for a second. Only a second.', 3200)
        teleportPlayer(hideExit, 0)
        manifestation.resetTo(new THREE.Vector3(-2.5, 0, -21.5))
      }
      if (!confrontationFired && !game.hasSeen('act3_confrontation') && result.alert01 > 0.55) {
        confrontationFired = true
        void runRadioEvent(ctx, RADIO_EVENTS.act3_confrontation, 'act3_confrontation')
      }
    }
  }

  return {
    root,
    colliders,
    interactables,
    spawn: { position: new THREE.Vector3(0, 0, 1), yaw: 0 },
    ambient: 0.02,
    fogColor: 0x050505,
    fogNear: 2,
    fogFar: 14,
    backgroundColor: 0x020202,
    update,
  }
}
