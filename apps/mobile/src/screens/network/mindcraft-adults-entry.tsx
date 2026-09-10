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
import { MINDCRAFT_ADULTS_ENTRY_POLICY, type MindcraftAdultsEntryView } from '@/lib/ai';
import {
  DEFAULT_DEMO_MC_TENANT_ID,
  DEFAULT_DEMO_MC_UNIVERSE_ID,
  acknowledgeSessionMindcraftAdultsEntry,
  attemptSessionMindcraftRoomEntry,
  bindSessionMindcraftAdultsEntryFixture,
  clearSessionMindcraftAdultsEntryFixture,
  clearSessionMindcraftPolicyDenials,
  probeSessionMindcraftPolicyDenials,
  selectSessionMindcraftRoom,
  sessionMindcraftAdultsEntryView,
} from '@/lib/mindcraft-adults-entry';

/**
 * US-MC-01 -- Adult Mindcraft gated rooms (Consumer/Business/Executive).
 * LOCAL/SIMULATION stubs. 18+ ack required. Waiver flags are SIMULATION -- not live legal.
 * US-COM-01 deny codes. Non-sexual cultural framing. Clothing-optional only culture-gallery heritage/edu.
 * WAITING_* honesty; L4 false; productionMutation false.
 */
export function MindcraftAdultsEntryScreen() {
  const [view, setView] = useState<MindcraftAdultsEntryView>(() =>
    sessionMindcraftAdultsEntryView({
      tenantId: DEFAULT_DEMO_MC_TENANT_ID,
      universeId: DEFAULT_DEMO_MC_UNIVERSE_ID,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastAttemptAllowed, setLastAttemptAllowed] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    setView(
      sessionMindcraftAdultsEntryView({
        tenantId: DEFAULT_DEMO_MC_TENANT_ID,
        universeId: DEFAULT_DEMO_MC_UNIVERSE_ID,
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
    view.mindcraftGate === 'FIXTURE_SIMULATION' && view.status === 'WAITING_PROVIDER'
      ? 'warning'
      : view.mindcraftGate === 'GATE_DENIED' ||
          view.mindcraftGate === 'AGE_GATE_REQUIRED' ||
          view.mindcraftGate === 'RULES_ACK_REQUIRED' ||
          view.mindcraftGate === 'WAITING_DATA'
        ? 'warning'
        : 'success';

  return (
    <ExperienceScreen
      title="Mindcraft Adults Entry"
      subtitle="US-MC-01 -- 18+ gated Mindcraft rooms. SIMULATION only. NON-SEXUAL cultural/educational."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="LOCAL/SIMULATION Adult Mindcraft entry. 18+ acknowledgment required. Waiver/ToS flags are SIMULATION -- not live legal. Clothing-optional only in culture-gallery (heritage/education; Cultural Steward soft-YES). Trust Safety soft-YES + Ethics Twin BIND GO. US-COM-01 deny codes. liveAgeVerification=false; liveMindcraftWorld=false; L4 false; productionMutation false. No PRODUCTION." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label="productionMutation: false" tone="warning" />
      <XivStatusPill label="liveLegalWaiver: false (SIMULATION)" tone="warning" />
      <XivStatusPill label="liveAgeVerification: false" tone="warning" />
      <XivStatusPill label="liveMindcraftWorld: false" tone="warning" />
      <XivStatusPill label="sexualFraming: false" tone="warning" />
      <XivStatusPill label="clothing-optional: culture-gallery heritage/edu only" tone="warning" />
      <XivStatusPill label={MINDCRAFT_ADULTS_ENTRY_POLICY.label} tone="warning" />
      <XivStatusPill label={`Story: ${MINDCRAFT_ADULTS_ENTRY_POLICY.storyId}`} tone="warning" />
      <XivStatusPill label={`Gate: ${view.mindcraftGate}`} tone={gateTone} />
      <XivStatusPill label={`Status: ${view.status}`} tone={gateTone} />

      <Card style={styles.card}>
        <SectionHeader kicker="SIMULATION" title="Mindcraft 18+ entry controls" />
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
                setLastAttemptAllowed(null);
                setView(
                  bindSessionMindcraftAdultsEntryFixture({
                    tenantId: DEFAULT_DEMO_MC_TENANT_ID,
                    universeId: DEFAULT_DEMO_MC_UNIVERSE_ID,
                  }).view,
                );
              }, 'mindcraft_bind_failed')
            }
          />
          <Button
            label="Ack 18+"
            variant="subtle"
            disabled={busy || view.mindcraftGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(
                  acknowledgeSessionMindcraftAdultsEntry({ age18PlusAcknowledged: true }).view,
                );
              }, 'mindcraft_age_ack_failed')
            }
          />
          <Button
            label="Ack rules/waiver"
            variant="subtle"
            disabled={busy || view.mindcraftGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(
                  acknowledgeSessionMindcraftAdultsEntry({
                    tosRulesAcknowledged: true,
                    waiverAcknowledged: true,
                    antiPredatorAcknowledged: true,
                    antiBullyAcknowledged: true,
                  }).view,
                );
              }, 'mindcraft_rules_ack_failed')
            }
          />
          <Button
            label="Ack NON-SEXUAL cultural"
            variant="subtle"
            disabled={busy || view.mindcraftGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(
                  acknowledgeSessionMindcraftAdultsEntry({
                    nonSexualCulturalAcknowledged: true,
                  }).view,
                );
              }, 'mindcraft_cultural_ack_failed')
            }
          />
          <Button
            label="Attempt entry"
            variant="subtle"
            disabled={busy || view.mindcraftGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                const result = attemptSessionMindcraftRoomEntry();
                setLastAttemptAllowed(result.allowed);
                setView(result.view);
              }, 'mindcraft_attempt_failed')
            }
          />
          <Button
            label="Probe deny codes"
            variant="subtle"
            disabled={busy || view.mindcraftGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(probeSessionMindcraftPolicyDenials().view);
              }, 'mindcraft_denial_probe_failed')
            }
          />
          <Button
            label="Clear denials"
            variant="subtle"
            disabled={busy || !view.policyDenials?.length}
            onPress={() =>
              run(() => {
                setView(clearSessionMindcraftPolicyDenials().view);
              }, 'mindcraft_denial_clear_failed')
            }
          />
          <Button
            label="Force deny"
            variant="subtle"
            disabled={busy}
            onPress={() =>
              run(() => {
                setLastAttemptAllowed(null);
                setView(
                  bindSessionMindcraftAdultsEntryFixture({
                    tenantId: DEFAULT_DEMO_MC_TENANT_ID,
                    universeId: DEFAULT_DEMO_MC_UNIVERSE_ID,
                    forceDenied: true,
                  }).view,
                );
              }, 'mindcraft_deny_failed')
            }
          />
          <Button
            label="Clear fixture"
            variant="subtle"
            disabled={busy}
            onPress={() =>
              run(() => {
                setLastAttemptAllowed(null);
                setView(clearSessionMindcraftAdultsEntryFixture().view);
              }, 'mindcraft_clear_failed')
            }
          />
          <Button label="Refresh" variant="subtle" disabled={busy} onPress={refresh} />
        </View>
        {lastAttemptAllowed !== null ? (
          <XivText variant="caption" muted>
            Last attemptAllowed: {String(lastAttemptAllowed)}
          </XivText>
        ) : null}
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
          body={`18+=${view.ack.age18PlusAcknowledged}; tosRules=${view.ack.tosRulesAcknowledged}; waiver=${view.ack.waiverAcknowledged}; antiPredator=${view.ack.antiPredatorAcknowledged}; antiBully=${view.ack.antiBullyAcknowledged}; nonSexualCultural=${view.ack.nonSexualCulturalAcknowledged}; liveLegal=false; liveAgeVerification=false`}
        />
      ) : (
        <ModuleCard tag="WAITING_DATA" title="No acknowledgments" body="Bind a SIMULATION fixture first." />
      )}

      <SectionHeader kicker="Rooms" title="7 LOCAL Mindcraft rooms (NON-SEXUAL)" />
      {view.rooms && view.rooms.length > 0 ? (
        view.rooms.map((room) => (
          <ModuleCard
            key={room.roomId}
            tag={`${room.theme} | ${room.framing}`}
            title={room.name}
            body={`${room.description} · envClass=${room.envClass} · sexualFraming=false · softReverify=${room.requiresSoftReverify} · clothingOptionalHeritageEdu=${room.clothingOptionalHeritageEduOnly}`}
            onPress={
              busy || view.mindcraftGate === 'WAITING_DATA' || view.mindcraftGate === 'GATE_DENIED'
                ? undefined
                : () =>
                    run(() => {
                      setView(selectSessionMindcraftRoom(room.roomId).view);
                    }, 'mindcraft_select_failed')
            }
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No Mindcraft rooms bound"
          body="rooms=null until an explicit SIMULATION fixture is bound."
        />
      )}

      <SectionHeader kicker="Entry card" title="Selected room entry state" />
      {view.entryCard ? (
        <ModuleCard
          tag={view.entryCard.entryAllowed ? 'ENTRY_OK_SIM' : 'BLOCKED'}
          title={view.entryCard.name}
          body={`entryAllowed=${view.entryCard.entryAllowed}; blocking=${view.entryCard.blockingReasons.join(',') || 'none'}; liveLegalWaiver=false; liveAgeVerification=false; liveMindcraftWorld=false; sexualFraming=false; clothingOptionalHeritageEdu=${view.entryCard.clothingOptionalHeritageEduOnly}`}
        />
      ) : (
        <ModuleCard tag="null" title="entryCard=null" body="Unbound, denied, or scope mismatch." />
      )}

      {view.entryCard && view.entryCard.entryLines.length > 0 ? (
        <>
          <SectionHeader kicker="Entry lines" title="Room sticky (fail-closed if missing)" />
          <ModuleCard
            tag="STICKY"
            title={`${view.entryCard.roomId} entry lines`}
            body={view.entryCard.entryLines.map((line, i) => `${i + 1}. ${line}`).join('\n')}
          />
        </>
      ) : null}

      <SectionHeader kicker="Policy denials" title="US-COM-01 aligned deny stubs" />
      {view.policyDenials && view.policyDenials.length > 0 ? (
        view.policyDenials.map((denial) => (
          <ModuleCard
            key={denial.id}
            tag={denial.code}
            title={`${denial.verdict} · liveIncident=false`}
            body={`${denial.reason} · room=${denial.roomId ?? 'n/a'} · kind=${denial.kind}`}
          />
        ))
      ) : (
        <ModuleCard
          tag="none"
          title="No denial stubs recorded"
          body="Probe deny codes to surface PREDATOR_GROOMING_DENIED / SEXUALIZATION_DENIED / BULLY_HARASS_DENIED / SCAM_FRAUD_DENIED / UNDERAGE_ACCESS_DENIED / REPORT_RETALIATION_DENIED. Not a live incident feed."
        />
      )}

      <SectionHeader kicker="HONESTY" title="Providers" />
      <ModuleCard
        tag="WAITING_*"
        title="Provider honesty"
        body={`Waiting: ${(view.waitingProviders ?? []).join(', ') || '(none)'} · Ready: ${(view.readyProviders ?? []).join(', ') || '(none)'} · banners=${(view.banners ?? []).length} · reportsPreserved=${view.reportsPreserved}`}
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
    marginTop: Spacing.two,
  },
});
