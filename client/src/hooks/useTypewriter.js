import { useState, useEffect, useRef } from 'react';

/**
 * useTypewriterLoop — types each phrase in sequence, holds, then
 * deletes them all and repeats forever.
 * Returns { output, active } where `output` is an array of per-line
 * strings and `active` is the index of the line currently typing/deleting.
 */
export function useTypewriterLoop(lines, { start = false, typeSpeed = 45, deleteSpeed = 22, hold = 1600 } = {}) {
  const [output, setOutput] = useState(() => lines.map(() => ''));
  const [active, setActive] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const timers = [];

    const wait = (ms) =>
      new Promise((resolve) => {
        const t = setTimeout(resolve, ms);
        timers.push(t);
      });

    const setLine = (li, text) => {
      if (cancelled) return;
      setOutput((prev) => prev.map((t, idx) => (idx === li ? text : t)));
    };

    const typeLine = async (li) => {
      setActive(li);
      for (let i = 1; i <= lines[li].length; i++) {
        setLine(li, lines[li].slice(0, i));
        await wait(typeSpeed);
      }
    };

    const deleteLine = async (li) => {
      setActive(li);
      for (let i = lines[li].length - 1; i >= 0; i--) {
        setLine(li, lines[li].slice(0, i));
        await wait(deleteSpeed);
      }
    };

    const run = async () => {
      while (!cancelled) {
        for (let li = 0; li < lines.length; li++) {
          await typeLine(li);
          if (cancelled) return;
          await wait(hold);
        }
        for (let li = lines.length - 1; li >= 0; li--) {
          await deleteLine(li);
          if (cancelled) return;
          await wait(hold * 0.6);
        }
        await wait(250);
      }
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [start, lines, typeSpeed, deleteSpeed, hold]);

  return { output, active };
}
