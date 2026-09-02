import type { Order } from '../types'

interface Props {
  order: Order
  simNow: number
  mode: 'active' | 'board'
  focused?: boolean
  disableAccept?: boolean
  onAccept?: () => void
  onFocus?: () => void
}

const ITEM_ICON: Record<string, string> = {
  Food: '\u{1F354}',
  Package: '\u{1F4E6}',
  Fragile: '\u{1F3FA}',
  Cold: '\u{1F9CA}',
  Documents: '\u{1F4C4}',
  Hazmat: '\u{2622}\u{FE0F}',
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function timerClass(fraction: number, late: boolean): string {
  if (late) return 'timer-late'
  if (fraction > 0.5) return 'timer-green'
  if (fraction > 0.2) return 'timer-yellow'
  return 'timer-red'
}

export function OrderCard({ order, simNow, mode, focused, disableAccept, onAccept, onFocus }: Props) {
  const isMystery = order.specialFlags.includes('MysteryBox')
  const isVip = order.specialFlags.includes('VIP')
  const isFragile = order.specialFlags.includes('Fragile')

  let remaining = order.timeLimit
  let fraction = 1
  let late = false
  if (mode === 'active' && order.acceptedAt != null) {
    remaining = order.timeLimit - (simNow - order.acceptedAt)
    fraction = Math.max(0, remaining / order.timeLimit)
    late = remaining <= 0
  } else if (mode === 'board' && isVip) {
    remaining = order.boardExpiresAt - simNow
    fraction = Math.max(0, remaining / 30)
  }

  return (
    <div
      className={`order-card ${isVip ? 'order-vip' : ''} ${focused ? 'order-focused' : ''}`}
      onClick={mode === 'active' ? onFocus : undefined}
      role={mode === 'active' ? 'button' : undefined}
    >
      <div className="order-card-head">
        <span className="order-icon">{ITEM_ICON[order.itemType] ?? '\u{1F4E6}'}</span>
        <span className="order-item-type">{order.itemType}</span>
        {isVip && <span className="badge badge-vip">VIP</span>}
        {isMystery && <span className="badge badge-mystery">?</span>}
        {order.isMultiStop && <span className="badge badge-multi">MULTI</span>}
      </div>
      <div className="order-route">
        <div className="order-route-leg">{mode === 'board' || order.state === 'toPickup' ? order.pickupLabel : order.dropoffLabel}</div>
        <div className="order-route-arrow">{order.state === 'toDropoff' ? '→ dropoff' : '→ pickup'}</div>
      </div>
      <div className="order-meta">
        <span>{order.distance}m</span>
        <span>{isMystery ? '$???' : formatMoney(order.basePayout + order.tipPotential)}</span>
        {isFragile && <span className="order-condition">Condition {Math.round(order.condition)}%</span>}
      </div>
      {(mode === 'active' || (mode === 'board' && isVip)) && (
        <div className={`order-timer ${timerClass(fraction, late)}`}>
          {late ? 'OVERDUE' : `${Math.max(0, Math.ceil(remaining))}s`}
        </div>
      )}
      {mode === 'board' && onAccept && (
        <button className="btn-accept" disabled={disableAccept} onClick={onAccept}>
          Accept
        </button>
      )}
    </div>
  )
}
