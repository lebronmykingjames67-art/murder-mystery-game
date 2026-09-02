import type { EngineRef } from '../App'
import { useGameStore } from '../state/gameStore'
import { OrderCard } from './OrderCard'

interface Props {
  engine: EngineRef
}

export function OrderBoard({ engine }: Props) {
  const boardOrders = useGameStore((s) => s.boardOrders)
  const activeOrders = useGameStore((s) => s.activeOrders)
  const capacity = useGameStore((s) => s.capacity)
  const simNow = useGameStore((s) => s.simNow)
  const setScreen = useGameStore((s) => s.setScreen)

  const full = activeOrders.length >= capacity

  return (
    <div className="modal-overlay" onClick={() => setScreen('none')}>
      <div className="modal-panel order-board-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Board</h2>
          <div className="capacity-pill">
            {activeOrders.length}/{capacity} cargo slots
          </div>
          <button className="btn-close" onClick={() => setScreen('none')}>
            ✕
          </button>
        </div>
        <div className="order-board-grid">
          {boardOrders.length === 0 && <p className="empty-note">No jobs posted right now — check back shortly.</p>}
          {boardOrders.map((o) => (
            <OrderCard key={o.id} order={o} simNow={simNow} mode="board" disableAccept={full} onAccept={() => engine.current?.acceptOrder(o.id)} />
          ))}
        </div>
        <p className="modal-hint">Tab to close · Accepted jobs appear on your minimap and world map.</p>
      </div>
    </div>
  )
}
