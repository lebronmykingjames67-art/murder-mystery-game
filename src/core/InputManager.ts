// Captures raw keyboard/mouse/pointer-lock state for the current frame. Higher-level
// systems (PlayerController, InteractionSystem, GameManager) read from this rather than
// attaching their own DOM listeners, so there is exactly one source of truth for input.

export class InputManager {
  private target: HTMLElement
  private keysDown = new Set<string>()
  private keysPressed = new Set<string>()
  private mouseDX = 0
  private mouseDY = 0
  private leftDown = false
  private leftPressed = false
  pointerLocked = false

  onEscape: (() => void) | null = null
  onPointerLockChange: ((locked: boolean) => void) | null = null

  constructor(target: HTMLElement) {
    this.target = target
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleBlur = this.handleBlur.bind(this)

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)
    target.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('blur', this.handleBlur)
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
    this.target.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('blur', this.handleBlur)
  }

  private handleBlur(): void {
    this.keysDown.clear()
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Escape') {
      this.onEscape?.()
      return
    }
    if (!this.keysDown.has(e.code)) this.keysPressed.add(e.code)
    this.keysDown.add(e.code)
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code)
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.pointerLocked) return
    this.mouseDX += e.movementX || 0
    this.mouseDY += e.movementY || 0
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return
    if (!this.leftDown) this.leftPressed = true
    this.leftDown = true
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button !== 0) return
    this.leftDown = false
  }

  private handlePointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === this.target
    this.onPointerLockChange?.(this.pointerLocked)
  }

  requestPointerLock(): void {
    if (document.pointerLockElement === this.target) return
    this.target.requestPointerLock()
  }

  exitPointerLock(): void {
    if (document.pointerLockElement === this.target) document.exitPointerLock()
  }

  isDown(code: string): boolean {
    return this.keysDown.has(code)
  }

  wasPressed(code: string): boolean {
    return this.keysPressed.has(code)
  }

  isLeftDown(): boolean {
    return this.leftDown
  }

  wasLeftPressed(): boolean {
    return this.leftPressed
  }

  /** Returns accumulated mouse movement since the last call and resets it. */
  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDX
    const dy = this.mouseDY
    this.mouseDX = 0
    this.mouseDY = 0
    return { dx, dy }
  }

  /** Call once at the end of every frame after all systems have read this frame's input. */
  endFrame(): void {
    this.keysPressed.clear()
    this.leftPressed = false
  }
}
