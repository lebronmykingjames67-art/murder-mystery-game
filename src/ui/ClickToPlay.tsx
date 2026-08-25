import { useGameStore } from '../state/store'
import { gameManager } from '../core/GameManager'

export function ClickToPlay() {
  const screen = useGameStore((s) => s.screen)
  const modal = useGameStore((s) => s.modal)
  const isPointerLocked = useGameStore((s) => s.isPointerLocked)

  const visible = (screen === 'lobby' || screen === 'run') && modal === null && !isPointerLocked

  if (!visible) return null

  return (
    <div className="click-to-play" onClick={() => gameManager.requestControl()}>
      <div className="click-to-play-inner">
        CLICK TO PLAY
        <small>ESC TO PAUSE · MOUSE TO LOOK</small>
      </div>
    </div>
  )
}
