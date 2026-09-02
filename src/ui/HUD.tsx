import type { EngineRef } from '../App'
import { useGameStore } from '../state/gameStore'
import { dayCycle } from '../core/time'
import { Minimap } from './Minimap'
import { Navigation } from './Navigation'
import { OrderCard } from './OrderCard'

interface Props {
  engine: EngineRef
}

function formatClock(simNow: number): string {
  const cycle = dayCycle(simNow)
  const totalMinutes = Math.floor(cycle * 24 * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`
}

export function HUD({ engine }: Props) {
  const cash = useGameStore((s) => s.cash)
  const rep = useGameStore((s) => s.rep)
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const xpForNextLevel = useGameStore((s) => s.xpForNextLevel)
  const nextDistrictPreview = useGameStore((s) => s.nextDistrictPreview)
  const districtName = useGameStore((s) => s.districtName)
  const simNow = useGameStore((s) => s.simNow)
  const isNight = useGameStore((s) => s.isNight)
  const activeOrders = useGameStore((s) => s.activeOrders)
  const focusedOrderId = useGameStore((s) => s.focusedOrderId)
  const capacity = useGameStore((s) => s.capacity)
  const speed = useGameStore((s) => s.speed)
  const boostMeter = useGameStore((s) => s.boostMeter)
  const interactPrompt = useGameStore((s) => s.interactPrompt)

  const speedMph = Math.round(Math.abs(speed) * 3.2)

  return (
    <div className="hud-root">
      <div className="hud-topbar">
        <div className="stat-pill cash-stat">${cash.toFixed(2)}</div>
        <div className="stat-pill rep-stat">
          <div className="rep-bar-track">
            <div className="rep-bar-fill" style={{ width: `${Math.min(100, (xp / Math.max(1, xpForNextLevel)) * 100)}%` }} />
          </div>
          <span>
            Lv {level} · Rep {rep.toFixed(1)}
          </span>
        </div>
        <div className="stat-pill">
          {districtName}
          {isNight ? ' \u{1F319}' : ''}
        </div>
        <div className="stat-pill">{formatClock(simNow)}</div>
        {nextDistrictPreview && (
          <div className="stat-pill next-unlock">
            Next: {nextDistrictPreview.name} (Rep {nextDistrictPreview.repNeeded.toFixed(1)} more)
          </div>
        )}
      </div>

      <div className="hud-orders">
        <div className="hud-orders-header">
          Active Deliveries ({activeOrders.length}/{capacity})
        </div>
        {activeOrders.length === 0 && <div className="empty-note">Open the Order Board (Tab) to accept a job.</div>}
        {activeOrders.map((o) => (
          <OrderCard key={o.id} order={o} simNow={simNow} mode="active" focused={o.id === focusedOrderId} onFocus={() => engine.current?.setFocusedOrder(o.id)} />
        ))}
      </div>

      {interactPrompt && <div className="interact-prompt">{interactPrompt}</div>}

      <div className="hud-bottombar">
        <Navigation />
        <div className="gauge-cluster">
          <div className="speed-gauge">
            <div className="speed-value">{speedMph}</div>
            <div className="speed-label">mph</div>
          </div>
          <div className="boost-gauge">
            <div className="boost-track">
              <div className="boost-fill" style={{ width: `${boostMeter}%` }} />
            </div>
            <div className="boost-label">BOOST</div>
          </div>
        </div>
        <Minimap />
      </div>
    </div>
  )
}
