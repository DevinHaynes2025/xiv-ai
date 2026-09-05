import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

type Props = {
  count: number;
  index: number;
};

export function ProgressDots({ count, index }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.active, i < index && styles.done]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    height: 6,
    flex: 1,
    borderRadius: 99,
    backgroundColor: Palette.navySoft,
  },
  active: {
    backgroundColor: Palette.accent,
  },
  done: {
    backgroundColor: Palette.accentDeep,
  },
});
