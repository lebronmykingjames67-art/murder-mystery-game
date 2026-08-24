import * as THREE from 'three'
import type { GameStateStore } from './GameState'
import type { AudioEngine } from '../audio/AudioEngine'
import type { ColliderSource } from '../player/Collision'
import type { Overlay } from '../ui/Overlay'
import type { RadioUI } from '../ui/RadioUI'
import type { Logbook } from '../ui/Logbook'

export interface SpawnPoint {
  position: THREE.Vector3
  yaw: number
}

export interface BuiltScene {
  root: THREE.Group
  colliders: ColliderSource[]
  interactables: THREE.Object3D[]
  spawn: SpawnPoint
  ambient?: number
  fogColor?: number
  fogNear?: number
  fogFar?: number
  backgroundColor?: number
  update?: (dt: number, elapsed: number, playerPos: THREE.Vector3) => void
  dispose?: () => void
}

export interface SceneCtx {
  game: GameStateStore
  audio: AudioEngine
  overlay: Overlay
  radioUI: RadioUI
  logbook: Logbook
  goTo: (sceneId: string) => void
  getPlayerPosition: () => THREE.Vector3
  setHidden: (v: boolean) => void
  isPlayerHidden: () => boolean
  isFlashlightOn: () => boolean
  teleportPlayer: (pos: THREE.Vector3, yaw?: number) => void
}

export type SceneBuilder = (ctx: SceneCtx) => BuiltScene

export class SceneManager {
  scene = new THREE.Scene()
  onSceneChange: ((sceneId: string) => void) | null = null
  private current: BuiltScene | null = null
  private builders = new Map<string, SceneBuilder>()
  private ambientLight: THREE.AmbientLight
  private hemi: THREE.HemisphereLight

  constructor(
    private game: GameStateStore,
    private audio: AudioEngine,
    private overlay: Overlay,
    private radioUI: RadioUI,
    private logbook: Logbook,
    private applySpawn: (pos: THREE.Vector3, yaw: number) => void,
    private applyColliders: (colliders: ColliderSource[]) => void,
    private applyInteractables: (list: THREE.Object3D[]) => void,
    private getPlayerPosition: () => THREE.Vector3,
    private setHidden: (v: boolean) => void,
    private isPlayerHidden: () => boolean,
    private isFlashlightOn: () => boolean,
  ) {
    this.ambientLight = new THREE.AmbientLight(0x404050, 0.06)
    this.hemi = new THREE.HemisphereLight(0x30303a, 0x08080a, 0.08)
    this.scene.add(this.ambientLight, this.hemi)
  }

  register(id: string, builder: SceneBuilder) {
    this.builders.set(id, builder)
  }

  goTo(sceneId: string) {
    const builder = this.builders.get(sceneId)
    if (!builder) {
      console.error('[SceneManager] unknown scene id:', sceneId)
      return
    }

    if (this.current) {
      this.scene.remove(this.current.root)
      disposeObject(this.current.root)
      this.current.dispose?.()
    }

    const built = builder({
      game: this.game,
      audio: this.audio,
      overlay: this.overlay,
      radioUI: this.radioUI,
      logbook: this.logbook,
      goTo: (id) => this.goTo(id),
      getPlayerPosition: this.getPlayerPosition,
      setHidden: this.setHidden,
      isPlayerHidden: this.isPlayerHidden,
      isFlashlightOn: this.isFlashlightOn,
      teleportPlayer: (pos, yaw) => this.applySpawn(pos, yaw ?? 0),
    })
    this.scene.add(built.root)
    this.scene.background = new THREE.Color(built.backgroundColor ?? 0x000000)
    this.scene.fog =
      built.fogColor != null ? new THREE.Fog(built.fogColor, built.fogNear ?? 2, built.fogFar ?? 20) : null
    this.ambientLight.intensity = built.ambient ?? 0.06

    this.applySpawn(built.spawn.position, built.spawn.yaw)
    this.applyColliders(built.colliders)
    this.applyInteractables(built.interactables)

    this.current = built
    this.game.gotoScene(sceneId)
    this.onSceneChange?.(sceneId)
  }

  update(dt: number, elapsed: number) {
    this.current?.update?.(dt, elapsed, this.getPlayerPosition())
  }
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      for (const m of mats) m.dispose()
    }
  })
}
