import { Pressable, StyleSheet } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function SelectableCard({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.selected]}>
      <XivText variant="caption" color={selected ? Palette.white : Palette.textMuted}>
        {label}
      </XivText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.navyElevated,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    minWidth: '30%',
    flexGrow: 1,
  },
  selected: {
    backgroundColor: Palette.accentMuted,
    borderColor: Palette.accent,
  },
});
