// Inline SVG scene generator for ECHO CHAMBER's four rooms — no external art
// assets, same philosophy as the rest of this repo. Every scene shares a
// 100x60 canvas so hotspot percentage coordinates line up regardless of room.
// Base wall/floor tones are fixed per room; glows and highlights read
// `var(--echo-accent)` so the single accent color the design calls for can
// shift from room to room purely through CSS.

const ACCENT = 'var(--echo-accent, #6f9bd1)';

function Glow({ cx, cy, r, opacity = 0.5, color = ACCENT }: { cx: number; cy: number; r: number; opacity?: number; color?: string }) {
  const id = `echo-glow-${cx}-${cy}-${r}`.replace(/\./g, '');
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}

function Canvas({ wallTop, wallBottom, floorTop, floorBottom, children }: {
  wallTop: string; wallBottom: string; floorTop: string; floorBottom: string; children?: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="echo-room-svg">
      <defs>
        <linearGradient id="echoWallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallTop} />
          <stop offset="100%" stopColor={wallBottom} />
        </linearGradient>
        <linearGradient id="echoFloorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={floorTop} />
          <stop offset="100%" stopColor={floorBottom} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="42" fill="url(#echoWallGrad)" />
      <rect x="0" y="42" width="100" height="18" fill="url(#echoFloorGrad)" />
      <rect x="0" y="41.4" width="100" height="0.7" fill="rgba(0,0,0,0.35)" />
      {children}
    </svg>
  );
}

function Cell() {
  return (
    <Canvas wallTop="#232a34" wallBottom="#161b22" floorTop="#1c2027" floorBottom="#0e1015">
      <Glow cx={38} cy={12} r={20} opacity={0.22} />
      {/* wall-mounted screen (ECHO lives here) */}
      <rect x={30} y={5} width={20} height={13} rx={0.6} fill="#0a0d12" stroke="rgba(150,170,200,0.35)" strokeWidth={0.35} />
      <rect x={32} y={7} width={16} height={9} fill="#101826" />
      <circle cx={34.5} cy={9} r={0.55} fill={ACCENT} opacity={0.85} />
      {/* overhead light */}
      <rect x={46} y={2} width={8} height={1.4} rx={0.5} fill="#d9dee6" opacity={0.55} className="echo-flicker" />
      {/* bed */}
      <rect x={4} y={30} width={30} height={4} rx={0.6} fill="#2a3038" />
      <rect x={4} y={22} width={30} height={9} rx={1} fill="#333a44" stroke="rgba(150,170,200,0.25)" strokeWidth={0.3} />
      {/* door, no handle */}
      <rect x={79} y={6} width={17} height={34} rx={0.6} fill="#1b2029" stroke="rgba(150,170,200,0.4)" strokeWidth={0.4} />
      <rect x={81} y={8} width={13} height={30} rx={0.4} fill="none" stroke="rgba(150,170,200,0.18)" strokeWidth={0.3} />
      {/* keypad */}
      <rect x={74.5} y={18} width={3.6} height={6} rx={0.4} fill="#12151b" stroke="rgba(150,170,200,0.3)" strokeWidth={0.25} />
      {/* loose tile seam + drain, floor */}
      <rect x={41} y={49} width={15} height={9} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
      <circle cx={68} cy={52} r={4.4} fill="#0c0e12" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
      <circle cx={68} cy={52} r={2.6} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.25} />
    </Canvas>
  );
}

function Archive() {
  const terms = [8, 20, 32, 44, 56, 68, 80, 92];
  return (
    <Canvas wallTop="#1a2026" wallBottom="#10141a" floorTop="#161a1f" floorBottom="#0a0c10">
      <Glow cx={50} cy={20} r={40} opacity={0.08} />
      {terms.map((x, i) => (
        <g key={x}>
          <rect x={x - 4.5} y={20} width={9} height={16} rx={0.5} fill="#161c22" stroke="rgba(150,170,200,0.3)" strokeWidth={0.3} />
          <rect x={x - 3.4} y={22} width={6.8} height={9} fill="#0b1015" />
          <rect
            x={x - 3.4}
            y={22}
            width={6.8}
            height={9}
            fill={ACCENT}
            opacity={i % 3 === 0 ? 0.22 : 0.12}
            className="echo-crt-hum"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
          <rect x={x - 2} y={36} width={4} height={2.4} fill="#12161b" />
        </g>
      ))}
      <rect x={0} y={40} width={100} height={1.4} fill="rgba(0,0,0,0.3)" />
    </Canvas>
  );
}

function ViewingRoom() {
  return (
    <Canvas wallTop="#211f2b" wallBottom="#14121b" floorTop="#171520" floorBottom="#0a090e">
      <Glow cx={72} cy={22} r={24} opacity={0.14} />
      {/* far wall, other side of the glass */}
      <rect x={54} y={6} width={44} height={34} fill="#151220" opacity={0.9} />
      {/* Kestrel, seated against the far wall */}
      <g opacity={0.92}>
        <circle cx={78} cy={26} r={3.1} fill="#3a3244" />
        <path d="M 72 39 Q 72 30 78 30 Q 84 30 84 39 Z" fill="#332c3d" />
      </g>
      {/* the glass pane */}
      <rect x={50} y={4} width={2.2} height={36} fill="rgba(200,210,230,0.14)" />
      <rect x={50} y={4} width={2.2} height={36} fill="none" stroke="rgba(200,210,230,0.3)" strokeWidth={0.25} />
      {/* player's side, bare */}
      <rect x={2} y={8} width={44} height={4} rx={0.5} fill="#201c2a" opacity={0.6} />
      <Glow cx={20} cy={10} r={14} opacity={0.15} />
    </Canvas>
  );
}

function ControlRoom() {
  const racks = [6, 16, 26, 66, 76, 86];
  return (
    <Canvas wallTop="#181f19" wallBottom="#0e130f" floorTop="#141a15" floorBottom="#080b08">
      <Glow cx={50} cy={16} r={30} opacity={0.16} />
      {racks.map((x) => (
        <g key={x}>
          <rect x={x} y={4} width={7} height={34} rx={0.4} fill="#131a14" stroke="rgba(150,190,150,0.25)" strokeWidth={0.3} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={x + 1.2} y={7 + i * 5} width={4.6} height={2.4} fill="#0b100c" />
          ))}
          <circle cx={x + 5.5} cy={8} r={0.4} fill={ACCENT} opacity={0.8} className="echo-crt-hum" />
        </g>
      ))}
      {/* central console */}
      <rect x={36} y={30} width={28} height={10} rx={0.8} fill="#141c15" stroke="rgba(150,190,150,0.3)" strokeWidth={0.35} />
      <rect x={39} y={32} width={22} height={5.6} fill="#0a1009" />
      <rect x={39} y={32} width={22} height={5.6} fill={ACCENT} opacity={0.18} />
    </Canvas>
  );
}

export type EchoRoomKey = 'cell' | 'archive' | 'viewing' | 'control';

export default function EchoRoomArt({ room }: { room: EchoRoomKey }) {
  return (
    <div className="echo-room-art">
      {room === 'cell' && <Cell />}
      {room === 'archive' && <Archive />}
      {room === 'viewing' && <ViewingRoom />}
      {room === 'control' && <ControlRoom />}
    </div>
  );
}
