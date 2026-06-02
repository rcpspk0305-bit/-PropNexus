// ============================================================
// PropNexus — Framer Motion Variant Library
// All animation variants in one place for consistency & reuse.
// ============================================================

// --- Fade In Up (general purpose) ---
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      delay: custom,
    },
  }),
};

// --- Stagger container for property cards ---
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// --- Individual card child variant (used inside stagger) ---
export const staggerChild = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// --- Card hover (spring-based) ---
export const cardHover = {
  scale: 1.03,
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};

// --- Slide in from left (filters sidebar) ---
export const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// --- Pop-in with spring (badges) ---
export const popIn = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      mass: 0.8,
    },
  },
};

// --- Dropdown container ---
export const dropdownContainer = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: { duration: 0.3, ease: 'easeOut' },
      opacity: { duration: 0.2, ease: 'easeOut' },
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.25, ease: 'easeIn' },
      opacity: { duration: 0.15, ease: 'easeIn' },
    },
  },
};

// --- Dropdown item ---
export const dropdownItem = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// --- Button tap (bedroom filters) ---
export const buttonTap = { scale: 0.95 };
export const buttonHover = { scale: 1.05 };

// --- Chat window entry/exit ---
export const chatWindow = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// --- Scroll-to-top button ---
export const scrollTopButton = {
  hidden: { opacity: 0, scale: 0.5, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    y: 20,
    transition: { duration: 0.2 },
  },
};
