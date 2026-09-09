import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionApprovalCard } from '@/components/agents/action-approval-card';
import { AgentActivityList } from '@/components/agents/agent-activity-list';
import { AgentRuntimeStatus } from '@/components/agents/runtime-status';
import { StructuredResultCard } from '@/components/agents/structured-result';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PressScale } from '@/components/xiv/press-scale';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { RiskBadge } from '@/components/xiv/risk-badge';
import { SectionHeader } from '@/components/xiv/section-header';
import { StatusBadge, type AgentUiStatus } from '@/components/xiv/status-badge';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { businessHealthScore } from '@/data/mock';
import { isLiveCatalogAgent, isLiveSpecializedAgent, specializedAgents, xivAgentCatalog } from '@/data/agents-catalog';
import { useAgent } from '@/hooks/useAgent';
import { experienceRoute } from '@/lib/onboarding';
import type { RoleId } from '@/types/session';

function liveHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/consumer';
  return `${home}/assistant` as Href;
}

function activityHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/consumer';
  return `${home}/activity` as Href;
}

function catalogStatus(input: {
  live: boolean;
  loading: boolean;
  approval: boolean;
  connected: boolean;
}): AgentUiStatus {
  if (!input.live) return 'coming_soon';
  if (input.loading) return 'analyzing';
  if (input.approval) return 'waiting_for_approval';
  if (input.connected) return 'ready';
  return 'ready';
}

export function AgentsHome() {
  const router = useRouter();
  const { session } = useSession();
  const {
    snapshot,
    loading,
    liveWired,
    liveConnected,
    proposedAction,
    persistedActions,
    activityError,
    evidenceOpen,
    approveAction,
    rejectAction,
    viewEvidence,
  } = useAgent();
  const [soonName, setSoonName] = useState<string | null>(null);
  const role = session.experience;
  const comingSoon = [
    ...specializedAgents.filter((agent) => !isLiveSpecializedAgent(agent, role)),
    ...xivAgentCatalog.filter((agent) => !isLiveCatalogAgent(agent, role)),
  ].filter((agent, index, list) => list.findIndex((item) => item.id === agent.id) === index);
  const liveStatus = catalogStatus({
    live: Boolean(snapshot),
    loading,
    approval: Boolean(proposedAction),
    connected: liveConnected,
  });

  return (
    <ExperienceScreen title="Agent Command" subtitle="An AI workforce, not a tool wall." atmosphere="cinematic">
      <PrototypeNotice text="One agent is ACTIVE for this workspace when Gemini is wired. Every other card is COMING SOON — no extra model is called. Builder Agent is not implemented." />

      <AgentRuntimeStatus />

      {snapshot ? (
        <Card variant="hero" style={styles.live}>
          <View style={styles.liveHead}>
            <XivText variant="label" color={Palette.accent}>
              ACTIVE
            </XivText>
            <StatusBadge status={liveStatus} pulse={loading} />
          </View>
          <XivText variant="label" color={Palette.textDim}>
            Mission
          </XivText>
          <XivText variant="subtitle">{snapshot.agent.name}</XivText>
          <XivText variant="body" muted>
            {snapshot.agent.summary}
          </XivText>
          <View style={styles.signals}>
            <View style={styles.signal}>
              <XivText variant="label" color={Palette.intelligence}>
                Intelligence
              </XivText>
              <XivText variant="caption" muted numberOfLines={3}>
                {snapshot.lastStructured?.summary ??
                  (liveWired
                    ? 'Open the live workspace to run Gemini. No invented brief is shown here.'
                    : 'This role does not call Gemini from this roster.')}
              </XivText>
            </View>
            <View style={styles.signal}>
              <XivText variant="label" color={Palette.warning}>
                Risk
              </XivText>
              {snapshot.lastStructured?.riskLevel ? (
                <RiskBadge level={snapshot.lastStructured.riskLevel} />
              ) : (
                <XivText variant="caption" muted>
                  High-risk work stays behind approval.
                </XivText>
              )}
            </View>
          </View>
          {snapshot.lastStructured ? (
            <StructuredResultCard output={snapshot.lastStructured} healthScore={businessHealthScore.score} />
          ) : null}
          {proposedAction ? (
            <ActionApprovalCard
              action={proposedAction}
              evidenceOpen={evidenceOpen}
              onApprove={() => approveAction(proposedAction.id)}
              onReject={() => rejectAction(proposedAction.id)}
              onViewEvidence={() => viewEvidence(proposedAction.id)}
            />
          ) : (
            <XivText variant="caption" color={Palette.textDim}>
              Tools stay collapsed in the live workspace. Approve, reject, and view evidence only appear on a proposed action.
            </XivText>
          )}
          <Button label="Open live workspace" onPress={() => router.navigate(liveHref(role))} />
        </Card>
      ) : (
        <EmptyState
          title="No live agent on this floor"
          body="Business and Executive roles open the existing Gemini workspace. Other experiences stay preview-only."
          ios="sparkles"
          android="auto_awesome"
        />
      )}

      <SectionHeader
        kicker="Activity"
        title="Latest governed work"
        action="View all"
        onAction={() => router.navigate(activityHref(role))}
      />
      {activityError ? (
        <EmptyState
          title={activityError.kind === 'missing_schema' ? 'Agent tables are not applied' : 'Activity could not load'}
          body={`${activityError.message}${activityError.code ? ` (${activityError.code})` : ''}. ${activityError.hint}`}
          ios="exclamationmark.triangle"
          android="warning"
        />
      ) : (
        <AgentActivityList actions={persistedActions.slice(0, 3)} emptyTitle="No persisted actions yet" />
      )}

      <SectionHeader kicker="Roster" title="Coming soon" />
      {comingSoon.map((agent) => (
        <PressScale
          key={agent.id}
          accessibilityRole="button"
          accessibilityLabel={`${agent.name}, coming soon`}
          onPress={() => setSoonName(agent.name)}>
          <Card style={styles.soon}>
            <View style={styles.soonRow}>
              <View style={styles.soonCopy}>
                <XivText variant="subtitle">{agent.name}</XivText>
                <XivText variant="caption" muted numberOfLines={2}>
                  {'mission' in agent ? agent.mission : agent.summary}
                </XivText>
              </View>
              <StatusBadge status="coming_soon" />
            </View>
          </Card>
        </PressScale>
      ))}

      <Card style={{ gap: Spacing.two }}>
        <XivText variant="label" color={Palette.warning}>
          COMING SOON
        </XivText>
        <XivText variant="subtitle">Builder Agent</XivText>
        <XivText variant="body" muted>
          Not implemented. Session, task, plan, result, memory, and audit types exist for later work. The Builder
          Agent cannot modify itself or deploy software.
        </XivText>
      </Card>

      {soonName ? (
        <EmptyState
          title="COMING SOON"
          body={`${soonName} is not live. No model is called from this card.`}
          ios="sparkles"
          android="auto_awesome"
        />
      ) : null}

    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  live: {
    gap: Spacing.two,
  },
  liveHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signals: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  signal: {
    flex: 1,
    gap: 4,
  },
  soon: {
    gap: Spacing.two,
    opacity: 0.86,
  },
  soonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  soonCopy: {
    flex: 1,
    gap: 4,
  },
});
