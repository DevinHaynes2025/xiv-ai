import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { DEMO_MARK, type OsStory } from '@/data/operating-system';

import { Button } from './button';
import { Card } from './card';
import { PrototypeNotice } from './prototype-notice';
import { RiskBadge } from './risk-badge';
import { SampleMark } from './sample-mark';
import { XivText } from './text';
import { XivCausalChain } from './xiv-causal-chain';
import { XivEvidencePanel } from './xiv-evidence-panel';
import { XivRecommendationCard } from './xiv-recommendation-card';

type Props = {
  story: OsStory;
  compact?: boolean;
  onAskXiv?: () => void;
  onApprovePlan?: () => void;
  approveLive?: boolean;
};

export function XivStoryCard({ story, compact, onAskXiv, onApprovePlan, approveLive }: Props) {
  const [evidence, setEvidence] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [prototype, setPrototype] = useState<string | null>(null);

  return (
    <Card variant="hero" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          {story.kicker}
        </XivText>
        <SampleMark text={DEMO_MARK} />
      </View>
      <XivText variant="label" color={Palette.textDim}>
        What happened
      </XivText>
      <XivText variant="subtitle">{story.happened}</XivText>
      <View style={styles.block}>
        <XivText variant="label" color={Palette.warning}>
          Why
        </XivText>
        <XivText variant="body" muted>
          {story.why}
        </XivText>
      </View>
      <View style={styles.block}>
        <XivText variant="label" color={Palette.danger}>
          Affects
        </XivText>
        <XivText variant="body">{story.affects}</XivText>
      </View>
      {!compact ? <XivRecommendationCard recommends={story.recommends} ifWeAct={story.ifWeAct} /> : null}
      <XivCausalChain nodes={story.chain} />
      {compact ? (
        <XivText variant="caption" color={Palette.textDim} numberOfLines={2}>
          {story.recommends}
        </XivText>
      ) : null}
      <RiskBadge level={story.risk} />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="View Evidence"
            variant="secondary"
            onPress={() => setEvidence((value) => !value)}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Run Simulation"
            variant="secondary"
            onPress={() => {
              setSimulation((value) => !value);
              setPrototype('Simulation is DEMO only. No warehouse, labor, or CRM write ran.');
            }}
          />
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Approve Plan"
            variant={approveLive ? 'success' : 'subtle'}
            onPress={() => {
              if (approveLive && onApprovePlan) {
                onApprovePlan();
                return;
              }
              setPrototype(
                'Approve Plan is prototype. It cannot bypass governance. Open the live Business or Executive agent to use the existing approval flow.',
              );
            }}
          />
        </View>
        {onAskXiv ? (
          <View style={styles.action}>
            <Button label="Ask XIV" onPress={onAskXiv} />
          </View>
        ) : null}
      </View>
      {evidence ? <XivEvidencePanel items={story.evidence} /> : null}
      {simulation ? (
        <XivText variant="caption" color={Palette.warning}>
          DEMO simulation: rebalancing Zone A → Zone C would cover the 287-order wave on paper. No labor system was called.
        </XivText>
      ) : null}
      {prototype ? <PrototypeNotice text={prototype} /> : null}
    </Card>
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
  block: {
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
