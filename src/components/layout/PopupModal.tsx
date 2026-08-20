import { useGameStore } from '../../state/gameStore';

export default function PopupModal() {
  const popup = useGameStore((s) => s.popup);
  const dismiss = useGameStore((s) => s.dismissPopup);

  if (!popup) return null;

  return (
    <div className="scrim" onClick={dismiss}>
      <div className={`popup-modal popup-${popup.kind}`} onClick={(e) => e.stopPropagation()}>
        <div className="popup-kind-tag eyebrow">
          {popup.kind === 'clue' ? 'Evidence Recovered' : popup.kind === 'locked' ? 'Locked' : 'Detective Notes'}
        </div>
        <h3>{popup.title}</h3>
        <p className="popup-text">{popup.text}</p>
        {popup.kind === 'clue' && <p className="popup-footnote">Added to your notebook.</p>}
        <button className="btn btn-primary popup-ok" onClick={dismiss} autoFocus>
          {popup.kind === 'locked' ? 'Understood' : 'Close'}
        </button>
      </div>
    </div>
  );
}
