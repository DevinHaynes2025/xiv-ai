import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = ViewProps & {
  kicker?: string;
  title: string;
  body?: string;
  sample?: boolean;
  footer?: ReactNode;
};

export function HeroCard({ kicker, title, body, sample, footer, style, children, ...rest }: Props) {
  return (
    <Card variant="hero" style={[styles.card, style]} {...rest}>
      <View style={styles.head}>
        {kicker ? (
          <XivText variant="label" color={Palette.accent}>
            {kicker}
          </XivText>
        ) : null}
        {sample ? <SampleMark /> : null}
      </View>
      <XivText variant="title">{title}</XivText>
      {body ? (
        <XivText variant="body" muted>
          {body}
        </XivText>
      ) : null}
      {children}
      {footer}
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
    gap: Spacing.two,
  },
});
