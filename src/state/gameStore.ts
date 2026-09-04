import { create } from 'zustand'
import type { GameEvent } from '../systems/EventManager'
import type { GlobalModifiers, NavInfo, Order, StaffMember, UpgradeSlotType, VehicleTierId } from '../types'

export type ScreenId = 'none' | 'orderBoard' | 'shop' | 'map' | 'pause'

export interface Toast {
  id: string
  kind: 'delivery' | 'event' | 'unlock' | 'fail' | 'info' | 'levelUp' | 'milestone'
  title: string
  detail?: string
  createdAt: number
}

export interface GameStoreState {
  ready: boolean

  // Continuous, updated every frame.
  speed: number
  topSpeed: number
  boostMeter: number
  playerX: number
  playerZ: number
  playerHeading: number
  simNow: number
  districtId: string | null
  districtName: string
  isNight: number
  interactPrompt: string | null
  navInfo: NavInfo | null
  vehicleHealth: number
  vehicleBrokenDown: boolean
  isRaining: boolean

  // Occasional, updated at mutation points.
  cash: number
  rep: number
  xp: number
  xpForNextLevel: number
  level: number
  nextDistrictPreview: { name: string; repNeeded: number } | null
  boardOrders: Order[]
  activeOrders: Order[]
  focusedOrderId: string | null
  capacity: number
  ownedVehicles: VehicleTierId[]
  equippedVehicle: VehicleTierId
  upgrades: Partial<Record<VehicleTierId, Partial<Record<UpgradeSlotType, number>>>>
  unlockedDistricts: string[]
  unlockedRoutes: string[]
  modifiers: GlobalModifiers
  activeEvents: GameEvent[]
  toasts: Toast[]
  screen: ScreenId
  muted: boolean
  ownedProperties: string[]
  staff: StaffMember[]
  staffCapacity: number
  completedMilestones: string[]

  pushToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void
  dismissToast: (id: string) => void
  setScreen: (screen: ScreenId) => void
}

let toastCounter = 0

export const useGameStore = create<GameStoreState>((set) => ({
  ready: false,

  speed: 0,
  topSpeed: 1,
  boostMeter: 100,
  playerX: 0,
  playerZ: 0,
  playerHeading: 0,
  simNow: 0,
  districtId: 'downtown',
  districtName: 'Downtown Core',
  isNight: 0,
  interactPrompt: null,
  navInfo: null,
  vehicleHealth: 100,
  vehicleBrokenDown: false,
  isRaining: false,

  cash: 0,
  rep: 0,
  xp: 0,
  xpForNextLevel: 100,
  level: 1,
  nextDistrictPreview: null,
  boardOrders: [],
  activeOrders: [],
  focusedOrderId: null,
  capacity: 1,
  ownedVehicles: ['bicycle'],
  equippedVehicle: 'bicycle',
  upgrades: {},
  unlockedDistricts: ['downtown'],
  unlockedRoutes: [],
  modifiers: { payoutMultiplier: 1, visibility: 1, handling: 1 },
  activeEvents: [],
  toasts: [],
  screen: 'none',
  muted: false,
  ownedProperties: [],
  staff: [],
  staffCapacity: 0,
  completedMilestones: [],

  pushToast: (toast) =>
    set((state) => {
      toastCounter += 1
      const entry: Toast = { ...toast, id: `toast_${toastCounter}`, createdAt: performance.now() }
      const next = [...state.toasts, entry]
      return { toasts: next.length > 5 ? next.slice(next.length - 5) : next }
    }),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setScreen: (screen) => set({ screen }),
}))

declare global {
  interface Window {
    __gameStoreForDebug?: typeof useGameStore
  }
}

if (import.meta.env.DEV) {
  window.__gameStoreForDebug = useGameStore
}
