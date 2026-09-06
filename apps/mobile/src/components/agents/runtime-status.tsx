import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SystemStatus, type SystemStatusKind } from '@/components/xiv/system-status';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import {
  AUTHORITY_LABEL,
  analyzeBusinessHealth,
  listXivAgents,
  runGuardianSnapshot,
  type GovernedResult,
  type GuardianHealthReport,
  type XivAgentDefinition,
} from '@/lib/ai';
import { probeAiService } from '@/lib/xiv-ai-api';

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
  const [report, setReport] = useState<GuardianHealthReport | null>(null);
  const [analysis, setAnalysis] = useState<GovernedResult | null>(null);
  const [busy, setBusy] = useState(false);

  const snapshot = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await runGuardianSnapshot({
        handlers: {
          'ai-service-health': async () => {
            const probe = await probeAiService();
            return probe.reachable
              ? { status: 'healthy', message: 'AI service /health responded. This is a one-time probe, not continuous monitoring.' }
              : { status: 'warning', message: 'AI service /health was not reachable. Guardian is not watching in the background.' };
          },
        },
      });
      setReport(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          XIV Agent Runtime
        </XivText>
        <SystemStatus status="CONFIGURED" />
      </View>
      <XivText variant="subtitle">Governed foundation · prototype</XivText>
      <XivText variant="body" muted>
        Authority L0–L5 is enforced by application policy, not by the language model. No agent has production write
        authority in this phase.
      </XivText>

      <View style={styles.block}>
        <View style={styles.head}>
          <XivText variant="label" color={Palette.intelligence}>
            Guardian
          </XivText>
          <SystemStatus status={report ? overallSurface(report.overallStatus) : 'CONFIGURED'} />
        </View>
        <XivText variant="caption" muted>
          Observation and diagnosis only. Guardian is not continuously monitoring
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
                {agent.defaultAuthority} · {AUTHORITY_LABEL[agent.defaultAuthority]} · {agent.status}
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
      <Button
        label="Analyze business health (prototype)"
        variant="subtle"
        disabled={busy}
        onPress={() => setAnalysis(analyzeBusinessHealth())}
      />

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

      {analysis ? (
        <View style={styles.block}>
          <XivText variant="label" color={Palette.accent}>
            {analysis.verdict}
          </XivText>
          <XivText variant="caption" muted>
            {analysis.action.outputSummary || analysis.action.reason}
          </XivText>
        </View>
      ) : null}

      <PrototypeNotice text="This surface is the Phase 2A runtime foundation. It does not replace the live Gemini workspace and cannot execute production actions." />
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
