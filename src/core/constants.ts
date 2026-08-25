// Tunable numbers live here so balance passes never require hunting through logic files.

export const CELL_SIZE = 8
export const WALL_HEIGHT = 3.4
export const WALL_THICKNESS = 0.25

export const HALLWAY_WIDTH = 3.2
export const ROOM_WIDTH = CELL_SIZE - 0.6
export const DOOR_WIDTH = 2.2

export const PLAYER = {
  radius: 0.38,
  height: 1.8,
  eyeHeight: 1.62,
  crouchEyeHeight: 1.1,
  walkSpeed: 4.2,
  sprintSpeed: 7.4,
  acceleration: 38,
  deceleration: 42,
  airControl: 0.5,
  jumpSpeed: 5.6,
  gravity: 16,
  maxStamina: 100,
  staminaDrainPerSecond: 22,
  staminaRegenPerSecond: 14,
  staminaRegenDelay: 0.6,
  minSprintStamina: 6,
  maxHealth: 100,
}

export const CAMERA = {
  fovDefault: 82,
  bobWalkFrequency: 9.5,
  bobWalkAmplitude: 0.035,
  bobSprintFrequency: 13,
  bobSprintAmplitude: 0.06,
  lookSmoothing: 22,
}

export const REWARD_TABLE = [0, 100, 250, 600, 1500, 4000, 10000, 25000, 60000]

export function rewardForFloor(floorNumber: number): number {
  if (floorNumber < REWARD_TABLE.length) return REWARD_TABLE[floorNumber]
  const last = REWARD_TABLE[REWARD_TABLE.length - 1]
  const extra = floorNumber - (REWARD_TABLE.length - 1)
  return Math.round(last * Math.pow(1.62, extra))
}

export const SAVE_KEY = 'omf_save_v1'
export const SAVE_VERSION = 1

export const INTERACT_RANGE = 3.2
