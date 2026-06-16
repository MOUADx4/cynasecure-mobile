import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme/colors';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

function BadgeComponent({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.box, tones[tone].box]}>
      <Text style={[styles.text, tones[tone].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

const tones: Record<Tone, { box: any; text: any }> = {
  default: {
    box: { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong },
    text: { color: colors.textMuted },
  },
  primary: {
    box: { backgroundColor: 'rgba(79,142,247,0.12)', borderColor: 'rgba(79,142,247,0.28)' },
    text: { color: colors.primaryLight },
  },
  success: {
    box: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.28)' },
    text: { color: colors.success },
  },
  warning: {
    box: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.28)' },
    text: { color: colors.warning },
  },
  danger: {
    box: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.28)' },
    text: { color: colors.danger },
  },
  info: {
    box: { backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)' },
    text: { color: colors.accent },
  },
};

export const Badge = React.memo(BadgeComponent);
