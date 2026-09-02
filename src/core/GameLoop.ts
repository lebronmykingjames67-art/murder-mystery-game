export type LoopCallback = (dt: number, elapsed: number) => void

/** requestAnimationFrame loop with a clamped delta so a backgrounded tab can't cause a huge catch-up jump. */
export class GameLoop {
  private rafId: number | null = null
  private lastTime = 0
  private elapsed = 0
  private readonly callback: LoopCallback

  constructor(callback: LoopCallback) {
    this.callback = callback
  }

  start(): void {
    if (this.rafId != null) return
    this.lastTime = performance.now()
    const tick = (t: number): void => {
      const dt = Math.min(0.05, Math.max(0, (t - this.lastTime) / 1000))
      this.lastTime = t
      this.elapsed += dt
      this.callback(dt, this.elapsed)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stop(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
