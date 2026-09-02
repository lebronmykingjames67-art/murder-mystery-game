import * as THREE from 'three'
import type { RoadGraph } from '../core/RoadGraph'
import type { RoadEdge } from '../types'
import type { TrafficLightSystem } from '../systems/TrafficLightSystem'

const TRAFFIC_COLORS = [0xcc3f3f, 0x3f7fcc, 0xd9c93f, 0x7a7a7a, 0x3fa85a, 0xd98a3f]
const RECYCLE_RADIUS = 260
const AGENT_COUNT = 22
const STOP_LINE = 0.86

const brakeOffMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.8 })
const brakeOnMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 1.5 })

function buildTrafficCarMesh(color: number): { group: THREE.Group; wheels: THREE.Mesh[]; brakeLights: THREE.Mesh[] } {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.4 })
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.2), bodyMat)
  chassis.position.y = 0.52
  group.add(chassis)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.5), cabinMat)
  cabin.position.set(0, 1.0, -0.1)
  group.add(cabin)

  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 10)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x141414 })
  const wheels: THREE.Mesh[] = []
  for (const [x, z] of [
    [0.85, 0.95],
    [-0.85, 0.95],
    [0.85, -0.95],
    [-0.85, -0.95],
  ]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.rotation.z = Math.PI / 2
    w.position.set(x, 0.4, z)
    group.add(w)
    wheels.push(w)
  }

  const brakeGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08)
  const brakeLights: THREE.Mesh[] = []
  for (const x of [-0.55, 0.55]) {
    const b = new THREE.Mesh(brakeGeo, brakeOffMat)
    b.position.set(x, 0.5, -1.58)
    group.add(b)
    brakeLights.push(b)
  }

  return { group, wheels, brakeLights }
}

class TrafficAgent {
  x = 0
  z = 0
  heading = 0
  readonly group: THREE.Group
  wheels: THREE.Mesh[]
  brakeLights: THREE.Mesh[]
  atNode: string
  edge: RoadEdge
  target: string
  progress = 0
  speed: number
  braking = false

  constructor(scene: THREE.Scene, atNode: string, edge: RoadEdge) {
    const color = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)]
    const built = buildTrafficCarMesh(color)
    this.group = built.group
    this.wheels = built.wheels
    this.brakeLights = built.brakeLights
    scene.add(this.group)
    this.atNode = atNode
    this.edge = edge
    this.target = edge.from === atNode ? edge.to : edge.from
    this.speed = 5 + Math.random() * 3
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group)
  }
}

export class TrafficManager {
  private agents: TrafficAgent[] = []
  private scene: THREE.Scene
  private graph: RoadGraph

  constructor(scene: THREE.Scene, graph: RoadGraph, unlockedDistricts: Set<string>) {
    this.scene = scene
    this.graph = graph
    for (let i = 0; i < AGENT_COUNT; i++) this.spawnNear(0, 0, unlockedDistricts)
  }

  private usableEdge(edge: RoadEdge, unlockedDistricts: Set<string>): boolean {
    if (edge.closed) return false
    if (edge.locked) return false
    if (edge.vehicleOnly.length > 0) return false
    const from = this.graph.getNode(edge.from)!
    const to = this.graph.getNode(edge.to)!
    return unlockedDistricts.has(from.districtId) && unlockedDistricts.has(to.districtId)
  }

  private spawnNear(px: number, pz: number, unlockedDistricts: Set<string>): void {
    let closestEdge: RoadEdge | undefined
    let closestDist = Infinity
    for (const edge of this.graph.edges.values()) {
      if (!this.usableEdge(edge, unlockedDistricts)) continue
      const from = this.graph.getNode(edge.from)!
      const d = Math.hypot(from.x - px, from.z - pz) + Math.random() * 120
      if (d < closestDist) {
        closestDist = d
        closestEdge = edge
      }
    }
    if (!closestEdge) return
    const agent = new TrafficAgent(this.scene, closestEdge.from, closestEdge)
    this.agents.push(agent)
  }

  private advance(agent: TrafficAgent, unlockedDistricts: Set<string>): void {
    const candidates = this.graph
      .edgesAt(agent.target)
      .filter((e) => this.usableEdge(e, unlockedDistricts) && e.id !== agent.edge.id)
    const next = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : agent.edge
    agent.atNode = agent.target
    agent.edge = next
    agent.target = next.from === agent.atNode ? next.to : next.from
    agent.progress = 0
  }

  update(dt: number, playerX: number, playerZ: number, unlockedDistricts: Set<string>, lights?: TrafficLightSystem): void {
    for (const agent of this.agents) {
      const from = this.graph.getNode(agent.atNode)!
      const to = this.graph.getNode(agent.target)!
      const length = Math.max(0.001, Math.hypot(to.x - from.x, to.z - from.z))
      agent.progress += (agent.speed * dt) / length

      const lightState = lights?.stateAt(agent.target)
      const held = (lightState === 'red' || lightState === 'yellow') && agent.progress > STOP_LINE
      if (held) agent.progress = STOP_LINE
      if (agent.braking !== held) {
        agent.braking = held
        for (const b of agent.brakeLights) b.material = held ? brakeOnMat : brakeOffMat
      }

      if (agent.progress >= 1) this.advance(agent, unlockedDistricts)

      const t = THREE.MathUtils.clamp(agent.progress, 0, 1)
      agent.x = THREE.MathUtils.lerp(from.x, to.x, t)
      agent.z = THREE.MathUtils.lerp(from.z, to.z, t)
      agent.heading = Math.atan2(to.x - from.x, to.z - from.z)
      agent.group.position.set(agent.x, 0, agent.z)
      agent.group.rotation.y = agent.heading
      const spin = held ? 0 : agent.speed * dt * 1.6
      for (const w of agent.wheels) w.rotation.x += spin

      const distToPlayer = Math.hypot(agent.x - playerX, agent.z - playerZ)
      if (distToPlayer > RECYCLE_RADIUS) {
        agent.dispose(this.scene)
      }
    }
    this.agents = this.agents.filter((a) => Math.hypot(a.x - playerX, a.z - playerZ) <= RECYCLE_RADIUS)
    while (this.agents.length < AGENT_COUNT) this.spawnNear(playerX, playerZ, unlockedDistricts)
  }

  positions(): { x: number; z: number }[] {
    return this.agents.map((a) => ({ x: a.x, z: a.z }))
  }
}
