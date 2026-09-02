import type { RoadGraph } from '../core/RoadGraph'
import { EVENT_DEFS } from '../data/events'
import type { GameEventDef, GameEventTypeId, GlobalModifiers } from '../types'

export interface EventWorldState {
  graph: RoadGraph
  unlockedDistricts: Set<string>
  spawnVipFlashOrder: () => void
  setMysteryWave: (active: boolean) => void
}

export interface GameEvent {
  id: string
  defId: GameEventTypeId
  name: string
  description: string
  icon: string
  startedAt: number
  duration: number
  apply: () => void
  revert: () => void
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** Data-driven random events: each GameEvent carries its own apply()/revert() so effects always undo cleanly. */
export class EventManager {
  private active: GameEvent[] = []
  private rollTimer = randRange(50, 80)
  private rushHourTimer: number
  private readonly modifiers: GlobalModifiers = { payoutMultiplier: 1, visibility: 1, handling: 1 }
  private readonly world: EventWorldState

  constructor(world: EventWorldState) {
    this.world = world
    this.rushHourTimer = EVENT_DEFS.find((d) => d.id === 'rushHour')?.intervalSeconds ?? 240
  }

  getModifiers(): GlobalModifiers {
    return this.modifiers
  }

  activeEvents(): GameEvent[] {
    return this.active
  }

  update(dt: number, now: number): { started: GameEvent[]; ended: GameEvent[] } {
    const started: GameEvent[] = []
    const ended: GameEvent[] = []

    this.rushHourTimer -= dt
    if (this.rushHourTimer <= 0 && !this.active.some((e) => e.defId === 'rushHour')) {
      this.rushHourTimer = EVENT_DEFS.find((d) => d.id === 'rushHour')?.intervalSeconds ?? 240
      const ev = this.createEvent('rushHour', now)
      if (ev) {
        ev.apply()
        this.active.push(ev)
        started.push(ev)
      }
    }

    this.rollTimer -= dt
    if (this.rollTimer <= 0) {
      this.rollTimer = randRange(60, 95)
      const def = this.rollWeighted()
      if (def) {
        const ev = this.createEvent(def.id, now)
        if (ev) {
          ev.apply()
          this.active.push(ev)
          started.push(ev)
        }
      }
    }

    const stillActive: GameEvent[] = []
    for (const ev of this.active) {
      if (now - ev.startedAt >= ev.duration) {
        ev.revert()
        ended.push(ev)
      } else {
        stillActive.push(ev)
      }
    }
    this.active = stillActive

    return { started, ended }
  }

  private rollWeighted(): GameEventDef | null {
    const candidates = EVENT_DEFS.filter((d) => !d.scheduled && !this.active.some((e) => e.defId === d.id))
    const totalWeight = candidates.reduce((sum, d) => sum + d.weight, 0)
    if (totalWeight <= 0) return null
    let r = Math.random() * totalWeight
    for (const d of candidates) {
      r -= d.weight
      if (r <= 0) return d
    }
    return candidates[candidates.length - 1] ?? null
  }

  private createEvent(id: GameEventTypeId, now: number): GameEvent | null {
    const def = EVENT_DEFS.find((d) => d.id === id)
    if (!def) return null
    const duration = randRange(def.minDuration, def.maxDuration)
    const base = {
      id: `${id}_${Math.floor(now * 1000)}_${Math.floor(Math.random() * 1000)}`,
      defId: id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      startedAt: now,
      duration,
    }

    switch (id) {
      case 'rainstorm':
        return {
          ...base,
          apply: () => {
            this.modifiers.handling *= 0.8
            this.modifiers.visibility *= 0.6
            this.modifiers.payoutMultiplier *= 1.2
          },
          revert: () => {
            this.modifiers.handling /= 0.8
            this.modifiers.visibility /= 0.6
            this.modifiers.payoutMultiplier /= 1.2
          },
        }
      case 'trafficJam': {
        const edge = this.world.graph.pickRandomOpenEdge(this.world.unlockedDistricts)
        if (!edge) return null
        return {
          ...base,
          apply: () => {
            edge.weightMultiplier *= 2.4
          },
          revert: () => {
            edge.weightMultiplier /= 2.4
          },
        }
      }
      case 'roadClosure': {
        const edge = this.world.graph.pickRandomOpenEdge(this.world.unlockedDistricts)
        if (!edge) return null
        return {
          ...base,
          apply: () => {
            edge.closed = true
          },
          revert: () => {
            edge.closed = false
          },
        }
      }
      case 'rushHour':
        return {
          ...base,
          apply: () => {
            this.modifiers.payoutMultiplier *= 1.15
            for (const e of this.world.graph.edges.values()) e.weightMultiplier *= 1.3
          },
          revert: () => {
            this.modifiers.payoutMultiplier /= 1.15
            for (const e of this.world.graph.edges.values()) e.weightMultiplier /= 1.3
          },
        }
      case 'vipFlashOrder':
        return {
          ...base,
          apply: () => this.world.spawnVipFlashOrder(),
          revert: () => {},
        }
      case 'mysteryBoxWave':
        return {
          ...base,
          apply: () => this.world.setMysteryWave(true),
          revert: () => this.world.setMysteryWave(false),
        }
      default:
        return null
    }
  }
}
