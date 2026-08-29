const HEALTH_R = 44
const CHARGE_R = 27
const HEALTH_CIRC = 2 * Math.PI * HEALTH_R
const CHARGE_CIRC = 2 * Math.PI * CHARGE_R
const WEAPON_NAME_HOLD = 2 // sec, DESIGN.md Section 16

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bch = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bch})`
}

/**
 * Combat HUD (DESIGN.md Section 16, Phase 2's slice of it): a health ring
 * and a charge ring around the crosshair, and the current weapon name that
 * fades out after 2 seconds.
 */
export function createCombatHud() {
  const root = document.createElement('div')
  root.id = 'combat-hud'
  root.innerHTML = `
    <div class="crosshair-cluster">
      <svg class="ring ring-health" viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" r="${HEALTH_R}" />
        <circle class="ring-fg" cx="50" cy="50" r="${HEALTH_R}" stroke-dasharray="${HEALTH_CIRC}" />
      </svg>
      <svg class="ring ring-charge" viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" r="${CHARGE_R}" />
        <circle class="ring-fg" cx="50" cy="50" r="${CHARGE_R}" stroke-dasharray="${CHARGE_CIRC}" />
      </svg>
      <div class="crosshair-dot"></div>
    </div>
    <div class="weapon-name"></div>
  `
  document.body.appendChild(root)

  const healthFg = root.querySelector('.ring-health .ring-fg')
  const chargeFg = root.querySelector('.ring-charge .ring-fg')
  const weaponNameEl = root.querySelector('.weapon-name')

  let lastWeaponKey = null
  let weaponNameTimer = 0

  function pulseWeaponName() {
    weaponNameTimer = WEAPON_NAME_HOLD
  }

  function update(dt, controller, weaponSystem) {
    const healthFrac = clamp01(controller.health / controller.maxHealth)
    healthFg.style.strokeDashoffset = `${HEALTH_CIRC * (1 - healthFrac)}`
    healthFg.style.stroke = lerpColor(0xff3b3b, 0x22e8ff, healthFrac)

    const active = weaponSystem.getActive()
    const chargeFrac = clamp01(active.charge / active.maxCharge)
    chargeFg.style.strokeDashoffset = `${CHARGE_CIRC * (1 - chargeFrac)}`

    const key = weaponSystem.getActiveKey()
    if (key !== lastWeaponKey) {
      lastWeaponKey = key
      weaponNameEl.textContent = active.name
      pulseWeaponName()
    }
    weaponNameTimer -= dt
    weaponNameEl.style.opacity = weaponNameTimer > 0 ? '1' : '0'
  }

  return { update, pulseWeaponName }
}
