import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { PressScale } from './press-scale';
import { XivText } from './text';

type Props = {
  kicker?: string;
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeader({ kicker, title, action, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {kicker ? (
          <XivText variant="label" color={Palette.accent}>
            {kicker}
          </XivText>
        ) : null}
        <XivText variant="subtitle">{title}</XivText>
      </View>
      {action ? (
        <PressScale
          accessibilityRole={onAction ? 'button' : undefined}
          accessibilityLabel={action}
          onPress={onAction}
          disabled={!onAction}
          style={styles.action}>
          <XivText variant="caption" color={Palette.accent}>
            {action}
          </XivText>
        </PressScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
