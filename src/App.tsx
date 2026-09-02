import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { GameEngine } from './core/GameEngine'
import { useGameStore } from './state/gameStore'
import { StartScreen } from './ui/StartScreen'
import { HUD } from './ui/HUD'
import { OrderBoard } from './ui/OrderBoard'
import { ShopScreen } from './ui/ShopScreen'
import { MapScreen } from './ui/MapScreen'
import { PauseMenu } from './ui/PauseMenu'
import { Toasts } from './ui/Toasts'

export type EngineRef = RefObject<GameEngine | null>

declare global {
  interface Window {
    __engineForDebug?: GameEngine
  }
}

type Phase = 'intro' | 'playing'

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const ready = useGameStore((s) => s.ready)
  const screen = useGameStore((s) => s.screen)

  useEffect(() => {
    if (phase !== 'playing' || !canvasRef.current || engineRef.current) return
    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine
    engine.start()
    if (import.meta.env.DEV) window.__engineForDebug = engine
    return () => {
      engine.dispose()
      engineRef.current = null
      useGameStore.setState({ ready: false, screen: 'none' })
    }
  }, [phase])

  return (
    <div className="app-root">
      {phase === 'intro' && <StartScreen onStart={() => setPhase('playing')} />}
      {phase === 'playing' && (
        <>
          <canvas ref={canvasRef} className="game-canvas" />
          {ready && (
            <>
              <HUD engine={engineRef} />
              <Toasts />
              {screen === 'orderBoard' && <OrderBoard engine={engineRef} />}
              {screen === 'shop' && <ShopScreen engine={engineRef} />}
              {screen === 'map' && <MapScreen />}
              {screen === 'pause' && <PauseMenu engine={engineRef} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
