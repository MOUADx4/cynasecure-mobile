import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius } from '../../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const borderOpacity = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(59, 130, 246, ${borderOpacity.value})`,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  }));

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          placeholderTextColor={colors.textDim}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            borderOpacity.value = withTiming(1, { duration: 150 });
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            borderOpacity.value = withTiming(0, { duration: 150 });
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            error && styles.errored,
            style,
          ]}
        />
        {!error && <Animated.View style={animatedBorderStyle} />}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    borderRadius: radius.lg,
  },
  errored: { borderColor: colors.danger },
  hint: { color: colors.textDim, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12 },
});
