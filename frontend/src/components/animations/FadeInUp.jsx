import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * <FadeInUp> — reusable viewport-triggered fade-in + slide-up wrapper.
 *
 * Props:
 *   delay     — animation delay in seconds (default 0)
 *   duration  — animation duration in seconds (default 0.6)
 *   y         — initial y-offset in px (default 30)
 *   className — passthrough CSS classes
 *   once      — only animate once (default true)
 *   children  — content to animate
 */
export default function FadeInUp({
  children,
  delay = 0,
  duration = 0.6,
  y = 30,
  className = '',
  once = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
