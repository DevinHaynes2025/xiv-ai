import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, Palette, Radius, Spacing } from '@/constants/theme';

import { Avatar } from './avatar';
import { BrandMark } from './brand-mark';
import { IconButton } from './icon-button';
import { PressScale } from './press-scale';
import { XivText } from './text';

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  universe?: string;
  statusLabel?: string;
  avatarName?: string;
  avatarUri?: string | null;
  onAvatarPress?: () => void;
  onNotifications?: () => void;
  compact?: boolean;
  layout?: 'default' | 'command' | 'agent';
};

export function Header({
  kicker = 'XIV AI',
  title,
  subtitle,
  universe,
  statusLabel,
  avatarName,
  avatarUri,
  onAvatarPress,
  onNotifications,
  compact,
  layout = 'default',
}: Props) {
  const insets = useSafeAreaInsets();
  const band = layout === 'command' || layout === 'agent';

  return (
    <View style={[styles.wrap, band && styles.band, { paddingTop: Math.max(insets.top, Spacing.two) }]}>
      <View style={styles.row}>
        <BrandMark size={compact || band ? 36 : 40} />
        <View style={styles.copy}>
          {band ? (
            <>
              <XivText variant="subtitle" numberOfLines={1}>
                {title}
              </XivText>
              <XivText variant="caption" muted numberOfLines={1}>
                {universe ?? subtitle ?? 'The Business Intelligence Network'}
              </XivText>
            </>
          ) : (
            <>
              <XivText variant="label" color={Palette.accent}>
                {kicker}
              </XivText>
              {!compact ? (
                <XivText variant="caption" muted numberOfLines={1}>
                  The Business Intelligence Network
                </XivText>
              ) : null}
            </>
          )}
        </View>
        {statusLabel ? (
          <View style={styles.status}>
            <View style={styles.statusDot} />
            <XivText variant="label" color={Palette.accent} numberOfLines={1}>
              {statusLabel}
            </XivText>
          </View>
        ) : null}
        {onNotifications ? (
          <IconButton
            ios="bell"
            android="notifications"
            label="Notifications"
            onPress={onNotifications}
          />
        ) : null}
        {onAvatarPress ? (
          <PressScale
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={onAvatarPress}
            style={styles.avatarHit}>
            <Avatar name={avatarName} uri={avatarUri} size={36} />
          </PressScale>
        ) : avatarName ? (
          <Avatar name={avatarName} uri={avatarUri} size={36} />
        ) : null}
      </View>
      {band ? null : (
        <View style={styles.hero}>
          <XivText variant={compact ? 'title' : 'display'}>{title}</XivText>
          {subtitle ? (
            <XivText variant="body" muted>
              {subtitle}
            </XivText>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.screenGutter,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  band: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.line,
    backgroundColor: 'rgba(1, 24, 39, 0.42)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: Layout.headerHeight,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  hero: {
    gap: 4,
  },
  avatarHit: {
    minWidth: Layout.minTapTarget,
    minHeight: Layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 108,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.navyMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.accent,
    shadowColor: Palette.accent,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
