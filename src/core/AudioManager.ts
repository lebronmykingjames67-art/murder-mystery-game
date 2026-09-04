/** All feedback is synthesized via WebAudio oscillators — no binary assets to fetch or ship. */
export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private engineOsc: OscillatorNode | null = null
  private engineGain: GainNode | null = null
  private started = false
  private muted = false

  start(): void {
    if (this.started) return
    this.started = true
    const AudioCtx = window.AudioContext
    this.ctx = new AudioCtx()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.muted ? 0 : 0.5
    this.masterGain.connect(this.ctx.destination)

    this.engineOsc = this.ctx.createOscillator()
    this.engineOsc.type = 'sawtooth'
    this.engineOsc.frequency.value = 55
    this.engineGain = this.ctx.createGain()
    this.engineGain.gain.value = 0
    this.engineOsc.connect(this.engineGain)
    this.engineGain.connect(this.masterGain)
    this.engineOsc.start()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain && this.ctx) this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05)
  }

  isMuted(): boolean {
    return this.muted
  }

  setEngineNote(speedFraction: number): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return
    const clamped = Math.max(0, Math.min(1, speedFraction))
    this.engineOsc.frequency.setTargetAtTime(52 + clamped * 190, this.ctx.currentTime, 0.08)
    this.engineGain.gain.setTargetAtTime(0.015 + clamped * 0.05, this.ctx.currentTime, 0.15)
  }

  private blip(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.22, delay = 0): void {
    if (!this.ctx || !this.masterGain) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(gain, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
    osc.connect(g)
    g.connect(this.masterGain)
    osc.start(t0)
    osc.stop(t0 + duration + 0.05)
  }

  uiClick(): void {
    this.blip(520, 0.06, 'square', 0.14)
  }

  pickup(): void {
    this.blip(660, 0.1, 'square', 0.2)
    this.blip(880, 0.12, 'square', 0.18, 0.07)
  }

  /** Pitch/volume scale with payout size so big orders feel big. */
  chaChing(payout: number): void {
    const scale = Math.min(1, payout / 80)
    const base = 500 + scale * 260
    this.blip(base, 0.14, 'triangle', 0.24)
    this.blip(base * 1.5, 0.16, 'triangle', 0.24, 0.06)
    if (scale > 0.55) this.blip(base * 2, 0.2, 'triangle', 0.22, 0.12)
  }

  cargoLost(): void {
    this.blip(200, 0.3, 'sawtooth', 0.22)
    this.blip(130, 0.35, 'sawtooth', 0.2, 0.1)
  }

  vehicleDamage(): void {
    this.blip(90, 0.14, 'square', 0.24)
  }

  vehicleBrokeDown(): void {
    this.blip(160, 0.2, 'sawtooth', 0.2)
    this.blip(100, 0.3, 'sawtooth', 0.22, 0.14)
    this.blip(60, 0.4, 'sawtooth', 0.22, 0.28)
  }

  milestoneComplete(): void {
    this.blip(392, 0.14, 'triangle', 0.22)
    this.blip(523, 0.16, 'triangle', 0.24, 0.1)
    this.blip(659, 0.18, 'triangle', 0.24, 0.2)
    this.blip(784, 0.28, 'triangle', 0.26, 0.32)
  }

  countdownTick(): void {
    this.blip(920, 0.05, 'square', 0.1)
  }

  levelUp(): void {
    this.blip(523, 0.12, 'triangle', 0.2)
    this.blip(659, 0.12, 'triangle', 0.2, 0.09)
    this.blip(784, 0.18, 'triangle', 0.22, 0.18)
  }

  unlock(): void {
    this.blip(440, 0.1, 'sine', 0.2)
    this.blip(660, 0.14, 'sine', 0.2, 0.08)
  }

  eventSting(kind: string): void {
    switch (kind) {
      case 'rainstorm':
        this.blip(190, 0.4, 'sine', 0.16)
        this.blip(140, 0.5, 'sine', 0.13, 0.1)
        break
      case 'roadClosure':
        this.blip(210, 0.15, 'square', 0.2)
        this.blip(150, 0.15, 'square', 0.2, 0.12)
        break
      case 'trafficJam':
        this.blip(300, 0.12, 'square', 0.16)
        this.blip(260, 0.12, 'square', 0.16, 0.1)
        break
      case 'vipFlashOrder':
        this.blip(700, 0.1, 'triangle', 0.22)
        this.blip(900, 0.14, 'triangle', 0.22, 0.08)
        this.blip(1100, 0.18, 'triangle', 0.24, 0.16)
        break
      case 'milestone':
        this.blip(330, 0.14, 'sine', 0.2)
        this.blip(440, 0.16, 'sine', 0.22, 0.1)
        break
      default:
        this.blip(440, 0.2, 'triangle', 0.18)
    }
  }
}
