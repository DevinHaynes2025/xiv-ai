import { Pressable, StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  label: string;
  detail?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function CheckRow({ label, detail, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={[styles.row, selected && styles.selected]}>
      <View style={[styles.box, selected && styles.boxOn]}>
        {selected ? <View style={styles.mark} /> : null}
      </View>
      <View style={styles.copy}>
        <XivText variant="body">{label}</XivText>
        {detail ? (
          <XivText variant="caption" muted>
            {detail}
          </XivText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.navyElevated,
  },
  selected: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accentMuted,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Palette.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxOn: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accent,
  },
  mark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.navy,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});
