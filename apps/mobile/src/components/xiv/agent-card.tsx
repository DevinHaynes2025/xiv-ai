import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { BrandMark } from './brand-mark';
import { Card } from './card';
import { PressScale } from './press-scale';
import { StatusBadge, type AgentUiStatus } from './status-badge';
import { XivText } from './text';

type Props = {
  name: string;
  summary: string;
  status: AgentUiStatus;
  onPress?: () => void;
  compact?: boolean;
};

export function AgentCard({ name, summary, status, onPress, compact }: Props) {
  const coming = status === 'coming_soon' || status === 'offline';

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${status.replace(/_/g, ' ')}`}
      disabled={!onPress}
      onPress={onPress}
      style={coming ? styles.dim : undefined}>
      <Card accent={!coming} style={[styles.card, compact && styles.compact]}>
        <View style={styles.head}>
          <BrandMark size={compact ? 28 : 36} />
          <StatusBadge status={status} />
        </View>
        <XivText variant={compact ? 'caption' : 'subtitle'} numberOfLines={compact ? 1 : undefined}>
          {name}
        </XivText>
        <XivText variant={compact ? 'caption' : 'body'} muted numberOfLines={compact ? 2 : undefined}>
          {summary}
        </XivText>
      </Card>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  compact: {
    width: 168,
    minHeight: 148,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dim: {
    opacity: 0.78,
  },
});
