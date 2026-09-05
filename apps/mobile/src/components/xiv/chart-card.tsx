import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  title: string;
  value: string;
  detail?: string;
  series?: number[];
  sample?: boolean;
};

export function ChartCard({ title, value, detail, series, sample }: Props) {
  const max = series?.length ? Math.max(...series, 1) : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <XivText variant="caption" muted numberOfLines={1}>
          {title}
        </XivText>
        {sample ? <SampleMark /> : null}
      </View>
      <XivText variant="title">{value}</XivText>
      {series?.length ? (
        <View accessibilityRole="image" accessibilityLabel={`${title} trend`} style={styles.spark}>
          {series.map((point, index) => (
            <View
              key={`${title}-${index}`}
              style={[styles.bar, { height: Math.max(4, (point / max) * 28) }]}
            />
          ))}
        </View>
      ) : null}
      {detail ? (
        <XivText variant="caption" muted numberOfLines={2}>
          {detail}
        </XivText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 168,
    gap: Spacing.one,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spark: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: Spacing.one,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Palette.accent,
  },
});
