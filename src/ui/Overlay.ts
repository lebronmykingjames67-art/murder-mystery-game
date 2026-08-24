const GLITCH_CHARS = '#%&$?!¦¬×÷§'

export function glitchText(text: string, intensity: number): string {
  if (intensity <= 0) return text
  let out = ''
  for (const ch of text) {
    if (ch !== ' ' && Math.random() < intensity * 0.22) {
      out += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    } else {
      out += ch
    }
  }
  return out
}

export class Overlay {
  root: HTMLElement
  promptEl: HTMLElement
  private thoughtEl: HTMLElement
  private vignetteEl: HTMLElement
  private fadeEl: HTMLElement
  private lockHintEl: HTMLElement
  private actBannerEl: HTMLElement
  private actBannerNum: HTMLElement
  private actBannerTitle: HTMLElement
  private thoughtTimer: number | null = null

  constructor(appEl: HTMLElement) {
    this.root = document.createElement('div')
    this.root.className = 'hud'
    this.root.innerHTML = `
      <div class="crosshair"></div>
      <div class="prompt"></div>
      <div class="thought"></div>
    `
    appEl.appendChild(this.root)
    this.promptEl = this.root.querySelector('.prompt') as HTMLElement
    this.thoughtEl = this.root.querySelector('.thought') as HTMLElement

    this.vignetteEl = document.createElement('div')
    this.vignetteEl.className = 'vignette'
    appEl.appendChild(this.vignetteEl)

    this.fadeEl = document.createElement('div')
    this.fadeEl.className = 'fade'
    appEl.appendChild(this.fadeEl)

    this.lockHintEl = document.createElement('div')
    this.lockHintEl.className = 'lock-hint hidden'
    this.lockHintEl.innerHTML = '<span>Click to step into the station</span>'
    appEl.appendChild(this.lockHintEl)

    this.actBannerEl = document.createElement('div')
    this.actBannerEl.className = 'act-banner'
    this.actBannerEl.innerHTML = '<div class="act-num"></div><div class="act-title"></div>'
    appEl.appendChild(this.actBannerEl)
    this.actBannerNum = this.actBannerEl.querySelector('.act-num') as HTMLElement
    this.actBannerTitle = this.actBannerEl.querySelector('.act-title') as HTMLElement
  }

  showThought(text: string, duration = 4200) {
    if (this.thoughtTimer) window.clearTimeout(this.thoughtTimer)
    this.thoughtEl.textContent = `[ ${text} ]`
    this.thoughtEl.classList.add('show')
    this.thoughtTimer = window.setTimeout(() => this.thoughtEl.classList.remove('show'), duration)
  }

  setVignette(amount: number) {
    this.vignetteEl.style.opacity = String(Math.max(0, Math.min(1, amount)))
  }

  showLockHint(text: string, onClick: () => void) {
    this.lockHintEl.querySelector('span')!.textContent = text
    this.lockHintEl.classList.remove('hidden')
    const handler = () => {
      onClick()
    }
    this.lockHintEl.onclick = handler
  }

  hideLockHint() {
    this.lockHintEl.classList.add('hidden')
  }

  fadeToBlack(): Promise<void> {
    this.fadeEl.classList.add('show')
    return new Promise((resolve) => setTimeout(resolve, 950))
  }

  fadeFromBlack() {
    this.fadeEl.classList.remove('show')
  }

  showActBanner(actNum: number, title: string) {
    this.actBannerNum.textContent = `ACT ${actNum}`
    this.actBannerTitle.textContent = title
    this.actBannerEl.classList.add('show')
    setTimeout(() => this.actBannerEl.classList.remove('show'), 3600)
  }

  setHudVisible(v: boolean) {
    this.root.style.opacity = v ? '1' : '0'
  }
}
