import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? 'your email';

  return (
    <Screen
      footer={
        <Button
          label="Back to sign in"
          onPress={() => router.replace({ pathname: '/auth', params: { mode: 'signin' } } as Href)}
        />
      }>
      <XivText variant="label" color={Palette.accent}>
        Verify email
      </XivText>
      <XivText variant="display">Confirm your account.</XivText>
      <XivText variant="body" muted>
        XIV created the login, but you are not signed in yet. Confirm the address below, then return
        to sign in. This step cannot be skipped.
      </XivText>
      <Card>
        <XivText variant="caption" color={Palette.accent}>
          Confirmation sent
        </XivText>
        <XivText variant="subtitle">{email}</XivText>
        <XivText variant="body" muted style={styles.gap}>
          Check your inbox and spam folder. After you verify, sign in with the same email and
          password.
        </XivText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: Spacing.two,
  },
});
