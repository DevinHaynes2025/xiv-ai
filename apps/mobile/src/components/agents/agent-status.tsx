import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/xiv/brand-mark';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { StatusBadge, type AgentUiStatus } from '@/components/xiv/status-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { AgentRiskLevel, AgentStatus } from '@/lib/ai';

export type VisibleAgentState = 'idle' | 'analyzing' | 'gemini_connected' | 'approval_required' | 'error';

function toUiStatus(status: AgentStatus, visibleState?: VisibleAgentState): AgentUiStatus {
  if (visibleState === 'error') return 'offline';
  if (visibleState === 'analyzing') return 'analyzing';
  if (visibleState === 'approval_required') return 'waiting_for_approval';
  if (status === 'thinking') return 'thinking';
  if (status === 'awaiting_approval') return 'waiting_for_approval';
  if (status === 'simulating') return 'analyzing';
  if (status === 'blocked') return 'offline';
  if (visibleState === 'gemini_connected') return 'ready';
  if (status === 'idle') return 'ready';
  return 'ready';
}

export function AgentStatusCard({
  name,
  status,
  summary,
  visibleState,
  liveWired,
  liveConnected,
}: {
  name: string;
  status: AgentStatus;
  summary: string;
  visibleState?: VisibleAgentState;
  liveWired?: boolean;
  liveConnected?: boolean;
}) {
  const ui = toUiStatus(status, visibleState);
  const danger = visibleState === 'error' || status === 'blocked';

  return (
    <Card accent style={styles.card}>
      <View style={styles.head}>
        <BrandMark size={48} />
        <View style={styles.copy}>
          <XivText variant="label" color={Palette.accent}>
            Active agent
          </XivText>
          <XivText variant="subtitle">{name}</XivText>
        </View>
      </View>
      <View style={styles.meta}>
        <StatusBadge status={ui} />
        {liveWired ? (
          <Chip label={liveConnected ? 'Gemini connected' : 'AI service ready'} selected={liveConnected} />
        ) : (
          <Chip label="Mocked model" />
        )}
        <Chip label="Governed" />
      </View>
      <XivText variant="body" muted>
        {summary}
      </XivText>
      {danger ? (
        <XivText variant="caption" color={Palette.danger}>
          {visibleState === 'error' ? 'The last turn could not complete.' : 'Blocked by tool or policy.'}
        </XivText>
      ) : null}
    </Card>
  );
}

export function riskColor(level: AgentRiskLevel) {
  if (level === 'low') return Palette.success;
  if (level === 'medium') return Palette.warning;
  if (level === 'high') return Palette.danger;
  return Palette.critical;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
