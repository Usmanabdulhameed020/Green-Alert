import React, { useMemo, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * RecyclingSorterAnimation — a worker sorts recyclables into three
 * colored bins: bottle → green, paper → blue, jar → amber.
 * Loop starts when scrolled into view; freezes for prefers-reduced-motion.
 */
export default function RecyclingSorterAnimation() {
  const ref = useRef(null);
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const play = inView && !reduced;
  const anim = (cls) => (play ? cls : '');

  return (
    <svg
      ref={ref}
      viewBox="0 0 360 240"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Animation of a worker sorting recyclables into three colored bins"
    >
      <defs>
        <linearGradient id="rsa-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="0" y="196" width="360" height="44" fill="url(#rsa-ground)" />
      <line x1="0" y1="198" x2="360" y2="198" stroke="#a7f3d0" strokeWidth="2" />

      {/* Bushes */}
      <circle cx="52" cy="200" r="13" fill="#a7f3d0" />
      <circle cx="72" cy="203" r="9" fill="#86efac" />
      <circle cx="330" cy="202" r="11" fill="#a7f3d0" />
      <circle cx="345" cy="205" r="7" fill="#6ee7b7" />

      {/* Bin 1 — Green */}
      <g className={anim('rsa-bin')} style={{ animationDelay: '1.3s', transformOrigin: '225px 200px' }}>
        <rect x="210" y="128" width="30" height="48" rx="5" fill="#059669" />
        <rect x="210" y="164" width="30" height="7" fill="#047857" opacity="0.45" />
        <circle cx="225" cy="147" r="8" fill="none" stroke="#a7f3d0" strokeWidth="2.5" />
        <path d="M225 142 l3 5 l-3 5 l-3 -5 z" fill="#a7f3d0" />
      </g>

      {/* Bin 2 — Blue */}
      <g className={anim('rsa-bin')} style={{ animationDelay: '3.25s', transformOrigin: '267px 200px' }}>
        <rect x="252" y="128" width="30" height="48" rx="5" fill="#2563eb" />
        <rect x="252" y="164" width="30" height="7" fill="#1d4ed8" opacity="0.45" />
        <circle cx="267" cy="147" r="8" fill="none" stroke="#bfdbfe" strokeWidth="2.5" />
        <path d="M267 142 l3 5 l-3 5 l-3 -5 z" fill="#bfdbfe" />
      </g>

      {/* Bin 3 — Amber */}
      <g className={anim('rsa-bin')} style={{ animationDelay: '5.33s', transformOrigin: '309px 200px' }}>
        <rect x="294" y="128" width="30" height="48" rx="5" fill="#d97706" />
        <rect x="294" y="164" width="30" height="7" fill="#b45309" opacity="0.45" />
        <circle cx="309" cy="147" r="8" fill="none" stroke="#fde68a" strokeWidth="2.5" />
        <path d="M309 142 l3 5 l-3 5 l-3 -5 z" fill="#fde68a" />
      </g>

      {/* Dust puffs at bin mouths */}
      <g className={anim('rsa-puff')} style={{ animationDelay: '1.3s' }}>
        <circle cx="225" cy="126" r="5" fill="#d1fae5" />
      </g>
      <g className={anim('rsa-puff')} style={{ animationDelay: '3.25s' }}>
        <circle cx="267" cy="126" r="5" fill="#bfdbfe" />
      </g>
      <g className={anim('rsa-puff')} style={{ animationDelay: '5.33s' }}>
        <circle cx="309" cy="126" r="5" fill="#fde68a" />
      </g>

      {/* Worker */}
      <g className={anim('rsa-bob')}>
        {/* Legs */}
        <line x1="0" y1="168" x2="-8" y2="200" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        <line x1="0" y1="168" x2="8" y2="200" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        <circle cx="-8" cy="200" r="4" fill="#0f172a" />
        <circle cx="8" cy="200" r="4" fill="#0f172a" />

        {/* Torso */}
        <rect x="-13" y="134" width="26" height="34" rx="11" fill="#059669" />

        {/* Head + cap */}
        <circle cx="0" cy="116" r="12" fill="#fcd34d" />
        <rect x="-14" y="103" width="28" height="6" rx="3" fill="#f59e0b" />
        <path d="M-10 104 a10 9 0 0 1 20 0 z" fill="#d97706" />

        {/* Arm (pivots at shoulder) */}
        <g className={anim('rsa-arm')}>
          <line x1="0" y1="142" x2="26" y2="138" stroke="#047857" strokeWidth="5.5" strokeLinecap="round" />
        </g>

        {/* Items (siblings of arm so arcs are exact) */}
        <g className={anim('rsa-item-1')}>
          <rect x="26" y="134" width="9" height="21" rx="3" fill="#6ee7b7" />
          <rect x="28" y="130" width="5" height="6" rx="2" fill="#10b981" />
        </g>
        <g className={anim('rsa-item-2')}>
          <circle cx="33" cy="145" r="7.5" fill="#e2e8f0" />
          <path d="M28 141 a7 7 0 0 1 10 6" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
        </g>
        <g className={anim('rsa-item-3')}>
          <rect x="26" y="136" width="14" height="18" rx="3.5" fill="#fbbf24" />
          <rect x="26" y="130" width="14" height="6" rx="2" fill="#b45309" />
        </g>
      </g>
    </svg>
  );
}
