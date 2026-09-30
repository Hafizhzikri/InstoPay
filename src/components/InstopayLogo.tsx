interface Props { size?: number }

export function InstopayLogo({ size = 48 }: Props) {
  const id = 'ip';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main wallet body gradient — deep blue to bright blue */}
        <linearGradient id={`wbody-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3bcc" />
          <stop offset="55%" stopColor="#2455e8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        {/* Card 1 gradient — dark navy */}
        <linearGradient id={`card1-${id}`} x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#1e2d6b" />
          <stop offset="100%" stopColor="#2a4ad0" />
        </linearGradient>
        {/* Card 2 gradient — light cyan */}
        <linearGradient id={`card2-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        {/* Clasp gradient */}
        <linearGradient id={`clasp-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        {/* iP letter gradient — white to light blue */}
        <linearGradient id={`ip-${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
        {/* Wallet top highlight */}
        <linearGradient id={`top-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* ── Cards sticking out of top ── */}
      {/* Card 1 — dark, tilted left */}
      <rect
        x="22" y="18" width="38" height="22" rx="5"
        fill={`url(#card1-${id})`}
        transform="rotate(-12 41 29)"
      />
      {/* Card 2 — light cyan, tilted right */}
      <rect
        x="28" y="16" width="38" height="22" rx="5"
        fill={`url(#card2-${id})`}
        transform="rotate(6 47 27)"
      />

      {/* ── Wallet body ── */}
      <rect
        x="8" y="32" width="72" height="52" rx="12"
        fill={`url(#wbody-${id})`}
      />
      {/* top highlight sheen */}
      <rect
        x="8" y="32" width="72" height="26" rx="12"
        fill={`url(#top-${id})`}
      />

      {/* ── Clasp (right side) ── */}
      <rect
        x="72" y="50" width="16" height="16" rx="5"
        fill={`url(#clasp-${id})`}
      />
      {/* Clasp inner circle */}
      <circle cx="80" cy="58" r="4.5" fill="#1e40af" />
      <circle cx="80" cy="58" r="2.5" fill="#93c5fd" />

      {/* ── "iP" monogram ── */}
      {/* lowercase i — rounded rect + dot */}
      <rect x="22" y="47" width="8" height="24" rx="4" fill={`url(#ip-${id})`} />
      <circle cx="26" cy="43" r="4" fill={`url(#ip-${id})`} />

      {/* P — stem */}
      <rect x="33" y="47" width="8" height="24" rx="3.5" fill={`url(#ip-${id})`} />
      {/* P — bowl (right bump) */}
      <path
        d="M33 47 h10 a10 10 0 0 1 0 20 H33 Z"
        fill={`url(#ip-${id})`}
      />
      {/* P — inner cutout for bowl */}
      <path
        d="M37 51 h5 a6 6 0 0 1 0 12 H37 Z"
        fill={`url(#wbody-${id})`}
      />
    </svg>
  );
}
