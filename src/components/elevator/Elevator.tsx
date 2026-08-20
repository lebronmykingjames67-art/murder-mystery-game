import { useGameStore } from '../../state/gameStore';
import { floors } from '../../data/hotel';
import ClueIcon from '../art/ClueIcon';

export default function Elevator() {
  const currentFloorId = useGameStore((s) => s.currentFloorId);
  const travelToFloor = useGameStore((s) => s.travelToFloor);
  const flags = useGameStore((s) => s.flags);

  return (
    <div className="elevator-screen">
      <div className="elevator-panel panel">
        <div className="eyebrow">Elevator</div>
        <h2>Where to, Detective?</h2>
        <div className="gold-rule" />
        <div className="elevator-buttons">
          {floors.map((floor) => {
            const locked = !!floor.locked && !flags[floor.locked.unlockFlag];
            const isCurrent = currentFloorId === floor.id;
            return (
              <button
                key={floor.id}
                className={`elevator-btn${isCurrent ? ' current' : ''}${locked ? ' locked' : ''}`}
                onClick={() => travelToFloor(floor.id)}
              >
                <span className="elevator-btn-num">{floor.displayNumber}</span>
                <span className="elevator-btn-info">
                  <span className="elevator-btn-name">{floor.name}</span>
                  <span className="elevator-btn-sub">{locked ? 'Access restricted' : floor.subtitle}</span>
                </span>
                {locked && <ClueIcon icon="lock" size={16} className="elevator-lock-icon" />}
                {isCurrent && !locked && <span className="elevator-btn-here">here</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
