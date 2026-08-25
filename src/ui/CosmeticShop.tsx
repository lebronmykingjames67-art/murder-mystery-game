import { useGameStore } from '../state/store'
import { ModalShell } from './ModalShell'
import { COSMETIC_DEFS } from '../systems/CosmeticSystem'
import type { CosmeticDef } from '../types'
import { audioManager } from '../core/AudioManager'

const SLOTS: { slot: CosmeticDef['slot']; label: string }[] = [
  { slot: 'suit', label: 'SUIT' },
  { slot: 'visor', label: 'FACE / VISOR' },
  { slot: 'trim', label: 'TRIM' },
]

export function CosmeticShop() {
  const bankMoney = useGameStore((s) => s.bankMoney)
  const owned = useGameStore((s) => s.ownedCosmetics)
  const equipped = useGameStore((s) => s.equippedCosmetics)
  const purchaseCosmetic = useGameStore((s) => s.purchaseCosmetic)
  const equipCosmetic = useGameStore((s) => s.equipCosmetic)

  return (
    <ModalShell title="COSMETICS">
      <div className="modal-bank">
        BANK: <strong>${bankMoney.toLocaleString()}</strong> — purely visual, never a gameplay advantage.
      </div>
      {SLOTS.map(({ slot, label }) => (
        <div key={slot}>
          <div className="cosmetic-slot-label">{label}</div>
          <div className="cosmetic-grid">
            {COSMETIC_DEFS.filter((c) => c.slot === slot).map((def) => {
              const isOwned = owned.includes(def.id)
              const isEquipped = equipped[slot] === def.id
              return (
                <div className="cosmetic-card" key={def.id}>
                  <div className="cosmetic-swatch" style={{ background: def.color }} />
                  <div className="cosmetic-name">{def.name}</div>
                  <button
                    className={`buy-button${isEquipped ? ' equipped' : isOwned ? ' owned' : ''}`}
                    disabled={isEquipped || (!isOwned && bankMoney < def.cost)}
                    onClick={() => {
                      if (isOwned) {
                        equipCosmetic(def)
                        audioManager.uiClick()
                      } else if (purchaseCosmetic(def)) {
                        audioManager.money()
                        equipCosmetic(def)
                      }
                    }}
                  >
                    {isEquipped ? 'EQUIPPED' : isOwned ? 'EQUIP' : def.cost === 0 ? 'FREE' : `$${def.cost.toLocaleString()}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </ModalShell>
  )
}
