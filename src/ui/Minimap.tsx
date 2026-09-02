import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'
import { DEPOT_NODE_ID, positionForNodeId } from '../data/districts'

const SIZE = 176
const RADIUS_WORLD = 130

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = (): void => {
      const s = useGameStore.getState()
      ctx.clearRect(0, 0, SIZE, SIZE)

      ctx.save()
      ctx.beginPath()
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(10,14,20,0.88)'
      ctx.fill()
      ctx.clip()

      const scale = (SIZE / 2 - 6) / RADIUS_WORLD
      const toScreen = (wx: number, wz: number): { x: number; y: number } => ({
        x: SIZE / 2 + (wx - s.playerX) * scale,
        y: SIZE / 2 + (wz - s.playerZ) * scale,
      })

      const depot = positionForNodeId(DEPOT_NODE_ID)
      if (depot) {
        const p = toScreen(depot.x, depot.z)
        ctx.fillStyle = '#ffb200'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const o of s.activeOrders) {
        const nodeId = o.state === 'toPickup' ? o.pickupNodeId : o.dropoffNodeId
        const pos = positionForNodeId(nodeId)
        if (!pos) continue
        const p = toScreen(pos.x, pos.z)
        const focused = o.id === s.focusedOrderId
        ctx.fillStyle = o.state === 'toPickup' ? '#ffcc33' : '#33cc66'
        ctx.beginPath()
        ctx.arc(p.x, p.y, focused ? 5 : 3.5, 0, Math.PI * 2)
        ctx.fill()
        if (focused) {
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.restore()

      // Player arrow, always centered; base shape points "down" (+screen-y) so that
      // rotating by -heading matches world forward = (sin(heading), cos(heading)).
      ctx.save()
      ctx.translate(SIZE / 2, SIZE / 2)
      ctx.rotate(-s.playerHeading)
      ctx.fillStyle = '#5ec8ff'
      ctx.beginPath()
      ctx.moveTo(0, 8)
      ctx.lineTo(6, -7)
      ctx.lineTo(0, -3)
      ctx.lineTo(-6, -7)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} width={SIZE} height={SIZE} className="minimap-canvas" />
}
