/**
 * XIV Premium Design System V3 primitives.
 * Elite executive surfaces — not a social feed.
 */
import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Avatar } from '@/components/xiv/avatar';
import { PressScale } from '@/components/xiv/press-scale';
import { XivText } from '@/components/xiv/text';
import { Layout, Palette, Radius, Shadows, Spacing } from '@/constants/theme';

export function XivPremiumSurface({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function XivGlassPanel({
  children,
  style,
  accessibilityRole,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: ViewStyle;
  accessibilityRole?: 'none' | 'summary' | 'text' | 'progressbar';
  accessibilityLabel?: string;
}) {
  return (
    <View style={[styles.glass, style]} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

export function XivStatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'live' | 'warning' | 'success' | 'sponsored';
}) {
  const color =
    tone === 'live'
      ? Palette.success
      : tone === 'warning'
        ? Palette.warning
        : tone === 'success'
          ? Palette.success
          : tone === 'sponsored'
            ? Palette.warning
            : Palette.textDim;
  return (
    <View style={[styles.pill, { borderColor: color }]} accessibilityRole="text">
      <XivText variant="label" color={color}>
        {label}
      </XivText>
    </View>
  );
}

export function XivAvatar({ name, uri, size = 40 }: { name?: string; uri?: string | null; size?: number }) {
  return <Avatar name={name} uri={uri} size={size} />;
}

export function XivCompanyBadge({ name }: { name: string }) {
  return (
    <View style={styles.badge}>
      <XivText variant="label" color={Palette.accentBright}>
        {name}
      </XivText>
    </View>
  );
}

export function XivDataSourceBadge({ source, connected }: { source: string; connected: boolean }) {
  return <XivStatusPill label={connected ? source : `${source} · NOT CONNECTED`} tone={connected ? 'success' : 'warning'} />;
}

export function XivEvidenceChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <XivText variant="caption" color={Palette.textMuted} numberOfLines={1}>
        {label}
      </XivText>
    </View>
  );
}

export function XivConfidenceIndicator({
  confidence,
}: {
  confidence: 'low' | 'medium' | 'high' | 'unknown';
}) {
  return <XivStatusPill label={`Confidence ${confidence}`} tone="neutral" />;
}

export function XivLiveIndicator({ connected }: { connected: boolean }) {
  return <XivStatusPill label={connected ? 'LIVE' : 'NOT CONNECTED'} tone={connected ? 'live' : 'warning'} />;
}

export function XivPremiumButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.button, variant === 'ghost' && styles.buttonGhost]}>
      <XivText variant="subtitle" color={variant === 'ghost' ? Palette.accentBright : Palette.white}>
        {label}
      </XivText>
    </PressScale>
  );
}

export function XivFloatingActionMenu({
  actions,
}: {
  actions: readonly { id: string; label: string; onPress?: () => void }[];
}) {
  return (
    <View style={styles.fab}>
      {actions.map((action) => (
        <XivPremiumButton key={action.id} label={action.label} onPress={action.onPress} variant="ghost" />
      ))}
    </View>
  );
}

export function XivSearchCommandBar({ placeholder = 'Search XIV' }: { placeholder?: string }) {
  return (
    <XivGlassPanel style={styles.search}>
      <XivText variant="caption" muted>
        {placeholder}
      </XivText>
      <XivText variant="caption" dim>
        Command search is a prototype. No live index.
      </XivText>
    </XivGlassPanel>
  );
}

export function XivSectionHeader({
  kicker,
  title,
  action,
  onAction,
}: {
  kicker?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionCopy}>
        {kicker ? (
          <XivText variant="label" color={Palette.accent}>
            {kicker}
          </XivText>
        ) : null}
        <XivText variant="subtitle">{title}</XivText>
      </View>
      {action ? (
        <PressScale accessibilityRole="button" accessibilityLabel={action} onPress={onAction} disabled={!onAction}>
          <XivText variant="caption" color={Palette.accent}>
            {action}
          </XivText>
        </PressScale>
      ) : null}
    </View>
  );
}

export function XivEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <XivGlassPanel style={styles.empty}>
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted style={styles.center}>
        {body}
      </XivText>
    </XivGlassPanel>
  );
}

export function XivSkeletonLoader({ label = 'Loading' }: { label?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <XivGlassPanel style={styles.skeleton} accessibilityRole="progressbar" accessibilityLabel={label}>
      {reduceMotion ? null : <ActivityIndicator color={Palette.accent} />}
      <XivText variant="caption" muted>
        {label}
      </XivText>
    </XivGlassPanel>
  );
}

const styles = StyleSheet.create({
  surface: {
    gap: Spacing.three,
  },
  glass: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.glass,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Palette.accentSoft,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.navyMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineSoft,
    maxWidth: Layout.maxContentWidth,
  },
  button: {
    minHeight: Layout.minTapTarget,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: Palette.accentDeep,
    ...Shadows.glow,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
  },
  fab: {
    gap: Spacing.two,
  },
  search: {
    minHeight: Layout.minTapTarget,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  sectionCopy: {
    flex: 1,
    gap: 4,
  },
  empty: {
    alignItems: 'center',
    padding: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  skeleton: {
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
});
