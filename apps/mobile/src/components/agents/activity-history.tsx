import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { AgentAction, AgentMessage } from '@/lib/ai';

export function ActivityHistory({
  messages,
  actions,
  activityLog = [],
}: {
  messages: AgentMessage[];
  actions: AgentAction[];
  activityLog?: { id: string; at: string; text: string }[];
}) {
  const recent = [...messages].slice(-8);

  return (
    <View style={styles.wrap}>
      {recent.map((item) => (
        <Card key={item.id} padded={false} style={styles.row}>
          <XivText variant="label" color={item.role === 'user' ? Palette.textMuted : Palette.accent}>
            {item.role === 'user' ? 'You' : item.role === 'agent' ? 'Agent' : 'System'}
          </XivText>
          <XivText variant="body" muted={item.role !== 'agent'}>
            {item.content}
          </XivText>
        </Card>
      ))}
      {activityLog.map((item) => (
        <Card key={item.id} padded={false} style={styles.row}>
          <XivText variant="caption" color={Palette.accent}>
            Activity
          </XivText>
          <XivText variant="body">{item.text}</XivText>
        </Card>
      ))}
      {actions
        .filter(
          (item) =>
            item.status === 'approved' ||
            item.status === 'rejected' ||
            item.status === 'simulated' ||
            item.status === 'blocked',
        )
        .slice(-6)
        .map((item) => (
          <Card key={item.id} padded={false} style={styles.row}>
            <XivText variant="caption" color={Palette.accent}>
              {item.status} · {item.toolId}
            </XivText>
            <XivText variant="body">{item.title}</XivText>
          </Card>
        ))}
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
});
