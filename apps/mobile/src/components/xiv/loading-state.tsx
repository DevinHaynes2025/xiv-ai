import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  label?: string;
  lines?: number;
};

export function LoadingState({ label = 'Loading', lines = 3 }: Props) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.wrap}>
      {Array.from({ length: lines }, (_, index) => (
        <Animated.View key={index} style={[styles.bar, index === lines - 1 && styles.short, pulse]} />
      ))}
      <XivText variant="caption" muted>
        {label}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.glass,
  },
  bar: {
    height: 10,
    borderRadius: Radius.sm,
    backgroundColor: Palette.navySoft,
  },
  short: {
    width: '62%',
  },
});
