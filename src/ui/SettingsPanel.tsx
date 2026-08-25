import { useGameStore } from '../state/store'
import { ModalShell } from './ModalShell'
import { audioManager } from '../core/AudioManager'
import { useEffect, useState } from 'react'

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="settings-row">
      <label>
        <span>{label}</span>
        <span>{format(value)}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export function SettingsPanel() {
  const settings = useGameStore((s) => s.settings)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const setVolume = (key: 'masterVolume' | 'musicVolume' | 'sfxVolume', v: number) => {
    updateSettings({ [key]: v })
    audioManager.setVolumes({
      master: key === 'masterVolume' ? v : settings.masterVolume,
      music: key === 'musicVolume' ? v : settings.musicVolume,
      sfx: key === 'sfxVolume' ? v : settings.sfxVolume,
    })
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined)
    }
    updateSettings({ fullscreen: !isFullscreen })
  }

  return (
    <ModalShell title="SETTINGS">
      <Slider label="MASTER VOLUME" value={settings.masterVolume} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setVolume('masterVolume', v)} />
      <Slider label="MUSIC VOLUME" value={settings.musicVolume} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setVolume('musicVolume', v)} />
      <Slider label="SFX VOLUME" value={settings.sfxVolume} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setVolume('sfxVolume', v)} />
      <Slider
        label="MOUSE SENSITIVITY"
        value={settings.mouseSensitivity}
        min={0.1}
        max={1.5}
        step={0.05}
        format={(v) => v.toFixed(2)}
        onChange={(v) => updateSettings({ mouseSensitivity: v })}
      />
      <Slider label="FIELD OF VIEW" value={settings.fov} min={65} max={100} step={1} format={(v) => `${v}°`} onChange={(v) => updateSettings({ fov: v })} />
      <div className="settings-row settings-toggle">
        <span>FULLSCREEN</span>
        <button className={`toggle-button${isFullscreen ? ' on' : ''}`} onClick={toggleFullscreen}>
          {isFullscreen ? 'ON' : 'OFF'}
        </button>
      </div>
    </ModalShell>
  )
}
