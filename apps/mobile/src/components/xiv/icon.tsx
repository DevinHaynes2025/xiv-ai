import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';

type IconName = {
  ios: string;
  android: string;
  web?: string;
};

type Props = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color = Palette.accent, style }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <SymbolView
        name={{
          ios: name.ios as never,
          android: name.android as never,
          web: (name.web ?? name.android) as never,
        }}
        size={size}
        tintColor={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
