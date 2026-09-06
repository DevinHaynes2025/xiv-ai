import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

const ITEMS = ['Security First', 'Privacy by Design', 'AI Powered'] as const;

export function TrustStrip() {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={ITEMS.join('. ')}
      style={styles.bar}>
      {ITEMS.map((item, index) => (
        <View key={item} style={styles.item}>
          {index > 0 ? <View style={styles.dot} /> : null}
          <XivText variant="label" color={Palette.textMuted} style={styles.label}>
            {item}
          </XivText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceSoft,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.accent,
  },
  label: {
    letterSpacing: 1.1,
  },
});
