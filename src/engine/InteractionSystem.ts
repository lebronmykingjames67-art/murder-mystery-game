import * as THREE from 'three'
import type { Interactable } from '../types'
import type { InputManager } from '../core/InputManager'
import { useGameStore } from '../state/store'
import { audioManager } from '../core/AudioManager'

const RAYCAST_FAR = 5.5

/**
 * Reusable "look at something, see a prompt, press E" system. Every physical thing the
 * player can act on — doors, switches, loot, the elevator, lobby stations — registers
 * itself here once and is found purely by what the camera is actually looking at, which is
 * what keeps interaction feeling like it exists in the world rather than being a UI hitbox.
 */
export class InteractionSystem {
  private interactables = new Map<string, Interactable>()
  private raycaster = new THREE.Raycaster()
  private focused: Interactable | null = null
  private forward = new THREE.Vector3()

  register(interactable: Interactable): void {
    interactable.object.userData.interactableId = interactable.id
    this.interactables.set(interactable.id, interactable)
  }

  unregister(id: string): void {
    if (this.focused?.id === id) {
      this.focused.onBlur?.()
      this.focused = null
      useGameStore.getState().setInteractPrompt(null)
    }
    this.interactables.delete(id)
  }

  clear(): void {
    this.focused?.onBlur?.()
    this.focused = null
    this.interactables.clear()
    useGameStore.getState().setInteractPrompt(null)
  }

  private findRoot(object: THREE.Object3D | null): string | null {
    let node: THREE.Object3D | null = object
    while (node) {
      if (node.userData.interactableId) return node.userData.interactableId as string
      node = node.parent
    }
    return null
  }

  update(camera: THREE.Camera, input: InputManager, allowInteraction: boolean): void {
    let newFocused: Interactable | null = null

    if (allowInteraction && this.interactables.size > 0) {
      camera.getWorldDirection(this.forward)
      this.raycaster.set(camera.getWorldPosition(new THREE.Vector3()), this.forward)
      this.raycaster.far = RAYCAST_FAR
      const objects: THREE.Object3D[] = []
      this.interactables.forEach((i) => {
        if (i.enabled) objects.push(i.object)
      })
      const hits = this.raycaster.intersectObjects(objects, true)
      for (const hit of hits) {
        const id = this.findRoot(hit.object)
        if (!id) continue
        const candidate = this.interactables.get(id)
        if (!candidate || !candidate.enabled) continue
        if (hit.distance > candidate.range) break
        newFocused = candidate
        break
      }
    }

    if (newFocused !== this.focused) {
      this.focused?.onBlur?.()
      newFocused?.onFocus?.()
      this.focused = newFocused
      useGameStore.getState().setInteractPrompt(newFocused ? newFocused.promptText : null)
    } else if (newFocused) {
      // Re-read every frame (not just on focus change) so prompt text can react live to
      // state that changes while the player is still looking at the object — e.g. a locked
      // door's prompt flipping to "OPEN" the instant a puzzle elsewhere unlocks it.
      const store = useGameStore.getState()
      if (store.interactPrompt !== newFocused.promptText) store.setInteractPrompt(newFocused.promptText)
    }

    if (this.focused && allowInteraction && (input.wasPressed('KeyE') || input.wasLeftPressed())) {
      audioManager.interact()
      this.focused.onInteract({ playerPosition: camera.getWorldPosition(new THREE.Vector3()) })
      const store = useGameStore.getState()
      if (!store.tutorialSeen.interact) store.markTutorialSeen('interact')
    }
  }

  getFocused(): Interactable | null {
    return this.focused
  }
}
