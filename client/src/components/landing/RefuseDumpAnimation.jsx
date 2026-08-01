import React, { useMemo } from 'react';

/**
 * RefuseDumpAnimation — a continuous looping character scene:
 * a worker walks in, tosses a trash bag into a recycling bin,
 * the bin wiggles, and the worker walks out (loop repeats seamlessly).
 * Pure SVG + CSS keyframes; freezes for prefers-reduced-motion.
 */
export default function RefuseDumpAnimation() {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const anim = (cls) => (reduced ? '' : cls);
  const animLeaf = (cls) => (reduced ? '' : cls);

  return (
    <svg
      viewBox="0 0 320 240"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Animation of a worker tossing a trash bag into a recycling bin"
    >
      <defs>
        <linearGradient id="rda-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="0" y="196" width="320" height="44" fill="url(#rda-ground)" />
      <line x1="0" y1="198" x2="320" y2="198" stroke="#a7f3d0" strokeWidth="2" />

      {/* Bushes */}
      <circle cx="36" cy="200" r="14" fill="#a7f3d0" />
      <circle cx="58" cy="204" r="10" fill="#86efac" />
      <circle cx="292" cy="202" r="12" fill="#a7f3d0" />
      <circle cx="308" cy="206" r="8" fill="#6ee7b7" />

      {/* Floating leaves */}
      <ellipse className={animLeaf('rda-leaf')} cx="70" cy="70" rx="5" ry="3" fill="#34d399" style={{ animationDelay: '0s' }} />
      <ellipse className={animLeaf('rda-leaf')} cx="152" cy="40" rx="4" ry="2.5" fill="#10b981" style={{ animationDelay: '1.2s' }} />
      <ellipse className={animLeaf('rda-leaf')} cx="252" cy="62" rx="5" ry="3" fill="#6ee7b7" style={{ animationDelay: '2.1s' }} />

      {/* Recycling bin */}
      <g className={anim('rda-bin')}>
        <rect x="212" y="130" width="56" height="70" rx="8" fill="#059669" />
        <rect x="212" y="176" width="56" height="8" fill="#047857" opacity="0.45" />
        <path d="M228 140 l8 -14 l8 14 z M236 140 l-4 -8 M244 140 l-4 -8" stroke="#a7f3d0" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="206" y="120" width="68" height="12" rx="6" fill="#047857" />
        <rect x="206" y="120" width="68" height="5" rx="3" fill="#065f46" opacity="0.5" />
        <circle cx="224" cy="200" r="8" fill="#0f172a" />
        <circle cx="256" cy="200" r="8" fill="#0f172a" />
      </g>

      {/* Dust puff at bin mouth */}
      <g className={anim('rda-puff')}>
        <circle cx="240" cy="124" r="6" fill="#d1fae5" />
      </g>
      <g className={anim('rda-puff')} style={{ animationDelay: '0.09s' }}>
        <circle cx="244" cy="126" r="4.5" fill="#a7f3d0" />
      </g>

      {/* Worker */}
      <g className={anim('rda-person')}>
        <g className={anim('rda-bob')}>
          {/* Legs */}
          <line className={anim('rda-leg-l')} x1="0" y1="168" x2="-7" y2="200" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
          <line className={anim('rda-leg-r')} x1="0" y1="168" x2="7" y2="200" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
          {/* Boots */}
          <circle cx="-7" cy="200" r="4" fill="#0f172a" />
          <circle cx="7" cy="200" r="4" fill="#0f172a" />

          {/* Torso */}
          <rect x="-13" y="134" width="26" height="34" rx="11" fill="#059669" />

          {/* Head */}
          <circle cx="0" cy="116" r="12" fill="#fcd34d" />
          {/* Cap */}
          <rect x="-14" y="103" width="28" height="6" rx="3" fill="#f59e0b" />
          <path d="M-10 104 a10 9 0 0 1 20 0 z" fill="#d97706" />

          {/* Arm (pivots at shoulder) */}
          <g className={anim('rda-arm')}>
            <line x1="0" y1="142" x2="26" y2="138" stroke="#047857" strokeWidth="5.5" strokeLinecap="round" />
          </g>

          {/* Trash bag (sibling of arm so its flight arc is exact) */}
          <g className={anim('rda-bag')}>
            <rect x="26" y="136" width="15" height="21" rx="5" fill="#57534e" />
            <path d="M26 142 l15 0" stroke="#374151" strokeWidth="2" />
            <path d="M33 136 l0 -4 l4 0 l0 4" fill="none" stroke="#374151" strokeWidth="2" />
          </g>
        </g>
      </g>
    </svg>
  );
}
