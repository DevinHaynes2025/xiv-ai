import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { XivStatusPill } from '@/components/premium';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { Field } from '@/components/xiv/field';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import {
  CONSUMER_INNOVATE_POLICY,
  consumerHandleFromIdentity,
  type ConsumerIdeaCategory,
  type ConsumerIdeaStage,
  type ConsumerInnovateChannel,
} from '@/lib/ai';
import {
  listDurableConsumerIdeas,
  sessionConsumerInnovateChannel,
  submitConsumerInnovateIdea,
  type ConsumerInnovateLoadError,
} from '@/lib/consumer-innovate';
import { loadPersistedTenant, readTenantSelection } from '@/lib/tenant';

const CATEGORIES: ConsumerIdeaCategory[] = [
  'feature',
  'early_access',
  'experience',
  'accessibility',
  'other',
];

const STAGES: ConsumerIdeaStage[] = ['proposal', 'early_access_interest'];

/**
 * US-CON-01 — Consumer innovate / early access loop.
 * Named consumer handle (separate from employee anonymous alias).
 * Ideas are proposals only — not production changes. L4 false.
 * WAITING_DATA when unbound; never fabricate acceptance metrics.
 */
export default function ConsumerInnovateScreen() {
  const { session } = useSession();
  const handle = useMemo(
    () =>
      consumerHandleFromIdentity({
        userId: session.userId,
        preferredHandle: session.displayName || null,
      }),
    [session.userId, session.displayName],
  );

  const [category, setCategory] = useState<ConsumerIdeaCategory>('feature');
  const [stage, setStage] = useState<ConsumerIdeaStage>('proposal');
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [universeId, setUniverseId] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [tenantNote, setTenantNote] = useState('Resolving Universe membership…');
  const [channel, setChannel] = useState<ConsumerInnovateChannel>(() => sessionConsumerInnovateChannel());
  const [dbStatus, setDbStatus] = useState<'READY' | 'WAITING_DATA'>('WAITING_DATA');
  const [dbError, setDbError] = useState<ConsumerInnovateLoadError | null>(null);
  const [durableCount, setDurableCount] = useState(0);

  const refresh = useCallback(async () => {
    const selection = readTenantSelection(session.userId);
    let nextUniverse = selection.universeId ?? '';
    let nextOrg = selection.organizationId ?? '';
    let note = 'Using saved tenant selection when present.';

    try {
      const loaded = await loadPersistedTenant(session.userId, selection);
      if (loaded.context.activeUniverse?.id) {
        nextUniverse = loaded.context.activeUniverse.id;
        nextOrg = loaded.context.activeOrganization?.id ?? nextOrg;
        note = `Universe ${loaded.context.activeUniverse.name} · org scoped via membership RLS.`;
      } else if (loaded.context.persistenceStatus !== 'ready') {
        note = loaded.context.error ?? `Tenant persistence: ${loaded.context.persistenceStatus}`;
        if (!nextUniverse) nextUniverse = 'placeholder-universe';
        if (!nextOrg) nextOrg = 'placeholder-organization';
        note += ' Using placeholder scope for session-only proposals (not durable).';
      } else {
        note = 'No active Universe membership. Innovate stays WAITING_DATA until membership exists.';
        if (!nextUniverse) nextUniverse = '';
        if (!nextOrg) nextOrg = '';
      }
    } catch (caught) {
      note = caught instanceof Error ? caught.message : 'tenant_load_failed';
      if (!nextUniverse) nextUniverse = 'placeholder-universe';
      if (!nextOrg) nextOrg = 'placeholder-organization';
    }

    setUniverseId(nextUniverse);
    setOrganizationId(nextOrg);
    setTenantNote(note);
    setChannel(
      sessionConsumerInnovateChannel({
        universeId: nextUniverse || undefined,
        organizationId: nextOrg || undefined,
      }),
    );

    const durable = await listDurableConsumerIdeas({
      universeId: nextUniverse || undefined,
      organizationId: nextOrg || undefined,
    });
    setDbStatus(durable.status);
    setDbError(durable.error);
    setDurableCount(durable.ideas.length);
  }, [session.userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const gate: 'READY' | 'WAITING_DATA' | 'WAITING_TENANT' =
    !universeId || !organizationId
      ? 'WAITING_TENANT'
      : dbStatus === 'WAITING_DATA' && channel.ideas.length === 0
        ? 'WAITING_DATA'
        : channel.status === 'WAITING_DATA' && dbStatus === 'WAITING_DATA'
          ? 'WAITING_DATA'
          : 'READY';

  const onSubmit = async () => {
    if (!title.trim() || !draft.trim() || !universeId || !organizationId || busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      const result = await submitConsumerInnovateIdea({
        userId: session.userId,
        preferredHandle: session.displayName || null,
        title: title.trim(),
        body: draft.trim(),
        category,
        stage,
        universeId,
        organizationId,
      });
      setChannel(result.channel);
      setTitle('');
      setDraft('');
      await refresh();
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'submit_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ExperienceScreen
      title="Innovate / early access"
      subtitle="US-CON-01 — propose consumer ideas into your Universe. Proposals only."
    >
      <PrototypeNotice text="Named consumer handle identity (not employee anonymous alias). Ideas are proposals — not production changes. Durable rows require xiv_consumer_ideas + Universe RLS; acceptance metrics stay WAITING_DATA until a real metrics source binds." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={CONSUMER_INNOVATE_POLICY.label} tone="warning" />
      <XivStatusPill label="proposalOnly: true" tone="success" />
      <XivStatusPill label={`Gate: ${gate}`} tone={gate === 'READY' ? 'success' : 'warning'} />
      <XivStatusPill
        label={`Durable DB: ${dbStatus}`}
        tone={dbStatus === 'READY' ? 'success' : 'warning'}
      />
      <XivStatusPill label="Acceptance metrics: WAITING_DATA" tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Consumer identity" title="How this proposal is attributed" />
        <XivText variant="subtitle">{handle}</XivText>
        <XivText variant="caption" muted>
          Named consumer handle model — separate from employee anonymous alias. Profile display name becomes the preferred handle when present.
        </XivText>
        <XivText variant="caption" muted>
          {tenantNote}
        </XivText>
      </Card>

      {dbStatus === 'WAITING_DATA' ? (
        <XivText variant="caption" color={Palette.warning}>
          WAITING_DATA — durable xiv_consumer_ideas unavailable
          {dbError ? ` (${dbError.kind}: ${dbError.code})` : ''}. Session proposals are local only; none are
          fabricated. Acceptance metrics are not invented.
          {dbError?.hint ? ` ${dbError.hint}` : ''}
        </XivText>
      ) : (
        <XivText variant="caption" muted>
          Durable proposal rows visible under RLS: {durableCount}. Acceptance metrics: WAITING_DATA.
        </XivText>
      )}

      <SectionHeader kicker="Submit" title="Structured idea proposal" />
      <XivText variant="label" color={Palette.accent}>
        Category
      </XivText>
      <View style={styles.chips}>
        {CATEGORIES.map((item) => (
          <Button
            key={item}
            label={item}
            variant={category === item ? 'primary' : 'subtle'}
            onPress={() => setCategory(item)}
          />
        ))}
      </View>
      <XivText variant="label" color={Palette.accent}>
        Stage
      </XivText>
      <View style={styles.chips}>
        {STAGES.map((item) => (
          <Button
            key={item}
            label={item}
            variant={stage === item ? 'primary' : 'subtle'}
            onPress={() => setStage(item)}
          />
        ))}
      </View>
      <Field
        label="Title"
        placeholder="Short name for the idea"
        value={title}
        onChangeText={setTitle}
      />
      <Field
        label="Proposal"
        placeholder="What should the product try? Keep it specific. This is a proposal, not a live change."
        value={draft}
        onChangeText={setDraft}
      />
      <Button
        label={busy ? 'Submitting…' : 'Submit proposal'}
        variant="subtle"
        disabled={!title.trim() || !draft.trim() || !universeId || !organizationId || busy}
        onPress={() => void onSubmit()}
      />
      {localError ? (
        <XivText variant="caption" color={Palette.warning}>
          {localError}
        </XivText>
      ) : null}

      <SectionHeader kicker="Session" title="Your proposals (this device)" />
      <XivText variant="caption" muted>
        {channel.note}
      </XivText>
      {channel.ideas.length === 0 ? (
        <ModuleCard
          tag="WAITING_DATA"
          title="No session proposals yet"
          body="Nothing is invented. Submit above to record a named consumer proposal in session memory."
        />
      ) : (
        channel.ideas.map((item) => (
          <ModuleCard
            key={item.id}
            tag={`${item.payload.category} · ${item.payload.stage}`}
            title={item.payload.title}
            body={`${item.payload.body}\nHandle ${item.payload.consumerHandle} · ${item.source} · proposalOnly · metrics ${item.acceptanceMetrics}`}
          />
        ))
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
    marginBottom: Spacing.two,
  },
});
