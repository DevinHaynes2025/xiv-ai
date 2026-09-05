import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentCard } from '@/components/xiv/agent-card';
import { Button } from '@/components/xiv/button';
import { CinematicBackdrop } from '@/components/xiv/cinematic-backdrop';
import { Chip } from '@/components/xiv/chip';
import { EmptyState } from '@/components/xiv/empty-state';
import { FeedCard } from '@/components/xiv/feed-card';
import { Field } from '@/components/xiv/field';
import { Header } from '@/components/xiv/header';
import { InsightCard } from '@/components/xiv/insight-card';
import { OpportunityCard } from '@/components/xiv/opportunity-card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { type AgentUiStatus } from '@/components/xiv/status-badge';
import { BottomTabInset, Layout, Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { businessAgents, businessBriefing, consumerFeed, consumerOpportunities, employeeThreads } from '@/data/mock';
import { useAgent } from '@/hooks/useAgent';
import { anonymousAlias } from '@/lib/anonymous-alias';
import { dayGreeting } from '@/lib/greeting';
import { experienceRoute } from '@/lib/onboarding';
import type { RoleId } from '@/types/session';

import { BusinessCommand } from './business-command';

function profileHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/consumer';
  return `${home}/profile` as Href;
}

function agentsHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/consumer';
  return `${home}/agents` as Href;
}

function assistantHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/consumer';
  return `${home}/assistant` as Href;
}

function moreLinks(role: RoleId | null): { label: string; href: Href }[] {
  if (role === 'employee') {
    return [
      { label: 'Ideas', href: '/employee/ideas' },
      { label: 'Learn', href: '/employee/learn' },
    ];
  }
  if (role === 'consumer' || role === 'entrepreneur') {
    return [
      { label: 'Discover', href: '/consumer/discover' },
      { label: 'Inbox', href: '/consumer/inbox' },
    ];
  }
  if (role === 'executive') {
    return [
      { label: 'More', href: '/executive/more' },
      { label: 'Supply Chain', href: '/executive/supply-chain' },
      { label: 'Finance', href: '/executive/finance' },
    ];
  }
  if (role === 'business_owner') {
    return [
      { label: 'More', href: '/business/more' },
      { label: 'Warehouse', href: '/business/warehouse' },
      { label: 'Systems', href: '/business/systems' },
    ];
  }
  return [];
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

export function CommandCenter() {
  const { session } = useSession();
  if (session.experience === 'business_owner' || session.experience === 'executive') {
    return <BusinessCommand />;
  }
  return <PreviewCommandCenter />;
}

function PreviewCommandCenter() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { snapshot, loading, liveWired, liveConnected, proposedAction } = useAgent();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [posts, setPosts] = useState<{ id: string; topic: string }[]>([]);

  const role = session.experience;
  const employee = role === 'employee';
  const display = employee ? anonymousAlias(session.userId) : session.displayName;
  const alias = anonymousAlias(session.userId);
  const extras = moreLinks(role);
  const activityStatus = agentActivityStatus({
    liveWired,
    loading,
    approval: Boolean(proposedAction),
    connected: liveConnected,
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CinematicBackdrop atmosphere="restrained" />
      <Header
        compact
        title={dayGreeting(employee ? '' : session.displayName)}
        subtitle="Here's what matters today."
        avatarName={display}
        avatarUri={employee ? null : session.avatarUrl || null}
        onAvatarPress={() => router.navigate(profileHref(role))}
        onNotifications={() => setNoticeOpen((value) => !value)}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <PrototypeNotice text="Live identity comes from your account. Briefs, opportunities, health, and network cards are labeled samples until a company is connected." />

        {noticeOpen ? (
          <EmptyState
            title="Notifications"
            body="No alerts yet. A live notification inbox is not connected."
            ios="bell"
            android="notifications"
          />
        ) : null}

        <SectionHeader kicker="XIV AI Brief" title="Overnight intelligence" />
        {snapshot?.lastStructured ? (
          <InsightCard
            kicker="Live brief"
            title={snapshot.lastStructured.summary}
            body={snapshot.lastStructured.recommendation}
            risk={snapshot.lastStructured.riskLevel}
            evidenceCount={snapshot.lastStructured.evidence.length}
          />
        ) : (
          <InsightCard title="What moved while you were away" body={businessBriefing[0]} sample />
        )}

        <SectionHeader
          kicker="Opportunities"
          title="Worth a look"
          action="Open"
          onAction={
            role === 'consumer' || role === 'entrepreneur'
              ? () => router.navigate('/consumer/opportunities')
              : undefined
          }
        />
        {consumerOpportunities.length ? (
          consumerOpportunities.slice(0, 2).map((item) => (
            <OpportunityCard
              key={item.id}
              kind={item.kind}
              title={item.title}
              body={item.pay}
              sample
              onPress={
                role === 'consumer' || role === 'entrepreneur'
                  ? () => router.navigate('/consumer/opportunities')
                  : undefined
              }
            />
          ))
        ) : (
          <EmptyState title="No opportunities" body="COMING SOON — opportunity matching is not connected." />
        )}

        <SectionHeader
          kicker="Network signal"
          title="What the floor is saying"
          action={role === 'consumer' || role === 'entrepreneur' ? 'Community' : undefined}
          onAction={
            role === 'consumer' || role === 'entrepreneur'
              ? () => router.navigate('/consumer/communities')
              : undefined
          }
        />
        {(employee ? employeeThreads : consumerFeed).slice(0, 2).map((item) =>
          'topic' in item ? (
            <FeedCard
              key={item.id}
              tag={item.handle}
              title={item.topic}
              body={`${item.replies} replies in this preview thread.`}
            />
          ) : (
            <FeedCard key={item.id} tag={item.tag} title={item.title} body={item.body} meta={item.meta} />
          ),
        )}

        <SectionHeader
          kicker="Active agents"
          title="Your intelligent workforce"
          action="Agents"
          onAction={() => router.navigate(agentsHref(role))}
        />
        {snapshot ? (
          <AgentCard
            name={snapshot.agent.name}
            summary={snapshot.agent.summary}
            status={activityStatus}
            onPress={() => router.navigate(assistantHref(role))}
          />
        ) : (
          businessAgents.slice(0, 2).map((item) => (
            <FeedCard
              key={item.id}
              tag={item.name}
              title={item.activity}
              body="Agent runs are scripted for this preview."
            />
          ))
        )}

        <SectionHeader kicker="Today" title="On your desk" />
        {employee ? (
          <View style={styles.today}>
            <Field
              label="Share without your name"
              placeholder="A note for the floor"
              value={draft}
              onChangeText={setDraft}
            />
            <Button
              label="Post as alias"
              variant="subtle"
              disabled={!draft.trim()}
              onPress={() => {
                setPosts((current) => [{ id: String(Date.now()), topic: draft.trim() }, ...current]);
                setDraft('');
              }}
            />
            {posts.map((item) => (
              <FeedCard
                key={item.id}
                tag={alias}
                title={item.topic}
                body="Local prototype post. Not stored in Supabase."
                sample={false}
              />
            ))}
          </View>
        ) : (
          <FeedCard
            tag="Today"
            title="Review the brief, then open the matching agent"
            body="Governed actions still require your approval. No live company systems are connected."
            sample={false}
          />
        )}
        {extras.length ? (
          <View style={styles.more}>
            {extras.map((item) => (
              <Chip key={item.label} label={item.label} onPress={() => router.navigate(item.href)} />
            ))}
          </View>
        ) : null}
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
  },
  today: {
    gap: Spacing.two,
  },
  more: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
