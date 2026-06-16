import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows } from '../../theme/colors';

type Props = ViewProps & {
  padded?: boolean;
  elevated?: boolean;
  accent?: boolean;
};

export function Card({ padded = true, elevated = false, accent = false, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadows.card,
        accent && styles.accent,
        style,
      ]}
      {...rest}
    >
      {accent && <View style={styles.accentLine} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  padded: { padding: 16 },
  elevated: {},
  accent: {
    borderColor: colors.borderAccent,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
});
