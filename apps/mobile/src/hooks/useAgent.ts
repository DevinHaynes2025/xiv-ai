import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSession } from '@/hooks/use-session';
import { anonymousAlias } from '@/lib/anonymous-alias';
import {
  agentTypeForRole,
  applyStructuredTurn,
  decideAgentAction,
  openAgentSession,
  proposeListedTool,
  sendAgentMessage,
  viewAgentEvidence,
  withTurnContext,
  type AgentRole,
  type AgentToolId,
  type AgentType,
} from '@/lib/ai';
import {
  listPersistedAgentActions,
  type AgentActivityLoadError,
  type PersistedAgentAction,
} from '@/lib/agent-persistence';
import { probeAiService, requestExecutiveTurn, XivAiRequestError } from '@/lib/xiv-ai-api';

function toRole(value: string | null): AgentRole | null {
  if (
    value === 'consumer' ||
    value === 'employee' ||
    value === 'business_owner' ||
    value === 'executive' ||
    value === 'entrepreneur'
  ) {
    return value;
  }
  return null;
}

function isLiveAgent(type: AgentType | null): type is 'business_agent' | 'executive_agent' {
  return type === 'business_agent' || type === 'executive_agent';
}

function publicError(caught: unknown) {
  const message = caught instanceof Error ? caught.message : 'agent_unknown_error';
  if (typeof console !== 'undefined') {
    console.warn('[xiv-agent]', caught instanceof XivAiRequestError ? caught.code : message);
  }
  if (caught instanceof XivAiRequestError) return caught.message;
  if (message === 'agent_not_ready') return 'The agent is not ready yet.';
  if (message === 'agent_session_missing') return 'Open the agent screen again, then send your message.';
  return 'Something went wrong. Try again.';
}

export function useAgent() {
  const { session, authSession } = useSession();
  const role = toRole(session.experience);
  const agentType = agentTypeForRole(role);
  const anonymous = role === 'employee';
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [aiServiceReachable, setAiServiceReachable] = useState(false);
  const [persistedActions, setPersistedActions] = useState<PersistedAgentAction[]>([]);
  const [activityError, setActivityError] = useState<AgentActivityLoadError | null>(null);
  const turnInFlightRef = useRef(false);

  const context =
    session.userId && role
      ? withTurnContext({
          userId: session.userId,
          role,
          interests: session.interests,
          displayName: anonymous ? undefined : session.displayName,
          alias: anonymous ? anonymousAlias(session.userId) : undefined,
          anonymous,
        })
      : null;

  const snapshot = useMemo(() => {
    void tick;
    if (!context) return null;
    try {
      return openAgentSession(context);
    } catch (caught) {
      console.warn('[xiv-agent]', caught instanceof Error ? caught.message : 'open_failed');
      return null;
    }
  }, [context, tick]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);
  const liveWired = isLiveAgent(agentType);
  const liveConnected = Boolean(snapshot?.lastStructured);

  useEffect(() => {
    let cancelled = false;
    const load = session.userId
      ? listPersistedAgentActions()
      : Promise.resolve({ actions: [] as PersistedAgentAction[], error: null as AgentActivityLoadError | null });
    void load.then((result) => {
      if (!cancelled) {
        setPersistedActions(result.actions);
        setActivityError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.userId, tick]);

  useEffect(() => {
    if (!__DEV__ || !liveWired) return;
    let cancelled = false;
    void probeAiService().then((result) => {
      if (!cancelled) setAiServiceReachable(result.reachable);
    });
    return () => {
      cancelled = true;
    };
  }, [liveWired]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!agentType || !session.userId || !role || !context) {
        const message = 'agent_not_ready';
        console.warn('[xiv-agent]', message);
        setError(publicError(new Error(message)));
        return;
      }
      if (turnInFlightRef.current) {
        if (__DEV__) console.warn('[xiv-agent] request:ignored in_flight');
        return;
      }
      turnInFlightRef.current = true;
      setLoading(true);
      setError(null);
      try {
        if (isLiveAgent(agentType)) {
          const accessToken = authSession?.access_token;
          if (!accessToken) {
            throw new XivAiRequestError('unauthorized', 'Your session expired. Sign in again to use the agent.');
          }
          const output = await requestExecutiveTurn({
            accessToken,
            message: text,
            role,
            organizationContext: context.organizationContext,
            approvedDataContext: context.approvedDataContext,
          });
          await applyStructuredTurn({
            userId: session.userId,
            agentType,
            userMessage: text,
            output,
          });
          setAiServiceReachable(true);
        } else {
          await sendAgentMessage({ userId: session.userId, agentType, text });
        }
        refresh();
      } catch (caught) {
        if (caught instanceof XivAiRequestError && caught.code === 'unreachable') {
          setAiServiceReachable(false);
        } else if (caught instanceof XivAiRequestError && caught.code !== 'unauthorized') {
          setAiServiceReachable(true);
        }
        setError(publicError(caught));
      } finally {
        turnInFlightRef.current = false;
        setLoading(false);
      }
    },
    [agentType, authSession, context, refresh, role, session.userId, setAiServiceReachable, setError, setLoading],
  );

  const suggest = useCallback(
    async (toolId: AgentToolId) => {
      if (!agentType || !session.userId) return;
      setEvidenceOpen(false);
      try {
        await proposeListedTool({ userId: session.userId, agentType, toolId });
        refresh();
      } catch (caught) {
        setError(publicError(caught));
      }
    },
    [agentType, refresh, session.userId, setError, setEvidenceOpen],
  );

  const approveAction = useCallback(
    async (actionId: string) => {
      if (!agentType || !session.userId) return;
      setEvidenceOpen(false);
      try {
        await decideAgentAction({ userId: session.userId, agentType, actionId, decision: 'approve' });
        refresh();
      } catch (caught) {
        setError(publicError(caught));
      }
    },
    [agentType, refresh, session.userId, setError, setEvidenceOpen],
  );

  const rejectAction = useCallback(
    async (actionId: string) => {
      if (!agentType || !session.userId) return;
      setEvidenceOpen(false);
      try {
        await decideAgentAction({ userId: session.userId, agentType, actionId, decision: 'reject' });
        refresh();
      } catch (caught) {
        setError(publicError(caught));
      }
    },
    [agentType, refresh, session.userId, setError, setEvidenceOpen],
  );

  const viewEvidence = useCallback(
    (actionId: string) => {
      if (!agentType || !session.userId) return;
      try {
        viewAgentEvidence({ userId: session.userId, agentType, actionId });
        setEvidenceOpen(true);
        refresh();
      } catch (caught) {
        setError(publicError(caught));
      }
    },
    [agentType, refresh, session.userId, setError, setEvidenceOpen],
  );

  return {
    ready: Boolean(snapshot),
    role,
    agentType,
    anonymous,
    snapshot,
    messages: snapshot?.messages ?? [],
    proposedAction: snapshot?.pendingAction ?? null,
    activityLog: snapshot?.activityLog ?? [],
    persistedActions,
    activityError,
    loading,
    error,
    evidenceOpen,
    liveWired,
    liveConnected,
    diagnostics: {
      aiService: aiServiceReachable ? 'connected' : 'unreachable',
      model: liveConnected ? 'gemini' : 'not_verified',
      auth: authSession?.access_token ? 'available' : 'missing',
    },
    sendMessage,
    approveAction,
    rejectAction,
    suggest,
    viewEvidence,
  };
}
