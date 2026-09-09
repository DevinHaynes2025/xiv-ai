import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { useCompactLayout } from '@/hooks/use-compact-layout';

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
  const { compact } = useCompactLayout();
  const centered = align === 'center';
  const resolvedMark = compact ? Math.min(markSize, 36) : markSize;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, centered && styles.center]}>
      {showMark ? (
        <View accessible accessibilityRole="image" accessibilityLabel="XIV AI">
          <BrandMark size={resolvedMark} />
        </View>
      ) : null}
      {kicker ? (
        <XivText variant="label" color={Palette.accent} style={centered ? styles.centerText : undefined}>
          {kicker}
        </XivText>
      ) : null}
      <XivText
        variant="display"
        maxFontSizeMultiplier={1.15}
        style={[compact ? styles.titleCompact : styles.title, centered && styles.centerText]}>
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
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  wrapCompact: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  center: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
});
