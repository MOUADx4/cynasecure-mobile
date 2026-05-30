export const motion = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  spring: {
    press: { damping: 20, stiffness: 300, mass: 0.8 },
    gentle: { damping: 18, stiffness: 180, mass: 1 },
  },
  easing: {
    out: 'easeOut' as const,
    inOut: 'easeInOut' as const,
  },
} as const;
