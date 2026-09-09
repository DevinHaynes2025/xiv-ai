import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { RiskBadge } from '@/components/xiv/risk-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { AUTHORITY_LABEL, getXivAgent, type GovernedAction } from '@/lib/ai';

export function GovernedApprovalCard({
  action,
  onApprove,
  onDeny,
}: {
  action: GovernedAction;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const agent = getXivAgent(action.agentId);
  const pending = action.status === 'awaiting_approval';

  return (
    <Card variant="action" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Proposed action
        </XivText>
        <RiskBadge level={action.riskLevel} />
      </View>
      <XivText variant="subtitle">{agent?.name ?? action.agentId}</XivText>
      <XivText variant="body" muted>
        {action.intent}
      </XivText>
      <XivText variant="caption" dim>
        {action.authorityLevel} · {AUTHORITY_LABEL[action.authorityLevel]} · {action.toolId}
      </XivText>
      <XivText variant="caption" muted>
        {action.reason}
      </XivText>
      <XivText variant="label" color={Palette.textDim}>
        Requested {action.timestamp} · {action.status}
      </XivText>
      {pending ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button label="Approve" variant="success" onPress={onApprove} />
          </View>
          <View style={styles.action}>
            <Button label="Deny" variant="secondary" onPress={onDeny} />
          </View>
        </View>
      ) : null}
      <PrototypeNotice text="Prototype approval only. Approving records a human decision and re-checks policy. No production system is changed." />
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
