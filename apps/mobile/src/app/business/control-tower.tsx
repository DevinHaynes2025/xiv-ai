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
 * DEMO_EVIDENCE is example data, shaped after the governed control-tower evidence surface
 * (services/ai control-tower-evidence). It is static, hand-written example content used to
 * preview this screen's layout. It is NEVER live agent or device telemetry, it is not fetched
 * from any server, and no number on this screen was measured from a real device or agent.
 */
const DEMO_EVIDENCE = {
  generatedLabel: 'Static example snapshot (not live)',
  pathway: {
    packetsConsidered: 6,
    uniqueStories: 4,
    eligibleNow: 1,
    blocked: 5,
    topBlockReasons: [
      { reason: 'human approval for pathway activation is missing', count: 3 },
      { reason: 'evidence binding incomplete for reviewed story', count: 2 },
    ] as const,
  },
  // Distinct ladder stages: a targeted matrix row is not an enrolled device, an enrolled device
  // is not a verified one, and a verified device is not an observed local worker. Logical
  // targets are never counted as live agents anywhere on this surface.
  deviceLadder: {
    targeted: 12,
    enrolled: 3,
    verified: 2,
    observed: 1,
  },
  guardrails: {
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false,
    activatesCandidates: false,
    grantsApproval: false,
    startsWorkers: false,
    workersStartedByThisSurface: 0,
    modelCalls: 0,
    remoteCalls: 0,
  },
  humanActionsRequired: [
    'Decide whether the eligible pathway candidate deserves human approval.',
    'Review blocked candidates and assign next evidence work.',
    'Confirm device fleet consent posture.',
  ],
} as const;

function LadderRow({ stage, count, detail }: { stage: string; count: number; detail: string }) {
  return (
    <View style={styles.ladderRow}>
      <View style={styles.ladderCopy}>
        <XivText variant="label" color={Palette.accent}>
          {stage}
        </XivText>
        <XivText variant="caption" muted>
          {detail}
        </XivText>
      </View>
      <XivText variant="subtitle">{count}</XivText>
    </View>
  );
}

export default function ControlTower() {
  const { pathway, deviceLadder, guardrails } = DEMO_EVIDENCE;

  return (
    <ExperienceScreen
      title="Control tower"
      subtitle="Governed evidence surface for pathway candidates and the device fleet.">
      <PrototypeNotice text="humanDecision: REQUIRED — nothing on this surface activates a candidate, grants approval, or starts a worker by itself. Every action needs an explicit human decision." />

      <SectionHeader kicker="Command" title="Pathway candidates" />
      <MetricRow>
        <MetricCard
          title="Eligible now"
          value={String(pathway.eligibleNow)}
          detail="Eligible by policy; still requires explicit human approval."
          sample
        />
        <MetricCard
          title="Blocked"
          value={String(pathway.blocked)}
          detail="Awaiting next evidence work, not activation."
          sample
        />
      </MetricRow>
      <Card style={styles.block}>
        <SampleMark text="Example data" />
        <XivText variant="caption" muted>
          Considered {pathway.packetsConsidered} pathway packet(s) across {pathway.uniqueStories}{' '}
          reviewed story or stories in this example snapshot.
        </XivText>
        {pathway.topBlockReasons.map((item) => (
          <View key={item.reason} style={styles.reasonRow}>
            <XivText variant="body" muted>
              {item.reason}
            </XivText>
            <XivText variant="caption" color={Palette.textDim}>
              x{item.count}
            </XivText>
          </View>
        ))}
      </Card>

      <SectionHeader kicker="Fleet" title="Device ladder" />
      <Card style={styles.block}>
        <SampleMark text="Example data" />
        <LadderRow
          stage="TARGETED"
          count={deviceLadder.targeted}
          detail="Compatibility matrix rows targeted. Not devices, and not live agents."
        />
        <LadderRow
          stage="ENROLLED"
          count={deviceLadder.enrolled}
          detail="Enrolled with consent. No local worker has been started."
        />
        <LadderRow
          stage="VERIFIED"
          count={deviceLadder.verified}
          detail="Compatibility verified. Still not active for local tasks."
        />
        <LadderRow
          stage="OBSERVED"
          count={deviceLadder.observed}
          detail="Distinct devices with an unexpired local-worker observation receipt."
        />
      </Card>

      <SectionHeader kicker="Governance" title="Decisions required" />
      <Card style={styles.block}>
        {DEMO_EVIDENCE.humanActionsRequired.map((action) => (
          <XivText key={action} variant="body" muted>
            - {action}
          </XivText>
        ))}
        <View style={styles.flags}>
          <XivText variant="label" color={Palette.warning}>
            learningPromoted: false
          </XivText>
          <XivText variant="label" color={Palette.textDim}>
            modelCalls: {guardrails.modelCalls}
          </XivText>
          <XivText variant="label" color={Palette.textDim}>
            remoteCalls: {guardrails.remoteCalls}
          </XivText>
          <XivText variant="label" color={Palette.textDim}>
            workersStartedByThisSurface: {guardrails.workersStartedByThisSurface}
          </XivText>
        </View>
      </Card>

      <XivText variant="caption" muted style={styles.footer}>
        Example data — no live agent or device telemetry is connected.
      </XivText>
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
    backgroundColor: Palette.navyMid,
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  ladderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
  ladderCopy: {
    flex: 1,
    gap: 4,
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