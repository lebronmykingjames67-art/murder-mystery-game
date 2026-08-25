import { useGameStore } from '../state/store'
import { ModalShell } from './ModalShell'

export function StatsPanel() {
  const stats = useGameStore((s) => s.stats)
  const bestFloor = useGameStore((s) => s.bestFloor)

  const cells: { value: string | number; label: string }[] = [
    { value: bestFloor, label: 'BEST FLOOR' },
    { value: stats.totalRuns, label: 'TOTAL RUNS' },
    { value: `$${stats.totalMoneyEarned.toLocaleString()}`, label: 'TOTAL EARNED' },
    { value: `$${stats.totalMoneyCashedOut.toLocaleString()}`, label: 'TOTAL CASHED OUT' },
    { value: stats.floorsCompleted, label: 'FLOORS COMPLETED' },
    { value: stats.totalDeaths, label: 'DEATHS' },
    { value: `$${stats.bestRunPayout.toLocaleString()}`, label: 'BEST RUN PAYOUT' },
    { value: `${Math.round(stats.longestRunSeconds)}s`, label: 'LONGEST RUN' },
  ]

  return (
    <ModalShell title="RUN STATISTICS">
      <div className="stats-grid">
        {cells.map((c) => (
          <div className="stat-cell" key={c.label}>
            <div className="value">{c.value}</div>
            <div className="label">{c.label}</div>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}
