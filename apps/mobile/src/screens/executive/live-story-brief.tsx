import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { briefStatus, DataStatusMark } from '@/components/agents/data-status';
import { GovernedBriefResult, StoryBriefChapters } from '@/components/agents/governed-brief-result';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useGovernedRuntime } from '@/hooks/use-governed-runtime';
import { probeAiService } from '@/lib/xiv-ai-api';

/**
 * US-EXE-02 - Story Engine brief (what changed / why).
 * Live path: summarizeLiveExecutiveBrief via runLiveBrief. Never fabricates narrative.
 * Read-only; actions requireApproval; L4 remains off. Founder Twin is guidance-only.
 */
export function LiveStoryBriefScreen({
  title = 'Business Story',
  subtitle = 'Story Engine - what changed, why it may matter, evidence. Never fabricated.',
}: {
  title?: string;
  subtitle?: string;
}) {
  const { busy, lastResult, runLiveBrief } = useGovernedRuntime();
  const [aiReachable, setAiReachable] = useState<boolean | null>(null);
  const brief = lastResult?.brief ?? null;
  const mark = brief ? briefStatus(brief) : 'unavailable';

  const waitingData =
    aiReachable === false ||
    !brief ||
    brief.dataStatus === 'unavailable' ||
    brief.dataStatus === 'not_configured';

  const liveHonest = Boolean(brief && brief.dataStatus === 'live' && !brief.prototype);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const probe = await probeAiService();
      if (cancelled) return;
      setAiReachable(probe.reachable);
      runLiveBrief();
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
      runLiveBrief();
    })();
  };

  const headline = waitingData
    ? 'WAITING_DATA'
    : liveHonest
      ? 'LIVE · Story Engine brief'
      : mark === 'stale'
        ? 'STALE DATA'
        : mark === 'prototype'
          ? 'PROTOTYPE (not shown as live)'
          : String(brief?.dataStatus ?? 'unknown').toUpperCase();

  const changedPreview = waitingData
    ? '-'
    : brief!.criticalChanges[0] ??
      (liveHonest ? 'No observed changes in authorized sources yet' : brief!.freshnessSummary);

  const notice = waitingData
    ? 'WAITING_DATA. AI service or company source is not connected with usable records. No fake what-changed / why narrative is shown.'
    : liveHonest
      ? 'Live governed Story Engine brief from authorized sources only. Read-only. Recommendations require human approval. L4 remains disabled. Founder Twin cannot approve writes.'
      : 'Data status is honest. Prototype or non-live briefs are labeled and never presented as production company narrative.';

  return (
    <ExperienceScreen title={title} subtitle={subtitle}>
      <PrototypeNotice text={notice} />

      <DataStatusMark
        status={aiReachable === false ? 'unavailable' : mark}
        source={brief?.sources[0]}
        freshness={brief?.freshness}
        retrievedAt={brief?.generatedAt}
      />

      <Card accent style={styles.hero}>
        <XivText variant="caption" color={Palette.accent}>
          {headline}
        </XivText>
        <XivText variant="subtitle" color={waitingData ? Palette.warning : Palette.text}>
          What changed
        </XivText>
        <XivText variant="body" muted>
          {changedPreview}
        </XivText>
        {brief?.organization && 'name' in brief.organization && brief.organization.name ? (
          <XivText variant="caption" dim>
            Org context: {brief.organization.name}
            {brief.prototype ? ' · prototype-labeled' : ' · no fabricated story'}
          </XivText>
        ) : null}
      </Card>

      <Button
        label={busy ? 'Loading live brief…' : 'Refresh live Story Engine brief'}
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
              : 'Connected sources did not yield a Story Engine brief. ERP/WMS/TMS/CRM remain unconnected. Salesforce skipped. Nothing was invented.'}
          </XivText>
        </Card>
      ) : null}

      {brief && !waitingData ? (
        <>
          <StoryBriefChapters brief={brief} />
          <GovernedBriefResult brief={brief} />
        </>
      ) : null}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
  },
  block: {
    gap: Spacing.two,
  },
});
