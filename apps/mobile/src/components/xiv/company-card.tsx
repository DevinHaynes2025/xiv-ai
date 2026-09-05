import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Card } from './card';
import { SampleMark } from './sample-mark';
import { StatusBadge, type AgentUiStatus } from './status-badge';
import { XivText } from './text';

type Props = {
  name: string;
  status: string;
  detail: string;
  health?: string;
  sample?: boolean;
};

export function CompanyCard({ name, status, detail, health, sample = true }: Props) {
  const badge: AgentUiStatus = status.toLowerCase().includes('watch') ? 'waiting_for_approval' : 'ready';

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Company status
        </XivText>
        {sample ? <SampleMark /> : null}
      </View>
      <XivText variant="subtitle">{name}</XivText>
      <View style={styles.meta}>
        <StatusBadge status={badge} />
        {health ? (
          <XivText variant="caption" color={Palette.success}>
            Health {health}
          </XivText>
        ) : null}
      </View>
      <XivText variant="body" muted>
        {detail}
      </XivText>
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
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
});
