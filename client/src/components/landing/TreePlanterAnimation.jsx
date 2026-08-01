import React, { useMemo, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * TreePlanterAnimation — a gardener walks in carrying a sapling,
 * plants it, and the sapling grows into a full tree before the loop
 * resets. Loop starts when scrolled into view; freezes for
 * prefers-reduced-motion. Built for the dark CTA section.
 */
export default function TreePlanterAnimation() {
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
      aria-label="Animation of a gardener planting a sapling that grows into a tree"
    >
      <defs>
        <linearGradient id="tpa-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="0" y="204" width="360" height="36" fill="url(#tpa-ground)" />
      <line x1="0" y1="206" x2="360" y2="206" stroke="#10b981" strokeWidth="2" opacity="0.5" />

      {/* Grass tufts */}
      <path d="M30 204 l3 -9 l3 9 M50 204 l3 -8 l3 8" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M300 204 l3 -9 l3 9 M318 204 l3 -8 l3 8" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Mound + hole */}
      <ellipse cx="165" cy="204" rx="26" ry="8" fill="#065f46" />
      <ellipse cx="165" cy="204" rx="13" ry="4.5" fill="#022c22" />

      {/* Shovel */}
      <line x1="146" y1="205" x2="138" y2="172" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="143" y="164" width="8" height="10" rx="3" fill="#a16207" transform="rotate(18 147 169)" />

      {/* Floating petals */}
      <ellipse className={anim('tpa-petal')} cx="120" cy="90" rx="4" ry="2.5" fill="#6ee7b7" style={{ animationDelay: '0s' }} />
      <ellipse className={anim('tpa-petal')} cx="218" cy="70" rx="4" ry="2.5" fill="#a7f3d0" style={{ animationDelay: '1.5s' }} />

      {/* Growing tree */}
      <g className={anim('tpa-trunk')} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
        <rect x="159" y="138" width="12" height="66" rx="5" fill="#059669" />
        <path d="M159 168 l-10 -22 M171 168 l10 -22 M162 148 l-7 -12 M168 148 l7 -12" stroke="#047857" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g className={anim('tpa-leaves')} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <circle cx="165" cy="112" r="17" fill="#34d399" />
        <circle cx="147" cy="128" r="12" fill="#10b981" />
        <circle cx="183" cy="130" r="12" fill="#6ee7b7" />
        <circle cx="165" cy="134" r="10" fill="#a7f3d0" />
      </g>

      {/* Worker */}
      <g className={anim('tpa-person')}>
        <g className={anim('tpa-bob')}>
          {/* Legs */}
          <line x1="0" y1="168" x2="-8" y2="200" stroke="#065f46" strokeWidth="6" strokeLinecap="round" />
          <line x1="0" y1="168" x2="8" y2="200" stroke="#065f46" strokeWidth="6" strokeLinecap="round" />
          <circle cx="-8" cy="200" r="4" fill="#334155" />
          <circle cx="8" cy="200" r="4" fill="#334155" />

          {/* Torso */}
          <rect x="-13" y="134" width="26" height="34" rx="11" fill="#34d399" />

          {/* Head + cap */}
          <circle cx="0" cy="116" r="12" fill="#fcd34d" />
          <rect x="-14" y="103" width="28" height="6" rx="3" fill="#f59e0b" />
          <path d="M-10 104 a10 9 0 0 1 20 0 z" fill="#d97706" />

          {/* Arm (pivots at shoulder) */}
          <g className={anim('tpa-arm')}>
            <line x1="0" y1="142" x2="26" y2="138" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />
          </g>
        </g>

        {/* Carried sapling */}
        <g className={anim('tpa-sapling')}>
          <line x1="0" y1="142" x2="4" y2="120" stroke="#059669" strokeWidth="3" />
          <ellipse cx="7" cy="118" rx="6" ry="3.5" fill="#34d399" />
          <ellipse cx="1" cy="124" rx="5" ry="3" fill="#6ee7b7" />
        </g>
      </g>
    </svg>
  );
}
