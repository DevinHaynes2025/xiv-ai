import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { XivContentCard } from '@/components/xiv/content-card';
import { XivArticleCard } from '@/components/xiv/xiv-article-card';
import { XivVideoCard } from '@/components/xiv/xiv-video-card';
import { Chip } from '@/components/xiv/chip';
import { CinematicBackdrop } from '@/components/xiv/cinematic-backdrop';
import { EmptyState } from '@/components/xiv/empty-state';
import { NetworkHeader } from '@/components/xiv/network-header';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { XivText } from '@/components/xiv/text';
import { BottomTabInset, Layout, Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { consumerNotifications, feedCategories, professionalFeed } from '@/data/mock';
import { dayGreeting } from '@/lib/greeting';

function matchesInterest(item: (typeof professionalFeed)[number], interests: string[]) {
  if (!interests.length) return true;
  const hay = `${item.category} ${item.tags.join(' ')} ${item.title}`.toLowerCase();
  return interests.some((id) => {
    const token = id.replace(/-/g, ' ');
    return hay.includes(token) || hay.includes(id);
  });
}

export function ProfessionalHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof feedCategories)[number]>('For You');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return professionalFeed.filter((item) => {
      const byCategory =
        category === 'For You'
          ? matchesInterest(item, session.interests)
          : item.category === category;
      if (!byCategory) return false;
      if (!q) return true;
      return `${item.author} ${item.company} ${item.title} ${item.description} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [category, query, session.interests]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CinematicBackdrop atmosphere="restrained" />
      <NetworkHeader
        query={query}
        onQuery={setQuery}
        avatarName={session.displayName || session.email}
        avatarUri={session.avatarUrl || null}
        onAssistant={() => router.navigate('/consumer/assistant' as Href)}
        onMessages={() => router.navigate('/consumer/inbox' as Href)}
        onNotifications={() => setNoticeOpen((value) => !value)}
        onProfile={() => router.navigate('/consumer/profile' as Href)}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <XivText variant="title">{dayGreeting(session.displayName)}</XivText>
          <XivText variant="body" muted>
            {"Here's what matters in your world today."}
          </XivText>
        </View>

        <PrototypeNotice text="This professional feed is a product preview. Cards are labeled DEMO. Search, appreciate, save, and follow stay on this device. The assistant shortcut opens the existing consumer agent workspace — it does not invent a new model." />

        {noticeOpen ? (
          <View style={styles.notice}>
            {consumerNotifications.map((item) => (
              <View key={item.id} style={styles.noticeItem}>
                <XivText variant="label" color={Palette.warning}>
                  DEMO
                </XivText>
                <XivText variant="subtitle">{item.title}</XivText>
                <XivText variant="body" muted>
                  {item.body}
                </XivText>
              </View>
            ))}
            <EmptyState
              title="No live alerts"
              body="A notification service is not connected. These notes are sample copy only."
              ios="bell"
              android="notifications"
            />
          </View>
        ) : null}

        {banner ? (
          <EmptyState title="Preview only" body={banner} ios="info.circle" android="info" />
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}>
          {feedCategories.map((label) => (
            <Chip
              key={label}
              label={label}
              compact
              selected={category === label}
              onPress={() => setCategory(label)}
            />
          ))}
        </ScrollView>

        {items.length ? (
          items.map((item, index) => (
            <Animated.View key={item.id} entering={FadeIn.duration(360).delay(index * 32)}>
              {item.kind === 'video' ? (
                <XivVideoCard
                  author={item.author}
                  role={item.role}
                  company={item.company}
                  industry={item.industry}
                  title={item.title}
                  description={item.description}
                  tags={item.tags}
                  preview={item.preview}
                  duration={item.duration}
                  timestamp={item.timestamp}
                  trustLabel={item.trustLabel}
                  onDiscuss={() =>
                    setBanner('Discussion is a preview. Comments are not stored and no thread is opened.')
                  }
                  onShare={() => setBanner('Sharing is not connected. Nothing left this device.')}
                />
              ) : item.kind === 'article' ? (
                <XivArticleCard
                  author={item.author}
                  role={item.role}
                  company={item.company}
                  industry={item.industry}
                  title={item.title}
                  description={item.description}
                  tags={item.tags}
                  preview={item.preview}
                  readingTime={item.readingTime}
                  timestamp={item.timestamp}
                  trustLabel={item.trustLabel}
                  onPress={() => router.navigate(`/consumer/article/${item.id}` as Href)}
                  onDiscuss={() =>
                    setBanner('Discussion is a preview. Comments are not stored and no thread is opened.')
                  }
                  onShare={() => setBanner('Sharing is not connected. Nothing left this device.')}
                />
              ) : (
                <XivContentCard
                  author={item.author}
                  role={item.role}
                  company={item.company}
                  industry={item.industry}
                  title={item.title}
                  description={item.description}
                  tags={item.tags}
                  kind={item.kind}
                  preview={item.preview}
                  duration={item.duration}
                  readingTime={item.readingTime}
                  timestamp={item.timestamp}
                  pollOptions={item.pollOptions}
                  trustLabel={item.trustLabel}
                  onDiscuss={() =>
                    setBanner('Discussion is a preview. Comments are not stored and no thread is opened.')
                  }
                  onShare={() => setBanner('Sharing is not connected. Nothing left this device.')}
                />
              )}
            </Animated.View>
          ))
        ) : (
          <EmptyState
            title="Nothing in this lane"
            body="No DEMO cards match this search or category. The live professional graph is not connected."
            ios="magnifyingglass"
            android="search"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.navy,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenGutter,
    gap: Spacing.three,
  },
  greeting: {
    gap: 4,
  },
  categories: {
    gap: Spacing.two,
    paddingRight: Layout.screenGutter,
  },
  notice: {
    gap: Spacing.two,
  },
  noticeItem: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: 18,
    backgroundColor: Palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
});
