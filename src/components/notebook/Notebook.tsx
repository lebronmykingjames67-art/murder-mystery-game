import { useGameStore } from '../../state/gameStore';
import CluesTab from './CluesTab';
import SuspectsTab from './SuspectsTab';
import TimelineTab from './TimelineTab';

const TABS: { id: 'clues' | 'suspects' | 'timeline'; label: string }[] = [
  { id: 'clues', label: 'Clues' },
  { id: 'suspects', label: 'Suspects' },
  { id: 'timeline', label: 'Timeline' },
];

export default function Notebook() {
  const open = useGameStore((s) => s.notebookOpen);
  const tab = useGameStore((s) => s.notebookTab);
  const setTab = useGameStore((s) => s.setNotebookTab);
  const close = useGameStore((s) => s.toggleNotebook);
  const selectClue = useGameStore((s) => s.selectNotebookClue);

  if (!open) return null;

  return (
    <div className="scrim" onClick={() => close(false)}>
      <div className="notebook-panel panel" onClick={(e) => e.stopPropagation()}>
        <div className="notebook-header">
          <h2>Detective's Notebook</h2>
          <button className="btn btn-ghost notebook-close" onClick={() => close(false)}>
            Close ✕
          </button>
        </div>
        <div className="notebook-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`notebook-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => {
                setTab(t.id);
                selectClue(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="notebook-body">
          {tab === 'clues' && <CluesTab />}
          {tab === 'suspects' && <SuspectsTab />}
          {tab === 'timeline' && <TimelineTab />}
        </div>
      </div>
    </div>
  );
}
