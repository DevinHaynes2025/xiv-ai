import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { Expandable } from '@/components/xiv/expandable';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { AgentSessionContext, AgentType } from '@/lib/ai';
import { AGENT_ALLOWED_TOOLS, listAgentTools } from '@/lib/ai';

export function AgentContextSummary({
  agentType,
  context,
}: {
  agentType: AgentType;
  context: AgentSessionContext;
}) {
  const tools = listAgentTools(AGENT_ALLOWED_TOOLS[agentType]);
  const who = context.anonymous ? context.alias ?? 'Anonymous alias' : context.displayName || 'Signed-in member';

  return (
    <Card style={styles.card}>
      <XivText variant="label" color={Palette.accent}>
        Current context
      </XivText>
      <XivText variant="subtitle">{who}</XivText>
      <XivText variant="body" muted>
        {context.anonymous
          ? 'Legal name and email are withheld from this agent.'
          : `Role ${context.role}. Interests stay on your account; the feed is still mock.`}
      </XivText>
      <Expandable
        title="Tools & Permissions"
        subtitle={`${tools.length} tools available`}
        defaultOpen={false}>
        <View style={styles.tools}>
          {tools.map((tool) => (
            <Chip key={tool.id} label={`${tool.name} · ${tool.riskLevel}`} />
          ))}
        </View>
        <XivText variant="caption" color={Palette.textDim}>
          Unlisted tools cannot run. High-risk work stays behind approval.
        </XivText>
      </Expandable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
