import * as THREE from 'three'
import type { VoiceId } from '../types'

export interface VoiceParams {
  duration: number
  pitchMul?: number
  warbleMul?: number
  roughnessMul?: number
}

const VOICE_PRESETS: Record<Exclude<VoiceId, 'none'>, { pitch: number; warble: number; roughness: number }> = {
  A: { pitch: 150, warble: 2.2, roughness: 0.18 },
  B: { pitch: 215, warble: 8.5, roughness: 0.34 },
}

export class AudioEngine {
  listener: THREE.AudioListener
  ctx: AudioContext
  master: GainNode
  private noiseBuffer: AudioBuffer
  private dreadGain: GainNode
  private dread = 0
  private heartbeatTimer = 1.2

  constructor(camera: THREE.Object3D) {
    this.listener = new THREE.AudioListener()
    camera.add(this.listener)
    this.ctx = this.listener.context
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.85
    this.master.connect(this.ctx.destination)
    this.noiseBuffer = this.buildNoiseBuffer(2)
    this.dreadGain = this.ctx.createGain()
    this.dreadGain.gain.value = 0
    this.dreadGain.connect(this.master)
    this.startDreadBed()
  }

  async resume() {
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  private buildNoiseBuffer(seconds: number): AudioBuffer {
    const len = Math.floor(this.ctx.sampleRate * seconds)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    return buf
  }

  /** Looping static hiss. Optionally spatialized to an object's world position (snapshotted on start + via updatePos()). */
  createStaticVoice(volume = 0.3, positional?: THREE.Object3D) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2600
    filter.Q.value = 0.6
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    src.connect(filter).connect(gain)

    let updatePos = () => {}
    if (positional) {
      const panner = this.ctx.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1.5
      panner.rolloffFactor = 1.3
      gain.connect(panner).connect(this.master)
      const p = new THREE.Vector3()
      updatePos = () => {
        positional.getWorldPosition(p)
        panner.positionX.value = p.x
        panner.positionY.value = p.y
        panner.positionZ.value = p.z
      }
      updatePos()
    } else {
      gain.connect(this.master)
    }
    src.start()
    return {
      stop: () => {
        try {
          src.stop()
        } catch {
          /* already stopped */
        }
      },
      setVolume: (v: number) => (gain.gain.value = v),
      updatePos,
    }
  }

  /** Stylized procedural "voice" — abstracted murmur synced to a subtitle line, not real speech. */
  playVoiceMurmur(voice: Exclude<VoiceId, 'none'>, opts: VoiceParams) {
    const preset = VOICE_PRESETS[voice]
    const basePitch = preset.pitch * (opts.pitchMul ?? 1)
    const warble = preset.warble * (opts.warbleMul ?? 1)
    const roughness = Math.min(1, preset.roughness * (opts.roughnessMul ?? 1))
    const duration = opts.duration

    const now = this.ctx.currentTime
    const out = this.ctx.createGain()
    out.gain.value = 0
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = basePitch * 2.2
    filter.Q.value = 3.2
    filter.connect(out).connect(this.master)

    const stopAt = now + duration + 0.05
    for (const ratio of [1, 1.5, 2.01]) {
      const osc = this.ctx.createOscillator()
      osc.type = ratio === 1 ? 'sawtooth' : 'triangle'
      osc.frequency.value = basePitch * ratio
      const lfo = this.ctx.createOscillator()
      lfo.frequency.value = warble * (0.8 + Math.random() * 0.4)
      const lfoGain = this.ctx.createGain()
      lfoGain.gain.value = basePitch * ratio * 0.03
      lfo.connect(lfoGain).connect(osc.frequency)
      osc.connect(filter)
      lfo.start(now)
      osc.start(now)
      lfo.stop(stopAt)
      osc.stop(stopAt)
    }

    let t = now
    const end = now + duration
    while (t < end) {
      const burst = 0.06 + Math.random() * 0.14
      const gap = Math.random() < roughness ? 0.02 + Math.random() * 0.06 : 0.008
      out.gain.setValueAtTime(0, t)
      out.gain.linearRampToValueAtTime(0.55, Math.min(end, t + burst * 0.25))
      out.gain.linearRampToValueAtTime(0, Math.min(end, t + burst))
      t += burst + gap
    }

    return new Promise<void>((resolve) => setTimeout(resolve, duration * 1000))
  }

  playStaticBurst(volume = 0.6, duration = 0.4) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const g = this.ctx.createGain()
    const now = this.ctx.currentTime
    g.gain.setValueAtTime(volume, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)
    src.connect(g).connect(this.master)
    src.start(now)
    src.stop(now + duration + 0.05)
  }

  /** 0 = calm, 1 = maximum dread. Drives the ambient drone bed + heartbeat cadence. */
  setDread(amount: number) {
    this.dread = Math.max(0, Math.min(1, amount))
  }

  private startDreadBed() {
    const now = this.ctx.currentTime
    const freqs = [55, 55 * 1.5, 55 * 2.005]
    for (const f of freqs) {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const g = this.ctx.createGain()
      g.gain.value = 1 / freqs.length
      osc.connect(g).connect(this.dreadGain)
      osc.start(now)
    }
    const tick = () => {
      const target = 0.015 + this.dread * 0.16
      this.dreadGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4)
      requestAnimationFrame(tick)
    }
    tick()
  }

  update(dt: number) {
    this.heartbeatTimer -= dt
    if (this.dread > 0.35 && this.heartbeatTimer <= 0) {
      this.playThump()
      this.heartbeatTimer = 1.1 - this.dread * 0.6
    }
  }

  private playThump() {
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(70, now)
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.5, now + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
    osc.connect(g).connect(this.master)
    osc.start(now)
    osc.stop(now + 0.4)
  }
}
