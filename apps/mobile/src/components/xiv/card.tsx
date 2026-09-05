import { StyleSheet, View, type ViewProps } from 'react-native';

import { Palette, Radius, Shadows, Spacing } from '@/constants/theme';

type Variant = 'default' | 'elevated' | 'accent' | 'hero' | 'action' | 'risk';

type Props = ViewProps & {
  padded?: boolean;
  accent?: boolean;
  variant?: Variant;
};

export function Card({ padded = true, accent, variant, style, children, ...rest }: Props) {
  const tone: Variant = variant ?? (accent ? 'accent' : 'default');

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
      {...rest}>
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
    backgroundColor: Palette.navyElevated,
    borderColor: Palette.line,
    ...Shadows.card,
  },
  hero: {
    backgroundColor: Palette.glassRaised,
    borderColor: 'rgba(40, 185, 242, 0.32)',
    borderRadius: Radius.xl,
    ...Shadows.glow,
  },
  action: {
    backgroundColor: Palette.navyCard,
    borderColor: Palette.lineStrong,
  },
  risk: {
    backgroundColor: Palette.navyCard,
    borderColor: 'rgba(255, 98, 118, 0.35)',
  },
  padded: {
    padding: Spacing.four,
  },
});
