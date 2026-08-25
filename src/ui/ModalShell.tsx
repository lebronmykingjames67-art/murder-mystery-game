import type { ReactNode } from 'react'
import { useGameStore } from '../state/store'
import { gameManager } from '../core/GameManager'
import { audioManager } from '../core/AudioManager'

export function ModalShell({ title, children }: { title: string; children: ReactNode }) {
  const screen = useGameStore((s) => s.screen)

  const close = () => {
    audioManager.uiClick()
    const store = useGameStore.getState()
    store.closeModal()
    // Only re-lock the mouse if closing back into actual gameplay (not from the main menu).
    if (screen === 'run' || screen === 'lobby') gameManager.requestControl()
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={close}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
