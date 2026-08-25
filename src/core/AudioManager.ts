// All sound in ONE MORE FLOOR is synthesized at runtime with the WebAudio API — there is no
// asset pipeline for sound files, so footsteps, dings, alarms and the ambient music beds are
// all generated from oscillators/noise. This keeps the build tiny and lets intensity/pitch
// react instantly to gameplay instead of crossfading between pre-baked clips.

export type MusicIntensity = 'calm' | 'tense' | 'danger' | 'chase'

interface Volumes {
  master: number
  music: number
  sfx: number
}

class NoiseBufferCache {
  private buffer: AudioBuffer | null = null
  get(ctx: AudioContext): AudioBuffer {
    if (this.buffer && this.buffer.sampleRate === ctx.sampleRate) return this.buffer
    const length = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    this.buffer = buffer
    return buffer
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private noiseCache = new NoiseBufferCache()
  private volumes: Volumes = { master: 0.8, music: 0.7, sfx: 0.9 }

  private droneNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  private droneFilter: BiquadFilterNode | null = null
  private musicIntensity: MusicIntensity = 'calm'
  private pulseTimer = 0
  private started = false

  /** Must be called from a user gesture (click/keydown) to satisfy autoplay policy. */
  ensureStarted(): void {
    if (this.started) {
      if (this.ctx?.state === 'suspended') void this.ctx.resume()
      return
    }
    this.started = true
    const ctx = new AudioContext()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = this.volumes.master
    master.connect(ctx.destination)
    const music = ctx.createGain()
    music.gain.value = this.volumes.music
    music.connect(master)
    const sfx = ctx.createGain()
    sfx.gain.value = this.volumes.sfx
    sfx.connect(master)
    this.masterGain = master
    this.musicGain = music
    this.sfxGain = sfx
    this.startDrone()
  }

  setVolumes(v: Partial<Volumes>): void {
    this.volumes = { ...this.volumes, ...v }
    const t = this.ctx?.currentTime ?? 0
    this.masterGain?.gain.setTargetAtTime(this.volumes.master, t, 0.05)
    this.musicGain?.gain.setTargetAtTime(this.volumes.music, t, 0.05)
    this.sfxGain?.gain.setTargetAtTime(this.volumes.sfx, t, 0.05)
  }

  // ---- ambient music bed -------------------------------------------------

  private startDrone(): void {
    const ctx = this.ctx
    const music = this.musicGain
    if (!ctx || !music) return
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    filter.connect(music)
    this.droneFilter = filter

    const freqs = [55, 82.4, 110, 164.8]
    const types: OscillatorType[] = ['sine', 'sine', 'triangle', 'sine']
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.type = types[i]
      osc.frequency.value = f
      osc.detune.value = (Math.random() - 0.5) * 6
      const gain = ctx.createGain()
      gain.gain.value = i === 0 ? 0.16 : 0.05
      osc.connect(gain)
      gain.connect(filter)
      osc.start()
      this.droneNodes.push({ osc, gain })
    })

    // Slow LFO breathing on the filter so the drone doesn't feel static.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.06
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 220
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()
  }

  setMusicIntensity(level: MusicIntensity): void {
    this.musicIntensity = level
    const filter = this.droneFilter
    const ctx = this.ctx
    if (!filter || !ctx) return
    const t = ctx.currentTime
    const targets: Record<MusicIntensity, { cutoff: number; gains: number[] }> = {
      calm: { cutoff: 700, gains: [0.14, 0.04, 0.03, 0.02] },
      tense: { cutoff: 950, gains: [0.16, 0.07, 0.05, 0.04] },
      danger: { cutoff: 1300, gains: [0.18, 0.09, 0.07, 0.06] },
      chase: { cutoff: 1800, gains: [0.2, 0.12, 0.09, 0.08] },
    }
    const cfg = targets[level]
    filter.frequency.setTargetAtTime(cfg.cutoff, t, 0.8)
    this.droneNodes.forEach((n, i) => n.gain.gain.setTargetAtTime(cfg.gains[i] ?? 0.05, t, 0.8))
  }

  /** Call once per frame with dt seconds; drives the chase heartbeat pulse. */
  update(dt: number): void {
    if (!this.ctx) return
    if (this.musicIntensity === 'chase' || this.musicIntensity === 'danger') {
      this.pulseTimer -= dt
      if (this.pulseTimer <= 0) {
        const interval = this.musicIntensity === 'chase' ? 0.52 : 0.9
        this.pulseTimer = interval
        this.pulse()
      }
    }
  }

  private pulse(): void {
    const ctx = this.ctx
    const music = this.musicGain
    if (!ctx || !music) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 60
    const gain = ctx.createGain()
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    osc.connect(gain)
    gain.connect(music)
    osc.start(t)
    osc.stop(t + 0.3)
  }

  // ---- sfx primitives -----------------------------------------------------

  private tone(freq: number, duration: number, type: OscillatorType, peak: number, opts?: { freqEnd?: number; delay?: number }): void {
    const ctx = this.ctx
    const sfx = this.sfxGain
    if (!ctx || !sfx) return
    const t = ctx.currentTime + (opts?.delay ?? 0)
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (opts?.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), t + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.02, duration * 0.3))
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain)
    gain.connect(sfx)
    osc.start(t)
    osc.stop(t + duration + 0.02)
  }

  private noise(duration: number, peak: number, filterFreq: number, filterType: BiquadFilterType = 'bandpass', delay = 0): void {
    const ctx = this.ctx
    const sfx = this.sfxGain
    if (!ctx || !sfx) return
    const t = ctx.currentTime + delay
    const src = ctx.createBufferSource()
    src.buffer = this.noiseCache.get(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = filterFreq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(sfx)
    src.start(t)
    src.stop(t + duration + 0.02)
  }

  // ---- gameplay sfx ---------------------------------------------------------

  footstep(sprinting: boolean): void {
    const peak = sprinting ? 0.22 : 0.14
    this.noise(0.07, peak, 320 + Math.random() * 120, 'bandpass')
    this.tone(70 + Math.random() * 15, 0.05, 'sine', peak * 0.5)
  }

  jump(): void {
    this.tone(220, 0.18, 'sine', 0.18, { freqEnd: 340 })
  }

  land(hard: boolean): void {
    this.noise(0.12, hard ? 0.3 : 0.16, 180, 'lowpass')
  }

  interact(): void {
    this.tone(520, 0.08, 'triangle', 0.16, { freqEnd: 720 })
  }

  uiHover(): void {
    this.tone(440, 0.05, 'sine', 0.06)
  }

  uiClick(): void {
    this.tone(660, 0.07, 'triangle', 0.12, { freqEnd: 880 })
  }

  doorOpen(locked?: boolean): void {
    if (locked) {
      this.tone(180, 0.12, 'square', 0.14)
      this.noise(0.1, 0.12, 400, 'bandpass', 0.05)
      return
    }
    this.noise(0.35, 0.14, 260, 'lowpass')
    this.tone(140, 0.3, 'sine', 0.08, { freqEnd: 100 })
  }

  doorClose(): void {
    this.noise(0.18, 0.18, 220, 'lowpass')
  }

  elevatorDing(): void {
    this.tone(880, 0.4, 'sine', 0.18)
    this.tone(1320, 0.5, 'sine', 0.12, { delay: 0.08 })
  }

  elevatorHum(on: boolean): void {
    if (on) this.tone(90, 1.2, 'sawtooth', 0.05)
  }

  money(): void {
    this.tone(980, 0.09, 'triangle', 0.16, { freqEnd: 1400 })
    this.tone(1400, 0.12, 'sine', 0.1, { delay: 0.05 })
  }

  damage(): void {
    this.noise(0.22, 0.28, 200, 'lowpass')
    this.tone(140, 0.2, 'sawtooth', 0.14, { freqEnd: 60 })
  }

  switchOn(): void {
    this.tone(340, 0.1, 'square', 0.14, { freqEnd: 520 })
  }

  switchWrong(): void {
    this.tone(180, 0.28, 'sawtooth', 0.16, { freqEnd: 90 })
  }

  alarm(): void {
    this.tone(660, 0.3, 'square', 0.14, { freqEnd: 440 })
    this.tone(660, 0.3, 'square', 0.14, { freqEnd: 440, delay: 0.5 })
  }

  floorComplete(): void {
    ;[523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.14, { delay: i * 0.12 }))
  }

  cashOut(): void {
    ;[392, 523, 659, 784, 987].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.15, { delay: i * 0.09 }))
  }

  riskIt(): void {
    this.tone(160, 0.5, 'sawtooth', 0.16, { freqEnd: 80 })
    this.noise(0.4, 0.12, 300, 'bandpass', 0.1)
  }

  death(): void {
    this.tone(220, 0.9, 'sawtooth', 0.2, { freqEnd: 40 })
  }

  enemyGrowl(distanceFactor: number): void {
    // distanceFactor: 0 (far) .. 1 (close)
    this.noise(0.3, 0.06 + distanceFactor * 0.2, 120 + distanceFactor * 80, 'lowpass')
  }
}

export const audioManager = new AudioManager()
