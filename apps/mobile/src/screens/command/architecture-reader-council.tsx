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
import {
  ARCHITECTURE_READER_POLICY,
  type ArchitectureReaderView,
} from '@/lib/ai';
import {
  DEFAULT_DEMO_ARCHITECTURE_TENANT_ID,
  DEFAULT_DEMO_ARCHITECTURE_UNIVERSE_ID,
  bindSessionArchitectureReaderFixture,
  clearSessionArchitectureReaderFixture,
  sessionArchitectureReaderView,
} from '@/lib/architecture-reader';

/**
 * US-ARCH-01 — Architecture Reader + Council queue for Command Center / Executive.
 * Product-lane fixture consumer. WAITING_DATA when unbound.
 * Never fabricates live fabric metrics. L4 false; productionAutoApply false; readOnly.
 */
export function ArchitectureReaderCouncilScreen() {
  const [tenantId, setTenantId] = useState(DEFAULT_DEMO_ARCHITECTURE_TENANT_ID);
  const [universeId, setUniverseId] = useState(DEFAULT_DEMO_ARCHITECTURE_UNIVERSE_ID);
  const [view, setView] = useState<ArchitectureReaderView>(() =>
    sessionArchitectureReaderView({
      tenantId: DEFAULT_DEMO_ARCHITECTURE_TENANT_ID,
      universeId: DEFAULT_DEMO_ARCHITECTURE_UNIVERSE_ID,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionArchitectureReaderView({ tenantId, universeId }));
  }, [tenantId, universeId]);

  const onBindFixture = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(bindSessionArchitectureReaderFixture({ tenantId, universeId }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'architecture_fixture_bind_failed');
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionArchitectureReaderFixture().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'architecture_fixture_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const gateTone =
    view.fabricGate === 'FIXTURE_SIMULATION'
      ? view.status === 'WAITING_PROVIDER'
        ? 'warning'
        : 'success'
      : 'warning';

  return (
    <ExperienceScreen
      title="Architecture Reader"
      subtitle="US-ARCH-01 — Command Center consumer. SIMULATION fixture only. Read-only."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="Product-lane Architecture Reader / Council wire from 12D-08 FOLLOW_UP. Dimensional fabric stays unbound here — bind an explicit SIMULATION fixture for labeled demo topology. WAITING_DATA when unbound. Cloud providers remain WAITING_PROVIDER. Never fabricate live fabric metrics. L4 false; productionAutoApply false; readOnly." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label="productionAutoApply: false" tone="warning" />
      <XivStatusPill label="readOnly: true" tone="warning" />
      <XivStatusPill label={ARCHITECTURE_READER_POLICY.label} tone="warning" />
      <XivStatusPill label={`Fabric: ${view.fabricGate}`} tone={gateTone} />
      <XivStatusPill label={`Status: ${view.status}`} tone={gateTone} />
      <XivStatusPill label={`Layer: ${view.layerKind}`} tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Fixture bind" title="Command Center controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <Field
          label="Universe id"
          value={universeId}
          onChangeText={setUniverseId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="demo-cc"
        />
        <Field
          label="Tenant scope"
          value={tenantId}
          onChangeText={setTenantId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="xiv"
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
            disabled={busy || view.fabricGate === 'WAITING_DATA'}
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
        <ModuleCard key={banner} tag="BANNER" title={banner} body="Guardrail notice — not a live metric." />
      ))}

      <SectionHeader kicker="Architecture card" title="Topology (null when unbound)" />
      {view.architectureCard ? (
        <ModuleCard
          tag={`${view.architectureCard.layerKind} · liveFabric=${String(view.architectureCard.liveFabric)}`}
          title={`${view.architectureCard.universeId} / ${view.architectureCard.tenantId}`}
          body={`companies=${view.architectureCard.companyCount} · supplyLinks=${view.architectureCard.supplyLinkCount} · agents=${view.architectureCard.agentPopulationTotal} · worldEntities=${view.architectureCard.worldEntityCount} · branches=${view.architectureCard.branchCount} · fingerprint=${view.architectureCard.fingerprint} · routeTarget=null · manifest=${view.architectureCard.manifestStatus}`}
          meta={view.architectureCard.cityLadder}
        />
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No architecture card"
          body="WAITING_DATA — fabric unbound. architectureCard stays null. Never fabricate company/agent/topology counts."
        />
      )}

      <SectionHeader kicker="Providers" title="Council provider honesty" />
      <ModuleCard
        tag="WAITING_PROVIDER"
        title={`Waiting: ${view.waitingProviders.join(', ') || '(none)'}`}
        body={`Ready: ${view.readyProviders.join(', ') || '(none)'}. Cloud/model providers stay WAITING_PROVIDER until a real binding exists.`}
      />

      <SectionHeader kicker="Council queue" title="Top ranks (null when unbound)" />
      {view.councilTop && view.councilTop.length > 0 ? (
        view.councilTop.map((row) => (
          <ModuleCard
            key={row.storyId}
            tag={`#${row.priorityRank} · ${row.domain}`}
            title={row.title}
            body={`${row.storyId} · composite=${row.composite ?? 'null'} · worthExecuting=${String(row.worthExecuting)} · waiting=${row.waitingProviders.join(',')} · ready=${row.readyProviders.join(',')}`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No council ranks"
          body="WAITING_DATA — councilTop stays null while fabric unbound. Never invent priority composites from live fabric."
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
