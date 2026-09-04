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
    for (const member of this.staff) {
      income += STAFF_INCOME_PER_CYCLE[member.vehicleTier]
      wages += STAFF_WAGE_PER_CYCLE[member.vehicleTier]
    }
    return { income, wages, net: income - wages }
  }
}
