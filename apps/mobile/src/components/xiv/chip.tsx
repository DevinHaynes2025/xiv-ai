import { Pressable, StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
};

export function Chip({ label, selected, onPress, compact }: Props) {
  const body = (
    <XivText variant="caption" color={selected ? Palette.white : Palette.textMuted}>
      {label}
    </XivText>
  );
  const sizeStyle = compact ? styles.compact : null;

  if (!onPress) {
    return <View style={[styles.chip, styles.static, sizeStyle, selected && styles.selected]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, sizeStyle, selected && styles.selected]}>
      {body}
    </Pressable>
  );
}

export const Pill = Chip;

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.glass,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  compact: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
  },
  static: {
    minHeight: 28,
    paddingVertical: 6,
  },
  selected: {
    backgroundColor: Palette.accentMuted,
    borderColor: Palette.accent,
  },
});
