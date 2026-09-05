import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import type { SpecializedAgent } from '@/types/agents';

import { BrandMark } from './brand-mark';
import { Card } from './card';
import { PressScale } from './press-scale';
import { RiskBadge } from './risk-badge';
import { StatusBadge, type AgentUiStatus } from './status-badge';
import { XivText } from './text';

type Props = {
  agent: SpecializedAgent;
  status: AgentUiStatus;
  activity?: string;
  onPress?: () => void;
};

export function SpecializedAgentCard({ agent, status, activity, onPress }: Props) {
  const coming = status === 'coming_soon' || status === 'offline' || agent.status === 'coming_soon';

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={`${agent.name}, ${coming ? 'coming soon' : status.replace(/_/g, ' ')}`}
      disabled={!onPress}
      onPress={onPress}
      style={coming ? styles.dim : undefined}>
      <Card accent={!coming} style={styles.card}>
        <View style={styles.head}>
          <BrandMark size={36} />
          <StatusBadge status={coming ? 'coming_soon' : status} />
        </View>
        <XivText variant="label" color={Palette.accent}>
          {agent.role}
        </XivText>
        <XivText variant="subtitle">{agent.name}</XivText>
        <XivText variant="body" muted>
          {agent.mission}
        </XivText>
        <RiskBadge level={agent.riskLevel} />
        <XivText variant="caption" color={Palette.textDim}>
          Tools · {agent.allowedTools.join(', ')}
        </XivText>
        <XivText variant="caption" color={Palette.textDim}>
          Approval · {agent.approvalRequired ? 'Required before any high-risk step' : 'Not required'}
        </XivText>
        <XivText variant="caption" color={Palette.textDim}>
          Activity · {activity ?? (coming ? 'No backend session' : 'Governed Gemini session when opened')}
        </XivText>
        <XivText variant="caption" color={coming ? Palette.warning : Palette.success}>
          {coming ? 'COMING SOON — no model is called' : 'ACTIVE — existing Gemini Business/Executive route'}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dim: {
    opacity: 0.86,
  },
});
