import type { Hotspot as HotspotType } from '../../types';

export default function Hotspot({ hotspot, onClick }: { hotspot: HotspotType; onClick: () => void }) {
  return (
    <button
      className={`hotspot hotspot-${hotspot.kind}`}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.w}%`, height: `${hotspot.h}%` }}
      onClick={onClick}
      aria-label={hotspot.label}
    >
      <span className="hotspot-marker" />
      <span className="hotspot-label">{hotspot.label}</span>
    </button>
  );
}
