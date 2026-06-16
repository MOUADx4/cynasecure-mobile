import React, { useCallback } from 'react';
import { Dimensions, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  children: React.ReactNode;
  scrollY: SharedValue<number>;
  delay?: number;
  fromY?: number;
  threshold?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScrollReveal({
  children,
  scrollY,
  delay = 0,
  fromY = 36,
  threshold = 80,
  style,
}: Props) {
  const opacity    = useSharedValue(0);
  const transY     = useSharedValue(fromY);
  const triggered  = useSharedValue(false);
  const elementY   = useSharedValue(-1);

  const animate = useCallback(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 480 }));
    transY.value  = withDelay(delay, withTiming(0, { duration: 480 }));
  }, [delay]);

  useAnimatedReaction(
    () => scrollY.value,
    (scroll) => {
      if (!triggered.value && elementY.value >= 0) {
        if (scroll + SCREEN_H > elementY.value + threshold) {
          triggered.value = true;
          runOnJS(animate)();
        }
      }
    },
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const y = e.nativeEvent.layout.y;
      elementY.value = y;
      if (scrollY.value + SCREEN_H > y + threshold) {
        triggered.value = true;
        animate();
      }
    },
    [animate, threshold],
  );

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: transY.value }],
  }));

  return (
    <Animated.View onLayout={onLayout} style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
}
