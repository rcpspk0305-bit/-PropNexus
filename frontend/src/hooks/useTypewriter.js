import { useState, useEffect, useRef } from 'react';

const DEFAULT_PHRASES = [
  '"3BHK near good schools in Hyderabad under 2Cr"',
  '"2BHK apartment in Gachibowli with gym"',
  '"Villa in Jubilee Hills under 5Cr"',
  '"1BHK flat in Kondapur for rent under 20k"',
];

/**
 * useTypewriter — cycles through phrases with char-by-char type & delete.
 *
 * @param {string[]} phrases   – Array of strings to cycle through
 * @param {number}   charDelay – Ms per character typed (default 55)
 * @param {number}   pauseMs   – Ms to wait after full phrase (default 2200)
 * @returns {string} Current display text (for use as placeholder)
 */
export function useTypewriter(phrases = DEFAULT_PHRASES, charDelay = 55, pauseMs = 2200) {
  const [displayText, setDisplayText] = useState('');
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const isDeleting = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const current = phrases[phraseIdx.current];

      if (!isDeleting.current) {
        charIdx.current++;
        setDisplayText(current.slice(0, charIdx.current));

        if (charIdx.current === current.length) {
          isDeleting.current = true;
          timeoutRef.current = setTimeout(tick, pauseMs);
          return;
        }
      } else {
        charIdx.current--;
        setDisplayText(current.slice(0, charIdx.current));

        if (charIdx.current === 0) {
          isDeleting.current = false;
          phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
          timeoutRef.current = setTimeout(tick, 400);
          return;
        }
      }

      timeoutRef.current = setTimeout(tick, isDeleting.current ? 30 : charDelay);
    };

    timeoutRef.current = setTimeout(tick, 600);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phrases, charDelay, pauseMs]);

  return displayText;
}
