import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Icon } from '@/components/xiv/icon';
import { OnboardingHero } from '@/components/xiv/onboarding-hero';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { Palette, Radius, Shadows, Spacing } from '@/constants/theme';
import { experiences } from '@/data/mock';
import { useAuth } from '@/hooks/use-auth';
import { useSession } from '@/hooks/use-session';
import { experienceRoute } from '@/lib/onboarding';
import type { RoleId } from '@/types/session';

const EXPERIENCE_COPY: Record<RoleId, { name: string; description: string }> = {
  consumer: {
    name: 'Consumer',
    description: 'Discover businesses, knowledge, communities, opportunities, and innovation.',
  },
  employee: {
    name: 'Employee',
    description: 'Learn, contribute, communicate, improve work, and share protected insight.',
  },
  business_owner: {
    name: 'Business',
    description: 'Operate your organization with connected intelligence and AI tools.',
  },
  executive: {
    name: 'Executive',
    description: 'See performance, risk, decisions, and strategic intelligence across the organization.',
  },
  entrepreneur: {
    name: 'Entrepreneur',
    description: 'Discover, connect, contribute, and build with XIV intelligence.',
  },
};

export default function ChooseExperience() {
  const router = useRouter();
  const { selectExperience } = useSession();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<RoleId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (id: (typeof experiences)[number]['id']) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    setPending(id);
    try {
      const result = await selectExperience(id);
      if (result) {
        setError(result);
        return;
      }
      router.replace(experienceRoute(id) as Href);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <Screen
      atmosphere="restrained"
      onBack={() => router.back()}
      footer={
        <Button
          label="Sign out"
          variant="subtle"
          onPress={() => {
            void signOut().then(() => router.replace('/welcome'));
          }}
        />
      }>
      <OnboardingHero
        markSize={40}
        kicker="XIV AI"
        title="Choose your XIV experience."
        support="XIV adapts its intelligence, tools, and network to the way you participate."
      />

      <View style={styles.list}>
        {experiences.map((item) => {
          const copy = EXPERIENCE_COPY[item.id];
          const selected = pending === item.id;
          return (
            <Pressable
              key={item.id}
              disabled={busy}
              onPress={() => void choose(item.id)}
              accessibilityRole="button"
              accessibilityLabel={copy.name}
              accessibilityState={{ selected, disabled: busy }}>
              <Card variant={selected ? 'hero' : 'accent'} style={[styles.card, selected && styles.cardOn]}>
                <View style={[styles.icon, selected && styles.iconOn]}>
                  <Icon name={{ ios: item.ios, android: item.android, web: item.android }} size={26} />
                </View>
                <XivText variant="title">{copy.name}</XivText>
                <XivText variant="body" muted>
                  {copy.description}
                </XivText>
              </Card>
            </Pressable>
          );
        })}
      </View>
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
  list: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    minHeight: 132,
    justifyContent: 'center',
  },
  cardOn: {
    ...Shadows.intelligence,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentMuted,
    marginBottom: Spacing.one,
  },
  iconOn: {
    backgroundColor: Palette.intelligenceSoft,
  },
  errorBody: {
    marginTop: Spacing.one,
  },
});
