import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  label?: string;
  detail?: string;
};

export function SecurityBadge({
  label = 'Secure session',
  detail = 'Encrypted connection • Private identity • Controlled access',
}: Props) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${label}. ${detail}`}
      style={styles.wrap}>
      <View style={styles.dot} />
      <View style={styles.copy}>
        <XivText variant="label" color={Palette.success}>
          {label}
        </XivText>
        <XivText variant="caption" muted>
          {detail}
        </XivText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.successSoft,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.success,
    marginTop: 5,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
