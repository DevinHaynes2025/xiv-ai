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
 * US-SOC-01 — Profiles + daily business articles feed (Consumer/Business).
 * Prototype content pipeline. WAITING_DATA when unbound.
 * Never fabricates live social/engagement metrics. L4 false.
 */
export function ProfilesArticlesFeedScreen() {
  const [view, setView] = useState<ProfilesArticlesView>(() => sessionProfilesArticlesView());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionProfilesArticlesView());
  }, []);

  const onLoadPrototype = () => {
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

  const gateTone = view.status === 'READY' ? 'success' : 'warning';

  return (
    <ExperienceScreen
      title="Profiles + Articles"
      subtitle="US-SOC-01 — daily business articles + prototype profiles. Not live social."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="Prototype/demo content pipeline only. Load the daily feed explicitly. Likes, views, shares, followers, and comments stay WAITING_DATA / null — never fabricated. L4 false; no production mutations." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={PROFILES_ARTICLES_POLICY.label} tone="warning" />
      <XivStatusPill label="liveSocialMetrics: false" tone="warning" />
      <XivStatusPill label="feedCadence: daily" tone="warning" />
      <XivStatusPill label={`Feed: ${view.status}`} tone={gateTone} />
      <XivStatusPill
        label={`Content: ${view.contentGate}`}
        tone={view.contentGate === 'PROTOTYPE_DEMO' ? 'success' : 'warning'}
      />
      <XivStatusPill label="engagement: WAITING_DATA (never fabricated)" tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Prototype pipeline" title="Daily feed controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working…' : 'Load prototype daily feed'}
            variant="subtle"
            disabled={busy}
            onPress={onLoadPrototype}
          />
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

      <SectionHeader kicker="Profiles" title="Prototype profile cards" />
      {view.contentGate === 'PROTOTYPE_DEMO' && view.profiles ? (
        view.profiles.map((profile) => (
          <ModuleCard
            key={profile.id}
            tag={profile.persona.toUpperCase()}
            title={`${profile.displayName} (@${profile.handle})`}
            body={`${profile.headline} · ${profile.industry} · prototypeOnly · liveSocial=false · engagement WAITING_DATA (likes/views/followers null)`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No prototype profiles"
          body="WAITING_DATA — load the prototype daily feed to surface demo profiles. Live social accounts and follower counts are not invented."
        />
      )}

      <SectionHeader kicker="Articles" title="Daily business articles" />
      {view.contentGate === 'PROTOTYPE_DEMO' && view.articles ? (
        view.articles.map((article) => (
          <ModuleCard
            key={article.id}
            tag={article.feedDate}
            title={article.title}
            body={`${article.summary} · topic ${article.topic} · by @${article.authorHandle} · prototypeOnly · publishedLive=false · engagement WAITING_DATA`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No daily articles"
          body="WAITING_DATA — daily business articles appear only after an explicit prototype load. Engagement metrics are never fabricated."
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
