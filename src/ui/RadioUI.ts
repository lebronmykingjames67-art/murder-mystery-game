import type { AudioEngine } from '../audio/AudioEngine'
import type { GameStateStore } from '../engine/GameState'
import type { ChoiceOption, DialogueLine, RadioEvent } from '../types'
import { glitchText } from './Overlay'

function estimateDuration(text: string): number {
  return Math.max(1.1, Math.min(5.2, text.length * 0.045))
}

export class RadioUI {
  active = false
  private el: HTMLElement | null = null

  constructor(
    private appEl: HTMLElement,
    private audio: AudioEngine,
    private game: GameStateStore,
  ) {}

  async play(event: RadioEvent): Promise<ChoiceOption> {
    this.active = true
    this.mount()
    await this.playLines(event.intro)
    const choice = await this.presentChoices(event.choices)
    await this.playLines(choice.outcome)
    this.unmount()
    this.active = false
    return choice
  }

  private corruption(): number {
    return 1 - this.game.state.staticMeter / 100
  }

  private mount() {
    this.el = document.createElement('div')
    this.el.className = 'radio-ui'
    this.el.innerHTML = `<div class="radio-lines"></div><div class="radio-choices"></div>`
    this.appEl.appendChild(this.el)
  }

  private unmount() {
    this.el?.remove()
    this.el = null
  }

  private get linesEl(): HTMLElement {
    return this.el!.querySelector('.radio-lines') as HTMLElement
  }
  private get choicesEl(): HTMLElement {
    return this.el!.querySelector('.radio-choices') as HTMLElement
  }

  private async playLines(lines: DialogueLine[]) {
    this.linesEl.innerHTML = ''
    for (const line of lines) {
      await this.playLine(line)
    }
    if (lines.length) await wait(350)
  }

  private async playLine(line: DialogueLine) {
    const duration = estimateDuration(line.text)
    const div = document.createElement('div')
    div.className = `radio-line voice-${line.voice}`
    const corrupted = glitchText(line.text, this.corruption() * 0.45)
    div.innerHTML = `<span class="speaker">${escapeHtml(line.speaker)}</span>${escapeHtml(corrupted)}`
    this.linesEl.appendChild(div)
    requestAnimationFrame(() => div.classList.add('show'))

    if (line.voice !== 'none') {
      void this.audio.playVoiceMurmur(line.voice, {
        duration,
        pitchMul: line.pitchMul,
        warbleMul: line.warbleMul,
        roughnessMul: line.roughnessMul,
      })
    }
    if (line.silenceMs) await wait(line.silenceMs)
    else await waitForAdvance(duration * 1000)
  }

  private presentChoices(options: ChoiceOption[]): Promise<ChoiceOption> {
    const valid = options
      .filter((o) => !o.requiresFlag || this.game.hasFlag(o.requiresFlag))
      .filter((o) => !o.hideIfFlag || !this.game.hasFlag(o.hideIfFlag))
    this.choicesEl.innerHTML = ''

    return new Promise((resolve) => {
      const finish = (opt: ChoiceOption) => {
        cleanup()
        resolve(opt)
      }
      const keyHandler = (e: KeyboardEvent) => {
        const idx = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code)
        if (idx >= 0 && valid[idx]) finish(valid[idx])
      }
      function cleanup() {
        window.removeEventListener('keydown', keyHandler)
      }
      window.addEventListener('keydown', keyHandler)

      valid.forEach((opt, i) => {
        const btn = document.createElement('div')
        btn.className = 'radio-choice'
        btn.innerHTML = `<span class="key">${i + 1}</span>${escapeHtml(opt.label)}`
        btn.onclick = () => finish(opt)
        this.choicesEl.appendChild(btn)
      })
    })
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForAdvance(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      cleanup()
      resolve()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') finish()
    }
    const timer = window.setTimeout(finish, ms)
    function cleanup() {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
    window.addEventListener('keydown', onKey)
  })
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
