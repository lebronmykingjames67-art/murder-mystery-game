import type { EngineRef } from '../App'
import { getUpgradeSlots, VEHICLE_ORDER, VEHICLES } from '../data/vehicles'
import { nextUpgradeCost } from '../systems/UpgradeSystem'
import { useGameStore } from '../state/gameStore'

interface Props {
  engine: EngineRef
}

export function ShopScreen({ engine }: Props) {
  const cash = useGameStore((s) => s.cash)
  const owned = useGameStore((s) => s.ownedVehicles)
  const equipped = useGameStore((s) => s.equippedVehicle)
  const upgrades = useGameStore((s) => s.upgrades)
  const setScreen = useGameStore((s) => s.setScreen)

  return (
    <div className="modal-overlay" onClick={() => setScreen('none')}>
      <div className="modal-panel shop-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Depot — Garage &amp; Shop</h2>
          <div className="cash-pill">${cash.toFixed(2)}</div>
          <button className="btn-close" onClick={() => setScreen('none')}>
            ✕
          </button>
        </div>

        <section>
          <h3>Vehicles</h3>
          <div className="vehicle-grid">
            {VEHICLE_ORDER.map((id) => {
              const def = VEHICLES[id]
              const isOwned = owned.includes(id)
              const isEquipped = equipped === id
              return (
                <div className={`vehicle-card ${isEquipped ? 'vehicle-equipped' : ''}`} key={id}>
                  <div className="vehicle-name">{def.name}</div>
                  <div className="vehicle-stats">
                    <span>Speed {def.topSpeed}</span>
                    <span>Accel {def.acceleration}</span>
                    <span>Handling {def.handling.toFixed(1)}</span>
                    <span>Cargo {def.cargoCapacity}</span>
                  </div>
                  {def.unlockLabel && <div className="vehicle-unlock-label">{def.unlockLabel}</div>}
                  {isEquipped ? (
                    <div className="vehicle-tag">Equipped</div>
                  ) : isOwned ? (
                    <button className="btn-secondary" onClick={() => engine.current?.equipVehicle(id)}>
                      Equip
                    </button>
                  ) : (
                    <button className="btn-secondary" disabled={cash < def.cost} onClick={() => engine.current?.buyVehicle(id)}>
                      Buy ${def.cost}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h3>Upgrades — {VEHICLES[equipped].name}</h3>
          <div className="upgrade-grid">
            {getUpgradeSlots(equipped).map((slot) => {
              const level = upgrades[equipped]?.[slot.slot] ?? 0
              const next = nextUpgradeCost(equipped, slot.slot, level)
              return (
                <div className="upgrade-card" key={slot.slot}>
                  <div className="upgrade-name">{slot.name}</div>
                  <div className="upgrade-level">Level {level}/3</div>
                  {next ? (
                    <>
                      <div className="upgrade-desc">{next.description}</div>
                      <button className="btn-secondary" disabled={cash < next.cost} onClick={() => engine.current?.buyUpgrade(equipped, slot.slot)}>
                        Upgrade ${next.cost}
                      </button>
                    </>
                  ) : (
                    <div className="upgrade-desc">Maxed out</div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
        <p className="modal-hint">Esc to close · Progress saves automatically here.</p>
      </div>
    </div>
  )
}
