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
  SUPPLIER_DIRECTORY_POLICY,
  type SupplierDirectoryView,
} from '@/lib/ai';
import {
  DEFAULT_DEMO_TENANT_ID,
  bindSessionStubSupplierSearchIndex,
  clearSessionStubSupplierSearchIndex,
  searchSessionSupplierDirectory,
  sessionSupplierDirectoryView,
} from '@/lib/supplier-directory';

/**
 * US-NET-01 — Supplier / manufacturer directory search (Business).
 * Stub search index + RLS-scoped. WAITING_INDEX when unbound.
 * Never fabricates supplier inventory or ratings. L4 false.
 */
export function SupplierDirectorySearchScreen() {
  const [tenantId, setTenantId] = useState(DEFAULT_DEMO_TENANT_ID);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<SupplierDirectoryView>(() =>
    sessionSupplierDirectoryView({ tenantId: DEFAULT_DEMO_TENANT_ID }),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionSupplierDirectoryView({ query, tenantId }));
  }, [query, tenantId]);

  const onBindIndex = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(bindSessionStubSupplierSearchIndex({ tenantId }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'stub_index_bind_failed');
    } finally {
      setBusy(false);
    }
  };

  const onSearch = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(searchSessionSupplierDirectory({ query, tenantId }).view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'directory_search_failed');
      setView(sessionSupplierDirectoryView({ query, tenantId }));
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionStubSupplierSearchIndex().view);
      setQuery('');
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'stub_index_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const gateTone = view.status === 'READY' ? 'success' : 'warning';

  return (
    <ExperienceScreen
      title="Supplier Directory"
      subtitle="US-NET-01 — supplier/manufacturer search. Stub index + RLS. Not live marketplace."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="Search index stub only. Bind an RLS tenant scope explicitly. Inventory counts and ratings stay WAITING_DATA / null — never fabricated. L4 false; no production mutations." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={SUPPLIER_DIRECTORY_POLICY.label} tone="warning" />
      <XivStatusPill label="rlsScoped: true" tone="warning" />
      <XivStatusPill label="indexMode: stub" tone="warning" />
      <XivStatusPill label={`Directory: ${view.status}`} tone={gateTone} />
      <XivStatusPill
        label={`Index: ${view.indexGate}`}
        tone={view.indexGate === 'STUB_INDEX' ? 'success' : 'warning'}
      />
      <XivStatusPill label="inventory: WAITING_DATA (never fabricated)" tone="warning" />
      <XivStatusPill label="ratings: WAITING_DATA (never fabricated)" tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Stub index" title="RLS-scoped search controls" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <Field
          label="Tenant scope (RLS)"
          value={tenantId}
          onChangeText={setTenantId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tenant id"
        />
        <Field
          label="Search query"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="name, kind, category, region"
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working…' : 'Bind stub search index'}
            variant="subtle"
            disabled={busy}
            onPress={onBindIndex}
          />
          <Button
            label="Search"
            variant="subtle"
            disabled={busy || view.indexGate === 'WAITING_INDEX'}
            onPress={onSearch}
          />
          <Button
            label="Clear index"
            variant="subtle"
            disabled={busy || view.indexGate !== 'STUB_INDEX'}
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

      <SectionHeader kicker="Results" title="Supplier / manufacturer cards" />
      {view.indexGate === 'STUB_INDEX' && view.results && view.results.length > 0 ? (
        view.results.map((entry) => (
          <ModuleCard
            key={entry.id}
            tag={entry.kind.toUpperCase()}
            title={entry.name}
            body={`${entry.category} · ${entry.region} · RLS ${entry.rlsTenantId} · stubOnly · liveMarketplace=false · inventory WAITING_DATA (onHand/sku null) · ratings WAITING_DATA (stars/reviews/trust null)`}
          />
        ))
      ) : view.indexGate === 'STUB_INDEX' && view.results ? (
        <ModuleCard
          tag={view.status === 'WAITING_DATA' ? 'WAITING_DATA' : 'EMPTY'}
          title="No directory matches"
          body="Stub index is bound but this query/tenant scope returned no rows. Cross-tenant results are never leaked. Inventory and ratings are not fabricated."
        />
      ) : (
        <ModuleCard
          tag="WAITING_INDEX"
          title="No stub search index"
          body="WAITING_INDEX — bind the stub supplier/manufacturer search index with an RLS tenant scope. Live marketplace inventory and ratings are not invented."
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