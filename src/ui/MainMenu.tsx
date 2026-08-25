import { useGameStore } from '../state/store'
import { gameManager } from '../core/GameManager'
import { audioManager } from '../core/AudioManager'

export function MainMenu() {
  const bankMoney = useGameStore((s) => s.bankMoney)
  const openModal = useGameStore((s) => s.openModal)
  const pushToast = useGameStore((s) => s.pushToast)

  const click = (fn: () => void) => () => {
    audioManager.ensureStarted()
    audioManager.uiClick()
    fn()
  }

  return (
    <div className="screen-overlay">
      <div className="bank-display">
        <div className="bank-label">BANK</div>
        <div className="bank-amount">${bankMoney.toLocaleString()}</div>
      </div>

      <h1 className="game-title">ONE MORE FLOOR</h1>
      <p className="game-subtitle">RISK IT ALL. FLOOR BY FLOOR.</p>

      <div className="menu-buttons">
        <button className="menu-button primary" onClick={click(() => gameManager.pressPlay())}>
          PLAY
        </button>
        <button className="menu-button" onClick={click(() => openModal('upgrades'))}>
          UPGRADES
        </button>
        <button className="menu-button" onClick={click(() => openModal('cosmetics'))}>
          COSMETICS
        </button>
        <button className="menu-button" onClick={click(() => openModal('settings'))}>
          SETTINGS
        </button>
        <button
          className="menu-button danger"
          onClick={click(() => pushToast('You can close this tab any time. Thanks for playing.', 'info'))}
        >
          QUIT
        </button>
      </div>
    </div>
  )
}
