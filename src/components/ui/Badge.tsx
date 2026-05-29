import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme/colors';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.box, tones[tone].box]}>
      <Text style={[styles.text, tones[tone].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});

const tones: Record<Tone, { box: any; text: any }> = {
  default: {
    box: { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
    text: { color: colors.textMuted },
  },
  primary: {
    box: { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' },
    text: { color: colors.primary },
  },
  success: {
    box: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' },
    text: { color: colors.success },
  },
  warning: {
    box: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' },
    text: { color: colors.warning },
  },
  danger: {
    box: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
    text: { color: colors.danger },
  },
  info: {
    box: { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' },
    text: { color: colors.primaryLight },
  },
};
