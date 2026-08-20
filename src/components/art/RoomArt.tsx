import type { ReactNode } from 'react';
import type { RoomArtKey } from '../../types';

// A small stylized-noir scene generator. Every scene shares one 100x60 canvas
// so hotspot percentage coordinates line up regardless of art key, and every
// scene is built from the same handful of primitive shapes so the whole hotel
// reads as one consistent, illustrated world rather than disconnected assets.

function Furniture({ x, y, w, h, rx = 1.2, fill = '#201d26', stroke = 'rgba(201,162,75,0.35)' }: {
  x: number; y: number; w: number; h: number; rx?: number; fill?: string; stroke?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={0.3} />;
}

function Glow({ cx, cy, r, color, opacity = 0.5 }: { cx: number; cy: number; r: number; color: string; opacity?: number }) {
  const id = `glow-${cx}-${cy}-${r}`.replace(/\./g, '');
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

function Base({
  wallTop,
  wallBottom,
  floorTop,
  floorBottom,
  children,
}: {
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
  children?: ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="room-art-svg">
      <defs>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallTop} />
          <stop offset="100%" stopColor={wallBottom} />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={floorTop} />
          <stop offset="100%" stopColor={floorBottom} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="40" fill="url(#wallGrad)" />
      <rect x="0" y="40" width="100" height="20" fill="url(#floorGrad)" />
      <rect x="0" y="39.3" width="100" height="0.8" fill="rgba(0,0,0,0.4)" />
      {children}
    </svg>
  );
}

function Window({ x, y, w, h, tint = '#e3c078' }: { x: number; y: number; w: number; h: number; tint?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#0a0b12" stroke="rgba(201,162,75,0.5)" strokeWidth={0.4} />
      <rect x={x} y={y} width={w} height={h} fill={tint} opacity={0.12} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="rgba(201,162,75,0.4)" strokeWidth={0.3} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="rgba(201,162,75,0.4)" strokeWidth={0.3} />
    </g>
  );
}

function Skyline({ y }: { y: number }) {
  const bldgs = [
    [2, 8], [8, 14], [16, 6], [24, 18], [34, 10], [44, 22], [56, 9], [66, 16], [76, 7], [86, 13], [94, 5],
  ];
  return (
    <g opacity={0.55}>
      {bldgs.map(([bx, bh], i) => (
        <rect key={i} x={bx} y={y - bh} width={7} height={bh} fill="#0a0912" />
      ))}
    </g>
  );
}

function Stars() {
  const pts = [[6, 5], [14, 10], [22, 4], [31, 12], [40, 6], [49, 3], [58, 11], [67, 5], [75, 9], [84, 4], [92, 8], [12, 18], [60, 17]];
  return (
    <g fill="#e9e3d3">
      {pts.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={0.35} opacity={0.7} />
      ))}
    </g>
  );
}

function scene(key: RoomArtKey): ReactNode {
  switch (key) {
    case 'lobby-desk':
      return (
        <Base wallTop="#241c14" wallBottom="#150f0a" floorTop="#1c140d" floorBottom="#0f0b07">
          <Glow cx={50} cy={10} r={30} color="#e3c078" opacity={0.35} />
          <Window x={8} y={6} w={14} h={20} />
          <Window x={78} y={6} w={14} h={20} />
          <Furniture x={38} y={34} w={40} h={10} fill="#241a10" />
          <Furniture x={38} y={22} w={40} h={12} fill="#2c2013" />
          <Furniture x={44} y={16} w={4} h={7} fill="#1a1209" rx={0.5} />
        </Base>
      );
    case 'lobby-lounge':
      return (
        <Base wallTop="#221a1f" wallBottom="#140f13" floorTop="#1b1416" floorBottom="#0f0a0b">
          <Glow cx={20} cy={30} r={16} color="#e3c078" opacity={0.25} />
          <Window x={40} y={4} w={20} h={24} />
          <Furniture x={10} y={36} w={20} h={11} rx={2} fill="#231a24" />
          <Furniture x={68} y={36} w={20} h={11} rx={2} fill="#231a24" />
          <Furniture x={42} y={44} w={16} h={4} rx={1} fill="#1c1620" />
        </Base>
      );
    case 'lobby-entrance':
      return (
        <Base wallTop="#1d1a22" wallBottom="#100e14" floorTop="#181419" floorBottom="#0b090c">
          <Window x={30} y={2} w={40} h={30} tint="#8fa3c9" />
          <Furniture x={30} y={2} w={40} h={30} fill="none" stroke="rgba(201,162,75,0.6)" />
          <Furniture x={46} y={30} w={8} h={16} fill="#1a1620" />
        </Base>
      );
    case 'security-office':
      return (
        <Base wallTop="#161a1e" wallBottom="#0d1013" floorTop="#141618" floorBottom="#0a0b0c">
          <Furniture x={16} y={10} w={68} h={16} fill="#0e1216" stroke="rgba(150,190,200,0.3)" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={19 + i * 17} y={13} width={14} height={10} fill="#233038" stroke="rgba(150,190,200,0.4)" strokeWidth={0.3} />
          ))}
          <Furniture x={30} y={34} w={40} h={9} fill="#1a1e22" />
          <Glow cx={26} cy={18} r={10} color="#8fbcd6" opacity={0.25} />
        </Base>
      );
    case 'bar':
      return (
        <Base wallTop="#221810" wallBottom="#140d08" floorTop="#1a120b" floorBottom="#0d0906">
          <Glow cx={30} cy={8} r={20} color="#e3c078" opacity={0.3} />
          <Furniture x={8} y={8} w={30} h={20} fill="#1c140c" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={12 + i * 9} y={11} width={6} height={11} fill="#0e0a06" opacity={0.7} />
          ))}
          <Furniture x={0} y={36} w={100} h={9} fill="#2a1d10" />
          <Furniture x={0} y={33} w={100} h={3} fill="#3a2814" />
        </Base>
      );
    case 'restaurant':
      return (
        <Base wallTop="#1c1712" wallBottom="#110d0a" floorTop="#161210" floorBottom="#0a0807">
          <Window x={12} y={6} w={16} h={20} />
          <Window x={72} y={6} w={16} h={20} />
          <Furniture x={40} y={36} w={20} h={3} fill="#1a1512" />
          <Furniture x={44} y={30} w={2.5} h={7} fill="#161210" />
          <Furniture x={54} y={30} w={2.5} h={7} fill="#161210" />
        </Base>
      );
    case 'function-room':
      return (
        <Base wallTop="#1c1420" wallBottom="#120d15" floorTop="#171016" floorBottom="#0b070a">
          <Glow cx={50} cy={6} r={26} color="#e3c078" opacity={0.28} />
          <Furniture x={20} y={10} w={60} h={4} rx={1} fill="#241a2a" />
          <Furniture x={30} y={36} w={40} h={9} fill="#1e1622" />
          <Furniture x={14} y={20} w={5} h={14} fill="#1a1420" rx={2} />
          <Furniture x={81} y={20} w={5} h={14} fill="#1a1420" rx={2} />
        </Base>
      );
    case 'guestroom-crime':
      return (
        <Base wallTop="#161a22" wallBottom="#0c0e14" floorTop="#151519" floorBottom="#08080a">
          <Window x={70} y={4} w={22} h={26} tint="#7c92c2" />
          <Glow cx={81} cy={16} r={16} color="#7c92c2" opacity={0.3} />
          <Furniture x={6} y={20} w={20} h={16} fill="#1a1c24" />
          <rect x={8} y={22} width={7} height={5} fill="#0c0d12" opacity={0.8} />
          <rect x={17} y={22} width={7} height={5} fill="#0c0d12" opacity={0.8} />
          <rect x={34} y={40} width={22} height={2.4} rx={1.2} fill="none" stroke="#c9c2a8" strokeWidth={0.6} strokeDasharray="2,1.4" />
          <Furniture x={38} y={16} w={16} h={9} fill="#1e1a24" />
        </Base>
      );
    case 'guestroom-neighbor':
      return (
        <Base wallTop="#241c1a" wallBottom="#150f0d" floorTop="#1a1310" floorBottom="#0d0907">
          <Glow cx={70} cy={10} r={18} color="#e3c078" opacity={0.3} />
          <Window x={64} y={6} w={18} h={20} />
          <Furniture x={8} y={30} w={26} h={16} fill="#241c1a" />
          <Furniture x={10} y={20} w={10} h={10} rx={2} fill="#1e1714" />
        </Base>
      );
    case 'guestroom-plain':
    case 'guestroom-hidden':
      return (
        <Base wallTop="#1e1a22" wallBottom="#120f16" floorTop="#171319" floorBottom="#0a080c">
          <Window x={38} y={6} w={18} h={22} />
          <Furniture x={6} y={30} w={28} h={16} fill="#1c1822" />
          <Furniture x={70} y={38} w={22} h={8} rx={1} fill="#181420" />
        </Base>
      );
    case 'vending-nook':
      return (
        <Base wallTop="#151a17" wallBottom="#0b0f0c" floorTop="#12140f" floorBottom="#080a06">
          <Furniture x={16} y={10} w={20} h={26} fill="#1c2420" stroke="rgba(150,200,170,0.35)" />
          <Furniture x={44} y={12} w={18} h={24} fill="#182420" stroke="rgba(150,200,170,0.35)" />
          <Glow cx={25} cy={20} r={10} color="#9fd6b8" opacity={0.2} />
          <Glow cx={53} cy={20} r={10} color="#9fd6b8" opacity={0.2} />
        </Base>
      );
    case 'laundry':
      return (
        <Base wallTop="#1a1a16" wallBottom="#0f0f0c" floorTop="#131310" floorBottom="#080806">
          <Furniture x={10} y={8} w={30} h={26} fill="#1e1e18" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={13 + i * 9} y={12} width={7} height={20} fill="#262620" />
          ))}
          <Furniture x={55} y={34} w={26} h={10} rx={2} fill="#191913" />
        </Base>
      );
    case 'housekeeping':
      return (
        <Base wallTop="#161a1a" wallBottom="#0c0f0f" floorTop="#111414" floorBottom="#070908">
          <Furniture x={54} y={8} w={24} h={26} fill="#191f1e" stroke="rgba(201,162,75,0.3)" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={56} y1={12 + i * 6} x2={76} y2={12 + i * 6} stroke="rgba(201,162,75,0.25)" strokeWidth={0.3} />
          ))}
          <Furniture x={8} y={30} w={30} h={16} fill="#161c1b" />
          <Glow cx={66} cy={16} r={12} color="#c9a24b" opacity={0.18} />
        </Base>
      );
    case 'stairwell':
      return (
        <Base wallTop="#1a1a1c" wallBottom="#0e0e10" floorTop="#131315" floorBottom="#08080a">
          <Glow cx={50} cy={8} r={14} color="#e3c078" opacity={0.4} />
          <circle cx={50} cy={6} r={1.3} fill="#e3c078" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={20 + i * 3} y={40 + i * 3.2} width={60 - i * 6} height={2.6} fill="#1e1e20" stroke="rgba(255,255,255,0.05)" strokeWidth={0.2} />
          ))}
        </Base>
      );
    case 'maintenance':
      return (
        <Base wallTop="#171613" wallBottom="#0e0d0b" floorTop="#121110" floorBottom="#070706">
          <Furniture x={10} y={12} w={18} h={24} rx={9} fill="#221c14" stroke="rgba(201,162,75,0.3)" />
          <Furniture x={50} y={6} w={30} h={14} fill="#1c1a16" stroke="rgba(201,162,75,0.25)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={54 + i * 5.5} cy={13} r={1.1} fill="#2a2620" stroke="rgba(201,162,75,0.3)" strokeWidth={0.2} />
          ))}
          <Glow cx={19} cy={20} r={12} color="#c9773f" opacity={0.18} />
        </Base>
      );
    case 'rooftop':
      return (
        <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="room-art-svg">
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c0e1c" />
              <stop offset="100%" stopColor="#1c2438" />
            </linearGradient>
            <linearGradient id="roofFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#181a1e" />
              <stop offset="100%" stopColor="#0a0b0d" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="40" fill="url(#skyGrad)" />
          <Stars />
          <Skyline y={40} />
          <rect x="0" y="40" width="100" height="20" fill="url(#roofFloor)" />
          <Glow cx={50} cy={38} r={30} color="#e3c078" opacity={0.08} />
          {[10, 24, 38, 62, 76, 90].map((x, i) => (
            <circle key={i} cx={x} cy={30} r={0.6} fill="#e3c078" opacity={0.8} />
          ))}
          <line x1={4} y1={30} x2={96} y2={30} stroke="rgba(201,162,75,0.25)" strokeWidth={0.3} />
          <rect x={12} y={44} width={26} height={10} rx={1} fill="#14171b" stroke="rgba(150,170,190,0.3)" strokeWidth={0.3} />
          <rect x={60} y={46} width={22} height={3} rx={1} fill="#1a1e22" />
        </svg>
      );
    default:
      return (
        <Base wallTop="#1a1a20" wallBottom="#0e0e12" floorTop="#131315" floorBottom="#08080a" />
      );
  }
}

export default function RoomArt({ artKey }: { artKey?: RoomArtKey }) {
  return <div className="room-art">{scene(artKey ?? 'guestroom-plain')}</div>;
}
