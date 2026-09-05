import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentCard } from '@/components/xiv/agent-card';
import { CinematicBackdrop } from '@/components/xiv/cinematic-backdrop';
import { EmptyState } from '@/components/xiv/empty-state';
import { Header } from '@/components/xiv/header';
import { IntelligenceHero } from '@/components/xiv/intelligence-hero';
import { MetricCard, MetricRow } from '@/components/xiv/metric-card';
import { SectionHeader } from '@/components/xiv/section-header';
import { type AgentUiStatus } from '@/components/xiv/status-badge';
import { XivStoryCard } from '@/components/xiv/xiv-story-card';
import { BottomTabInset, Layout, Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { businessHealthScore, businessRisks, employeeUniverse, executiveRecommendations } from '@/data/mock';
import { commandOperatingPulse, fulfillmentStory } from '@/data/operating-system';
import { useAgent } from '@/hooks/useAgent';
import { dayGreeting } from '@/lib/greeting';
import { experienceRoute } from '@/lib/onboarding';
import { assistantHref, osHref } from '@/lib/os-routes';
import type { RoleId } from '@/types/session';

function profileHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/business';
  return `${home}/profile` as Href;
}

function agentsHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/business';
  return `${home}/agents` as Href;
}

function agentActivityStatus(input: {
  liveWired: boolean;
  loading: boolean;
  approval: boolean;
  connected: boolean;
}): AgentUiStatus {
  if (input.loading) return 'analyzing';
  if (input.approval) return 'waiting_for_approval';
  if (input.connected) return 'completed';
  if (input.liveWired) return 'ready';
  return 'ready';
}

export function BusinessCommand() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { snapshot, loading, liveWired, liveConnected, proposedAction } = useAgent();
  const [noticeOpen, setNoticeOpen] = useState(false);

  const role = session.experience;
  const activityStatus = agentActivityStatus({
    liveWired,
    loading,
    approval: Boolean(proposedAction),
    connected: liveConnected,
  });
  const brief =
    snapshot?.lastStructured?.summary ??
    'Dallas Zone C congestion is lifting fulfillment risk on 287 orders.';
  const opportunity = executiveRecommendations[1]?.title ?? 'Rebalance pick labor before the cut.';
  const aiStatus = loading ? 'Analyzing' : proposedAction ? 'Approval' : liveConnected ? 'Live' : liveWired ? 'Ready' : 'Governed';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CinematicBackdrop atmosphere="cinematic" />
      <Header
        layout="command"
        compact
        title={dayGreeting(session.displayName)}
        universe={employeeUniverse.name}
        statusLabel={aiStatus}
        avatarName={session.displayName}
        avatarUri={session.avatarUrl || null}
        onAvatarPress={() => router.navigate(profileHref(role))}
        onNotifications={() => setNoticeOpen((value) => !value)}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {noticeOpen ? (
          <EmptyState
            title="Notifications"
            body="No alerts yet. A live notification inbox is not connected."
            ios="bell"
            android="notifications"
          />
        ) : null}

        <IntelligenceHero
          score={businessHealthScore.score}
          label="Business Health"
          brief={brief}
          risk={businessRisks[0]?.title ?? 'No major risk flagged'}
          opportunity={opportunity}
          sample={!snapshot?.lastStructured}
        />

        <SectionHeader
          kicker="Pulse"
          title="Operating strip"
          action="Operations"
          onAction={() => router.navigate(osHref(role, 'operations'))}
        />
        <MetricRow scroll>
          {commandOperatingPulse.map((item) => (
            <MetricCard
              key={item.id}
              title={item.title}
              value={item.value}
              detail={item.detail}
              spark={item.spark}
              sample
            />
          ))}
        </MetricRow>

        <SectionHeader kicker="Story Engine" title="Visual causal chain" />
        <XivStoryCard
          story={fulfillmentStory}
          compact
          approveLive={Boolean(proposedAction)}
          onApprovePlan={() => router.navigate(assistantHref(role))}
          onAskXiv={() => router.navigate(assistantHref(role))}
        />

        <SectionHeader
          kicker="Workforce"
          title="AI command"
          action="Agents"
          onAction={() => router.navigate(agentsHref(role))}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.agentBleed}
          contentContainerStyle={styles.agents}>
          {snapshot ? (
            <AgentCard
              compact
              name={snapshot.agent.name}
              summary={snapshot.agent.summary}
              status={activityStatus}
              onPress={() => router.navigate(assistantHref(role))}
            />
          ) : null}
          <AgentCard compact name="Sales Agent" summary="COMING SOON — no sales model" status="coming_soon" />
          <AgentCard compact name="Warehouse Agent" summary="COMING SOON — no WMS model" status="coming_soon" />
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.navy,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenGutter,
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  agentBleed: {
    marginHorizontal: -Layout.screenGutter,
  },
  agents: {
    gap: Spacing.two,
    paddingHorizontal: Layout.screenGutter,
    paddingRight: Layout.screenGutter + Spacing.three,
  },
});
