import {
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import {
  Palette,
  Radius,
  Shadows,
  Spacing,
} from '@/constants/theme';

type Variant =
  | 'default'
  | 'elevated'
  | 'accent'
  | 'hero'
  | 'action'
  | 'risk';

type Props = ViewProps & {
  padded?: boolean;
  accent?: boolean;
  variant?: Variant;
};

export function Card({
  padded = true,
  accent,
  variant,
  style,
  children,
  ...rest
}: Props) {
  const tone: Variant =
    variant ?? (accent ? 'accent' : 'default');

  return (
    <View
      style={[
        styles.card,
        tone === 'accent' && styles.accent,
        tone === 'elevated' && styles.elevated,
        tone === 'hero' && styles.hero,
        tone === 'action' && styles.action,
        tone === 'risk' && styles.risk,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export const GlassCard = Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.glass,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    overflow: 'hidden',
  },

  accent: {
    backgroundColor: Palette.glassRaised,
    borderColor: Palette.lineStrong,
  },

  elevated: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.line,
    ...Shadows.card,
  },

  hero: {
    backgroundColor: Palette.glassRaised,
    borderColor: Palette.lineStrong,
    borderRadius: Radius.xl,
    ...Shadows.glow,
  },

  action: {
    backgroundColor: Palette.surface,
    borderColor: Palette.lineStrong,
  },

  risk: {
    backgroundColor: Palette.surface,
    borderColor: 'rgba(255, 102, 122, 0.34)',
  },

  padded: {
    padding: Spacing.four,
  },
});
