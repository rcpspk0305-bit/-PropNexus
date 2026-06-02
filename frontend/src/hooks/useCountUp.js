import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp — animate a number from 0 → target over `duration` ms.
 * Uses setInterval at ~16ms (60fps) for smooth counting.
 *
 * @param {number} target   – The final number to count to
 * @param {number} duration – Animation duration in ms (default 1000)
 * @returns {number} The current animated value (integer)
 */
export function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + diff * eased);
      setValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    let rafId = requestAnimationFrame(tick);
    prevTarget.current = target;

    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}
