/**
 * Design System V4 named shells.
 * Prefer these over ad-hoc labels. Do not invent LIVE state here.
 */
import { type ReactNode } from 'react';

import {
  XivEmptyState as PremiumEmpty,
  XivGlassPanel,
  XivPremiumButton,
  XivSectionHeader,
  XivSkeletonLoader,
  XivStatusPill,
} from '@/components/premium';
import { IconButton } from '@/components/xiv/icon-button';
import { XivText } from '@/components/xiv/text';
import { Palette } from '@/constants/theme';
import type { DataSurfaceState } from '@/lib/surface-state';

export function XivSection({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <XivSectionHeader kicker={kicker} title={title} />
      {children}
    </>
  );
}

export function XivCard({ children }: { children: ReactNode }) {
  return <XivGlassPanel>{children}</XivGlassPanel>;
}

export function XivMetric({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note?: string;
}) {
  return (
    <XivGlassPanel>
      <XivText variant="metadata" muted>
        {title}
      </XivText>
      <XivText variant="pageTitle">{value}</XivText>
      {note ? (
        <XivText variant="micro" dim>
          {note}
        </XivText>
      ) : null}
    </XivGlassPanel>
  );
}

export function XivBadge({ label }: { label: string }) {
  return <XivStatusPill label={label} />;
}

export function XivPill({ label, tone }: { label: string; tone?: 'neutral' | 'live' | 'warning' | 'success' | 'sponsored' }) {
  return <XivStatusPill label={label} tone={tone} />;
}

export function XivButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
}) {
  return <XivPremiumButton label={label} onPress={onPress} variant={variant} />;
}

export function XivIconButton({
  label,
  ios,
  android,
  onPress,
}: {
  label: string;
  ios: string;
  android: string;
  onPress?: () => void;
}) {
  return <IconButton label={label} ios={ios} android={android} onPress={onPress} />;
}

export function XivEmptyState({ title, body }: { title: string; body: string }) {
  return <PremiumEmpty title={title} body={body} />;
}

export function XivLoadingState({ label }: { label?: string }) {
  return <XivSkeletonLoader label={label} />;
}

export function XivErrorState({ title, message }: { title: string; message: string }) {
  return (
    <XivGlassPanel accessibilityRole="summary" accessibilityLabel={title}>
      <XivStatusPill label="UNAVAILABLE" tone="warning" />
      <XivText variant="card">{title}</XivText>
      <XivText variant="body" muted>
        {message}
      </XivText>
    </XivGlassPanel>
  );
}

export function XivHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <XivText variant="pageTitle">{title}</XivText>
      {subtitle ? (
        <XivText variant="metadata" color={Palette.textMuted}>
          {subtitle}
        </XivText>
      ) : null}
    </>
  );
}

export function surfaceLabel(state: DataSurfaceState) {
  return state.split('_').join(' ');
}
