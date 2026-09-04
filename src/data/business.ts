import type { PropertyDef, VehicleTierId } from '../types'

export const PROPERTIES: PropertyDef[] = [
  {
    id: 'lockup',
    name: 'Downtown Lock-Up',
    cost: 800,
    capacity: 2,
    unlockRep: 0,
    description: 'A small rented garage a few blocks from the depot. Room for 2 hires.',
  },
  {
    id: 'warehouse',
    name: 'Old Town Warehouse',
    cost: 4000,
    capacity: 4,
    unlockRep: 2,
    description: 'Converted storage space with its own loading dock. Room for 4 hires.',
  },
  {
    id: 'distcenter',
    name: 'Suburbs Distribution Center',
    cost: 15000,
    capacity: 6,
    unlockRep: 4,
    description: 'A proper second depot with parking for a real fleet. Room for 6 hires.',
  },
  {
    id: 'hq',
    name: 'Uptown HQ',
    cost: 60000,
    capacity: 10,
    unlockRep: 8,
    description: 'A full logistics headquarters. Room for 10 hires.',
  },
]

/** Passive income each hire earns you per pay cycle, before wages — scales with their vehicle tier. */
export const STAFF_INCOME_PER_CYCLE: Record<VehicleTierId, number> = {
  bicycle: 4,
  ebike: 7,
  scooter: 10,
  motorbike: 16,
  car: 26,
  van: 42,
}

/** What you pay each hire per cycle, regardless of how business is going. */
export const STAFF_WAGE_PER_CYCLE: Record<VehicleTierId, number> = {
  bicycle: 1,
  ebike: 2,
  scooter: 3,
  motorbike: 4,
  car: 6,
  van: 9,
}

export const CYCLE_SECONDS = 25
export const HIRE_FEE_MULTIPLIER = 1.4
export const HIRE_FLAT_FEE = 150

export function hireCost(vehicleCost: number): number {
  return Math.round(vehicleCost * HIRE_FEE_MULTIPLIER + HIRE_FLAT_FEE)
}
