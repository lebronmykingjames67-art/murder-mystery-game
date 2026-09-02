import type { Order } from '../types'

export interface PayoutBreakdown {
  base: number
  tip: number
  vipBonus: number
  multiTaskBonus: number
  latePenalty: number
  conditionMultiplier: number
  total: number
  late: boolean
}

const LATE_FLOOR_FRACTION = 0.2
const VIP_BONUS_FRACTION = 0.5
const VIP_LATE_PENALTY_FRACTION = 0.6
const MULTI_TASK_BONUS_PER_ORDER = 0.05

/** Implements the GDD 6.4 payout formula, plus fragile-condition and concurrent-order bonuses. */
export function computePayout(order: Order, timeElapsed: number, payoutMultiplier: number, concurrentActiveOrders: number): PayoutBreakdown {
  const late = timeElapsed > order.timeLimit
  const onTimeFraction = late ? 0 : Math.max(0, 1 - timeElapsed / order.timeLimit)
  const tip = order.tipPotential * onTimeFraction

  const vip = order.specialFlags.includes('VIP')
  const vipBonus = vip ? order.basePayout * VIP_BONUS_FRACTION : 0

  const originalBase = order.basePayout
  let base = originalBase
  if (late) {
    const overtime = timeElapsed - order.timeLimit
    const penaltyFraction = Math.min(vip ? VIP_LATE_PENALTY_FRACTION : 0.5, 0.15 + overtime / order.timeLimit)
    base = Math.max(originalBase * LATE_FLOOR_FRACTION, originalBase * (1 - penaltyFraction))
  }
  const latePenalty = originalBase - base

  const isPerishable = order.specialFlags.includes('Fragile') || order.itemType === 'Cold'
  const conditionMultiplier = isPerishable ? Math.max(0.3, order.condition / 100) : 1

  const multiTaskBonus = (base + tip) * MULTI_TASK_BONUS_PER_ORDER * Math.max(0, concurrentActiveOrders)

  const total = Math.round((base + tip + vipBonus + multiTaskBonus) * conditionMultiplier * payoutMultiplier * 100) / 100
  return { base, tip, vipBonus, multiTaskBonus, latePenalty, conditionMultiplier, total, late }
}
