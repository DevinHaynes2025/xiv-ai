import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';
import type { AgentRiskLevel } from '@/lib/ai';

import { Icon } from './icon';
import { XivText } from './text';

const copy: Record<AgentRiskLevel, string> = {
  low: 'LOW RISK',
  medium: 'MEDIUM RISK',
  high: 'HIGH RISK',
  critical: 'CRITICAL RISK',
};

const tone: Record<AgentRiskLevel, string> = {
  low: Palette.success,
  medium: Palette.warning,
  high: Palette.danger,
  critical: Palette.critical,
};

const fill: Record<AgentRiskLevel, string> = {
  low: 'rgba(37, 229, 188, 0.12)',
  medium: 'rgba(241, 197, 75, 0.12)',
  high: 'rgba(255, 98, 118, 0.12)',
  critical: 'rgba(255, 98, 118, 0.16)',
};

type Props = {
  level: AgentRiskLevel;
};

export function RiskBadge({ level }: Props) {
  const color = tone[level];
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={copy[level]}
      style={[styles.row, { borderColor: color, backgroundColor: fill[level] }]}>
      <Icon
        name={{ ios: 'shield.lefthalf.filled', android: 'shield', web: 'shield' }}
        color={color}
        size={14}
      />
      <XivText variant="label" color={color}>
        {copy[level]}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
