import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/xiv/chip';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import type { AgentAction } from '@/lib/ai';

import { riskColor } from './agent-status';

export function SuggestedActions({
  actions,
  onSelect,
}: {
  actions: AgentAction[];
  onSelect: (action: AgentAction) => void;
}) {
  return (
    <View style={styles.wrap}>
      <SectionHeader kicker="Governed" title="Suggested actions" />
      <XivText variant="caption" muted>
        These map to an explicit tool list. Nothing runs until you approve.
      </XivText>
      <View style={styles.row}>
        {actions.map((action) => (
          <Chip
            key={action.id}
            label={`${action.title} · ${action.riskLevel}`}
            onPress={() => onSelect(action)}
          />
        ))}
      </View>
      {actions[0] ? (
        <XivText variant="caption" color={riskColor(actions[0].riskLevel)}>
          Highest visible risk in this list is treated as a proposal, not a command.
        </XivText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
