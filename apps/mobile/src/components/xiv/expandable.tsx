import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { Icon } from './icon';
import { PressScale } from './press-scale';
import { XivText } from './text';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  surface?: boolean;
};

export function Expandable({ title, subtitle, children, defaultOpen = false, surface }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.wrap, surface && styles.surface]}>
      <PressScale
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        onPress={() => setOpen((value) => !value)}
        style={styles.head}>
        <View style={styles.copy}>
          <XivText variant="label" color={Palette.accent}>
            {title}
          </XivText>
          {subtitle ? (
            <XivText variant="caption" muted numberOfLines={1}>
              {subtitle}
            </XivText>
          ) : null}
        </View>
        <Icon
          name={{
            ios: open ? 'chevron.up' : 'chevron.down',
            android: open ? 'expand_less' : 'expand_more',
            web: open ? 'expand_less' : 'expand_more',
          }}
          color={Palette.textMuted}
          size={18}
        />
      </PressScale>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  surface: {
    backgroundColor: Palette.glass,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  body: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
});
