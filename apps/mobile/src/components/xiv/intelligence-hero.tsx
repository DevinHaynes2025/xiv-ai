import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Shadows, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  score: number;
  label?: string;
  brief: string;
  risk: string;
  opportunity: string;
  sample?: boolean;
};

export function IntelligenceHero({
  score,
  label = 'Business Health',
  brief,
  risk,
  opportunity,
  sample,
}: Props) {
  return (
    <Card variant="hero" style={styles.card}>
      <View style={styles.top}>
        <View style={styles.gauge}>
          <View style={styles.ringOuter}>
            <View style={styles.ring}>
              <XivText variant="display" color={Palette.white} style={styles.score}>
                {score}
              </XivText>
            </View>
          </View>
          <XivText variant="label" color={Palette.accent}>
            {label}
          </XivText>
        </View>
        <View style={styles.brief}>
          <View style={styles.head}>
            <XivText variant="label" color={Palette.intelligence}>
              Story
            </XivText>
            {sample ? <SampleMark /> : null}
          </View>
          <XivText variant="subtitle" numberOfLines={2}>
            {brief}
          </XivText>
        </View>
      </View>
      <View style={styles.signals}>
        <View style={[styles.signal, styles.risk]}>
          <XivText variant="label" color={Palette.warning}>
            Risk
          </XivText>
          <XivText variant="caption" muted numberOfLines={2}>
            {risk}
          </XivText>
        </View>
        <View style={[styles.signal, styles.opportunity]}>
          <XivText variant="label" color={Palette.success}>
            Opportunity
          </XivText>
          <XivText variant="caption" muted numberOfLines={2}>
            {opportunity}
          </XivText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  gauge: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  ringOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(42, 185, 243, 0.22)',
    backgroundColor: 'rgba(1, 24, 39, 0.55)',
  },
  ring: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Palette.accent,
    backgroundColor: Palette.navyDeep,
    ...Shadows.glow,
  },
  score: {
    fontSize: 32,
    lineHeight: 36,
  },
  brief: {
    flex: 1,
    gap: Spacing.one,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  signals: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  signal: {
    flex: 1,
    gap: 4,
    padding: Spacing.two,
    borderRadius: Radius.md,
    backgroundColor: Palette.navyDeep,
    borderWidth: StyleSheet.hairlineWidth,
  },
  risk: {
    borderColor: 'rgba(241, 197, 75, 0.35)',
  },
  opportunity: {
    borderColor: 'rgba(37, 229, 188, 0.28)',
  },
});
