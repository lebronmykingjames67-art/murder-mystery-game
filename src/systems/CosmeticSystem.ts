import type { CosmeticDef } from '../types'

// Cosmetics are purely visual (visible on the first-person arms/viewmodel and the lobby
// mirror-of-sorts reflection accent) — they must never affect gameplay stats.
export const COSMETIC_DEFS: CosmeticDef[] = [
  { id: 'suit-default', name: 'Standard Coveralls', slot: 'suit', color: '#4a5058', cost: 0 },
  { id: 'suit-crimson', name: 'Crimson Coveralls', slot: 'suit', color: '#8a2e2e', cost: 500 },
  { id: 'suit-teal', name: 'Teal Coveralls', slot: 'suit', color: '#2e7a7a', cost: 500 },
  { id: 'suit-gold', name: 'Gilded Coveralls', slot: 'suit', color: '#c9a24b', cost: 2500 },
  { id: 'suit-void', name: 'Void Coveralls', slot: 'suit', color: '#1a1a22', cost: 4000 },

  { id: 'visor-default', name: 'Bare Face', slot: 'visor', color: '#d9c9a8', cost: 0 },
  { id: 'visor-amber', name: 'Amber Visor', slot: 'visor', color: '#e2b23c', cost: 800 },
  { id: 'visor-neon', name: 'Neon Visor', slot: 'visor', color: '#3ce2c8', cost: 1600 },

  { id: 'trim-default', name: 'No Trim', slot: 'trim', color: '#2a2d32', cost: 0 },
  { id: 'trim-white', name: 'White Trim', slot: 'trim', color: '#e8e8ea', cost: 600 },
  { id: 'trim-hazard', name: 'Hazard Stripe', slot: 'trim', color: '#e0a415', cost: 1200 },
]

export function cosmeticDef(id: string): CosmeticDef | undefined {
  return COSMETIC_DEFS.find((c) => c.id === id)
}

export function defaultOwnedCosmetics(): string[] {
  return COSMETIC_DEFS.filter((c) => c.cost === 0).map((c) => c.id)
}

export function defaultEquippedCosmetics(): Partial<Record<CosmeticDef['slot'], string>> {
  return { suit: 'suit-default', visor: 'visor-default', trim: 'trim-default' }
}
