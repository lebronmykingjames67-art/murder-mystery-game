import { useEffect, useRef } from 'react'
import { useGameStore } from './state/store'
import { gameManager } from './core/GameManager'
import { HUD, DamageFlash, InteractionLayer } from './ui/HUD'
import { MainMenu } from './ui/MainMenu'
import { ClickToPlay } from './ui/ClickToPlay'
import { PauseMenu } from './ui/PauseMenu'
import { UpgradeShop } from './ui/UpgradeShop'
import { CosmeticShop } from './ui/CosmeticShop'
import { SettingsPanel } from './ui/SettingsPanel'
import { StatsPanel } from './ui/StatsPanel'
import { FloorCompleteScreen, RiskDecisionScreen, RunFailedScreen, CashedOutScreen } from './ui/RunFlowScreens'
import './ui/ui.css'

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const screen = useGameStore((s) => s.screen)
  const modal = useGameStore((s) => s.modal)

  useEffect(() => {
    if (hostRef.current) gameManager.mount(hostRef.current)
    return () => gameManager.unmount()
  }, [])

  return (
    <div className="game-root">
      <div className="canvas-host" ref={hostRef} />
      <div className="ui-layer">
        {screen === 'menu' && <MainMenu />}
        {screen === 'lobby' && <InteractionLayer />}
        {screen === 'run' && (
          <>
            <HUD />
            <DamageFlash />
          </>
        )}
        {screen === 'floor-complete' && <FloorCompleteScreen />}
        {screen === 'risk-decision' && <RiskDecisionScreen />}
        {screen === 'run-failed' && <RunFailedScreen />}
        {screen === 'cashed-out' && <CashedOutScreen />}

        <ClickToPlay />

        {modal === 'pause' && <PauseMenu />}
        {modal === 'upgrades' && <UpgradeShop />}
        {modal === 'cosmetics' && <CosmeticShop />}
        {modal === 'settings' && <SettingsPanel />}
        {modal === 'stats' && <StatsPanel />}
      </div>
    </div>
  )
}
