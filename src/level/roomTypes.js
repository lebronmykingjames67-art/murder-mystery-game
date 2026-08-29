import * as THREE from 'three'

const STORY_FRAGMENTS = [
  'THE VAULT WAS BUILT TO KEEP MEMORY FROM ROTTING. IT KEEPS EVERYTHING ELSE TOO.',
  'FIVE FLOORS DOWN. ONE MEMORY. THEN OUT — BEFORE IT OVERWRITES WHAT YOU CAME FOR.',
  'EVERY COPY IT KEEPS OF YOU LEARNED SOMETHING FROM THE ONE BEFORE IT.',
  'YOU ARE NOT THE FIRST DIVER. THE WALLS REMEMBER THE OTHERS BETTER THAN THEY REMEMBER YOU.',
  'IT DOES NOT WANT TO HURT YOU. IT JUST DOES NOT KNOW HOW TO LET GO.',
]

const pedestalGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8)
const pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0d12, emissive: 0x22e8ff, emissiveIntensity: 0.7 })
const pedestalEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x22e8ff })

function insideBounds(bounds, x, z) {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ
}

function randomPointInRoom(room, margin) {
  const x = THREE.MathUtils.randFloat(room.bounds.minX + margin, room.bounds.maxX - margin)
  const z = THREE.MathUtils.randFloat(room.bounds.minZ + margin, room.bounds.maxZ - margin)
  return { x, z }
}

function setupCombatRoom(scene, config, room, floorNumber, enemyManager) {
  const combatCfg = config.floor.combatByFloor[Math.min(floorNumber - 1, config.floor.combatByFloor.length - 1)]
  const spawned = []
  for (let i = 0; i < combatCfg.motes; i++) {
    const p = randomPointInRoom(room, 6)
    spawned.push(enemyManager.spawnMote(new THREE.Vector3(p.x, 1.2, p.z)))
  }
  for (let i = 0; i < combatCfg.wardens; i++) {
    const p = randomPointInRoom(room, 9)
    spawned.push(enemyManager.spawnWarden(new THREE.Vector3(p.x, 0, p.z), Math.random() * Math.PI * 2))
  }

  let triggered = false
  let cleared = spawned.length === 0

  return {
    type: 'combat',
    room,
    cleared: () => cleared,
    update(dt, controller) {
      if (cleared) return
      const inside = insideBounds(room.bounds, controller.feet.x, controller.feet.z)
      if (inside && !triggered) {
        triggered = true
        for (const door of room.boundaryDoors) door?.lock()
      }
      if (triggered && spawned.every((e) => e.dead)) {
        cleared = true
        for (const door of room.boundaryDoors) door?.unlock()
      }
    },
  }
}

function setupSilenceRoom(scene, config, room) {
  const text = STORY_FRAGMENTS[Math.floor(Math.random() * STORY_FRAGMENTS.length)]
  const el = document.createElement('div')
  el.className = 'story-fragment'
  el.textContent = text
  document.body.appendChild(el)

  let healed = false

  return {
    type: 'silence',
    room,
    update(dt, controller) {
      const inside = insideBounds(room.bounds, controller.feet.x, controller.feet.z)
      el.classList.toggle('visible', inside)
      if (inside && !healed) {
        healed = true
        controller.health = Math.min(controller.health + config.silence.healAmount, controller.maxHealth)
      }
    },
    dispose() {
      el.remove()
    },
  }
}

function setupArchiveRoom(scene, colliders, config, room, onChoose) {
  const choices = config.archive.choices
  const spacing = 7
  const pedestals = choices.map((choice, i) => {
    const x = room.origin.x + (i - (choices.length - 1) / 2) * spacing
    const z = room.origin.z
    const mesh = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
    mesh.position.set(x, 0.6, z)
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(pedestalGeometry), pedestalEdgeMaterial))
    scene.add(mesh)
    return { choice, mesh, position: mesh.position }
  })

  const promptEl = document.createElement('div')
  promptEl.className = 'interact-prompt hidden'
  document.body.appendChild(promptEl)

  let resolved = false

  function clearPedestals() {
    for (const p of pedestals) scene.remove(p.mesh)
    promptEl.classList.add('hidden')
  }

  return {
    type: 'archive',
    room,
    update(dt, controller, input) {
      if (resolved) return
      let nearest = null
      let nearestDist = 2.5
      for (const p of pedestals) {
        const dist = Math.hypot(controller.feet.x - p.position.x, controller.feet.z - p.position.z)
        if (dist < nearestDist) {
          nearest = p
          nearestDist = dist
        }
      }
      if (nearest) {
        promptEl.textContent = `[F] ${nearest.choice.label} — ${nearest.choice.description}`
        promptEl.classList.remove('hidden')
        if (input.interactPressed) {
          resolved = true
          onChoose(nearest.choice)
          clearPedestals()
        }
      } else {
        promptEl.classList.add('hidden')
      }
    },
    dispose() {
      clearPedestals()
      promptEl.remove()
    },
  }
}

/** Builds the type-specific content for one generated room; returns an instance with update(dt, controller, input) or null (start/gauntlet need none). */
export function createRoomContent(scene, colliders, config, room, floorNumber, enemyManager, onArchiveChoice) {
  switch (room.type) {
    case 'combat':
      return setupCombatRoom(scene, config, room, floorNumber, enemyManager)
    case 'silence':
      return setupSilenceRoom(scene, config, room)
    case 'archive':
      return setupArchiveRoom(scene, colliders, config, room, onArchiveChoice)
    default:
      return null
  }
}

/** Applies one Archive pick's placeholder effect (DESIGN.md Section 11's real Echoes land in Phase 5). */
export function applyArchiveChoice(choice, controller, weaponSystem) {
  if (choice.id === 'vigor') {
    controller.maxHealth += 20
    controller.health += 20
  } else if (choice.id === 'overcharge') {
    for (const weapon of Object.values(weaponSystem.weapons)) weapon.charge = weapon.maxCharge
  } else if (choice.id === 'momentum') {
    controller.dashSpeedMultiplier *= 1.25
  }
}
