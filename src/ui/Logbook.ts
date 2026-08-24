import type { PageDef } from '../types'

export class Logbook {
  active = false
  private el: HTMLElement | null = null

  constructor(private appEl: HTMLElement) {}

  show(page: PageDef): Promise<void> {
    this.active = true
    return new Promise((resolve) => {
      this.el = document.createElement('div')
      this.el.className = 'logbook'
      const body = page.body.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
      this.el.innerHTML = `
        <div class="logbook-page">
          <h2>${escapeHtml(page.title)}</h2>
          ${body}
          <span class="logbook-close">[ E / click to close ]</span>
        </div>
      `
      this.appEl.appendChild(this.el)

      const close = () => {
        cleanup()
        this.el?.remove()
        this.el = null
        this.active = false
        resolve()
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') close()
      }
      function cleanup() {
        window.removeEventListener('keydown', onKey)
      }
      window.addEventListener('keydown', onKey)
      this.el.querySelector('.logbook-close')!.addEventListener('click', close)
      this.el.addEventListener('click', (e) => {
        if (e.target === this.el) close()
      })
    })
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
