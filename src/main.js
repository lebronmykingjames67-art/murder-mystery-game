import * as THREE from 'three'
import './style.css'
import './ui/devOverlay.css'
import { config } from './config.js'
import { PlayerController } from './player/controller.js'
import { CameraRig } from './player/camera.js'
import { buildTestRoom } from './level/testRoom.js'
import { initDevOverlay } from './ui/devOverlay.js'

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

const { colliders, spawn, fallResetY } = buildTestRoom(scene)
const controller = new PlayerController(config, spawn)
controller.yaw = Math.PI // face north, into the room, instead of at the spawn wall behind it
const cameraRig = new CameraRig(config, camera)
const devOverlay = initDevOverlay(config)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// --- Input ---
const keys = new Set()
let dashRequested = false
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

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault()
  keys.add(event.code)
  if ((event.code === 'KeyQ' || event.code === 'KeyE') && !event.repeat) dashRequested = true
})

document.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

// --- Fixed-timestep simulation, decoupled from rendering ---
const FIXED_DT = config.physics.fixedTimestep
let accumulator = 0
let lastTime = performance.now()

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
  }
  dashRequested = false

  controller.update(dt, input, colliders)

  if (controller.feet.y < fallResetY) {
    controller.feet.copy(spawn)
    controller.velocity.set(0, 0, 0)
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
  renderer.render(scene, camera)
}

requestAnimationFrame(frame)
