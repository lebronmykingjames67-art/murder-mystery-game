import * as THREE from 'three'
import type { SceneBuilder } from '../engine/SceneManager'
import { buildStationInterior } from './StationInterior'
import { addProp, addReadable, makeInteractable, nextId, propMat, metalMat, emissiveMat, floorMat } from './RoomBuilder'
import { runRadioEvent, readPage } from './sceneUtils'
import { RADIO_EVENTS } from '../data/dialogue'
import { PAGES } from '../data/pages'
import type { ColliderSource } from '../player/Collision'

export const buildAct2: SceneBuilder = (ctx) => {
  const { game, audio, overlay, goTo } = ctx
  const root = new THREE.Group()
  const colliders: ColliderSource[] = []
  const interactables: THREE.Object3D[] = []

  const station = buildStationInterior({
    exteriorOpen: false,
    archiveOpen: true,
    basementOpen: false,
    towerOpen: true,
    radioLocked: () => false,
    onReadPage: (page) => readPage(ctx, page),
  })
  root.add(station.group)
  colliders.push(...station.colliders)
  interactables.push(...station.interactables)

  makeInteractable(station.radioConsole, {
    id: nextId('radio2'),
    range: 2.2,
    prompt: 'Pick up the handset',
    enabled: () => !game.hasSeen('act2_delphine'),
    onInteract: () => {
      void runRadioEvent(ctx, RADIO_EVENTS.act2_delphine, 'act2_delphine')
    },
  })
  interactables.push(station.radioConsole)

  if (station.archiveDesk) {
    makeInteractable(station.archiveDesk, {
      id: nextId('archive-tape'),
      range: 2.2,
      prompt: 'Play the archive tape',
      enabled: () => !game.hasSeen('act2_archive'),
      onInteract: () => {
        void runRadioEvent(ctx, RADIO_EVENTS.act2_archive, 'act2_archive')
      },
    })
    interactables.push(station.archiveDesk)
  }

  const archivePage = addReadable(station.group, {
    x: 4.35,
    y: 0.9,
    z: -1.7,
    yaw: Math.PI / 2,
    width: 0.3,
    height: 0.4,
    label: 'A folded page among the reels',
    page: PAGES.page_archive_drawer,
    onRead: (page) => readPage(ctx, page),
  })
  interactables.push(archivePage)

  // ---- tower exterior, beyond the radio room's west opening ----
  const ext = new THREE.Group()
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), floorMat(0x101418))
  ground.rotation.x = -Math.PI / 2
  ground.position.set(-11.5, 0, -11.5)
  ext.add(ground)

  addProp(ext, 0.9, 0.9, 0.9, -16.5, 0.45, -11.5, propMat(0x1b1a18), colliders)
  addProp(ext, 0.32, 9, 0.32, -16.5, 4.9, -11.5, propMat(0x0c0c0e), colliders)
  const towerBeacon = addProp(ext, 0.22, 0.22, 0.22, -16.5, 9.3, -11.5, emissiveMat(0xe8a25c, 0.4))
  root.add(ext)

  interface RepairStep {
    done: boolean
    mesh: THREE.Mesh
  }
  const steps: RepairStep[] = []
  const stepDefs: Array<[string, number, number]> = [
    ['Reconnect the power coupling', -15.2, -13.2],
    ['Realign the dish', -15.2, -11.5],
    ['Splice the cable', -15.2, -9.8],
  ]
  for (const [label, x, z] of stepDefs) {
    const mesh = addProp(ext, 0.4, 0.4, 0.25, x, 1, z, metalMat(0x54524c))
    const step: RepairStep = { done: false, mesh }
    makeInteractable(mesh, {
      id: nextId('repair'),
      range: 2,
      prompt: () => (step.done ? 'Done' : label),
      enabled: () => !step.done,
      onInteract: () => {
        step.done = true
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissive = new THREE.Color(0x3a6b4a)
        mat.emissiveIntensity = 1
        audio.playStaticBurst(0.2, 0.25)
        if (steps.every((s) => s.done)) {
          overlay.showThought('The dish finally holds still.')
          void (async () => {
            await runRadioEvent(ctx, RADIO_EVENTS.act2_tower, 'act2_tower')
            game.setFlag('tower_repaired')
            await overlay.fadeToBlack()
            goTo('act3')
          })()
        }
      },
    })
    steps.push(step)
    interactables.push(mesh)
  }

  const towerPage = addReadable(ext, {
    x: -17.6,
    y: 0.35,
    z: -10.6,
    width: 0.32,
    height: 0.42,
    label: 'A weatherproof box, unlatched',
    page: PAGES.page_tower_box,
    onRead: (page) => readPage(ctx, page),
  })
  interactables.push(towerPage)

  const update = (dt: number) => {
    for (const fl of station.flickerLights) fl.update(1 - game.state.staticMeter / 100)
    audio.update(dt)
    audio.setDread((1 - game.state.staticMeter / 100) * 0.6)
    const t = performance.now() * 0.0025
    ;(towerBeacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(t) * 0.6
  }

  return {
    root,
    colliders,
    interactables,
    spawn: { position: new THREE.Vector3(0, 0, 1.2), yaw: 0 },
    ambient: 0.03,
    fogColor: 0x0a0c10,
    fogNear: 3,
    fogFar: 20,
    backgroundColor: 0x05060a,
    update,
  }
}
