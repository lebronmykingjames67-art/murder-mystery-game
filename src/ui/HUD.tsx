import { useGameStore } from '../state/store'

const TUTORIAL_STEPS: { key: string; text: string }[] = [
  { key: 'move', text: 'WASD TO MOVE' },
  { key: 'look', text: 'MOUSE TO LOOK' },
  { key: 'sprint', text: 'HOLD SHIFT TO SPRINT' },
  { key: 'jump', text: 'SPACE TO JUMP' },
  { key: 'interact', text: '[E] TO INTERACT' },
]

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const low = pct < 25
  return (
    <div className="hud-bar">
      <div className={`hud-bar-fill ${className}${low ? ' low' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Crosshair + interact prompt + toasts/money popups — live in both the lobby and a run. */
export function InteractionLayer() {
  const interactPrompt = useGameStore((s) => s.interactPrompt)
  const moneyPopups = useGameStore((s) => s.moneyPopups)
  const toasts = useGameStore((s) => s.toasts)

  return (
    <>
      <div className={`crosshair${interactPrompt ? ' focused' : ''}`} />
      {interactPrompt && <div className="interact-prompt">{interactPrompt}</div>}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div className={`toast toast--${t.tone}`} key={t.id}>
            {t.text}
          </div>
        ))}
      </div>

      {moneyPopups.map((p) => (
        <div className="money-popup" style={{ left: `${p.x}%`, top: `${p.y}%` }} key={p.id}>
          +${p.amount}
        </div>
      ))}
    </>
  )
}

export function HUD() {
  const health = useGameStore((s) => s.health)
  const maxHealth = useGameStore((s) => s.maxHealth)
  const stamina = useGameStore((s) => s.stamina)
  const maxStamina = useGameStore((s) => s.maxStamina)
  const floorNumber = useGameStore((s) => s.floorNumber)
  const floorKind = useGameStore((s) => s.floorKind)
  const runMoney = useGameStore((s) => s.runMoney)
  const objectiveText = useGameStore((s) => s.objectiveText)
  const tutorialSeen = useGameStore((s) => s.tutorialSeen)

  const showTutorial = floorNumber === 1 && TUTORIAL_STEPS.some((t) => !tutorialSeen[t.key])

  return (
    <div className="hud">
      <div className="hud-row">
        <div className="hud-block">
          <div className="hud-stat-label">HEALTH</div>
          <Bar value={health} max={maxHealth} className="health" />
          <div className="hud-stat-label" style={{ marginTop: 8 }}>
            STAMINA
          </div>
          <Bar value={stamina} max={maxStamina} className="stamina" />
        </div>
        <div className="hud-block right">
          <div className="hud-floor-kind">{floorKind ? floorKind.toUpperCase() : ''}</div>
          <div className="hud-floor-number">FLOOR {floorNumber}</div>
          <div className="hud-money">${runMoney.toLocaleString()}</div>
        </div>
      </div>

      {objectiveText && <div className="objective-banner">{objectiveText}</div>}

      <InteractionLayer />

      {showTutorial && (
        <div className="tutorial-hints">
          {TUTORIAL_STEPS.filter((t) => !tutorialSeen[t.key]).map((t) => (
            <div className="tutorial-hint" key={t.key}>
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DamageFlash() {
  const token = useGameStore((s) => s.damageFlashToken)
  if (token === 0) return null
  return <div className="damage-flash" key={token} />
}
