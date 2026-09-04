import { useEffect } from 'react'
import { useGameStore } from '../state/gameStore'

const TTL_MS = 5200

const ICONS: Record<string, string> = {
  delivery: '\u{1F4B5}',
  event: '\u{26A0}\u{FE0F}',
  unlock: '\u{1F513}',
  fail: '\u{274C}',
  info: '\u{2139}\u{FE0F}',
  levelUp: '\u{2B50}',
  milestone: '\u{1F3C6}',
}

export function Toasts() {
  const toasts = useGameStore((s) => s.toasts)
  const dismissToast = useGameStore((s) => s.dismissToast)

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now()
      for (const t of useGameStore.getState().toasts) {
        if (now - t.createdAt > TTL_MS) dismissToast(t.id)
      }
    }, 400)
    return () => window.clearInterval(id)
  }, [dismissToast])

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div className={`toast toast-${t.kind}`} key={t.id} onClick={() => dismissToast(t.id)}>
          <span className="toast-icon">{ICONS[t.kind] ?? '\u{2139}\u{FE0F}'}</span>
          <div className="toast-text">
            <div className="toast-title">{t.title}</div>
            {t.detail && <div className="toast-detail">{t.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
