import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius } from '../../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
};

export function Input({ label, error, hint, style, leftIcon, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const progress = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(79, 142, 247, ${progress.value})`,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(79, 142, 247, ${progress.value * 0.05})`,
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
        <Animated.View style={animatedBgStyle} />
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.textDim}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            progress.value = withTiming(1, { duration: 180 });
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            progress.value = withTiming(0, { duration: 180 });
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            leftIcon ? styles.inputWithIcon : undefined,
            error ? styles.errored : undefined,
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
  wrapper: { gap: 7 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    borderRadius: radius.lg,
  },
  inputWithIcon: {
    paddingLeft: 46,
  },
  errored: { borderColor: colors.danger },
  hint: { color: colors.textDim, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12 },
});
