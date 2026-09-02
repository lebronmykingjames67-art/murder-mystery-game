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

const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 5.2, 6)
const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 6.5, 6)
const housingGeo = new THREE.BoxGeometry(0.6, 1.7, 0.46)
const bulbGeo = new THREE.SphereGeometry(0.22, 10, 8)
const poleMat = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.7 })
const housingMat = new THREE.MeshStandardMaterial({ color: 0x0e1013, roughness: 0.5 })

const redOnMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2020, emissiveIntensity: 2.4 })
const redOffMat = new THREE.MeshStandardMaterial({ color: 0x3a1414, roughness: 0.9 })
const yellowOnMat = new THREE.MeshStandardMaterial({ color: 0xffd23b, emissive: 0xffbf20, emissiveIntensity: 2.4 })
const yellowOffMat = new THREE.MeshStandardMaterial({ color: 0x3a3314, roughness: 0.9 })
const greenOnMat = new THREE.MeshStandardMaterial({ color: 0x3bff6a, emissive: 0x20ff5a, emissiveIntensity: 2.4 })
const greenOffMat = new THREE.MeshStandardMaterial({ color: 0x123a1e, roughness: 0.9 })

/**
 * Builds one signal fixture at a corner and adds it to the scene: a pole plus a horizontal mast
 * arm that reaches out over the lane (rotationY already points back toward the intersection), so
 * the head hangs above the road an approaching driver is on instead of sitting off to the side.
 */
export function buildTrafficLightRig(scene: THREE.Scene, nodeId: string, x: number, z: number, rotationY: number, phaseOffset: number): TrafficLightRig {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rotationY

  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.y = 2.6
  group.add(pole)

  const arm = new THREE.Mesh(armGeo, poleMat)
  arm.rotation.x = Math.PI / 2
  arm.position.set(0, 5.1, 3.25)
  group.add(arm)

  const housing = new THREE.Mesh(housingGeo, housingMat)
  housing.position.set(0, 4.75, 6.3)
  group.add(housing)

  const red = new THREE.Mesh(bulbGeo, redOffMat)
  red.position.set(0, 5.35, 6.55)
  const yellow = new THREE.Mesh(bulbGeo, yellowOffMat)
  yellow.position.set(0, 4.75, 6.55)
  const green = new THREE.Mesh(bulbGeo, greenOffMat)
  green.position.set(0, 4.15, 6.55)
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
