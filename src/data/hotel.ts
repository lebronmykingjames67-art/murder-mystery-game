import type { Floor, Room } from '../types';

const FLAVOR_TEXTS = [
  'A "Do Not Disturb" sign hangs crooked on the handle. You knock anyway. Nothing.',
  'You knock. No answer. The room stays quiet, curtains drawn.',
  "Muffled television static leaks under the door. Someone's still up, but not talking to detectives tonight.",
  'A room-service tray sits outside, untouched. The door stays shut when you knock.',
  'You can hear a shower running inside. You decide not to wait around.',
  'The door is locked and the room, according to the front desk, is unoccupied tonight.',
  'A faint snore is audible through the door. You let this one sleep.',
  'Someone inside says "not interested" before you\'ve even finished knocking.',
  'The nameplate slot beside the door is empty. Vacant, for now.',
  'You hear hushed, unhappy voices inside — a couple, arguing about something that isn\'t your case. You move on.',
  'A luggage cart is parked outside, half-loaded. Whoever\'s inside is in a hurry to leave in the morning.',
  'The door opens a crack, a suspicious eye appears, and it shuts again just as fast.',
];

function flavorDoor(floorId: string, doorNumber: string, index: number): Room {
  return {
    id: `${floorId}-room-${doorNumber}`,
    floorId,
    doorNumber,
    name: `Room ${doorNumber}`,
    kind: 'flavor',
    flavorText: FLAVOR_TEXTS[index % FLAVOR_TEXTS.length],
  };
}

function flavorRange(floorId: string, from: number, to: number, exclude: number[] = []): Room[] {
  const rooms: Room[] = [];
  let i = 0;
  for (let n = from; n <= to; n++) {
    if (exclude.includes(n)) continue;
    rooms.push(flavorDoor(floorId, String(n), i));
    i++;
  }
  return rooms;
}

// ---------------------------------------------------------------------------
// Lobby
// ---------------------------------------------------------------------------

const lobbyRooms: Room[] = [
  {
    id: 'lobby-front-desk',
    floorId: 'lobby',
    doorNumber: 'Front Desk',
    name: 'Front Desk',
    kind: 'scene',
    art: 'lobby-desk',
    description:
      'The front desk, all dark wood and brass fittings. A single lamp is on. Priya Anand has barely left this post since the body was found.',
    hotspots: [
      { id: 'npc-priya', label: 'Priya Anand', x: 46, y: 38, w: 16, h: 40, kind: 'npc', npcId: 'priya' },
      {
        id: 'guest-register',
        label: 'Guest Register',
        x: 20, y: 62, w: 14, h: 12,
        kind: 'flavor',
        flavorText:
          "A leather-bound register of tonight's guests, mostly filled with familiar repeat names. The Grand Meridian doesn't get many walk-ins.",
      },
      {
        id: 'lost-and-found',
        label: 'Lost & Found Box',
        x: 8, y: 70, w: 10, h: 10,
        kind: 'flavor',
        flavorText:
          "A shoebox of orphaned items: a single glove, a paperback with a broken spine, and a cufflink that doesn't match anyone you've met yet.",
      },
      {
        id: 'clue-fake-checkin',
        label: 'Registration Cards',
        x: 62, y: 64, w: 12, h: 10,
        kind: 'clue',
        clueId: 'fake-checkin',
        requiresFlags: ['chapter_reached_2'],
      },
      {
        id: 'clue-phone-bill',
        label: 'Guest Folio Printouts',
        x: 76, y: 60, w: 12, h: 12,
        kind: 'clue',
        clueId: 'phone-bill-slip',
        requiresFlags: ['chapter_reached_3'],
      },
    ],
  },
  {
    id: 'lobby-security-office',
    floorId: 'lobby',
    doorNumber: 'Security Office',
    name: 'Security Office',
    kind: 'scene',
    art: 'security-office',
    description:
      "A cramped room behind the desk, walls lined with a bank of monitors that mostly show empty hallways. The overnight guard has left his logbook open.",
    hotspots: [
      { id: 'clue-keycard-log', label: 'Keycard Access Log', x: 30, y: 55, w: 16, h: 14, kind: 'clue', clueId: 'keycard-log' },
      { id: 'clue-security-logbook', label: "Guard's Logbook", x: 55, y: 60, w: 16, h: 14, kind: 'clue', clueId: 'security-logbook' },
      {
        id: 'monitor-bank',
        label: 'Bank of Monitors',
        x: 20, y: 20, w: 55, h: 25,
        kind: 'flavor',
        flavorText:
          '"Most of these only cover the lobby and elevators — budget cuts," the guard mutters. "Upper floors are on the honor system, mostly."',
      },
    ],
  },
  {
    id: 'lobby-concierge-lounge',
    floorId: 'lobby',
    doorNumber: 'Concierge Lounge',
    name: 'Concierge Lounge',
    kind: 'scene',
    art: 'lobby-lounge',
    description: 'A quiet sitting area of deep armchairs and low light, meant for guests waiting on cars that never seem to come.',
    hotspots: [
      {
        id: 'chess-set',
        label: 'Unfinished Chess Game',
        x: 25, y: 62, w: 14, h: 12,
        kind: 'flavor',
        flavorText: 'A chess game frozen mid-match. Whoever was playing black was about to lose, badly.',
      },
      {
        id: 'newspaper',
        label: "Yesterday's Paper",
        x: 55, y: 68, w: 14, h: 10,
        kind: 'flavor',
        flavorText:
          '"Voss-Cole Hospitality Group Eyes Third Property Downtown," reads the business section. Julian Voss, smiling in a photo, had no idea it would be his last week alive.',
      },
      {
        id: 'lost-cufflink',
        label: 'A Stray Cufflink',
        x: 70, y: 55, w: 10, h: 10,
        kind: 'flavor',
        flavorText:
          "A single silver cufflink, wedged between two couch cushions. Engraved with initials that don't match anyone on your list. Probably nothing. Probably.",
      },
    ],
  },
  {
    id: 'lobby-main-entrance',
    floorId: 'lobby',
    doorNumber: 'Main Entrance',
    name: 'Main Entrance',
    kind: 'locked',
    lockedReason: 'Security has the doors chained for the night. Nobody in, nobody out until morning.',
  },
];

// ---------------------------------------------------------------------------
// Mezzanine
// ---------------------------------------------------------------------------

const mezzanineRooms: Room[] = [
  {
    id: 'mezz-bar',
    floorId: 'mezzanine',
    doorNumber: 'The Bar',
    name: 'Mezzanine Bar',
    kind: 'scene',
    art: 'bar',
    description:
      "Low light, brass rails, the smell of citrus peel and spilled gin. Wes has been behind this bar all night and shows no sign of stopping.",
    hotspots: [
      { id: 'npc-wes', label: 'Wes Okafor', x: 30, y: 40, w: 16, h: 38, kind: 'npc', npcId: 'wes' },
      { id: 'npc-renata', label: 'Renata Cole', x: 62, y: 45, w: 16, h: 38, kind: 'npc', npcId: 'renata' },
      { id: 'clue-swept-glass', label: 'Swept-Up Glass', x: 20, y: 68, w: 12, h: 12, kind: 'clue', clueId: 'swept-glass' },
    ],
  },
  {
    id: 'mezz-function-room',
    floorId: 'mezzanine',
    doorNumber: 'Function Room',
    name: 'Function Room',
    kind: 'scene',
    art: 'function-room',
    description:
      'Balloons deflating over a banner reading CONGRATULATIONS ON 15 YEARS — VOSS-COLE HOSPITALITY GROUP. The party ended hours ago, but no one has cleaned up yet.',
    hotspots: [
      {
        id: 'clue-seating-chart',
        label: 'Seating Chart',
        x: 45, y: 55, w: 16, h: 14,
        kind: 'clue',
        clueId: 'party-seating-chart',
      },
      {
        id: 'banner',
        label: 'Anniversary Banner',
        x: 30, y: 15, w: 40, h: 12,
        kind: 'flavor',
        flavorText: 'Fifteen years in business together, the banner says. It was supposed to be a celebration.',
      },
    ],
  },
  {
    id: 'mezz-restaurant',
    floorId: 'mezzanine',
    doorNumber: 'Restaurant',
    name: 'Restaurant',
    kind: 'flavor',
    flavorText: 'The restaurant is dark and empty, chairs stacked on tables. It closed hours before any of this happened.',
  },
];

// ---------------------------------------------------------------------------
// Floor 2
// ---------------------------------------------------------------------------

const floor2Rooms: Room[] = [
  ...flavorRange('floor2', 201, 212),
  {
    id: 'floor2-vending-nook',
    floorId: 'floor2',
    doorNumber: 'Vending Nook',
    name: 'Ice & Vending Nook',
    kind: 'scene',
    art: 'vending-nook',
    description: 'An ice machine grinds away next to a vending machine that\'s sold out of everything except the flavor nobody wants.',
    hotspots: [
      {
        id: 'vending-machine',
        label: 'Vending Machine',
        x: 55, y: 35, w: 20, h: 45,
        kind: 'flavor',
        flavorText: 'SOLD OUT blinks under every button except the licorice chews. Nobody has ever wanted those.',
      },
      {
        id: 'ice-machine',
        label: 'Ice Machine',
        x: 20, y: 45, w: 20, h: 30,
        kind: 'flavor',
        flavorText: 'It rumbles and clunks. Somewhere above the murder investigation, life goes on, one ice cube at a time.',
      },
    ],
  },
  {
    id: 'floor2-laundry',
    floorId: 'floor2',
    doorNumber: 'Laundry Closet',
    name: 'Laundry Closet',
    kind: 'scene',
    art: 'laundry',
    description: 'Shelves of folded towels and a laundry cart abandoned mid-shift.',
    hotspots: [
      {
        id: 'towel-shelves',
        label: 'Towel Shelves',
        x: 25, y: 30, w: 25, h: 40,
        kind: 'flavor',
        flavorText: 'Perfectly folded towels, stacked with military precision. Someone here takes real pride in this.',
      },
      {
        id: 'lost-sock',
        label: 'A Single Sock',
        x: 60, y: 70, w: 10, h: 8,
        kind: 'flavor',
        flavorText: 'One lonely sock, no match in sight. Some mysteries go unsolved.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Floor 3
// ---------------------------------------------------------------------------

const floor3Rooms: Room[] = [
  ...flavorRange('floor3', 301, 312),
  {
    id: 'floor3-housekeeping-storage',
    floorId: 'floor3',
    doorNumber: 'Housekeeping Storage',
    name: 'Housekeeping Storage',
    kind: 'scene',
    art: 'housekeeping',
    description: 'Rows of supply carts, folded linens, and a pegboard of keys that predates the hotel\'s electronic locks.',
    hotspots: [
      {
        id: 'clue-master-key',
        label: 'Pegboard of Keys',
        x: 60, y: 30, w: 18, h: 22,
        kind: 'clue',
        clueId: 'master-key',
      },
      {
        id: 'supply-carts',
        label: 'Supply Carts',
        x: 20, y: 55, w: 25, h: 30,
        kind: 'flavor',
        flavorText: 'Carts stocked with tiny soaps and folded towel swans. Nothing here but the ordinary business of hospitality.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Floor 4
// ---------------------------------------------------------------------------

const floor4Rooms: Room[] = [
  ...flavorRange('floor4', 401, 411, [410]),
  {
    id: 'floor4-room-410',
    floorId: 'floor4',
    doorNumber: '410',
    name: 'Room 410',
    kind: 'locked',
    unlockFlag: 'chapter_reached_3',
    unlockedKind: 'scene',
    lockedReason:
      "A \"Do Not Disturb\" sign hangs on the knob. Security suggests letting the guest inside settle down first — she's had a fright tonight.",
    art: 'guestroom-neighbor',
    description: "A tidy, over-decorated room — doilies on every surface. Diane Faraday is wrapped in a cardigan, wide awake despite the hour.",
    hotspots: [
      { id: 'npc-diane', label: 'Diane Faraday', x: 50, y: 40, w: 18, h: 40, kind: 'npc', npcId: 'diane' },
      {
        id: 'doilies',
        label: 'The Doilies',
        x: 20, y: 65, w: 14, h: 10,
        kind: 'flavor',
        flavorText: 'Doilies. Actual doilies. On every surface, including — somehow — the television remote.',
      },
    ],
  },
  {
    id: 'floor4-room-412',
    floorId: 'floor4',
    doorNumber: '412',
    name: "Room 412 — Julian Voss's Suite",
    kind: 'scene',
    art: 'guestroom-crime',
    description:
      "The crime scene. A chalk outline near the balcony doors marks where Julian Voss was found. The room has been left exactly as it was — for you.",
    hotspots: [
      { id: 'clue-coroner-note', label: "Doctor's Note", x: 22, y: 58, w: 12, h: 12, kind: 'clue', clueId: 'coroner-note' },
      { id: 'clue-letter-opener', label: 'Letter Opener', x: 40, y: 62, w: 10, h: 10, kind: 'clue', clueId: 'letter-opener' },
      { id: 'clue-staged-robbery', label: 'Ransacked Drawers', x: 18, y: 40, w: 18, h: 16, kind: 'clue', clueId: 'staged-robbery' },
      { id: 'clue-victims-phone', label: "Julian's Phone", x: 60, y: 55, w: 10, h: 10, kind: 'clue', clueId: 'victims-phone' },
      { id: 'clue-undamaged-lock', label: 'The Door Lock', x: 5, y: 45, w: 8, h: 18, kind: 'clue', clueId: 'undamaged-lock' },
      { id: 'clue-scuff-heelprint', label: 'Faint Heel Print', x: 35, y: 78, w: 12, h: 10, kind: 'clue', clueId: 'scuff-heelprint' },
      { id: 'clue-wine-glasses', label: 'Wine Bottle & Glasses', x: 72, y: 50, w: 14, h: 12, kind: 'clue', clueId: 'wine-glasses' },
      {
        id: 'chalk-outline',
        label: 'The Chalk Outline',
        x: 48, y: 72, w: 20, h: 14,
        kind: 'flavor',
        flavorText: "You've seen these before. It never gets easier. Julian Voss died here, on his own suite's floor, hours before his morning meeting.",
      },
      {
        id: 'balcony-view',
        label: 'The Balcony Doors',
        x: 85, y: 30, w: 12, h: 35,
        kind: 'flavor',
        flavorText: 'Floor-to-ceiling glass looks out over a city that has no idea yet what happened up here tonight. The doors are locked from the inside.',
      },
    ],
  },
  {
    id: 'floor4-stairwell',
    floorId: 'floor4',
    doorNumber: 'Fire Stairwell',
    name: 'Fire Stairwell (Floor 4)',
    kind: 'scene',
    art: 'stairwell',
    description: 'A concrete stairwell, bare and echoing, the fire door propped just slightly ajar.',
    hotspots: [
      { id: 'clue-torn-fabric', label: 'Torn Fabric on the Hinge', x: 45, y: 45, w: 14, h: 14, kind: 'clue', clueId: 'torn-green-fabric' },
      {
        id: 'stairwell-descent',
        label: 'The Stairs Down',
        x: 30, y: 65, w: 30, h: 25,
        kind: 'flavor',
        flavorText: 'The stairwell descends into shadow, floor after floor of identical grey landings. Quiet enough to hear your own footsteps echo.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Floor 5
// ---------------------------------------------------------------------------

const floor5Rooms: Room[] = [
  ...flavorRange('floor5', 501, 512, [505]),
  {
    id: 'floor5-room-505',
    floorId: 'floor5',
    doorNumber: '505',
    name: 'Room 505',
    kind: 'scene',
    art: 'guestroom-hidden',
    description: 'A guest room registered to a "David Ellison." A man paces by the window, clearly expecting bad news of some kind.',
    hotspots: [
      { id: 'npc-marcus', label: '"David Ellison"', x: 50, y: 38, w: 18, h: 42, kind: 'npc', npcId: 'marcus' },
      { id: 'clue-torn-trust-docs', label: 'Torn Documents', x: 20, y: 70, w: 14, h: 12, kind: 'clue', clueId: 'torn-trust-docs' },
      {
        id: 'packed-suitcase',
        label: 'A Half-Packed Suitcase',
        x: 75, y: 65, w: 16, h: 14,
        kind: 'flavor',
        flavorText: "A suitcase, barely unpacked, sitting open on the luggage rack — like he's ready to leave at a moment's notice.",
      },
    ],
  },
  {
    id: 'floor5-maintenance',
    floorId: 'floor5',
    doorNumber: 'Maintenance',
    name: 'Maintenance Room',
    kind: 'locked',
    unlockFlag: 'has-clue:master-key',
    unlockedKind: 'scene',
    lockedReason: 'A heavy door, electronic lock long since dead. It takes an old-fashioned key, and you don\'t have one. Yet.',
    art: 'maintenance',
    description: 'The building\'s mechanical heart — boilers, breaker panels, and the low hum of machinery that keeps The Grand Meridian running.',
    hotspots: [
      {
        id: 'service-keys',
        label: 'Ring of Service Keys',
        x: 40, y: 45, w: 14, h: 14,
        kind: 'note',
        flavorText:
          'A ring of old service keys hangs by the door, each tagged in faded marker. One tag simply reads ROOF. You take it.',
        setsFlags: ['unlocked:rooftop'],
        hideAfterFlags: ['unlocked:rooftop'],
      },
      {
        id: 'boiler',
        label: 'The Boiler',
        x: 15, y: 30, w: 20, h: 40,
        kind: 'flavor',
        flavorText: "The building's ancient boiler, unbothered by anything happening four floors up. Still just doing its job.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rooftop
// ---------------------------------------------------------------------------

const rooftopRooms: Room[] = [
  {
    id: 'roof-terrace',
    floorId: 'rooftop',
    doorNumber: 'Terrace',
    name: 'Rooftop Terrace',
    kind: 'scene',
    art: 'rooftop',
    description:
      'Closed for the season — string lights dark, a drained pool covered in tarp, and a wind that carries all the way up from the street.',
    hotspots: [
      { id: 'clue-rooftop-napkin', label: 'Planter Box', x: 30, y: 60, w: 16, h: 16, kind: 'clue', clueId: 'rooftop-napkin' },
      {
        id: 'city-view',
        label: 'The Skyline',
        x: 60, y: 20, w: 30, h: 30,
        kind: 'flavor',
        flavorText: "The whole city, laid out and indifferent. Somewhere down there, none of this has happened yet — it's still just a rumor.",
      },
      {
        id: 'drained-pool',
        label: 'The Drained Pool',
        x: 15, y: 55, w: 20, h: 20,
        kind: 'flavor',
        flavorText: 'A pool with no water in it, tarp snapping gently in the wind. Closed for the season, the sign says. Fitting, tonight.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Floors
// ---------------------------------------------------------------------------

export const floors: Floor[] = [
  {
    id: 'lobby',
    displayNumber: 'Lobby',
    name: 'Lobby',
    subtitle: 'Ground Floor',
    rooms: lobbyRooms,
    ambientChats: [
      'A bellhop mutters into his radio: "Still nobody in or out, copy."',
      'Somewhere below, ice clinks into a bucket. Business as usual, mostly.',
      'The night manager\'s voice carries faintly — calm, controlled, handling something on the phone.',
    ],
  },
  {
    id: 'mezzanine',
    displayNumber: 'M',
    name: 'Mezzanine',
    subtitle: 'Bar & Function Rooms',
    rooms: mezzanineRooms,
    locked: { reasonText: "Security hasn't finished clearing the party floor yet. Give it a moment.", unlockFlag: 'chapter_reached_2' },
    ambientChats: [
      'A waiter squeezes past with a tray of untouched champagne flutes. "Nobody\'s in the mood anymore," he says.',
      'You can hear the bar chatter before the doors even open — low, nervous, and a little too loud.',
    ],
  },
  {
    id: 'floor2',
    displayNumber: '2',
    name: 'Floor 2',
    subtitle: 'Guest Rooms 201–212',
    rooms: floor2Rooms,
    locked: { reasonText: "Guest floors are still being canvassed. Not yet.", unlockFlag: 'chapter_reached_2' },
    ambientChats: [
      'A housekeeping cart rattles past somewhere above. Business as usual, mostly.',
      "Someone's television is playing a rerun a little too loud through a door down the hall.",
    ],
  },
  {
    id: 'floor3',
    displayNumber: '3',
    name: 'Floor 3',
    subtitle: 'Guest Rooms 301–312',
    rooms: floor3Rooms,
    locked: { reasonText: "Guest floors are still being canvassed. Not yet.", unlockFlag: 'chapter_reached_2' },
    ambientChats: [
      'A guest in a bathrobe glares at you like you personally cancelled his vacation.',
      'The hallway smells like fresh laundry and old carpet.',
    ],
  },
  {
    id: 'floor4',
    displayNumber: '4',
    name: 'Floor 4',
    subtitle: 'Guest Rooms 401–412 — Crime Scene',
    rooms: floor4Rooms,
    ambientChats: [
      'The floor goes quiet the moment the doors open. Everyone up here already knows why you\'re here.',
      'A security guard nods grimly at you from the end of the hall.',
    ],
  },
  {
    id: 'floor5',
    displayNumber: '5',
    name: 'Floor 5',
    subtitle: 'Guest Rooms 501–512',
    rooms: floor5Rooms,
    locked: { reasonText: "Security hasn't finished sweeping the fifth floor yet.", unlockFlag: 'chapter_reached_3' },
    ambientChats: [
      "It's colder up here somehow. Maybe that's just you.",
      'A door closes quickly somewhere down the hall the moment the elevator chimes.',
    ],
  },
  {
    id: 'rooftop',
    displayNumber: 'Roof',
    name: 'Rooftop',
    subtitle: 'Terrace Bar — Closed for Season',
    rooms: rooftopRooms,
    locked: { reasonText: "The rooftop bar is closed for the season. There's no way up without a key.", unlockFlag: 'unlocked:rooftop' },
    ambientChats: [
      "The service elevator groans like it hasn't made this trip in years.",
      'Cold air leaks in around the doors even before they open.',
    ],
  },
];

export function getFloor(id: string): Floor | undefined {
  return floors.find((f) => f.id === id);
}

export function getRoom(id: string): Room | undefined {
  for (const floor of floors) {
    const room = floor.rooms.find((r) => r.id === id);
    if (room) return room;
  }
  return undefined;
}

export function getFloorForRoom(roomId: string): Floor | undefined {
  return floors.find((f) => f.rooms.some((r) => r.id === roomId));
}
