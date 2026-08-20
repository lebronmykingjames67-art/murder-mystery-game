import { useGameStore } from '../../state/gameStore';

export default function MainMenu() {
  const started = useGameStore((s) => s.started);
  const newGame = useGameStore((s) => s.newGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const chapter = useGameStore((s) => s.chapter);

  return (
    <div className="menu-screen">
      <div className="menu-glow" />
      <div className="menu-card">
        <div className="eyebrow">A Hotel Murder Mystery</div>
        <h1>The Grand Meridian</h1>
        <p className="menu-tagline">
          One night. One body. Five people who all have a reason to lie to you.
        </p>
        <div className="gold-rule" />
        <div className="menu-actions">
          {started && (
            <button className="btn btn-primary" onClick={continueGame}>
              Continue Investigation <span className="menu-actions-sub">— Chapter {chapter}</span>
            </button>
          )}
          <button className={started ? 'btn btn-ghost' : 'btn btn-primary'} onClick={newGame}>
            {started ? 'Start a New Case' : 'Begin the Investigation'}
          </button>
        </div>
        <p className="menu-footnote">
          Julian Voss was found dead in Room 412 at 11:47 PM. The hotel is sealed until morning.
          You have until then.
        </p>
      </div>
    </div>
  );
}
