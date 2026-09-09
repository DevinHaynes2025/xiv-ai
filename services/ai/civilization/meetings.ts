import { refuse } from './errors';
import { assertUniverseOperable } from './guardian';
import { assessEvidence, HUMAN_JUDGMENT_REQUIRED } from './human-bridge';
import { requireActiveAgent } from './registry';
import {
  now,
  recordGovernanceEvent,
  requireMember,
  requireUniverse,
  visibleTo,
  type CivilizationState,
} from './store';
import { conversationEvidence, readConversation, sendXacpMessage } from './xacp';
import type {
  ActorContext,
  ClaimKind,
  Meeting,
  MeetingAgendaItem,
  MeetingParticipant,
  MeetingParticipantRole,
  MeetingMode,
  MeetingTriggerKind,
  MeetingVote,
  SecurityClassification,
  TemporalContext,
  XacpEvidenceRef,
  XarpRole,
} from './types';

export type MeetingContributionKind = 'proposal' | 'evidence' | 'objection' | 'alternative_hypothesis' | 'question';

export function openMeeting(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    title: string;
    agenda: readonly MeetingAgendaItem[];
    taskForceId?: string | null;
    securityClassification?: SecurityClassification;
    requiresHumanDecision?: boolean;
    triggerKind?: MeetingTriggerKind;
    triggerDetail?: string | null;
    meetingMode?: MeetingMode;
    asyncWindowStart?: string | null;
    asyncWindowEnd?: string | null;
    temporalContext?: TemporalContext | null;
    workingLanguage?: string;
  },
): Meeting {
  const { universe } = requireMember(state, actor);
  assertUniverseOperable(requireUniverse(state, actor.universeId));

  const meeting: Meeting = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: universe.organizationId,
    taskForceId: input.taskForceId ?? null,
    title: input.title,
    agenda: [...input.agenda],
    status: 'open',
    lifecycleStage: 'created',
    triggerKind: input.triggerKind ?? 'human_request',
    triggerDetail: input.triggerDetail ?? null,
    meetingMode: input.meetingMode ?? 'interactive',
    asyncWindowStart: input.asyncWindowStart ?? null,
    asyncWindowEnd: input.asyncWindowEnd ?? null,
    temporalContext: input.temporalContext ?? null,
    workingLanguage: input.workingLanguage ?? 'en',
    synthesis: null,
    recommendationConfidence: null,
    humanDecisionRequired: input.requiresHumanDecision ?? true,
    securityClassification: input.securityClassification ?? 'confidential',
    requiresHumanDecision: input.requiresHumanDecision ?? true,
    decision: null,
    decisionBy: null,
    decidedAt: null,
    unresolvedDisagreements: [],
    summary: null,
    provenance: { openedBy: actor.userId, slice: '2I-AI-62A' },
    retentionPolicy: 'retain-7y-then-review',
    auditEventId: null,
    createdBy: actor.userId,
    createdAt: now(state),
    closedAt: null,
    archivedAt: null,
  };
  state.meetings.push(meeting);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'meeting_opened',
    actorUserId: actor.userId,
    detail: { meetingId: meeting.id, title: meeting.title, agendaItems: meeting.agenda.length },
  });

  return meeting;
}

export function joinMeeting(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    meetingId: string;
    participantKind: 'agent' | 'human';
    agentId?: string | null;
    userId?: string | null;
    participantRole?: MeetingParticipantRole;
    xarpRoles?: readonly XarpRole[];
    operatorUserId?: string | null;
    speakingLanguage?: string;
  },
): MeetingParticipant {
  const { universe } = requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  if (input.participantKind === 'agent') {
    if (!input.agentId) refuse('meeting_participant_unknown', 'agent participants need an agent id');
    requireActiveAgent(state, actor.universeId, input.agentId);
  } else if (!input.userId) {
    refuse('meeting_participant_unknown', 'human participants need a user id');
  }

  const existing = state.meetingParticipants.find(
    (item) =>
      item.meetingId === meeting.id &&
      ((input.participantKind === 'agent' && item.agentId === input.agentId) ||
        (input.participantKind === 'human' && item.userId === input.userId)),
  );
  if (existing) return existing;

  const participant: MeetingParticipant = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: universe.organizationId,
    meetingId: meeting.id,
    participantKind: input.participantKind,
    agentId: input.participantKind === 'agent' ? (input.agentId ?? null) : null,
    userId: input.participantKind === 'human' ? (input.userId ?? null) : null,
    participantRole: input.participantRole ?? (input.participantKind === 'human' ? 'human_supervisor' : 'contributor'),
    xarpRoles: [...(input.xarpRoles ?? [])],
    // An agent holds no credential, so seating one records the human who relays
    // its turns. Defaulting to the caller is the honest choice: whoever seated
    // the agent is accountable for what it says until that is changed.
    operatorUserId: input.participantKind === 'agent' ? (input.operatorUserId ?? actor.userId) : null,
    speakingLanguage: input.speakingLanguage ?? meeting.workingLanguage,
    invitedBy: actor.userId,
    vote: null,
    voteRationale: null,
    provenance: { seatedBy: actor.userId },
    joinedAt: now(state),
    leftAt: null,
  };
  state.meetingParticipants.push(participant);

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_participant_joined',
    actorUserId: actor.userId,
    subjectAgentId: participant.agentId,
    detail: {
      meetingId: meeting.id,
      participantKind: participant.participantKind,
      participantRole: participant.participantRole,
    },
  });

  return participant;
}

// Deliberation is carried on the XACP conversation whose id is the meeting id.
// A meeting therefore inherits the same provenance guarantees as any other
// agent-to-agent exchange, and a human reading the room sees the reasoning
// rather than only the conclusion.
export function contribute(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    meetingId: string;
    kind: MeetingContributionKind;
    fromAgentId?: string | null;
    fromUserId?: string | null;
    statement: string;
    reasoning: string;
    evidence?: readonly XacpEvidenceRef[];
    confidence?: number | null;
  },
) {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  if (meeting.status !== 'open' && meeting.status !== 'deliberating' && meeting.status !== 'awaiting_human') {
    refuse('meeting_not_open', meeting.status);
  }
  assertParticipant(state, meeting.id, { agentId: input.fromAgentId, userId: input.fromUserId });

  if (meeting.status === 'open') meeting.status = 'deliberating';

  // A meeting is the collaborate phase of XACP. Every contribution carries the
  // same phase so the room reads in the order it happened, and the kind of
  // contribution is recorded in the purpose instead.
  const chair = chairOf(state, meeting.id);
  const chairIsSender = Boolean(chair?.agentId && chair.agentId === input.fromAgentId);
  const receiverAgentId = chairIsSender ? null : (chair?.agentId ?? null);
  const receiverUserId = receiverAgentId ? null : (chair?.userId ?? meeting.createdBy);

  const message = sendXacpMessage(state, actor, {
    conversationId: meeting.id,
    phase: 'collaborate',
    senderAgentId: input.fromAgentId ?? null,
    senderUserId: input.fromUserId ?? null,
    receiverAgentId,
    receiverUserId,
    purpose: `${input.kind}: ${input.statement}`,
    reasoningArtifact: input.reasoning,
    evidence: input.evidence ?? [{ label: input.statement, claimKind: 'agent_inference', confidence: 0.4, knowledgeSourceId: null }],
    confidence: input.confidence ?? null,
    securityClassification: meeting.securityClassification,
  });

  if (input.kind === 'objection') {
    meeting.unresolvedDisagreements = [...meeting.unresolvedDisagreements, input.statement];
  }

  return message;
}

export function resolveDisagreement(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; statement: string },
): Meeting {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  meeting.unresolvedDisagreements = meeting.unresolvedDisagreements.filter((item) => item !== input.statement);
  return meeting;
}

export function recordVote(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    meetingId: string;
    agentId?: string | null;
    userId?: string | null;
    vote: MeetingVote;
    rationale: string;
  },
): MeetingParticipant {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  const participant = assertParticipant(state, meeting.id, { agentId: input.agentId, userId: input.userId });

  participant.vote = input.vote;
  participant.voteRationale = input.rationale;

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_vote_recorded',
    actorUserId: actor.userId,
    subjectAgentId: participant.agentId,
    decision: input.vote,
    detail: { meetingId: meeting.id, rationale: input.rationale },
  });

  return participant;
}

export type MeetingDeliberation = {
  meeting: Meeting;
  recommendCount: number;
  objectCount: number;
  abstainCount: number;
  insufficientEvidenceCount: number;
  unresolvedDisagreements: string[];
  evidenceAssessment: ReturnType<typeof assessEvidence>;
  humanJudgmentRequired: boolean;
  statement: string;
};

// Agents deliberate asynchronously and may reach a shared position, but the
// position is a recommendation. The escalation rule is deliberately blunt: an
// objection, an insufficient-evidence vote, or weak evidence all send the room
// to a human.
export function summarizeDeliberation(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): MeetingDeliberation {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, meetingId);
  const participants = state.meetingParticipants.filter((item) => item.meetingId === meeting.id);
  const messages = readConversation(state, actor, meeting.id);
  const evidenceAssessment = assessEvidence(conversationEvidence(messages));

  const recommendCount = participants.filter((item) => item.vote === 'recommend').length;
  const objectCount = participants.filter((item) => item.vote === 'object').length;
  const abstainCount = participants.filter((item) => item.vote === 'abstain').length;
  const insufficientEvidenceCount = participants.filter((item) => item.vote === 'insufficient_evidence').length;

  const humanJudgmentRequired =
    meeting.requiresHumanDecision ||
    objectCount > 0 ||
    insufficientEvidenceCount > 0 ||
    meeting.unresolvedDisagreements.length > 0 ||
    !evidenceAssessment.sufficient;

  return {
    meeting,
    recommendCount,
    objectCount,
    abstainCount,
    insufficientEvidenceCount,
    unresolvedDisagreements: [...meeting.unresolvedDisagreements],
    evidenceAssessment,
    humanJudgmentRequired,
    // Strong evidence is not the same as a settled room. An objection or an
    // unresolved disagreement still needs a person, so the statement follows
    // the escalation rule rather than the confidence score.
    statement: humanJudgmentRequired ? HUMAN_JUDGMENT_REQUIRED : evidenceAssessment.statement,
  };
}

export function escalateToHuman(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; reason: string },
): Meeting {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  meeting.status = 'awaiting_human';

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_escalated_to_human',
    actorUserId: actor.userId,
    decision: 'awaiting_human',
    detail: { meetingId: meeting.id, reason: input.reason },
  });

  return meeting;
}

// A human decision is an attributable governance record, not an invisible
// training signal. The decider must be a human participant in the room.
export function decideMeeting(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; decision: string; rationale: string },
): Meeting {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  const human = state.meetingParticipants.find(
    (item) => item.meetingId === meeting.id && item.participantKind === 'human' && item.userId === actor.userId,
  );
  if (!human) refuse('meeting_requires_human_decider', actor.userId);

  meeting.decision = input.decision;
  meeting.decisionBy = actor.userId;
  meeting.decidedAt = now(state);
  meeting.status = 'decided';

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_decided',
    actorUserId: actor.userId,
    decision: input.decision,
    detail: {
      meetingId: meeting.id,
      rationale: input.rationale,
      unresolvedDisagreements: meeting.unresolvedDisagreements,
    },
  });

  return meeting;
}

export function archiveMeeting(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; summary: string },
): Meeting {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  if (meeting.requiresHumanDecision && meeting.status !== 'decided') {
    refuse('meeting_decision_not_reached', meeting.status);
  }

  meeting.summary = input.summary;
  meeting.status = 'archived';
  meeting.archivedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_archived',
    actorUserId: actor.userId,
    detail: { meetingId: meeting.id, summary: input.summary },
  });

  return meeting;
}

export function listMeetings(state: CivilizationState, actor: ActorContext): Meeting[] {
  return visibleTo(state, actor, state.meetings);
}

export function meetingParticipants(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): MeetingParticipant[] {
  requireMember(state, actor);
  return state.meetingParticipants.filter(
    (item) => item.meetingId === meetingId && item.universeId === actor.universeId,
  );
}

export function requireMeeting(state: CivilizationState, universeId: string, meetingId: string): Meeting {
  const meeting = state.meetings.find((item) => item.id === meetingId);
  if (!meeting) refuse('meeting_unknown', meetingId);
  if (meeting.universeId !== universeId) refuse('tenancy_cross_universe_blocked', meetingId);
  return meeting;
}

function chairOf(state: CivilizationState, meetingId: string) {
  return state.meetingParticipants.find(
    (item) => item.meetingId === meetingId && item.participantRole === 'chair',
  );
}

function assertParticipant(
  state: CivilizationState,
  meetingId: string,
  who: { agentId?: string | null; userId?: string | null },
): MeetingParticipant {
  const participant = state.meetingParticipants.find(
    (item) =>
      item.meetingId === meetingId &&
      ((who.agentId && item.agentId === who.agentId) || (who.userId && item.userId === who.userId)),
  );
  if (!participant) refuse('meeting_participant_unknown', who.agentId ?? who.userId ?? 'unknown');
  return participant;
}

export function claimKindsInRoom(state: CivilizationState, meetingId: string): ClaimKind[] {
  const kinds = new Set<ClaimKind>();
  for (const message of state.messages.filter((item) => item.conversationId === meetingId)) {
    for (const item of message.evidence) kinds.add(item.claimKind);
  }
  return [...kinds];
}
