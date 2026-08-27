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
  },
  physics: {
    fixedTimestep: 1 / 60,
  },
}
