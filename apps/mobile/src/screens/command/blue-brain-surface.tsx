import { useCallback, useState } from 'react';
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
import { BLUE_BRAIN_POLICY, type BlueBrainView } from '@/lib/ai';
import {
  DEFAULT_DEMO_BLUE_DEVICE_SCOPE,
  DEFAULT_DEMO_BLUE_TENANT_ID,
  DEFAULT_DEMO_BLUE_UNIVERSE_ID,
  bindSessionBlueBrainFixture,
  clearSessionBlueBrainFixture,
  sessionBlueBrainView,
} from '@/lib/blue-brain';

/**
 * US-BB-01 -- Blue Brain product surface for Executive / Business routes.
 * LOCAL/SIMULATION fixture consumer. WAITING_DATA when unbound.
 * Policy gate in front; GATE_DENIED nulls surface. Never fabricates live neural/ADC metrics.
 * L4 false; productionMutation false; mayEnterGlobalBrain false; liveCloudSyncClaimed false.
 */
export function BlueBrainSurfaceScreen() {
  const [tenantId, setTenantId] = useState(DEFAULT_DEMO_BLUE_TENANT_ID);
  const [universeId, setUniverseId] = useState(DEFAULT_DEMO_BLUE_UNIVERSE_ID);
  const [deviceScope, setDeviceScope] = useState(DEFAULT_DEMO_BLUE_DEVICE_SCOPE);
  const [view, setView] = useState<BlueBrainView>(() =>
    sessionBlueBrainView({
      tenantId: DEFAULT_DEMO_BLUE_TENANT_ID,
      universeId: DEFAULT_DEMO_BLUE_UNIVERSE_ID,
      deviceScope: DEFAULT_DEMO_BLUE_DEVICE_SCOPE,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionBlueBrainView({ tenantId, universeId, deviceScope }));
  }, [tenantId, universeId, deviceScope]);

  const onBindFixture = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(bindSessionBlueBrainFixture({ tenantId, universeId, deviceScope, policyGate: 'ALLOWED' }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'blue_brain_fixture_bind_failed');
    } finally {
      setBusy(false);
    }
  };

  const onDenyGate = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(bindSessionBlueBrainFixture({ tenantId, universeId, deviceScope, policyGate: 'DENIED' }).view);
      setView(
        sessionBlueBrainView({
          tenantId,
          universeId,
          deviceScope,
          policyGate: 'DENIED',
        }),
      );
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'blue_brain_gate_deny_failed');
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionBlueBrainFixture().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'blue_brain_fixture_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const gateTone =
    view.blueBrainGate === 'FIXTURE_SIMULATION'
      ? view.status === 'WAITING_PROVIDER' || view.status === 'WAITING_SYNC'
        ? 'warning'
        : 'success'
      : view.blueBrainGate === 'GATE_DENIED'
        ? 'warning'
        : 'warning';

  return (
    <ExperienceScreen
      title="Blue Brain"
      subtitle="US-BB-01 -- LOCAL neural brain READ surface. SIMULATION fixture only. Policy gate in front."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="Product-lane Blue Brain surface (12D-15 FOLLOW_UP UX). Not Global Brain. Not live fabric. Bind an explicit SIMULATION fixture for labeled pocket ingest stubs. WAITING_DATA when unbound. Cloud/sync/Global Brain remain WAITING_PROVIDER. lastReadAt stays null until real read proof. Aspirational ADC scale never labeled measured. Policy gate bypass forbidden. L4 false; productionMutation false; mayEnterGlobalBrain false; liveCloudSyncClaimed false." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label="productionMutation: false" tone="warning" />
      <XivStatusPill label="readOnly: true" tone="warning" />
      <XivStatusPill label="mayEnterGlobalBrain: false" tone="warning" />
      <XivStatusPill label="liveCloudSyncClaimed: false" tone="warning" />
      <XivStatusPill label="policyGateInFront: true" tone="warning" />
      <XivStatusPill label={BLUE_BRAIN_POLICY.label} tone="warning" />
      <XivStatusPill label={`Gate: ${view.blueBrainGate}`} tone={gateTone} />
      <XivStatusPill label={`Policy: ${view.policyGate}`} tone={gateTone} />
      <XivStatusPill label={`Status: ${view.status}`} tone={gateTone} />
      <XivStatusPill label={`Layer: ${view.layerKind}`} tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Fixture bind" title="Blue Brain controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <Field
          label="Universe id"
          value={universeId}
          onChangeText={setUniverseId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="demo-blue-brain"
        />
        <Field
          label="Tenant scope"
          value={tenantId}
          onChangeText={setTenantId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="xiv"
        />
        <Field
          label="Device scope"
          value={deviceScope}
          onChangeText={setDeviceScope}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="asus-local"
        />
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working...' : 'Bind SIMULATION fixture'}
            variant="subtle"
            disabled={busy}
            onPress={onBindFixture}
          />
          <Button label="Deny policy gate" variant="subtle" disabled={busy} onPress={onDenyGate} />
          <Button
            label="Clear fixture"
            variant="subtle"
            disabled={busy || view.blueBrainGate === 'WAITING_DATA'}
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

      <SectionHeader kicker="Banners" title="Honesty strip" />
      {view.banners.map((banner) => (
        <ModuleCard key={banner} tag="BANNER" title={banner} body="Guardrail notice -- not a live Blue Brain metric." />
      ))}

      <SectionHeader kicker="Surface card" title="Neural READ surface (null when unbound/denied)" />
      {view.surfaceCard ? (
        <ModuleCard
          tag={`${view.surfaceCard.layerKind} | liveCloudSyncClaimed=${String(view.surfaceCard.liveCloudSyncClaimed)} | mayEnterGlobalBrain=${String(view.surfaceCard.mayEnterGlobalBrain)}`}
          title={`${view.surfaceCard.universeId} / ${view.surfaceCard.tenantId} / ${view.surfaceCard.deviceScope}`}
          body={`stubs=${view.surfaceCard.stubCount} | hits=${view.surfaceCard.hitCount} | misses=${view.surfaceCard.missCount} | fingerprint=${view.surfaceCard.fingerprint} | lastReadAt=null | surfaceStatus=${view.surfaceCard.surfaceStatus} | policyGateInFront=${String(view.surfaceCard.policyGateInFront)}`}
          meta="FIXTURE_SIMULATION only -- not live Blue Brain / Global Brain sync."
        />
      ) : (
        <ModuleCard
          tag={view.blueBrainGate === 'GATE_DENIED' ? 'GATE_DENIED' : 'WAITING_DATA'}
          title="No Blue Brain surface card"
          body={
            view.blueBrainGate === 'GATE_DENIED'
              ? 'GATE_DENIED -- policy gate blocked the read. surfaceCard stays null. Never fabricate neural metrics.'
              : 'WAITING_DATA -- Blue Brain unbound. surfaceCard stays null. Never fabricate stub/hit/sync counts.'
          }
        />
      )}

      <SectionHeader kicker="Providers" title="Sync / provider honesty" />
      <ModuleCard
        tag="WAITING_PROVIDER"
        title={`Waiting: ${view.waitingProviders.join(', ') || '(none)'}`}
        body={`Ready: ${view.readyProviders.join(', ') || '(none)'}. Cloud/model/sync/Global Brain providers stay WAITING_PROVIDER until a real binding exists.`}
      />

      <SectionHeader kicker="Pocket ingest stubs" title="Checksummed stubs (null when unbound/denied)" />
      {view.pocketIngestStubs && view.pocketIngestStubs.length > 0 ? (
        view.pocketIngestStubs.map((row) => (
          <ModuleCard
            key={row.stubId}
            tag={`${row.classification} | cached=${String(row.cached)}`}
            title={row.title}
            body={`${row.stubId} | checksum=${row.checksum} | mayEnterGlobalBrain=${String(row.mayEnterGlobalBrain)} | waitingReason=${row.waitingReason ?? 'null'}`}
          />
        ))
      ) : (
        <ModuleCard
          tag={view.blueBrainGate === 'GATE_DENIED' ? 'GATE_DENIED' : 'WAITING_DATA'}
          title="No pocket ingest stubs"
          body="WAITING_DATA / GATE_DENIED -- pocketIngestStubs stays null. Never invent Blue Brain knowledge from Global Brain."
        />
      )}

      <SectionHeader kicker="Scale honesty" title="Measured vs aspirational (null when unbound/denied)" />
      {view.scaleClaims && view.scaleClaims.length > 0 ? (
        view.scaleClaims.map((claim) => (
          <ModuleCard
            key={claim.id}
            tag={`${claim.kind} | asMeasured=${String(claim.asMeasured)}`}
            title={claim.label}
            body={`value=${claim.value === null ? 'null' : String(claim.value)} ${claim.unit} | aspirational never labeled measured`}
          />
        ))
      ) : (
        <ModuleCard
          tag={view.blueBrainGate === 'GATE_DENIED' ? 'GATE_DENIED' : 'WAITING_DATA'}
          title="No scale claims"
          body="WAITING_DATA / GATE_DENIED -- scaleClaims stays null. Never fabricate ADC measured scale."
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
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});