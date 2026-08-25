import { useGameStore } from '../state/store'
import { ModalShell } from './ModalShell'
import { UPGRADE_DEFS, upgradeCost } from '../systems/UpgradeSystem'
import { audioManager } from '../core/AudioManager'

export function UpgradeShop() {
  const bankMoney = useGameStore((s) => s.bankMoney)
  const upgradeLevels = useGameStore((s) => s.upgradeLevels)
  const purchaseUpgrade = useGameStore((s) => s.purchaseUpgrade)

  return (
    <ModalShell title="UPGRADES">
      <div className="modal-bank">
        BANK: <strong>${bankMoney.toLocaleString()}</strong>
      </div>
      {UPGRADE_DEFS.map((def) => {
        const level = upgradeLevels[def.id]
        const maxed = level >= def.maxLevel
        const cost = upgradeCost(def.id, level)
        const canAfford = !maxed && bankMoney >= cost

        return (
          <div className="upgrade-row" key={def.id}>
            <div>
              <div className="upgrade-name">{def.name.toUpperCase()}</div>
              <div className="upgrade-desc">{def.description}</div>
              <div className="level-dots">
                {Array.from({ length: def.maxLevel }).map((_, i) => (
                  <span className={`level-dot${i < level ? ' filled' : ''}`} key={i} />
                ))}
              </div>
            </div>
            <button
              className="buy-button"
              disabled={!canAfford}
              onClick={() => {
                if (purchaseUpgrade(def.id)) audioManager.money()
              }}
            >
              {maxed ? 'MAXED' : `$${cost.toLocaleString()}`}
            </button>
          </div>
        )
      })}
    </ModalShell>
  )
}
