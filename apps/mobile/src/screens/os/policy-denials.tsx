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
  SECURITY_CENTER_POLICY,
  type SecurityCenterView,
} from '@/lib/ai';
import {
  clearSessionPolicyDenials,
  probeSessionPolicyDenials,
  sessionSecurityCenterView,
} from '@/lib/security-center';

/**
 * US-SEC-01 — Policy Denials companion screen (Executive).
 * Surfaces real evaluatePolicy denials only. Never fabricates incidents.
 * WAITING_DATA when unbound. L4 false; no live exploit tooling.
 */
export function PolicyDenialsScreen() {
  const [view, setView] = useState<SecurityCenterView>(() => sessionSecurityCenterView());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionSecurityCenterView());
  }, []);

  const onProbe = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(probeSessionPolicyDenials().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'denial_probe_failed');
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      setView(clearSessionPolicyDenials().view);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'denial_clear_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ExperienceScreen
      title="Policy Denials"
      subtitle="US-SEC-01 — evaluatePolicy denials visible. Not an incident feed. Not live exploit tooling."
    >
      <PrototypeNotice text="Only real policy denials (verdict=denied) appear here. requires_approval is not recorded as a denial. Incidents are never fabricated. Companion to Security Center." />

      <XivStatusPill label={SECURITY_CENTER_POLICY.label} tone="warning" />
      <XivStatusPill label={`Gate: ${view.denialGate}`} tone={view.denialGate === 'SESSION_DENIALS' ? 'success' : 'warning'} />
      <XivStatusPill label="incidents: null" tone="warning" />
      <XivStatusPill label="L4: false · productionMutation: false" tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Session" title="Denial probe" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <View style={styles.chips}>
          <Button label={busy ? 'Working…' : 'Probe known denials'} variant="subtle" disabled={busy} onPress={onProbe} />
          <Button label="Clear" variant="subtle" disabled={busy || view.denialGate !== 'SESSION_DENIALS'} onPress={onClear} />
          <Button label="Refresh" variant="subtle" disabled={busy} onPress={refresh} />
        </View>
        {localError ? (
          <XivText variant="caption" color={Palette.warning}>
            {localError}
          </XivText>
        ) : null}
      </Card>

      <SectionHeader kicker="Denials" title="Recorded policy denials" />
      {view.denials && view.denials.length > 0 ? (
        view.denials.map((denial) => (
          <ModuleCard
            key={denial.id}
            tag="DENIED"
            title={`${denial.agentId} / ${denial.toolId}`}
            body={`${denial.reason} · ${denial.environment} · source=${denial.source}`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="Honest empty"
          body="WAITING_DATA — no denials in session. Rows are not invented. This is not a fabricated incident list."
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
