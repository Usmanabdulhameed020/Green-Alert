import React, { useEffect, useRef } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

const PALETTE_SMOG = ['#475569', '#334155', '#64748b', '#57534e', '#78716c'];
const PALETTE_LEAF = ['#059669', '#10b981', '#34d399', '#22c55e', '#4ade80'];
const COUNT = 200;

const lerp = (a, b, t) => a + (b - a) * t;

function lerpColor(c1, c2, t) {
  const p = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const [r1, g1, b1] = p(c1);
  const [r2, g2, b2] = p(c2);
  return `rgba(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))},1)`;
}

/**
 * Pollution → Clean scroll transform.
 * A full-screen particle field: dark chaotic smog at the top of the page,
 * morphing into calm drifting emerald leaves as the user scrolls.
 */
export default function PollutionCanvas() {
  const canvasRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const progressRef = useRef(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;
    let particles = [];
    let raf = null;
    let visible = true;

    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, W * DPR);
      canvas.height = Math.max(1, H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (!particles.length) initParticles();
    };

    const initParticles = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2 + 0.4,
        size: 1 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawLeaf = (x, y, size, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = (time) => {
      if (!visible) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, Math.max(0, progressRef.current));
      ctx.clearRect(0, 0, W, H);

      particles.forEach((pt, i) => {
        const drift = Math.sin(time * 0.001 + pt.phase);
        // Smog: chaotic swirl. Leaves: calm swaying drift.
        pt.x += lerp(pt.vx * 1.8 + drift * 0.6, 0.25 + drift * 0.35, p);
        pt.y += lerp(pt.vy * 1.4, 0.55 + drift * 0.2, p);
        if (pt.x < -12) pt.x = W + 12;
        if (pt.x > W + 12) pt.x = -12;
        if (pt.y < -12) pt.y = H + 12;
        if (pt.y > H + 12) pt.y = -12;

        const colorIdx = i % PALETTE_SMOG.length;
        ctx.fillStyle = lerpColor(PALETTE_SMOG[colorIdx], PALETTE_LEAF[colorIdx], p);
        const size = pt.size * lerp(1, 1.35, p);
        const rot = (time * 0.001 + pt.phase) * (1 - p) * 1.5 + p * Math.sin(time * 0.0008 + pt.phase) * 0.8;

        if (p > 0.12) {
          drawLeaf(pt.x, pt.y, size, rot);
        } else {
          ctx.globalAlpha = 0.72;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (p > 0.5) {
          ctx.globalAlpha = 0.14;
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, size * 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => { visible = !document.hidden; };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      progressRef.current = 1;
      tick(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
}
