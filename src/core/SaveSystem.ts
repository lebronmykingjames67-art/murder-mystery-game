import type { SaveData } from '../types'
import { SAVE_KEY, SAVE_VERSION } from './constants'
import { defaultUpgradeLevels } from '../systems/UpgradeSystem'
import { defaultOwnedCosmetics, defaultEquippedCosmetics } from '../systems/CosmeticSystem'

// Only progression persists (bank money, upgrades, cosmetics, best floor, stats, settings).
// Run money and in-progress floor state are intentionally never saved here — a run must
// always be risky, and reloading the page mid-run should not be a way to dodge that.

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    bankMoney: 0,
    upgradeLevels: defaultUpgradeLevels(),
    ownedCosmetics: defaultOwnedCosmetics(),
    equippedCosmetics: defaultEquippedCosmetics(),
    bestFloor: 0,
    stats: {
      totalRuns: 0,
      totalDeaths: 0,
      highestFloor: 0,
      totalMoneyEarned: 0,
      totalMoneyCashedOut: 0,
      floorsCompleted: 0,
      bestRunPayout: 0,
      longestRunSeconds: 0,
    },
    settings: {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.9,
      mouseSensitivity: 0.55,
      fov: 82,
      fullscreen: false,
    },
  }
}

export function loadSave(): SaveData {
  const fallback = defaultSave()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<SaveData>
    if (!parsed || typeof parsed !== 'object') return fallback
    return {
      version: SAVE_VERSION,
      bankMoney: typeof parsed.bankMoney === 'number' ? parsed.bankMoney : fallback.bankMoney,
      upgradeLevels: { ...fallback.upgradeLevels, ...(parsed.upgradeLevels ?? {}) },
      ownedCosmetics: Array.isArray(parsed.ownedCosmetics) ? parsed.ownedCosmetics : fallback.ownedCosmetics,
      equippedCosmetics: { ...fallback.equippedCosmetics, ...(parsed.equippedCosmetics ?? {}) },
      bestFloor: typeof parsed.bestFloor === 'number' ? parsed.bestFloor : fallback.bestFloor,
      stats: { ...fallback.stats, ...(parsed.stats ?? {}) },
      settings: { ...fallback.settings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return fallback
  }
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // Storage can fail (private browsing, quota). Losing persistence is not fatal —
    // the run itself must keep working.
  }
}
