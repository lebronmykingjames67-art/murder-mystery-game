import type { Clue } from '../../types';
import { useGameStore } from '../../state/gameStore';
import { clues, contradictions } from '../../data/clues';
import ClueIcon from '../art/ClueIcon';

function ClueCard({ clue, flagged, onClick }: { clue: Clue; flagged: boolean; onClick: () => void }) {
  return (
    <button className={`clue-card${flagged ? ' flagged' : ''}`} onClick={onClick}>
      <div className={`clue-icon-badge cat-${clue.category}`}>
        <ClueIcon icon={clue.icon} size={20} />
      </div>
      <span className="clue-card-name">{clue.name}</span>
      {flagged && <span className="clue-card-flag" title="Contradicts another clue">⚠</span>}
    </button>
  );
}

export default function CluesTab() {
  const collectedClues = useGameStore((s) => s.collectedClues);
  const flags = useGameStore((s) => s.flags);
  const selectedId = useGameStore((s) => s.selectedNotebookClueId);
  const selectClue = useGameStore((s) => s.selectNotebookClue);

  const foundContradictions = contradictions.filter((c) => flags[`contradiction-seen:${c.id}`]);

  if (selectedId) {
    const clue = clues.find((c) => c.id === selectedId);
    if (!clue) {
      selectClue(null);
      return null;
    }
    const involved = foundContradictions.filter((c) => c.clueIds.includes(clue.id));
    return (
      <div className="clue-detail">
        <button className="btn btn-ghost" onClick={() => selectClue(null)}>
          ← Back to Clues
        </button>
        <div className="clue-detail-head">
          <div className={`clue-icon-badge cat-${clue.category}`}>
            <ClueIcon icon={clue.icon} size={26} />
          </div>
          <div>
            <h3>{clue.name}</h3>
            <span className={`clue-category-tag cat-${clue.category}`}>
              {clue.category === 'physical' ? 'Physical Evidence' : 'Testimony'}
            </span>
          </div>
        </div>
        <p className="clue-found-in">Found: {clue.foundIn}</p>
        <p className="clue-detail-text">{clue.detail}</p>
        {involved.map((c) => (
          <div key={c.id} className="contradiction-box">
            <div className="eyebrow">⚠ Contradiction — {c.title}</div>
            <p>{c.explanation}</p>
          </div>
        ))}
      </div>
    );
  }

  const physical = clues.filter((c) => c.category === 'physical' && collectedClues.includes(c.id));
  const testimonial = clues.filter((c) => c.category === 'testimonial' && collectedClues.includes(c.id));
  const isFlagged = (id: string) => foundContradictions.some((c) => c.clueIds.includes(id));

  return (
    <div className="clues-tab">
      {foundContradictions.length > 0 && (
        <div className="contradiction-summary">
          <div className="eyebrow">⚠ {foundContradictions.length} Contradiction{foundContradictions.length > 1 ? 's' : ''} Found</div>
          <p>Stories don't match the evidence. Tap a flagged clue to see why.</p>
        </div>
      )}

      {collectedClues.length === 0 && <p className="notebook-empty">No evidence collected yet. Start exploring the hotel.</p>}

      {physical.length > 0 && (
        <>
          <div className="eyebrow notebook-section-label">Physical Evidence</div>
          <div className="clue-grid">
            {physical.map((clue) => (
              <ClueCard key={clue.id} clue={clue} flagged={isFlagged(clue.id)} onClick={() => selectClue(clue.id)} />
            ))}
          </div>
        </>
      )}

      {testimonial.length > 0 && (
        <>
          <div className="eyebrow notebook-section-label">Testimony</div>
          <div className="clue-grid">
            {testimonial.map((clue) => (
              <ClueCard key={clue.id} clue={clue} flagged={isFlagged(clue.id)} onClick={() => selectClue(clue.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
