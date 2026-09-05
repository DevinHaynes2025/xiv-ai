import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { PressScale } from './press-scale';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  kicker?: string;
  title: string;
  body: string;
  meta?: string;
  sample?: boolean;
  onPress?: () => void;
};

export function ActionCard({ kicker, title, body, meta, sample, onPress }: Props) {
  return (
    <PressScale accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress}>
      <Card variant="action" style={styles.card}>
        <View style={styles.head}>
          {kicker ? (
            <XivText variant="label" color={Palette.accent}>
              {kicker}
            </XivText>
          ) : null}
          {sample ? <SampleMark /> : null}
        </View>
        <XivText variant="subtitle">{title}</XivText>
        <XivText variant="body" muted>
          {body}
        </XivText>
        {meta ? (
          <XivText variant="caption" color={Palette.textDim}>
            {meta}
          </XivText>
        ) : null}
      </Card>
    </PressScale>
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
    gap: Spacing.two,
  },
});
