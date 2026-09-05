import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

export type Atmosphere = 'none' | 'restrained' | 'cinematic';

type Props = {
  atmosphere?: Atmosphere;
};

const earth = require('../../../assets/images/cinematic/earth-night.png');
const network = require('../../../assets/images/cinematic/network-web.png');

export function CinematicBackdrop({ atmosphere = 'restrained' }: Props) {
  if (atmosphere === 'none') return null;

  const cinematic = atmosphere === 'cinematic';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {cinematic ? (
        <Image source={earth} style={styles.photo} contentFit="cover" />
      ) : (
        <Image source={network} style={styles.photoDim} contentFit="cover" />
      )}
      <View style={[styles.wash, cinematic ? styles.washHero : styles.washSoft]} />
      <View style={[styles.orb, cinematic ? styles.orbHero : styles.orbSoft]} />
      <View style={styles.orbSecondary} />
    </View>
  );
}

const fill = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const styles = StyleSheet.create({
  photo: {
    ...fill,
    opacity: 0.55,
  },
  photoDim: {
    ...fill,
    opacity: 0.18,
  },
  wash: {
    ...fill,
  },
  washHero: {
    backgroundColor: 'rgba(1, 24, 39, 0.62)',
  },
  washSoft: {
    backgroundColor: 'rgba(1, 24, 39, 0.88)',
  },
  orb: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  orbHero: {
    backgroundColor: 'rgba(42, 185, 243, 0.16)',
  },
  orbSoft: {
    backgroundColor: 'rgba(66, 133, 255, 0.10)',
  },
  orbSecondary: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(7, 80, 119, 0.45)',
  },
});

export const AtmosphereFill = { backgroundColor: Palette.navy } as const;
