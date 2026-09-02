const PREVENT_DEFAULT_CODES = new Set(['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

export class InputManager {
  private down = new Set<string>()
  private justPressed = new Set<string>()
  private enabled = true

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (PREVENT_DEFAULT_CODES.has(e.code)) e.preventDefault()
    if (!this.enabled) return
    if (!this.down.has(e.code)) this.justPressed.add(e.code)
    this.down.add(e.code)
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code)
  }

  private onBlur = (): void => {
    this.down.clear()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.down.clear()
  }

  isDown(code: string): boolean {
    return this.enabled && this.down.has(code)
  }

  anyDown(codes: string[]): boolean {
    return codes.some((c) => this.isDown(c))
  }

  consumeJustPressed(code: string): boolean {
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code)
      return true
    }
    return false
  }

  endFrame(): void {
    this.justPressed.clear()
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
  }
}

export const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  handbrake: ['Space'],
  boost: ['ShiftLeft', 'ShiftRight'],
  interact: 'KeyE',
  orderBoard: 'Tab',
  map: 'KeyM',
  pause: 'Escape',
}
