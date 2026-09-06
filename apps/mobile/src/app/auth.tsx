import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { CheckRow } from '@/components/xiv/check-row';
import { Chip } from '@/components/xiv/chip';
import { Field } from '@/components/xiv/field';
import { OnboardingHero } from '@/components/xiv/onboarding-hero';
import { Screen } from '@/components/xiv/screen';
import { SecurityBadge } from '@/components/xiv/security-badge';
import { XivText } from '@/components/xiv/text';
import { Layout, Palette, Radius, Spacing } from '@/constants/theme';
import { regions } from '@/data/mock';
import { useAuth } from '@/hooks/use-auth';
import { resolveDestination } from '@/lib/onboarding';
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

  const setMode = (next: AuthMode) => {
    if (next === mode) return;
    setError(null);
    router.setParams({ mode: next });
  };

  const toggleMode = () => {
    setMode(mode === 'create' ? 'signin' : 'create');
  };

  return (
    <Screen
      atmosphere="restrained"
      onBack={() => router.back()}
      footer={
        <>
          <Button
            label={busy ? 'Please wait…' : mode === 'create' ? 'Create Account' : 'Sign In'}
            disabled={!canContinue}
            onPress={() => {
              void submit();
            }}
          />
          <Pressable
            onPress={toggleMode}
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'create' ? 'Switch to sign in' : 'Switch to create account'
            }
            style={styles.modeToggle}>
            <XivText variant="caption" muted style={styles.modeText}>
              {mode === 'create' ? 'Already have an account? Sign In' : 'Need an account? Create Account'}
            </XivText>
          </Pressable>
        </>
      }>
      <OnboardingHero
        showMark
        markSize={40}
        kicker="XIV AI · Secure Access"
        title={mode === 'create' ? 'Create your XIV identity.' : 'Welcome back.'}
        support={
          mode === 'create'
            ? 'One secure account connects your XIV experiences while keeping organization and personal permissions separate.'
            : 'Enter your XIV credentials to continue into your intelligence environment.'
        }
      />

      <View style={styles.switcher} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'create' }}
          onPress={() => setMode('create')}
          style={[styles.switchTab, mode === 'create' && styles.switchTabOn]}>
          <XivText variant="caption" color={mode === 'create' ? Palette.white : Palette.textMuted}>
            Create Account
          </XivText>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'signin' }}
          onPress={() => setMode('signin')}
          style={[styles.switchTab, mode === 'signin' && styles.switchTabOn]}>
          <XivText variant="caption" color={mode === 'signin' ? Palette.white : Palette.textMuted}>
            Sign In
          </XivText>
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.duration(360)}>
        <Card variant="elevated" style={styles.authCard}>
          <XivText variant="label" color={Palette.accent}>
            {mode === 'create' ? 'New credentials' : 'XIV credentials'}
          </XivText>
          <View style={styles.fields}>
            {mode === 'create' ? (
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                editable={!busy}
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!busy}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'create' ? 'new-password' : 'password'}
              textContentType={mode === 'create' ? 'newPassword' : 'password'}
              editable={!busy}
            />
            {mode === 'create' ? (
              <Field
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!busy}
              />
            ) : null}
            {mode === 'create' && password.length > 0 && !passwordsMatch ? (
              <View style={styles.warn} accessibilityRole="alert">
                <XivText variant="caption" color={Palette.warning}>
                  Passwords must match.
                </XivText>
              </View>
            ) : null}
          </View>

          {mode === 'create' ? (
            <View style={styles.regionBlock}>
              <XivText variant="caption" muted>
                Country / region
              </XivText>
              <View style={styles.regions}>
                {regions.map((item) => {
                  const selected = item === country;
                  return (
                    <Chip
                      key={item}
                      label={item}
                      selected={selected}
                      onPress={() => setCountry(item)}
                    />
                  );
                })}
              </View>
              <CheckRow
                label="I acknowledge the preview terms"
                detail="This acknowledgement is stored only as a local confirmation before signup."
                selected={terms}
                onPress={() => setTerms((value) => !value)}
              />
            </View>
          ) : null}
        </Card>
      </Animated.View>

      <SecurityBadge
        label="Encrypted access"
        detail="Email and password credentials • Encrypted connection • Private identity"
      />

      {error ? (
        <Card variant="risk" accessibilityRole="alert">
          <XivText variant="label" color={Palette.danger}>
            Unable to continue
          </XivText>
          <XivText variant="body" style={styles.errorBody}>
            {error}
          </XivText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
  switchTab: {
    flex: 1,
    minHeight: Layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  switchTabOn: {
    backgroundColor: Palette.accentMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
  },
  authCard: {
    gap: Spacing.four,
  },
  fields: {
    gap: Spacing.three,
  },
  regionBlock: {
    gap: Spacing.two,
  },
  regions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  warn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    backgroundColor: Palette.warningSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244, 201, 93, 0.28)',
  },
  errorBody: {
    marginTop: Spacing.one,
  },
  modeToggle: {
    minHeight: Layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    textAlign: 'center',
  },
});
