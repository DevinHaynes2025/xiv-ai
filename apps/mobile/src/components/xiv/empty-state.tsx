import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { Icon } from './icon';
import { XivText } from './text';

type Props = {
  title: string;
  body: string;
  ios?: string;
  android?: string;
};

export function EmptyState({
  title,
  body,
  ios = 'tray',
  android = 'inbox',
}: Props) {
  return (
    <View accessibilityRole="summary" style={styles.wrap}>
      <Icon name={{ ios, android, web: android }} color={Palette.textDim} size={28} />
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted style={styles.body}>
        {body}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.glass,
  },
  body: {
    textAlign: 'center',
  },
});
