/**
 * Design System V4 storytelling + status components.
 */
import { StyleSheet, View } from 'react-native';

import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DataSurfaceState } from '@/lib/surface-state';

import { XivEvidenceChip, XivGlassPanel, XivStatusPill } from '@/components/premium';

const TONE: Record<DataSurfaceState, 'live' | 'warning' | 'success' | 'neutral' | 'sponsored'> = {
  LIVE: 'live',
  CONNECTED: 'success',
  SYNCING: 'neutral',
  STALE: 'warning',
  DEGRADED: 'warning',
  NOT_CONFIGURED: 'warning',
  DEMO: 'sponsored',
  HISTORICAL: 'neutral',
  INFERENCE: 'neutral',
  FORECAST: 'warning',
  UNAVAILABLE: 'warning',
};

export function XivStatusIndicator({ state }: { state: DataSurfaceState }) {
  return <XivStatusPill label={state.replace('_', ' ')} tone={TONE[state]} />;
}

export function XivSourceBadge({ source, state }: { source: string; state: DataSurfaceState }) {
  return (
    <View style={styles.row} accessibilityLabel={`Source ${source} ${state}`}>
      <XivStatusIndicator state={state} />
      <XivText variant="metadata" muted>
        {source}
      </XivText>
    </View>
  );
}

export function XivConfidenceBadge({ confidence }: { confidence: 'low' | 'medium' | 'high' | 'unknown' }) {
  return <XivStatusPill label={`Confidence ${confidence}`} tone="neutral" />;
}

export function SourceFreshness({ timestamp, state }: { timestamp: string | null; state: DataSurfaceState }) {
  return (
    <XivText variant="micro" dim>
      {timestamp ?? 'No timestamp'} · {state}
    </XivText>
  );
}

export function EvidenceStrip({ items }: { items: readonly string[] }) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <XivEvidenceChip key={item} label={item} />
      ))}
    </View>
  );
}

export function ImpactSummary({ text }: { text: string }) {
  return (
    <XivText variant="body" muted>
      {text}
    </XivText>
  );
}

export function RecommendedAction({ text }: { text: string }) {
  return (
    <XivText variant="card" color={Palette.accentBright}>
      Next: {text}
    </XivText>
  );
}

export function DataQualityIndicator({ explanation }: { explanation: string }) {
  return (
    <XivText variant="metadata" dim>
      Data quality: {explanation}
    </XivText>
  );
}

export function IntelligenceStoryCard({
  title,
  happened,
  why,
  impact,
  next,
  action,
  evidence,
  confidence,
  source,
  timestamp,
  state,
  demo = true,
}: {
  title: string;
  happened: string;
  why: string;
  impact: string;
  next: string;
  action: string;
  evidence: readonly string[];
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  source: string;
  timestamp: string | null;
  state: DataSurfaceState;
  demo?: boolean;
}) {
  return (
    <XivGlassPanel accessibilityRole="summary" accessibilityLabel={title}>
      <XivSourceBadge source={source} state={state} />
      <XivText variant="card">{title}</XivText>
      <XivText variant="label" color={Palette.accent}>
        What happened
      </XivText>
      <XivText variant="body">{happened}</XivText>
      <XivText variant="label" color={Palette.accent}>
        Why
      </XivText>
      <XivText variant="body" muted>
        {why}
      </XivText>
      <XivText variant="label" color={Palette.accent}>
        Impact
      </XivText>
      <ImpactSummary text={impact} />
      <XivText variant="label" color={Palette.accent}>
        What may happen next
      </XivText>
      <XivText variant="body" muted>
        {next}
      </XivText>
      <RecommendedAction text={action} />
      <EvidenceStrip items={evidence} />
      <XivConfidenceBadge confidence={confidence} />
      <SourceFreshness timestamp={timestamp} state={state} />
      <DataQualityIndicator explanation="Explainable score. Not certainty." />
      {demo || state === 'DEMO' ? <SampleMark text="DEMONSTRATION · NOT PRODUCTION" /> : null}
      {state === 'FORECAST' ? (
        <XivText variant="micro" color={Palette.warning}>
          Forecast is not a fact.
        </XivText>
      ) : null}
    </XivGlassPanel>
  );
}

export function BusinessTimeline({ periods }: { periods: readonly string[] }) {
  return (
    <View style={styles.timeline}>
      {periods.map((period) => (
        <View key={period} style={styles.tick}>
          <View style={styles.dot} />
          <XivText variant="metadata">{period}</XivText>
        </View>
      ))}
    </View>
  );
}

export function ComparisonPanel({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.compare}>
      <XivGlassPanel>
        <XivText variant="label">Period A</XivText>
        <XivText variant="body">{left}</XivText>
      </XivGlassPanel>
      <XivGlassPanel>
        <XivText variant="label">Period B</XivText>
        <XivText variant="body">{right}</XivText>
      </XivGlassPanel>
    </View>
  );
}

export function RiskOpportunityPanel({ risk, opportunity }: { risk: string; opportunity: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.warning}>
        Risk
      </XivText>
      <XivText variant="body" muted>
        {risk}
      </XivText>
      <XivText variant="label" color={Palette.success}>
        Opportunity
      </XivText>
      <XivText variant="body" muted>
        {opportunity}
      </XivText>
    </XivGlassPanel>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  timeline: {
    gap: Spacing.two,
  },
  tick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.accent,
  },
  compare: {
    gap: Spacing.two,
  },
});
