import * as THREE from 'three'

export type LightState = 'red' | 'yellow' | 'green'

export interface TrafficLightBulbs {
  red: THREE.Mesh
  yellow: THREE.Mesh
  green: THREE.Mesh
}

export interface TrafficLightRig {
  nodeId: string
  bulbs: TrafficLightBulbs
  phaseOffset: number
}

const poleGeo = new THREE.CylinderGeometry(0.09, 0.11, 3.4, 6)
const housingGeo = new THREE.BoxGeometry(0.42, 1.05, 0.32)
const bulbGeo = new THREE.SphereGeometry(0.13, 8, 6)
const poleMat = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.7 })
const housingMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.6 })

const redOnMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2020, emissiveIntensity: 1.6 })
const redOffMat = new THREE.MeshStandardMaterial({ color: 0x3a1414, roughness: 0.9 })
const yellowOnMat = new THREE.MeshStandardMaterial({ color: 0xffd23b, emissive: 0xffbf20, emissiveIntensity: 1.6 })
const yellowOffMat = new THREE.MeshStandardMaterial({ color: 0x3a3314, roughness: 0.9 })
const greenOnMat = new THREE.MeshStandardMaterial({ color: 0x3bff6a, emissive: 0x20ff5a, emissiveIntensity: 1.6 })
const greenOffMat = new THREE.MeshStandardMaterial({ color: 0x123a1e, roughness: 0.9 })

/** Builds one signal fixture (pole + housing + 3 bulbs) at a world position and adds it to the scene. */
export function buildTrafficLightRig(scene: THREE.Scene, nodeId: string, x: number, z: number, rotationY: number, phaseOffset: number): TrafficLightRig {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rotationY

  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.y = 1.7
  group.add(pole)

  const housing = new THREE.Mesh(housingGeo, housingMat)
  housing.position.set(0, 3.5, 0.05)
  group.add(housing)

  const red = new THREE.Mesh(bulbGeo, redOffMat)
  red.position.set(0, 3.82, 0.22)
  const yellow = new THREE.Mesh(bulbGeo, yellowOffMat)
  yellow.position.set(0, 3.5, 0.22)
  const green = new THREE.Mesh(bulbGeo, greenOffMat)
  green.position.set(0, 3.18, 0.22)
  group.add(red, yellow, green)

  scene.add(group)
  return { nodeId, bulbs: { red, yellow, green }, phaseOffset }
}

const GREEN_TIME = 8
const YELLOW_TIME = 1.6
const RED_TIME = 8
const CYCLE = GREEN_TIME + YELLOW_TIME + RED_TIME

function stateAtPhase(phase: number): LightState {
  const t = ((phase % CYCLE) + CYCLE) % CYCLE
  if (t < GREEN_TIME) return 'green'
  if (t < GREEN_TIME + YELLOW_TIME) return 'yellow'
  return 'red'
}

/** Cycles each intersection's signal on its own phase offset; traffic AI queries stateAt() to stop on red. */
export class TrafficLightSystem {
  private readonly rigs: TrafficLightRig[]
  private readonly currentState = new Map<string, LightState>()

  constructor(rigs: TrafficLightRig[]) {
    this.rigs = rigs
    for (const rig of rigs) {
      const state = stateAtPhase(rig.phaseOffset)
      this.currentState.set(rig.nodeId, state)
      this.applyState(rig, state)
    }
  }

  update(now: number): void {
    for (const rig of this.rigs) {
      const state = stateAtPhase(now + rig.phaseOffset)
      if (this.currentState.get(rig.nodeId) !== state) {
        this.currentState.set(rig.nodeId, state)
        this.applyState(rig, state)
      }
    }
  }

  private applyState(rig: TrafficLightRig, state: LightState): void {
    rig.bulbs.red.material = state === 'red' ? redOnMat : redOffMat
    rig.bulbs.yellow.material = state === 'yellow' ? yellowOnMat : yellowOffMat
    rig.bulbs.green.material = state === 'green' ? greenOnMat : greenOffMat
  }

  stateAt(nodeId: string): LightState | undefined {
    return this.currentState.get(nodeId)
  }
}
