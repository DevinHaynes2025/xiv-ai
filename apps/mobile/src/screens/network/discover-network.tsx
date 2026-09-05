import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/xiv/chip';
import { EmptyState } from '@/components/xiv/empty-state';
import { XivEntityCard } from '@/components/xiv/entity-card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { Spacing } from '@/constants/theme';
import { industryHubs } from '@/data/industry-hubs';
import { discoverCategories, discoverEntities } from '@/data/mock';

export function DiscoverNetwork() {
  const router = useRouter();
  const [kind, setKind] = useState<(typeof discoverCategories)[number]>('Companies');
  const [followed, setFollowed] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const items = useMemo(() => discoverEntities.filter((item) => item.kind === kind), [kind]);

  return (
    <ExperienceScreen title="Discover" subtitle="Companies, products, and people entering the map.">
      <PrototypeNotice text="Discover is a catalog preview. Follow and Explore are local UI only. No graph, follow table, or company record is written. Industry hubs below are DEMO architecture." />
      <SectionHeader kicker="Verticals" title="Industry hubs" />
      {industryHubs.map((hub) => (
        <ModuleCard
          key={hub.id}
          tag="DEMO"
          title={hub.name}
          body={hub.summary}
          onPress={() => router.navigate(`/consumer/hubs/${hub.id}` as Href)}
        />
      ))}
      <SectionHeader kicker="Atlas" title="Browse the network" />
      <View style={styles.categories}>
        {discoverCategories.map((label) => (
          <Chip
            key={label}
            label={label}
            compact
            selected={kind === label}
            onPress={() => {
              setKind(label);
              setNote(null);
            }}
          />
        ))}
      </View>
      {note ? <EmptyState title="Preview only" body={note} ios="info.circle" android="info" /> : null}
      {items.length ? (
        items.map((item) => (
          <XivEntityCard
            key={item.id}
            name={item.name}
            detail={item.detail}
            meta={item.meta}
            followed={followed.includes(item.id)}
            onFollow={() =>
              setFollowed((current) =>
                current.includes(item.id)
                  ? current.filter((id) => id !== item.id)
                  : [...current, item.id],
              )
            }
            onExplore={() =>
              setNote(`${item.name} is a DEMO record. A live company or creator profile is not connected.`)
            }
          />
        ))
      ) : (
        <EmptyState
          title="Nothing listed"
          body="This lane has no DEMO records yet. The live atlas is not connected."
        />
      )}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
