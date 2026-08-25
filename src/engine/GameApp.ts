import * as THREE from 'three'
import { FirstPersonCamera } from './FirstPersonCamera'
import { PlayerController } from './PlayerController'
import { CollisionWorld } from './CollisionWorld'
import { InteractionSystem } from './InteractionSystem'
import { InputManager } from '../core/InputManager'
import { HealthSystem } from '../core/HealthSystem'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../state/store'
import { Viewmodel, VIEWMODEL_LAYER } from '../world/Viewmodel'
import { cosmeticDef } from '../systems/CosmeticSystem'

export type RenderMode = 'cinematic' | 'active'

/**
 * Owns the renderer, scene graph and the main loop. Deliberately knows nothing about floors,
 * enemies or the risk/reward loop — GameManager drives all of that through the per-frame hook
 * and the world-root group this exposes. Keeping GameApp "dumb" is what lets floor types be
 * added later without ever touching this file.
 */
export class GameApp {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly worldRoot = new THREE.Group()
  readonly fpCamera: FirstPersonCamera
  readonly collision = new CollisionWorld()
  readonly player: PlayerController
  readonly interaction = new InteractionSystem()
  readonly viewmodel: Viewmodel
  /** Fixed narrow FOV, separate from the user-adjustable main camera — sharing the main
   * camera's FOV would grossly distort geometry sitting this close to the eye. Rendered as a
   * second pass over a cleared depth buffer, restricted to VIEWMODEL_LAYER. */
  readonly viewmodelCamera: THREE.PerspectiveCamera
  readonly health = new HealthSystem()
  readonly input: InputManager
  readonly clock = new THREE.Clock()

  mode: RenderMode = 'cinematic'
  private cinematicT = 0
  private cinematicTarget = new THREE.Vector3(0, 1.6, 0)
  private frameHook: ((dt: number) => void) | null = null
  private container: HTMLElement
  private timeScale = 1
  private targetTimeScale = 1
  private slowMoRestoreTimer = 0
  private raf = 0
  private sceneDisposables: { dispose: () => void }[] = []

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 2.4
    container.appendChild(this.renderer.domElement)

    this.scene.add(this.worldRoot)

    this.fpCamera = new FirstPersonCamera(container.clientWidth / container.clientHeight)
    // The camera must be part of the scene graph (not just passed to render()) or objects
    // parented to it — the viewmodel arms — would never be traversed/rendered.
    this.scene.add(this.fpCamera.camera)
    this.input = new InputManager(this.renderer.domElement)
    this.player = new PlayerController(this.fpCamera, this.input, this.collision)

    const initialSuitId = useGameStore.getState().equippedCosmetics.suit
    const initialSuitColor = (initialSuitId && cosmeticDef(initialSuitId)?.color) || '#4a5058'
    this.viewmodel = new Viewmodel(this.fpCamera.camera, initialSuitColor)

    this.viewmodelCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 5)
    this.viewmodelCamera.layers.set(VIEWMODEL_LAYER)

    this.input.onPointerLockChange = (locked) => useGameStore.getState().setPointerLocked(locked)

    window.addEventListener('resize', this.handleResize)
    this.animate = this.animate.bind(this)
  }

  handleResize = (): void => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.renderer.setSize(w, h)
    this.fpCamera.setAspect(w / h)
    this.viewmodelCamera.aspect = w / h
    this.viewmodelCamera.updateProjectionMatrix()
  }

  setFrameHook(fn: ((dt: number) => void) | null): void {
    this.frameHook = fn
  }

  requestPointerLock(): void {
    audioManager.ensureStarted()
    this.input.requestPointerLock()
  }

  /**
   * Registers a resource unique to the scene currently being built (e.g. a canvas texture
   * baked for one sign's text) so it gets freed on the next clearWorld(). Shared/cached
   * geometry and materials from world/Materials.ts must never be passed here — they are
   * reused for the app's lifetime across every generated floor.
   */
  trackDisposable(resource: { dispose: () => void }): void {
    this.sceneDisposables.push(resource)
  }

  clearWorld(): void {
    for (let i = this.worldRoot.children.length - 1; i >= 0; i--) {
      this.worldRoot.remove(this.worldRoot.children[i])
    }
    this.sceneDisposables.forEach((d) => d.dispose())
    this.sceneDisposables = []
    this.collision.clear()
    this.interaction.clear()
    // Remove any lights/fog placed directly on the scene by the previous LightingRig.
    this.scene.fog = null
  }

  start(): void {
    if (this.raf) return
    this.clock.start()
    this.raf = requestAnimationFrame(this.animate)
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private animate(): void {
    this.raf = requestAnimationFrame(this.animate)
    const rawDt = Math.min(0.05, this.clock.getDelta())

    if (this.slowMoRestoreTimer > 0) {
      this.slowMoRestoreTimer -= rawDt
      if (this.slowMoRestoreTimer <= 0) this.targetTimeScale = 1
    }
    this.timeScale += (this.targetTimeScale - this.timeScale) * Math.min(1, rawDt * 10)

    this.tick(rawDt * this.timeScale)
  }

  /** A brief, self-recovering slow-motion dip — e.g. the beat right after the player dies. */
  triggerSlowMo(scale: number, holdSeconds: number): void {
    this.targetTimeScale = scale
    this.slowMoRestoreTimer = holdSeconds
  }

  /**
   * Runs exactly one simulation + render step for the given dt. Split out from animate() so
   * it can also be driven manually (fixed-step testing/tooling) instead of only from the
   * real-time RAF loop.
   */
  tick(dt: number): void {
    audioManager.update(dt)
    this.health.update(dt)

    const settings = useGameStore.getState().settings
    this.fpCamera.setBaseFov(settings.fov)

    const suitId = useGameStore.getState().equippedCosmetics.suit
    if (suitId) {
      const def = cosmeticDef(suitId)
      if (def) this.viewmodel.setSuitColor(def.color)
    }

    if (this.mode === 'active') {
      this.player.update(dt, settings.mouseSensitivity)
      this.viewmodel.update(dt, this.player.getSpeed(), this.player.grounded)
      this.interaction.update(this.fpCamera.camera, this.input, true)
    } else if (this.mode === 'cinematic') {
      this.updateCinematic(dt)
    }

    this.frameHook?.(dt)
    this.input.endFrame()

    this.renderer.render(this.scene, this.fpCamera.camera)
    if (this.mode === 'active') {
      this.viewmodelCamera.position.copy(this.fpCamera.camera.position)
      this.viewmodelCamera.quaternion.copy(this.fpCamera.camera.quaternion)
      // autoClear defaults to true, which would wipe the world pass we just drew — disable it
      // for this second pass (color must survive), but still clear depth so the viewmodel
      // can't be occluded by (or z-fight with) world geometry from the first pass.
      this.renderer.autoClear = false
      this.renderer.clearDepth()
      this.renderer.render(this.scene, this.viewmodelCamera)
      this.renderer.autoClear = true
    }
  }

  private updateCinematic(dt: number): void {
    this.cinematicT += dt * 0.06
    const radius = 5.5
    const cam = this.fpCamera.camera
    cam.position.set(Math.sin(this.cinematicT) * radius, 2.4 + Math.sin(this.cinematicT * 0.5) * 0.3, Math.cos(this.cinematicT) * radius)
    cam.lookAt(this.cinematicTarget)
  }

  setCinematicTarget(target: THREE.Vector3): void {
    this.cinematicTarget.copy(target)
  }
}
