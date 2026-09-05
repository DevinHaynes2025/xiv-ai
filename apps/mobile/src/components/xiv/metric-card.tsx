import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Layout, Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  kicker?: string;
  title: string;
  value: string;
  detail?: string;
  sample?: boolean;
  spark?: number[];
};

export function MetricCard({ kicker, title, value, detail, sample, spark }: Props) {
  return (
    <Card style={styles.card}>
      {kicker ? (
        <XivText variant="label" color={Palette.accent}>
          {kicker}
        </XivText>
      ) : null}
      <XivText variant="caption" muted numberOfLines={1}>
        {title}
      </XivText>
      <XivText variant="title">{value}</XivText>
      {spark?.length ? (
        <View style={styles.spark}>
          {spark.map((level, index) => (
            <View key={`${title}-${index}`} style={[styles.bar, { height: 8 + level * 14 }]} />
          ))}
        </View>
      ) : null}
      {detail ? (
        <XivText variant="caption" muted numberOfLines={2}>
          {detail}
        </XivText>
      ) : null}
      {sample ? <SampleMark /> : null}
    </Card>
  );
}

export function MetricRow({
  children,
  scroll = false,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  if (scroll) {
    return (
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.scroll}
        decelerationRate="fast">
        {children}
      </ScrollView>
    );
  }

  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: 156,
    minWidth: 148,
    gap: Spacing.one,
    padding: Spacing.three,
    backgroundColor: Palette.navyMid,
  },
  spark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 22,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Palette.accent,
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  bleed: {
    marginHorizontal: -Layout.screenGutter,
    overflow: 'visible',
  },
  scroll: {
    gap: Spacing.two,
    paddingHorizontal: Layout.screenGutter,
    paddingRight: Layout.screenGutter + Spacing.three,
  },
});
