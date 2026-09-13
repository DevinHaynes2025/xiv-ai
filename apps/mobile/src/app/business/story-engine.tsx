import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SampleMark } from '@/components/xiv/sample-mark';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Radius, Spacing } from '@/constants/theme';

/**
 * DEMO_STORY is example data, shaped after the master plan's Story Engine: a KPI change
 * is turned into a causal narrative and a set of treatment options, walked up the
 * SIGNAL -> CONTEXT -> STORY -> TREATMENT -> ACTION -> LEARNING ladder. It is static,
 * hand-written example content used to preview this screen's layout. It is NEVER a
 * measured KPI, it is not fetched from any server, and no narrative on this screen was
 * produced by a model call (modelCalls: 0).
 */
const DEMO_STORY = {
  generatedLabel: 'Static example story (not live)',
  signal: {
    metric: 'Supplier X on-time delivery',
    change: '14% of purchase orders slipped +6 days this example month',
    detectedBy: 'example threshold rule, not a model',
  },
  context: [
    'Example inventory for the affected SKU covers 9 days of example demand.',
    'Two alternate example suppliers quote 4 and 7 days lead time.',
    'One open example work order consumes the same part in 11 days.',
  ],
  narrative:
    'In this example, a supplier lead-time slip meets a thin inventory position before a '
    + 'scheduled internal work order. If nothing changes, the example plan misses its date by '
    + 'roughly two days. Three treatment options exist; one needs a human decision today.',
  ladder: [
    { stage: 'SIGNAL', detail: 'Threshold rule flagged the metric change.' },
    { stage: 'CONTEXT', detail: 'Inventory, alternates and the work order were joined.' },
    { stage: 'STORY', detail: 'The causal narrative above was assembled.' },
    { stage: 'TREATMENT', detail: 'Three options were prepared below.' },
    { stage: 'ACTION', detail: 'Every option ends at an explicit human approval gate.' },
    { stage: 'LEARNING', detail: 'Outcomes are recorded as evidence, never auto-promoted.' },
  ] as const,
  treatmentOptions: [
    {
      title: 'Split the order',
      detail: 'Split the example PO across the two alternates; keeps the work order date.',
      decision: 'Requires human approval to become a purchase action.',
    },
    {
      title: 'Switch alternate',
      detail: 'Move the volume to the 4-day example alternate at a higher example price.',
      decision: 'Requires human approval; a cost trade-off a human must accept.',
    },
    {
      title: 'Reschedule work order',
      detail: 'Move the internal work order by two days; no supplier change.',
      decision: 'Requires human approval from the production owner.',
    },
  ] as const,
  guardrails: {
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false,
    automaticRecovery: false,
    approvesActions: false,
    sendsPurchaseOrders: false,
    storiesFromLiveData: 0,
    modelCalls: 0,
    remoteCalls: 0,
  },
  humanActionsRequired: [
    'Choose a treatment option — or none — and approve it as a human.',
    'Confirm the causal narrative matches operational reality before acting.',
    'Decide which measured outcomes, if any, become reusable knowledge.',
  ],
} as const;

function LadderRow({ stage, detail }: { stage: string; detail: string }) {
  return (
    <View style={styles.ladderRow}>
      <XivText variant="label" color={Palette.accent}>
        {stage}
      </XivText>
      <XivText variant="caption" muted style={styles.ladderDetail}>
        {detail}
      </XivText>
    </View>
  );
}

export default function StoryEngine() {
  const { signal, guardrails } = DEMO_STORY;

  return (
    <ExperienceScreen
      title="Story engine"
      subtitle="Turns a KPI change into a causal narrative and treatment options.">
      <PrototypeNotice text="humanDecision: REQUIRED — nothing on this surface approves an action, sends an order, or promotes learning by itself. Every treatment option ends at an explicit human decision." />

      <SectionHeader kicker="Signal" title="What changed" />
      <MetricRow>
        <MetricCard
          title="Metric"
          value="On-time"
          detail={signal.metric}
          sample
        />
        <MetricCard
          title="Impact"
          value="+6 days"
          detail={signal.change}
          sample
        />
      </MetricRow>
      <Card style={styles.block}>
        <SampleMark text="Example data" />
        <XivText variant="caption" muted>
          {signal.detectedBy}.
        </XivText>
      </Card>

      <SectionHeader kicker="Context" title="What the story joined" />
      <Card style={styles.block}>
        <SampleMark text="Example data" />
        {DEMO_STORY.context.map((line) => (
          <XivText key={line} variant="body" muted>
            - {line}
          </XivText>
        ))}
      </Card>

      <SectionHeader kicker="Narrative" title="Causal story" />
      <Card style={styles.block}>
        <SampleMark text="Example data" />
        <XivText variant="body">{DEMO_STORY.narrative}</XivText>
      </Card>

      <SectionHeader kicker="Ladder" title="Signal to learning" />
      <Card style={styles.block}>
        <SampleMark text="Example data" />
        {DEMO_STORY.ladder.map((item) => (
          <LadderRow key={item.stage} stage={item.stage} detail={item.detail} />
        ))}
      </Card>

      <SectionHeader kicker="Treatment" title="Options a human decides" />
      {DEMO_STORY.treatmentOptions.map((option) => (
        <Card key={option.title} style={styles.block}>
          <SampleMark text="Example option" />
          <XivText variant="subtitle">{option.title}</XivText>
          <XivText variant="body" muted>
            {option.detail}
          </XivText>
          <XivText variant="label" color={Palette.warning}>
            {option.decision}
          </XivText>
        </Card>
      ))}

      <SectionHeader kicker="Governance" title="Decisions required" />
      <Card style={styles.block}>
        {DEMO_STORY.humanActionsRequired.map((action) => (
          <XivText key={action} variant="body" muted>
            - {action}
          </XivText>
        ))}
        <View style={styles.flags}>
          <XivText variant="label" color={Palette.warning}>
            humanDecision: {guardrails.humanDecision}
          </XivText>
          <XivText variant="label" color={Palette.warning}>
            learningPromoted: {String(guardrails.learningPromoted)}
          </XivText>
          <XivText variant="label" color={Palette.textDim}>
            modelCalls: {guardrails.modelCalls}
          </XivText>
          <XivText variant="label" color={Palette.textDim}>
            remoteCalls: {guardrails.remoteCalls}
          </XivText>
          <XivText variant="label" color={Palette.textDim}>
            storiesFromLiveData: {guardrails.storiesFromLiveData}
          </XivText>
        </View>
      </Card>

      <XivText variant="caption" muted style={styles.footer}>
        Example data — no live metric, agent, or model output is connected.
      </XivText>
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
    backgroundColor: Palette.navyMid,
  },
  ladderRow: {
    gap: 4,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
  ladderDetail: {
    flex: 1,
  },
  flags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  footer: {
    textAlign: 'center',
    paddingBottom: Spacing.two,
  },
});