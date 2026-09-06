import { StyleSheet, View } from 'react-native';

import { GovernedApprovalCard } from '@/components/agents/governed-approval-card';
import { GovernedAuditTrail } from '@/components/agents/governed-audit-trail';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SystemStatus, type SystemStatusKind } from '@/components/xiv/system-status';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useGovernedRuntime } from '@/hooks/use-governed-runtime';
import { AUTHORITY_LABEL, listXivAgents, type GuardianHealthReport, type XivAgentDefinition } from '@/lib/ai';

function agentSurfaceStatus(agent: XivAgentDefinition): SystemStatusKind {
  if (agent.status === 'available') return 'ACTIVE';
  if (agent.status === 'prototype' || agent.status === 'registered') return 'CONFIGURED';
  return 'COMING SOON';
}

function overallSurface(status: GuardianHealthReport['overallStatus']): SystemStatusKind {
  if (status === 'healthy') return 'ACTIVE';
  if (status === 'warning' || status === 'critical') return 'NEEDS ATTENTION';
  return 'CONFIGURED';
}

export function AgentRuntimeStatus() {
  const agents = listXivAgents();
  const { busy, report, lastResult, pending, actions, runAnalyze, runPropose, decide, snapshot } =
    useGovernedRuntime();

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          XIV Agent Runtime
        </XivText>
        <SystemStatus status="CONFIGURED" />
      </View>
      <XivText variant="subtitle">Governed read-only context · prototype</XivText>
      <XivText variant="body" muted>
        Context comes from a replaceable provider. Policy still decides every tool. Human approval does not override
        policy.
      </XivText>

      <View style={styles.block}>
        <View style={styles.head}>
          <XivText variant="label" color={Palette.intelligence}>
            Guardian
          </XivText>
          <SystemStatus status={report ? overallSurface(report.overallStatus) : 'CONFIGURED'} />
        </View>
        <XivText variant="caption" muted>
          Configuration, AI service, registry, and runtime checks only. Guardian is not continuously monitoring
          {report ? `. Last snapshot: ${report.overallStatus}.` : '.'}
        </XivText>
      </View>

      <View style={styles.roster}>
        {agents.map((agent) => (
          <View key={agent.id} style={styles.row}>
            <View style={styles.copy}>
              <XivText variant="caption" color={Palette.text}>
                {agent.name}
              </XivText>
              <XivText variant="label" color={Palette.textDim}>
                {agent.domain} · {agent.defaultAuthority} {AUTHORITY_LABEL[agent.defaultAuthority]} · {agent.status}
              </XivText>
              <XivText variant="caption" dim>
                {agent.allowedTools.length} tools · approval required for consequential actions
              </XivText>
            </View>
            <SystemStatus status={agentSurfaceStatus(agent)} />
          </View>
        ))}
      </View>

      <Button
        label={busy ? 'Running snapshot…' : 'Run prototype Guardian snapshot'}
        variant="subtle"
        disabled={busy}
        onPress={() => {
          void snapshot();
        }}
      />
      <Button label="Analyze business health (prototype)" variant="subtle" disabled={busy} onPress={runAnalyze} />
      <Button label="Propose recovery window (needs approval)" variant="subtle" disabled={busy} onPress={runPropose} />

      {pending.map((action) => (
        <GovernedApprovalCard
          key={action.actionId}
          action={action}
          onApprove={() => decide(action.actionId, 'approved')}
          onDeny={() => decide(action.actionId, 'denied')}
        />
      ))}

      {report ? (
        <View style={styles.block}>
          <XivText variant="caption" muted>
            {report.summary}
          </XivText>
          {report.checks.map((check) => (
            <XivText key={check.id} variant="caption" dim>
              {check.id}: {check.status} — {check.message}
            </XivText>
          ))}
        </View>
      ) : null}

      {lastResult?.story ? (
        <View style={styles.block}>
          <XivText variant="label" color={Palette.accent}>
            Diagnostic story · {lastResult.story.evidenceQuality}
          </XivText>
          <XivText variant="caption" muted>
            {lastResult.story.whatHappened}
          </XivText>
          <XivText variant="caption" dim>
            {lastResult.story.causalChain.map((step) => step.label).join(' → ')}
          </XivText>
          <XivText variant="caption" dim>
            {lastResult.story.disclaimer}
          </XivText>
        </View>
      ) : lastResult ? (
        <View style={styles.block}>
          <XivText variant="label" color={Palette.accent}>
            {lastResult.verdict} · {lastResult.action.status}
          </XivText>
          <XivText variant="caption" muted>
            {lastResult.action.outputSummary || lastResult.action.reason}
          </XivText>
        </View>
      ) : null}

      <GovernedAuditTrail actions={actions} />

      <PrototypeNotice text="Phase 2B prototype. Read-only context and human approval are session-local. No ERP, WMS, or TMS is connected, and no production action is executed." />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  block: {
    gap: Spacing.two,
  },
  roster: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
