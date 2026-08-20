import { useGameStore } from '../../state/gameStore';
import { suspects } from '../../data/suspects';
import Portrait from '../art/Portrait';

export default function SuspectsTab() {
  const flags = useGameStore((s) => s.flags);

  return (
    <div className="suspects-tab">
      {suspects.map((suspect) => {
        const met = !!flags[`met:${suspect.id}`];
        const visibleFields = suspect.dossierFields.filter((f) => !f.requiresFlags || f.requiresFlags.every((fl) => flags[fl]));
        const lockedCount = suspect.dossierFields.length - visibleFields.length;

        return (
          <div key={suspect.id} className="suspect-card">
            <div className="suspect-card-head">
              <Portrait initials={suspect.initials} color={suspect.colorTag} size={48} />
              <div>
                <h3>{suspect.name}</h3>
                <p className="suspect-role">{suspect.role}</p>
              </div>
            </div>
            <p className="suspect-bio">{suspect.bio}</p>
            {!met ? (
              <p className="suspect-not-met">Not yet interviewed.</p>
            ) : (
              <dl className="suspect-fields">
                {visibleFields.map((f) => (
                  <div key={f.id} className="suspect-field">
                    <dt>{f.label}</dt>
                    <dd>{f.text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {met && lockedCount > 0 && <p className="suspect-more-hint">There's more to learn here.</p>}
          </div>
        );
      })}
    </div>
  );
}
