import { StyleSheet, View } from 'react-native';

import { briefStatus, DataStatusMark, statusFromReport } from '@/components/agents/data-status';
import { GovernedApprovalCard } from '@/components/agents/governed-approval-card';
import { GovernedAuditTrail } from '@/components/agents/governed-audit-trail';
import { GovernedHealthResult } from '@/components/agents/governed-health-result';
import { GuardianStatusPanel } from '@/components/agents/guardian-status';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SystemStatus, type SystemStatusKind } from '@/components/xiv/system-status';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { TenantDesk } from '@/components/tenant/tenant-desk';
import { useTenant } from '@/context/tenant';
import { useGovernedRuntime } from '@/hooks/use-governed-runtime';
import { AUTHORITY_LABEL, listXivAgents, type XivAgentDefinition } from '@/lib/ai';

function agentSurfaceStatus(agent: XivAgentDefinition): SystemStatusKind {
  if (agent.status === 'available') return 'ACTIVE';
  if (agent.status === 'prototype' || agent.status === 'registered') return 'CONFIGURED';
  return 'COMING SOON';
}

export function AgentRuntimeStatus() {
  const agents = listXivAgents();
  const { tenant } = useTenant();
  const {
    busy,
    report,
    lastResult,
    pending,
    actions,
    runAnalyze,
    runSupplyChain,
    runExecutiveSummary,
    runExecutiveBrief,
    runLiveSource,
    runLiveHealth,
    runLiveBrief,
    runPropose,
    decide,
    snapshot,
  } = useGovernedRuntime();

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          XIV Agent Runtime
        </XivText>
        <SystemStatus status="CONFIGURED" />
      </View>
      <XivText variant="subtitle">Governed read-only context</XivText>
      <XivText variant="caption" muted>
        {tenant.activeOrganization
          ? `Active organization: ${tenant.activeOrganization.name} · ${tenant.organizationRole ?? 'member'}`
          : 'No persisted organization is active. Agents do not invent tenant identity.'}
      </XivText>
      <XivText variant="caption" muted>
        {tenant.activeUniverse
          ? `Active Universe: ${tenant.activeUniverse.name} · ${tenant.activeUniverse.status}`
          : 'Universe not provisioned'}
      </XivText>
      <DataStatusMark
        status={
          lastResult?.brief
            ? briefStatus(lastResult.brief)
            : lastResult?.healthReport
              ? statusFromReport(lastResult.healthReport)
              : 'prototype'
        }
        source={lastResult?.brief?.sources[0] ?? lastResult?.healthReport?.provenance?.sourceSystem}
        freshness={lastResult?.brief?.freshness ?? lastResult?.healthReport?.freshnessStatus}
        retrievedAt={lastResult?.brief?.generatedAt ?? lastResult?.healthReport?.generatedAt}
      />
      <XivText variant="body" muted>
        Context comes from a replaceable provider. Policy still decides every tool. Human approval does not override
        policy.
      </XivText>

      <GuardianStatusPanel
        report={report}
        busy={busy}
        onRun={() => {
          void snapshot();
        }}
      />

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

      <Button label="Analyze operations (prototype)" variant="subtle" disabled={busy} onPress={runAnalyze} />
      <Button label="Read supply chain findings" variant="subtle" disabled={busy} onPress={runSupplyChain} />
      <Button label="Executive health summary" variant="subtle" disabled={busy} onPress={runExecutiveSummary} />
      <Button label="Executive Intelligence Brief" variant="subtle" disabled={busy} onPress={runExecutiveBrief} />
      <Button label="Check live source" variant="subtle" disabled={busy} onPress={runLiveSource} />
      <Button label="Live Business Health" variant="subtle" disabled={busy} onPress={runLiveHealth} />
      <Button label="Live Executive Brief" variant="subtle" disabled={busy} onPress={runLiveBrief} />
      <Button label="Propose recovery window (needs approval)" variant="subtle" disabled={busy} onPress={runPropose} />

      {pending.map((action) => (
        <GovernedApprovalCard
          key={action.actionId}
          action={action}
          onApprove={() => decide(action.actionId, 'approved')}
          onDeny={() => decide(action.actionId, 'denied')}
        />
      ))}

      {lastResult?.brief ? (
        <View style={styles.block}>
          <DataStatusMark
            status={briefStatus(lastResult.brief)}
            source={lastResult.brief.sources[0]}
            freshness={lastResult.brief.freshness}
            retrievedAt={lastResult.brief.generatedAt}
          />
          <XivText variant="label" color={Palette.accent}>
            Executive Intelligence Brief
          </XivText>
          <XivText variant="caption" muted>
            {lastResult.brief.criticalChanges[0] ?? lastResult.brief.recommendedPriorities[0] ?? lastResult.brief.dataStatus}
          </XivText>
        </View>
      ) : null}

      {lastResult?.healthReport ? <GovernedHealthResult report={lastResult.healthReport} /> : null}

      {lastResult?.story ? (
        <View style={styles.block}>
          <XivText variant="label" color={Palette.accent}>
            Diagnostic story · {lastResult.story.evidenceQuality}
          </XivText>
          <XivText variant="caption" muted>
            {lastResult.story.whatHappened}
          </XivText>
          <XivText variant="caption" dim>
            {lastResult.story.causalChain
              .map((step) => `${step.label} [${step.stance ?? 'unspecified'}]`)
              .join(' → ')}
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

      <TenantDesk />
      <PrototypeNotice text="Phase 2F-B. Prototype buttons stay sample. Live buttons use authorized session records and never invent ERP data. Tenant ids are selectors only. No production action is executed. Upload is not configured." />
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
