import * as THREE from 'three'
import { LANE_OFFSET, RoadGraph } from './RoadGraph'
import { buildCity, districtAt } from '../world/CityBuilder'
import type { CityBuildResult } from '../world/CityBuilder'
import { PlayerVehicle } from '../entities/PlayerVehicle'
import { TrafficManager } from '../entities/TrafficAgent'
import { PedestrianManager } from '../entities/Pedestrian'
import { FleetManager } from '../entities/FleetManager'
import { RainSystem } from '../entities/RainSystem'
import { buildSkySprite, disposeSkySprite } from '../world/sky'
import { ChaseCamera } from './ChaseCamera'
import { InputManager, KEYS } from './InputManager'
import { GameLoop } from './GameLoop'
import { AudioManager } from './AudioManager'
import { OrderSystem } from '../systems/OrderSystem'
import type { OrderSystemEvent } from '../systems/OrderSystem'
import { EventManager } from '../systems/EventManager'
import type { EventWorldState, GameEvent } from '../systems/EventManager'
import { ReputationSystem } from '../systems/ReputationSystem'
import { TrafficLightSystem } from '../systems/TrafficLightSystem'
import { BusinessSystem } from '../systems/BusinessSystem'
import { computeEffectiveStats, nextUpgradeCost, vehicleDef } from '../systems/UpgradeSystem'
import { VEHICLES, VEHICLE_MAX_HEALTH, REPAIR_FULL_COST } from '../data/vehicles'
import { DISTRICTS } from '../data/districts'
import { PROPERTIES, HIRE_COST } from '../data/business'
import { MILESTONES } from '../data/milestones'
import { loadSave, writeSave, SAVE_VERSION } from './SaveSystem'
import { useGameStore } from '../state/gameStore'
import { dayCycle } from './time'
import type { NavInfo, Order, RoadNode, RunStats, SaveData, UpgradeSlotType, VehicleTierId } from '../types'

const DEPOT_RADIUS = 10
const AUTOSAVE_INTERVAL = 12

interface NavRoute {
  nodes: RoadNode[]
  turnIndex: number
  maneuver: NavInfo['maneuver']
  targetLabel: string
}

export class GameEngine {
  private readonly scene = new THREE.Scene()
  private readonly renderer: THREE.WebGLRenderer
  private readonly camera: ChaseCamera
  private readonly graph = new RoadGraph()
  private readonly city: CityBuildResult
  private readonly input = new InputManager()
  private readonly audio = new AudioManager()
  private readonly loop: GameLoop
  private readonly reputation: ReputationSystem
  private readonly orders = new OrderSystem()
  private readonly events: EventManager
  private readonly traffic: TrafficManager
  private readonly trafficLights: TrafficLightSystem
  private readonly pedestrians: PedestrianManager
  private readonly business: BusinessSystem
  private readonly fleet: FleetManager
  private readonly rain: RainSystem
  private readonly vehicle: PlayerVehicle
  private readonly sun: THREE.DirectionalLight
  private readonly ambient: THREE.AmbientLight
  private readonly sunSprite: THREE.Sprite
  private readonly moonSprite: THREE.Sprite
  private readonly fog: THREE.Fog
  private readonly navCamera = new THREE.PerspectiveCamera(58, 1.4, 0.1, 500)
  private navRenderer: THREE.WebGLRenderer | null = null
  private navFrameSkip = 0

  private cash: number
  private readonly ownedVehicles: Set<VehicleTierId>
  private equippedVehicle: VehicleTierId
  private upgrades: Partial<Record<VehicleTierId, Partial<Record<UpgradeSlotType, number>>>>
  private vehicleHealth: Partial<Record<VehicleTierId, number>>
  private readonly completedMilestones: Set<string>
  private milestoneCheckTimer = 0
  private readonly stats: RunStats
  /** Consecutive on-time deliveries this session — not persisted, resets like any arcade combo. */
  private deliveryStreak = 0

  private readonly markers = new Map<string, THREE.Group>()
  private routeLine: THREE.Mesh | null = null
  private routeLineTimer = 0
  private navRoute: NavRoute | null = null
  private lastCountdownSecond = -1
  private lastIsNight = false
  private currentNow = 0
  private autosaveTimer = AUTOSAVE_INTERVAL
  private disposed = false
  private readonly resizeHandler: () => void

  constructor(canvas: HTMLCanvasElement) {
    const save = loadSave()
    this.cash = save.cash
    this.ownedVehicles = new Set(save.ownedVehicles)
    this.equippedVehicle = save.equippedVehicle
    this.upgrades = save.upgrades
    this.vehicleHealth = { ...save.vehicleHealth }
    this.completedMilestones = new Set(save.completedMilestones)
    this.stats = { ...save.stats }
    this.reputation = new ReputationSystem(save)
    this.business = new BusinessSystem(save)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false)

    this.camera = new ChaseCamera((canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight))

    this.scene.background = new THREE.Color(0x0c1016)
    this.fog = new THREE.Fog(0x0c1016, 90, 340)
    this.scene.fog = this.fog

    this.ambient = new THREE.AmbientLight(0x8899aa, 0.55)
    this.scene.add(this.ambient)
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.0)
    this.sun.position.set(120, 180, 80)
    this.scene.add(this.sun)
    this.sunSprite = buildSkySprite('rgba(255,244,214,1)', 70)
    this.moonSprite = buildSkySprite('rgba(214,224,255,1)', 46)
    this.scene.add(this.sunSprite)
    this.scene.add(this.moonSprite)

    this.city = buildCity(this.scene, this.graph)
    this.trafficLights = new TrafficLightSystem(this.city.trafficLights)

    this.vehicle = new PlayerVehicle(this.scene, VEHICLES[this.equippedVehicle])
    const depotNode = this.graph.depotNode()
    this.vehicle.teleport(depotNode.x + 7, depotNode.z, 0)

    this.traffic = new TrafficManager(this.scene, this.graph, this.reputation.unlockedDistricts)
    this.pedestrians = new PedestrianManager(this.scene, this.graph, this.reputation.unlockedDistricts)
    this.fleet = new FleetManager(this.scene, this.graph)
    this.fleet.syncRoster(this.business.staff, this.reputation.unlockedDistricts)
    this.rain = new RainSystem(this.scene)
    this.refreshPropertySigns()

    const worldState: EventWorldState = {
      graph: this.graph,
      unlockedDistricts: this.reputation.unlockedDistricts,
      spawnVipFlashOrder: () => {
        const order = this.orders.spawnVipFlashOrder(
          this.currentNow,
          this.graph,
          this.reputation.unlockedDistricts,
          this.reputation.rep,
          this.reputation.unlockedRoutes,
        )
        if (order) {
          this.audio.eventSting('vipFlashOrder')
          useGameStore.getState().pushToast({
            kind: 'event',
            title: 'VIP Flash Order!',
            detail: `${order.pickupLabel} → ${order.dropoffLabel} — huge payout, 30s to claim`,
          })
          this.syncBoard()
        }
      },
      setMysteryWave: (active) => this.orders.setMysteryWave(active),
    }
    this.events = new EventManager(worldState)

    for (const routeId of this.reputation.unlockedRoutes) this.openRoute(routeId)

    this.audio.start()

    this.loop = new GameLoop((dt, elapsed) => this.tick(dt, elapsed))
    this.resizeHandler = () => this.handleResize(canvas)
    window.addEventListener('resize', this.resizeHandler)

    this.syncAll()
    useGameStore.setState({ ready: true })
  }

  start(): void {
    this.loop.start()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.loop.stop()
    this.input.dispose()
    window.removeEventListener('resize', this.resizeHandler)
    this.detachNavCanvas()
    this.fleet.dispose()
    this.rain.dispose(this.scene)
    disposeSkySprite(this.sunSprite)
    disposeSkySprite(this.moonSprite)
    this.persist()
    this.renderer.dispose()
  }

  /** Mounts the small GPS-viewport renderer onto the nav panel's canvas (created/destroyed as it shows/hides). */
  attachNavCanvas(canvas: HTMLCanvasElement): void {
    this.detachNavCanvas()
    this.navRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.navRenderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    const w = canvas.clientWidth || 260
    const h = canvas.clientHeight || 180
    this.navRenderer.setSize(w, h, false)
    this.navCamera.aspect = w / Math.max(1, h)
    this.navCamera.updateProjectionMatrix()
  }

  detachNavCanvas(): void {
    this.navRenderer?.dispose()
    this.navRenderer = null
  }

  private renderNavView(): void {
    if (!this.navRenderer) return
    const forward = new THREE.Vector3(Math.sin(this.vehicle.heading), 0, Math.cos(this.vehicle.heading))
    const camPos = new THREE.Vector3(this.vehicle.x, 16, this.vehicle.z).addScaledVector(forward, -9)
    const lookAt = new THREE.Vector3(this.vehicle.x, 0, this.vehicle.z).addScaledVector(forward, 45)
    this.navCamera.position.copy(camPos)
    this.navCamera.lookAt(lookAt)
    this.navRenderer.render(this.scene, this.navCamera)
  }

  // ---------------------------------------------------------------------
  // UI-facing actions
  // ---------------------------------------------------------------------

  acceptOrder(orderId: string): { ok: boolean; reason?: string } {
    const capacity = computeEffectiveStats(this.equippedVehicle, this.upgrades[this.equippedVehicle] ?? {}).cargoCapacity
    const res = this.orders.acceptOrder(orderId, this.currentNow, capacity)
    if (res.ok) {
      this.audio.uiClick()
      this.syncBoard()
      this.syncActive()
      this.updateMarkers()
      this.updateRouteLine()
    }
    return res
  }

  setFocusedOrder(orderId: string): void {
    this.orders.setFocused(orderId)
    this.syncActive()
    this.updateRouteLine()
  }

  buyVehicle(id: VehicleTierId): { ok: boolean; reason?: string } {
    if (this.ownedVehicles.has(id)) return { ok: false, reason: 'Already owned.' }
    const def = vehicleDef(id)
    if (this.cash < def.cost) return { ok: false, reason: 'Not enough cash.' }
    this.cash -= def.cost
    this.ownedVehicles.add(id)
    this.vehicleHealth[id] = VEHICLE_MAX_HEALTH
    this.audio.uiClick()
    this.syncMeta()
    this.persist()
    return { ok: true }
  }

  private healthOf(id: VehicleTierId): number {
    return this.vehicleHealth[id] ?? VEHICLE_MAX_HEALTH
  }

  repairCost(id: VehicleTierId): number {
    const missingFraction = 1 - this.healthOf(id) / VEHICLE_MAX_HEALTH
    return Math.round(missingFraction * REPAIR_FULL_COST[id])
  }

  repairVehicle(id: VehicleTierId): { ok: boolean; reason?: string } {
    if (!this.ownedVehicles.has(id)) return { ok: false, reason: 'Not owned.' }
    const cost = this.repairCost(id)
    if (cost <= 0) return { ok: false, reason: 'Already at full health.' }
    if (this.cash < cost) return { ok: false, reason: 'Not enough cash.' }
    this.cash -= cost
    this.vehicleHealth[id] = VEHICLE_MAX_HEALTH
    this.audio.uiClick()
    this.syncMeta()
    this.persist()
    return { ok: true }
  }

  equipVehicle(id: VehicleTierId): { ok: boolean; reason?: string } {
    if (!this.ownedVehicles.has(id)) return { ok: false, reason: 'Not owned.' }
    if (this.equippedVehicle !== id) {
      this.equippedVehicle = id
      this.vehicle.setVehicleDef(vehicleDef(id))
      this.audio.uiClick()
      this.syncMeta()
      this.syncActive()
      this.persist()
    }
    return { ok: true }
  }

  buyUpgrade(vehicleId: VehicleTierId, slot: UpgradeSlotType): { ok: boolean; reason?: string } {
    const current = this.upgrades[vehicleId]?.[slot] ?? 0
    const next = nextUpgradeCost(vehicleId, slot, current)
    if (!next) return { ok: false, reason: 'Already maxed.' }
    if (this.cash < next.cost) return { ok: false, reason: 'Not enough cash.' }
    this.cash -= next.cost
    const forVehicle = { ...(this.upgrades[vehicleId] ?? {}) }
    forVehicle[slot] = next.level
    this.upgrades = { ...this.upgrades, [vehicleId]: forVehicle }
    this.audio.uiClick()
    this.syncMeta()
    this.syncActive()
    this.persist()
    return { ok: true }
  }

  hireStaff(vehicleTier: VehicleTierId): { ok: boolean; reason?: string } {
    if (!this.business.canHire()) return { ok: false, reason: 'No room — buy a property to expand your roster.' }
    const cost = HIRE_COST[vehicleTier]
    if (this.cash < cost) return { ok: false, reason: 'Not enough cash.' }
    const hired = this.business.hire(vehicleTier, this.currentNow)
    if (!hired) return { ok: false, reason: 'No room — buy a property to expand your roster.' }
    this.cash -= cost
    this.fleet.syncRoster(this.business.staff, this.reputation.unlockedDistricts)
    this.audio.uiClick()
    useGameStore.getState().pushToast({ kind: 'unlock', title: `Hired ${hired.name}`, detail: `Driving a ${vehicleDef(vehicleTier).name} for you now.` })
    this.syncMeta()
    this.persist()
    return { ok: true }
  }

  fireStaff(staffId: string): { ok: boolean; reason?: string } {
    if (!this.business.fire(staffId)) return { ok: false, reason: 'Not found.' }
    this.fleet.syncRoster(this.business.staff, this.reputation.unlockedDistricts)
    this.audio.uiClick()
    this.syncMeta()
    this.persist()
    return { ok: true }
  }

  buyProperty(id: string): { ok: boolean; reason?: string } {
    const def = PROPERTIES.find((p) => p.id === id)
    if (!def) return { ok: false, reason: 'Unknown property.' }
    if (this.business.ownedProperties.has(id)) return { ok: false, reason: 'Already owned.' }
    if (this.reputation.rep < def.unlockRep) return { ok: false, reason: `Requires Rep ${def.unlockRep}.` }
    if (this.cash < def.cost) return { ok: false, reason: 'Not enough cash.' }
    this.cash -= def.cost
    this.business.buyProperty(id)
    this.refreshPropertySigns()
    this.audio.unlock()
    useGameStore.getState().pushToast({ kind: 'unlock', title: `Property acquired: ${def.name}`, detail: `+${def.capacity} hire slots.` })
    this.syncMeta()
    this.persist()
    return { ok: true }
  }

  /** Flips each property's in-world sign between FOR SALE and OWNED to match the current roster. */
  private refreshPropertySigns(): void {
    for (const marker of this.city.propertyMarkers) {
      const owned = this.business.ownedProperties.has(marker.id)
      marker.forSaleSign.visible = !owned
      marker.ownedSign.visible = owned
    }
  }

  teleportToDepot(): void {
    const depot = this.city.depotPosition
    this.vehicle.teleport(depot.x + 7, depot.z, 0)
  }

  toggleMute(): void {
    this.audio.setMuted(!this.audio.isMuted())
    useGameStore.setState({ muted: this.audio.isMuted() })
  }

  // ---------------------------------------------------------------------
  // Per-frame update
  // ---------------------------------------------------------------------

  private tick(dt: number, elapsed: number): void {
    this.currentNow = elapsed
    const screenBefore = useGameStore.getState().screen

    if (this.input.consumeJustPressed(KEYS.orderBoard)) {
      useGameStore.setState({ screen: screenBefore === 'orderBoard' ? 'none' : 'orderBoard' })
    }
    if (this.input.consumeJustPressed(KEYS.map)) {
      const s = useGameStore.getState().screen
      useGameStore.setState({ screen: s === 'map' ? 'none' : 'map' })
    }
    if (this.input.consumeJustPressed(KEYS.pause)) {
      const s = useGameStore.getState().screen
      useGameStore.setState({ screen: s === 'none' ? 'pause' : 'none' })
    }

    const driving = useGameStore.getState().screen === 'none'
    const vehicleInput = driving
      ? {
          forward: this.input.anyDown(KEYS.forward),
          backward: this.input.anyDown(KEYS.backward),
          left: this.input.anyDown(KEYS.left),
          right: this.input.anyDown(KEYS.right),
          handbrake: this.input.anyDown(KEYS.handbrake),
          boost: this.input.anyDown(KEYS.boost),
        }
      : { forward: false, backward: false, left: false, right: false, handbrake: false, boost: false }

    const rawEffective = computeEffectiveStats(this.equippedVehicle, this.upgrades[this.equippedVehicle] ?? {})
    const brokenDown = this.healthOf(this.equippedVehicle) <= 0
    const effective = brokenDown ? { ...rawEffective, topSpeed: rawEffective.topSpeed * 0.22, acceleration: rawEffective.acceleration * 0.35 } : rawEffective
    const timeOfDay = this.updateDayNight(elapsed)
    const nightBoost = timeOfDay.isNight ? 1.12 : 1
    const combinedModifiers = {
      payoutMultiplier: this.events.getModifiers().payoutMultiplier * nightBoost,
      visibility: this.events.getModifiers().visibility * (timeOfDay.isNight ? 0.8 : 1),
      handling: this.events.getModifiers().handling,
    }
    this.fog.far = THREE.MathUtils.lerp(140, 340, THREE.MathUtils.clamp(combinedModifiers.visibility, 0.25, 1))
    this.fog.near = this.fog.far * 0.22

    const result = this.vehicle.update(dt, vehicleInput, effective, combinedModifiers, this.city.colliders)
    if (result.nearMiss && !result.collided) {
      this.vehicle.boostMeter = Math.min(100 + effective.boostCapacityBonus, this.vehicle.boostMeter + 6 * dt)
    }
    if (result.hardImpact) {
      this.applyCargoDamage(34, effective.fragileRetention, elapsed, 'drove too rough')
      this.applyVehicleDamage(12, effective.fragileRetention)
    }

    this.trafficLights.update(elapsed)
    this.traffic.update(dt, this.vehicle.x, this.vehicle.z, this.reputation.unlockedDistricts, this.trafficLights)
    this.pedestrians.update(dt, this.vehicle.x, this.vehicle.z, this.reputation.unlockedDistricts)
    this.fleet.update(dt, this.reputation.unlockedDistricts, this.trafficLights)
    const raining = this.events.activeEvents().some((e) => e.defId === 'rainstorm')
    this.rain.setActive(raining)
    this.rain.update(dt, this.vehicle.x, this.vehicle.z)

    const payCycle = this.business.update(dt)
    if (payCycle) {
      this.cash += payCycle.net
      if (payCycle.income > 0) {
        useGameStore.getState().pushToast({
          kind: 'delivery',
          title: `Your team earned +$${payCycle.net.toFixed(2)}`,
          detail: `$${payCycle.income.toFixed(2)} income - $${payCycle.wages.toFixed(2)} wages`,
        })
      }
      if (payCycle.standout) {
        this.audio.chaChing(payCycle.standout.amount)
        useGameStore.getState().pushToast({
          kind: 'unlock',
          title: `${payCycle.standout.name} landed a huge contract!`,
          detail: `+$${payCycle.standout.amount.toFixed(2)} in one cycle`,
        })
      }
      this.syncMeta()
      this.persist()
    }
    for (const t of this.traffic.positions()) {
      const dist = Math.hypot(t.x - this.vehicle.x, t.z - this.vehicle.z)
      if (dist < 2.6) {
        const fast = Math.abs(this.vehicle.speed) > 7
        this.vehicle.speed *= 0.5
        if (fast) {
          this.applyCargoDamage(20, effective.fragileRetention, elapsed, 'collided with traffic')
          this.applyVehicleDamage(7, effective.fragileRetention)
        }
      }
    }

    if (driving && this.input.consumeJustPressed(KEYS.interact) && !this.vehicle.character.isBusy()) {
      this.handleInteract(elapsed)
    }

    const orderEvents = this.orders.update(dt, elapsed, this.graph, this.reputation.unlockedDistricts, this.reputation.rep, this.reputation.unlockedRoutes)
    if (orderEvents.length > 0) this.handleOrderEvents(orderEvents)

    this.milestoneCheckTimer -= dt
    if (this.milestoneCheckTimer <= 0) {
      this.milestoneCheckTimer = 2
      const milestone = this.orders.checkMilestones(this.reputation.rep, elapsed, this.graph, this.reputation.unlockedDistricts, this.reputation.unlockedRoutes, this.completedMilestones)
      if (milestone) {
        this.audio.eventSting('milestone')
        useGameStore.getState().pushToast({ kind: 'milestone', title: `New milestone: ${milestone.milestoneTitle}`, detail: milestone.milestoneFlavor })
        this.syncBoard()
      }
    }

    const { started, ended } = this.events.update(dt, elapsed)
    if (started.length > 0 || ended.length > 0) this.handleEventChanges(started, ended)

    for (const m of this.markers.values()) m.rotation.y += dt * 1.6

    this.routeLineTimer -= dt
    if (this.routeLineTimer <= 0) {
      this.routeLineTimer = 0.75
      this.updateRouteLine()
    } else {
      // The path itself only needs recomputing on the timer above (A* isn't cheap), but the
      // distance readout is just arithmetic over the cached path — update it every frame so it
      // counts down smoothly instead of freezing for up to 1.5s and then jumping.
      this.updateNavDistance()
    }

    this.vehicle.setCarrying(this.orders.activeOrders().length)
    this.camera.setFocusMode(this.vehicle.character.isBusy())
    const speedFraction = Math.min(1, Math.abs(this.vehicle.speed) / Math.max(1, effective.topSpeed))
    this.camera.update(dt, { x: this.vehicle.x, z: this.vehicle.z, heading: this.vehicle.heading }, speedFraction)
    this.clampCameraFromBuildings()
    this.camera.setAspect(this.renderer.domElement.clientWidth / Math.max(1, this.renderer.domElement.clientHeight))

    this.audio.setEngineNote(speedFraction)
    this.updateCountdownHeartbeat(elapsed)

    this.autosaveTimer -= dt
    if (this.autosaveTimer <= 0) {
      this.autosaveTimer = AUTOSAVE_INTERVAL
      this.persist()
    }

    const districtId = districtAt(this.city.districtBounds, this.vehicle.x, this.vehicle.z)
    const districtName = DISTRICTS.find((d) => d.id === districtId)?.name ?? 'Unmapped Road'

    useGameStore.setState({
      speed: this.vehicle.speed,
      topSpeed: effective.topSpeed,
      boostMeter: this.vehicle.boostMeter,
      playerX: this.vehicle.x,
      playerZ: this.vehicle.z,
      playerHeading: this.vehicle.heading,
      simNow: elapsed,
      districtId,
      districtName,
      isNight: timeOfDay.isNight ? 1 : 0,
      interactPrompt: this.computeInteractPrompt(driving),
      isRaining: raining,
    })

    this.renderer.render(this.scene, this.camera.camera)
    if (this.navRenderer) {
      this.navFrameSkip = (this.navFrameSkip + 1) % 2
      if (this.navFrameSkip === 0) this.renderNavView()
    }
    this.input.endFrame()
  }

  /**
   * Removes a route's visual barrier AND its collider. The barrier's collider used to survive
   * an unlock — an invisible radius-3 wall left sitting at the midpoint of every opened bridge,
   * which is exactly where a car driving straight down it would hit it and stop dead.
   */
  private openRoute(routeId: string): void {
    for (const obj of this.city.barriersByRoute.get(routeId) ?? []) this.scene.remove(obj)
    for (let i = this.city.colliders.length - 1; i >= 0; i--) {
      const c = this.city.colliders[i]
      if (c.kind === 'barrier' && c.routeId === routeId) this.city.colliders.splice(i, 1)
    }
  }

  private applyCargoDamage(amount: number, retention: number, now: number, reason: string): void {
    const destroyed = this.orders.degradeCondition(amount, retention, now)
    if (destroyed.length === 0) return
    this.stats.deliveriesFailed += destroyed.length
    this.deliveryStreak = 0
    useGameStore.setState({ stats: { ...this.stats }, deliveryStreak: 0 })
    for (const o of destroyed) {
      this.audio.cargoLost()
      useGameStore.getState().pushToast({ kind: 'fail', title: 'Cargo destroyed!', detail: `${o.itemType} order lost — ${reason}.` })
    }
    this.vehicle.setCarrying(this.orders.activeOrders().length)
    this.syncActive()
    this.updateMarkers()
  }

  /** Reuses the tires/cargo "retention" stat as general shock absorption — better suspension protects the frame too. */
  private applyVehicleDamage(amount: number, retention: number): void {
    const before = this.healthOf(this.equippedVehicle)
    if (before <= 0) return
    const after = Math.max(0, before - amount * (1 - retention))
    this.vehicleHealth[this.equippedVehicle] = after
    this.audio.vehicleDamage()
    if (after <= 0 && before > 0) {
      this.audio.vehicleBrokeDown()
      useGameStore.getState().pushToast({
        kind: 'fail',
        title: 'Vehicle broke down!',
        detail: `${vehicleDef(this.equippedVehicle).name} needs a repair at the Depot — crawling until then.`,
      })
    }
    useGameStore.setState({ vehicleHealth: after, vehicleBrokenDown: after <= 0 })
  }

  private handleInteract(now: number): void {
    const depot = this.city.depotPosition
    if (Math.hypot(this.vehicle.x - depot.x, this.vehicle.z - depot.z) < DEPOT_RADIUS) {
      this.audio.uiClick()
      useGameStore.setState({ screen: 'shop' })
      return
    }
    const pickupOrder = this.orders.nearbyPickup(this.vehicle.x, this.vehicle.z, this.graph)
    if (pickupOrder) {
      this.beginPickupSequence(pickupOrder, now)
      return
    }
    const dropoffOrder = this.orders.nearbyDropoff(this.vehicle.x, this.vehicle.z, this.graph)
    if (dropoffOrder) this.beginDropoffSequence(dropoffOrder, now)
  }

  private beginPickupSequence(order: Order, now: number): void {
    const node = this.graph.getNode(order.pickupNodeId)
    if (!node) return
    const marker = new THREE.Vector3(node.x, 0, node.z)
    this.vehicle.beginDismount(
      marker,
      () => {
        this.orders.confirmPickup(order.id, now)
        this.audio.pickup()
        this.vehicle.setCarrying(this.orders.activeOrders().length)
        this.syncActive()
        this.updateMarkers()
        this.updateRouteLine()
      },
      () => {},
    )
  }

  private beginDropoffSequence(order: Order, now: number): void {
    const node = this.graph.getNode(order.dropoffNodeId)
    if (!node) return
    const marker = new THREE.Vector3(node.x, 0, node.z)
    this.vehicle.beginDismount(
      marker,
      () => {
        const result = this.orders.confirmDropoff(order.id, now, this.currentPayoutMultiplier())
        if (!result) return
        this.cash += result.payout
        this.stats.deliveriesCompleted += 1
        this.stats.totalEarned = Math.round((this.stats.totalEarned + result.payout) * 100) / 100
        if (result.late) this.deliveryStreak = 0
        else this.deliveryStreak += 1
        const milestoneDef = result.order.milestoneId ? MILESTONES.find((m) => m.id === result.order.milestoneId) : undefined
        const repGain = milestoneDef ? milestoneDef.repReward : this.computeRepGain(result.order.difficultyTier, result.late, result.conditionAtDropoff, result.vip)
        const leveled = this.reputation.addXp(Math.round(result.payout * 1.2))
        const unlocks = this.reputation.addRep(repGain)
        this.audio.chaChing(result.payout)
        useGameStore.getState().pushToast({
          kind: 'delivery',
          title: result.mystery ? `Mystery Box revealed: $${result.payout.toFixed(2)}` : `Delivered! +$${result.payout.toFixed(2)}`,
          detail: result.late
            ? 'Late — reduced payout, streak reset'
            : result.vip
              ? 'VIP delivery bonus!'
              : this.deliveryStreak > 1
                ? `🔥 Streak x${this.deliveryStreak} · +$${result.tip.toFixed(2)} tip`
                : `+$${result.tip.toFixed(2)} tip`,
        })
        if (milestoneDef) {
          this.completedMilestones.add(milestoneDef.id)
          this.audio.milestoneComplete()
          useGameStore.getState().pushToast({
            kind: 'milestone',
            title: `Milestone complete: ${milestoneDef.title}`,
            detail: `+$${result.payout.toFixed(2)} · +${repGain.toFixed(1)} Rep`,
          })
        }
        if (leveled) {
          this.audio.levelUp()
          useGameStore.getState().pushToast({ kind: 'levelUp', title: `Level Up! Level ${this.reputation.level}` })
        }
        for (const u of unlocks) {
          this.audio.unlock()
          useGameStore.getState().pushToast({
            kind: 'unlock',
            title: u.type === 'district' ? `District Unlocked: ${u.label}` : `Route Unlocked: ${u.label}`,
          })
          this.openRoute(u.id)
        }
        this.vehicle.setCarrying(this.orders.activeOrders().length)
        this.syncActive()
        this.syncMeta()
        this.updateMarkers()
        this.updateRouteLine()
        this.persist()
      },
      () => {},
    )
  }

  private currentPayoutMultiplier(): number {
    return this.events.getModifiers().payoutMultiplier * (this.lastIsNight ? 1.12 : 1) * this.streakMultiplier()
  }

  /** +3% per consecutive on-time delivery this session, capped at +30% (streak of 10+). */
  private streakMultiplier(): number {
    return 1 + Math.min(this.deliveryStreak, 10) * 0.03
  }

  private computeRepGain(difficultyTier: number, late: boolean, condition: number, vip: boolean): number {
    let rep = 0.45 + difficultyTier * 0.15
    if (!late) rep += 0.3
    if (condition >= 95) rep += 0.15
    if (vip) rep *= 1.8
    return Math.round(rep * 100) / 100
  }

  private handleOrderEvents(events: OrderSystemEvent[]): void {
    let boardChanged = false
    let activeChanged = false
    for (const e of events) {
      if (e.type === 'boardRefresh') {
        boardChanged = true
      } else if (e.type === 'failed') {
        activeChanged = true
        this.stats.deliveriesFailed += 1
        this.deliveryStreak = 0
        useGameStore.setState({ stats: { ...this.stats }, deliveryStreak: 0 })
        this.audio.cargoLost()
        useGameStore.getState().pushToast({
          kind: 'fail',
          title: 'Order failed',
          detail: `${e.order.pickupLabel} → ${e.order.dropoffLabel} timed out.`,
        })
      } else if (e.type === 'vipExpired') {
        boardChanged = true
        useGameStore.getState().pushToast({ kind: 'fail', title: 'VIP order expired', detail: 'Nobody claimed it in time.' })
      }
    }
    if (boardChanged) this.syncBoard()
    if (activeChanged) {
      this.vehicle.setCarrying(this.orders.activeOrders().length)
      this.syncActive()
      this.updateMarkers()
    }
  }

  private handleEventChanges(started: GameEvent[], ended: GameEvent[]): void {
    for (const ev of started) {
      if (ev.defId !== 'vipFlashOrder') {
        this.audio.eventSting(ev.defId)
        useGameStore.getState().pushToast({ kind: 'event', title: `${ev.icon} ${ev.name}`, detail: ev.description })
      }
    }
    for (const ev of ended) {
      if (ev.defId !== 'vipFlashOrder') {
        useGameStore.getState().pushToast({ kind: 'info', title: `${ev.name} has ended` })
      }
    }
    useGameStore.setState({ activeEvents: this.events.activeEvents(), modifiers: this.events.getModifiers() })
  }

  private updateMarkers(): void {
    for (const obj of this.markers.values()) this.city.markerGroup.remove(obj)
    this.markers.clear()
    for (const order of this.orders.activeOrders()) {
      if (order.state === 'toPickup') {
        const node = this.graph.getNode(order.pickupNodeId)
        if (node) {
          this.markers.set(`${order.id}-p`, this.addMarker(node.x, node.z, order.specialFlags.includes('MysteryBox') ? 0x9b7fd1 : 0xffcc33, order.specialFlags.includes('VIP')))
        }
      } else if (order.state === 'toDropoff') {
        const node = this.graph.getNode(order.dropoffNodeId)
        if (node) {
          this.markers.set(`${order.id}-d`, this.addMarker(node.x, node.z, order.specialFlags.includes('MysteryBox') ? 0x9b7fd1 : 0x33cc66, order.specialFlags.includes('VIP')))
        }
      }
    }
  }

  private addMarker(x: number, z: number, color: number, vip: boolean): THREE.Group {
    const group = new THREE.Group()
    group.position.set(x, 0, z)
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 })
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 6), mat)
    cone.position.y = 8
    cone.rotation.x = Math.PI
    group.add(cone)
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.5 }),
    )
    beam.position.y = 4
    group.add(beam)
    if (vip) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.8, 0.15, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffd76a, emissiveIntensity: 0.8 }),
      )
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.3
      group.add(ring)
    }
    this.city.markerGroup.add(group)
    return group
  }

  private updateRouteLine(): void {
    this.clearRouteVisual()
    const order = this.orders.getFocused()
    if (!order) {
      this.navRoute = null
      this.updateNavDistance()
      return
    }
    const targetNodeId = order.state === 'toPickup' ? order.pickupNodeId : order.dropoffNodeId
    const targetLabel = order.state === 'toPickup' ? order.pickupLabel : order.dropoffLabel
    const startNode = this.graph.nearestNode(this.vehicle.x, this.vehicle.z, this.reputation.unlockedDistricts)
    if (!startNode) {
      this.navRoute = null
      this.updateNavDistance()
      return
    }
    const path = this.graph.findPath(startNode.id, targetNodeId, { vehicleTier: this.equippedVehicle, unlockedRoutes: this.reputation.unlockedRoutes })
    if (!path || path.nodeIds.length < 2) {
      const targetNode = this.graph.getNode(targetNodeId)
      this.navRoute = targetNode ? { nodes: [targetNode], turnIndex: 0, maneuver: 'arrive', targetLabel } : null
      this.updateNavDistance()
      return
    }

    const nodes = path.nodeIds.map((id) => this.graph.getNode(id)!)
    const turn = this.findTurn(nodes)
    this.navRoute = { nodes, turnIndex: turn ? turn.index : nodes.length - 1, maneuver: turn ? turn.maneuver : 'arrive', targetLabel }
    this.updateNavDistance()

    const color = order.state === 'toPickup' ? 0xffcc33 : 0x33cc66
    const offsetPoints = this.laneOffsetPoints(nodes)
    const curve = new THREE.CatmullRomCurve3(offsetPoints)
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(8, offsetPoints.length * 6), 0.32, 6, false)
    const tubeMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.35 })
    this.routeLine = new THREE.Mesh(tubeGeo, tubeMat)
    this.scene.add(this.routeLine)
  }

  private clearRouteVisual(): void {
    if (!this.routeLine) return
    this.scene.remove(this.routeLine)
    this.routeLine.geometry.dispose()
    this.routeLine = null
  }

  /**
   * Offsets each path node into the same lane traffic actually drives in (left of travel
   * direction, matching TrafficAgent), so the glowing route sits visibly in a lane instead of
   * floating down the bare centerline the dashed lane markings already occupy.
   */
  private laneOffsetPoints(nodes: RoadNode[]): THREE.Vector3[] {
    return nodes.map((node, i) => {
      const forward = i < nodes.length - 1
      const neighbor = forward ? nodes[i + 1] : nodes[i - 1]
      const dx = forward ? neighbor.x - node.x : node.x - neighbor.x
      const dz = forward ? neighbor.z - node.z : node.z - neighbor.z
      const len = Math.max(0.001, Math.hypot(dx, dz))
      const perpX = dz / len
      const perpZ = -dx / len
      return new THREE.Vector3(node.x + perpX * LANE_OFFSET, 0.55, node.z + perpZ * LANE_OFFSET)
    })
  }

  /** Finds the first turn sharper than 45° walking the path; null means it runs straight to the destination. */
  private findTurn(nodes: RoadNode[]): { index: number; maneuver: 'left' | 'right' } | null {
    for (let i = 1; i < nodes.length - 1; i++) {
      const inHeading = Math.atan2(nodes[i].x - nodes[i - 1].x, nodes[i].z - nodes[i - 1].z)
      const outHeading = Math.atan2(nodes[i + 1].x - nodes[i].x, nodes[i + 1].z - nodes[i].z)
      let delta = outHeading - inHeading
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      if (Math.abs(delta) > Math.PI / 4) return { index: i, maneuver: delta > 0 ? 'left' : 'right' }
    }
    return null
  }

  /**
   * Recomputes just the live distance-to-next-turn from the player's current position over the
   * cached path — cheap (a handful of Math.hypot calls), so it can run every frame and the counter
   * counts down smoothly instead of only updating (and jumping) once per 1.5s path recompute.
   */
  private updateNavDistance(): void {
    if (!this.navRoute) {
      useGameStore.setState({ navInfo: null })
      return
    }
    const { nodes, turnIndex, maneuver, targetLabel } = this.navRoute
    const turnNode = nodes[turnIndex]
    // Once the player is basically at the reported turn/arrival point, the cached path is either
    // about to be wrong (a new turn is coming right up) or already is — force an immediate
    // recompute instead of coasting on stale nodes until the periodic timer happens to fire.
    // (Confirmed with a direct test: a stale cache can report a distance wildly larger than
    // reality until the scheduled recompute corrects it in one big jump.)
    if (Math.hypot(turnNode.x - this.vehicle.x, turnNode.z - this.vehicle.z) < 8) {
      this.routeLineTimer = 0
      return
    }
    let distance = Math.hypot(nodes[0].x - this.vehicle.x, nodes[0].z - this.vehicle.z)
    for (let i = 0; i < turnIndex; i++) {
      distance += Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].z - nodes[i].z)
    }
    useGameStore.setState({ navInfo: { maneuver, distance, targetLabel } })
  }

  private computeInteractPrompt(driving: boolean): string | null {
    if (!driving) return null
    const depot = this.city.depotPosition
    if (Math.hypot(this.vehicle.x - depot.x, this.vehicle.z - depot.z) < DEPOT_RADIUS) return 'Press E — Depot (Shop & Save)'
    const p = this.orders.nearbyPickup(this.vehicle.x, this.vehicle.z, this.graph)
    if (p) return `Press E — Pick up ${p.itemType} from ${p.pickupLabel}`
    const d = this.orders.nearbyDropoff(this.vehicle.x, this.vehicle.z, this.graph)
    if (d) return `Press E — Deliver to ${d.dropoffLabel}`
    return null
  }

  private updateDayNight(elapsed: number): { isNight: boolean } {
    const cycle = dayCycle(elapsed)
    const angle = cycle * Math.PI * 2
    const sunHeight = Math.sin(angle - Math.PI / 2)
    const isNight = sunHeight < -0.05
    // 0 at midnight, 1 at noon — drives sky color and light intensity together.
    const t = THREE.MathUtils.clamp((sunHeight + 1) / 2, 0, 1)
    // Peaks when the sun sits right at the horizon (sunrise/sunset), fades out at full day/night.
    const horizon = THREE.MathUtils.clamp(1 - Math.abs(sunHeight) / 0.35, 0, 1)

    const nightColor = new THREE.Color(0x02030a)
    const dayColor = new THREE.Color(0x5f8db3)
    const horizonColor = new THREE.Color(0xff8a52)
    const skyColor = nightColor.clone().lerp(dayColor, t).lerp(horizonColor, horizon * 0.55)
    this.scene.background = skyColor
    this.fog.color = skyColor

    this.sun.intensity = THREE.MathUtils.lerp(0.05, 1.3, t)
    const sunColor = new THREE.Color(0x8fa5ff).lerp(new THREE.Color(0xfff2d8), t).lerp(new THREE.Color(0xffb066), horizon * 0.7)
    this.sun.color.copy(sunColor)
    this.ambient.intensity = THREE.MathUtils.lerp(0.16, 0.65, t)
    this.sun.position.set(Math.cos(angle) * 200, Math.max(30, sunHeight * 220), Math.sin(angle) * 200)

    // Sun and moon sit opposite each other on the same great circle, always far from the vehicle
    // so they read as distant sky objects no matter where the player drives, and fade out near/
    // below the horizon instead of hard-cutting.
    const skyRadius = 400
    const skyCenter = { x: this.vehicle.x, y: 30, z: this.vehicle.z }
    this.sunSprite.position.set(skyCenter.x + Math.cos(angle) * skyRadius, skyCenter.y + Math.max(-40, sunHeight) * 180, skyCenter.z + Math.sin(angle) * skyRadius)
    this.moonSprite.position.set(skyCenter.x - Math.cos(angle) * skyRadius, skyCenter.y + Math.max(-40, -sunHeight) * 180, skyCenter.z - Math.sin(angle) * skyRadius)
    ;(this.sunSprite.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp((sunHeight + 0.05) / 0.2, 0, 1)
    ;(this.moonSprite.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp((-sunHeight + 0.05) / 0.2, 0, 1) * 0.85

    this.vehicle.setHeadlights(isNight)

    this.lastIsNight = isNight
    return { isNight }
  }

  /**
   * The chase camera is a pure spring-arm lerp with no awareness of geometry, so on a sharp turn
   * next to a building it can lag into the wall — from inside, backface culling makes the wall
   * disappear entirely. Pull the camera back along its own line-of-sight to just in front of the
   * nearest building it's about to clip through.
   */
  private clampCameraFromBuildings(): void {
    const camPos = this.camera.camera.position
    const targetX = this.vehicle.x
    const targetZ = this.vehicle.z
    const dx = camPos.x - targetX
    const dz = camPos.z - targetZ
    const dist = Math.hypot(dx, dz)
    if (dist < 0.001) return
    const dirX = dx / dist
    const dirZ = dz / dist

    let maxDist = dist
    for (const c of this.city.colliders) {
      if (c.kind !== 'building') continue
      const toX = c.x - targetX
      const toZ = c.z - targetZ
      const proj = toX * dirX + toZ * dirZ
      if (proj <= 0 || proj >= dist) continue
      const closestX = targetX + dirX * proj
      const closestZ = targetZ + dirZ * proj
      const lateral = Math.hypot(c.x - closestX, c.z - closestZ)
      if (lateral < c.radius) {
        const penetration = Math.sqrt(Math.max(0, c.radius * c.radius - lateral * lateral))
        const hitDist = Math.max(1, proj - penetration)
        if (hitDist < maxDist) maxDist = hitDist
      }
    }

    if (maxDist < dist) {
      this.camera.correctPosition(new THREE.Vector3(targetX + dirX * maxDist, camPos.y, targetZ + dirZ * maxDist))
    }
  }

  private updateCountdownHeartbeat(elapsed: number): void {
    const order = this.orders.getFocused()
    if (!order || order.acceptedAt == null) {
      this.lastCountdownSecond = -1
      return
    }
    const remaining = order.timeLimit - (elapsed - order.acceptedAt)
    if (remaining <= 10 && remaining > 0) {
      const sec = Math.ceil(remaining)
      if (sec !== this.lastCountdownSecond) {
        this.lastCountdownSecond = sec
        this.audio.countdownTick()
      }
    } else {
      this.lastCountdownSecond = -1
    }
  }

  private handleResize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.setAspect(w / Math.max(1, h))
  }

  private syncBoard(): void {
    useGameStore.setState({ boardOrders: [...this.orders.boardOrders()] })
  }

  private syncActive(): void {
    useGameStore.setState({
      activeOrders: [...this.orders.activeOrders()],
      focusedOrderId: this.orders.focusedOrderId,
      capacity: computeEffectiveStats(this.equippedVehicle, this.upgrades[this.equippedVehicle] ?? {}).cargoCapacity,
    })
  }

  private syncMeta(): void {
    useGameStore.setState({
      cash: this.cash,
      rep: this.reputation.rep,
      xp: this.reputation.xp,
      xpForNextLevel: this.reputation.xpForNextLevel(),
      level: this.reputation.level,
      nextDistrictPreview: this.reputation.nextDistrictPreview(),
      ownedVehicles: [...this.ownedVehicles],
      equippedVehicle: this.equippedVehicle,
      upgrades: this.upgrades,
      unlockedDistricts: [...this.reputation.unlockedDistricts],
      unlockedRoutes: [...this.reputation.unlockedRoutes],
      ownedProperties: [...this.business.ownedProperties],
      staff: [...this.business.staff],
      staffCapacity: this.business.capacity(),
      vehicleHealth: this.healthOf(this.equippedVehicle),
      vehicleBrokenDown: this.healthOf(this.equippedVehicle) <= 0,
      completedMilestones: [...this.completedMilestones],
      stats: { ...this.stats },
      deliveryStreak: this.deliveryStreak,
    })
  }

  private syncAll(): void {
    this.syncBoard()
    this.syncActive()
    this.syncMeta()
    useGameStore.setState({ activeEvents: this.events.activeEvents(), modifiers: this.events.getModifiers() })
  }

  private persist(): void {
    const save: SaveData = {
      version: SAVE_VERSION,
      cash: this.cash,
      rep: this.reputation.rep,
      xp: this.reputation.xp,
      level: this.reputation.level,
      ownedVehicles: [...this.ownedVehicles],
      equippedVehicle: this.equippedVehicle,
      upgrades: this.upgrades,
      unlockedDistricts: [...this.reputation.unlockedDistricts],
      unlockedRoutes: [...this.reputation.unlockedRoutes],
      cargoBonusSlots: 0,
      ownedProperties: [...this.business.ownedProperties],
      staff: [...this.business.staff],
      vehicleHealth: { ...this.vehicleHealth },
      completedMilestones: [...this.completedMilestones],
      stats: { ...this.stats },
    }
    writeSave(save)
  }
}
