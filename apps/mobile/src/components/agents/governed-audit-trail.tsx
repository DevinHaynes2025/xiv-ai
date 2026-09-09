import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { getXivAgent, type GovernedAction } from '@/lib/ai';

export function GovernedAuditTrail({ actions }: { actions: GovernedAction[] }) {
  return (
    <Card style={styles.card}>
      <XivText variant="label" color={Palette.accent}>
        Session audit
      </XivText>
      <XivText variant="caption" muted>
        In-memory prototype history. These events are not persisted.
      </XivText>
      {actions.length === 0 ? (
        <XivText variant="caption" dim>
          No governed events in this session yet.
        </XivText>
      ) : (
        actions.map((action) => {
          const agent = getXivAgent(action.agentId);
          return (
            <View key={action.actionId} style={styles.row}>
              <XivText variant="caption" color={Palette.text}>
                {agent?.name ?? action.agentId} · {action.toolId}
              </XivText>
              <XivText variant="label" color={Palette.textDim}>
                {action.status} · {action.timestamp}
              </XivText>
              <XivText variant="caption" muted numberOfLines={2}>
                {action.reason || action.outputSummary}
              </XivText>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  row: {
    gap: 2,
    paddingVertical: Spacing.one,
  },
});
