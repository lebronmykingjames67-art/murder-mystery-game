export class MainMenu {
  private el: HTMLElement | null = null

  constructor(private appEl: HTMLElement) {}

  get isShowing() {
    return this.el != null
  }

  show(opts: { hasSave: boolean; subtitle?: string; onNewGame: () => void; onContinue: () => void }) {
    this.hide()
    this.el = document.createElement('div')
    this.el.className = 'menu'
    this.el.innerHTML = `
      <h1>HOLLOW SIGNAL</h1>
      <div class="subtitle">${opts.subtitle ?? 'a night-shift on the relay station'}</div>
      <button class="new-game">New Broadcast</button>
      <button class="continue" ${opts.hasSave ? '' : 'disabled'}>Continue</button>
      <div class="rule">NEVER ANSWER THE SECOND VOICE.<br/>IT ONLY WANTS TO FINISH THE SENTENCE.</div>
      <div class="controls">WASD move &middot; mouse look &middot; F flashlight &middot; E interact &middot; C crouch/hide</div>
    `
    this.appEl.appendChild(this.el)
    this.el.querySelector('.new-game')!.addEventListener('click', opts.onNewGame)
    if (opts.hasSave) this.el.querySelector('.continue')!.addEventListener('click', opts.onContinue)
  }

  hide() {
    this.el?.remove()
    this.el = null
  }
}
