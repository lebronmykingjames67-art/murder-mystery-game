import * as THREE from 'three'
import { GameApp } from '../engine/GameApp'
import { FloorManager } from '../floors/FloorManager'
import { RunManager } from './RunManager'
import { buildLobby } from '../world/Lobby'
import type { SceneHandle } from '../types'
import { useGameStore } from '../state/store'
import { audioManager } from './AudioManager'

type SceneKind = 'none' | 'lobby' | 'floor'

const NON_INTERACTIVE_SCREENS = new Set(['boot', 'menu', 'floor-complete', 'risk-decision', 'run-failed', 'cashed-out'])

/**
 * Top-level orchestrator. Owns the one GameApp instance and decides, from the store's screen/
 * modal state, whether the player currently has control, which scene should be ticking, and
 * what a screen transition should actually do (build a floor, unlock the elevator, reset the
 * run). UI components call the public methods here instead of reaching into the engine
 * directly.
 */
class GameManager {
  private gameApp: GameApp | null = null
  private floorManager = new FloorManager()
  private runManager = new RunManager()
  private lobbyHandle: SceneHandle | null = null
  private currentScene: SceneKind = 'none'
  private currentFloorNumber = 0
  private unsubscribe: (() => void) | null = null

  mount(container: HTMLElement): void {
    if (this.gameApp) return
    const gameApp = new GameApp(container)
    this.gameApp = gameApp

    gameApp.health.onDied = () => this.handleDeath()
    gameApp.input.onEscape = () => this.togglePause()
    gameApp.setFrameHook((dt) => this.onFrame(dt))
    this.floorManager.onFloorComplete = (floorNumber) => this.handleFloorComplete(floorNumber)

    this.buildLobbyScene()
    gameApp.start()

    useGameStore.getState().hydrate()
    this.syncInteractivity()
    this.unsubscribe = useGameStore.subscribe((state, prev) => {
      if (state.screen !== prev.screen || state.modal !== prev.modal) this.syncInteractivity()
    })

    if (import.meta.env.DEV) {
      // Dev-only inspection hook (stripped from production builds) — lets tooling/tests poke
      // at live engine state without adding any debug surface to the shipped game.
      // @ts-expect-error debug hook
      window.__debug = { gameApp, floorManager: this.floorManager, gameManager: this }
    }
  }

  unmount(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    this.gameApp?.stop()
  }

  private buildLobbyScene(): void {
    if (!this.gameApp) return
    this.gameApp.clearWorld()
    this.lobbyHandle = buildLobby(this.gameApp, () => this.beginRun())
    this.gameApp.player.spawnAt(this.lobbyHandle.spawnX, this.lobbyHandle.spawnZ, this.lobbyHandle.spawnYaw)
    this.gameApp.setCinematicTarget(new THREE.Vector3(0, 1.6, 3))
    this.currentScene = 'lobby'
  }

  private onFrame(dt: number): void {
    if (!this.gameApp) return
    if (this.currentScene === 'lobby') {
      this.lobbyHandle?.update(dt, this.gameApp.player.position)
    } else if (this.currentScene === 'floor') {
      this.floorManager.update(dt, this.gameApp)
    }
  }

  private syncInteractivity(): void {
    const gameApp = this.gameApp
    if (!gameApp) return
    const state = useGameStore.getState()
    const blocked = state.modal !== null || NON_INTERACTIVE_SCREENS.has(state.screen)
    gameApp.player.inputLocked = blocked
    if (blocked) gameApp.input.exitPointerLock()
    gameApp.mode = state.screen === 'menu' || state.screen === 'boot' ? 'cinematic' : 'active'
  }

  // ---- screen transitions, called from UI ---------------------------------

  pressPlay(): void {
    useGameStore.getState().setScreen('lobby')
    this.requestControl()
  }

  requestControl(): void {
    this.gameApp?.requestPointerLock()
  }

  private beginRun(): void {
    if (!this.gameApp) return
    this.runManager.startRun()
    this.gameApp.health.reset()
    this.currentFloorNumber = 1
    const kind = this.floorManager.enterFloor(this.gameApp, 1)
    this.currentScene = 'floor'
    useGameStore.getState().setFloor(1, kind)
    useGameStore.getState().setScreen('run')
  }

  private handleFloorComplete(floorNumber: number): void {
    this.runManager.completeFloor(floorNumber)
    window.setTimeout(() => {
      if (useGameStore.getState().screen === 'floor-complete') useGameStore.getState().setScreen('risk-decision')
    }, 1900)
  }

  private handleDeath(): void {
    // A brief slow-motion dip so death reads as a beat, not an instant cut to a menu.
    this.gameApp?.triggerSlowMo(0.25, 0.7)
    this.runManager.failRun()
  }

  chooseCashOut(): void {
    this.runManager.cashOut()
  }

  chooseRiskIt(): void {
    if (!this.gameApp) return
    this.currentFloorNumber += 1
    this.runManager.riskIt()
    const kind = this.floorManager.enterFloor(this.gameApp, this.currentFloorNumber)
    useGameStore.getState().setFloor(this.currentFloorNumber, kind)
    this.requestControl()
  }

  tryAgain(): void {
    if (!this.gameApp) return
    useGameStore.getState().acknowledgeRunResult()
    this.runManager.startRun()
    this.gameApp.health.reset()
    this.currentFloorNumber = 1
    const kind = this.floorManager.enterFloor(this.gameApp, 1)
    this.currentScene = 'floor'
    useGameStore.getState().setFloor(1, kind)
    useGameStore.getState().setScreen('run')
    this.requestControl()
  }

  returnToLobby(): void {
    useGameStore.getState().acknowledgeRunResult()
    this.buildLobbyScene()
    useGameStore.getState().setScreen('lobby')
    this.requestControl()
  }

  togglePause(): void {
    const state = useGameStore.getState()
    if (state.screen !== 'run' && state.screen !== 'lobby') return
    if (state.modal === 'pause') {
      state.closeModal()
      this.requestControl()
    } else if (state.modal === null) {
      audioManager.uiClick()
      state.openModal('pause')
    }
  }

  closeModalAndResume(): void {
    useGameStore.getState().closeModal()
    this.requestControl()
  }

  /** Bailing out mid-run from the pause menu — same cost as dying, without a body to show for it. */
  abandonRun(): void {
    useGameStore.getState().closeModal()
    this.runManager.failRun()
  }

  quitToMenu(): void {
    useGameStore.getState().closeModal()
    useGameStore.getState().setScreen('menu')
  }
}

export const gameManager = new GameManager()
