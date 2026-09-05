import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { DEMO_MARK } from '@/data/operating-system';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Stage = {
  id: string;
  stage: string;
  value: string;
  weight: number;
};

type Props = {
  stages: Stage[];
};

export function PipelineCard({ stages }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Pipeline
        </XivText>
        <SampleMark text={DEMO_MARK} />
      </View>
      {stages.map((item) => (
        <View key={item.id} style={styles.stage}>
          <View style={[styles.bar, { flex: item.weight }]} />
          <XivText variant="caption" muted>
            {item.stage} · {item.value}
          </XivText>
        </View>
      ))}
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
  stage: {
    gap: 6,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.accent,
    minWidth: 24,
  },
});
