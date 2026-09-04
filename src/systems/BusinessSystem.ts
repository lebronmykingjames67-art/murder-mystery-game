import { CLIENT_NAMES } from '../data/orderPools'
import { CYCLE_SECONDS, PROPERTIES, STAFF_INCOME_PER_CYCLE, STAFF_WAGE_PER_CYCLE } from '../data/business'
import type { SaveData, StaffMember, VehicleTierId } from '../types'

let staffCounter = 0
function nextStaffId(): string {
  staffCounter += 1
  return `staff_${staffCounter}_${Math.floor(Math.random() * 1000)}`
}

export interface PayCycleResult {
  income: number
  wages: number
  net: number
  /** The single best individual haul this cycle, if any staffer hit a jackpot-tier result. */
  standout?: { name: string; amount: number }
}

// Weighted outcome roll per staffer per cycle — mirrors how the player's own deliveries swing
// wildly (a slow tier-1 job vs. a VIP payout), instead of everyone earning the exact same amount
// every cycle. Multiplier ranges are tuned so the weighted average lands on ~1.0x — long-run
// income stays the same as before, it's just no longer flat.
const JACKPOT_CHANCE = 0.06
const SLOW_CHANCE = 0.3
const JACKPOT_RANGE: [number, number] = [5, 10]
const SLOW_RANGE: [number, number] = [0.15, 0.5]
const NORMAL_RANGE: [number, number] = [0.4, 1.0]
/** A cycle result at or above this multiple of the staffer's base income gets called out in a toast. */
const STANDOUT_THRESHOLD_MULTIPLIER = 4

function randInRange([min, max]: [number, number]): number {
  return min + Math.random() * (max - min)
}

/** Manages hired staff and owned property. Cash checks/deductions stay in GameEngine, matching how vehicle purchases work. */
export class BusinessSystem {
  readonly ownedProperties: Set<string>
  staff: StaffMember[]
  private cycleTimer = CYCLE_SECONDS

  constructor(save?: Partial<SaveData>) {
    this.ownedProperties = new Set(save?.ownedProperties ?? [])
    this.staff = save?.staff ? [...save.staff] : []
  }

  capacity(): number {
    return PROPERTIES.filter((p) => this.ownedProperties.has(p.id)).reduce((sum, p) => sum + p.capacity, 0)
  }

  canHire(): boolean {
    return this.staff.length < this.capacity()
  }

  hire(vehicleTier: VehicleTierId, now: number): StaffMember | null {
    if (!this.canHire()) return null
    const member: StaffMember = {
      id: nextStaffId(),
      name: CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)],
      vehicleTier,
      hiredAt: now,
    }
    this.staff.push(member)
    return member
  }

  fire(staffId: string): boolean {
    const idx = this.staff.findIndex((s) => s.id === staffId)
    if (idx === -1) return false
    this.staff.splice(idx, 1)
    return true
  }

  buyProperty(id: string): boolean {
    if (this.ownedProperties.has(id)) return false
    this.ownedProperties.add(id)
    return true
  }

  /** Ticks the pay-cycle timer; returns a result only on the cycle it fires. */
  update(dt: number): PayCycleResult | null {
    this.cycleTimer -= dt
    if (this.cycleTimer > 0) return null
    this.cycleTimer = CYCLE_SECONDS
    let income = 0
    let wages = 0
    let standout: { name: string; amount: number } | undefined
    for (const member of this.staff) {
      const base = STAFF_INCOME_PER_CYCLE[member.vehicleTier]
      const roll = Math.random()
      const multiplier = roll < JACKPOT_CHANCE ? randInRange(JACKPOT_RANGE) : roll < JACKPOT_CHANCE + SLOW_CHANCE ? randInRange(SLOW_RANGE) : randInRange(NORMAL_RANGE)
      const memberIncome = Math.round(base * multiplier * 100) / 100
      income += memberIncome
      wages += STAFF_WAGE_PER_CYCLE[member.vehicleTier]
      if (memberIncome >= base * STANDOUT_THRESHOLD_MULTIPLIER && (!standout || memberIncome > standout.amount)) {
        standout = { name: member.name, amount: memberIncome }
      }
    }
    return { income: Math.round(income * 100) / 100, wages, net: Math.round((income - wages) * 100) / 100, standout }
  }
}
