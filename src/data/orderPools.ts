import type { ItemType } from '../types'

export const RESTAURANT_NAMES = [
  "Marco's Pizzeria",
  'Golden Wok',
  'The Burger Stop',
  'Sakura Sushi',
  'Corner Deli',
  'Taco Fiesta',
  'Bean There Coffee',
  'The Noodle House',
  'Riverside Grill',
  'Sunrise Bakery',
  'Spice Route',
  'Blue Plate Diner',
  'Pierogi Palace',
  'The Green Bowl',
  'Downtown Creamery',
]

export const CLIENT_NAMES = [
  'A. Chen',
  'M. Okafor',
  'J. Alvarez',
  'S. Patel',
  'R. Novak',
  'T. Kowalski',
  'L. Andersson',
  'D. Osei',
  'K. Nakamura',
  'B. Fitzgerald',
  'C. Romano',
  'E. Larsen',
  'F. Delgado',
  'W. Nakashima',
  'P. Costa',
]

export const PACKAGE_SOURCES = [
  'City Parcel Depot',
  'QuickShip Warehouse',
  'The Print Shop',
  'FlowerWorks',
  'TechFix Repairs',
  'The Wine Cellar',
  'Harbor Hardware',
  'Uptown Pharmacy',
]

export interface TierConfig {
  tier: number
  requiredRep: number
  itemTypes: ItemType[]
  minPayout: number
  maxPayout: number
  timeLimitPerDistance: number
  timeLimitFlat: number
  tipFactor: number
  multiStopChance: number
  fragileChance: number
  vipChance: number
}

export const TIER_CONFIGS: TierConfig[] = [
  {
    tier: 1,
    requiredRep: 0,
    itemTypes: ['Food', 'Package', 'Documents'],
    minPayout: 8,
    maxPayout: 18,
    timeLimitPerDistance: 0.9,
    timeLimitFlat: 35,
    tipFactor: 0.5,
    multiStopChance: 0,
    fragileChance: 0,
    vipChance: 0,
  },
  {
    tier: 2,
    requiredRep: 2,
    itemTypes: ['Food', 'Package', 'Documents', 'Fragile', 'Cold'],
    minPayout: 14,
    maxPayout: 26,
    timeLimitPerDistance: 0.8,
    timeLimitFlat: 30,
    tipFactor: 0.55,
    multiStopChance: 0.1,
    fragileChance: 0.25,
    vipChance: 0,
  },
  {
    tier: 3,
    requiredRep: 4,
    itemTypes: ['Food', 'Package', 'Documents', 'Fragile', 'Cold'],
    minPayout: 20,
    maxPayout: 38,
    timeLimitPerDistance: 0.75,
    timeLimitFlat: 28,
    tipFactor: 0.6,
    multiStopChance: 0.3,
    fragileChance: 0.3,
    vipChance: 0.05,
  },
  {
    tier: 4,
    requiredRep: 6,
    itemTypes: ['Food', 'Package', 'Documents', 'Fragile', 'Cold', 'Hazmat'],
    minPayout: 30,
    maxPayout: 55,
    timeLimitPerDistance: 0.7,
    timeLimitFlat: 25,
    tipFactor: 0.65,
    multiStopChance: 0.35,
    fragileChance: 0.3,
    vipChance: 0.12,
  },
  {
    tier: 5,
    requiredRep: 8,
    itemTypes: ['Food', 'Package', 'Documents', 'Fragile', 'Cold', 'Hazmat'],
    minPayout: 45,
    maxPayout: 90,
    timeLimitPerDistance: 0.65,
    timeLimitFlat: 22,
    tipFactor: 0.7,
    multiStopChance: 0.4,
    fragileChance: 0.35,
    vipChance: 0.18,
  },
]

export function tierConfigForRep(rep: number): TierConfig {
  let best = TIER_CONFIGS[0]
  for (const cfg of TIER_CONFIGS) {
    if (rep >= cfg.requiredRep) best = cfg
  }
  return best
}
