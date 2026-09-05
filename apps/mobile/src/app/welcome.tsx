import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <Screen
      footer={
        <>
          <Button label="Create account" onPress={() => router.push({ pathname: '/auth', params: { mode: 'create' } })} />
          <Button label="Sign in" variant="subtle" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })} />
        </>
      }>
      <View style={styles.hero}>
        <XivText style={styles.logo}>XIV AI</XivText>
        <XivText style={styles.headline} color={Palette.accent}>
          One World. One Platform.
        </XivText>
        <XivText variant="body" muted style={styles.tagline}>
          The Business Intelligence Network
        </XivText>
        <XivText variant="body" muted>
          Security-first intelligence for markets, anonymous workplace signal, and executive command.
          Three experiences. One platform.
        </XivText>
      </View>

      <Card>
        <XivText variant="label" color={Palette.accent}>
          Built as
        </XivText>
        <View style={styles.list}>
          <XivText variant="body">Consumer intelligence and opportunity</XivText>
          <XivText variant="body">Anonymous employee community</XivText>
          <XivText variant="body">Business and executive command</XivText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '800',
    color: Palette.white,
    textAlign: 'center',
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    fontSize: 16,
  },
  list: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
