import { Pressable, StyleSheet, View } from 'react-native';

import { Layout, Palette, Radius, Spacing } from '@/constants/theme';

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
      <View style={[styles.pip, selected && styles.pipOn]} />
      <XivText variant="caption" color={selected ? Palette.white : Palette.textMuted} style={styles.label}>
        {label}
      </XivText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.navyElevated,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minWidth: '30%',
    minHeight: Layout.minTapTarget,
    flexGrow: 1,
  },
  selected: {
    backgroundColor: Palette.accentMuted,
    borderColor: Palette.accent,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.navySoft,
  },
  pipOn: {
    backgroundColor: Palette.accent,
  },
  label: {
    flexShrink: 1,
  },
});
