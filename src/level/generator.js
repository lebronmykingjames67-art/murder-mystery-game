import * as THREE from 'three'
import { CHUNKS, getChunkById } from './chunks.js'
import { createLevelKit, doorPosition, OPPOSITE_SIDE, SIDE_OFFSET } from './levelKit.js'
import { createDoor } from './doors.js'

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * Plans a room graph on a grid via random walk: place a start room, then
 * repeatedly expand a random open door on a random placed room into a new
 * room whose chunk has a matching socket, until `roomCount` rooms exist (or
 * attempts run out). Purely data — no THREE.js calls — so wall-ownership
 * (see levelKit.buildPerimeterWalls) can be resolved once the whole graph
 * is known, rather than while still building it.
 */
function planRooms(roomCount) {
  const grid = new Map()
  const key = (gx, gz) => `${gx},${gz}`
  const rooms = []

  // The start room always needs solid, safe footing (the player spawns directly
  // into it), so it never uses the gap-only Gauntlet chunk.
  const startChunk = pickRandom(CHUNKS.filter((c) => c.id !== 'gap-gauntlet'))
  const start = { gx: 0, gz: 0, chunkId: startChunk.id, doors: startChunk.doors, connections: {} }
  grid.set(key(0, 0), start)
  rooms.push(start)

  let attempts = 0
  while (rooms.length < roomCount && attempts < roomCount * 25) {
    attempts++
    const from = pickRandom(rooms)
    const openSides = from.doors.filter((s) => !from.connections[s])
    if (openSides.length === 0) continue
    const side = pickRandom(openSides)
    const offset = SIDE_OFFSET[side]
    const gx = from.gx + offset.x
    const gz = from.gz + offset.z
    if (grid.has(key(gx, gz))) continue

    const neededSide = OPPOSITE_SIDE[side]
    const candidates = CHUNKS.filter((c) => c.doors.includes(neededSide))
    if (candidates.length === 0) continue
    const chunk = pickRandom(candidates)

    const room = { gx, gz, chunkId: chunk.id, doors: chunk.doors, connections: {} }
    room.connections[neededSide] = true
    from.connections[side] = true
    grid.set(key(gx, gz), room)
    rooms.push(room)
  }

  return rooms
}

/**
 * Caps how many rooms can end up using the gap-only Gauntlet chunk, so a
 * short floor can't randomly lose every non-start room to it (which would
 * leave no room for Combat or the guaranteed Silence). Excess ones get
 * re-chunked to something that still satisfies their already-planned
 * connections.
 */
function limitGauntletRooms(rooms, max) {
  const gauntletRooms = rooms.filter((r) => r.chunkId === 'gap-gauntlet')
  for (const room of gauntletRooms.slice(max)) {
    const neededSides = room.doors.filter((s) => room.connections[s])
    const candidates = CHUNKS.filter((c) => c.id !== 'gap-gauntlet' && neededSides.every((s) => c.doors.includes(s)))
    if (candidates.length === 0) continue
    const replacement = pickRandom(candidates)
    room.chunkId = replacement.id
    room.doors = replacement.doors
  }
}

/** Assigns a content type to each planned room (DESIGN.md Section 10's room types, minus the boss arena). */
function assignRoomTypes(rooms) {
  for (const room of rooms) room.type = 'combat'
  rooms[0].isStart = true
  // A single-room floor (the Floor 5 arena) has nowhere else for the fight to
  // live, so it stays 'combat' even though the player spawns directly in it.
  if (rooms.length > 1) rooms[0].type = 'start'

  // gap-gauntlet's geometry is nothing but gaps — it's only ever a Gauntlet room.
  for (const room of rooms) {
    if (room.chunkId === 'gap-gauntlet') room.type = 'gauntlet'
  }

  const assignable = rooms.slice(1).filter((r) => r.type === 'combat')
  if (assignable.length > 0) {
    pickRandom(assignable).type = 'silence'
  }
  const stillAssignable = assignable.filter((r) => r.type === 'combat')
  if (stillAssignable.length > 0 && rooms.length >= 4) {
    pickRandom(stillAssignable).type = 'archive'
  }

  // The exit lives on whichever room reached last in the walk still has a free door;
  // search backward since the very last room occasionally has none left.
  let exitRoom = null
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (rooms[i].doors.some((s) => !rooms[i].connections[s])) {
      exitRoom = rooms[i]
      break
    }
  }
  exitRoom = exitRoom ?? rooms[rooms.length - 1]
  exitRoom.isExit = true
  const freeSides = exitRoom.doors.filter((s) => !exitRoom.connections[s])
  const exitSide = freeSides.length > 0 ? freeSides[0] : exitRoom.doors[0]
  exitRoom.connections[exitSide] = 'exit'
  exitRoom.exitSide = exitSide
}

/** Resolves a planned room's wall treatment: 'open' (built here), 'skip' (built by the N/W neighbor), or 'closed'. */
function resolveSides(room) {
  const sides = {}
  for (const side of room.doors) {
    const connection = room.connections[side]
    if (connection === 'exit') sides[side] = 'open'
    else if (connection) sides[side] = side === 'N' || side === 'W' ? 'open' : 'skip'
    else sides[side] = 'closed'
  }
  return sides
}

/**
 * Builds one generated floor (DESIGN.md Section 10) into `scene`, using
 * `floorNumber` (1-based) to pick room count and accent color. Returns
 * { colliders, spawn, rooms, exitPosition, accentColor } — `rooms` carries
 * per-room bounds/type/doors for roomTypes.js to populate content into.
 */
export function generateFloor(scene, config, floorNumber) {
  const floorConfig = config.floor
  const accentColor = floorConfig.accentColors[Math.min(floorNumber - 1, floorConfig.accentColors.length - 1)]
  const kit = createLevelKit(accentColor)
  const colliders = []
  const chunkSize = floorConfig.chunkSize

  const roomCount = floorConfig.roomCounts[Math.min(floorNumber - 1, floorConfig.roomCounts.length - 1)]
  const plannedRooms = planRooms(roomCount)
  // At least one Combat room, one guaranteed Silence, and (on 4+ room floors)
  // one guaranteed Archive must fit among the non-start rooms — only let
  // Gauntlet claim whatever's left over.
  const minReserved = roomCount >= 4 ? 3 : 2
  const maxGauntlet = Math.max(0, roomCount - 1 - minReserved)
  limitGauntletRooms(plannedRooms, maxGauntlet)
  assignRoomTypes(plannedRooms)

  // A door object is created once per boundary, by whichever room's side is
  // 'open' (the same room that built that wall's gap — see resolveSides).
  // Rooms that 'skip' a shared boundary look the door up here instead of
  // creating a duplicate, keyed by the owning room's grid cell + side.
  const doorsByKey = new Map()
  const doorKey = (gx, gz, side) => `${gx},${gz},${side}`

  const rooms = []
  for (const plan of plannedRooms) {
    const origin = new THREE.Vector3(plan.gx * chunkSize, 0, plan.gz * chunkSize)
    const chunk = getChunkById(plan.chunkId)
    const sides = resolveSides(plan)
    const { spawnMarker } = chunk.build(kit, scene, colliders, origin, sides, floorConfig)

    for (const side of chunk.doors) {
      if (sides[side] === 'open') {
        doorsByKey.set(doorKey(plan.gx, plan.gz, side), createDoor(scene, colliders, origin, side, floorConfig))
      }
    }

    rooms.push({
      ...plan,
      origin,
      spawnMarker,
      sides,
      bounds: {
        minX: origin.x - chunkSize / 2,
        maxX: origin.x + chunkSize / 2,
        minZ: origin.z - chunkSize / 2,
        maxZ: origin.z + chunkSize / 2,
      },
    })
  }

  // Resolve each room's full bordering-door list, including doors owned by a neighbor.
  for (const room of rooms) {
    room.boundaryDoors = []
    for (const side of room.doors) {
      if (room.sides[side] === 'closed') continue
      if (room.sides[side] === 'open') {
        room.boundaryDoors.push(doorsByKey.get(doorKey(room.gx, room.gz, side)))
      } else {
        const offset = SIDE_OFFSET[side]
        room.boundaryDoors.push(doorsByKey.get(doorKey(room.gx + offset.x, room.gz + offset.z, OPPOSITE_SIDE[side])))
      }
    }
  }

  const exitRoom = rooms[rooms.length - 1].isExit ? rooms[rooms.length - 1] : rooms.find((r) => r.isExit)
  const exitOffset = SIDE_OFFSET[exitRoom.exitSide]
  const exitPosition = doorPosition(exitRoom.origin, exitRoom.exitSide, chunkSize)
  exitPosition.x += exitOffset.x * 3
  exitPosition.z += exitOffset.z * 3
  exitPosition.y = 1

  return { colliders, spawn: rooms[0].spawnMarker, rooms, exitPosition, accentColor }
}
