import * as THREE from 'three'
import type { SceneBuilder } from '../engine/SceneManager'
import { buildStationInterior } from './StationInterior'
import { addProp, makeInteractable, nextId, metalMat } from './RoomBuilder'
import { runRadioEvent, readPage } from './sceneUtils'
import { RADIO_EVENTS } from '../data/dialogue'
import type { ColliderSource } from '../player/Collision'

export const buildAct4: SceneBuilder = (ctx) => {
  const { game, audio, overlay, goTo } = ctx
  const root = new THREE.Group()
  const colliders: ColliderSource[] = []
  const interactables: THREE.Object3D[] = []

  const station = buildStationInterior({
    exteriorOpen: false,
    archiveOpen: false,
    basementOpen: false,
    towerOpen: false,
    radioLocked: () => false,
    corruptedProps: true,
    onReadPage: (page) => readPage(ctx, page),
  })
  root.add(station.group)
  colliders.push(...station.colliders)
  interactables.push(...station.interactables)

  interface RepairStep {
    done: boolean
    mesh: THREE.Mesh
  }
  const steps: RepairStep[] = []

  makeInteractable(station.radioConsole, {
    id: nextId('radio4'),
    range: 2.2,
    prompt: () => (game.hasSeen('act4_early') ? 'Command is calling again' : 'Pick up the handset'),
    enabled: () => !game.hasSeen('act4_climax'),
    onInteract: () => {
      void (async () => {
        if (!game.hasSeen('act4_early')) {
          await runRadioEvent(ctx, RADIO_EVENTS.act4_early, 'act4_early')
          return
        }
        if (!game.hasSeen('act4_climax')) {
          await runRadioEvent(ctx, RADIO_EVENTS.act4_climax, 'act4_climax')
          revealRepairPanel()
        }
      })()
    },
  })
  interactables.push(station.radioConsole)

  const panelGroup = new THREE.Group()
  panelGroup.visible = false
  root.add(panelGroup)

  function revealRepairPanel() {
    panelGroup.visible = true
    overlay.showThought('One more coupling. Command wants a clean carrier before the window closes.')
    const defs: Array<[string, number, number]> = [
      ['Stabilize the carrier', -0.6, -13.85],
      ['Close the relay loop', -2.4, -13.85],
    ]
    for (const [label, x, z] of defs) {
      const mesh = addProp(panelGroup, 0.3, 0.3, 0.18, x, 1.3, z, metalMat(0x5a544a))
      const step: RepairStep = { done: false, mesh }
      makeInteractable(mesh, {
        id: nextId('final-repair'),
        range: 2,
        prompt: () => (step.done ? 'Holding' : label),
        enabled: () => !step.done,
        onInteract: () => {
          step.done = true
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.emissive = new THREE.Color(0x3a6b4a)
          mat.emissiveIntensity = 1
          audio.playStaticBurst(0.25, 0.3)
          if (steps.every((s) => s.done)) {
            void (async () => {
              await runRadioEvent(ctx, RADIO_EVENTS.act4_final_whisper, 'act4_final_whisper')
              await overlay.fadeToBlack()
              game.save()
              goTo('act5')
            })()
          }
        },
      })
      steps.push(step)
      interactables.push(mesh)
    }
  }

  // resuming a save made after the climax dialogue: the panel is a live side-effect of that
  // dialogue finishing, so a fresh load needs to re-derive it from the persisted flag instead.
  if (game.hasSeen('act4_climax')) revealRepairPanel()

  const update = (dt: number) => {
    const corruption = 1 - game.state.staticMeter / 100
    for (const fl of station.flickerLights) fl.update(Math.max(0.35, corruption))
    audio.update(dt)
    audio.setDread(0.35 + corruption * 0.65)
  }

  return {
    root,
    colliders,
    interactables,
    spawn: { position: new THREE.Vector3(0, 0, 1.2), yaw: 0 },
    ambient: 0.022,
    fogColor: 0x0a0708,
    fogNear: 2.5,
    fogFar: 16,
    backgroundColor: 0x030202,
    update,
  }
}
