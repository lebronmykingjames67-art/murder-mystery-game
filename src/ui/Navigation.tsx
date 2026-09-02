import { useGameStore } from '../state/gameStore'

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

const INSTRUCTION: Record<string, string> = {
  left: 'Turn left',
  right: 'Turn right',
  arrive: 'Arrive at',
}

/** Bottom-left turn-by-turn panel, driven by GameEngine's live pathfind to the focused order. */
export function Navigation() {
  const navInfo = useGameStore((s) => s.navInfo)
  if (!navInfo) return null

  const arriving = navInfo.maneuver === 'arrive'
  const rotation = navInfo.maneuver === 'left' ? -90 : navInfo.maneuver === 'right' ? 90 : 0

  return (
    <div className="nav-panel">
      <div className="nav-arrow-badge">
        {arriving ? (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <circle cx="12" cy="9" r="3.2" fill="#fff" />
            <path d="M12 21c-4-4.6-7-8.3-7-11.6A7 7 0 0 1 19 9.4C19 12.7 16 16.4 12 21Z" stroke="#fff" strokeWidth="1.8" fill="none" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" style={{ transform: `rotate(${rotation}deg)` }}>
            <path d="M12 3 L12 18" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M5 10 L12 3 L19 10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </div>
      <div className="nav-text">
        <div className="nav-distance">{arriving && navInfo.distance < 12 ? 'Arriving now' : formatDistance(navInfo.distance)}</div>
        <div className="nav-instruction">
          {INSTRUCTION[navInfo.maneuver]}
          {arriving ? ` ${navInfo.targetLabel}` : ''}
        </div>
      </div>
    </div>
  )
}
