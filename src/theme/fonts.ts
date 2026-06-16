export const Font = {
  light:     'PlusJakartaSans_300Light',
  regular:   'PlusJakartaSans_400Regular',
  medium:    'PlusJakartaSans_500Medium',
  semiBold:  'PlusJakartaSans_600SemiBold',
  bold:      'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

const W_MAP: Record<string, string> = {
  '300': 'PlusJakartaSans_300Light',
  light: 'PlusJakartaSans_300Light',
  '400': 'PlusJakartaSans_400Regular',
  normal: 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  bold: 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
};

export function jakartaFamily(weight: string): string {
  return W_MAP[weight] ?? 'PlusJakartaSans_400Regular';
}
