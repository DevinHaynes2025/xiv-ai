import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { Layout, Palette } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  name?: string;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function initials(name?: string) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'XIV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Avatar({ name, uri, size = 40, style }: Props) {
  const fontSize = size < 36 ? 11 : size < 48 ? 13 : 16;
  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    minWidth: Math.min(size, Layout.minTapTarget),
    minHeight: Math.min(size, Layout.minTapTarget),
  };

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'Profile avatar'}
      style={[styles.mark, frame, style]}>
      {uri ? (
        <Image source={{ uri }} style={frame} contentFit="cover" />
      ) : (
        <XivText variant="caption" color={Palette.white} style={{ fontSize, lineHeight: fontSize + 4 }}>
          {initials(name)}
        </XivText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.navySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    overflow: 'hidden',
  },
});
