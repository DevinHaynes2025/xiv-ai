import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { Palette, Radius, Spacing } from '@/constants/theme';
import type { NetworkContentKind, NetworkPreview } from '@/data/mock';

import { Icon } from './icon';
import { XivText } from './text';

const previews: Record<NetworkPreview, number> = {
  network: require('../../../assets/images/cinematic/network-web.png'),
  earth: require('../../../assets/images/cinematic/earth-night.png'),
};

const KIND_LABEL: Record<NetworkContentKind, string> = {
  text: 'TEXT',
  image: 'IMAGE',
  video: 'VIDEO',
  article: 'ARTICLE',
  poll: 'POLL',
  question: 'QUESTION',
  idea: 'IDEA',
  project: 'PROJECT',
  product: 'PRODUCT',
};

type Props = {
  kind: NetworkContentKind;
  preview: NetworkPreview;
  duration?: string;
  readingTime?: string;
};

export function XivMediaPreview({ kind, preview, duration, readingTime }: Props) {
  const video = kind === 'video';

  return (
    <View style={styles.preview}>
      <Image source={previews[preview]} style={styles.previewImage} contentFit="cover" />
      <View style={styles.previewWash} />
      {video ? (
        <View style={styles.playWrap} pointerEvents="none">
          <View style={styles.play} accessibilityLabel="Video preview">
            <Icon
              name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
              color={Palette.white}
              size={22}
            />
          </View>
        </View>
      ) : null}
      {duration || readingTime ? (
        <View style={styles.duration}>
          <XivText variant="label" color={Palette.white}>
            {duration ?? readingTime}
          </XivText>
        </View>
      ) : (
        <View style={styles.kindMark}>
          <XivText variant="label" color={Palette.accent}>
            {KIND_LABEL[kind]}
          </XivText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 188,
    backgroundColor: Palette.navyDeep,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(1, 24, 39, 0.28)',
  },
  playWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 185, 242, 0.28)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.accent,
    shadowColor: Palette.accent,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  duration: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(1, 24, 39, 0.72)',
  },
  kindMark: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(1, 24, 39, 0.72)',
  },
});
