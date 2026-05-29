import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

export function Loader({ label }: { label?: string }) {
  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 24, alignItems: 'center', gap: 12 },
  label: { color: colors.textMuted, fontSize: 13 },
});
