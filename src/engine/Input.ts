export class InputState {
  private down = new Set<string>()
  private justPressed = new Set<string>()

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.down.has(e.code)) this.justPressed.add(e.code)
      this.down.add(e.code)
    })
    window.addEventListener('keyup', (e) => this.down.delete(e.code))
    window.addEventListener('blur', () => this.down.clear())
  }

  isDown(code: string): boolean {
    return this.down.has(code)
  }

  /** True once, the frame a key transitions from up to down. Call at most once per key per frame. */
  consumeJustPressed(code: string): boolean {
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code)
      return true
    }
    return false
  }

  clearFrame() {
    this.justPressed.clear()
  }
}
