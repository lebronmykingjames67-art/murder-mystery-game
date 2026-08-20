import { useGameStore } from '../../state/gameStore';
import { getRoom } from '../../data/hotel';
import RoomArt from '../art/RoomArt';
import Hotspot from './Hotspot';

export default function RoomScene() {
  const currentRoomId = useGameStore((s) => s.currentRoomId);
  const flags = useGameStore((s) => s.flags);
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const interactHotspot = useGameStore((s) => s.interactHotspot);

  const room = currentRoomId ? getRoom(currentRoomId) : undefined;
  if (!room) return null;

  const hotspots = (room.hotspots ?? []).filter((h) => {
    if (h.requiresFlags && !h.requiresFlags.every((f) => flags[f])) return false;
    if (h.hideAfterFlags && h.hideAfterFlags.every((f) => flags[f])) return false;
    return true;
  });

  return (
    <div className="room-screen">
      <div className="room-header">
        <button className="btn btn-ghost" onClick={leaveRoom}>
          ← Hallway
        </button>
        <h2>{room.name}</h2>
        <div />
      </div>
      <div className="room-stage">
        <RoomArt artKey={room.art} />
        <div className="vignette" />
        <div className="hotspot-layer">
          {hotspots.map((h) => (
            <Hotspot key={h.id} hotspot={h} onClick={() => interactHotspot(h.id)} />
          ))}
        </div>
      </div>
      {room.description && <p className="room-description">{room.description}</p>}
    </div>
  );
}
