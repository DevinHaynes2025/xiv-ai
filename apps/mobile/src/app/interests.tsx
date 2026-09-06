import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { OnboardingHero } from '@/components/xiv/onboarding-hero';
import { Screen } from '@/components/xiv/screen';
import { SelectableCard } from '@/components/xiv/selectable-card';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { interests } from '@/data/mock';
import { useSession } from '@/hooks/use-session';

const INTEREST_CATEGORY: Record<string, 'Subjects' | 'Industries' | 'Opportunities'> = {
  ai: 'Subjects',
  technology: 'Subjects',
  entrepreneurship: 'Subjects',
  startups: 'Subjects',
  'supply-chain': 'Industries',
  retail: 'Industries',
  manufacturing: 'Industries',
  finance: 'Industries',
  healthcare: 'Industries',
  'real-estate': 'Industries',
  marketing: 'Industries',
  'africa-business': 'Industries',
  wellness: 'Opportunities',
  sustainability: 'Opportunities',
};

const CATEGORY_ORDER = ['Subjects', 'Industries', 'Opportunities'] as const;

export default function Interests() {
  const router = useRouter();
  const { session, saveInterests } = useSession();
  const [selected, setSelected] = useState<string[]>(
    session.interests.length > 0 ? session.interests : ['entrepreneurship', 'ai', 'africa-business'],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, (typeof interests)[number][]>();
    for (const item of interests) {
      const category = INTEREST_CATEGORY[item.id] ?? 'More';
      const list = map.get(category) ?? [];
      list.push(item);
      map.set(category, list);
    }
    const ordered: { title: string; items: (typeof interests)[number][] }[] = CATEGORY_ORDER.filter(
      (category) => map.has(category),
    ).map((category) => ({
      title: category,
      items: map.get(category) ?? [],
    }));
    const extra = map.get('More');
    if (extra?.length) {
      ordered.push({ title: 'More', items: extra });
    }
    return ordered;
  }, []);

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
      atmosphere="restrained"
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
      <OnboardingHero
        markSize={40}
        kicker="XIV AI"
        title="What should XIV understand about you?"
        support="Choose the subjects, industries, and opportunities you want your XIV environment to prioritize."
      />

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <XivText variant="label" color={Palette.textDim}>
            {group.title}
          </XivText>
          <View style={styles.wrap}>
            {group.items.map((item) => (
              <SelectableCard
                key={item.id}
                label={item.label}
                selected={selected.includes(item.id)}
                onPress={() => toggle(item.id)}
              />
            ))}
          </View>
        </View>
      ))}

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
  group: {
    gap: Spacing.two,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  errorBody: {
    marginTop: Spacing.one,
  },
});
