import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { XivStatusPill } from '@/components/premium';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import {
  PROFILES_ARTICLES_POLICY,
  type ProfilesArticlesView,
} from '@/lib/ai';
import {
  clearSessionPrototypeProfilesArticlesFeed,
  loadSessionPrototypeProfilesArticlesFeed,
  sessionProfilesArticlesView,
} from '@/lib/profiles-articles';

/**
 * US-SOC-01 — Daily business articles companion screen.
 * Prototype drafts only. WAITING_DATA when unbound. Never fabricates engagement.
 */
export function BusinessArticlesFeedScreen() {
  const [view, setView] = useState<ProfilesArticlesView>(() => sessionProfilesArticlesView());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionProfilesArticlesView());
  }, []);

  const onLoad = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(loadSessionPrototypeProfilesArticlesFeed().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'prototype_load_failed');
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionPrototypeProfilesArticlesFeed().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'prototype_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ExperienceScreen
      title="Daily Business Articles"
      subtitle="US-SOC-01 — prototype daily feed. Not live social engagement."
    >
      <PrototypeNotice text="Articles are prototype/demo drafts for the daily slot. Engagement (likes/views/shares) stays WAITING_DATA / null. Companion to Profiles + Articles." />

      <XivStatusPill label={PROFILES_ARTICLES_POLICY.label} tone="warning" />
      <XivStatusPill
        label={`Gate: ${view.contentGate}`}
        tone={view.contentGate === 'PROTOTYPE_DEMO' ? 'success' : 'warning'}
      />
      <XivStatusPill label="engagement: WAITING_DATA" tone="warning" />
      <XivStatusPill label="L4: false · productionMutation: false" tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Daily slot" title="Prototype articles" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <View style={styles.chips}>
          <Button label={busy ? 'Working…' : 'Load prototype daily feed'} variant="subtle" disabled={busy} onPress={onLoad} />
          <Button
            label="Clear feed"
            variant="subtle"
            disabled={busy || view.contentGate !== 'PROTOTYPE_DEMO'}
            onPress={onClear}
          />
          <Button label="Refresh" variant="subtle" disabled={busy} onPress={refresh} />
        </View>
        {localError ? (
          <XivText variant="caption" color={Palette.warning}>
            {localError}
          </XivText>
        ) : null}
      </Card>

      {view.contentGate === 'PROTOTYPE_DEMO' && view.articles ? (
        view.articles.map((article) => (
          <ModuleCard
            key={article.id}
            tag={article.feedDate}
            title={article.title}
            body={`${article.summary} · @${article.authorHandle} · publishedLive=false · engagement WAITING_DATA`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No daily articles"
          body="WAITING_DATA — load the prototype daily feed. Engagement metrics are never fabricated."
        />
      )}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
});
