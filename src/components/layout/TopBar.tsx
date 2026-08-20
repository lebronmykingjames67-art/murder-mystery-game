import { useGameStore } from '../../state/gameStore';
import { getChapter } from '../../data/chapters';
import { clues } from '../../data/clues';

export default function TopBar() {
  const chapter = useGameStore((s) => s.chapter);
  const collectedClues = useGameStore((s) => s.collectedClues);
  const toggleNotebook = useGameStore((s) => s.toggleNotebook);
  const view = useGameStore((s) => s.view);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const ch = getChapter(chapter);

  return (
    <header className="topbar">
      <button className="topbar-brand" onClick={goToMenu} title="Return to main menu">
        <span className="topbar-brand-mark">GM</span>
        <span className="topbar-brand-text">The Grand Meridian</span>
      </button>
      <div className="topbar-chapter">
        <span className="eyebrow">Chapter {ch.number}</span>
        <span className="topbar-chapter-title">{ch.title}</span>
      </div>
      <button
        className="btn topbar-notebook"
        onClick={() => toggleNotebook(true)}
        disabled={view === 'dialogue' || view === 'accusation' || view === 'ending'}
      >
        Notebook
        <span className="badge">{collectedClues.length}/{clues.length}</span>
      </button>
    </header>
  );
}
