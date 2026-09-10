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
import {
  SYSTEM_NAVIGATOR_POLICY,
  type SystemNavigatorView,
} from '@/lib/ai';
import {
  BUILTIN_COMMERCE_CSV_TEXT,
  clearSessionCommerceCsvDemo,
  loadSessionCommerceCsvDemo,
  sessionSystemNavigatorView,
} from '@/lib/system-navigator';

/**
 * US-SYS-01 — Executive CSV/commerce demo path (companion to System Navigator).
 * Connector stub — not live ERP. WAITING_CONNECTOR when unbound; never fabricate metrics.
 */
export function CommerceCsvDemoScreen() {
  const [view, setView] = useState<SystemNavigatorView>(() => sessionSystemNavigatorView());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionSystemNavigatorView());
  }, []);

  const onLoadDemo = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(
        loadSessionCommerceCsvDemo({
          label: 'builtin-commerce-demo.csv',
          csvText: BUILTIN_COMMERCE_CSV_TEXT,
        }).view,
      );
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'demo_load_failed');
    } finally {
      setBusy(false);
    }
  };

  const onClearDemo = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionCommerceCsvDemo().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'demo_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const gate = view.commerce.gate;

  return (
    <ExperienceScreen
      title="Commerce CSV demo"
      subtitle="US-SYS-01 — Executive commerce path via connector stub. Not live ERP."
    >
      <PrototypeNotice text="This is the CSV/commerce demo lane under System Navigator. Metrics only after explicit DEMO_CSV load. Unbound = WAITING_CONNECTOR with null totals. L4 false; no production mutations." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={SYSTEM_NAVIGATOR_POLICY.label} tone="warning" />
      <XivStatusPill label="liveErp: false" tone="warning" />
      <XivStatusPill
        label={`Commerce: ${gate}`}
        tone={gate === 'DEMO_CSV' ? 'success' : 'warning'}
      />
      <XivStatusPill label={`Navigator: ${view.status}`} tone={view.status === 'READY' ? 'success' : 'warning'} />

      <Card style={styles.card}>
        <SectionHeader kicker="Demo control" title="Load or clear session CSV" />
        <XivText variant="caption" muted>
          {view.commerce.note}
        </XivText>
        <View style={styles.chips}>
          <Button label={busy ? 'Working…' : 'Load DEMO_CSV'} variant="subtle" disabled={busy} onPress={onLoadDemo} />
          <Button
            label="Clear demo"
            variant="subtle"
            disabled={busy || gate !== 'DEMO_CSV'}
            onPress={onClearDemo}
          />
          <Button label="Refresh" variant="subtle" disabled={busy} onPress={refresh} />
        </View>
        {localError ? (
          <XivText variant="caption" color={Palette.warning}>
            {localError}
          </XivText>
        ) : null}
      </Card>

      <SectionHeader kicker="Snapshot" title="Commerce metrics" />
      {gate === 'DEMO_CSV' && view.commerce.rows ? (
        <>
          <ModuleCard
            tag="DEMO_CSV"
            title={view.commerce.sourceLabel}
            body={`Units ${view.commerce.totals.units ?? '—'} · Revenue USD ${view.commerce.totals.revenueUsd ?? '—'} · Rows ${view.commerce.totals.rowCount ?? '—'} · demoOnly`}
          />
          {view.commerce.rows.map((row) => (
            <ModuleCard
              key={`${row.sku}-${row.channel}`}
              tag={row.channel}
              title={row.sku}
              body={`Units ${row.units} · Revenue USD ${row.revenueUsd}`}
            />
          ))}
        </>
      ) : (
        <ModuleCard
          tag="WAITING_CONNECTOR"
          title="No commerce metrics"
          body="WAITING_CONNECTOR — CSV demo unbound. Totals remain null. Nothing is fabricated."
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
