import * as THREE from 'three'
import type { RoadGraph } from '../core/RoadGraph'
import { seededRandom } from '../core/RoadGraph'
import { DISTRICTS } from '../data/districts'
import type { Collider, DistrictDef, RoadNode } from '../types'
import { makeLabelSprite } from './labels'

export interface DistrictBounds {
  id: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  centerX: number
  centerZ: number
}

export interface CityBuildResult {
  colliders: Collider[]
  barriersByRoute: Map<string, THREE.Object3D[]>
  districtBounds: DistrictBounds[]
  depotPosition: { x: number; z: number }
  markerGroup: THREE.Group
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const LAMP_POLE_GEO = new THREE.CylinderGeometry(0.18, 0.22, 1, 6)
const LAMP_HEAD_GEO = new THREE.SphereGeometry(0.55, 8, 6)

const tmpMatrix = new THREE.Matrix4()
const tmpPos = new THREE.Vector3()
const tmpQuat = new THREE.Quaternion()
const tmpScale = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const tmpColor = new THREE.Color()

function districtBoundsOf(district: DistrictDef): DistrictBounds {
  const margin = district.blockSize * 0.6
  const minX = district.origin.x - margin
  const maxX = district.origin.x + (district.gridCols - 1) * district.blockSize + margin
  const minZ = district.origin.z - margin
  const maxZ = district.origin.z + (district.gridRows - 1) * district.blockSize + margin
  return { id: district.id, minX, maxX, minZ, maxZ, centerX: (minX + maxX) / 2, centerZ: (minZ + maxZ) / 2 }
}

export function buildCity(scene: THREE.Scene, graph: RoadGraph): CityBuildResult {
  const colliders: Collider[] = []
  const barriersByRoute = new Map<string, THREE.Object3D[]>()
  const districtBounds: DistrictBounds[] = []
  const markerGroup = new THREE.Group()
  markerGroup.name = 'order-markers'
  scene.add(markerGroup)

  const districtById = new Map(DISTRICTS.map((d) => [d.id, d]))

  // ---- Grounds + buildings + streetlights, per district ----
  for (const district of DISTRICTS) {
    const bounds = districtBoundsOf(district)
    districtBounds.push(bounds)

    const groundGeo = new THREE.PlaneGeometry(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ)
    const groundMat = new THREE.MeshStandardMaterial({ color: district.groundColor, roughness: 1 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(bounds.centerX, -0.06, bounds.centerZ)
    scene.add(ground)

    const entrySign = makeLabelSprite(district.name.toUpperCase(), { color: '#ffd76a', scale: 0.017 })
    entrySign.position.set(district.origin.x, 22, district.origin.z - district.blockSize * 0.5)
    scene.add(entrySign)

    const rand = seededRandom(`${district.id}_bld`)
    const depot = graph.depotNode()
    const skipDensity = district.sparse ? 0.45 : 0.12

    for (let col = 0; col < district.gridCols - 1; col++) {
      for (let row = 0; row < district.gridRows - 1; row++) {
        const cx = district.origin.x + (col + 0.5) * district.blockSize
        const cz = district.origin.z + (row + 0.5) * district.blockSize
        if (Math.hypot(cx - depot.x, cz - depot.z) < district.blockSize * 1.05) continue
        if (rand() < skipDensity) continue

        const footprint = district.blockSize * (0.45 + rand() * 0.28)
        const height = district.minBuildingHeight + rand() * (district.maxBuildingHeight - district.minBuildingHeight)
        const color = district.buildingPalette[Math.floor(rand() * district.buildingPalette.length)]
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 })
        const mesh = new THREE.Mesh(UNIT_BOX, mat)
        mesh.scale.set(footprint, height, footprint)
        mesh.position.set(cx, height / 2, cz)
        scene.add(mesh)

        colliders.push({ x: cx, z: cz, radius: (footprint / 2) * 1.08, kind: 'building' })
      }
    }

    // Sparse streetlights at a subset of intersections.
    for (const node of graph.nodes.values()) {
      if (node.districtId !== district.id || node.poiName) continue
      const key = `${Math.round((node.x - district.origin.x) / district.blockSize)},${Math.round((node.z - district.origin.z) / district.blockSize)}`
      const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0)
      if (hash % 3 !== 0) continue
      const offset = district.blockSize * 0.3
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      const pole = new THREE.Mesh(LAMP_POLE_GEO, poleMat)
      pole.scale.set(1, 4.5, 1)
      pole.position.set(node.x + offset, 2.25, node.z + offset)
      scene.add(pole)
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: 0xffdf8a, emissiveIntensity: 0.9 })
      const head = new THREE.Mesh(LAMP_HEAD_GEO, headMat)
      head.position.set(node.x + offset, 4.6, node.z + offset)
      scene.add(head)
    }
  }

  // ---- Roads (instanced) ----
  const edgeList = [...graph.edges.values()]
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 1 })
  const roadMesh = new THREE.InstancedMesh(UNIT_BOX, roadMat, edgeList.length)
  edgeList.forEach((edge, i) => {
    const from = graph.getNode(edge.from)!
    const to = graph.getNode(edge.to)!
    const dx = to.x - from.x
    const dz = to.z - from.z
    const length = Math.hypot(dx, dz)
    const angle = Math.atan2(dx, dz)
    const width = edge.isConnector ? 11 : 8
    tmpPos.set((from.x + to.x) / 2, edge.isConnector ? 0.1 : 0.02, (from.z + to.z) / 2)
    tmpQuat.setFromAxisAngle(UP, angle)
    tmpScale.set(width, 0.16, length + width * 0.15)
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale)
    roadMesh.setMatrixAt(i, tmpMatrix)
    const district = districtById.get(from.districtId) ?? districtById.get(to.districtId)
    tmpColor.set(edge.isConnector ? 0x53565c : (district?.roadColor ?? 0x3a3d42))
    roadMesh.setColorAt(i, tmpColor)
  })
  roadMesh.instanceMatrix.needsUpdate = true
  if (roadMesh.instanceColor) roadMesh.instanceColor.needsUpdate = true
  scene.add(roadMesh)

  // ---- Depot landmark ----
  const depot = graph.depotNode()
  const padMat = new THREE.MeshStandardMaterial({ color: 0xffb200, emissive: 0xffb200, emissiveIntensity: 0.35, roughness: 0.6 })
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.15, 24), padMat)
  pad.position.set(depot.x, 0.02, depot.z)
  scene.add(pad)
  for (const [ox, oz] of [
    [-8, -8],
    [8, -8],
    [-8, 8],
    [8, 8],
  ]) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x22252b })
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 8), postMat)
    post.position.set(depot.x + ox, 3.5, depot.z + oz)
    scene.add(post)
  }
  const depotLabel = makeLabelSprite('DEPOT — SHOP & SAVE', { color: '#111319', bg: 'rgba(255,178,0,0.95)', scale: 0.016 })
  depotLabel.position.set(depot.x, 11, depot.z)
  scene.add(depotLabel)

  // ---- Locked connector / shortcut barriers ----
  for (const edge of graph.edges.values()) {
    if (!edge.locked || !edge.unlockRouteId) continue
    const from = graph.getNode(edge.from)!
    const to = graph.getNode(edge.to)!
    const dx = to.x - from.x
    const dz = to.z - from.z
    const angle = Math.atan2(dx, dz)
    const mx = (from.x + to.x) / 2
    const mz = (from.z + to.z) / 2

    const group = new THREE.Group()
    group.position.set(mx, 0, mz)
    group.rotation.y = angle

    const beamMat = new THREE.MeshStandardMaterial({ color: 0xd6432b, emissive: 0x5a1608, roughness: 0.5 })
    const beam = new THREE.Mesh(UNIT_BOX, beamMat)
    beam.scale.set(edge.isConnector ? 12 : 6, 0.6, 0.6)
    beam.position.y = 2.2
    group.add(beam)
    for (const side of [-1, 1]) {
      const postMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.4, 8), postMat)
      post.position.set(side * (edge.isConnector ? 5.6 : 2.7), 2.2, 0)
      group.add(post)
    }
    const sign = makeLabelSprite('LOCKED', { color: '#fff', bg: 'rgba(120,20,10,0.92)' })
    sign.position.set(0, 4.4, 0)
    group.add(sign)

    scene.add(group)
    const list = barriersByRoute.get(edge.unlockRouteId) ?? []
    list.push(group)
    barriersByRoute.set(edge.unlockRouteId, list)
    colliders.push({ x: mx, z: mz, radius: 3, kind: 'barrier', routeId: edge.unlockRouteId })
  }

  return { colliders, barriersByRoute, districtBounds, depotPosition: { x: depot.x, z: depot.z }, markerGroup }
}

export function districtAt(bounds: DistrictBounds[], x: number, z: number): string | null {
  for (const b of bounds) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return b.id
  }
  return null
}

export function nearestPoiLabel(node: RoadNode): string {
  return node.poiName ?? `Node ${node.id}`
}
