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
import { POCKET_BRAIN_POLICY, type PocketBrainView } from '@/lib/ai';
import {
  DEFAULT_DEMO_POCKET_DEVICE_SCOPE,
  DEFAULT_DEMO_POCKET_TENANT_ID,
  DEFAULT_DEMO_POCKET_UNIVERSE_ID,
  bindSessionPocketBrainFixture,
  clearSessionPocketBrainFixture,
  sessionPocketBrainView,
} from '@/lib/pocket-brain';

/**
 * US-PB-01 -- Pocket Brain product surface for Executive / Business pocket routes.
 * LOCAL/SIMULATION fixture consumer. WAITING_DATA when unbound.
 * Never fabricates live pocket sync or Global Brain metrics.
 * L4 false; productionMutation false; CLOUD_ONLY never cached; autoPromote false.
 */
export function PocketBrainSurfaceScreen() {
  const [tenantId, setTenantId] = useState(DEFAULT_DEMO_POCKET_TENANT_ID);
  const [universeId, setUniverseId] = useState(DEFAULT_DEMO_POCKET_UNIVERSE_ID);
  const [deviceScope, setDeviceScope] = useState(DEFAULT_DEMO_POCKET_DEVICE_SCOPE);
  const [view, setView] = useState<PocketBrainView>(() =>
    sessionPocketBrainView({
      tenantId: DEFAULT_DEMO_POCKET_TENANT_ID,
      universeId: DEFAULT_DEMO_POCKET_UNIVERSE_ID,
      deviceScope: DEFAULT_DEMO_POCKET_DEVICE_SCOPE,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionPocketBrainView({ tenantId, universeId, deviceScope }));
  }, [tenantId, universeId, deviceScope]);

  const onBindFixture = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(bindSessionPocketBrainFixture({ tenantId, universeId, deviceScope }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'pocket_brain_fixture_bind_failed');
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionPocketBrainFixture().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'pocket_brain_fixture_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const gateTone =
    view.pocketGate === 'FIXTURE_SIMULATION'
      ? view.status === 'WAITING_PROVIDER' || view.status === 'WAITING_SYNC'
        ? 'warning'
        : 'success'
      : 'warning';

  return (
    <ExperienceScreen
      title="Pocket Brain"
      subtitle="US-PB-01 -- scoped encrypted cache surface. SIMULATION fixture only. Read-only."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="Product-lane Pocket Brain surface. Not Global Brain. Bind an explicit SIMULATION fixture for labeled demo cache. WAITING_DATA when unbound. Cloud/sync providers remain WAITING_PROVIDER. lastSyncAt stays null until real sync proof. CLOUD_ONLY never cached. Never fabricate pocket/Global Brain metrics. L4 false; productionMutation false; autoPromote false." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label="productionMutation: false" tone="warning" />
      <XivStatusPill label="readOnly: true" tone="warning" />
      <XivStatusPill label="CLOUD_ONLY never cached" tone="warning" />
      <XivStatusPill label="autoPromoteToGlobalBrain: false" tone="warning" />
      <XivStatusPill label={POCKET_BRAIN_POLICY.label} tone="warning" />
      <XivStatusPill label={`Gate: ${view.pocketGate}`} tone={gateTone} />
      <XivStatusPill label={`Status: ${view.status}`} tone={gateTone} />
      <XivStatusPill label={`Layer: ${view.layerKind}`} tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Fixture bind" title="Pocket Brain controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <Field
          label="Universe id"
          value={universeId}
          onChangeText={setUniverseId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="demo-pocket"
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
          <Button
            label="Clear fixture"
            variant="subtle"
            disabled={busy || view.pocketGate === 'WAITING_DATA'}
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
        <ModuleCard key={banner} tag="BANNER" title={banner} body="Guardrail notice -- not a live pocket metric." />
      ))}

      <SectionHeader kicker="Cache card" title="Scoped cache (null when unbound)" />
      {view.cacheCard ? (
        <ModuleCard
          tag={`${view.cacheCard.layerKind} | livePocketSync=${String(view.cacheCard.livePocketSync)} | liveGlobalBrain=${String(view.cacheCard.liveGlobalBrain)}`}
          title={`${view.cacheCard.universeId} / ${view.cacheCard.tenantId} / ${view.cacheCard.deviceScope}`}
          body={`entries=${view.cacheCard.entryCount} | bytes=${view.cacheCard.bytesCached} | cloudOnlyExcluded=${view.cacheCard.cloudOnlyExcludedCount} | fingerprint=${view.cacheCard.fingerprint} | lastSyncAt=null | cacheStatus=${view.cacheCard.cacheStatus}`}
          meta="FIXTURE_SIMULATION only -- not live xiv-data / Global Brain sync."
        />
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No pocket cache card"
          body="WAITING_DATA -- pocket unbound. cacheCard stays null. Never fabricate entry/byte/sync counts."
        />
      )}

      <SectionHeader kicker="Providers" title="Sync / provider honesty" />
      <ModuleCard
        tag="WAITING_PROVIDER"
        title={`Waiting: ${view.waitingProviders.join(', ') || '(none)'}`}
        body={`Ready: ${view.readyProviders.join(', ') || '(none)'}. Cloud/model/sync providers stay WAITING_PROVIDER until a real binding exists.`}
      />

      <SectionHeader kicker="Knowledge" title="Scoped items (null when unbound)" />
      {view.knowledgeItems && view.knowledgeItems.length > 0 ? (
        view.knowledgeItems.map((row) => (
          <ModuleCard
            key={row.id}
            tag={`${row.classification} | cached=${String(row.cached)}`}
            title={row.title}
            body={`${row.id} | autoPromoteBlocked=${String(row.autoPromoteBlocked)} | waitingReason=${row.waitingReason ?? 'null'}`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No knowledge items"
          body="WAITING_DATA -- knowledgeItems stays null while pocket unbound. Never invent pocket knowledge from Global Brain."
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