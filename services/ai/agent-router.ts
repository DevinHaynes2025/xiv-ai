import { completeAgentTurn } from './model-router';
import {
  persistAction,
  persistActionPatch,
  persistAgent,
  persistApproval,
  persistAudit,
  persistMemory,
  persistMessage,
  persistSession,
} from './persistence';
import { recordApprovalDecisionAudit } from './approval-audit';
import {
  AGENT_ALLOWED_TOOLS,
  assertToolAllowed,
  canSimulate,
  gateStructuredOutput,
  isToolAllowed,
  requiresHumanApproval,
} from './policies';
import { getAgentTool } from './tools';
import { agentTypeForRole, toAgentTurnContext } from './turn-context';
import type {
  Agent,
  AgentAction,
  AgentApproval,
  AgentIntentLog,
  AgentMessage,
  AgentSessionContext,
  AgentStatus,
  AgentToolId,
  AgentType,
  PersistedAgentActionStatus,
  StructuredAgentOutput,
} from './types';

type ActivityEntry = {
  id: string;
  at: string;
  text: string;
};

type SessionState = {
  agent: Agent;
  context: AgentSessionContext;
  persistedSessionId: string;
  startedAt: string;
  messages: AgentMessage[];
  actions: AgentAction[];
  approvals: AgentApproval[];
  intents: AgentIntentLog[];
  activityLog: ActivityEntry[];
  lastStructured: StructuredAgentOutput | null;
};

const globalStore = globalThis as typeof globalThis & {
  __xivAgentSessions?: Map<string, SessionState>;
};

function sessions() {
  if (!globalStore.__xivAgentSessions) {
    globalStore.__xivAgentSessions = new Map();
  }
  return globalStore.__xivAgentSessions;
}

const AGENT_CATALOG: Record<AgentType, Omit<Agent, 'status' | 'allowedTools'>> = {
  consumer_agent: {
    id: 'agent.consumer',
    type: 'consumer_agent',
    name: 'XIV Consumer Agent',
    summary: 'Helps you discover, connect, and enter opportunities under explicit permission.',
  },
  employee_agent: {
    id: 'agent.employee',
    type: 'employee_agent',
    name: 'XIV Employee Agent',
    summary: 'Helps the anonymous floor without using legal identity.',
  },
  business_agent: {
    id: 'agent.business',
    type: 'business_agent',
    name: 'XIV Business Agent',
    summary: 'Reviews business health and recommends a next action. Consequential work stays behind approval.',
  },
  executive_agent: {
    id: 'agent.executive',
    type: 'executive_agent',
    name: 'XIV Executive Agent',
    summary: 'Prepares chair-facing recommendations. Consequential work stays behind approval.',
  },
};

function sessionKey(userId: string, type: AgentType) {
  return `${userId}:${type}`;
}

function nowIso() {
  return new Date().toISOString();
}

function nid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const n = (Math.random() * 16) | 0;
    const v = ch === 'x' ? n : (n & 0x3) | 0x8;
    return v.toString(16);
  });
}

function logIntent(state: SessionState, input: Omit<AgentIntentLog, 'id' | 'at' | 'userId' | 'agentType'>) {
  const entry: AgentIntentLog = {
    id: nid(),
    at: nowIso(),
    userId: state.context.userId,
    agentType: state.agent.type,
    ...input,
  };
  state.intents = [...state.intents, entry].slice(-80);
  if (typeof console !== 'undefined') {
    console.info('[xiv-agent-intent]', {
      kind: entry.kind,
      agentType: entry.agentType,
      toolId: entry.toolId,
      actionId: entry.actionId,
      riskLevel: entry.riskLevel,
    });
  }
  void persistAudit(entry, { sessionId: state.persistedSessionId });
}

export { agentTypeForRole } from './turn-context';

function buildAgent(type: AgentType, status: AgentStatus): Agent {
  return {
    ...AGENT_CATALOG[type],
    allowedTools: AGENT_ALLOWED_TOOLS[type],
    status,
  };
}

export function openAgentSession(context: AgentSessionContext) {
  const type = agentTypeForRole(context.role);
  if (!type) return null;

  const key = sessionKey(context.userId, type);
  const existing = sessions().get(key);
  if (existing) {
    existing.context = context;
    existing.agent = {
      ...existing.agent,
      name: AGENT_CATALOG[type].name,
      summary: AGENT_CATALOG[type].summary,
      allowedTools: AGENT_ALLOWED_TOOLS[type],
    };
    if (!existing.activityLog) existing.activityLog = [];
    if (!existing.lastStructured) existing.lastStructured = null;
    if (!existing.persistedSessionId) existing.persistedSessionId = nid();
    if (!existing.startedAt) existing.startedAt = nowIso();
    return snapshot(existing);
  }

  const persistedSessionId = nid();
  const startedAt = nowIso();
  const state: SessionState = {
    agent: buildAgent(type, 'idle'),
    context,
    persistedSessionId,
    startedAt,
    messages: [
      {
        id: nid(),
        agentType: type,
        role: 'system',
        content:
          type === 'executive_agent' || type === 'business_agent'
            ? 'This agent is governed. Gemini runs on the XIV AI service, not in this app. Consequential work needs your approval and stays a prototype simulation.'
            : 'This agent is governed. It may only use an explicit tool list. Model replies are mocked. Consequential work needs your approval and stays a prototype simulation.',
        createdAt: nowIso(),
      },
      {
        id: nid(),
        agentType: type,
        role: 'agent',
        content: openingLine(type, context),
        createdAt: nowIso(),
      },
    ],
    actions: [],
    approvals: [],
    intents: [],
    activityLog: [],
    lastStructured: null,
  };

  logIntent(state, {
    kind: 'session_open',
    note: 'Opened governed agent session',
  });

  sessions().set(key, state);
  void persistAgent({
    id: state.agent.id,
    user_id: context.userId,
    type: state.agent.type,
    name: state.agent.name,
  });
  void persistSession({
    id: state.persistedSessionId,
    user_id: context.userId,
    organization_id: null,
    agent_type: state.agent.type,
    started_at: state.startedAt,
  });
  if (!context.anonymous) {
    void persistMemory({
      id: `${context.userId}:${type}:last_open`,
      user_id: context.userId,
      agent_type: type,
      memory_key: 'last_open',
      memory_value: 'session',
    });
  }
  return snapshot(state);
}

function openingLine(type: AgentType, context: AgentSessionContext) {
  if (type === 'executive_agent') {
    return 'I can analyze business health and recommend a next action. I will not execute consequential work on my own.';
  }
  if (type === 'employee_agent') {
    return `Working as ${context.alias ?? 'an alias'}. I will not use a legal name on this floor.`;
  }
  if (type === 'business_agent') {
    return 'I can review business health and recommend a next action. I will not execute consequential work on my own.';
  }
  const first = context.displayName?.split(' ')[0];
  return first
    ? `${first}, I can work from your saved interests. I will ask before any write-shaped action.`
    : 'I can work from your saved interests. I will ask before any write-shaped action.';
}

function snapshot(state: SessionState) {
  return {
    agent: state.agent,
    context: state.context,
    messages: state.messages,
    actions: state.actions,
    approvals: state.approvals,
    intents: state.intents,
    activityLog: state.activityLog,
    lastStructured: state.lastStructured ?? null,
    pendingAction: state.actions.find((item) => item.status === 'proposed') ?? null,
    suggestedActions: suggestedFor(state),
  };
}

function suggestedFor(state: SessionState): AgentAction[] {
  const pending = state.actions.filter((item) => item.status === 'proposed');
  if (pending.length > 0) return pending;
  return AGENT_ALLOWED_TOOLS[state.agent.type].map((toolId) => {
    const tool = getAgentTool(toolId);
    return {
      id: `suggest_${toolId}`,
      agentType: state.agent.type,
      toolId,
      title: tool.name,
      summary: tool.description,
      riskLevel: tool.riskLevel,
      status: 'proposed' as const,
      requiresApproval: requiresHumanApproval(tool),
      prototype: true as const,
      evidence: [],
      createdAt: nowIso(),
    };
  });
}

function appendActivity(state: SessionState, text: string) {
  state.activityLog = [...(state.activityLog ?? []), { id: nid(), at: nowIso(), text }];
}

async function ensurePersistedSession(state: SessionState) {
  await persistSession({
    id: state.persistedSessionId,
    user_id: state.context.userId,
    organization_id: null,
    agent_type: state.agent.type,
    started_at: state.startedAt,
  });
}

function actionInputPayload(action: AgentAction) {
  return {
    title: action.title,
    summary: action.summary,
    recommendation: action.recommendation ?? null,
    tool_id: action.toolId,
    prototype: true,
    evidence: action.evidence.map((item) => item.label),
  };
}

function toActionRow(
  state: SessionState,
  action: AgentAction,
  status: PersistedAgentActionStatus,
  extras?: { result?: Record<string, unknown>; completedAt?: string | null },
) {
  return {
    id: action.id,
    session_id: state.persistedSessionId,
    user_id: state.context.userId,
    organization_id: null,
    agent_type: action.agentType,
    tool_id: action.toolId,
    action_type: action.title,
    description: action.summary,
    risk_level: action.riskLevel,
    status,
    input_payload: actionInputPayload(action),
    result_payload: extras?.result ?? null,
    completed_at: extras?.completedAt ?? null,
  };
}

async function persistSessionMessage(state: SessionState, message: AgentMessage) {
  await persistMessage({
    id: message.id,
    session_id: state.persistedSessionId,
    user_id: state.context.userId,
    role: message.role,
    content: message.content,
  });
}

async function persistProposedAction(state: SessionState, action: AgentAction) {
  await ensurePersistedSession(state);
  await persistAction(toActionRow(state, action, action.requiresApproval ? 'awaiting_approval' : 'proposed'));
}

function requireSession(userId: string, type: AgentType) {
  const state = sessions().get(sessionKey(userId, type));
  if (!state) throw new Error('agent_session_missing');
  return state;
}

export async function sendAgentMessage(input: { userId: string; agentType: AgentType; text: string }) {
  const state = requireSession(input.userId, input.agentType);
  const text = input.text.trim();
  if (!text) return snapshot(state);

  const userMessage: AgentMessage = {
    id: nid(),
    agentType: state.agent.type,
    role: 'user',
    content: text,
    createdAt: nowIso(),
  };
  state.messages = [...state.messages, userMessage];
  state.agent = { ...state.agent, status: 'thinking' };
  logIntent(state, { kind: 'message', note: 'User message accepted' });
  await ensurePersistedSession(state);
  await persistSessionMessage(state, userMessage);

  const turnFields = toAgentTurnContext(state.context, text);
  const turn = await completeAgentTurn({
    agent: state.agent,
    context: state.context,
    ...turnFields,
  });

  if (turn.blocked) {
    state.agent = { ...state.agent, status: 'blocked' };
    logIntent(state, { kind: 'blocked', note: turn.blocked });
    const blockedMessage: AgentMessage = {
      id: nid(),
      agentType: state.agent.type,
      role: 'system',
      content: turn.blocked,
      createdAt: nowIso(),
    };
    state.messages = [...state.messages, blockedMessage];
    await persistSessionMessage(state, blockedMessage);
    return snapshot(state);
  }

  if (turn.proposedAction) {
    try {
      assertToolAllowed(state.agent.type, turn.proposedAction.toolId);
    } catch {
      state.agent = { ...state.agent, status: 'blocked' };
      logIntent(state, {
        kind: 'blocked',
        toolId: turn.proposedAction.toolId,
        note: 'Model proposed a tool outside the allowlist',
      });
      return snapshot(state);
    }

    state.actions = [...state.actions.filter((item) => item.status !== 'proposed'), turn.proposedAction];
    state.agent = { ...state.agent, status: 'awaiting_approval' };
    logIntent(state, {
      kind: 'propose',
      toolId: turn.proposedAction.toolId,
      actionId: turn.proposedAction.id,
      riskLevel: turn.proposedAction.riskLevel,
      note: turn.proposedAction.title,
    });
    await persistProposedAction(state, turn.proposedAction);
  } else {
    state.agent = { ...state.agent, status: 'idle' };
  }

  const agentMessage: AgentMessage = {
    id: nid(),
    agentType: state.agent.type,
    role: 'agent',
    content: turn.reply,
    createdAt: nowIso(),
    actionId: turn.proposedAction?.id,
  };
  state.messages = [...state.messages, agentMessage];
  await persistSessionMessage(state, agentMessage);

  return snapshot(state);
}

function toolForStructured(output: StructuredAgentOutput, agentType: AgentType): AgentToolId {
  const blob = `${output.proposedAction?.type ?? ''} ${output.proposedAction?.description ?? ''} ${output.recommendation}`.toLowerCase();
  if (agentType === 'business_agent') {
    if (blob.includes('inventory')) return 'suggest_inventory_changes';
    if (blob.includes('campaign')) return 'draft_campaign';
    if (blob.includes('task') || blob.includes('project')) return 'create_project_task';
    if (blob.includes('system') || blob.includes('connector')) return 'list_connected_systems';
    if (output.riskLevel === 'low' && !output.proposedAction) return 'summarize_business_health';
    return 'draft_briefing_note';
  }
  if (blob.includes('realloc') || blob.includes('supplier')) return 'simulate_supplier_reallocation';
  if (blob.includes('email')) return 'prepare_supplier_email';
  if (blob.includes('inventory')) return 'suggest_inventory_changes';
  if (output.riskLevel === 'low' && !output.proposedAction) return 'summarize_company_health';
  return 'draft_chair_brief';
}

export async function applyStructuredTurn(input: {
  userId: string;
  agentType: AgentType;
  userMessage: string;
  output: StructuredAgentOutput;
}) {
  const state = requireSession(input.userId, input.agentType);
  const gated = gateStructuredOutput(input.output);
  const text = input.userMessage.trim();
  if (!text) return snapshot(state);

  state.lastStructured = gated;
  const userMessage: AgentMessage = {
    id: nid(),
    agentType: state.agent.type,
    role: 'user',
    content: text,
    createdAt: nowIso(),
  };
  state.messages = [...state.messages, userMessage];
  logIntent(state, { kind: 'message', note: 'User message accepted' });
  await ensurePersistedSession(state);
  await persistSessionMessage(state, userMessage);

  let proposed: AgentAction | undefined;
  if (gated.requiresApproval) {
    const toolId = toolForStructured(gated, input.agentType);
    try {
      assertToolAllowed(state.agent.type, toolId);
    } catch {
      state.agent = { ...state.agent, status: 'blocked' };
      logIntent(state, { kind: 'blocked', toolId, note: 'Structured action mapped outside allowlist' });
      return snapshot(state);
    }

    proposed = {
      id: nid(),
      agentType: state.agent.type,
      toolId,
      title: gated.proposedAction?.type || gated.recommendation,
      summary: gated.summary,
      recommendation: gated.recommendation,
      riskLevel: gated.riskLevel,
      status: 'proposed',
      requiresApproval: true,
      prototype: true,
      evidence: gated.evidence.map((label, index) => ({
        id: `ev${index + 1}`,
        label,
        detail: label,
        source: 'gemini.gated',
      })),
      createdAt: nowIso(),
    };
    state.actions = [...state.actions.filter((item) => item.status !== 'proposed'), proposed];
    state.agent = { ...state.agent, status: 'awaiting_approval' };
    logIntent(state, {
      kind: 'propose',
      toolId: proposed.toolId,
      actionId: proposed.id,
      riskLevel: proposed.riskLevel,
      note: proposed.title,
    });
    await persistProposedAction(state, proposed);
  } else {
    state.agent = { ...state.agent, status: 'idle' };
  }

  const reply = `${gated.summary}\nRecommendation: ${gated.recommendation}`;
  const agentMessage: AgentMessage = {
    id: nid(),
    agentType: state.agent.type,
    role: 'agent',
    content: reply,
    createdAt: nowIso(),
    actionId: proposed?.id,
  };
  state.messages = [...state.messages, agentMessage];
  await persistSessionMessage(state, agentMessage);
  appendActivity(state, gated.requiresApproval ? 'Recommendation ready for approval' : 'Analysis returned');
  return snapshot(state);
}

export async function proposeListedTool(input: { userId: string; agentType: AgentType; toolId: AgentToolId }) {
  const state = requireSession(input.userId, input.agentType);
  if (!isToolAllowed(state.agent.type, input.toolId)) {
    logIntent(state, { kind: 'blocked', toolId: input.toolId, note: 'Unlisted tool' });
    state.agent = { ...state.agent, status: 'blocked' };
    return snapshot(state);
  }

  const tool = getAgentTool(input.toolId);
  const action: AgentAction = {
    id: nid(),
    agentType: state.agent.type,
    toolId: tool.id,
    title: tool.name,
    summary: tool.description,
    riskLevel: tool.riskLevel,
    status: 'proposed',
    requiresApproval: requiresHumanApproval(tool),
    prototype: true,
    evidence: [
      {
        id: 'policy',
        label: 'Allowlist',
        detail: `${tool.id} is in ${state.agent.type} allowed tools.`,
        source: 'policy.allowed_tools',
      },
    ],
    createdAt: nowIso(),
  };

  state.actions = [...state.actions.filter((item) => item.status !== 'proposed'), action];
  state.agent = { ...state.agent, status: 'awaiting_approval' };
  logIntent(state, {
    kind: 'propose',
    toolId: tool.id,
    actionId: action.id,
    riskLevel: tool.riskLevel,
    note: tool.name,
  });
  await persistProposedAction(state, action);
  return snapshot(state);
}

async function persistDecision(state: SessionState, action: AgentAction, approval: AgentApproval, status: 'approved' | 'rejected') {
  await ensurePersistedSession(state);
  await persistAction(toActionRow(state, action, status));
  await persistApproval({
    id: approval.id,
    action_id: action.id,
    user_id: state.context.userId,
    decision: status,
    decision_note: approval.note,
  });
}

export async function decideAgentAction(input: {
  userId: string;
  agentType: AgentType;
  actionId: string;
  decision: 'approve' | 'reject';
}) {
  const state = requireSession(input.userId, input.agentType);
  const action = state.actions.find((item) => item.id === input.actionId);
  if (!action || action.status !== 'proposed') return snapshot(state);

  const approval: AgentApproval = {
    id: nid(),
    actionId: action.id,
    agentType: state.agent.type,
    decision: input.decision,
    decidedAt: nowIso(),
    actorUserId: state.context.userId,
    note: input.decision === 'approve' ? 'Human approved prototype simulation' : 'Human rejected action',
  };
  state.approvals = [...state.approvals, approval];
  recordApprovalDecisionAudit({
    actionId: action.id,
    agentId: state.agent.id,
    toolId: action.toolId,
    decision: input.decision,
    reviewedBy: state.context.userId,
    reason: approval.note,
    requestedAt: action.createdAt,
  });

  if (input.decision === 'reject') {
    action.status = 'rejected';
    action.decidedAt = approval.decidedAt;
    state.agent = { ...state.agent, status: 'idle' };
    logIntent(state, {
      kind: 'reject',
      toolId: action.toolId,
      actionId: action.id,
      riskLevel: action.riskLevel,
      note: action.title,
    });
    appendActivity(state, `Rejected: ${action.title}`);
    const rejectedMessage: AgentMessage = {
      id: nid(),
      agentType: state.agent.type,
      role: 'system',
      content: `Rejected: ${action.title}. No simulation ran.`,
      createdAt: nowIso(),
      actionId: action.id,
    };
    state.messages = [...state.messages, rejectedMessage];
    await persistDecision(state, action, approval, 'rejected');
    await persistSessionMessage(state, rejectedMessage);
    return snapshot(state);
  }

  action.status = 'approved';
  action.decidedAt = approval.decidedAt;
  logIntent(state, {
    kind: 'approve',
    toolId: action.toolId,
    actionId: action.id,
    riskLevel: action.riskLevel,
    note: action.title,
  });
  await persistDecision(state, action, approval, 'approved');

  const tool = getAgentTool(action.toolId);
  if (
    action.riskLevel === 'high' ||
    action.riskLevel === 'critical' ||
    !canSimulate(tool, true) ||
    !isToolAllowed(state.agent.type, action.toolId)
  ) {
    action.status = 'approved';
    state.agent = { ...state.agent, status: 'idle' };
    logIntent(state, {
      kind: 'blocked',
      toolId: action.toolId,
      actionId: action.id,
      riskLevel: action.riskLevel,
      note: 'Approved but execution is not permitted',
    });
    appendActivity(state, `Approval recorded. Not executed: ${action.title}`);
    const blockedMessage: AgentMessage = {
      id: nid(),
      agentType: state.agent.type,
      role: 'system',
      content: 'Approval recorded. High-risk and consequential actions are not executed in this prototype.',
      createdAt: nowIso(),
      actionId: action.id,
    };
    state.messages = [...state.messages, blockedMessage];
    await persistSessionMessage(state, blockedMessage);
    return snapshot(state);
  }

  const result =
    action.toolId === 'simulate_supplier_reallocation'
      ? 'Supplier reallocation simulation completed.'
      : `Prototype simulation completed: ${action.title}`;

  await persistActionPatch(action.id, {
    status: 'executing',
    risk_level: action.riskLevel,
    result_payload: { prototype: true, production: false, label: 'prototype_simulation' },
  });

  const resultPayload = {
    prototype: true,
    production: false,
    label: 'prototype_simulation',
    result,
  };

  logIntent(state, {
    kind: 'simulate',
    toolId: action.toolId,
    actionId: action.id,
    riskLevel: action.riskLevel,
    note: 'Prototype simulation only',
  });
  appendActivity(state, result);
  const completedMessage: AgentMessage = {
    id: nid(),
    agentType: state.agent.type,
    role: 'system',
    content: result,
    createdAt: nowIso(),
    actionId: action.id,
  };
  state.messages = [...state.messages, completedMessage];
  state.agent = { ...state.agent, status: 'idle' };
  await persistActionPatch(action.id, {
    status: 'completed',
    risk_level: action.riskLevel,
    result_payload: resultPayload,
    completed_at: nowIso(),
  });
  await persistSessionMessage(state, completedMessage);
  return snapshot(state);
}

export function viewAgentEvidence(input: { userId: string; agentType: AgentType; actionId: string }) {
  const state = requireSession(input.userId, input.agentType);
  const action = state.actions.find((item) => item.id === input.actionId);
  if (action) {
    logIntent(state, {
      kind: 'view_evidence',
      toolId: action.toolId,
      actionId: action.id,
      riskLevel: action.riskLevel,
      note: 'Evidence opened',
    });
  }
  return snapshot(state);
}

export function getAgentSnapshot(userId: string, type: AgentType) {
  const state = sessions().get(sessionKey(userId, type));
  return state ? snapshot(state) : null;
}

export type AgentSnapshot = NonNullable<ReturnType<typeof openAgentSession>>;
