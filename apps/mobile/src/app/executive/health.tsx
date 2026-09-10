import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DataStatusMark, statusFromReport } from '@/components/agents/data-status';
import { GovernedHealthResult } from '@/components/agents/governed-health-result';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useGovernedRuntime } from '@/hooks/use-governed-runtime';
import { probeAiService } from '@/lib/xiv-ai-api';

/**
 * US-EXE-01 — Executive Business Health.
 * Loads live governed health via analyzeLiveBusinessHealth (no mock metrics).
 * Shows WAITING_DATA when the AI service or company source is disconnected.
 */
export default function ExecutiveHealth() {
  const { busy, lastResult, runLiveHealth } = useGovernedRuntime();
  const [aiReachable, setAiReachable] = useState<boolean | null>(null);
  const report = lastResult?.healthReport ?? null;
  const mark = statusFromReport(report);

  const waitingData =
    aiReachable === false ||
    !report ||
    report.dataStatus === 'unavailable' ||
    report.dataStatus === 'not_configured' ||
    (report.prototype === false &&
      report.overallStatus === 'unknown' &&
      report.findings.length === 0 &&
      report.dataStatus !== 'live');

  const liveHonest = Boolean(report && report.dataStatus === 'live' && !report.prototype);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const probe = await probeAiService();
      if (cancelled) return;
      setAiReachable(probe.reachable);
      runLiveHealth();
    })();
    return () => {
      cancelled = true;
    };
    // Mount-only probe + first live load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    void (async () => {
      const probe = await probeAiService();
      setAiReachable(probe.reachable);
      runLiveHealth();
    })();
  };

  const scoreLabel = waitingData
    ? 'WAITING_DATA'
    : liveHonest
      ? `LIVE · ${report!.overallStatus}`
      : mark === 'stale'
        ? 'STALE DATA'
        : mark === 'prototype'
          ? 'PROTOTYPE (not shown as live)'
          : String(report?.dataStatus ?? 'unknown').toUpperCase();

  const scoreDisplay =
    waitingData || !report || report.dataStatus !== 'live' ? '—' : String(report.overallScore);

  const scoreColor =
    waitingData || !report || report.dataStatus !== 'live'
      ? Palette.warning
      : report.overallStatus === 'healthy'
        ? Palette.success
        : report.overallStatus === 'strained'
          ? Palette.danger
          : Palette.accent;

  const notice = waitingData
    ? 'WAITING_DATA. AI service or company source is not connected with usable records. No fake metrics are shown.'
    : liveHonest
      ? 'Live governed Business Health from authorized sources only. Recommendations require human approval. L4 remains disabled.'
      : 'Data status is honest. Prototype findings are labeled and never presented as live company metrics.';

  return (
    <ExperienceScreen title="Company health" subtitle="Governed live Business Health — never fabricated.">
      <PrototypeNotice text={notice} />

      <DataStatusMark
        status={aiReachable === false ? 'unavailable' : mark}
        source={report?.provenance?.sourceSystem}
        freshness={report?.freshnessStatus ?? report?.provenance?.freshness}
        retrievedAt={report?.generatedAt ?? report?.provenance?.retrievedAt}
      />

      <Card accent style={styles.score}>
        <XivText variant="caption" color={Palette.accent}>
          {scoreLabel}
        </XivText>
        <XivText variant="display" color={scoreColor}>
          {scoreDisplay}
        </XivText>
        <XivText variant="body" muted>
          {waitingData
            ? 'Score unknown until an authorized live source responds. Do not treat a blank score as healthy.'
            : (report?.narrativeSummary ?? 'No narrative yet.')}
        </XivText>
        {report?.organization?.name ? (
          <XivText variant="caption" dim>
            Org context: {report.organization.name}
            {report.usedPrototypeFallback === false ? ' · no prototype fallback' : ''}
          </XivText>
        ) : null}
      </Card>

      <Button
        label={busy ? 'Loading live health…' : 'Refresh live health'}
        variant="subtle"
        disabled={busy}
        onPress={refresh}
      />

      {waitingData ? (
        <Card style={styles.block}>
          <XivText variant="label" color={Palette.warning}>
            WAITING_DATA
          </XivText>
          <XivText variant="body" muted>
            {aiReachable === false
              ? 'XIV AI service (/health) was not reachable. Start services/ai on :8787, then refresh.'
              : 'Connected sources did not yield company metrics. ERP/WMS/TMS/CRM remain unconnected. Nothing was invented.'}
          </XivText>
        </Card>
      ) : null}

      {report && !waitingData ? (
        <>
          <SectionHeader kicker="Findings" title="Where health is observed" />
          {report.findings.length === 0 ? (
            <ModuleCard
              tag={String(report.dataStatus ?? 'unknown')}
              title="No domain findings yet"
              body="Live path returned without operational domain findings. Unsupported domains stay empty rather than filled with sample data."
            />
          ) : (
            report.findings.map((item) => (
              <ModuleCard
                key={item.findingId}
                tag={`${item.domain} · ${item.severity}`}
                title={item.title}
                body={`${item.summary} Evidence: ${item.evidenceQuality}. ${item.prototype ? 'Prototype-labeled.' : 'Live-authorized.'}`}
              />
            ))
          )}

          <SectionHeader kicker="Watch" title="Risks" />
          {report.topRisks.length === 0 ? (
            <ModuleCard tag="Risk" title="No live risks listed" body="Empty risk list — not a fabricated all-clear." />
          ) : (
            report.topRisks.map((risk) => (
              <ModuleCard key={risk} tag="Risk" title={risk} body="From governed live health report." />
            ))
          )}

          <SectionHeader kicker="Next" title="Recommended (not executed)" />
          <ModuleCard
            tag="requiresApproval"
            title={report.topOpportunities[0] ?? 'Review findings with a human before any operational change.'}
            body="requiresApproval=true. Human approval does not override policy. L4_AUTONOMY_ENABLED=false."
          />

          {report.unsupportedDomains && report.unsupportedDomains.length > 0 ? (
            <View style={styles.block}>
              <XivText variant="caption" dim>
                Unsupported domains: {report.unsupportedDomains.join(', ')}
              </XivText>
            </View>
          ) : null}

          <GovernedHealthResult report={report} />
        </>
      ) : null}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  score: {
    gap: Spacing.two,
  },
  block: {
    gap: Spacing.two,
  },
});