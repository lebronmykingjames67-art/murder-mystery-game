import * as THREE from 'three'

// Hand-authored signs, warning placards and notes are the game's main wayfinding tool since
// there is deliberately no map — the player is meant to navigate by memory and environmental
// clues instead. Canvas-baked text keeps this cheap: no font atlas, no external assets.

export interface TextSignResult {
  mesh: THREE.Mesh
  texture: THREE.CanvasTexture
}

export function makeTextSign(
  text: string,
  opts: {
    width?: number
    height?: number
    bg?: string
    fg?: string
    accent?: string
    fontSize?: number
    subtext?: string
  } = {},
): TextSignResult {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = opts.bg ?? '#1c1e22'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = opts.accent ?? '#c9a24b'
  ctx.lineWidth = 8
  ctx.strokeRect(8, 8, w - 16, h - 16)

  ctx.fillStyle = opts.fg ?? '#e8e8ea'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${opts.fontSize ?? 54}px 'Courier New', monospace`
  wrapText(ctx, text, w / 2, opts.subtext ? h / 2 - 28 : h / 2, w - 60, (opts.fontSize ?? 54) * 1.05)

  if (opts.subtext) {
    ctx.font = `28px 'Courier New', monospace`
    ctx.fillStyle = opts.accent ?? '#c9a24b'
    ctx.fillText(opts.subtext, w / 2, h - 44)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const geom = new THREE.PlaneGeometry(opts.width ?? 1.2, opts.height ?? 0.6)
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: texture,
    emissiveIntensity: 0.35,
    roughness: 0.6,
  })
  const mesh = new THREE.Mesh(geom, mat)
  mesh.userData.disposeMaterial = true
  return { mesh, texture }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight))
}

/** A small emissive floating number panel, used for the elevator's floor readout. */
export function makeFloorReadout(floorNumber: number): TextSignResult {
  return makeTextSign(floorNumber > 0 ? String(floorNumber) : 'L', {
    width: 0.5,
    height: 0.35,
    fontSize: 130,
    bg: '#0c0d0f',
    fg: '#e2b23c',
    accent: '#e2b23c',
  })
}
