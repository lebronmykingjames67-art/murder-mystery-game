export interface HollowSignalState {
  sceneId: string
  staticMeter: number
  flags: Record<string, boolean>
  answeredCount: number
  silentCount: number
  switchedCount: number
  seenRadioEvents: string[]
  pagesFound: string[]
}

const STORAGE_KEY = 'hollow-signal-save-v1'
export const TOTAL_HIDDEN_PAGES = 6

export function createInitialState(): HollowSignalState {
  return {
    sceneId: 'act1',
    staticMeter: 100,
    flags: {},
    answeredCount: 0,
    silentCount: 0,
    switchedCount: 0,
    seenRadioEvents: [],
    pagesFound: [],
  }
}

type Listener = (s: HollowSignalState) => void

export class GameStateStore {
  state: HollowSignalState
  private listeners = new Set<Listener>()

  constructor(initial?: HollowSignalState) {
    this.state = initial ?? createInitialState()
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    for (const l of this.listeners) l(this.state)
  }

  /** Replaces the working state wholesale (New Game / Continue) without invalidating references other systems hold to the store itself. */
  resetTo(state: HollowSignalState) {
    this.state = state
    this.emit()
  }

  setStatic(delta: number) {
    this.state.staticMeter = Math.max(0, Math.min(100, this.state.staticMeter + delta))
    this.emit()
  }

  setFlag(flag: string, value = true) {
    this.state.flags[flag] = value
    this.emit()
  }

  hasFlag(flag: string): boolean {
    return !!this.state.flags[flag]
  }

  addPage(id: string) {
    if (!this.state.pagesFound.includes(id)) {
      this.state.pagesFound.push(id)
      this.emit()
    }
  }

  recordChoice(kind: 'answer' | 'silent' | 'switch') {
    if (kind === 'answer') this.state.answeredCount++
    else if (kind === 'silent') this.state.silentCount++
    else this.state.switchedCount++
    this.emit()
  }

  markSeen(eventId: string) {
    if (!this.state.seenRadioEvents.includes(eventId)) {
      this.state.seenRadioEvents.push(eventId)
      this.emit()
    }
  }

  hasSeen(eventId: string): boolean {
    return this.state.seenRadioEvents.includes(eventId)
  }

  gotoScene(sceneId: string) {
    this.state.sceneId = sceneId
    this.emit()
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
  }

  static hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEY) != null
  }

  static load(): HollowSignalState | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as HollowSignalState
    } catch {
      return null
    }
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY)
  }
}
