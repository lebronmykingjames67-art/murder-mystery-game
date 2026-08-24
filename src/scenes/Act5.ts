import * as THREE from 'three'
import type { SceneBuilder } from '../engine/SceneManager'
import { addProp, propMat, emissiveMat, floorMat } from './RoomBuilder'
import { decideEnding, ENDINGS } from '../data/endings'
import type { EndingId } from '../types'
import type { ColliderSource } from '../player/Collision'

const TONES: Record<EndingId, { fog: number; bg: number; light: number; glowIntensity: number }> = {
  'clear-sky': { fog: 0x0c1620, bg: 0x05080c, light: 0xbfd0e0, glowIntensity: 1.3 },
  answered: { fog: 0x1a0e0c, bg: 0x0a0402, light: 0xe8a25c, glowIntensity: 1.6 },
  'real-frequency': { fog: 0x14161a, bg: 0x08090a, light: 0xe6ecf2, glowIntensity: 0.15 },
}

export const buildAct5: SceneBuilder = (ctx) => {
  const { game, overlay, audio } = ctx
  const endingId = decideEnding(game.state)
  const ending = ENDINGS[endingId]
  const tone = TONES[endingId]

  const root = new THREE.Group()
  const colliders: ColliderSource[] = []

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat(0x121214))
  ground.rotation.x = -Math.PI / 2
  root.add(ground)

  addProp(root, 0.4, 6, 0.4, -3, 3, -6, propMat(0x0c0c0e))
  addProp(root, 1.2, 2, 0.6, 3, 1, -4, propMat(0x18181a))
  const glow = addProp(root, 0.3, 0.3, 0.3, -3, 6.2, -6, emissiveMat(tone.light, tone.glowIntensity))

  const light = new THREE.PointLight(tone.light, 0.6, 14, 2)
  light.position.set(0, 2.5, -2)
  root.add(light)

  let shown = false

  const update = (dt: number) => {
    audio.update(dt)
    audio.setDread(endingId === 'answered' ? 0.5 : 0.08)
    const t = performance.now() * 0.0012
    ;(glow.material as THREE.MeshStandardMaterial).emissiveIntensity = tone.glowIntensity * (0.8 + Math.sin(t) * 0.2)
    if (!shown) {
      shown = true
      overlay.fadeFromBlack()
      showEpilogue()
    }
  }

  function showEpilogue() {
    const el = document.createElement('div')
    el.className = 'menu'
    const s = game.state
    el.innerHTML = `
      <h1 style="font-size:34px;">${escapeHtml(ending.title)}</h1>
      <div class="subtitle">${escapeHtml(ending.subtitle)}</div>
      <div class="rule" style="max-width:620px; text-align:left; color:#9c98a8;">
        ${ending.body.map((p) => `<p style="margin:0 0 14px;line-height:1.8;">${escapeHtml(p)}</p>`).join('')}
      </div>
      <div class="stats">
        Answered ${s.answeredCount} &middot; Stayed silent ${s.silentCount} &middot; Switched away ${s.switchedCount}<br/>
        Hidden pages found: ${s.pagesFound.length} / 6
      </div>
      <button class="restart">Return to the Shore</button>
    `
    document.getElementById('app')!.appendChild(el)
    el.querySelector('.restart')!.addEventListener('click', () => {
      localStorage.removeItem('hollow-signal-save-v1')
      window.location.reload()
    })
  }

  return {
    root,
    colliders,
    interactables: [],
    spawn: { position: new THREE.Vector3(0, 0, 4), yaw: 0 },
    ambient: 0.05,
    fogColor: tone.fog,
    fogNear: 2,
    fogFar: 16,
    backgroundColor: tone.bg,
    update,
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
