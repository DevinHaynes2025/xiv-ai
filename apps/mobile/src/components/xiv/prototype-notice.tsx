import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

export function PrototypeNotice({ text }: { text: string }) {
  return (
    <View style={styles.banner}>
      <XivText variant="caption" color={Palette.warning}>
        Preview
      </XivText>
      <XivText variant="caption" muted>
        {text}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 4,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(241, 197, 75, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(241, 197, 75, 0.22)',
  },
});
