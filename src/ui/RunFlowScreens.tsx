import { useGameStore } from '../state/store'
import { gameManager } from '../core/GameManager'
import { audioManager } from '../core/AudioManager'
import { rewardForFloor } from '../core/constants'

function click(fn: () => void) {
  return () => {
    audioManager.uiClick()
    fn()
  }
}

export function FloorCompleteScreen() {
  const floorNumber = useGameStore((s) => s.floorNumber)
  const runMoney = useGameStore((s) => s.runMoney)

  return (
    <div className="screen-overlay">
      <h2 className="result-title success">FLOOR COMPLETE</h2>
      <div className="result-sub">FLOOR {floorNumber}</div>
      <div className="result-amount">${runMoney.toLocaleString()}</div>
      <div className="result-sub">RUN EARNINGS</div>
    </div>
  )
}

export function RiskDecisionScreen() {
  const runMoney = useGameStore((s) => s.runMoney)
  const floorNumber = useGameStore((s) => s.floorNumber)
  const nextReward = rewardForFloor(floorNumber + 1)

  return (
    <div className="screen-overlay">
      <h2 className="result-title decision">FLOOR {floorNumber} CLEARED</h2>
      <div className="result-amount">${runMoney.toLocaleString()}</div>
      <div className="result-sub">CURRENT RUN EARNINGS</div>

      <div className="decision-row">
        <div className="decision-card cashout">
          <h3>CASH OUT</h3>
          <p>Leave the building now and bank everything you've earned this run.</p>
          <button onClick={click(() => gameManager.chooseCashOut())}>KEEP ${runMoney.toLocaleString()}</button>
        </div>
        <div className="decision-card riskit">
          <h3>RISK IT</h3>
          <p>Take the elevator to floor {floorNumber + 1}. Die and you lose everything from this run.</p>
          <button onClick={click(() => gameManager.chooseRiskIt())}>GO DEEPER</button>
        </div>
      </div>
      <div className="next-floor-preview">FLOOR {floorNumber + 1} TYPICAL PAYOUT ~${nextReward.toLocaleString()}</div>
    </div>
  )
}

export function RunFailedScreen() {
  const result = useGameStore((s) => s.lastRunResult)
  const stats = useGameStore((s) => s.stats)

  return (
    <div className="screen-overlay">
      <h2 className="result-title fail">RUN FAILED</h2>
      <div className="result-sub">YOU LOST</div>
      <div className="result-amount" style={{ color: 'var(--danger)' }}>
        -${(result?.payout ?? 0).toLocaleString()}
      </div>
      <div className="result-sub">RUN EARNINGS LOST</div>
      <div className="result-stats">
        <div className="result-stat">
          <div className="result-stat-value">{result?.floorReached ?? 0}</div>
          <div className="result-stat-label">FLOOR REACHED</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{stats.highestFloor}</div>
          <div className="result-stat-label">BEST FLOOR</div>
        </div>
      </div>
      <div className="menu-buttons">
        <button className="menu-button primary" onClick={click(() => gameManager.tryAgain())}>
          TRY AGAIN
        </button>
        <button className="menu-button" onClick={click(() => gameManager.returnToLobby())}>
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  )
}

export function CashedOutScreen() {
  const result = useGameStore((s) => s.lastRunResult)

  return (
    <div className="screen-overlay">
      <h2 className="result-title success">CASHED OUT</h2>
      <div className="result-amount">${(result?.payout ?? 0).toLocaleString()}</div>
      <div className="result-sub">ADDED TO YOUR BANK</div>
      <div className="menu-buttons">
        <button className="menu-button primary" onClick={click(() => gameManager.returnToLobby())}>
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  )
}
