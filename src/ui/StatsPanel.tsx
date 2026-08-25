import { useGameStore } from '../state/store'
import { ModalShell } from './ModalShell'

function formatWhen(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function StatsPanel() {
  const stats = useGameStore((s) => s.stats)
  const bestFloor = useGameStore((s) => s.bestFloor)
  const runHistory = useGameStore((s) => s.runHistory)

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

      {runHistory.length > 0 && (
        <>
          <div className="cosmetic-slot-label" style={{ marginTop: 20 }}>
            RECENT RUNS
          </div>
          <div className="history-list">
            {runHistory.map((run, i) => (
              <div className="history-row" key={run.timestamp + '-' + i}>
                <span className={run.died ? 'history-outcome fail' : 'history-outcome success'}>{run.died ? 'DIED' : 'CASHED OUT'}</span>
                <span className="history-floor">FLOOR {run.floorReached}</span>
                <span className={run.died ? 'history-amount fail' : 'history-amount success'}>
                  {run.died ? '-' : '+'}${run.payout.toLocaleString()}
                </span>
                <span className="history-when">{formatWhen(run.timestamp)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ModalShell>
  )
}
