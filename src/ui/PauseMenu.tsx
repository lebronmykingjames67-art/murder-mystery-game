import { useGameStore } from '../state/store'
import { gameManager } from '../core/GameManager'
import { audioManager } from '../core/AudioManager'

function click(fn: () => void) {
  return () => {
    audioManager.uiClick()
    fn()
  }
}

export function PauseMenu() {
  const screen = useGameStore((s) => s.screen)
  const openModal = useGameStore((s) => s.openModal)
  const runMoney = useGameStore((s) => s.runMoney)
  const inRun = screen === 'run'

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ width: 340, textAlign: 'center' }}>
        <h2 className="modal-title" style={{ marginBottom: 20 }}>
          PAUSED
        </h2>
        <div className="menu-buttons" style={{ margin: '0 auto' }}>
          <button className="menu-button primary" onClick={click(() => gameManager.closeModalAndResume())}>
            RESUME
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
          {inRun ? (
            <button
              className="menu-button danger"
              onClick={click(() => {
                if (window.confirm(`Abandon this run? You will lose your $${runMoney.toLocaleString()} in run earnings.`)) {
                  gameManager.abandonRun()
                }
              })}
            >
              ABANDON RUN (LOSE ${runMoney.toLocaleString()})
            </button>
          ) : (
            <button className="menu-button danger" onClick={click(() => gameManager.quitToMenu())}>
              QUIT TO MAIN MENU
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
