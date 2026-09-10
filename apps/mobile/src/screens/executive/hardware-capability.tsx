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
  fetchHardwareProbe,
  type HardwareProbeReport,
} from '@/lib/hardware-probe';

/**
 * EY3 — Hardware capability probe readout for Executive.
 * Live GET /v1/hardware. GPU/NPU only DETECTED/WAITING — never fake VERIFIED.
 * L4 false; Ollama reachability is honest.
 */
export function HardwareCapabilityScreen() {
  const [report, setReport] = useState<HardwareProbeReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await fetchHardwareProbe();
      if (!result.ok) {
        setReport(null);
        setError(
          result.reason === 'unconfigured'
            ? 'EXPO_PUBLIC_XIV_AI_URL not set — WAITING for AI service base URL.'
            : result.reason === 'malformed'
              ? 'Hardware probe response malformed.'
              : 'AI service /v1/hardware unreachable.',
        );
        return;
      }
      setReport(result.report);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <ExperienceScreen
      title="Hardware probe"
      subtitle="EY3 capability readout — presence only, not silicon VERIFIED."
    >
      <PrototypeNotice text="AMD CPU may show DETECTED. GPU/NPU stay DETECTED or WAITING — never VERIFIED without a workload proof. Ollama reachable is live HTTP only. L4 remains false." />

      <SectionHeader kicker="EY3" title="Live probe — GET /v1/hardware" />
      <Card style={styles.card}>
        <Button
          label={busy ? 'Probing…' : 'Run hardware probe'}
          disabled={busy}
          onPress={() => void refresh()}
        />
        <Button label="Refresh" variant="subtle" disabled={busy} onPress={() => void refresh()} />
        {error ? (
          <XivText variant="caption" color={Palette.warning}>
            {error}
          </XivText>
        ) : null}
      </Card>

      {report ? (
        <View style={styles.stack}>
          <XivStatusPill label={`L4 autonomy: ${String(report.l4Autonomy)}`} tone="warning" />
          <ModuleCard
            tag={`CPU · ${report.cpu.state}`}
            title={`${report.cpu.vendor} · ${report.cpu.model}`}
            body={`${report.cpu.cores} cores / ${report.cpu.threads} threads. ${report.cpu.notes}`}
            meta={`${report.hostname} · ${report.platform}/${report.arch}`}
          />
          <ModuleCard
            tag={`GPU · ${report.gpu.state}`}
            title={`${report.gpu.vendor} · ${report.gpu.name ?? 'WAITING'}`}
            body={report.gpu.notes}
            meta="Never VERIFIED from EY3 alone"
          />
          <ModuleCard
            tag={`NPU · ${report.npu.state}`}
            title={report.npu.name ?? 'WAITING'}
            body={report.npu.notes}
            meta="Never VERIFIED from EY3 alone"
          />
          <ModuleCard
            tag={`Ollama · ${report.ollama.state}`}
            title={report.ollama.reachable ? 'Reachable' : 'Unreachable'}
            body={`${report.ollama.baseUrl}. Models: ${
              report.ollama.models.length ? report.ollama.models.join(', ') : '(none)'
            }. ${report.ollama.notes}`}
            meta={report.collectedAt}
          />
        </View>
      ) : (
        <ModuleCard
          tag="WAITING"
          title="No probe yet"
          body="Run against the ASUS AI service when it is up. GPU/NPU will never be shown as VERIFIED from this screen."
        />
      )}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stack: {
    gap: Spacing.sm,
  },
});
