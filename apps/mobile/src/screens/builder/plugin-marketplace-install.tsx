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
  PLUGIN_MARKETPLACE_POLICY,
  type PluginMarketplaceView,
} from '@/lib/ai';
import {
  DEFAULT_DEMO_BUILDER_TENANT_ID,
  bindSessionInMemoryPluginMarketplace,
  clearSessionInMemoryPluginMarketplace,
  decideSessionPluginInstallProposal,
  proposeSessionPluginInstall,
  sessionPluginMarketplaceView,
} from '@/lib/plugin-marketplace';

/**
 * US-PLG-01 — Plugin marketplace install (signed) for Builder.
 * In-memory stub. WAITING_SIGNING when unbound.
 * Never claims cryptographic verification without a real verifier.
 * Install proposals requireApproval; L4 false; no production mutations.
 */
export function PluginMarketplaceInstallScreen() {
  const [tenantId, setTenantId] = useState(DEFAULT_DEMO_BUILDER_TENANT_ID);
  const [selectedPackageId, setSelectedPackageId] = useState('stub-plugin-ops-brief-tools');
  const [view, setView] = useState<PluginMarketplaceView>(() =>
    sessionPluginMarketplaceView({ tenantId: DEFAULT_DEMO_BUILDER_TENANT_ID }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionPluginMarketplaceView({ tenantId }));
  }, [tenantId]);

  const onBindMarketplace = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(bindSessionInMemoryPluginMarketplace({ tenantId }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'marketplace_bind_failed');
    } finally {
      setBusy(false);
    }
  };

  const onProposeInstall = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(proposeSessionPluginInstall({ packageId: selectedPackageId, tenantId }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'install_propose_failed');
      setView(sessionPluginMarketplaceView({ tenantId }));
    } finally {
      setBusy(false);
    }
  };

  const onDecide = (proposalId: string, decision: 'approve' | 'reject') => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(decideSessionPluginInstallProposal({ proposalId, tenantId, decision }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'install_decide_failed');
      setView(sessionPluginMarketplaceView({ tenantId }));
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionInMemoryPluginMarketplace().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'marketplace_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const gateTone = view.status === 'READY' ? 'success' : 'warning';

  return (
    <ExperienceScreen
      title="Plugin Marketplace"
      subtitle="US-PLG-01 — Builder install proposals. In-memory stub. Signed packages later."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="In-memory marketplace stub only. Bind a tenant scope explicitly. Packages are never claimed cryptographically verified without a real verifier (WAITING_SIGNING / STUB_UNSIGNED). Install proposals always requireApproval. L4 false; no production mutations." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={PLUGIN_MARKETPLACE_POLICY.label} tone="warning" />
      <XivStatusPill label="requiresApproval: true" tone="warning" />
      <XivStatusPill label="cryptographicallyVerified: false" tone="warning" />
      <XivStatusPill label="marketplaceMode: in_memory_stub" tone="warning" />
      <XivStatusPill label={`Marketplace: ${view.status}`} tone={gateTone} />
      <XivStatusPill
        label={`Signing: ${view.signingGate}`}
        tone={view.signingGate === 'STUB_UNSIGNED' ? 'success' : 'warning'}
      />

      <Card style={styles.card}>
        <SectionHeader kicker="In-memory stub" title="Builder marketplace controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <Field
          label="Tenant scope"
          value={tenantId}
          onChangeText={setTenantId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tenant id"
        />
        <Field
          label="Package id (for install proposal)"
          value={selectedPackageId}
          onChangeText={setSelectedPackageId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="stub-plugin-…"
        />
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working…' : 'Bind in-memory marketplace'}
            variant="subtle"
            disabled={busy}
            onPress={onBindMarketplace}
          />
          <Button
            label="Propose install"
            variant="subtle"
            disabled={busy || view.signingGate === 'WAITING_SIGNING'}
            onPress={onProposeInstall}
          />
          <Button
            label="Clear marketplace"
            variant="subtle"
            disabled={busy || view.signingGate === 'WAITING_SIGNING'}
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

      <SectionHeader kicker="Catalog" title="Stub packages (not cryptographically verified)" />
      {view.signingGate === 'STUB_UNSIGNED' && view.packages && view.packages.length > 0 ? (
        view.packages.map((pkg) => (
          <ModuleCard
            key={pkg.id}
            tag={pkg.kind.toUpperCase()}
            title={pkg.name}
            body={`${pkg.id} · v${pkg.version} · ${pkg.publisher} · stubOnly · liveSignedPackage=false · signature ${pkg.signature.gate} · cryptographicallyVerified=false · digest/signer null`}
          />
        ))
      ) : view.signingGate === 'STUB_UNSIGNED' && view.packages ? (
        <ModuleCard
          tag={view.status === 'WAITING_DATA' ? 'WAITING_DATA' : 'EMPTY'}
          title="No marketplace packages"
          body="Stub marketplace is bound but this tenant scope returned no packages. Cross-tenant listings are never leaked. Cryptographic verification is not claimed."
        />
      ) : (
        <ModuleCard
          tag="WAITING_SIGNING"
          title="No marketplace stub bound"
          body="WAITING_SIGNING — bind the in-memory plugin marketplace stub. Signed packages later; do not claim cryptographic verification without a real verifier."
        />
      )}

      <SectionHeader kicker="Install proposals" title="requiresApproval — session only" />
      {view.proposals.length > 0 ? (
        view.proposals.map((proposal) => (
          <Card key={proposal.id} style={styles.card}>
            <ModuleCard
              tag={proposal.status.toUpperCase()}
              title={proposal.packageName}
              body={`${proposal.packageId} · requiresApproval=${String(proposal.requiresApproval)} · productionMutation=false · L4 false · cryptographicallyVerified=false · signatureGate=${proposal.signatureGate} · ${proposal.note}`}
            />
            {proposal.status === 'pending_approval' ? (
              <View style={styles.chips}>
                <Button
                  label="Approve (session only)"
                  variant="subtle"
                  disabled={busy}
                  onPress={() => onDecide(proposal.id, 'approve')}
                />
                <Button
                  label="Reject"
                  variant="subtle"
                  disabled={busy}
                  onPress={() => onDecide(proposal.id, 'reject')}
                />
              </View>
            ) : null}
          </Card>
        ))
      ) : (
        <ModuleCard
          tag="NONE"
          title="No install proposals"
          body="Propose an install from a stub package id. Approvals are session-only and never mutate production. Packages remain cryptographicallyVerified=false."
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
