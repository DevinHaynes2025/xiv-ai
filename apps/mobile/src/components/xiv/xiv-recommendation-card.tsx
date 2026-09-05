import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { DEMO_MARK } from '@/data/operating-system';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  recommends: string;
  ifWeAct: string;
};

export function XivRecommendationCard({ recommends, ifWeAct }: Props) {
  return (
    <Card variant="action" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Recommends
        </XivText>
        <SampleMark text={DEMO_MARK} />
      </View>
      <XivText variant="subtitle">{recommends}</XivText>
      <XivText variant="label" color={Palette.success}>
        If we act
      </XivText>
      <XivText variant="body" muted>
        {ifWeAct}
      </XivText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
