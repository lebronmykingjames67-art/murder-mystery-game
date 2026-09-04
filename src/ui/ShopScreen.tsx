import type { EngineRef } from '../App'
import { getUpgradeSlots, VEHICLE_ORDER, VEHICLES } from '../data/vehicles'
import { nextUpgradeCost } from '../systems/UpgradeSystem'
import { PROPERTIES, HIRE_COST, STAFF_INCOME_PER_CYCLE, STAFF_WAGE_PER_CYCLE } from '../data/business'
import { useGameStore } from '../state/gameStore'

interface Props {
  engine: EngineRef
}

export function ShopScreen({ engine }: Props) {
  const cash = useGameStore((s) => s.cash)
  const rep = useGameStore((s) => s.rep)
  const owned = useGameStore((s) => s.ownedVehicles)
  const equipped = useGameStore((s) => s.equippedVehicle)
  const upgrades = useGameStore((s) => s.upgrades)
  const ownedProperties = useGameStore((s) => s.ownedProperties)
  const staff = useGameStore((s) => s.staff)
  const staffCapacity = useGameStore((s) => s.staffCapacity)
  const vehicleHealth = useGameStore((s) => s.vehicleHealth)
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
                  {isEquipped && (
                    <div className={`health-bar-row ${vehicleHealth < 35 ? 'health-bar-critical' : ''}`}>
                      <div className="health-bar-track">
                        <div className="health-bar-fill" style={{ width: `${vehicleHealth}%` }} />
                      </div>
                      <span>{Math.round(vehicleHealth)}% health</span>
                    </div>
                  )}
                  {isEquipped ? (
                    <div className="vehicle-tag-row">
                      <div className="vehicle-tag">Equipped</div>
                      {vehicleHealth < 100 && (
                        <button className="btn-secondary" disabled={cash < (engine.current?.repairCost(id) ?? Infinity)} onClick={() => engine.current?.repairVehicle(id)}>
                          Repair ${engine.current?.repairCost(id) ?? 0}
                        </button>
                      )}
                    </div>
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

        <section>
          <h3>Property</h3>
          <div className="vehicle-grid">
            {PROPERTIES.map((p) => {
              const isOwned = ownedProperties.includes(p.id)
              const locked = rep < p.unlockRep
              return (
                <div className={`vehicle-card ${isOwned ? 'vehicle-equipped' : ''}`} key={p.id}>
                  <div className="vehicle-name">{p.name}</div>
                  <div className="vehicle-stats">
                    <span>+{p.capacity} hire slots</span>
                  </div>
                  <div className="vehicle-unlock-label">{p.description}</div>
                  {isOwned ? (
                    <div className="vehicle-tag">Owned</div>
                  ) : locked ? (
                    <div className="vehicle-tag">Requires Rep {p.unlockRep}</div>
                  ) : (
                    <button className="btn-secondary" disabled={cash < p.cost} onClick={() => engine.current?.buyProperty(p.id)}>
                      Buy ${p.cost}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h3>
            Staff ({staff.length}/{staffCapacity})
          </h3>
          <div className="vehicle-grid">
            {VEHICLE_ORDER.map((id) => {
              const def = VEHICLES[id]
              const cost = HIRE_COST[id]
              const avgNet = STAFF_INCOME_PER_CYCLE[id] - STAFF_WAGE_PER_CYCLE[id]
              return (
                <div className="vehicle-card" key={id}>
                  <div className="vehicle-name">Hire a {def.name} driver</div>
                  <div className="vehicle-stats">
                    <span>~${avgNet}/cycle avg — swings low to a big contract</span>
                  </div>
                  <button className="btn-secondary" disabled={cash < cost || staff.length >= staffCapacity} onClick={() => engine.current?.hireStaff(id)}>
                    Hire ${cost}
                  </button>
                </div>
              )
            })}
          </div>
          {staff.length > 0 && (
            <div className="staff-roster">
              {staff.map((member) => (
                <div className="staff-row" key={member.id}>
                  <span className="staff-name">{member.name}</span>
                  <span className="staff-vehicle">{VEHICLES[member.vehicleTier].name}</span>
                  <button className="btn-secondary staff-fire" onClick={() => engine.current?.fireStaff(member.id)}>
                    Let go
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <p className="modal-hint">Esc to close · Progress saves automatically here.</p>
      </div>
    </div>
  )
}
