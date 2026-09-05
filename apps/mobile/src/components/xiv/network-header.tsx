import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, Palette, Radius, Spacing } from '@/constants/theme';

import { Avatar } from './avatar';
import { BrandMark } from './brand-mark';
import { IconButton } from './icon-button';
import { PressScale } from './press-scale';

type Props = {
  query: string;
  onQuery: (value: string) => void;
  avatarName?: string;
  avatarUri?: string | null;
  onAssistant?: () => void;
  onMessages?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
};

export function NetworkHeader({
  query,
  onQuery,
  avatarName,
  avatarUri,
  onAssistant,
  onMessages,
  onNotifications,
  onProfile,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, Spacing.two) }]}>
      <View style={styles.row}>
        <BrandMark size={36} />
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={onQuery}
            placeholder="Search the network"
            placeholderTextColor={Palette.textDim}
            accessibilityLabel="Search the professional network"
            returnKeyType="search"
            style={styles.input}
          />
        </View>
        {onAssistant ? (
          <IconButton
            ios="sparkles"
            android="auto_awesome"
            label="Open XIV assistant"
            color={Palette.accent}
            onPress={onAssistant}
          />
        ) : null}
        {onMessages ? (
          <IconButton ios="envelope" android="mail" label="Messages" onPress={onMessages} />
        ) : null}
        {onNotifications ? (
          <IconButton
            ios="bell"
            android="notifications"
            label="Notifications"
            onPress={onNotifications}
          />
        ) : null}
        {onProfile ? (
          <PressScale
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={onProfile}
            style={styles.avatarHit}>
            <Avatar name={avatarName} uri={avatarUri} size={36} />
          </PressScale>
        ) : avatarName ? (
          <Avatar name={avatarName} uri={avatarUri} size={36} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.screenGutter,
    paddingBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: Layout.headerHeight,
  },
  search: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.glass,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  input: {
    color: Palette.text,
    fontSize: 14,
    padding: 0,
  },
  avatarHit: {
    minWidth: Layout.minTapTarget,
    minHeight: Layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
