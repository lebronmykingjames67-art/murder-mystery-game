import { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { suspects } from '../../data/suspects';
import { weaponOptions, motiveOptions } from '../../data/case';
import Portrait from '../art/Portrait';

export default function AccusationScene() {
  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [weaponId, setWeaponId] = useState<string | null>(null);
  const [motiveId, setMotiveId] = useState<string | null>(null);

  const submitAccusation = useGameStore((s) => s.submitAccusation);
  const accusationResult = useGameStore((s) => s.accusationResult);
  const closeAccusationResult = useGameStore((s) => s.closeAccusationResult);
  const goToElevator = useGameStore((s) => s.goToElevator);

  if (accusationResult) {
    return (
      <div className="accusation-screen">
        <div className="rebuttal-card panel">
          <div className="eyebrow">Not Quite</div>
          <h2>The Case Falls Apart</h2>
          <div className="gold-rule" />
          <div className="rebuttal-lines">
            {accusationResult.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <button className="btn btn-primary" onClick={closeAccusationResult}>
            Keep Investigating
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!suspectId || !weaponId || !motiveId) return;
    submitAccusation({ suspectId, weaponId, motiveId });
  };

  return (
    <div className="accusation-screen">
      <div className="accusation-intro">
        <button className="btn btn-ghost accusation-back" onClick={goToElevator}>
          ← Not Yet
        </button>
        <div className="eyebrow">Final Accusation</div>
        <h2>Who Killed Julian Voss?</h2>
        <p>Name the killer, the weapon, and the motive. All three, or it doesn't stick.</p>
      </div>

      <div className="accusation-columns">
        <div className="accusation-column">
          <div className="eyebrow">Who</div>
          <div className="accusation-options">
            {suspects.map((s) => (
              <button
                key={s.id}
                className={`accusation-option${suspectId === s.id ? ' selected' : ''}`}
                onClick={() => setSuspectId(s.id)}
              >
                <Portrait initials={s.initials} color={s.colorTag} size={34} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="accusation-column">
          <div className="eyebrow">Weapon</div>
          <div className="accusation-options">
            {weaponOptions.map((w) => (
              <button
                key={w.id}
                className={`accusation-option text-only${weaponId === w.id ? ' selected' : ''}`}
                onClick={() => setWeaponId(w.id)}
              >
                <span>{w.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="accusation-column">
          <div className="eyebrow">Motive</div>
          <div className="accusation-options">
            {motiveOptions.map((m) => (
              <button
                key={m.id}
                className={`accusation-option text-only${motiveId === m.id ? ' selected' : ''}`}
                onClick={() => setMotiveId(m.id)}
              >
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-primary accusation-submit" disabled={!suspectId || !weaponId || !motiveId} onClick={handleSubmit}>
        Make the Accusation
      </button>
    </div>
  );
}
