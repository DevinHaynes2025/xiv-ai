import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { Expandable } from '@/components/xiv/expandable';
import { RiskBadge } from '@/components/xiv/risk-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { StructuredAgentOutput } from '@/lib/ai';

export function StructuredResultCard({
  output,
  healthScore,
}: {
  output: StructuredAgentOutput;
  healthScore?: number;
}) {
  return (
    <Card variant="hero" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Intelligence result
        </XivText>
        <RiskBadge level={output.riskLevel} />
      </View>
      <XivText variant="subtitle">{output.recommendation}</XivText>
      <XivText variant="body" muted>
        {output.summary}
      </XivText>
      <View style={styles.meta}>
        {typeof healthScore === 'number' ? (
          <Chip label={`Health ${healthScore}`} selected />
        ) : null}
        <Chip label={`${output.evidence.length} evidence`} />
        {output.proposedAction ? <Chip label={output.proposedAction.type} /> : null}
      </View>
      {output.proposedAction ? (
        <View style={styles.proposed}>
          <XivText variant="label" color={Palette.accent}>
            Proposed action
          </XivText>
          <XivText variant="body" muted>
            {output.proposedAction.description}
          </XivText>
        </View>
      ) : null}
      {output.evidence.length ? (
        <Expandable title="Raw evidence" subtitle={`${output.evidence.length} items`} defaultOpen={false}>
          {output.evidence.map((item) => (
            <XivText key={item} variant="caption" muted>
              {item}
            </XivText>
          ))}
        </Expandable>
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
    gap: Spacing.two,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  proposed: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
});
