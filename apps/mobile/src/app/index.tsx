import { type Href, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useSession } from '@/hooks/use-session';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function Splash() {
  const router = useRouter();
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
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
        <Text style={styles.logo}>XIV AI</Text>
        <Text style={styles.title}>One World. One Platform.</Text>
        <Text style={styles.subtitle}>The Business Intelligence Network</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Palette.white,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.accent,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
