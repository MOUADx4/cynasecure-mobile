export const colors = {
  background: '#0B0B0D',
  surface: '#111113',
  surfaceElevated: '#1A1A1D',
  surfaceHigh: '#252528',

  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',

  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  border: '#2D2D31',
  borderStrong: '#3A3A3F',
  borderSubtle: '#1F1F22',

  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  } as const,
  button: {
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } as const,
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '900' as const, lineHeight: 38 },
  h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '700' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  mono: { fontSize: 11, fontFamily: 'Menlo', letterSpacing: 1 },
};
