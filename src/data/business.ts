import type { PropertyDef, VehicleTierId } from '../types'

export const PROPERTIES: PropertyDef[] = [
  {
    id: 'lockup',
    name: 'Downtown Lock-Up',
    cost: 800,
    capacity: 2,
    unlockRep: 0,
    description: 'A small rented garage a few blocks from the depot. Room for 2 hires.',
    districtId: 'downtown',
    grid: [1, 1],
  },
  {
    id: 'warehouse',
    name: 'Old Town Warehouse',
    cost: 4000,
    capacity: 4,
    unlockRep: 2,
    description: 'Converted storage space with its own loading dock. Room for 4 hires.',
    districtId: 'oldtown',
    grid: [6, 6],
  },
  {
    id: 'distcenter',
    name: 'Suburbs Distribution Center',
    cost: 15000,
    capacity: 6,
    unlockRep: 4,
    description: 'A proper second depot with parking for a real fleet. Room for 6 hires.',
    districtId: 'suburbs',
    grid: [4, 4],
  },
  {
    id: 'hq',
    name: 'Uptown HQ',
    cost: 60000,
    capacity: 10,
    unlockRep: 8,
    description: 'A full logistics headquarters. Room for 10 hires.',
    districtId: 'uptown',
    grid: [1, 1],
  },
]

/** Passive income each hire earns you per pay cycle, before wages — scales with their vehicle tier. */
export const STAFF_INCOME_PER_CYCLE: Record<VehicleTierId, number> = {
  bicycle: 4,
  ebike: 8,
  scooter: 13,
  motorbike: 23,
  car: 40,
  van: 69,
}

/** What you pay each hire per cycle, regardless of how business is going. */
export const STAFF_WAGE_PER_CYCLE: Record<VehicleTierId, number> = {
  bicycle: 1,
  ebike: 2,
  scooter: 3,
  motorbike: 5,
  car: 8,
  van: 14,
}

export const CYCLE_SECONDS = 25

/** One-time fee to hire a staffer for this vehicle tier — well under the tier's own vehicle price. */
export const HIRE_COST: Record<VehicleTierId, number> = {
  bicycle: 100,
  ebike: 300,
  scooter: 700,
  motorbike: 1800,
  car: 4000,
  van: 9000,
}
