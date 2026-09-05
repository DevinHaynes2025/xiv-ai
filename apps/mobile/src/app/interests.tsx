import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Screen } from '@/components/xiv/screen';
import { SelectableCard } from '@/components/xiv/selectable-card';
import { XivText } from '@/components/xiv/text';
import { useSession } from '@/hooks/use-session';
import { Palette, Spacing } from '@/constants/theme';
import { interests } from '@/data/mock';

export default function Interests() {
  const router = useRouter();
  const { session, saveInterests } = useSession();
  const [selected, setSelected] = useState<string[]>(
    session.interests.length > 0 ? session.interests : ['entrepreneurship', 'ai', 'africa-business'],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await saveInterests(selected);
      if (result) {
        setError(result);
        return;
      }
      router.push('/experience');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      onBack={() => router.back()}
      footer={
        <Button
          label={busy ? 'Saving…' : 'Choose experience'}
          disabled={selected.length === 0 || busy}
          onPress={() => {
            void submit();
          }}
        />
      }>
      <XivText variant="label" color={Palette.accent}>
        Interests
      </XivText>
      <XivText variant="display">What should XIV watch for you?</XivText>
      <XivText variant="body" muted>
        Select one or more domains. These are saved to your account and will not be duplicated.
      </XivText>
      <View style={styles.wrap}>
        {interests.map((item) => (
          <SelectableCard
            key={item.id}
            label={item.label}
            selected={selected.includes(item.id)}
            onPress={() => toggle(item.id)}
          />
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});

