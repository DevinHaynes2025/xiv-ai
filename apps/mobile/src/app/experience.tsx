import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Icon } from '@/components/xiv/icon';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { useAuth } from '@/hooks/use-auth';
import { useSession } from '@/hooks/use-session';
import { Palette, Spacing } from '@/constants/theme';
import { experiences } from '@/data/mock';
import { experienceRoute } from '@/lib/onboarding';

export default function ChooseExperience() {
  const router = useRouter();
  const { selectExperience } = useSession();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (id: (typeof experiences)[number]['id']) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await selectExperience(id);
      if (result) {
        setError(result);
        return;
      }
      router.replace(experienceRoute(id) as Href);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
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
      <XivText variant="label" color={Palette.accent}>
        Experience
      </XivText>
      <XivText variant="display">Choose how you enter XIV.</XivText>
      <XivText variant="body" muted>
        This stores your role and completes onboarding. You can add another role later.
      </XivText>

      <View style={styles.list}>
        {experiences.map((item) => (
          <Pressable key={item.id} disabled={busy} onPress={() => void choose(item.id)}>
            <Card accent style={styles.card}>
              <View style={styles.icon}>
                <Icon name={{ ios: item.ios, android: item.android, web: item.android }} size={28} />
              </View>
              <XivText variant="title">{item.title}</XivText>
              <XivText variant="body" muted>
                {item.summary}
              </XivText>
            </Card>
          </Pressable>
        ))}
      </View>
      {error ? (
        <XivText variant="body" color={Palette.danger}>
          {error}
        </XivText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  card: {
    gap: Spacing.two,
    minHeight: 148,
    justifyContent: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentMuted,
    marginBottom: Spacing.one,
  },
});
