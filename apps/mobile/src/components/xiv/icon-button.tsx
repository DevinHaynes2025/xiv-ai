import { StyleSheet, type ColorValue } from 'react-native';

import { IconSize, Layout, Palette, Radius } from '@/constants/theme';

import { Icon } from './icon';
import { PressScale } from './press-scale';

type Props = {
  ios: string;
  android: string;
  label: string;
  onPress?: () => void;
  color?: ColorValue;
  size?: number;
};

export function IconButton({
  ios,
  android,
  label,
  onPress,
  color = Palette.textMuted,
  size = IconSize.md,
}: Props) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.hit}>
      <Icon name={{ ios, android, web: android }} color={color} size={size} />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: Layout.minTapTarget,
    height: Layout.minTapTarget,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
