import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';

/**
 * Reusable leaf-particle burst.
 * Fires `count` leaves outward from the center of its (relative) parent.
 * Renders nothing until `fire` is true; removes itself after the animation.
 */
export default function LeafBurst({ fire, count = 14, size = 'md', onDone }) {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (!fire) return;
    const raf = requestAnimationFrame(() => {
      setLeaves(
        Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
          const distance = 90 + Math.random() * 130;
          return {
            id: i,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 40,
            rotate: (Math.random() - 0.5) * 540,
            delay: Math.random() * 0.15,
            duration: 1.1 + Math.random() * 0.6,
            opacity: 0.85 + Math.random() * 0.15,
          };
        })
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [fire, count]);

  const sizeMap = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };
  const iconSize = { sm: 14, md: 18, lg: 24 };

  if (!fire) return null;

  return (
    <AnimatePresence onExitComplete={onDone}>
      <div className="pointer-events-none absolute inset-0 overflow-visible z-20">
        {leaves.map((leaf) => (
          <motion.span
            key={leaf.id}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
            animate={{
              opacity: [0, leaf.opacity, 0],
              x: leaf.x,
              y: leaf.y,
              scale: [0.4, 1, 0.85],
              rotate: leaf.rotate,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: leaf.duration, delay: leaf.delay, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2"
          >
            <span className={`ga-leaf-float block ${sizeMap[size]}`} style={{ animationDelay: `${leaf.delay}s` }}>
              <Leaf style={{ width: iconSize[size], height: iconSize[size] }} className="text-emerald-500" fill="currentColor" strokeWidth={0.5} />
            </span>
          </motion.span>
        ))}
      </div>
    </AnimatePresence>
  );
}
