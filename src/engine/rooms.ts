import type { Room, RoomKind } from '../types';

export function effectiveRoomKind(room: Room, flags: Record<string, true>): RoomKind {
  if (room.kind === 'locked' && room.unlockFlag && flags[room.unlockFlag]) {
    return room.unlockedKind ?? 'scene';
  }
  return room.kind;
}
