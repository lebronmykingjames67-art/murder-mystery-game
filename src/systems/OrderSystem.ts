import type { RoadGraph } from '../core/RoadGraph'
import { CLIENT_NAMES, RESTAURANT_NAMES, tierConfigForRep } from '../data/orderPools'
import type { DeliveryResult, ItemType, Order, SpecialFlag } from '../types'
import { computePayout } from './PayoutSystem'

export const MAX_BOARD_ORDERS = 5
const REFRESH_MIN = 20
const REFRESH_MAX = 40
const OVERDUE_FAIL_MULTIPLIER = 3
const PICKUP_RADIUS = 9
const DROPOFF_RADIUS = 9

export type OrderSystemEvent =
  | { type: 'boardRefresh'; order: Order }
  | { type: 'failed'; order: Order; reason: 'overdue' | 'cargoDestroyed' }
  | { type: 'vipExpired'; order: Order }

let idCounter = 0
function nextOrderId(): string {
  idCounter += 1
  return `ord_${idCounter}_${Math.floor(Math.random() * 1000)}`
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class OrderSystem {
  private board: Order[] = []
  private active: Order[] = []
  private refreshTimer = 6
  private mysteryWaveActive = false
  focusedOrderId: string | null = null

  boardOrders(): Order[] {
    return this.board
  }

  activeOrders(): Order[] {
    return this.active
  }

  setMysteryWave(active: boolean): void {
    this.mysteryWaveActive = active
  }

  private generateOrder(now: number, graph: RoadGraph, unlockedDistricts: Set<string>, rep: number, unlockedRoutes: Set<string>): Order | null {
    const cfg = tierConfigForRep(rep)
    const pois = graph.poisInDistricts(unlockedDistricts)
    if (pois.length < 2) return null

    const pickup = pick(pois)
    let dropoff = pick(pois)
    let guard = 0
    while (dropoff.id === pickup.id && guard < 8) {
      dropoff = pick(pois)
      guard += 1
    }
    if (dropoff.id === pickup.id) return null

    const path = graph.findPath(pickup.id, dropoff.id, { vehicleTier: 'van', unlockedRoutes })
    if (!path) return null
    const distance = Math.max(20, path.totalDistance)

    const itemType: ItemType = pick(cfg.itemTypes)
    const specialFlags: SpecialFlag[] = []
    if (itemType === 'Fragile') specialFlags.push('Fragile')
    if (Math.random() < cfg.vipChance) specialFlags.push('VIP')
    if (this.mysteryWaveActive && Math.random() < 0.45) specialFlags.push('MysteryBox')
    const isMultiStop = Math.random() < cfg.multiStopChance

    const timeLimit = Math.round(cfg.timeLimitFlat + distance * cfg.timeLimitPerDistance)
    const basePayout = Math.round(randRange(cfg.minPayout, cfg.maxPayout) + distance * 0.15)
    const tipPotential = Math.round(basePayout * cfg.tipFactor * 100) / 100

    return {
      id: nextOrderId(),
      pickupNodeId: pickup.id,
      dropoffNodeId: dropoff.id,
      pickupLabel: pick(RESTAURANT_NAMES),
      dropoffLabel: `${pick(CLIENT_NAMES)}'s address`,
      itemType,
      distance: Math.round(distance),
      basePayout,
      timeLimit,
      tipPotential,
      difficultyTier: cfg.tier,
      isMultiStop,
      specialFlags,
      state: 'board',
      createdAt: now,
      boardExpiresAt: now + 10_000,
      acceptedAt: null,
      pickedUpAt: null,
      condition: 100,
      mysteryRevealed: false,
    }
  }

  spawnVipFlashOrder(now: number, graph: RoadGraph, unlockedDistricts: Set<string>, rep: number, unlockedRoutes: Set<string>): Order | null {
    const order = this.generateOrder(now, graph, unlockedDistricts, Math.max(rep, 6), unlockedRoutes)
    if (!order) return null
    order.specialFlags = [...new Set([...order.specialFlags, 'VIP' as const])]
    order.basePayout = Math.round(order.basePayout * 1.8)
    order.tipPotential = Math.round(order.tipPotential * 1.8 * 100) / 100
    order.timeLimit = Math.round(order.timeLimit * 0.7)
    order.boardExpiresAt = now + 30
    if (this.board.length >= MAX_BOARD_ORDERS) {
      this.board.sort((a, b) => a.createdAt - b.createdAt)
      this.board[0] = order
    } else {
      this.board.push(order)
    }
    return order
  }

  update(dt: number, now: number, graph: RoadGraph, unlockedDistricts: Set<string>, rep: number, unlockedRoutes: Set<string>): OrderSystemEvent[] {
    const events: OrderSystemEvent[] = []

    const stillValid: Order[] = []
    for (const o of this.board) {
      if (o.specialFlags.includes('VIP') && now > o.boardExpiresAt) {
        events.push({ type: 'vipExpired', order: o })
      } else {
        stillValid.push(o)
      }
    }
    this.board = stillValid

    this.refreshTimer -= dt
    if (this.refreshTimer <= 0 && this.board.length < MAX_BOARD_ORDERS + 1) {
      this.refreshTimer = randRange(REFRESH_MIN, REFRESH_MAX)
      const order = this.generateOrder(now, graph, unlockedDistricts, rep, unlockedRoutes)
      if (order) {
        if (this.board.length >= MAX_BOARD_ORDERS) {
          let oldestIdx = 0
          for (let i = 1; i < this.board.length; i++) if (this.board[i].createdAt < this.board[oldestIdx].createdAt) oldestIdx = i
          this.board[oldestIdx] = order
        } else {
          this.board.push(order)
        }
        events.push({ type: 'boardRefresh', order })
      }
    }

    const stillActive: Order[] = []
    for (const o of this.active) {
      if (o.acceptedAt != null && now - o.acceptedAt > o.timeLimit * OVERDUE_FAIL_MULTIPLIER) {
        o.state = 'failed'
        events.push({ type: 'failed', order: o, reason: 'overdue' })
        if (this.focusedOrderId === o.id) this.focusedOrderId = null
      } else {
        stillActive.push(o)
      }
    }
    this.active = stillActive
    this.autoFocus(now)

    return events
  }

  capacityUsed(): number {
    return this.active.length
  }

  acceptOrder(orderId: string, now: number, capacity: number): { ok: boolean; reason?: string } {
    if (this.active.length >= capacity) return { ok: false, reason: 'Cargo full — deliver or upgrade capacity first.' }
    const idx = this.board.findIndex((o) => o.id === orderId)
    if (idx === -1) return { ok: false, reason: 'Order no longer available.' }
    const [order] = this.board.splice(idx, 1)
    order.state = 'toPickup'
    order.acceptedAt = now
    this.active.push(order)
    if (!this.focusedOrderId) this.focusedOrderId = order.id
    return { ok: true }
  }

  setFocused(orderId: string): void {
    if (this.active.some((o) => o.id === orderId)) this.focusedOrderId = orderId
  }

  getFocused(): Order | undefined {
    return this.active.find((o) => o.id === this.focusedOrderId)
  }

  private autoFocus(now: number): void {
    if (this.active.length === 0) {
      this.focusedOrderId = null
      return
    }
    if (this.focusedOrderId && this.active.some((o) => o.id === this.focusedOrderId)) return
    const sorted = [...this.active].sort((a, b) => {
      const remainA = a.acceptedAt != null ? a.timeLimit - (now - a.acceptedAt) : Infinity
      const remainB = b.acceptedAt != null ? b.timeLimit - (now - b.acceptedAt) : Infinity
      return remainA - remainB
    })
    this.focusedOrderId = sorted[0]?.id ?? null
  }

  nearbyPickup(x: number, z: number, graph: RoadGraph): Order | undefined {
    return this.active
      .filter((o) => o.state === 'toPickup')
      .map((o) => ({ o, node: graph.getNode(o.pickupNodeId) }))
      .filter((e) => e.node && Math.hypot(e.node.x - x, e.node.z - z) <= PICKUP_RADIUS)
      .sort((a, b) => Math.hypot(a.node!.x - x, a.node!.z - z) - Math.hypot(b.node!.x - x, b.node!.z - z))[0]?.o
  }

  nearbyDropoff(x: number, z: number, graph: RoadGraph): Order | undefined {
    return this.active
      .filter((o) => o.state === 'toDropoff')
      .map((o) => ({ o, node: graph.getNode(o.dropoffNodeId) }))
      .filter((e) => e.node && Math.hypot(e.node.x - x, e.node.z - z) <= DROPOFF_RADIUS)
      .sort((a, b) => Math.hypot(a.node!.x - x, a.node!.z - z) - Math.hypot(b.node!.x - x, b.node!.z - z))[0]?.o
  }

  confirmPickup(orderId: string, now: number): void {
    const order = this.active.find((o) => o.id === orderId)
    if (!order) return
    order.state = 'toDropoff'
    order.pickedUpAt = now
  }

  confirmDropoff(orderId: string, now: number, payoutMultiplier: number): DeliveryResult | null {
    const order = this.active.find((o) => o.id === orderId)
    if (!order || order.pickedUpAt == null) return null
    const timeElapsed = now - order.pickedUpAt
    const otherActive = this.active.length - 1
    const breakdown = computePayout(order, timeElapsed, payoutMultiplier, otherActive)
    order.state = 'completed'
    order.mysteryRevealed = true
    this.active = this.active.filter((o) => o.id !== orderId)
    if (this.focusedOrderId === orderId) this.focusedOrderId = null
    this.autoFocus(now)
    return {
      order,
      payout: breakdown.total,
      tip: breakdown.tip,
      late: breakdown.late,
      conditionAtDropoff: order.condition,
      vip: order.specialFlags.includes('VIP'),
      mystery: order.specialFlags.includes('MysteryBox'),
    }
  }

  /** Called on hard vehicle impacts; degrades condition of any fragile/cold cargo currently carried. */
  degradeCondition(amount: number, retention: number, now: number): Order[] {
    const failed: Order[] = []
    for (const o of this.active) {
      const isPerishable = o.specialFlags.includes('Fragile') || o.itemType === 'Cold'
      if (!isPerishable || o.state === 'board' || o.state === 'completed' || o.state === 'failed') continue
      o.condition = Math.max(0, o.condition - amount * (1 - retention))
      if (o.condition <= 0) {
        o.state = 'failed'
        failed.push(o)
      }
    }
    if (failed.length > 0) {
      const failedIds = new Set(failed.map((f) => f.id))
      this.active = this.active.filter((o) => !failedIds.has(o.id))
      if (this.focusedOrderId && failedIds.has(this.focusedOrderId)) this.focusedOrderId = null
      this.autoFocus(now)
    }
    return failed
  }
}
