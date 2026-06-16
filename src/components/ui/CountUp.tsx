import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

interface Props {
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  style?: StyleProp<TextStyle>;
  startDelay?: number;
}

export function CountUp({
  to,
  duration = 1600,
  decimals = 0,
  suffix = '',
  prefix = '',
  style,
  startDelay = 400,
}: Props) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for a snappy finish
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(to * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(to);
      }
    };

    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [to, duration, startDelay]);

  const display =
    decimals > 0
      ? value.toFixed(decimals).replace('.', ',')
      : Math.round(value).toString();

  return (
    <Text style={style}>
      {prefix}{display}{suffix}
    </Text>
  );
}
