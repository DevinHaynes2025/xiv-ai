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
  EMPLOYEE_FEEDBACK_POLICY,
  anonymousEmployeeAlias,
  type EmployeeFeedbackCategory,
  type EmployeeFeedbackChannel,
} from '@/lib/ai';
import {
  listDurableEmployeeFeedback,
  sessionEmployeeFeedbackChannel,
  submitAnonymousEmployeeFeedback,
  type EmployeeFeedbackLoadError,
} from '@/lib/employee-feedback';
import { loadPersistedTenant, readTenantSelection } from '@/lib/tenant';

const CATEGORIES: EmployeeFeedbackCategory[] = [
  'wellness',
  'operations',
  'culture',
  'safety',
  'growth',
  'other',
];

/**
 * US-EMP-01 — Anonymous employee feedback channel (employee experience).
 * Alias only on payload. Universe + org tenant scope. WAITING_DATA when unbound.
 * L4 false. Never fabricates durable submissions.
 */
export default function EmployeeFeedbackScreen() {
  const { session } = useSession();
  const alias = useMemo(() => anonymousEmployeeAlias(session.userId), [session.userId]);

  const [category, setCategory] = useState<EmployeeFeedbackCategory>('culture');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [universeId, setUniverseId] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [tenantNote, setTenantNote] = useState('Resolving Universe membership…');
  const [channel, setChannel] = useState<EmployeeFeedbackChannel>(() => sessionEmployeeFeedbackChannel());
  const [dbStatus, setDbStatus] = useState<'READY' | 'WAITING_DATA'>('WAITING_DATA');
  const [dbError, setDbError] = useState<EmployeeFeedbackLoadError | null>(null);
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
        // Prototype lane: allow explicit placeholder scope so session memory still works honestly.
        if (!nextUniverse) nextUniverse = 'placeholder-universe';
        if (!nextOrg) nextOrg = 'placeholder-organization';
        note += ' Using placeholder scope for session-only submissions (not durable).';
      } else {
        note = 'No active Universe membership. Feedback stays WAITING_DATA until membership exists.';
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
      sessionEmployeeFeedbackChannel({
        universeId: nextUniverse || undefined,
        organizationId: nextOrg || undefined,
      }),
    );

    const durable = await listDurableEmployeeFeedback({
      universeId: nextUniverse || undefined,
      organizationId: nextOrg || undefined,
    });
    setDbStatus(durable.status);
    setDbError(durable.error);
    setDurableCount(durable.submissions.length);
  }, [session.userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const gate: 'READY' | 'WAITING_DATA' | 'WAITING_TENANT' =
    !universeId || !organizationId
      ? 'WAITING_TENANT'
      : dbStatus === 'WAITING_DATA' && channel.submissions.length === 0
        ? 'WAITING_DATA'
        : channel.status === 'WAITING_DATA' && dbStatus === 'WAITING_DATA'
          ? 'WAITING_DATA'
          : 'READY';

  const onSubmit = async () => {
    if (!draft.trim() || !universeId || !organizationId || busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      // Intentionally pass displayName to prove strip — must not land on payload.
      const result = await submitAnonymousEmployeeFeedback({
        userId: session.userId,
        category,
        body: draft.trim(),
        universeId,
        organizationId,
        displayName: session.displayName,
        legalName: session.displayName,
      });
      setChannel(result.channel);
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
      title="Anonymous feedback"
      subtitle="US-EMP-01 — speak to the company Universe without exposing legal identity."
    >
      <PrototypeNotice text="Alias-only feedback. Legal name and display name are never stored on the feedback payload. Durable rows require xiv_employee_feedback + Universe RLS; otherwise WAITING_DATA." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={EMPLOYEE_FEEDBACK_POLICY.label} tone="warning" />
      <XivStatusPill label={`Gate: ${gate}`} tone={gate === 'READY' ? 'success' : 'warning'} />
      <XivStatusPill
        label={`Durable DB: ${dbStatus}`}
        tone={dbStatus === 'READY' ? 'success' : 'warning'}
      />

      <Card style={styles.card}>
        <SectionHeader kicker="Alias" title="How this submission appears" />
        <XivText variant="subtitle">{alias}</XivText>
        <XivText variant="caption" muted>
          Derived on-device from your account id. Profile display name is not attached to feedback.
        </XivText>
        <XivText variant="caption" muted>
          {tenantNote}
        </XivText>
      </Card>

      {dbStatus === 'WAITING_DATA' ? (
        <XivText variant="caption" color={Palette.warning}>
          WAITING_DATA — durable xiv_employee_feedback unavailable
          {dbError ? ` (${dbError.kind}: ${dbError.code})` : ''}. Session submissions are local only; none are
          fabricated.
          {dbError?.hint ? ` ${dbError.hint}` : ''}
        </XivText>
      ) : (
        <XivText variant="caption" muted>
          Durable rows visible under RLS: {durableCount}
        </XivText>
      )}

      <SectionHeader kicker="Submit" title="Structured feedback" />
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
      <Field
        label="Feedback"
        placeholder="What should leaders know? Keep it specific to the floor."
        value={draft}
        onChangeText={setDraft}
      />
      <Button
        label={busy ? 'Submitting…' : 'Submit anonymously'}
        variant="subtle"
        disabled={!draft.trim() || !universeId || !organizationId || busy}
        onPress={() => void onSubmit()}
      />
      {localError ? (
        <XivText variant="caption" color={Palette.warning}>
          {localError}
        </XivText>
      ) : null}

      <SectionHeader kicker="Session" title="Your submissions (this device)" />
      <XivText variant="caption" muted>
        {channel.note}
      </XivText>
      {channel.submissions.length === 0 ? (
        <ModuleCard
          tag="WAITING_DATA"
          title="No session submissions yet"
          body="Nothing is invented. Submit above to record an alias-only entry in session memory."
        />
      ) : (
        channel.submissions.map((item) => (
          <ModuleCard
            key={item.id}
            tag={item.payload.category}
            title={item.payload.body}
            body={`Alias ${item.payload.alias} · ${item.source} · universe ${item.payload.universeId.slice(0, 8)}…`}
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

