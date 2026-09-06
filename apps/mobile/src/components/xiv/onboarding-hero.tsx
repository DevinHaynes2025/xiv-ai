import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { BrandMark } from './brand-mark';
import { XivText } from './text';

type Props = {
  kicker?: string;
  title: string;
  support?: string;
  align?: 'start' | 'center';
  showMark?: boolean;
  markSize?: number;
};

export function OnboardingHero({
  kicker,
  title,
  support,
  align = 'start',
  showMark = true,
  markSize = 44,
}: Props) {
  const centered = align === 'center';

  return (
    <View style={[styles.wrap, centered && styles.center]}>
      {showMark ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="XIV AI">
          <BrandMark size={markSize} />
        </View>
      ) : null}
      {kicker ? (
        <XivText variant="label" color={Palette.accent} style={centered ? styles.centerText : undefined}>
          {kicker}
        </XivText>
      ) : null}
      <XivText variant="display" style={centered ? styles.centerText : undefined}>
        {title}
      </XivText>
      {support ? (
        <XivText variant="body" muted style={centered ? styles.centerText : undefined}>
          {support}
        </XivText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  center: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
