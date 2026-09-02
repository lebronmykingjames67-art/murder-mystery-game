import { CONNECTORS, DISTRICTS, SHORTCUT_ROUTE_ID, SHORTCUT_UNLOCK_REP } from '../data/districts'
import type { SaveData } from '../types'

export interface UnlockEvent {
  type: 'district' | 'route'
  id: string
  label: string
}

/** Rep is a one-way unlock track (never spent) gating districts, routes, and contract tiers. */
export class ReputationSystem {
  rep: number
  xp: number
  level: number
  readonly unlockedDistricts: Set<string>
  readonly unlockedRoutes: Set<string>

  constructor(save?: Partial<SaveData>) {
    this.rep = save?.rep ?? 0
    this.xp = save?.xp ?? 0
    this.level = save?.level ?? 1
    this.unlockedDistricts = new Set(save?.unlockedDistricts ?? ['downtown'])
    this.unlockedRoutes = new Set(save?.unlockedRoutes ?? [])
    this.checkUnlocks()
  }

  xpForNextLevel(): number {
    return Math.round(80 * Math.pow(this.level, 1.35))
  }

  addXp(amount: number): boolean {
    this.xp += amount
    let leveled = false
    while (this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel()
      this.level += 1
      leveled = true
    }
    return leveled
  }

  addRep(amount: number): UnlockEvent[] {
    this.rep += amount
    return this.checkUnlocks()
  }

  private checkUnlocks(): UnlockEvent[] {
    const events: UnlockEvent[] = []
    for (const d of DISTRICTS) {
      if (this.rep >= d.unlockRep && !this.unlockedDistricts.has(d.id)) {
        this.unlockedDistricts.add(d.id)
        events.push({ type: 'district', id: d.id, label: d.name })
      }
    }
    for (const c of CONNECTORS) {
      if (this.rep >= c.unlockRep && !this.unlockedRoutes.has(c.id)) {
        this.unlockedRoutes.add(c.id)
        events.push({ type: 'route', id: c.id, label: c.label })
      }
    }
    if (this.rep >= SHORTCUT_UNLOCK_REP && !this.unlockedRoutes.has(SHORTCUT_ROUTE_ID)) {
      this.unlockedRoutes.add(SHORTCUT_ROUTE_ID)
      events.push({ type: 'route', id: SHORTCUT_ROUTE_ID, label: 'Elm St. Alley shortcut (Old Town)' })
    }
    return events
  }

  nextDistrictPreview(): { name: string; repNeeded: number } | null {
    const locked = DISTRICTS.filter((d) => !this.unlockedDistricts.has(d.id)).sort((a, b) => a.unlockRep - b.unlockRep)
    if (locked.length === 0) return null
    return { name: locked[0].name, repNeeded: Math.max(0, locked[0].unlockRep - this.rep) }
  }
}
