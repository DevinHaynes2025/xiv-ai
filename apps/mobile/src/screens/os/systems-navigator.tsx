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
 * US-SYS-01 — System Navigator CSV/commerce demo (Executive).
 * Connector stubs only — not live ERP.
 * WAITING_CONNECTOR / WAITING_DATA when unbound; DEMO_CSV only after explicit load.
 * Never fabricate commerce metrics. L4 false; no autonomous production mutations.
 */
export function SystemsNavigator() {
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
      const result = loadSessionCommerceCsvDemo({
        label: 'builtin-commerce-demo.csv',
        csvText: BUILTIN_COMMERCE_CSV_TEXT,
      });
      setView(result.view);
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
      const result = clearSessionCommerceCsvDemo();
      setView(result.view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'demo_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  const commerceGate = view.commerce.gate;
  const gateTone =
    view.status === 'READY' ? 'success' : view.status === 'WAITING_CONNECTOR' ? 'warning' : 'warning';

  return (
    <ExperienceScreen
      title="System Navigator"
      subtitle="US-SYS-01 — connector stubs + CSV/commerce demo for Executive. Not live ERP."
    >
      <PrototypeNotice text="ERP, CRM, WMS remain connector stubs. Commerce metrics appear only after an explicit DEMO_CSV load. Unbound surfaces WAITING_CONNECTOR / WAITING_DATA — nothing is fabricated. L4 false; no production mutations. Credentials are not stored on this device." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={SYSTEM_NAVIGATOR_POLICY.label} tone="warning" />
      <XivStatusPill label="liveErp: false" tone="warning" />
      <XivStatusPill label="connectorMode: stub" tone="warning" />
      <XivStatusPill label={`Navigator: ${view.status}`} tone={gateTone} />
      <XivStatusPill
        label={`Commerce: ${commerceGate}`}
        tone={commerceGate === 'DEMO_CSV' ? 'success' : 'warning'}
      />

      <Card style={styles.card}>
        <SectionHeader kicker="Executive path" title="CSV / commerce demo" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <XivText variant="caption" muted>
          {view.commerce.note}
        </XivText>
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working…' : 'Load DEMO_CSV'}
            variant="subtle"
            disabled={busy}
            onPress={onLoadDemo}
          />
          <Button
            label="Clear demo"
            variant="subtle"
            disabled={busy || commerceGate !== 'DEMO_CSV'}
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

      <SectionHeader kicker="Commerce snapshot" title="Metrics (honest gates)" />
      {commerceGate === 'DEMO_CSV' && view.commerce.rows ? (
        <>
          <ModuleCard
            tag="DEMO_CSV"
            title={view.commerce.sourceLabel}
            body={`Units ${view.commerce.totals.units ?? '—'} · Revenue USD ${view.commerce.totals.revenueUsd ?? '—'} · Rows ${view.commerce.totals.rowCount ?? '—'} · demoOnly · not live ERP`}
          />
          {view.commerce.rows.map((row) => (
            <ModuleCard
              key={`${row.sku}-${row.channel}`}
              tag={row.channel}
              title={row.sku}
              body={`Units ${row.units} · Revenue USD ${row.revenueUsd} · DEMO_CSV only`}
            />
          ))}
        </>
      ) : (
        <ModuleCard
          tag="WAITING_CONNECTOR"
          title="No commerce metrics"
          body="WAITING_CONNECTOR / WAITING_DATA — commerce CSV demo unbound. Totals stay null. Metrics are not invented."
        />
      )}

      <SectionHeader kicker="Company universe" title="Connected systems (stubs)" />
      {view.connectors.map((item) => (
        <Card key={item.id} style={styles.card}>
          <View style={styles.head}>
            <XivText variant="label" color={Palette.accent}>
              {item.domain}
            </XivText>
            <XivText variant="label" color={Palette.warning}>
              {item.status}
            </XivText>
          </View>
          <XivText variant="subtitle">{item.name}</XivText>
          <XivText variant="caption" muted>
            Freshness · {item.freshness}
          </XivText>
          <XivText variant="caption" muted>
            Agent access · {item.access}
          </XivText>
          <XivText variant="caption" color={Palette.textDim}>
            live={String(item.live)} · {item.note}
          </XivText>
        </Card>
      ))}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
});
