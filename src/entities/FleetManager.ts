import * as THREE from 'three'
import { LANE_OFFSET, type RoadGraph } from '../core/RoadGraph'
import { buildVehicleMesh } from './VehicleMesh'
import { makeLabelSprite } from '../world/labels'
import { VEHICLES } from '../data/vehicles'
import type { TrafficLightSystem } from '../systems/TrafficLightSystem'
import type { RoadEdge, StaffMember } from '../types'

const STOP_LINE = 0.86
const MAX_VISIBLE = 12

interface FleetAgent {
  staffId: string
  group: THREE.Group
  wheels: THREE.Mesh[]
  atNode: string
  edge: RoadEdge
  target: string
  progress: number
  speed: number
}

/** Ambient vehicles for hired staff — same road-hopping AI as TrafficManager, tagged with the hire's name. */
export class FleetManager {
  private agents: FleetAgent[] = []
  private readonly scene: THREE.Scene
  private readonly graph: RoadGraph

  constructor(scene: THREE.Scene, graph: RoadGraph) {
    this.scene = scene
    this.graph = graph
  }

  /** Adds/removes ambient vehicles to match the current roster; call whenever staff are hired or fired. */
  syncRoster(staff: StaffMember[], unlockedDistricts: Set<string>): void {
    const visible = staff.slice(0, MAX_VISIBLE)
    const wantedIds = new Set(visible.map((s) => s.id))

    for (let i = this.agents.length - 1; i >= 0; i--) {
      if (!wantedIds.has(this.agents[i].staffId)) {
        this.scene.remove(this.agents[i].group)
        this.agents.splice(i, 1)
      }
    }

    const haveIds = new Set(this.agents.map((a) => a.staffId))
    for (const member of visible) {
      if (!haveIds.has(member.id)) this.spawn(member, unlockedDistricts)
    }
  }

  private usableEdge(e: RoadEdge, unlockedDistricts: Set<string>): boolean {
    if (e.closed || e.locked) return false
    if (e.vehicleOnly.length > 0) return false
    const from = this.graph.getNode(e.from)!
    const to = this.graph.getNode(e.to)!
    return unlockedDistricts.has(from.districtId) && unlockedDistricts.has(to.districtId)
  }

  private spawn(member: StaffMember, unlockedDistricts: Set<string>): void {
    const edges = [...this.graph.edges.values()].filter((e) => this.usableEdge(e, unlockedDistricts))
    if (edges.length === 0) return
    const edge = edges[Math.floor(Math.random() * edges.length)]

    const def = VEHICLES[member.vehicleTier]
    const built = buildVehicleMesh(def)
    const tag = makeLabelSprite(member.name, { color: '#0b1a0f', bg: 'rgba(120,255,170,0.92)', scale: 0.02 })
    tag.position.y = 2.7
    built.group.add(tag)
    this.scene.add(built.group)

    this.agents.push({
      staffId: member.id,
      group: built.group,
      wheels: built.wheels,
      atNode: edge.from,
      edge,
      target: edge.to,
      progress: Math.random(),
      speed: Math.max(3, def.topSpeed * 0.6),
    })
  }

  private advance(agent: FleetAgent, unlockedDistricts: Set<string>): void {
    const candidates = this.graph.edgesAt(agent.target).filter((e) => this.usableEdge(e, unlockedDistricts) && e.id !== agent.edge.id)
    const next = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : agent.edge
    agent.atNode = agent.target
    agent.edge = next
    agent.target = next.from === agent.atNode ? next.to : next.from
    agent.progress = 0
  }

  update(dt: number, unlockedDistricts: Set<string>, lights?: TrafficLightSystem): void {
    for (const agent of this.agents) {
      const from = this.graph.getNode(agent.atNode)!
      const to = this.graph.getNode(agent.target)!
      const length = Math.max(0.001, Math.hypot(to.x - from.x, to.z - from.z))
      agent.progress += (agent.speed * dt) / length

      const lightState = lights?.stateAt(agent.target)
      if ((lightState === 'red' || lightState === 'yellow') && agent.progress > STOP_LINE) {
        agent.progress = STOP_LINE
      }

      if (agent.progress >= 1) this.advance(agent, unlockedDistricts)

      const t = THREE.MathUtils.clamp(agent.progress, 0, 1)
      const baseX = THREE.MathUtils.lerp(from.x, to.x, t)
      const baseZ = THREE.MathUtils.lerp(from.z, to.z, t)
      const dirX = (to.x - from.x) / length
      const dirZ = (to.z - from.z) / length
      agent.group.position.set(baseX + dirZ * LANE_OFFSET, 0, baseZ - dirX * LANE_OFFSET)
      agent.group.rotation.y = Math.atan2(to.x - from.x, to.z - from.z)
      const spin = agent.speed * dt * 1.6
      for (const w of agent.wheels) w.rotation.x += spin
    }
  }

  dispose(): void {
    for (const agent of this.agents) this.scene.remove(agent.group)
    this.agents = []
  }
}
