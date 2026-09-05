import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { RiskBadge } from '@/components/xiv/risk-badge';
import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { AgentRiskLevel, PersistedAgentActionStatus } from '@/lib/ai';
import type { PersistedAgentAction } from '@/lib/agent-persistence';

const STATUS_COPY: Record<PersistedAgentActionStatus, string> = {
  proposed: 'Proposed',
  awaiting_approval: 'Proposed',
  approved: 'Approved',
  rejected: 'Rejected',
  executing: 'Approved',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Rejected',
};

const STATUS_COLOR: Record<PersistedAgentActionStatus, string> = {
  proposed: Palette.warning,
  awaiting_approval: Palette.warning,
  approved: Palette.accent,
  rejected: Palette.danger,
  executing: Palette.accent,
  completed: Palette.success,
  failed: Palette.danger,
  cancelled: Palette.danger,
};

function asRisk(value: string): AgentRiskLevel | null {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') return value;
  return null;
}

function resultSummary(payload: Record<string, unknown> | null) {
  if (!payload) return null;
  const result = payload.result;
  return typeof result === 'string' ? result : null;
}

export function AgentActivityList({
  actions,
  emptyTitle = 'No agent activity yet',
}: {
  actions: PersistedAgentAction[];
  emptyTitle?: string;
}) {
  if (actions.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        body="Governed actions, approvals, and prototype results will appear here after you use an agent."
        ios="list.bullet.rectangle"
        android="history"
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {actions.map((item) => {
        const risk = asRisk(item.risk_level);
        const result = resultSummary(item.result_payload);
        return (
          <Card key={item.id} padded={false} style={styles.row}>
            <View style={styles.head}>
              <XivText variant="caption" color={STATUS_COLOR[item.status]}>
                {STATUS_COPY[item.status]}
              </XivText>
              <SampleMark text="Prototype" />
            </View>
            {risk ? <RiskBadge level={risk} /> : null}
            <XivText variant="subtitle">{item.action_type}</XivText>
            <XivText variant="body" muted>
              {item.description}
            </XivText>
            <XivText variant="caption" color={Palette.textDim}>
              {item.tool_id}
            </XivText>
            {result ? <XivText variant="body">{result}</XivText> : null}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  row: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
