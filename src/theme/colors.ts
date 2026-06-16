export const colors = {
  background: '#080810',
  surface: '#0F0F1A',
  surfaceElevated: '#161625',
  surfaceHigh: '#1E1E30',

  text: '#F0F2FF',
  textSecondary: '#C8CCEA',
  textMuted: '#8B90B8',
  textDim: '#555878',

  primary: '#4F8EF7',
  primaryDark: '#2563EB',
  primaryLight: '#7EB3FF',
  primaryGlow: 'rgba(79,142,247,0.22)',

  accent: '#22D3EE',
  accentDim: 'rgba(34,211,238,0.12)',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  border: '#22223A',
  borderStrong: '#2E2E4A',
  borderSubtle: '#17172A',
  borderAccent: 'rgba(79,142,247,0.35)',

  overlay: 'rgba(0, 0, 0, 0.75)',
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
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  } as const,
  button: {
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  } as const,
  buttonDanger: {
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } as const,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '900' as const, lineHeight: 40, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '700' as const, lineHeight: 23 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 21 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 17 },
  mono: { fontSize: 11, fontFamily: 'Menlo', letterSpacing: 0.8 },
};
