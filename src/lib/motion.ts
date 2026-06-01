export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export const blurIn = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      duration: 0.65,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export const scaleHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};
