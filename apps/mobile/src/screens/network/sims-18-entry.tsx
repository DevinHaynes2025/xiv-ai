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
import { SIMS_18_ENTRY_POLICY, type Sims18EntryView } from '@/lib/ai';
import {
  DEFAULT_DEMO_SIM_TENANT_ID,
  DEFAULT_DEMO_SIM_UNIVERSE_ID,
  acknowledgeSessionSims18Entry,
  attemptSessionSims18Entry,
  bindSessionSims18EntryFixture,
  clearSessionSims18EntryFixture,
  selectSessionSimsWorld,
  sessionSims18EntryView,
} from '@/lib/sims-18-entry';

/**
 * US-SIM-01 -- Sims 18+ entry (Consumer/Business/Executive).
 * 12D-16/17 FOLLOW_UP product UX. LOCAL/SIMULATION only.
 * Portal/wormhole labels are metaphors -- never live physics/transport.
 * 18+ ack required (SIMULATION). Non-sexual cultural/professional/civic sandboxes.
 * WAITING_* honesty; L4 false; productionMutation false.
 */
export function Sims18EntryScreen() {
  const [view, setView] = useState<Sims18EntryView>(() =>
    sessionSims18EntryView({
      tenantId: DEFAULT_DEMO_SIM_TENANT_ID,
      universeId: DEFAULT_DEMO_SIM_UNIVERSE_ID,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastAttemptAllowed, setLastAttemptAllowed] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    setView(
      sessionSims18EntryView({
        tenantId: DEFAULT_DEMO_SIM_TENANT_ID,
        universeId: DEFAULT_DEMO_SIM_UNIVERSE_ID,
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
    view.simsGate === 'FIXTURE_SIMULATION' && view.status === 'WAITING_PROVIDER'
      ? 'warning'
      : view.simsGate === 'GATE_DENIED' ||
          view.simsGate === 'AGE_GATE_REQUIRED' ||
          view.simsGate === 'WAITING_DATA'
        ? 'warning'
        : 'success';

  return (
    <ExperienceScreen
      title="Sims 18+ Entry"
      subtitle="US-SIM-01 -- 12D-16/17 FOLLOW_UP. Portal/wormhole metaphors only. SIMULATION sandboxes."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="LOCAL/SIMULATION Sims 18+ entry. Portal and wormhole labels are metaphors only -- never live teleport or physics. 18+ acknowledgment is SIMULATION (liveAgeVerification=false). Sandboxes stay non-sexual cultural / professional / civic. liveSimWorld=false; L4 false; productionMutation false. Product lane only -- no dimensional fabric import." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label="productionMutation: false" tone="warning" />
      <XivStatusPill label="liveSimWorld: false" tone="warning" />
      <XivStatusPill label="liveAgeVerification: false" tone="warning" />
      <XivStatusPill label="livePortalPhysics: false (metaphor)" tone="warning" />
      <XivStatusPill label="sexualFraming: false" tone="warning" />
      <XivStatusPill label={SIMS_18_ENTRY_POLICY.label} tone="warning" />
      <XivStatusPill label={`Follow-up: ${SIMS_18_ENTRY_POLICY.dimensionalFollowUp}`} tone="warning" />
      <XivStatusPill label={`Gate: ${view.simsGate}`} tone={gateTone} />
      <XivStatusPill label={`Status: ${view.status}`} tone={gateTone} />

      <Card style={styles.card}>
        <SectionHeader kicker="SIMULATION" title="Sims 18+ entry controls" />
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
                  bindSessionSims18EntryFixture({
                    tenantId: DEFAULT_DEMO_SIM_TENANT_ID,
                    universeId: DEFAULT_DEMO_SIM_UNIVERSE_ID,
                  }).view,
                );
              }, 'sims_18_entry_bind_failed')
            }
          />
          <Button
            label="Ack 18+"
            variant="subtle"
            disabled={busy || view.simsGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(acknowledgeSessionSims18Entry({ age18PlusAcknowledged: true }).view);
              }, 'sims_18_ack_failed')
            }
          />
          <Button
            label="Ack sandbox rules"
            variant="subtle"
            disabled={busy || view.simsGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                setView(acknowledgeSessionSims18Entry({ sandboxRulesAcknowledged: true }).view);
              }, 'sims_18_rules_ack_failed')
            }
          />
          <Button
            label="Attempt entry"
            variant="subtle"
            disabled={busy || view.simsGate === 'WAITING_DATA'}
            onPress={() =>
              run(() => {
                const result = attemptSessionSims18Entry();
                setLastAttemptAllowed(result.allowed);
                setView(result.view);
              }, 'sims_18_attempt_failed')
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
                  bindSessionSims18EntryFixture({
                    tenantId: DEFAULT_DEMO_SIM_TENANT_ID,
                    universeId: DEFAULT_DEMO_SIM_UNIVERSE_ID,
                    forceDenied: true,
                  }).view,
                );
              }, 'sims_18_deny_failed')
            }
          />
          <Button
            label="Clear"
            variant="subtle"
            disabled={busy}
            onPress={() =>
              run(() => {
                setLastAttemptAllowed(null);
                setView(clearSessionSims18EntryFixture().view);
              }, 'sims_18_clear_failed')
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

      <SectionHeader kicker="Acknowledgments" title="SIMULATION flags (not live age proof)" />
      {view.ack ? (
        <ModuleCard
          tag="ACK"
          title="Local acknowledgment flags"
          body={`18+=${view.ack.age18PlusAcknowledged}; sandboxRules=${view.ack.sandboxRulesAcknowledged}; liveLegal=false; liveAgeVerification=false`}
        />
      ) : (
        <ModuleCard tag="WAITING_DATA" title="No acknowledgments" body="Bind a SIMULATION fixture first." />
      )}

      <SectionHeader kicker="Entry card" title="Selected sandbox portal/wormhole metaphor" />
      {view.entryCard ? (
        <ModuleCard
          tag={view.entryCard.entryAllowed ? 'ENTRY_OK_SIM' : 'BLOCKED'}
          title={view.entryCard.name}
          body={`${view.entryCard.entryLabel} · entryAllowed=${view.entryCard.entryAllowed}; blocking=${view.entryCard.blockingReasons.join(',') || 'none'}; liveSimWorld=false; livePortalPhysics=false; liveWormholeTransport=false; sexualFraming=false`}
        />
      ) : (
        <ModuleCard tag="null" title="entryCard=null" body="Unbound, denied, or scope mismatch." />
      )}

      <SectionHeader kicker="Sandbox worlds" title="Non-sexual cultural / professional stubs" />
      {view.worlds && view.worlds.length > 0 ? (
        view.worlds.map((world) => (
          <ModuleCard
            key={world.worldId}
            tag={`${world.entryMetaphor} | ${world.framing}`}
            title={world.name}
            body={`${world.description} · ${world.entryLabel} · liveSimWorld=false · sexualFraming=false`}
            onPress={
              busy || view.simsGate === 'WAITING_DATA' || view.simsGate === 'GATE_DENIED'
                ? undefined
                : () =>
                    run(() => {
                      setView(selectSessionSimsWorld(world.worldId).view);
                    }, 'sims_18_select_failed')
            }
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No Sims worlds bound"
          body="worlds=null until an explicit SIMULATION fixture is bound."
        />
      )}

      <SectionHeader kicker="HONESTY" title="Providers" />
      <ModuleCard
        tag="WAITING_*"
        title="Provider honesty"
        body={`Waiting: ${(view.waitingProviders ?? []).join(', ') || '(none)'} · Ready: ${(view.readyProviders ?? []).join(', ') || '(none)'} · banners=${(view.banners ?? []).length}`}
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
