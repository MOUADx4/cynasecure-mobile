import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { colors, radius } from '../../theme/colors';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastOptions = { duration?: number };
type ToastItem = { id: number; message: string; variant: ToastVariant; duration: number };
type ContextType = { toast: (message: string, variant?: ToastVariant, opts?: ToastOptions) => void };

export const ToastContext = createContext<ContextType>({ toast: () => {} });

let nextId = 0;

const cfg: Record<ToastVariant, { Icon: React.ElementType; color: string; leftBorder: string }> = {
  success: { Icon: CheckCircle,   color: colors.success, leftBorder: 'rgba(16,185,129,0.6)' },
  error:   { Icon: AlertCircle,   color: colors.danger,  leftBorder: 'rgba(239,68,68,0.6)' },
  warning: { Icon: AlertTriangle, color: colors.warning, leftBorder: 'rgba(245,158,11,0.6)' },
  info:    { Icon: Info,          color: colors.primary, leftBorder: 'rgba(59,130,246,0.6)' },
};

function ToastItem({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(opacity, {
      toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(() => onDone(item.id));
  }, [item.id, onDone, opacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => { timer.current = setTimeout(dismiss, item.duration); });

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && timer.current) { clearTimeout(timer.current); timer.current = null; }
    });
    return () => { if (timer.current) clearTimeout(timer.current); sub.remove(); };
  }, []);

  const { Icon, color, leftBorder } = cfg[item.variant];
  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }], borderLeftColor: leftBorder }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon color={color} size={18} />
      <Text style={styles.msg} numberOfLines={3}>{item.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const toast = useCallback((message: string, variant: ToastVariant = 'info', opts: ToastOptions = {}) => {
    const id = ++nextId;
    setToasts((prev) => [...prev.slice(-2), { id, message, variant, duration: opts.duration ?? 3000 }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <View style={{ flex: 1 }}>
        {children}
        <View style={[styles.container, { top: insets.top + 16 }]} pointerEvents="none">
          {toasts.map((t) => <ToastItem key={t.id} item={t} onDone={remove} />)}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  msg: { flex: 1, color: colors.text, fontSize: 14 },
});
