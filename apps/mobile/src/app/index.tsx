import { type Href, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/xiv/brand-mark';
import { CinematicBackdrop } from '@/components/xiv/cinematic-backdrop';
import { XivText } from '@/components/xiv/text';
import { Layout, Palette, Shadows, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';

SplashScreen.preventAutoHideAsync();

function IntelligencePulse() {
  const opacity = useSharedValue(0.28);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.16, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity, scale]);

  const ring = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Resolving your XIV session"
      style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, ring]} />
      <View style={styles.pulseCore} />
    </View>
  );
}

export default function Splash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, destination } = useSession();
  const routed = useRef(false);

  useEffect(() => {
    if (!ready || routed.current) return;
    routed.current = true;
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync();
      router.replace(destination as Href);
    }, 1200);
    return () => clearTimeout(timer);
  }, [destination, ready, router]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Spacing.five),
          paddingBottom: Math.max(insets.bottom, Spacing.five),
        },
      ]}>
      <CinematicBackdrop atmosphere="cinematic" />

      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(480)} style={styles.brand}>
          <View accessible accessibilityRole="image" accessibilityLabel="XIV AI">
            <BrandMark size={48} />
          </View>
          <XivText variant="label" color={Palette.accent}>
            XIV AI
          </XivText>
          <XivText variant="label" color={Palette.textDim} style={styles.network}>
            The Business Intelligence Network
          </XivText>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(560).delay(90)} style={styles.hero}>
          <XivText variant="hero" style={styles.heroLine}>
            One World.
          </XivText>
          <XivText variant="hero" style={styles.heroLine}>
            One Platform.
          </XivText>
          <XivText variant="title" color={Palette.accent} style={styles.accent}>
            Infinite Opportunities.
          </XivText>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(500).delay(240)} style={styles.support}>
          <XivText variant="caption" muted style={styles.supportText}>
            The intelligent operating ecosystem for business and people.
          </XivText>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.duration(400).delay(320)} style={styles.pulseSlot}>
        <IntelligencePulse />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.void,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenGutter,
  },
  center: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.six,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  network: {
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  heroLine: {
    textAlign: 'center',
    color: Palette.white,
  },
  accent: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  support: {
    maxWidth: 280,
  },
  supportText: {
    textAlign: 'center',
  },
  pulseSlot: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.accent,
    backgroundColor: Palette.accentSoft,
    ...Shadows.glow,
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.accentBright,
  },
});
