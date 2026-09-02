import { VEHICLES, getUpgradeSlots } from '../data/vehicles'
import type { UpgradeSlotType, VehicleDef, VehicleTierId } from '../types'

export interface EffectiveStats {
  topSpeed: number
  acceleration: number
  handling: number
  cargoCapacity: number
  boostCapacityBonus: number
  fragileRetention: number
  pickupSpeedMultiplier: number
}

export function computeEffectiveStats(vehicleId: VehicleTierId, upgradeLevels: Partial<Record<UpgradeSlotType, number>>): EffectiveStats {
  const def = VEHICLES[vehicleId]
  const stats: EffectiveStats = {
    topSpeed: def.topSpeed,
    acceleration: def.acceleration,
    handling: def.handling,
    cargoCapacity: def.cargoCapacity,
    boostCapacityBonus: 0,
    fragileRetention: 0,
    pickupSpeedMultiplier: 1,
  }
  for (const slotDef of getUpgradeSlots(vehicleId)) {
    const ownedLevel = upgradeLevels[slotDef.slot] ?? 0
    for (const lvl of slotDef.levels) {
      if (lvl.level > ownedLevel) break
      const fx = lvl.effect
      if (fx.topSpeed) stats.topSpeed += fx.topSpeed
      if (fx.acceleration) stats.acceleration += fx.acceleration
      if (fx.handling) stats.handling += fx.handling
      if (fx.cargoCapacity) stats.cargoCapacity += fx.cargoCapacity
      if (fx.boostCapacity) stats.boostCapacityBonus += fx.boostCapacity
      if (fx.fragileRetention) stats.fragileRetention += fx.fragileRetention
      if (fx.pickupSpeedMultiplier) stats.pickupSpeedMultiplier = Math.min(stats.pickupSpeedMultiplier, fx.pickupSpeedMultiplier)
    }
  }
  return stats
}

export function nextUpgradeCost(vehicleId: VehicleTierId, slot: UpgradeSlotType, currentLevel: number) {
  const slotDef = getUpgradeSlots(vehicleId).find((s) => s.slot === slot)
  return slotDef?.levels.find((l) => l.level === currentLevel + 1) ?? null
}

export function vehicleDef(vehicleId: VehicleTierId): VehicleDef {
  return VEHICLES[vehicleId]
}
