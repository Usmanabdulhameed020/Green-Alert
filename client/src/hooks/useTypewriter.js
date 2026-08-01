import { useState, useEffect, useRef } from 'react';

/**
 * Typewriter effect — types the target text char-by-char.
 * Returns { output, done }. Trigger once via `start`.
 */
export function useTypewriter(targetText, { start = false, speed = 55, delay = 0 } = {}) {
  const [output, setOutput] = useState('');
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    let index = 0;
    let interval = null;

    const tick = () => {
      index += 1;
      setOutput(targetText.slice(0, index));
      if (index >= targetText.length) {
        clearInterval(interval);
        setDone(true);
      }
    };

    const timeout = setTimeout(() => {
      interval = setInterval(tick, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [start, targetText, speed, delay]);

  return { output, done };
}
