import { create } from 'zustand'
import type {
  CosmeticDef,
  FloorKind,
  ModalType,
  MoneyPopup,
  RunHistoryEntry,
  RunStats,
  Screen,
  SettingsState,
  Toast,
  UpgradeDef,
} from '../types'
import { PLAYER } from '../core/constants'
import { defaultSave, loadSave, saveGame } from '../core/SaveSystem'
import { UPGRADE_EFFECTS, upgradeCost } from '../systems/UpgradeSystem'

let nextPopupId = 1
let nextToastId = 1

export interface RunResult {
  floorReached: number
  payout: number
  died: boolean
}

interface GameState {
  screen: Screen
  modal: ModalType
  isPointerLocked: boolean
  loading: boolean
  loadingLabel: string

  health: number
  maxHealth: number
  stamina: number
  maxStamina: number

  runMoney: number
  floorNumber: number
  floorKind: FloorKind | null
  objectiveText: string
  runStartedAt: number

  bankMoney: number
  upgradeLevels: Record<UpgradeDef['id'], number>
  ownedCosmetics: string[]
  equippedCosmetics: Partial<Record<CosmeticDef['slot'], string>>
  bestFloor: number
  stats: RunStats
  settings: SettingsState
  runHistory: RunHistoryEntry[]

  interactPrompt: string | null
  moneyPopups: MoneyPopup[]
  toasts: Toast[]
  damageFlashToken: number
  healFlashToken: number
  tutorialSeen: Record<string, boolean>

  pendingFloorReward: number
  lastRunResult: RunResult | null

  // actions
  hydrate: () => void
  setScreen: (s: Screen) => void
  openModal: (m: ModalType) => void
  closeModal: () => void
  setPointerLocked: (v: boolean) => void
  setLoading: (v: boolean, label?: string) => void

  setHealth: (v: number) => void
  damage: (amount: number) => void
  heal: (amount: number) => void
  setStamina: (v: number) => void

  startNewRun: () => void
  setFloor: (floorNumber: number, kind: FloorKind) => void
  setObjectiveText: (text: string) => void
  addRunMoney: (amount: number, worldPos?: { x: number; y: number }) => void
  completeFloor: (reward: number) => void
  cashOut: () => void
  riskIt: () => void
  failRun: () => void
  acknowledgeRunResult: () => void

  purchaseUpgrade: (id: UpgradeDef['id']) => boolean
  purchaseCosmetic: (def: CosmeticDef) => boolean
  equipCosmetic: (def: CosmeticDef) => void
  updateSettings: (partial: Partial<SettingsState>) => void

  pushToast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  removeMoneyPopup: (id: number) => void
  setInteractPrompt: (text: string | null) => void
  markTutorialSeen: (key: string) => void
  triggerDamageFlash: () => void
  triggerHealFlash: () => void
}

function recomputeMaxStats(upgradeLevels: Record<UpgradeDef['id'], number>) {
  return {
    maxHealth: PLAYER.maxHealth + UPGRADE_EFFECTS.health(upgradeLevels.health),
    maxStamina: PLAYER.maxStamina + UPGRADE_EFFECTS.stamina(upgradeLevels.stamina),
  }
}

export const useGameStore = create<GameState>((set, get) => {
  const save = loadSave()
  const { maxHealth, maxStamina } = recomputeMaxStats(save.upgradeLevels)

  function persist() {
    const s = get()
    saveGame({
      version: 1,
      bankMoney: s.bankMoney,
      upgradeLevels: s.upgradeLevels,
      ownedCosmetics: s.ownedCosmetics,
      equippedCosmetics: s.equippedCosmetics,
      bestFloor: s.bestFloor,
      stats: s.stats,
      settings: s.settings,
      runHistory: s.runHistory,
    })
  }

  const MAX_HISTORY = 10
  function addHistoryEntry(entry: RunHistoryEntry) {
    set((s) => ({ runHistory: [entry, ...s.runHistory].slice(0, MAX_HISTORY) }))
  }

  return {
    screen: 'boot',
    modal: null,
    isPointerLocked: false,
    loading: false,
    loadingLabel: '',

    health: maxHealth,
    maxHealth,
    stamina: maxStamina,
    maxStamina,

    runMoney: 0,
    floorNumber: 0,
    floorKind: null,
    objectiveText: '',
    runStartedAt: 0,

    bankMoney: save.bankMoney,
    upgradeLevels: save.upgradeLevels,
    ownedCosmetics: save.ownedCosmetics,
    equippedCosmetics: save.equippedCosmetics,
    bestFloor: save.bestFloor,
    stats: save.stats,
    settings: save.settings,
    runHistory: save.runHistory,

    interactPrompt: null,
    moneyPopups: [],
    toasts: [],
    damageFlashToken: 0,
    healFlashToken: 0,
    tutorialSeen: {},

    pendingFloorReward: 0,
    lastRunResult: null,

    hydrate: () => {
      const s = loadSave()
      const stats = recomputeMaxStats(s.upgradeLevels)
      set({
        bankMoney: s.bankMoney,
        upgradeLevels: s.upgradeLevels,
        ownedCosmetics: s.ownedCosmetics,
        equippedCosmetics: s.equippedCosmetics,
        bestFloor: s.bestFloor,
        stats: s.stats,
        settings: s.settings,
        runHistory: s.runHistory,
        maxHealth: stats.maxHealth,
        maxStamina: stats.maxStamina,
        health: stats.maxHealth,
        stamina: stats.maxStamina,
        screen: 'menu',
      })
    },

    setScreen: (screen) => set({ screen }),
    openModal: (modal) => set({ modal }),
    closeModal: () => set({ modal: null }),
    setPointerLocked: (v) => set({ isPointerLocked: v }),
    setLoading: (v, label = '') => set({ loading: v, loadingLabel: label }),

    setHealth: (v) => set((s) => ({ health: Math.max(0, Math.min(s.maxHealth, v)) })),
    damage: (amount) => {
      if (amount <= 0) return
      set((s) => ({ health: Math.max(0, s.health - amount) }))
      get().triggerDamageFlash()
    },
    heal: (amount) => {
      if (amount <= 0) return
      set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) }))
    },
    setStamina: (v) => set((s) => ({ stamina: Math.max(0, Math.min(s.maxStamina, v)) })),

    startNewRun: () => {
      const { maxHealth, maxStamina } = get()
      set({
        runMoney: 0,
        floorNumber: 0,
        floorKind: null,
        health: maxHealth,
        stamina: maxStamina,
        lastRunResult: null,
        runStartedAt: performance.now(),
        objectiveText: '',
      })
    },
    setFloor: (floorNumber, kind) => set({ floorNumber, floorKind: kind }),
    setObjectiveText: (text) => set({ objectiveText: text }),

    addRunMoney: (amount, worldPos) => {
      if (amount <= 0) return
      set((s) => ({ runMoney: s.runMoney + amount }))
      const id = nextPopupId++
      const x = worldPos?.x ?? 50
      const y = worldPos?.y ?? 50
      set((s) => ({ moneyPopups: [...s.moneyPopups, { id, amount, x, y }] }))
      window.setTimeout(() => get().removeMoneyPopup(id), 1400)
    },

    completeFloor: (reward) => {
      set((s) => ({
        runMoney: s.runMoney + reward,
        pendingFloorReward: reward,
        screen: 'floor-complete',
        bestFloor: Math.max(s.bestFloor, s.floorNumber),
        stats: { ...s.stats, floorsCompleted: s.stats.floorsCompleted + 1 },
      }))
      persist()
    },

    cashOut: () => {
      const s = get()
      const payout = s.runMoney
      const elapsed = (performance.now() - s.runStartedAt) / 1000
      set({
        bankMoney: s.bankMoney + payout,
        screen: 'cashed-out',
        lastRunResult: { floorReached: s.floorNumber, payout, died: false },
        stats: {
          ...s.stats,
          totalRuns: s.stats.totalRuns + 1,
          totalMoneyEarned: s.stats.totalMoneyEarned + payout,
          totalMoneyCashedOut: s.stats.totalMoneyCashedOut + payout,
          bestRunPayout: Math.max(s.stats.bestRunPayout, payout),
          longestRunSeconds: Math.max(s.stats.longestRunSeconds, elapsed),
        },
      })
      addHistoryEntry({ floorReached: s.floorNumber, payout, died: false, timestamp: Date.now() })
      persist()
    },

    riskIt: () => {
      set({ screen: 'run' })
    },

    failRun: () => {
      const s = get()
      const lost = s.runMoney
      const elapsed = (performance.now() - s.runStartedAt) / 1000
      set({
        screen: 'run-failed',
        lastRunResult: { floorReached: s.floorNumber, payout: lost, died: true },
        stats: {
          ...s.stats,
          totalRuns: s.stats.totalRuns + 1,
          totalDeaths: s.stats.totalDeaths + 1,
          highestFloor: Math.max(s.stats.highestFloor, s.floorNumber),
          totalMoneyEarned: s.stats.totalMoneyEarned + lost,
          longestRunSeconds: Math.max(s.stats.longestRunSeconds, elapsed),
        },
        runMoney: 0,
      })
      addHistoryEntry({ floorReached: s.floorNumber, payout: lost, died: true, timestamp: Date.now() })
      persist()
    },

    acknowledgeRunResult: () => set({ lastRunResult: null }),

    purchaseUpgrade: (id) => {
      const s = get()
      const level = s.upgradeLevels[id]
      const cost = upgradeCost(id, level)
      if (!Number.isFinite(cost) || s.bankMoney < cost) return false
      const upgradeLevels = { ...s.upgradeLevels, [id]: level + 1 }
      const { maxHealth, maxStamina } = recomputeMaxStats(upgradeLevels)
      set({
        bankMoney: s.bankMoney - cost,
        upgradeLevels,
        maxHealth,
        maxStamina,
        health: Math.min(maxHealth, s.health + (maxHealth - s.maxHealth)),
        stamina: Math.min(maxStamina, s.stamina + (maxStamina - s.maxStamina)),
      })
      persist()
      return true
    },

    purchaseCosmetic: (def) => {
      const s = get()
      if (s.ownedCosmetics.includes(def.id)) return false
      if (s.bankMoney < def.cost) return false
      set({
        bankMoney: s.bankMoney - def.cost,
        ownedCosmetics: [...s.ownedCosmetics, def.id],
      })
      persist()
      return true
    },

    equipCosmetic: (def) => {
      set((s) => ({ equippedCosmetics: { ...s.equippedCosmetics, [def.slot]: def.id } }))
      persist()
    },

    updateSettings: (partial) => {
      set((s) => ({ settings: { ...s.settings, ...partial } }))
      persist()
    },

    pushToast: (text, tone = 'info') => {
      const id = nextToastId++
      set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }))
      window.setTimeout(() => get().dismissToast(id), 3600)
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    removeMoneyPopup: (id) => set((s) => ({ moneyPopups: s.moneyPopups.filter((p) => p.id !== id) })),
    setInteractPrompt: (text) => set({ interactPrompt: text }),
    markTutorialSeen: (key) => set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [key]: true } })),
    triggerDamageFlash: () => set((s) => ({ damageFlashToken: s.damageFlashToken + 1 })),
    triggerHealFlash: () => set((s) => ({ healFlashToken: s.healFlashToken + 1 })),
  }
})

export function resetSaveForTesting() {
  saveGame(defaultSave())
}
