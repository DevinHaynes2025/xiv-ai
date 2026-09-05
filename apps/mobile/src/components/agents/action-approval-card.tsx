import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { Expandable } from '@/components/xiv/expandable';
import { RiskBadge } from '@/components/xiv/risk-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { getAgentTool, type AgentAction } from '@/lib/ai';

const LAYER_SYSTEM: Record<string, string> = {
  profile: 'Profile',
  interests: 'Interests',
  search_knowledge: 'Knowledge',
  business_metrics: 'Business metrics',
  organization_universe: 'Organization universe',
  connected_systems: 'Connected systems',
  future_actions: 'Draft actions',
};

const STATUS_COPY: Record<AgentAction['status'], string> = {
  proposed: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
  simulated: 'Simulated',
  blocked: 'Blocked',
};

export function ActionApprovalCard({
  action,
  evidenceOpen,
  onApprove,
  onReject,
  onViewEvidence,
}: {
  action: AgentAction;
  evidenceOpen: boolean;
  onApprove: () => void;
  onReject: () => void;
  onViewEvidence: () => void;
}) {
  const elevatedRisk = action.riskLevel === 'high' || action.riskLevel === 'critical';
  const tool = getAgentTool(action.toolId);
  const systems = LAYER_SYSTEM[tool.layer] ?? tool.layer;
  const impact = action.recommendation ?? action.summary;

  return (
    <Card variant={elevatedRisk ? 'risk' : 'action'} style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Proposed action
        </XivText>
        <RiskBadge level={action.riskLevel} />
      </View>
      <XivText variant="subtitle">{action.title}</XivText>
      <XivText variant="body" muted>
        {action.summary}
      </XivText>
      <View style={styles.meta}>
        <Chip label={STATUS_COPY[action.status]} selected={action.requiresApproval} />
        <Chip label={systems} />
      </View>
      <View style={styles.block}>
        <XivText variant="label" color={Palette.accent}>
          Expected impact
        </XivText>
        <XivText variant="body" muted>
          {impact}
        </XivText>
      </View>
      <View style={styles.block}>
        <XivText variant="label" color={Palette.accent}>
          Systems affected
        </XivText>
        <XivText variant="caption" muted>
          {systems} · {tool.name}
        </XivText>
      </View>
      <XivText variant="caption" color={Palette.warning}>
        Prototype. Approval runs a local simulation only.
      </XivText>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label="Approve" variant="success" onPress={onApprove} />
        </View>
        <View style={styles.action}>
          <Button label="Reject" variant="secondary" onPress={onReject} />
        </View>
      </View>
      <Button label="View Evidence" variant="ghost" onPress={onViewEvidence} />
      {evidenceOpen ? (
        <Expandable title="Evidence" defaultOpen>
          {action.evidence.map((item) => (
            <View key={item.id} style={styles.evidence}>
              <XivText variant="caption" color={Palette.accent}>
                {item.label}
              </XivText>
              <XivText variant="body" muted>
                {item.detail}
              </XivText>
            </View>
          ))}
        </Expandable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
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
  block: {
    gap: Spacing.one,
  },
  evidence: {
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
