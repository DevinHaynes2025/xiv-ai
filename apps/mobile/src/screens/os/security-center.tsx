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
 * US-SEC-01 — Security Center (Executive).
 * Guardian read-only checks + policy denials visible.
 * WAITING_DATA when unbound; never fabricates incidents; not live exploit tooling.
 * L4 false; no autonomous production mutations.
 */
export function SecurityCenterScreen() {
  const [view, setView] = useState<SecurityCenterView>(() => sessionSecurityCenterView());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setView(sessionSecurityCenterView());
  }, []);

  const onProbeDenials = () => {
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

  const onClearDenials = () => {
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

  const gateTone = view.status === 'READY' ? 'success' : 'warning';

  return (
    <ExperienceScreen
      title="Security Center"
      subtitle="US-SEC-01 — Guardian read-only checks + policy denials for Executive. Not live exploit tooling."
      atmosphere="cinematic"
    >
      <PrototypeNotice text="Policy denials come from real evaluatePolicy results in session memory. Incidents stay null — nothing is fabricated. Guardian checks listed here are read-only definitions (not host exploit runs from this screen). L4 false; no autonomous production mutations." />

      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={SECURITY_CENTER_POLICY.label} tone="warning" />
      <XivStatusPill label="liveExploitTooling: false" tone="warning" />
      <XivStatusPill label="guardianMode: read_only_checks" tone="warning" />
      <XivStatusPill label={`Center: ${view.status}`} tone={gateTone} />
      <XivStatusPill
        label={`Denials: ${view.denialGate}`}
        tone={view.denialGate === 'SESSION_DENIALS' ? 'success' : 'warning'}
      />
      <XivStatusPill label="incidents: null (never fabricated)" tone="warning" />

      <Card style={styles.card}>
        <SectionHeader kicker="Executive path" title="Policy denial visibility" />
        <XivText variant="caption" muted>
          {view.note}
        </XivText>
        <View style={styles.chips}>
          <Button
            label={busy ? 'Working…' : 'Probe known denials'}
            variant="subtle"
            disabled={busy}
            onPress={onProbeDenials}
          />
          <Button
            label="Clear denials"
            variant="subtle"
            disabled={busy || view.denialGate !== 'SESSION_DENIALS'}
            onPress={onClearDenials}
          />
          <Button label="Refresh" variant="subtle" disabled={busy} onPress={refresh} />
        </View>
        {localError ? (
          <XivText variant="caption" color={Palette.warning}>
            {localError}
          </XivText>
        ) : null}
      </Card>

      <SectionHeader kicker="Policy denials" title="Visible denials (honest gates)" />
      {view.denialGate === 'SESSION_DENIALS' && view.denials ? (
        view.denials.map((denial) => (
          <ModuleCard
            key={denial.id}
            tag="DENIED"
            title={`${denial.agentId} → ${denial.toolId}`}
            body={`${denial.reason} · env ${denial.environment} · ${denial.recordedAt} · incidentFabricated=false · not exploit tooling`}
          />
        ))
      ) : (
        <ModuleCard
          tag="WAITING_DATA"
          title="No policy denials"
          body="WAITING_DATA — no evaluatePolicy denials recorded in this session. Denial rows are not invented. Incidents remain null."
        />
      )}

      <SectionHeader kicker="Guardian" title="Read-only check catalog" />
      <XivText variant="caption" muted>
        Definitions only. Host-process checks run on a trusted host via guardian:validate — not as live exploit tooling from this mobile surface.
      </XivText>
      {view.guardianChecks.map((check) => (
        <Card key={check.id} style={styles.card}>
          <View style={styles.head}>
            <XivText variant="label" color={Palette.accent}>
              {check.category}
            </XivText>
            <XivText variant="label" color={Palette.warning}>
              {check.severity} · readOnly
            </XivText>
          </View>
          <XivText variant="subtitle">{check.name}</XivText>
          <XivText variant="caption" muted>
            {check.id} · {check.executionType} · safeToRun={String(check.safeToRun)} · enabled={String(check.enabled)}
          </XivText>
          <XivText variant="caption" color={Palette.textDim}>
            {check.note}
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
