const SLIDERS = [
  { key: 'walkSpeed', label: 'Walk Speed', min: 0, max: 20, step: 0.1 },
  { key: 'sprintSpeed', label: 'Sprint Speed', min: 0, max: 25, step: 0.1 },
  { key: 'airControl', label: 'Air Control', min: 0, max: 1, step: 0.01 },
  { key: 'gravity', label: 'Gravity', min: 1, max: 50, step: 0.1 },
  { key: 'jumpVelocity', label: 'Jump Velocity', min: 0, max: 20, step: 0.1 },
  { key: 'coyoteTime', label: 'Coyote Time', min: 0, max: 0.5, step: 0.01 },
  { key: 'jumpBuffer', label: 'Jump Buffer', min: 0, max: 0.5, step: 0.01 },
  { key: 'dashSpeed', label: 'Dash Speed', min: 0, max: 40, step: 0.5 },
  { key: 'dashDuration', label: 'Dash Duration', min: 0, max: 1, step: 0.01 },
  { key: 'dashCooldown', label: 'Dash Cooldown', min: 0, max: 5, step: 0.1 },
  { key: 'dashInvuln', label: 'Dash Invuln', min: 0, max: 1, step: 0.01 },
  { key: 'slideDecayTime', label: 'Slide Decay Time', min: 0, max: 3, step: 0.05 },
  { key: 'slideHeight', label: 'Slide Height', min: 0.3, max: 2, step: 0.05 },
  { key: 'standHeight', label: 'Stand Height', min: 1, max: 2.5, step: 0.05 },
  { key: 'bunnyHopWindow', label: 'Bunny-hop Window', min: 0, max: 0.5, step: 0.01 },
]

/**
 * Backtick-toggled dev overlay: live readouts plus sliders bound directly to
 * config.movement so movement can be tuned without restarting.
 */
export function initDevOverlay(config) {
  const root = document.createElement('div')
  root.id = 'dev-overlay'
  root.className = 'hidden'

  const stats = document.createElement('div')
  stats.className = 'dev-stats'
  root.appendChild(stats)
  const statLines = {
    fps: document.createElement('div'),
    speed: document.createElement('div'),
    grounded: document.createElement('div'),
    dashCd: document.createElement('div'),
  }
  for (const line of Object.values(statLines)) stats.appendChild(line)

  const sliderList = document.createElement('div')
  sliderList.className = 'dev-sliders'
  root.appendChild(sliderList)

  for (const spec of SLIDERS) {
    const row = document.createElement('label')
    row.className = 'dev-slider-row'

    const name = document.createElement('span')
    name.className = 'dev-slider-name'
    name.textContent = spec.label

    const value = document.createElement('span')
    value.className = 'dev-slider-value'
    value.textContent = config.movement[spec.key]

    const input = document.createElement('input')
    input.type = 'range'
    input.min = spec.min
    input.max = spec.max
    input.step = spec.step
    input.value = config.movement[spec.key]
    input.addEventListener('input', () => {
      const num = parseFloat(input.value)
      config.movement[spec.key] = num
      value.textContent = num
    })

    row.append(name, input, value)
    sliderList.appendChild(row)
  }

  document.body.appendChild(root)

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Backquote') root.classList.toggle('hidden')
  })

  let frames = 0
  let fpsAccum = 0
  let fps = 0

  return {
    update(dt, controller) {
      if (root.classList.contains('hidden')) return

      frames += 1
      fpsAccum += dt
      if (fpsAccum >= 0.25) {
        fps = Math.round(frames / fpsAccum)
        frames = 0
        fpsAccum = 0
      }

      statLines.fps.textContent = `FPS: ${fps}`
      statLines.speed.textContent = `Speed: ${controller.horizontalSpeed.toFixed(2)} u/s`
      statLines.grounded.textContent = `Grounded: ${controller.grounded}`
      statLines.dashCd.textContent = `Dash CD: ${Math.max(controller.dashCooldownRemaining, 0).toFixed(2)}s`
    },
  }
}
