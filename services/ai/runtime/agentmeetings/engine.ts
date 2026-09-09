/**
 * XIV Meeting Engine — private AI collaboration rooms per Universe.
 * Isolation, provenance, and lifecycle are enforced in-process.
 * Meeting ≠ authority. Consensus ≠ truth.
 */

import {
  DEFAULT_BUDGET,
  EMPTY_SPEND,
  MEETING_LIFECYCLE,
  type Actor,
  type AgentReputation,
  type Allow,
  type Classification,
  type Deny,
  type DirectoryAgent,
  type HumanContribution,
  type MeetingAction,
  type MeetingBudget,
  type MeetingDecision,
  type MeetingEvidence,
  type MeetingMessage,
  type MeetingObjection,
  type MeetingOutcome,
  type MeetingParticipant,
  type MeetingProposal,
  type MeetingSpend,
  type MeetingStage,
  type MeetingVote,
  type OptionProfile,
  type OvernightBrief,
  type TaskForceRecord,
  type TemporalContext,
  type TranslatedUtterance,
  type XivAgentMeeting,
} from './types';

export type DebateRound = {
  meetingId: string;
  kind: 'SPECIALIST_ANALYSIS' | 'CHALLENGE' | 'ALTERNATIVES' | 'RISK';
  actorId: string;
  notes: string;
};

export type MeetingNetwork = {
  storyId: '2I-AI-62B';
  live: false;
  l4Enabled: false;
  autoExecution: false;
  meetings: Map<string, XivAgentMeeting>;
  participants: Map<string, MeetingParticipant[]>;
  messages: Map<string, MeetingMessage[]>;
  evidence: Map<string, MeetingEvidence[]>;
  budgets: Map<string, MeetingBudget>;
  spend: Map<string, MeetingSpend>;
  authorizedContext: Map<string, boolean>;
  injectionAttempts: string[];
  proposals: Map<string, MeetingProposal[]>;
  objections: Map<string, MeetingObjection[]>;
  votes: Map<string, MeetingVote[]>;
  options: Map<string, OptionProfile[]>;
  decisions: Map<string, MeetingDecision[]>;
  contributions: Map<string, HumanContribution[]>;
  actions: Map<string, MeetingAction[]>;
  outcomes: Map<string, MeetingOutcome[]>;
  directory: Map<string, DirectoryAgent>;
  reputations: Map<string, AgentReputation>;
  taskForces: Map<string, TaskForceRecord>;
  utterances: Map<string, TranslatedUtterance[]>;
  temporal: Map<string, TemporalContext>;
  debateRounds: Map<string, DebateRound[]>;
  overnightBriefs: OvernightBrief[];
};

function deny(reason: string): Deny {
  return { ok: false, reason, audited: true };
}

function allow<T>(value: T): Allow<T> {
  return { ok: true, value, audited: true };
}

export function openMeetingNetwork(): MeetingNetwork {
  return {
    storyId: '2I-AI-62B',
    live: false,
    l4Enabled: false,
    autoExecution: false,
    meetings: new Map(),
    participants: new Map(),
    messages: new Map(),
    evidence: new Map(),
    budgets: new Map(),
    spend: new Map(),
    authorizedContext: new Map(),
    injectionAttempts: [],
    proposals: new Map(),
    objections: new Map(),
    votes: new Map(),
    options: new Map(),
    decisions: new Map(),
    contributions: new Map(),
    actions: new Map(),
    outcomes: new Map(),
    directory: new Map(),
    reputations: new Map(),
    taskForces: new Map(),
    utterances: new Map(),
    temporal: new Map(),
    debateRounds: new Map(),
    overnightBriefs: [],
  };
}

export function meetingNetworkLive(_net: MeetingNetwork): false {
  return false;
}

export function createMeeting(
  net: MeetingNetwork,
  input: {
    meetingId: string;
    actor: Actor;
    title: string;
    purpose: string;
    trigger: string;
    classification?: Classification;
    createdAt?: string;
    budget?: Partial<MeetingBudget>;
  },
): Allow<XivAgentMeeting> | Deny {
  if (!input.purpose) return deny('purpose_required');
  if (!input.actor.organizationId) return deny('organization_required');
  if (!input.actor.universeId) return deny('universe_required');
  if (net.meetings.has(input.meetingId)) return deny('meeting_already_exists');

  const meeting: XivAgentMeeting = {
    meetingId: input.meetingId,
    organizationId: input.actor.organizationId,
    universeId: input.actor.universeId,
    title: input.title,
    purpose: input.purpose,
    classification: input.classification ?? 'internal',
    stage: 'MEETING_CREATED',
    status: 'OPEN',
    trigger: input.trigger,
    createdAt: input.createdAt ?? new Date().toISOString(),
    provenance: `meeting:${input.meetingId}`,
    retentionPolicy: 'tenant_universe_default',
    auditId: `audit:${input.meetingId}`,
    meetingEqualsAuthority: false,
    productionLive: false,
    l4Enabled: false,
    guardianSubordinate: false,
  };
  net.meetings.set(meeting.meetingId, meeting);
  net.participants.set(meeting.meetingId, []);
  net.messages.set(meeting.meetingId, []);
  net.evidence.set(meeting.meetingId, []);
  net.budgets.set(meeting.meetingId, { ...DEFAULT_BUDGET, ...input.budget });
  net.spend.set(meeting.meetingId, { ...EMPTY_SPEND });
  net.authorizedContext.set(meeting.meetingId, false);
  return allow(meeting);
}

export function getMeeting(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
): Allow<XivAgentMeeting> | Deny {
  const meeting = net.meetings.get(meetingId);
  if (!meeting) return deny('meeting_not_found');
  if (actor.organizationId !== meeting.organizationId) {
    return deny('cross_organization_meeting_denied');
  }
  if (actor.universeId !== meeting.universeId) {
    return deny('cross_universe_context_denied');
  }
  if (meeting.status === 'QUARANTINED' && !actor.admin) {
    return deny('meeting_quarantined');
  }
  return allow(meeting);
}

export function selectParticipants(
  net: MeetingNetwork,
  meetingId: string,
  host: Actor,
  invitees: readonly MeetingParticipant[],
): Allow<MeetingParticipant[]> | Deny {
  const meeting = getMeeting(net, meetingId, host);
  if (!meeting.ok) return meeting;
  for (const invitee of invitees) {
    if (invitee.organizationId !== meeting.value.organizationId) {
      return deny('cross_organization_participant_denied');
    }
    if (invitee.universeId !== meeting.value.universeId) {
      return deny('cross_universe_participant_denied');
    }
    if (invitee.meetingId !== meetingId) return deny('participant_meeting_mismatch');
  }
  const agents = invitees.filter((p) => p.kind === 'agent');
  const budget = net.budgets.get(meetingId)!;
  if (agents.length > budget.maxParticipatingAgents) {
    return deny('agent_population_exceeds_meeting_budget');
  }
  net.participants.set(meetingId, [...invitees]);
  advanceStage(net, meetingId, 'PARTICIPANTS_SELECTED');
  return allow([...invitees]);
}

export function joinMeeting(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  participant: MeetingParticipant,
): Allow<MeetingParticipant> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (participant.actorId !== actor.actorId) return deny('agent_impersonation_denied');
  if (participant.organizationId !== actor.organizationId) {
    return deny('cross_organization_join_denied');
  }
  if (participant.universeId !== actor.universeId) return deny('cross_universe_join_denied');
  const current = net.participants.get(meetingId) ?? [];
  if (!current.some((p) => p.actorId === actor.actorId)) {
    if (actor.kind === 'agent') {
      const agents = current.filter((p) => p.kind === 'agent').length;
      const budget = net.budgets.get(meetingId)!;
      if (agents + 1 > budget.maxParticipatingAgents) {
        return deny('agent_population_exceeds_meeting_budget');
      }
    }
    current.push(participant);
    net.participants.set(meetingId, current);
  }
  return allow(participant);
}

export function authorizeContext(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
): Allow<true> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  const seated = (net.participants.get(meetingId) ?? []).some((p) => p.actorId === actor.actorId);
  if (!seated) return deny('context_requires_seated_participant');
  net.authorizedContext.set(meetingId, true);
  advanceStage(net, meetingId, 'CONTEXT_AUTHORIZED');
  return allow(true);
}

export function collectEvidence(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  evidence: Omit<MeetingEvidence, 'meetingId' | 'organizationId' | 'universeId'>,
): Allow<MeetingEvidence> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!net.authorizedContext.get(meetingId)) return deny('context_not_authorized');
  if (!isSeated(net, meetingId, actor.actorId)) return deny('unseated_evidence_denied');
  const spend = charge(net, meetingId, { tokens: 25, compute: 1, storage: 1 });
  if (!spend.ok) return spend;
  const record: MeetingEvidence = {
    ...evidence,
    meetingId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
  };
  net.evidence.get(meetingId)!.push(record);
  advanceStage(net, meetingId, 'EVIDENCE_COLLECTED');
  return allow(record);
}

export function postMessage(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  body: string,
  createdAt?: string,
): Allow<MeetingMessage> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, actor.actorId)) return deny('unseated_message_denied');
  if (looksLikeInjection(body)) {
    net.injectionAttempts.push(body);
    return deny('meeting_injection_denied');
  }
  const spend = charge(net, meetingId, { tokens: body.length, compute: 1 });
  if (!spend.ok) return spend;
  const message: MeetingMessage = {
    messageId: `msg:${meetingId}:${(net.messages.get(meetingId) ?? []).length + 1}`,
    meetingId,
    actorId: actor.actorId,
    organizationId: actor.organizationId,
    universeId: actor.universeId,
    body,
    createdAt: createdAt ?? new Date().toISOString(),
    changesAuthority: false,
  };
  net.messages.get(meetingId)!.push(message);
  return allow(message);
}

export function retrievePrivateContext(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
): Allow<XivAgentMeeting> | Deny {
  return getMeeting(net, meetingId, actor);
}

export function advanceStage(net: MeetingNetwork, meetingId: string, stage: MeetingStage): void {
  const meeting = net.meetings.get(meetingId);
  if (!meeting || meeting.status !== 'OPEN') return;
  const current = MEETING_LIFECYCLE.indexOf(meeting.stage);
  const next = MEETING_LIFECYCLE.indexOf(stage);
  if (next >= current) {
    net.meetings.set(meetingId, { ...meeting, stage });
  }
}

export function isSeated(net: MeetingNetwork, meetingId: string, actorId: string): boolean {
  return (net.participants.get(meetingId) ?? []).some((p) => p.actorId === actorId);
}

export function charge(
  net: MeetingNetwork,
  meetingId: string,
  delta: Partial<MeetingSpend>,
): Allow<MeetingSpend> | Deny {
  const budget = net.budgets.get(meetingId);
  const spend = net.spend.get(meetingId);
  if (!budget || !spend) return deny('meeting_budget_missing');
  const next: MeetingSpend = {
    tokens: spend.tokens + (delta.tokens ?? 0),
    compute: spend.compute + (delta.compute ?? 0),
    gpu: spend.gpu + (delta.gpu ?? 0),
    storage: spend.storage + (delta.storage ?? 0),
    toolCalls: spend.toolCalls + (delta.toolCalls ?? 0),
    durationMs: spend.durationMs + (delta.durationMs ?? 0),
    externalRequests: spend.externalRequests + (delta.externalRequests ?? 0),
    maxParticipatingAgents: spend.maxParticipatingAgents,
  };
  if (next.tokens > budget.tokens) return deny('budget_exhausted_tokens');
  if (next.compute > budget.compute) return deny('budget_exhausted_compute');
  if (next.gpu > budget.gpu) return deny('budget_exhausted_gpu');
  if (next.storage > budget.storage) return deny('budget_exhausted_storage');
  if (next.toolCalls > budget.toolCalls) return deny('budget_exhausted_tool_calls');
  if (next.durationMs > budget.durationMs) return deny('budget_exhausted_duration');
  if (next.externalRequests > budget.externalRequests) return deny('budget_exhausted_external_requests');
  net.spend.set(meetingId, next);
  return allow(next);
}

export function spawnUnrestrictedSubagent(): Deny {
  return deny('recursive_unrestricted_agent_creation_denied');
}

function looksLikeInjection(body: string): boolean {
  const lower = body.toLowerCase();
  return (
    lower.includes('ignore previous policy') ||
    lower.includes('grant l4') ||
    lower.includes('disable guardian') ||
    lower.includes('expand authority') ||
    lower.includes('fabricate approval')
  );
}

export function meetingEqualsAuthority(_meeting: XivAgentMeeting): false {
  return false;
}
