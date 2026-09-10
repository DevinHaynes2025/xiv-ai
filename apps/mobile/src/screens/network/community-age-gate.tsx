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
import { COMMUNITY_AGE_GATE_POLICY, type CommunityAgeGateView } from '@/lib/ai';
import {
  DEFAULT_DEMO_COM_TENANT_ID,
  DEFAULT_DEMO_COM_UNIVERSE_ID,
  acknowledgeSessionCommunityAgeGate,
  attemptSessionGatedCommunityEntry,
  bindSessionCommunityAgeGateFixture,
  clearSessionCommunityAgeGateFixture,
  clearSessionCommunityPolicyDenials,
  probeSessionCommunityPolicyDenials,
  selectSessionGatedCommunity,
  sessionCommunityAgeGateView,
} from '@/lib/community-age-gate';

/**
 * US-COM-01 -- Community age-gate + rules acknowledgment (Consumer/Business/Executive).
 * LOCAL/SIMULATION stubs. 18+ ack required. Waiver flags are SIMULATION -- not live legal.
 * Anti-predator / anti-bully denial stubs. Non-sexual cultural community framing.
 * WAITING_* honesty; L4 false; productionMutation false.
 */
export function CommunityAgeGateScreen() {
  const [view, setView] = useState<CommunityAgeGateView>(() =>
    sessionCommunityAgeGateView({
      tenantId: DEFAULT_DEMO_COM_TENANT_ID,
      universeId: DEFAULT_DEMO_COM_UNIVERSE_ID,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(
      sessionCommunityAgeGateView({
        tenantId: DEFAULT_DEMO_COM_TENANT_ID,
        universeId: DEFAULT_DEMO_COM_UNIVERSE_ID,
      }),
    );
  }, []);

  const run = (fn: () => void, fallback: string) => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      fn();
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const gateTone =
    view.communityAgeGate === 'FIXTURE_SIMULATION' && view.status === 'WAITING_PROVIDER'
      ? 'warning'
      : view.communityAgeGate === 'GATE_DENIED' ||
          view.communityAgeGate === 'AGE_GATE_REQUIRED' ||
          view.communityAgeGate === 'RULES_ACK_REQUIRED' ||
          view.communityAgeGate === 'WAITING_DATA'
        ? 'warning'
        : 'success';

  return (
    <ExperienceScreen
      title="Community Age Gate"
      subtitle="US-COM-01 -- 18+ + rules acknowledgment stubs. SIMULATION only. Non-sexual cultural framing."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="LOCAL/SIMULATION community age-gate. 18+ acknowledgment required for gated communities. Waiver/contract flags are SIMULATION -- not live legal contracts. Anti-predator and anti-bully denials are stubs (liveIncident=false). Copy stays non-sexual cultural / professional / civic. liveAgeVerification=false; liveLegalWaiver=false; L4 false; productionMutation false." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label="productionMutation: false" tone="warning" />
      <XivStatusPill label="liveLegalWaiver: false (SIMULATION)" tone="warning" />
      <XivStatusPill label="liveAgeVerification: false" tone="warning" />
      <XivStatusPill label="sexualFraming: false" tone="warning" />
      <XivStatusPill label={COMMUNITY_AGE_GATE_POLICY.label} tone="warning" />
      <XivStatusPill label={`Gate: ${view.communityAgeGate}`} tone={gateTone} />
      <XivStatusPill label={`Status: ${view.status}`} tone={gateTone} />

      <Card style={styles.card}>
        <SectionHeader kicker="SIMULATION" title="Age-gate + rules controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working…' : 'Bind fixture'}
            variant="subtle"
            disabled={busy}
            onPress={() =>
              run(() => {
                setView(
                  bindSessionCommunityAgeGateFixture({
                    tenantId: DEFAULT_DEMO_COM_TENANT_ID,
                    universeId: DEFAULT_DEMO_COM_UNIVERSE_ID,
                  }).view,
                );
              }, 'community_age_gate_bind_failed')
            }
          />
          <Button
            label="Ack 18+"
            variant="subtle"
            disabled={busy || view.communityAgeGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(
                  acknowledgeSessionCommunityAgeGate({ age18PlusAcknowledged: true }).view,
                );
              }, 'age_ack_failed')
            }
          />
          <Button
            label="Ack rules/waiver"
            variant="subtle"
            disabled={busy || view.communityAgeGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(
                  acknowledgeSessionCommunityAgeGate({
                    waiverContractAcknowledged: true,
                    antiPredatorAcknowledged: true,
                    antiBullyAcknowledged: true,
                  }).view,
                );
              }, 'rules_ack_failed')
            }
          />
          <Button
            label="Attempt entry"
            variant="subtle"
            disabled={busy || view.communityAgeGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(attemptSessionGatedCommunityEntry().view);
              }, 'entry_attempt_failed')
            }
          />
          <Button
            label="Probe denial stubs"
            variant="subtle"
            disabled={busy || view.communityAgeGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(probeSessionCommunityPolicyDenials().view);
              }, 'denial_probe_failed')
            }
          />
          <Button
            label="Clear denials"
            variant="subtle"
            disabled={busy || !view.policyDenials?.length}
            onPress={() =>
              run(() => {
                setView(clearSessionCommunityPolicyDenials().view);
              }, 'denial_clear_failed')
            }
          />
          <Button
            label="Clear fixture"
            variant="subtle"
            disabled={busy || view.communityAgeGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(clearSessionCommunityAgeGateFixture().view);
              }, 'fixture_clear_failed')
            }
          />
          <Button label="Refresh" variant="subtle" disabled={busy} onPress={refresh} />
        </View>
        {localError ? (
          <XivText variant="caption" color={Palette.warning}>
            {localError}
          </XivText>
        ) : null}
      </Card>

      <SectionHeader kicker="Acknowledgments" title="SIMULATION flags (not live legal)" />
      {view.ack ? (
        <ModuleCard
          tag="ACK"
          title="Local acknowledgment flags"
          body={`18+=${view.ack.age18PlusAcknowledged}; waiver=${view.ack.waiverContractAcknowledged}; antiPredator=${view.ack.antiPredatorAcknowledged}; antiBully=${view.ack.antiBullyAcknowledged}; liveLegal=false; liveAgeVerification=false`}
        />
      ) : (
        <ModuleCard tag="WAITING_DATA" title="No acknowledgments" body="Bind a SIMULATION fixture first." />
      )}

      <SectionHeader kicker="Gated communities" title="Non-sexual cultural / professional stubs" />
      {view.communities && view.communities.length > 0 ? (
        view.communities.map((community) => (
          <ModuleCard
            key={community.communityId}
            tag={community.framing}
            title={community.name}
            body={`${community.description} · ageGated=${community.ageGated} · sexualFraming=${community.sexualFraming}`}
            onPress={
              busy
                ? undefined
                : () =>
                    run(() => {
                      setView(selectSessionGatedCommunity(community.communityId).view);
                    }, 'select_community_failed')
            }
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No gated communities bound"
          body="communities=null until an explicit SIMULATION fixture is bound."
        />
      )}

      <SectionHeader kicker="Age-gate card" title="Selected community entry state" />
      {view.ageGateCard ? (
        <ModuleCard
          tag={view.ageGateCard.entryAllowed ? 'ENTRY_OK_SIM' : 'BLOCKED'}
          title={view.ageGateCard.name}
          body={`entryAllowed=${view.ageGateCard.entryAllowed}; blocking=${view.ageGateCard.blockingReasons.join(',') || 'none'}; liveLegalWaiver=false; liveAgeVerification=false; sexualFraming=false`}
        />
      ) : (
        <ModuleCard tag="null" title="ageGateCard=null" body="Unbound, denied, or scope mismatch." />
      )}

      <SectionHeader kicker="Policy denials" title="Anti-predator / anti-bully stubs" />
      {view.policyDenials && view.policyDenials.length > 0 ? (
        view.policyDenials.map((denial) => (
          <ModuleCard
            key={denial.id}
            tag={denial.kind}
            title={`${denial.verdict} · liveIncident=false`}
            body={`${denial.reason} · community=${denial.communityId ?? 'n/a'}`}
          />
        ))
      ) : (
        <ModuleCard
          tag="none"
          title="No denial stubs recorded"
          body="Probe denial stubs to surface ANTI_PREDATOR / ANTI_BULLY / AGE_GATE / RULES_REQUIRED. Not a live incident feed."
        />
      )}

      <SectionHeader kicker="Providers" title="WAITING_* honesty" />
      <ModuleCard
        tag="WAITING"
        title="Waiting providers"
        body={view.waitingProviders.join(', ') || 'none'}
      />
      <ModuleCard
        tag="READY"
        title="Ready local stubs"
        body={view.readyProviders.join(', ') || 'none'}
      />
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
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
