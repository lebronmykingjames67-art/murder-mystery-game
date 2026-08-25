import * as THREE from 'three'
import { emissivePanel, type FloorMood } from './Materials'
import { boxMesh } from './Geometries'
import { Rng } from '../utils/rng'

export interface MoodLightConfig {
  ambient: string
  ambientIntensity: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  fixtureColor: string
  fixtureIntensity: number
  fixtureDistance: number
  fogColor: string
  fogDensity: number
}

// Point light intensity is physically-based (candela) in this three.js version, so fixtures
// need much bigger numbers than the old "classic" lighting model to actually read as lit —
// tuned empirically against screenshots rather than derived analytically.
const MOOD_LIGHT: Record<FloorMood, MoodLightConfig> = {
  lobby: { ambient: '#3a3d4a', ambientIntensity: 0.8, hemiSky: '#4c5266', hemiGround: '#15161a', hemiIntensity: 0.55, fixtureColor: '#e8dcb8', fixtureIntensity: 38, fixtureDistance: 10, fogColor: '#101114', fogDensity: 0.014 },
  neutral: { ambient: '#3a3d42', ambientIntensity: 0.62, hemiSky: '#454a52', hemiGround: '#101012', hemiIntensity: 0.5, fixtureColor: '#e8e2c8', fixtureIntensity: 32, fixtureDistance: 9.5, fogColor: '#0d0e10', fogDensity: 0.02 },
  chase: { ambient: '#2a2a30', ambientIntensity: 0.4, hemiSky: '#33333a', hemiGround: '#08080a', hemiIntensity: 0.32, fixtureColor: '#cdd0d8', fixtureIntensity: 22, fixtureDistance: 8.5, fogColor: '#08080a', fogDensity: 0.032 },
  puzzle: { ambient: '#243238', ambientIntensity: 0.56, hemiSky: '#2c3e44', hemiGround: '#0a1214', hemiIntensity: 0.42, fixtureColor: '#8ff0e0', fixtureIntensity: 30, fixtureDistance: 9, fogColor: '#0a1214', fogDensity: 0.022 },
  loot: { ambient: '#3a3020', ambientIntensity: 0.58, hemiSky: '#463c26', hemiGround: '#120e08', hemiIntensity: 0.45, fixtureColor: '#ffce7a', fixtureIntensity: 32, fixtureDistance: 9, fogColor: '#0c0a06', fogDensity: 0.026 },
  darkness: { ambient: '#141418', ambientIntensity: 0.22, hemiSky: '#1a1a1e', hemiGround: '#050506', hemiIntensity: 0.16, fixtureColor: '#c94040', fixtureIntensity: 14, fixtureDistance: 7, fogColor: '#050506', fogDensity: 0.044 },
  chaos: { ambient: '#2e2030', ambientIntensity: 0.48, hemiSky: '#3a2438', hemiGround: '#100810', hemiIntensity: 0.38, fixtureColor: '#e05a8a', fixtureIntensity: 28, fixtureDistance: 8.5, fogColor: '#0e0810', fogDensity: 0.03 },
}

interface Fixture {
  light: THREE.PointLight
  baseIntensity: number
  flicker: boolean
  severity: number
  timer: number
  bulb: THREE.Mesh
}

/**
 * Ambient + per-fixture lighting for one scene (the lobby or a generated floor). Every floor
 * mood gets its own palette so a Loot floor reads warm/inviting while a Darkness floor reads
 * as barely-lit without ever going fully black (the brief is explicit: navigable, not pitch
 * black).
 */
export class LightingRig {
  private root: THREE.Group
  private scene: THREE.Scene
  private config: MoodLightConfig
  private ambientLight: THREE.AmbientLight
  private hemiLight: THREE.HemisphereLight
  private fixtures: Fixture[] = []
  private rng = new Rng(Date.now() & 0xffffffff)

  constructor(root: THREE.Group, scene: THREE.Scene, mood: FloorMood) {
    this.root = root
    this.scene = scene
    this.config = MOOD_LIGHT[mood]

    this.ambientLight = new THREE.AmbientLight(this.config.ambient, this.config.ambientIntensity)
    this.hemiLight = new THREE.HemisphereLight(this.config.hemiSky, this.config.hemiGround, this.config.hemiIntensity)
    this.root.add(this.ambientLight, this.hemiLight)

    scene.fog = new THREE.FogExp2(this.config.fogColor, this.config.fogDensity)
  }

  /** Places a ceiling light fixture (visible emissive housing + real point light) at a spot. */
  addFixture(position: THREE.Vector3, opts: { flicker?: boolean; severity?: number; colorOverride?: string } = {}): void {
    const color = opts.colorOverride ?? this.config.fixtureColor
    const intensity = this.config.fixtureIntensity
    const light = new THREE.PointLight(color, intensity, this.config.fixtureDistance, 2)
    light.position.copy(position)
    this.root.add(light)

    const bulb = boxMesh(emissivePanel(color, 1.6), 0.7, 0.08, 0.22)
    bulb.position.copy(position)
    bulb.position.y -= 0.05
    this.root.add(bulb)

    this.fixtures.push({
      light,
      baseIntensity: intensity,
      flicker: opts.flicker ?? false,
      severity: opts.severity ?? 0.5,
      timer: this.rng.range(0.3, 1.4),
      bulb,
    })
  }

  setAllFlicker(enabled: boolean, severity = 0.5): void {
    this.fixtures.forEach((f) => {
      f.flicker = enabled
      f.severity = severity
    })
  }

  /** Briefly kills every fixture then restores it — used by random events ("lights shut off"). */
  blackout(seconds: number): void {
    this.fixtures.forEach((f) => {
      f.light.intensity = 0
      f.bulb.visible = false
    })
    window.setTimeout(() => {
      this.fixtures.forEach((f) => {
        f.light.intensity = f.baseIntensity
        f.bulb.visible = true
      })
    }, seconds * 1000)
  }

  update(dt: number): void {
    for (const f of this.fixtures) {
      if (!f.flicker) continue
      f.timer -= dt
      if (f.timer <= 0) {
        f.timer = this.rng.range(0.05, 0.5) * (1 - f.severity * 0.5)
        const dim = this.rng.chance(0.25 + f.severity * 0.4)
        f.light.intensity = dim ? f.baseIntensity * this.rng.range(0, 0.25) : f.baseIntensity
        f.bulb.visible = !dim || this.rng.chance(0.4)
      }
    }
  }

  dispose(): void {
    this.scene.fog = null
  }
}
