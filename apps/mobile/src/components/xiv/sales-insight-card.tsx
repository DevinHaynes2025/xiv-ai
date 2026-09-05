import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  title: string;
  body: string;
  detail?: string;
};

export function SalesInsightCard({ title, body, detail }: Props) {
  return (
    <Card accent style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Sales insight
        </XivText>
        <SampleMark text="DEMO" />
      </View>
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted>
        {body}
      </XivText>
      {detail ? (
        <XivText variant="caption" color={Palette.textDim}>
          {detail}
        </XivText>
      ) : null}
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
