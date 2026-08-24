import * as THREE from 'three'
import { InputState } from './engine/Input'
import { GameStateStore, createInitialState } from './engine/GameState'
import { SceneManager } from './engine/SceneManager'
import { PlayerController } from './player/PlayerController'
import { Flashlight } from './player/Flashlight'
import { InteractionSystem } from './player/Interaction'
import { AudioEngine } from './audio/AudioEngine'
import { Overlay } from './ui/Overlay'
import { RadioUI } from './ui/RadioUI'
import { Logbook } from './ui/Logbook'
import { MainMenu } from './ui/MainMenu'
import { PostFX } from './ui/PostFX'
import { buildAct1 } from './scenes/Act1'
import { buildAct2 } from './scenes/Act2'
import { buildAct3 } from './scenes/Act3'
import { buildAct4 } from './scenes/Act4'
import { buildAct5 } from './scenes/Act5'
import './styles.css'

const appEl = document.getElementById('app')
if (!appEl) throw new Error('missing #app root')

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.id = 'scene'
appEl.appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100)

const input = new InputState()
const player = new PlayerController(camera, renderer.domElement, input)
const audio = new AudioEngine(camera)
const flashlight = new Flashlight(camera)

const overlay = new Overlay(appEl)
const interaction = new InteractionSystem(camera, overlay.promptEl)
const game = new GameStateStore()
const radioUI = new RadioUI(appEl, audio, game)
const logbook = new Logbook(appEl)
const mainMenu = new MainMenu(appEl)

const sceneManager = new SceneManager(
  game,
  audio,
  overlay,
  radioUI,
  logbook,
  (pos, yaw) => player.teleport(pos, yaw),
  (colliders) => player.setColliders(colliders),
  (list) => interaction.setInteractables(list),
  () => player.object.position,
  (v) => player.setHidden(v),
  () => player.hidden,
  () => flashlight.on,
)

// The flashlight, its held-prop mesh, and the audio listener are all parented to the camera so
// they move/turn with the player's head. The renderer only collects lights and meshes by
// traversing `scene`, so the camera itself must be part of that graph or none of them render.
sceneManager.scene.add(camera)

sceneManager.register('act1', buildAct1)
sceneManager.register('act2', buildAct2)
sceneManager.register('act3', buildAct3)
sceneManager.register('act4', buildAct4)
sceneManager.register('act5', buildAct5)

const ACT_INFO: Record<string, { num: number; title: string }> = {
  act1: { num: 1, title: 'The Rule' },
  act2: { num: 2, title: 'Old Friends' },
  act3: { num: 3, title: 'The Basement Log' },
  act4: { num: 4, title: 'Whose Voice' },
  act5: { num: 5, title: 'Signoff' },
}

sceneManager.onSceneChange = (id) => {
  overlay.fadeFromBlack()
  const info = ACT_INFO[id]
  if (info && id !== 'act5') overlay.showActBanner(info.num, info.title)
}

const postFX = new PostFX(renderer, sceneManager.scene, camera)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  postFX.setSize(window.innerWidth, window.innerHeight)
})

player.controls.addEventListener('lock', () => overlay.hideLockHint())
player.controls.addEventListener('unlock', () => {
  if (!mainMenu.isShowing) {
    overlay.showLockHint('Paused — click to resume', () => player.controls.lock())
  }
})

function startGame() {
  mainMenu.hide()
  void audio.resume()
  sceneManager.goTo(game.state.sceneId || 'act1')
  overlay.showLockHint('Click to step into the station', () => player.controls.lock())
}

function showMenu() {
  mainMenu.show({
    hasSave: GameStateStore.hasSave(),
    onNewGame: () => {
      GameStateStore.clear()
      game.resetTo(createInitialState())
      startGame()
    },
    onContinue: () => {
      const loaded = GameStateStore.load()
      if (loaded) game.resetTo(loaded)
      startGame()
    },
  })
}

showMenu()

const clock = new THREE.Timer()

function animate(timestamp?: DOMHighResTimeStamp) {
  requestAnimationFrame(animate)
  clock.update(timestamp)
  const dt = Math.min(clock.getDelta(), 0.1)

  if (!mainMenu.isShowing) {
    const uiBlocking = radioUI.active || logbook.active
    player.frozen = player.hidden || uiBlocking
    player.update(dt)

    interaction.setSuspended(uiBlocking)
    if (!uiBlocking) interaction.update()

    if (!uiBlocking && input.consumeJustPressed('KeyF')) flashlight.toggle()
    if (!uiBlocking && input.consumeJustPressed('KeyE')) interaction.tryInteract()

    const corruption = 1 - game.state.staticMeter / 100
    flashlight.update(corruption)
    sceneManager.update(dt, clock.getElapsed())
    postFX.setCorruption(corruption)
  }

  postFX.render(dt)
  input.clearFrame()
}

animate()
