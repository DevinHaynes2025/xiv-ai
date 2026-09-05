import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { PressScale } from './press-scale';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  title: string;
  relationship: string;
  health: string;
  orders: string;
  service: string;
  returns: string;
  sample?: boolean;
  onPress?: () => void;
};

export function CustomerCard({
  title,
  relationship,
  health,
  orders,
  service,
  returns,
  sample = true,
  onPress,
}: Props) {
  return (
    <PressScale accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.head}>
          <XivText variant="label" color={Palette.accent}>
            {relationship}
          </XivText>
          {sample ? <SampleMark text="DEMO" /> : null}
        </View>
        <XivText variant="subtitle">{title}</XivText>
        <XivText variant="title">{health}</XivText>
        <XivText variant="caption" muted>
          Orders · {orders}
        </XivText>
        <XivText variant="caption" muted>
          Service · {service} · Returns · {returns}
        </XivText>
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
