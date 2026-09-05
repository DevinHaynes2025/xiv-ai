import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import type { AgentRiskLevel } from '@/lib/ai';

import { Card } from './card';
import { RiskBadge } from './risk-badge';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  kicker?: string;
  title: string;
  body: string;
  risk?: AgentRiskLevel;
  evidenceCount?: number;
  sample?: boolean;
};

export function InsightCard({ kicker = 'Insight', title, body, risk, evidenceCount, sample }: Props) {
  return (
    <Card accent style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          {kicker}
        </XivText>
        {sample ? <SampleMark /> : null}
      </View>
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted>
        {body}
      </XivText>
      <View style={styles.meta}>
        {risk ? <RiskBadge level={risk} /> : null}
        {typeof evidenceCount === 'number' ? (
          <XivText variant="caption" color={Palette.textDim}>
            {evidenceCount} evidence
          </XivText>
        ) : null}
      </View>
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
