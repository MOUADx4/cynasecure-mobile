import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: object;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  icon,
  style,
  accessibilityLabel,
}: Props) {
  const disabledFinal = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabledFinal}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: disabledFinal, busy: loading }}
        style={({ pressed }) => [
          fullWidth && styles.fullWidth,
          disabledFinal && styles.disabled,
          pressed && !disabledFinal && styles.pressed,
          style,
        ]}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={pressed && !disabledFinal
              ? ['#1D5BD4', '#3B82F6']
              : ['#2563EB', '#4F8EF7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.base,
              sizeStyles[size].container,
              !disabledFinal && shadows.button,
              { borderRadius: radius.lg },
            ]}
          >
            <View style={styles.inner}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  {icon}
                  <Text style={[styles.label, { color: '#fff', fontWeight: '700' }, sizeStyles[size].label]}>
                    {label}
                  </Text>
                </>
              )}
            </View>
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabledFinal}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabledFinal, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size].container,
        variantStyles[variant].container,
        variant === 'danger' && !disabledFinal && shadows.buttonDanger,
        fullWidth && styles.fullWidth,
        disabledFinal && styles.disabled,
        pressed && !disabledFinal && styles.pressed,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={variantStyles[variant].label.color} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, variantStyles[variant].label, sizeStyles[size].label]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.975 }],
  },
});

const sizeStyles: Record<Size, { container: { height: number; paddingHorizontal: number }; label: { fontSize: number } }> = {
  sm: { container: { height: 40, paddingHorizontal: 14 }, label: { fontSize: 13 } },
  md: { container: { height: 50, paddingHorizontal: 22 }, label: { fontSize: 14 } },
  lg: { container: { height: 54, paddingHorizontal: 26 }, label: { fontSize: 15 } },
};

const variantStyles: Record<Exclude<Variant, 'primary'>, { container: any; label: { color: string } }> = {
  secondary: {
    container: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderStrong },
    label: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderStrong },
    label: { color: colors.text },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    label: { color: '#FFFFFF' },
  },
};
