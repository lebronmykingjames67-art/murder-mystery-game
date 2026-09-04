import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'
import { CONNECTORS, DISTRICTS } from '../data/districts'
import { PROPERTIES } from '../data/business'

const W = 640
const H = 460
const PAD = 34

function computeBounds() {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const d of DISTRICTS) {
    const spanX = (d.gridCols - 1) * d.blockSize
    const spanZ = (d.gridRows - 1) * d.blockSize
    minX = Math.min(minX, d.origin.x - d.blockSize * 0.6)
    maxX = Math.max(maxX, d.origin.x + spanX + d.blockSize * 0.6)
    minZ = Math.min(minZ, d.origin.z - d.blockSize * 0.6)
    maxZ = Math.max(maxZ, d.origin.z + spanZ + d.blockSize * 0.6)
  }
  return { minX, maxX, minZ, maxZ }
}

const BOUNDS = computeBounds()

export function MapScreen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const setScreen = useGameStore((s) => s.setScreen)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const scale = Math.min((W - PAD * 2) / (BOUNDS.maxX - BOUNDS.minX), (H - PAD * 2) / (BOUNDS.maxZ - BOUNDS.minZ))
    const toScreen = (x: number, z: number): { x: number; y: number } => ({
      x: PAD + (x - BOUNDS.minX) * scale,
      y: PAD + (z - BOUNDS.minZ) * scale,
    })

    const draw = (): void => {
      const s = useGameStore.getState()
      ctx.fillStyle = '#0a0e14'
      ctx.fillRect(0, 0, W, H)

      for (const c of CONNECTORS) {
        const fromDistrict = DISTRICTS.find((d) => d.id === c.fromDistrict)
        const toDistrict = DISTRICTS.find((d) => d.id === c.toDistrict)
        if (!fromDistrict || !toDistrict) continue
        const p1 = toScreen(fromDistrict.origin.x + c.fromGrid[0] * fromDistrict.blockSize, fromDistrict.origin.z + c.fromGrid[1] * fromDistrict.blockSize)
        const p2 = toScreen(toDistrict.origin.x + c.toGrid[0] * toDistrict.blockSize, toDistrict.origin.z + c.toGrid[1] * toDistrict.blockSize)
        const unlocked = s.unlockedRoutes.includes(c.id)
        ctx.strokeStyle = unlocked ? 'rgba(94,200,255,0.75)' : 'rgba(255,255,255,0.16)'
        ctx.setLineDash(unlocked ? [] : [6, 5])
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
        ctx.setLineDash([])
        if (!unlocked) {
          const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
          ctx.fillStyle = '#9aa0ad'
          ctx.font = '11px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(`Rep ${c.unlockRep} to unlock`, mid.x, mid.y - 4)
        }
      }

      for (const d of DISTRICTS) {
        const unlocked = s.unlockedDistricts.includes(d.id)
        const spanX = (d.gridCols - 1) * d.blockSize
        const spanZ = (d.gridRows - 1) * d.blockSize
        const topLeft = toScreen(d.origin.x - d.blockSize * 0.6, d.origin.z - d.blockSize * 0.6)
        const bottomRight = toScreen(d.origin.x + spanX + d.blockSize * 0.6, d.origin.z + spanZ + d.blockSize * 0.6)
        const rw = bottomRight.x - topLeft.x
        const rh = bottomRight.y - topLeft.y
        ctx.fillStyle = unlocked ? 'rgba(74,86,104,0.55)' : 'rgba(60,60,66,0.28)'
        ctx.strokeStyle = unlocked ? 'rgba(255,215,106,0.65)' : 'rgba(255,255,255,0.14)'
        ctx.lineWidth = 1.5
        ctx.fillRect(topLeft.x, topLeft.y, rw, rh)
        ctx.strokeRect(topLeft.x, topLeft.y, rw, rh)
        ctx.fillStyle = unlocked ? '#f2f2f2' : '#787d8c'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(unlocked ? d.name : `${d.name} (Rep ${d.unlockRep})`, topLeft.x + rw / 2, topLeft.y + 16)
      }

      const depotDistrict = DISTRICTS.find((d) => d.id === 'downtown')
      if (depotDistrict) {
        const depotScreen = toScreen(depotDistrict.origin.x + 3 * depotDistrict.blockSize, depotDistrict.origin.z + 3 * depotDistrict.blockSize)
        ctx.fillStyle = '#ffb200'
        ctx.beginPath()
        ctx.arc(depotScreen.x, depotScreen.y, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const prop of PROPERTIES) {
        const district = DISTRICTS.find((d) => d.id === prop.districtId)
        if (!district || !s.unlockedDistricts.includes(district.id)) continue
        const owned = s.ownedProperties.includes(prop.id)
        const propScreen = toScreen(district.origin.x + prop.grid[0] * district.blockSize, district.origin.z + prop.grid[1] * district.blockSize)
        ctx.fillStyle = owned ? '#33cc66' : 'rgba(255,255,255,0.35)'
        ctx.beginPath()
        ctx.rect(propScreen.x - 4, propScreen.y - 4, 8, 8)
        ctx.fill()
        if (owned) {
          ctx.fillStyle = '#9be6b0'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(prop.name, propScreen.x, propScreen.y - 8)
        }
      }

      const p = toScreen(s.playerX, s.playerZ)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(-s.playerHeading)
      ctx.fillStyle = '#5ec8ff'
      ctx.beginPath()
      ctx.moveTo(0, 7)
      ctx.lineTo(5, -6)
      ctx.lineTo(0, -2)
      ctx.lineTo(-5, -6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="modal-overlay" onClick={() => setScreen('none')}>
      <div className="modal-panel map-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>City Map</h2>
          <button className="btn-close" onClick={() => setScreen('none')}>
            ✕
          </button>
        </div>
        <canvas ref={canvasRef} width={W} height={H} className="map-canvas" />
        <p className="modal-hint">M to close · Locked districts show the Rep needed to unlock · green squares are your owned property.</p>
      </div>
    </div>
  )
}
