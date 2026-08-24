import * as THREE from 'three'

export interface InteractableData {
  id: string
  prompt: string | (() => string)
  range?: number
  onInteract: () => void
  enabled?: () => boolean
}

export class InteractionSystem {
  private raycaster = new THREE.Raycaster()
  private interactables: THREE.Object3D[] = []
  private hovered: THREE.Object3D | null = null
  private center = new THREE.Vector2(0, 0)
  private suspended = false

  constructor(
    private camera: THREE.Camera,
    private promptEl: HTMLElement,
  ) {}

  setInteractables(list: THREE.Object3D[]) {
    this.interactables = list
    this.hovered = null
  }

  setSuspended(v: boolean) {
    this.suspended = v
    if (v) this.promptEl.style.opacity = '0'
  }

  update() {
    if (this.suspended) return
    this.raycaster.setFromCamera(this.center, this.camera)
    const hits = this.raycaster.intersectObjects(this.interactables, true)
    let target: THREE.Object3D | null = null
    for (const hit of hits) {
      const data = findData(hit.object)
      if (!data) continue
      const range = data.range ?? 3
      if (hit.distance > range) break
      if (data.enabled && !data.enabled()) break
      target = hit.object
      break
    }
    this.hovered = target
    const data = target ? findData(target) : null
    if (data) {
      const text = typeof data.prompt === 'function' ? data.prompt() : data.prompt
      this.promptEl.textContent = text
      this.promptEl.style.opacity = '1'
    } else {
      this.promptEl.style.opacity = '0'
    }
  }

  tryInteract() {
    if (this.suspended || !this.hovered) return
    const data = findData(this.hovered)
    if (data && (!data.enabled || data.enabled())) data.onInteract()
  }
}

function findData(obj: THREE.Object3D): InteractableData | null {
  let o: THREE.Object3D | null = obj
  while (o) {
    const data = o.userData.interactable as InteractableData | undefined
    if (data) return data
    o = o.parent
  }
  return null
}
