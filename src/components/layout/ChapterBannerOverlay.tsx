import { useGameStore } from '../../state/gameStore';

export default function ChapterBannerOverlay() {
  const banner = useGameStore((s) => s.chapterBanner);
  const dismiss = useGameStore((s) => s.dismissChapterBanner);

  if (!banner) return null;

  return (
    <div className="scrim" onClick={dismiss}>
      <div className="chapter-banner" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow">Chapter {banner.number}</div>
        <h2>{banner.title}</h2>
        <div className="gold-rule" />
        <p>{banner.goalText}</p>
        <button className="btn btn-primary" onClick={dismiss}>
          Continue
        </button>
      </div>
    </div>
  );
}
