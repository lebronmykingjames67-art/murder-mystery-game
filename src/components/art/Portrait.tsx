export default function Portrait({ initials, color, size = 56 }: { initials: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="portrait">
      <defs>
        <radialGradient id={`pg-${initials}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#161319" stroke="rgba(201,162,75,0.5)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="25" fill={`url(#pg-${initials})`} />
      <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(201,162,75,0.25)" strokeWidth="0.75" />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="700"
        fill="#0d0c10"
        opacity={0.85}
      >
        {initials}
      </text>
    </svg>
  );
}
