import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { CheckRow } from '@/components/xiv/check-row';
import { Field } from '@/components/xiv/field';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { useAuth } from '@/hooks/use-auth';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { resolveDestination } from '@/lib/onboarding';
import { regions } from '@/data/mock';
import type { AuthMode } from '@/types/session';

export default function Auth() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: AuthMode = params.mode === 'signin' ? 'signin' : 'create';
  const { signIn, signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [country, setCountry] = useState('United States');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password.length > 0 && password === confirm;
  const canContinue = useMemo(() => {
    if (busy) return false;
    if (mode === 'signin') {
      return email.includes('@') && password.length > 0;
    }
    return name.trim().length > 1 && email.includes('@') && passwordsMatch && Boolean(country) && terms;
  }, [busy, mode, name, email, password, passwordsMatch, country, terms]);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'create') {
        const result = await signUp({
          fullName: name.trim(),
          email: email.trim(),
          password,
          country,
        });
        if (result.status === 'error') {
          setError(result.message);
          return;
        }
        if (result.status === 'confirm_email') {
          router.replace({ pathname: '/verify-email', params: { email: result.email } });
          return;
        }
        router.replace('/security');
        return;
      }

      const result = await signIn({ email: email.trim(), password });
      if (result) {
        setError(result);
        return;
      }
      router.replace((await resolveDestination()) as Href);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      onBack={() => router.back()}
      footer={
        <Button
          label={busy ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Sign in'}
          disabled={!canContinue}
          onPress={() => {
            void submit();
          }}
        />
      }>
      <XivText variant="label" color={Palette.accent}>
        {mode === 'create' ? 'Create account' : 'Sign in'}
      </XivText>
      <XivText variant="display">
        {mode === 'create' ? 'Open a XIV workspace.' : 'Return to XIV.'}
      </XivText>
      <XivText variant="body" muted>
        {mode === 'create'
          ? 'Your account is created with Supabase Auth. XIV does not create an organization at this step.'
          : 'Sign in with your XIV email and password. Your session stays on this device.'}
      </XivText>

      <View style={styles.fields}>
        {mode === 'create' ? (
          <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
        ) : null}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {mode === 'create' ? (
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />
        ) : null}
        {mode === 'create' && password.length > 0 && !passwordsMatch ? (
          <XivText variant="caption" color={Palette.warning}>
            Passwords must match.
          </XivText>
        ) : null}
      </View>

      {mode === 'create' ? (
        <>
          <XivText variant="caption" muted>
            Country / region
          </XivText>
          <View style={styles.regions}>
            {regions.map((item) => {
              const selected = item === country;
              return (
                <Pressable
                  key={item}
                  onPress={() => setCountry(item)}
                  style={[styles.region, selected && styles.regionOn]}>
                  <XivText variant="caption" color={selected ? Palette.white : Palette.textMuted}>
                    {item}
                  </XivText>
                </Pressable>
              );
            })}
          </View>
          <CheckRow
            label="I acknowledge the preview terms"
            detail="This acknowledgement is stored only as a local confirmation before signup."
            selected={terms}
            onPress={() => setTerms((value) => !value)}
          />
        </>
      ) : null}

      {error ? (
        <XivText variant="body" color={Palette.danger}>
          {error}
        </XivText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.three,
  },
  regions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  region: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.navyElevated,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  regionOn: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accentMuted,
  },
});
