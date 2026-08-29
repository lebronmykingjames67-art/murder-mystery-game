import * as THREE from 'three'
import './style.css'
import './ui/devOverlay.css'
import './ui/hud.css'
import './ui/damageNumbers.css'
import { config } from './config.js'
import { PlayerController } from './player/controller.js'
import { CameraRig } from './player/camera.js'
import { buildTestRoom } from './level/testRoom.js'
import { initDevOverlay } from './ui/devOverlay.js'
import { createCombatHud } from './ui/hud.js'
import { createDamageNumbers } from './ui/damageNumbers.js'
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

const { colliders, spawn, fallResetY, enemySpawns } = buildTestRoom(scene)
const controller = new PlayerController(config, spawn)
controller.yaw = Math.PI // face north, into the room, instead of at the spawn wall behind it
const cameraRig = new CameraRig(config, camera)
const devOverlay = initDevOverlay(config)
const hud = createCombatHud()
const damageNumbers = createDamageNumbers(camera)

const weaponSystem = createWeaponSystem(scene, config)
const enemyManager = createEnemyManager(scene, config)
for (const position of enemySpawns.motes) enemyManager.spawnMote(position)
for (const warden of enemySpawns.wardens) enemyManager.spawnWarden(warden.position, warden.facingYaw)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// --- Input ---
const keys = new Set()
let dashRequested = false
let fireRequested = false
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
    switchToSplitter: keys.has('Digit1'),
    switchToStatic: keys.has('Digit2'),
  }
  dashRequested = false
  fireRequested = false

  controller.update(dt, input, colliders)

  if (controller.feet.y < fallResetY) {
    controller.feet.copy(spawn)
    controller.velocity.set(0, 0, 0)
  }

  const world = { colliders, enemyManager, controller }
  weaponSystem.update(dt, input, controller, camera, world, weaponCallbacks)
  enemyManager.update(dt, controller, colliders, enemyCallbacks)

  if (controller.justDamaged) {
    const intensity = Math.min(controller.lastDamageAmount / 25, 1) * 0.3
    cameraRig.triggerShake(intensity, 0.15)
  }

  const alive = controller.health > 0
  if (wasAlive && !alive) deathTimer = 2
  wasAlive = alive
  if (!alive) {
    deathTimer -= dt
    if (deathTimer <= 0) controller.respawn(spawn)
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
