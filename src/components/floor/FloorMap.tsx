import { useGameStore } from '../../state/gameStore';
import { getFloor } from '../../data/hotel';
import { clues } from '../../data/clues';
import { effectiveRoomKind } from '../../engine/rooms';
import ClueIcon from '../art/ClueIcon';

function isNumberedDoor(doorNumber: string): boolean {
  return /^\d+$/.test(doorNumber);
}

export default function FloorMap() {
  const currentFloorId = useGameStore((s) => s.currentFloorId);
  const flags = useGameStore((s) => s.flags);
  const collectedClues = useGameStore((s) => s.collectedClues);
  const enterRoom = useGameStore((s) => s.enterRoom);
  const goToElevator = useGameStore((s) => s.goToElevator);
  const goToAccusation = useGameStore((s) => s.goToAccusation);

  const floor = getFloor(currentFloorId);
  if (!floor) return null;

  const namedRooms = floor.rooms.filter((r) => !isNumberedDoor(r.doorNumber));
  const numberedRooms = floor.rooms.filter((r) => isNumberedDoor(r.doorNumber));

  const progress = collectedClues.length / clues.length;
  const readiness =
    progress < 0.35
      ? "You've barely scratched the surface. Keep looking."
      : progress < 0.7
        ? "You're building a case, but there are gaps in it."
        : "You have a strong case, if you're confident enough to make it.";

  return (
    <div className="floor-screen">
      <div className="floor-header">
        <button className="btn btn-ghost" onClick={goToElevator}>
          ← Elevator
        </button>
        <div className="floor-header-title">
          <span className="eyebrow">Floor {floor.displayNumber}</span>
          <h2>{floor.name}</h2>
        </div>
        <div />
      </div>

      {floor.id === 'lobby' && (
        <div className="accusation-cta panel">
          <div>
            <div className="eyebrow">Ready to Close the Case?</div>
            <p>{readiness}</p>
          </div>
          <button className="btn btn-primary" onClick={goToAccusation}>
            Make Your Accusation
          </button>
        </div>
      )}

      <div className="floor-body">
        {namedRooms.length > 0 && (
          <div className="door-row named-doors">
            {namedRooms.map((room) => {
              const kind = effectiveRoomKind(room, flags);
              return (
                <button
                  key={room.id}
                  className={`door-card${kind === 'locked' ? ' locked' : ''}`}
                  onClick={() => enterRoom(room.id)}
                >
                  {kind === 'locked' && <ClueIcon icon="lock" size={16} className="door-lock-icon" />}
                  <span className="door-card-name">{room.doorNumber}</span>
                </button>
              );
            })}
          </div>
        )}

        {numberedRooms.length > 0 && (
          <div className="door-grid">
            {numberedRooms.map((room) => {
              const kind = effectiveRoomKind(room, flags);
              return (
                <button
                  key={room.id}
                  className={`door-tile${kind === 'locked' ? ' locked' : ''}`}
                  onClick={() => enterRoom(room.id)}
                  title={`Room ${room.doorNumber}`}
                >
                  {room.doorNumber}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
