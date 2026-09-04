import type { SaveData } from '../types'

const STORAGE_KEY = 'delivery-rush-save-v1'
export const SAVE_VERSION = 1

export function defaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    cash: 40,
    rep: 0,
    xp: 0,
    level: 1,
    ownedVehicles: ['bicycle'],
    equippedVehicle: 'bicycle',
    upgrades: {},
    unlockedDistricts: ['downtown'],
    unlockedRoutes: [],
    cargoBonusSlots: 0,
    ownedProperties: [],
    staff: [],
    vehicleHealth: {},
    completedMilestones: [],
    stats: { deliveriesCompleted: 0, deliveriesFailed: 0, totalEarned: 0 },
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSaveData()
    const parsed = JSON.parse(raw) as Partial<SaveData>
    if (parsed.version !== SAVE_VERSION) return defaultSaveData()
    return { ...defaultSaveData(), ...parsed }
  } catch {
    return defaultSaveData()
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable (private mode / quota) — non-critical, skip silently.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
