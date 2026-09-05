import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionApprovalCard } from '@/components/agents/action-approval-card';
import { ActivityHistory } from '@/components/agents/activity-history';
import { AgentActivityList } from '@/components/agents/agent-activity-list';
import { AgentStatusCard, type VisibleAgentState } from '@/components/agents/agent-status';
import { AgentContextSummary } from '@/components/agents/context-summary';
import { StructuredResultCard } from '@/components/agents/structured-result';
import { SuggestedActions } from '@/components/agents/suggested-actions';
import { Button } from '@/components/xiv/button';
import { Expandable } from '@/components/xiv/expandable';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { Field } from '@/components/xiv/field';
import { LoadingState } from '@/components/xiv/loading-state';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useAgent } from '@/hooks/useAgent';
import { experienceRoute } from '@/lib/onboarding';
import type { RoleId } from '@/types/session';

import { LiveAgentWorkspace } from './live-workspace';

function activityHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/consumer';
  return `${home}/activity` as Href;
}

const LIVE_PROMPT = 'Review my business health and recommend the next action.';
const LIVE_PREVIEW =
  'Gemini runs server-side through the XIV AI service. Agent actions remain governed by explicit permissions and approval policies.';

function visibleState(input: {
  liveWired: boolean;
  liveConnected: boolean;
  loading: boolean;
  error: string | null;
  approvalRequired: boolean;
}): VisibleAgentState | undefined {
  if (!input.liveWired) return undefined;
  if (input.error) return 'error';
  if (input.loading) return 'analyzing';
  if (input.approvalRequired) return 'approval_required';
  if (input.liveConnected) return 'gemini_connected';
  return 'idle';
}

export function AgentWorkspace() {
  const { session } = useSession();
  if (session.experience === 'business_owner' || session.experience === 'executive') {
    return <LiveAgentWorkspace />;
  }
  return <PreviewAgentWorkspace />;
}

function PreviewAgentWorkspace() {
  const router = useRouter();
  const {
    snapshot,
    messages,
    proposedAction,
    activityLog,
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
    agentType,
    liveWired,
    liveConnected,
    diagnostics,
  } = useAgent();
  const [draft, setDraft] = useState('');

  if (!snapshot) {
    return (
      <ExperienceScreen title="XIV Agent" subtitle="Governed assistance">
        <PrototypeNotice text="Sign in and finish role selection to open the matching agent. No model is called from this screen." />
        {__DEV__ ? (
          <XivText variant="caption" color={Palette.warning}>
            {`dev: role=${role ?? 'none'} agentType=${agentType ?? 'none'}`}
          </XivText>
        ) : null}
      </ExperienceScreen>
    );
  }

  if (liveWired) {
    return <LiveAgentWorkspace />;
  }

  const subtitle = liveWired
    ? liveConnected
      ? 'Governed · Gemini connected · explicit tools'
      : 'Governed · AI service ready · explicit tools'
    : 'Governed · mocked model · explicit tools';

  const displayState = visibleState({
    liveWired,
    liveConnected,
    loading,
    error,
    approvalRequired: Boolean(proposedAction),
  });

  const submit = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setDraft('');
    void sendMessage(value);
  };

  return (
    <ExperienceScreen title={snapshot.agent.name} subtitle={subtitle}>
      <PrototypeNotice
        text={
          liveWired
            ? LIVE_PREVIEW
            : 'This agent cannot call Gemini or OpenAI from the app. It cannot use a service-role key. It cannot run unlisted tools. Approved work is a labeled prototype simulation.'
        }
      />
      {error ? (
        <XivText variant="body" color={Palette.danger}>
          {error}
        </XivText>
      ) : null}
      {__DEV__ && liveWired ? (
        <XivText variant="caption" color={Palette.warning}>
          {`AI Service ${diagnostics.aiService === 'connected' ? 'Connected' : 'Unreachable'}\nModel ${diagnostics.model === 'gemini' ? 'Gemini' : 'Not verified'}\nAuth Session ${diagnostics.auth === 'available' ? 'available' : 'Missing'}`}
        </XivText>
      ) : null}

      <SectionHeader kicker="Active agent" title={snapshot.agent.name} />
      <AgentStatusCard
        name={snapshot.agent.name}
        status={snapshot.agent.status}
        summary={snapshot.agent.summary}
        visibleState={displayState}
        liveWired={liveWired}
        liveConnected={liveConnected}
      />

      <SectionHeader kicker="Current context" title="Workspace and permissions" />
      <AgentContextSummary agentType={snapshot.agent.type} context={snapshot.context} />

      {loading ? <LoadingState label="Agent is analyzing…" lines={2} /> : null}

      {snapshot.lastStructured ? (
        <>
          <SectionHeader kicker="Recommendation" title="Executive intelligence" />
          <StructuredResultCard output={snapshot.lastStructured} />
        </>
      ) : null}

      {proposedAction ? (
        <>
          <SectionHeader kicker="Approval" title="Governed next step" />
          <ActionApprovalCard
            action={proposedAction}
            evidenceOpen={evidenceOpen}
            onApprove={() => approveAction(proposedAction.id)}
            onReject={() => rejectAction(proposedAction.id)}
            onViewEvidence={() => viewEvidence(proposedAction.id)}
          />
        </>
      ) : (
        <SuggestedActions actions={snapshot.suggestedActions} onSelect={(action) => suggest(action.toolId)} />
      )}

      <View style={styles.composer}>
        <Field
          label="Message"
          placeholder={liveWired ? LIVE_PROMPT : 'Ask the governed agent'}
          value={draft}
          onChangeText={setDraft}
          editable={!loading}
        />
        <Button
          label={loading ? 'Analyzing…' : 'Send'}
          disabled={loading || !draft.trim()}
          onPress={() => submit(draft)}
        />
        {liveWired ? (
          <Button
            label="Analyze"
            variant="secondary"
            disabled={loading}
            onPress={() => submit(draft.trim() || LIVE_PROMPT)}
          />
        ) : null}
      </View>

      <SectionHeader
        kicker="Activity"
        title="Recent governed work"
        action="View all"
        onAction={() => router.navigate(activityHref(role))}
      />
      <Expandable title="Conversation" subtitle={`${messages.length} messages`} defaultOpen={false}>
        <ActivityHistory messages={messages} actions={snapshot.actions} activityLog={activityLog} />
      </Expandable>
      <AgentActivityList actions={persistedActions.slice(0, 5)} emptyTitle="No persisted actions yet" />
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  composer: {
    gap: Spacing.two,
  },
});
