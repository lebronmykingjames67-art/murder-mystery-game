import type { UpgradeLevelDef, UpgradeSlotDef, UpgradeSlotType, VehicleDef, VehicleTierId } from '../types'

// Stat units: topSpeed/acceleration in world units per second (and per second^2);
// handling is a turn-rate multiplier (higher = nimbler); cargoCapacity is order slots.
export const VEHICLES: Record<VehicleTierId, VehicleDef> = {
  bicycle: {
    id: 'bicycle',
    name: 'Beat-up Bicycle',
    cost: 0,
    topSpeed: 9,
    acceleration: 6,
    handling: 3.2,
    cargoCapacity: 1,
    color: 0x2d8f4e,
    accentColor: 0xdadada,
    bodyStyle: 'bike',
  },
  ebike: {
    id: 'ebike',
    name: 'E-Bike',
    cost: 500,
    topSpeed: 13,
    acceleration: 9,
    handling: 3.0,
    cargoCapacity: 2,
    color: 0x2f6fe0,
    accentColor: 0xf2f2f2,
    unlockLabel: 'Unlocks pedestrian-path shortcuts',
    bodyStyle: 'ebike',
  },
  scooter: {
    id: 'scooter',
    name: 'Scooter',
    cost: 1500,
    topSpeed: 16,
    acceleration: 9,
    handling: 2.4,
    cargoCapacity: 2,
    color: 0xe0b93a,
    accentColor: 0x2b2b2b,
    bodyStyle: 'scooter',
  },
  motorbike: {
    id: 'motorbike',
    name: 'Motorbike',
    cost: 4000,
    topSpeed: 22,
    acceleration: 10,
    handling: 1.9,
    cargoCapacity: 3,
    color: 0xd6432b,
    accentColor: 0x151515,
    unlockLabel: 'Unlocks highway connector routes',
    bodyStyle: 'motorbike',
  },
  car: {
    id: 'car',
    name: 'Compact Car',
    cost: 9000,
    topSpeed: 24,
    acceleration: 7,
    handling: 1.5,
    cargoCapacity: 4,
    color: 0xdedede,
    accentColor: 0x2f6fe0,
    weatherResistant: true,
    unlockLabel: 'Rain/weather resistant, +Cold-bag slot',
    bodyStyle: 'car',
  },
  van: {
    id: 'van',
    name: 'Delivery Van',
    cost: 20000,
    topSpeed: 20,
    acceleration: 5,
    handling: 1.2,
    cargoCapacity: 6,
    color: 0xffb200,
    accentColor: 0x1b1b1b,
    weatherResistant: true,
    unlockLabel: 'Unlocks Industrial Docks large-package contracts',
    bodyStyle: 'van',
  },
}

export const VEHICLE_ORDER: VehicleTierId[] = ['bicycle', 'ebike', 'scooter', 'motorbike', 'car', 'van']

const SLOT_NAMES: Record<UpgradeSlotType, string> = {
  engine: 'Engine Tuning',
  tires: 'Tires & Suspension',
  cargo: 'Cargo Rig',
  utility: 'Utility',
}

function scaledCost(vehicleCost: number, factor: number): number {
  const base = Math.max(80, vehicleCost * factor)
  return Math.round(base / 10) * 10
}

function buildLevels(vehicle: VehicleDef, slot: UpgradeSlotType): UpgradeLevelDef[] {
  const speedStep = vehicle.topSpeed * 0.08
  const accelStep = vehicle.acceleration * 0.1
  const handlingStep = vehicle.handling * 0.06

  switch (slot) {
    case 'engine':
      return [
        { level: 1, cost: scaledCost(vehicle.cost, 0.12), description: '+Top speed', effect: { topSpeed: speedStep } },
        {
          level: 2,
          cost: scaledCost(vehicle.cost, 0.26),
          description: '+Top speed, +Acceleration',
          effect: { topSpeed: speedStep, acceleration: accelStep },
        },
        {
          level: 3,
          cost: scaledCost(vehicle.cost, 0.48),
          description: '+Top speed, +Acceleration (major)',
          effect: { topSpeed: speedStep * 1.4, acceleration: accelStep * 1.4 },
        },
      ]
    case 'tires':
      return [
        { level: 1, cost: scaledCost(vehicle.cost, 0.1), description: '+Handling', effect: { handling: handlingStep } },
        { level: 2, cost: scaledCost(vehicle.cost, 0.22), description: '+Handling, +Pothole resistance', effect: { handling: handlingStep, fragileRetention: 0.08 } },
        { level: 3, cost: scaledCost(vehicle.cost, 0.4), description: '+Handling (major)', effect: { handling: handlingStep * 1.6 } },
      ]
    case 'cargo':
      return [
        { level: 1, cost: scaledCost(vehicle.cost, 0.15), description: '+1 order capacity', effect: { cargoCapacity: 1 } },
        { level: 2, cost: scaledCost(vehicle.cost, 0.2), description: '+Fragile-item condition retention', effect: { fragileRetention: 0.18 } },
        { level: 3, cost: scaledCost(vehicle.cost, 0.5), description: '+1 order capacity', effect: { cargoCapacity: 1 } },
      ]
    case 'utility':
      return [
        { level: 1, cost: scaledCost(vehicle.cost, 0.1), description: '+Boost meter capacity', effect: { boostCapacity: 25 } },
        { level: 2, cost: scaledCost(vehicle.cost, 0.16), description: 'Faster pickup/dropoff', effect: { pickupSpeedMultiplier: 0.75 } },
        {
          level: 3,
          cost: scaledCost(vehicle.cost, 0.3),
          description: '+Boost meter capacity, GPS Sense (highlights high-tip orders)',
          effect: { boostCapacity: 25 },
        },
      ]
  }
}

export function getUpgradeSlots(vehicleId: VehicleTierId): UpgradeSlotDef[] {
  const vehicle = VEHICLES[vehicleId]
  return (['engine', 'tires', 'cargo', 'utility'] as UpgradeSlotType[]).map((slot) => ({
    slot,
    name: SLOT_NAMES[slot],
    levels: buildLevels(vehicle, slot),
  }))
}
