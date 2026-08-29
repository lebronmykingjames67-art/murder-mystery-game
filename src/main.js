import * as THREE from 'three'
import './style.css'
import './ui/devOverlay.css'
import './ui/hud.css'
import './ui/damageNumbers.css'
import './ui/levelUi.css'
import './ui/deathScreen.css'
import { config } from './config.js'
import { PlayerController } from './player/controller.js'
import { CameraRig } from './player/camera.js'
import { generateFloor } from './level/generator.js'
import { createRoomContent, applyArchiveChoice } from './level/roomTypes.js'
import { initDevOverlay } from './ui/devOverlay.js'
import { createCombatHud } from './ui/hud.js'
import { createDamageNumbers } from './ui/damageNumbers.js'
import { createDeathScreen } from './ui/deathScreen.js'
import { createWeaponSystem } from './weapons/weaponSystem.js'
import { createEnemyManager } from './enemies/enemyManager.js'

const canvas = document.getElementById('scene')
const overlay = document.getElementById('start-overlay')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)
scene.fog = new THREE.FogExp2(0x000000, 0.008)

const camera = new THREE.PerspectiveCamera(config.camera.baseFov, window.innerWidth / window.innerHeight, 0.1, 150)

const controller = new PlayerController(config, new THREE.Vector3())
const cameraRig = new CameraRig(config, camera)
const devOverlay = initDevOverlay(config)
const hud = createCombatHud()
const damageNumbers = createDamageNumbers(camera)
const deathScreen = createDeathScreen()
const weaponSystem = createWeaponSystem(scene, config)

const floorLabel = document.createElement('div')
floorLabel.id = 'floor-label'
document.body.appendChild(floorLabel)

// --- Floor state: fully rebuilt on every loadFloor() call. Level geometry,
// doors, and enemies all live under `levelGroup` so tearing down a floor is
// just removing that one group, rather than tracking every mesh by hand. ---
let levelGroup = null
let colliders = []
let enemyManager = null
let roomContents = []
let exitPosition = null
let floorSpawn = null
let currentFloorNumber = 1

function onArchiveChoice(choice) {
  applyArchiveChoice(choice, controller, weaponSystem)
}

function loadFloor(floorNumber) {
  if (levelGroup) scene.remove(levelGroup)
  for (const content of roomContents) content.dispose?.()

  levelGroup = new THREE.Group()
  scene.add(levelGroup)
  currentFloorNumber = floorNumber
  floorLabel.textContent = `FLOOR ${floorNumber}`

  const result = generateFloor(levelGroup, config, floorNumber)
  colliders = result.colliders
  exitPosition = result.exitPosition
  floorSpawn = result.spawn

  enemyManager = createEnemyManager(levelGroup, config)

  roomContents = []
  for (const room of result.rooms) {
    const content = createRoomContent(levelGroup, colliders, config, room, floorNumber, enemyManager, onArchiveChoice)
    if (content) roomContents.push(content)
  }

  controller.teleport(floorSpawn)
  controller.yaw = Math.PI
}

function startNewRun() {
  controller.resetRunStats()
  loadFloor(1)
}

startNewRun()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// --- Input ---
const keys = new Set()
let dashRequested = false
let fireRequested = false
let interactRequested = false
let locked = false

overlay.addEventListener('click', () => canvas.requestPointerLock())

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas
  overlay.classList.toggle('hidden', locked)
})

document.addEventListener('mousemove', (event) => {
  if (!locked) return
  controller.applyLook(event.movementX, event.movementY)
})

document.addEventListener('mousedown', (event) => {
  if (event.button === 0 && locked) fireRequested = true
})

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault()
  keys.add(event.code)
  if ((event.code === 'KeyQ' || event.code === 'KeyE') && !event.repeat) dashRequested = true
  if (event.code === 'KeyF' && !event.repeat) interactRequested = true
})

document.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

// --- Combat feedback wiring: gameplay modules stay ignorant of presentation, main.js bridges them ---
const weaponCallbacks = {
  onEnemyHit: (pos, dmg) => damageNumbers.spawn(pos, dmg, '#eafcff'),
  onPlayerHit: (pos, dmg) => damageNumbers.spawn(pos, dmg, '#ff6b6b'),
  onFire: () => hud.pulseWeaponName(),
}
const enemyCallbacks = {
  onPlayerHit: (pos, dmg) => damageNumbers.spawn(pos, dmg, '#ff6b6b'),
}

// --- Fixed-timestep simulation, decoupled from rendering ---
const FIXED_DT = config.physics.fixedTimestep
let accumulator = 0
let lastTime = performance.now()
let deathTimer = 0
let victoryTimer = 0
let victoryPending = false
let wasAlive = true

function fixedUpdate(dt) {
  const input = {
    forward: keys.has('KeyW'),
    back: keys.has('KeyS'),
    left: keys.has('KeyA'),
    right: keys.has('KeyD'),
    sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    slideHeld: keys.has('ControlLeft') || keys.has('ControlRight'),
    jumpPressed: keys.has('Space'),
    dashPressed: dashRequested,
    firePressed: fireRequested,
    interactPressed: interactRequested,
    switchToSplitter: keys.has('Digit1'),
    switchToStatic: keys.has('Digit2'),
  }
  dashRequested = false
  fireRequested = false
  interactRequested = false

  controller.update(dt, input, colliders)

  if (controller.feet.y < -20) controller.teleport(floorSpawn)

  const world = { colliders, enemyManager, controller }
  weaponSystem.update(dt, input, controller, camera, world, weaponCallbacks)
  enemyManager.update(dt, controller, colliders, enemyCallbacks)

  for (const content of roomContents) content.update(dt, controller, input)

  if (controller.justDamaged) {
    const intensity = Math.min(controller.lastDamageAmount / 25, 1) * 0.3
    cameraRig.triggerShake(intensity, 0.15)
  }

  if (!victoryPending && exitPosition) {
    const dist = Math.hypot(controller.feet.x - exitPosition.x, controller.feet.z - exitPosition.z)
    if (dist < 2.5) {
      if (currentFloorNumber >= 5) {
        victoryPending = true
        victoryTimer = 3
        deathScreen.showVictory()
      } else {
        loadFloor(currentFloorNumber + 1)
      }
    }
  }
  if (victoryPending) {
    victoryTimer -= dt
    if (victoryTimer <= 0) {
      victoryPending = false
      deathScreen.hide()
      startNewRun()
    }
  }

  const alive = controller.health > 0
  if (wasAlive && !alive) {
    deathTimer = 2.5
    deathScreen.showDeath(currentFloorNumber)
  }
  wasAlive = alive
  if (!alive) {
    deathTimer -= dt
    if (deathTimer <= 0) {
      deathScreen.hide()
      startNewRun()
    }
  }
}

function frame(now) {
  requestAnimationFrame(frame)
  const frameTime = Math.min((now - lastTime) / 1000, 0.25)
  lastTime = now

  if (locked) {
    accumulator += frameTime
    while (accumulator >= FIXED_DT) {
      fixedUpdate(FIXED_DT)
      accumulator -= FIXED_DT
    }
  } else {
    accumulator = 0
  }

  cameraRig.update(frameTime, controller)
  devOverlay.update(frameTime, controller)
  hud.update(frameTime, controller, weaponSystem)
  damageNumbers.update(frameTime)
  renderer.render(scene, camera)
}

requestAnimationFrame(frame)
