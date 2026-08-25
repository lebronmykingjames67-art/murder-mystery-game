import type { UpgradeDef } from '../types'

export const UPGRADE_DEFS: UpgradeDef[] = [
  {
    id: 'stamina',
    name: 'Lungs',
    description: 'Increases maximum stamina, letting you sprint longer.',
    maxLevel: 5,
    baseCost: 150,
    costGrowth: 1.55,
  },
  {
    id: 'health',
    name: 'Grit',
    description: 'Increases maximum health.',
    maxLevel: 5,
    baseCost: 175,
    costGrowth: 1.55,
  },
  {
    id: 'luck',
    name: 'Instinct',
    description: 'Improves the odds of finding valuable loot.',
    maxLevel: 5,
    baseCost: 200,
    costGrowth: 1.6,
  },
  {
    id: 'speed',
    name: 'Stride',
    description: 'Slightly increases base movement speed.',
    maxLevel: 5,
    baseCost: 200,
    costGrowth: 1.6,
  },
  {
    id: 'time',
    name: 'Focus',
    description: 'Adds extra seconds to timed floor challenges.',
    maxLevel: 5,
    baseCost: 150,
    costGrowth: 1.5,
  },
]

export function upgradeDef(id: UpgradeDef['id']): UpgradeDef {
  const def = UPGRADE_DEFS.find((u) => u.id === id)
  if (!def) throw new Error(`Unknown upgrade id: ${id}`)
  return def
}

export function upgradeCost(id: UpgradeDef['id'], currentLevel: number): number {
  const def = upgradeDef(id)
  if (currentLevel >= def.maxLevel) return Infinity
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel))
}

export function defaultUpgradeLevels(): Record<UpgradeDef['id'], number> {
  return { stamina: 0, health: 0, luck: 0, speed: 0, time: 0 }
}

/** Small, deliberately modest per-level bonuses — the game stays skill-based. */
export const UPGRADE_EFFECTS = {
  stamina: (level: number) => level * 12, // + max stamina
  health: (level: number) => level * 10, // + max health
  luck: (level: number) => level * 0.06, // + fraction toward better loot rolls
  speed: (level: number) => level * 0.045, // + fraction move speed
  time: (level: number) => level * 4, // + seconds on timers
}
