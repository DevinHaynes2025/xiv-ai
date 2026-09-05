import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Palette, Radius, Spacing, StatusTone } from '@/constants/theme';

import { XivText } from './text';

export type AgentUiStatus =
  | 'ready'
  | 'thinking'
  | 'analyzing'
  | 'waiting_for_approval'
  | 'completed'
  | 'offline'
  | 'coming_soon';

const copy: Record<AgentUiStatus, string> = {
  ready: 'READY',
  thinking: 'THINKING',
  analyzing: 'ANALYZING',
  waiting_for_approval: 'WAITING FOR APPROVAL',
  completed: 'COMPLETED',
  offline: 'OFFLINE',
  coming_soon: 'COMING SOON',
};

const tone: Record<AgentUiStatus, string> = {
  ready: StatusTone.ready,
  thinking: StatusTone.thinking,
  analyzing: StatusTone.analyzing,
  waiting_for_approval: StatusTone.waiting,
  completed: StatusTone.completed,
  offline: StatusTone.offline,
  coming_soon: StatusTone.offline,
};

type Props = {
  status: AgentUiStatus;
  pulse?: boolean;
};

export function StatusBadge({ status, pulse }: Props) {
  const opacity = useSharedValue(1);
  const active = pulse || status === 'thinking' || status === 'analyzing';

  useEffect(() => {
    if (!active) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [active, opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const color = tone[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Agent status ${copy[status]}`}
      style={styles.row}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dotStyle]} />
      <XivText variant="label" color={color}>
        {copy[status]}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.glass,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
