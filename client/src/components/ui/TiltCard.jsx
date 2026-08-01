import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Mouse-tracked 3D tilt card with a cursor-following glow.
 * Children render inside; onClick etc. pass through.
 */
export default function TiltCard({ children, className = '', glowColor = 'rgba(16,185,129,0.22)', maxTilt = 10, ...rest }) {
  const ref = useRef(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), { stiffness: 260, damping: 22 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), { stiffness: 260, damping: 22 });
  const glowX = useTransform(px, [0, 1], ['0%', '100%']);
  const glowY = useTransform(py, [0, 1], ['0%', '100%']);

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      className={`relative ${className}`}
      {...rest}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, ${glowColor}, transparent 60%)`,
        }}
      />
      <div style={{ transform: 'translateZ(24px)' }} className="relative h-full">
        {children}
      </div>
    </motion.div>
  );
}
