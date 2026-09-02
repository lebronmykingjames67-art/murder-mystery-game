import type { EngineRef } from '../App'
import { useGameStore } from '../state/gameStore'

interface Props {
  engine: EngineRef
}

const CONTROLS: [string, string][] = [
  ['W A S D', 'Drive'],
  ['Space', 'Handbrake / Drift'],
  ['Shift', 'Boost'],
  ['E', 'Interact'],
  ['Tab', 'Order Board'],
  ['M', 'Map'],
]

export function PauseMenu({ engine }: Props) {
  const setScreen = useGameStore((s) => s.setScreen)
  const muted = useGameStore((s) => s.muted)
  const level = useGameStore((s) => s.level)
  const rep = useGameStore((s) => s.rep)
  const cash = useGameStore((s) => s.cash)

  return (
    <div className="modal-overlay" onClick={() => setScreen('none')}>
      <div className="modal-panel pause-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Paused</h2>
        <div className="pause-stats">
          <div>Level {level}</div>
          <div>Rep {rep.toFixed(1)}</div>
          <div>${cash.toFixed(2)}</div>
        </div>
        <button className="btn-primary" onClick={() => setScreen('none')}>
          Resume
        </button>
        <button className="btn-secondary" onClick={() => engine.current?.toggleMute()}>
          {muted ? 'Unmute' : 'Mute'} Audio
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            engine.current?.teleportToDepot()
            setScreen('none')
          }}
        >
          Return to Depot
        </button>
        <div className="pause-controls">
          {CONTROLS.map(([key, label]) => (
            <div key={key}>
              <kbd>{key}</kbd> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
