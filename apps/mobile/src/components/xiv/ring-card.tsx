import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  title: string;
  value: number;
  detail?: string;
  sample?: boolean;
};

export function RingCard({ title, value, detail, sample }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone = clamped >= 85 ? Palette.success : clamped >= 70 ? Palette.warning : Palette.danger;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <XivText variant="caption" muted numberOfLines={1}>
          {title}
        </XivText>
        {sample ? <SampleMark /> : null}
      </View>
      <View style={[styles.ring, { borderColor: tone }]}>
        <XivText variant="title" color={tone}>
          {clamped}
        </XivText>
      </View>
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
    width: 148,
    minWidth: 136,
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  head: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.one,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.navyDeep,
  },
});
