import * as THREE from 'three'
import type { RoadGraph } from '../core/RoadGraph'

const SKIN_TONES = [0xe0a978, 0xc68642, 0x8d5524, 0xffdbac, 0xf1c27d]
const OUTFIT_COLORS = [0x2f6fe0, 0xd6432b, 0x2d8f4e, 0xe0b93a, 0x9b7fd1, 0x5a5a5a, 0xff8a3c]
const RECYCLE_RADIUS = 200
const AGENT_COUNT = 20
const SIDEWALK_OFFSET = 5.5

function buildPedestrianMesh(): THREE.Group {
  const group = new THREE.Group()
  const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)]
  const outfit = OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)]
  const bodyMat = new THREE.MeshStandardMaterial({ color: outfit, roughness: 0.75 })
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.8 })

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 3, 6), bodyMat)
  torso.position.y = 0.5
  group.add(torso)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), skinMat)
  head.position.y = 0.88
  group.add(head)

  const legGeo = new THREE.CapsuleGeometry(0.07, 0.36, 2, 4)
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.08, 0.2, 0)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.08, 0.2, 0)
  group.add(legL, legR)

  return group
}

interface PedestrianAgent {
  group: THREE.Group
  from: THREE.Vector3
  to: THREE.Vector3
  progress: number
  dir: 1 | -1
  speed: number
  bobPhase: number
}

/** Background walkers that pace a short sidewalk-offset segment next to a road edge and reverse at each end. */
export class PedestrianManager {
  private agents: PedestrianAgent[] = []
  private readonly scene: THREE.Scene
  private readonly graph: RoadGraph

  constructor(scene: THREE.Scene, graph: RoadGraph, unlockedDistricts: Set<string>) {
    this.scene = scene
    this.graph = graph
    for (let i = 0; i < AGENT_COUNT; i++) this.spawnNear(0, 0, unlockedDistricts)
  }

  private spawnNear(px: number, pz: number, unlockedDistricts: Set<string>): void {
    let best: { from: THREE.Vector3; to: THREE.Vector3 } | null = null
    let bestScore = Infinity
    for (const edge of this.graph.edges.values()) {
      if (edge.closed || edge.locked || edge.isConnector) continue
      const from = this.graph.getNode(edge.from)!
      const to = this.graph.getNode(edge.to)!
      if (!unlockedDistricts.has(from.districtId) || !unlockedDistricts.has(to.districtId)) continue
      const score = Math.hypot(from.x - px, from.z - pz) + Math.random() * 100
      if (score < bestScore) {
        bestScore = score
        const dx = to.x - from.x
        const dz = to.z - from.z
        const len = Math.max(0.001, Math.hypot(dx, dz))
        const perpX = -dz / len
        const perpZ = dx / len
        const side = Math.random() < 0.5 ? 1 : -1
        const offset = SIDEWALK_OFFSET * side
        best = {
          from: new THREE.Vector3(from.x + perpX * offset, 0, from.z + perpZ * offset),
          to: new THREE.Vector3(to.x + perpX * offset, 0, to.z + perpZ * offset),
        }
      }
    }
    if (!best) return

    const group = buildPedestrianMesh()
    this.scene.add(group)
    this.agents.push({
      group,
      from: best.from,
      to: best.to,
      progress: Math.random(),
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 0.9 + Math.random() * 0.6,
      bobPhase: Math.random() * Math.PI * 2,
    })
  }

  update(dt: number, playerX: number, playerZ: number, unlockedDistricts: Set<string>): void {
    for (const a of this.agents) {
      const segLen = Math.max(0.001, a.from.distanceTo(a.to))
      a.progress += (a.dir * a.speed * dt) / segLen
      if (a.progress >= 1) {
        a.progress = 1
        a.dir = -1
      } else if (a.progress <= 0) {
        a.progress = 0
        a.dir = 1
      }
      const pos = new THREE.Vector3().lerpVectors(a.from, a.to, a.progress)
      a.bobPhase += dt * 7
      pos.y = Math.abs(Math.sin(a.bobPhase)) * 0.05
      a.group.position.copy(pos)
      const facing = (a.dir >= 0 ? a.to : a.from).clone()
      facing.y = pos.y
      if (facing.distanceToSquared(pos) > 0.0001) a.group.lookAt(facing)
    }
    this.agents = this.agents.filter((a) => {
      const midX = (a.from.x + a.to.x) / 2
      const midZ = (a.from.z + a.to.z) / 2
      const keep = Math.hypot(midX - playerX, midZ - playerZ) <= RECYCLE_RADIUS
      if (!keep) this.scene.remove(a.group)
      return keep
    })
    while (this.agents.length < AGENT_COUNT) this.spawnNear(playerX, playerZ, unlockedDistricts)
  }
}
