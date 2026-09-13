import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { XivListRow, XivStatusIndicator } from '@/components/v4';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { LoadingState } from '@/components/xiv/loading-state';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { requestExecutiveBrief, XivAiRequestError, type ExecutiveBrief } from '@/lib/xiv-ai-api';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; brief: ExecutiveBrief };

function BriefRows({ title, rows }: { title: string; rows: string[] }) {
  if (!rows.length) return null;
  return <View style={styles.section}><SectionHeader title={title} />{rows.map((row, i) => <XivListRow key={`${title}-${i}`} title={row} />)}</View>;
}

export function ExecutiveBriefScreen() {
  const { authSession } = useSession();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const load = useCallback(async () => {
    const token = authSession?.access_token;
    if (!token) { setState({ kind: 'error', message: 'Your secure session is unavailable. Sign in again.' }); return; }
    setState({ kind: 'loading' });
    try { const response = await requestExecutiveBrief(token); setState({ kind: 'ready', brief: response.brief }); }
    catch (error) { setState({ kind: 'error', message: error instanceof XivAiRequestError ? error.message : 'The brief is unavailable.' }); }
  }, [authSession?.access_token]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <ExperienceScreen title="CEO Command Brief" subtitle="What changed, why it matters, and what needs your decision." atmosphere="restrained">
      {state.kind === 'loading' ? <LoadingState label="Preparing your governed brief" lines={4} /> : null}
      {state.kind === 'error' ? <Card variant="risk" accessibilityRole="alert"><XivText variant="subtitle">Brief unavailable</XivText><XivText variant="body" muted>{state.message}</XivText><XivText variant="caption" color={Palette.warning}>No cached company data is shown.</XivText><Button label="Try again" onPress={() => void load()} /></Card> : null}
      {state.kind === 'ready' ? <>
        <Card variant="hero" accessible accessibilityLabel={`Brief confidence ${state.brief.confidence}`}>
          <View style={styles.status}><XivStatusIndicator state={state.brief.dataStatus === 'live' ? 'LIVE' : 'NOT_CONFIGURED'} /><XivText variant="label" color={Palette.accent}>{state.brief.confidence.toUpperCase()} CONFIDENCE</XivText></View>
          <XivText variant="body" muted>{state.brief.freshnessSummary}</XivText>
          <XivText variant="caption" color={Palette.warning}>{state.brief.financialImpactNote}</XivText>
        </Card>
        {!state.brief.topRisks.length && !state.brief.topOpportunities.length && !state.brief.recommendedPriorities.length ? <EmptyState title="No verified business signals yet" body="Connect an authorized company source to build a current brief. XIV will not present sample data as live company intelligence." /> : null}
        <BriefRows title="Critical changes" rows={state.brief.criticalChanges} />
        <BriefRows title="Top priorities" rows={state.brief.recommendedPriorities} />
        <BriefRows title="Risks" rows={state.brief.topRisks} />
        <BriefRows title="Opportunities" rows={state.brief.topOpportunities} />
        <BriefRows title="Decisions awaiting approval" rows={state.brief.decisionsAwaitingApproval} />
        <Button label="Refresh brief" variant="secondary" onPress={() => void load()} />
        <XivText variant="micro" dim>Generated {new Date(state.brief.generatedAt).toLocaleString()} · Sources: {state.brief.sources.join(', ') || 'none'}</XivText>
      </> : null}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({ section: { gap: Spacing.two }, status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two } });
