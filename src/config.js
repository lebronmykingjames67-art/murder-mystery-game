// Every tuning number from DESIGN.md Section 6, in one place.
// The dev overlay (ui/devOverlay.js) binds live sliders directly to these
// fields, so nothing that reads `config.*` should cache values across frames.

export const config = {
  movement: {
    walkSpeed: 8, // units/sec
    sprintSpeed: 12, // units/sec
    airControl: 0.4, // fraction of ground control while airborne
    gravity: 22, // units/sec^2
    jumpVelocity: 7.5, // units/sec
    coyoteTime: 0.1, // sec after leaving ground a jump still works
    jumpBuffer: 0.12, // sec a jump press is remembered before landing
    dashSpeed: 18, // units/sec
    dashDuration: 0.15, // sec
    dashCooldown: 2, // sec
    dashInvuln: 0.15, // sec of invulnerability granted by a dash
    slideDecayTime: 1.2, // sec for slide speed to decay to zero
    slideHeight: 1.0, // capsule height while sliding
    standHeight: 1.8, // capsule height while standing
    bunnyHopWindow: 0.15, // sec after landing a jump still keeps full speed
  },
  camera: {
    baseFov: 90,
    sprintFov: 100,
    fovEaseTime: 0.2, // sec
    strafeRollDegrees: 2,
    standEyeHeight: 1.6,
    slideEyeHeight: 0.8,
    bobEnabled: true,
    bobAmplitude: 0.045,
    bobFrequency: 1.8, // step cycles per unit distance
    lookSensitivity: 0.0022,
    invertY: false,
    shakeMaxDuration: 0.15,
  },
  player: {
    radius: 0.4,
    maxHealth: 100,
  },
  physics: {
    fixedTimestep: 1 / 60,
  },
  weapons: {
    splitter: {
      damage: 18,
      fireCooldown: 1 / 4, // sec, "fire rate 4/sec"
      chargeCost: 10,
      maxCharge: 100,
      bulletSpeed: 45, // units/sec
      bulletRadius: 0.12,
      bulletLife: 3, // sec before a bullet despawns untouched
      splitDamageScale: 0.5, // each split bullet's damage, relative to the bullet that bounced
      splitSpreadDegrees: 22,
    },
    static: {
      damageClose: 60,
      damageFalloffDistance: 8, // units; damage drops off to minDamage by this range
      minDamage: 10,
      fireCooldown: 1, // sec, "fire rate 1/sec"
      chargeCost: 25,
      maxCharge: 100,
      pelletCount: 8,
      spreadDegrees: 12,
      range: 40,
      knockback: 16, // units/sec impulse applied to the shooter, opposite the aim direction
    },
    chargeRefillOnHit: 18,
  },
  enemies: {
    mote: {
      health: 1,
      contactDamage: 6,
      contactCooldown: 0.5, // sec between contact-damage ticks
      speed: 2.2, // units/sec
      radius: 0.5,
    },
    warden: {
      health: 60,
      contactDamage: 14,
      contactCooldown: 0.8,
      speed: 2.8,
      radius: 1.1,
      shieldArcDegrees: 120, // frontal arc that reflects bullets back at the shooter
      turnSpeedDegrees: 55, // how fast it rotates to face the player
    },
  },
}
