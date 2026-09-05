import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

import { XivText } from './text';

type Props = {
  size?: number;
};

export function BrandMark({ size = 72 }: Props) {
  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <XivText variant="title" color={Palette.white} style={[styles.letter, size < 50 && styles.letterSm]}>
        XIV
      </XivText>
    </View>
  );
}

export function Wordmark() {
  return (
    <XivText variant="label" color={Palette.accent}>
      XIV AI
    </XivText>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.accentDeep,
    experimental_backgroundImage: `linear-gradient(145deg, ${Palette.navySoft}, ${Palette.accentDeep}, ${Palette.accent})`,
    shadowColor: Palette.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  letter: {
    letterSpacing: 1.4,
    fontSize: 18,
  },
  letterSm: {
    fontSize: 12,
    letterSpacing: 0.6,
  },
});
