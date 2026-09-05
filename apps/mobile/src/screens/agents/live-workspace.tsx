import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionApprovalCard } from '@/components/agents/action-approval-card';
import { AgentActivityList } from '@/components/agents/agent-activity-list';
import { StructuredResultCard } from '@/components/agents/structured-result';
import { SuggestedActions } from '@/components/agents/suggested-actions';
import { BrandMark } from '@/components/xiv/brand-mark';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { CinematicBackdrop } from '@/components/xiv/cinematic-backdrop';
import { Expandable } from '@/components/xiv/expandable';
import { Field } from '@/components/xiv/field';
import { Header } from '@/components/xiv/header';
import { LoadingState } from '@/components/xiv/loading-state';
import { SectionHeader } from '@/components/xiv/section-header';
import { StatusBadge } from '@/components/xiv/status-badge';
import { XivText } from '@/components/xiv/text';
import { BottomTabInset, Layout, Palette, Spacing } from '@/constants/theme';
import { businessHealthScore } from '@/data/mock';
import { useAgent } from '@/hooks/useAgent';
import { type VisibleAgentState } from '@/components/agents/agent-status';
import { AGENT_ALLOWED_TOOLS, listAgentTools } from '@/lib/ai';
import { experienceRoute } from '@/lib/onboarding';
import type { RoleId } from '@/types/session';

const LIVE_PROMPT = 'Review my business health and recommend the next action.';

function activityHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/business';
  return `${home}/activity` as Href;
}

function visibleState(input: {
  liveWired: boolean;
  liveConnected: boolean;
  loading: boolean;
  error: string | null;
  approvalRequired: boolean;
}): VisibleAgentState {
  if (input.error) return 'error';
  if (input.loading) return 'analyzing';
  if (input.approvalRequired) return 'approval_required';
  if (input.liveConnected) return 'gemini_connected';
  return 'idle';
}

export function LiveAgentWorkspace() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    snapshot,
    proposedAction,
    persistedActions,
    loading,
    error,
    evidenceOpen,
    sendMessage,
    approveAction,
    rejectAction,
    suggest,
    viewEvidence,
    role,
    liveWired,
    liveConnected,
    diagnostics,
  } = useAgent();
  const [draft, setDraft] = useState('');

  if (!snapshot) return null;

  const displayState = visibleState({
    liveWired,
    liveConnected,
    loading,
    error,
    approvalRequired: Boolean(proposedAction),
  });
  const tools = listAgentTools(AGENT_ALLOWED_TOOLS[snapshot.agent.type]);
  const contextWho = snapshot.context.anonymous
    ? snapshot.context.alias ?? 'Anonymous alias'
    : snapshot.context.displayName || 'Signed-in member';
  const geminiLabel = liveConnected ? 'Gemini connected' : liveWired ? 'AI service ready' : 'Governed';

  const submit = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setDraft('');
    void sendMessage(value);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CinematicBackdrop atmosphere="cinematic" />
      <Header
        layout="agent"
        compact
        title={snapshot.agent.name}
        universe={`${geminiLabel} · Governed`}
        statusLabel={displayState === 'analyzing' ? 'Analyzing' : displayState === 'approval_required' ? 'Approval' : 'Live'}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        {error ? (
          <XivText variant="body" color={Palette.danger}>
            {error}
          </XivText>
        ) : null}

        <Card variant="hero" style={styles.hero}>
          <View style={styles.heroHead}>
            <BrandMark size={52} />
            <View style={styles.heroCopy}>
              <XivText variant="label" color={Palette.accent}>
                Mission
              </XivText>
              <XivText variant="subtitle">{snapshot.agent.name}</XivText>
              <StatusBadge
                status={
                  displayState === 'analyzing'
                    ? 'analyzing'
                    : displayState === 'approval_required'
                      ? 'waiting_for_approval'
                      : displayState === 'error'
                        ? 'offline'
                        : 'ready'
                }
              />
            </View>
          </View>
          <XivText variant="body" muted>
            {snapshot.agent.summary}
          </XivText>
          <XivText variant="caption" muted>
            {contextWho} · {snapshot.context.role.replace('_', ' ')}
          </XivText>
          <View style={styles.chips}>
            <Chip label={geminiLabel} selected={liveConnected} />
            <Chip label="Governed" selected />
          </View>
        </Card>

        {loading ? <LoadingState label="Agent is analyzing…" lines={2} /> : null}

        {snapshot.lastStructured ? (
          <StructuredResultCard output={snapshot.lastStructured} healthScore={businessHealthScore.score} />
        ) : null}

        <Expandable
          surface
          title="Technical context"
          subtitle="Evidence, permissions, tools"
          defaultOpen={false}>
          {snapshot.lastStructured?.evidence.length ? (
            <View style={styles.block}>
              <XivText variant="label" color={Palette.accent}>
                Raw evidence
              </XivText>
              {snapshot.lastStructured.evidence.map((item) => (
                <XivText key={item} variant="caption" muted>
                  {item}
                </XivText>
              ))}
            </View>
          ) : null}
          <View style={styles.block}>
            <XivText variant="label" color={Palette.accent}>
              Permissions
            </XivText>
            <XivText variant="caption" muted>
              Explicit tool list only. High-risk work stays behind approval. No service-role key in the app.
            </XivText>
          </View>
          <View style={styles.block}>
            <XivText variant="label" color={Palette.accent}>
              Tool list
            </XivText>
            <XivText variant="caption" muted>
              {tools.map((tool) => tool.name).join(' · ')}
            </XivText>
          </View>
          {__DEV__ ? (
            <XivText variant="caption" color={Palette.warning}>
              {`AI Service ${diagnostics.aiService === 'connected' ? 'Connected' : 'Unreachable'} · Model ${diagnostics.model === 'gemini' ? 'Gemini' : 'Not verified'} · Auth ${diagnostics.auth === 'available' ? 'available' : 'Missing'}`}
            </XivText>
          ) : null}
        </Expandable>

        <Expandable
          surface
          title={`${tools.length} tools available`}
          subtitle="Expand to review governed tools"
          defaultOpen={false}>
          <View style={styles.chips}>
            {tools.map((tool) => (
              <Chip key={tool.id} label={`${tool.name} · ${tool.riskLevel}`} />
            ))}
          </View>
        </Expandable>

        {proposedAction ? (
          <ActionApprovalCard
            action={proposedAction}
            evidenceOpen={evidenceOpen}
            onApprove={() => approveAction(proposedAction.id)}
            onReject={() => rejectAction(proposedAction.id)}
            onViewEvidence={() => viewEvidence(proposedAction.id)}
          />
        ) : (
          <SuggestedActions actions={snapshot.suggestedActions} onSelect={(action) => suggest(action.toolId)} />
        )}

        <View style={styles.composer}>
          <Field
            label="Message"
            placeholder={LIVE_PROMPT}
            value={draft}
            onChangeText={setDraft}
            editable={!loading}
          />
          <Button
            label={loading ? 'Analyzing…' : 'Send'}
            disabled={loading || !draft.trim()}
            onPress={() => submit(draft)}
          />
          <Button
            label="Analyze"
            variant="secondary"
            disabled={loading}
            onPress={() => submit(draft.trim() || LIVE_PROMPT)}
          />
        </View>

        <SectionHeader
          kicker="Activity"
          title="Latest governed work"
          action="View All"
          onAction={() => router.navigate(activityHref(role))}
        />
        <AgentActivityList actions={persistedActions.slice(0, 3)} emptyTitle="No persisted actions yet" />
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
  hero: {
    gap: Spacing.three,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  block: {
    gap: Spacing.one,
  },
  composer: {
    gap: Spacing.two,
  },
});
