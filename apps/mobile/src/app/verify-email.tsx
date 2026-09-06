import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Icon } from '@/components/xiv/icon';
import { OnboardingHero } from '@/components/xiv/onboarding-hero';
import { Screen } from '@/components/xiv/screen';
import { SecurityBadge } from '@/components/xiv/security-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Shadows, Spacing } from '@/constants/theme';

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? 'your email';

  return (
    <Screen
      atmosphere="restrained"
      footer={
        <Button
          label="Back to sign in"
          onPress={() => router.replace({ pathname: '/auth', params: { mode: 'signin' } } as Href)}
        />
      }>
      <OnboardingHero
        markSize={40}
        kicker="XIV AI"
        title="Verify your email"
        support="XIV created the login, but you are not signed in yet. Confirm the address below, then return to sign in. This step cannot be skipped."
      />

      <View style={styles.iconSlot} accessible accessibilityLabel="Email verification">
        <View style={styles.iconRing}>
          <Icon name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }} size={36} />
        </View>
      </View>

      <Card variant="elevated" style={styles.card}>
        <XivText variant="caption" color={Palette.accent}>
          Confirmation sent
        </XivText>
        <XivText variant="subtitle">{email}</XivText>
        <XivText variant="body" muted style={styles.gap}>
          Check your inbox and spam folder. After you verify, sign in with the same email and
          password.
        </XivText>
      </Card>

      <SecurityBadge
        label="Secure access"
        detail="Private identity • Encrypted connection • Controlled access"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    ...Shadows.glow,
  },
  card: {
    gap: Spacing.one,
  },
  gap: {
    marginTop: Spacing.two,
  },
});
