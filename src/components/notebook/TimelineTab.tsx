import { useGameStore } from '../../state/gameStore';
import { timeline } from '../../data/timeline';

export default function TimelineTab() {
  const flags = useGameStore((s) => s.flags);
  const sorted = [...timeline].sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="timeline-tab">
      <p className="timeline-intro">The night, reconstructed. Gaps fill in as you find the evidence to fill them.</p>
      <ol className="timeline-list">
        {sorted.map((entry) => {
          const known = !entry.requiresFlags || entry.requiresFlags.every((f) => flags[f]);
          return (
            <li key={entry.id} className={`timeline-entry${known ? '' : ' locked'}`}>
              <div className="timeline-time">{entry.time}</div>
              <div className="timeline-dot" />
              <div className="timeline-content">
                {known ? (
                  <>
                    <h4>{entry.title}</h4>
                    <p>{entry.description}</p>
                  </>
                ) : (
                  <h4 className="timeline-unknown">? ? ?</h4>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
