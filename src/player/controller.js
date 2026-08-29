import * as THREE from 'three'
import { stepCapsule, hasHeadroom } from './collision.js'

const MIN_SLIDE_SPEED = 0.5

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Owns the player's body: position, velocity, facing, and the movement
 * state machine (walk/sprint, jump w/ coyote+buffer, dash, slide, bunny-hop).
 * Position/velocity live on `this.feet` / `this.velocity` (feet-space, see
 * collision.js). Orientation lives on `this.yaw` / `this.pitch`.
 */
export class PlayerController {
  constructor(config, spawnPosition) {
    this.config = config
    this.feet = spawnPosition.clone()
    this.velocity = new THREE.Vector3()
    this.radius = config.player.radius
    this.height = config.movement.standHeight
    this.yaw = 0
    this.pitch = 0
    this.grounded = false

    this.sliding = false
    this.slideDirection = new THREE.Vector2()
    this.slideStartSpeed = 0
    this.slideElapsed = 0

    this.dashing = false
    this.dashTimer = 0
    this.dashCooldownRemaining = 0
    this.invulnTimer = 0

    this.coyoteTimer = Infinity
    this.jumpBufferTimer = Infinity
    this.timeSinceLanded = Infinity
    this.justLanded = false

    this.maxHealth = config.player.maxHealth
    this.health = this.maxHealth
    this.justDamaged = false
    this.lastDamageAmount = 0

    // Per-run modifiers (e.g. from Archive picks — see roomTypes.js). Reset on
    // respawn rather than baked into config, so a new run starts from base
    // stats instead of carrying a previous run's boosts (and the dev overlay's
    // sliders keep showing the true base values, not a run-inflated one).
    this.dashSpeedMultiplier = 1
  }

  /** Applies damage unless the player is currently invulnerable (e.g. mid-dash). Returns true if it landed. */
  takeDamage(amount) {
    if (this.invulnerable || this.health <= 0) return false
    this.health = Math.max(this.health - amount, 0)
    this.justDamaged = true
    this.lastDamageAmount = amount
    return true
  }

  /** Clears per-run modifiers (Archive picks) and heals to full base health — call once at the start of a new run. */
  resetRunStats() {
    this.maxHealth = this.config.player.maxHealth
    this.health = this.maxHealth
    this.dashSpeedMultiplier = 1
  }

  /** Repositions the player without touching run stats — use for floor-to-floor progression. */
  teleport(position) {
    this.feet.copy(position)
    this.velocity.set(0, 0, 0)
    this.dashing = false
    this.sliding = false
    this.dashCooldownRemaining = 0
    this.invulnTimer = 0
  }

  /** Full reset for a fresh run: new stats and a new position (e.g. after death). */
  respawn(position) {
    this.resetRunStats()
    this.teleport(position)
  }

  applyLook(movementX, movementY) {
    const cam = this.config.camera
    this.yaw -= movementX * cam.lookSensitivity
    const invert = cam.invertY ? -1 : 1
    this.pitch -= movementY * cam.lookSensitivity * invert
    const maxPitch = Math.PI / 2 - 0.01
    this.pitch = clamp(this.pitch, -maxPitch, maxPitch)
  }

  /** Local (x = strafe right, z = forward) -> world XZ, rotated by current yaw. */
  worldDirectionFromInput(input) {
    let ix = 0
    let iz = 0
    if (input.forward) iz -= 1
    if (input.back) iz += 1
    if (input.left) ix -= 1
    if (input.right) ix += 1
    if (ix === 0 && iz === 0) return null

    const len = Math.hypot(ix, iz)
    ix /= len
    iz /= len
    const cos = Math.cos(this.yaw)
    const sin = Math.sin(this.yaw)
    return {
      x: ix * cos + iz * sin,
      z: -ix * sin + iz * cos,
    }
  }

  forwardFromYaw() {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) }
  }

  update(dt, input, boxes) {
    const movement = this.config.movement
    this.input = input
    this.strafeInput = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    this.justDamaged = false

    this.tryStartDash(input, movement)
    if (this.dashing) {
      this.updateDash(dt)
    } else {
      this.updateSlide(dt, input, movement)
      if (!this.sliding) this.updateGroundAndAirMovement(dt, input, movement)
      this.tryJump(dt, input, movement)
    }

    this.velocity.y -= movement.gravity * dt

    const wasGrounded = this.grounded
    const capsuleView = { feet: this.feet, velocity: this.velocity, radius: this.radius, height: this.height, grounded: this.grounded }
    stepCapsule(capsuleView, boxes, dt)
    this.grounded = capsuleView.grounded

    this.justLanded = !wasGrounded && this.grounded
    this.timeSinceLanded = this.justLanded ? 0 : this.timeSinceLanded + dt
    this.coyoteTimer = this.grounded ? 0 : this.coyoteTimer + dt

    this.updateHeight(boxes, movement)

    if (this.dashCooldownRemaining > 0) this.dashCooldownRemaining -= dt
    if (this.invulnTimer > 0) this.invulnTimer -= dt
  }

  updateGroundAndAirMovement(dt, input, movement) {
    const dir = this.worldDirectionFromInput(input)
    const speedCap = input.sprint ? movement.sprintSpeed : movement.walkSpeed
    const withinBunnyHopWindow = this.timeSinceLanded <= movement.bunnyHopWindow
    const instantGroundResponse = this.grounded && !withinBunnyHopWindow

    if (instantGroundResponse) {
      this.velocity.x = dir ? dir.x * speedCap : 0
      this.velocity.z = dir ? dir.z * speedCap : 0
      return
    }

    // Airborne, or freshly landed within the bunny-hop grace window: only
    // steer toward the target when there's input, and only partially, so
    // existing momentum is never clobbered ("keep 100% of your speed").
    if (dir) {
      const targetX = dir.x * speedCap
      const targetZ = dir.z * speedCap
      this.velocity.x += (targetX - this.velocity.x) * movement.airControl
      this.velocity.z += (targetZ - this.velocity.z) * movement.airControl
    }
  }

  tryJump(dt, input, movement) {
    if (input.jumpPressed) this.jumpBufferTimer = 0
    else this.jumpBufferTimer += dt

    const canJump = this.coyoteTimer <= movement.coyoteTime
    const wantsJump = this.jumpBufferTimer <= movement.jumpBuffer
    if (!canJump || !wantsJump) return

    this.velocity.y = movement.jumpVelocity
    this.grounded = false
    this.sliding = false
    this.coyoteTimer = Infinity
    this.jumpBufferTimer = Infinity
  }

  tryStartDash(input, movement) {
    if (this.dashing || this.dashCooldownRemaining > 0 || !input.dashPressed) return

    const dir = this.worldDirectionFromInput(input) ?? this.forwardFromYaw()
    this.dashing = true
    this.dashTimer = movement.dashDuration
    this.invulnTimer = movement.dashInvuln
    this.dashCooldownRemaining = movement.dashCooldown
    this.sliding = false
    const dashSpeed = movement.dashSpeed * this.dashSpeedMultiplier
    this.velocity.x = dir.x * dashSpeed
    this.velocity.z = dir.z * dashSpeed
  }

  updateDash(dt) {
    this.dashTimer -= dt
    if (this.dashTimer <= 0) this.dashing = false
  }

  updateSlide(dt, input, movement) {
    if (this.sliding) {
      this.slideElapsed += dt
      const t = Math.min(this.slideElapsed / movement.slideDecayTime, 1)
      const speed = this.slideStartSpeed * (1 - t)
      this.velocity.x = this.slideDirection.x * speed
      this.velocity.z = this.slideDirection.y * speed
      const releasedInput = !(input.slideHeld && input.sprint)
      if (t >= 1 || releasedInput) this.sliding = false
      return
    }

    const wantsToStart = input.slideHeld && input.sprint && this.grounded
    if (!wantsToStart) return
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z)
    if (horizSpeed < MIN_SLIDE_SPEED) return

    this.sliding = true
    this.slideElapsed = 0
    this.slideStartSpeed = Math.max(horizSpeed, movement.sprintSpeed)
    this.slideDirection.set(this.velocity.x / horizSpeed, this.velocity.z / horizSpeed)
  }

  /** Capsule height shrinks instantly to slide height; only grows back once there's headroom. */
  updateHeight(boxes, movement) {
    const desired = this.sliding ? movement.slideHeight : movement.standHeight
    if (desired < this.height) {
      this.height = desired
      return
    }
    if (desired > this.height) {
      const probe = { feet: this.feet, radius: this.radius }
      if (hasHeadroom(probe, boxes, desired)) this.height = desired
    }
  }

  get crouched() {
    return this.height < this.config.movement.standHeight - 1e-3
  }

  get horizontalSpeed() {
    return Math.hypot(this.velocity.x, this.velocity.z)
  }

  get invulnerable() {
    return this.invulnTimer > 0
  }
}
