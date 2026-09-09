import { assertAgentControllable } from './controls';
import { refuse } from './errors';
import { assertUniverseOperable } from './guardian';
import * as guardianObserver from './guardian-observer';
import { assessEvidence, evidenceRef, HUMAN_JUDGMENT_REQUIRED } from './human-bridge';
import { chargeMeeting, meetingBudget, setMeetingBudget, type MeetingBudgetInput } from './governor';
import { joinMeeting, openMeeting, requireMeeting } from './meetings';
import { oversightForProfession } from './directory';
import { requireActiveAgent } from './registry';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  requireMember,
  requireSupervisor,
  requireUniverse,
  visibleTo,
  type CivilizationState,
} from './store';
import { assertHoldsRole, assertSpeakingGrant, assertSynthesisRoleCoverage, synthesisRoleCoverage } from './xarp';
import type {
  ActorContext,
  DecisionKind,
  EvidenceContradiction,
  EvidenceDirection,
  Meeting,
  MeetingAction,
  MeetingActionStatus,
  MeetingAgendaItem,
  MeetingAlternative,
  MeetingDecisionRecord,
  MeetingEvidence,
  MeetingLifecycleStage,
  MeetingMessage,
  MeetingMessageKind,
  MeetingMode,
  MeetingObjection,
  MeetingOutcome,
  MeetingParticipant,
  MeetingParticipantRole,
  MeetingProposal,
  MeetingProposalVote,
  MeetingSynthesis,
  MeetingTriggerKind,
  ObjectionResolutionKind,
  ObjectionSeverity,
  OutcomeGrade,
  PreservedDisagreement,
  ProposalVote,
  SecurityClassification,
  TemporalContext,
  XarpRole,
} from './types';

// The sixteen-step meeting lifecycle, in the order the story gives it. The array
// is the source of truth for ordering: a meeting can skip forward but never back,
// which is the same rule xiv_enforce_meeting_lifecycle applies in the database.
export const MEETING_STAGES: readonly MeetingLifecycleStage[] = [
  'trigger',
  'created',
  'participants_selected',
  'context_authorized',
  'evidence_collected',
  'specialist_analysis',
  'debate',
  'contradiction_detection',
  'alternatives_generated',
  'risk_analysis',
  'consensus_or_disagreement',
  'human_checkpoint',
  'decision',
  'authorized_action',
  'outcome',
  'post_meeting_evaluation',
  'knowledge_lineage',
];

const STAGE_INDEX = new Map(MEETING_STAGES.map((stage, index) => [stage, index]));

export function stageIndex(stage: MeetingLifecycleStage) {
  return STAGE_INDEX.get(stage) ?? 0;
}

export function hasReached(meeting: Meeting, stage: MeetingLifecycleStage) {
  return stageIndex(meeting.lifecycleStage) >= stageIndex(stage);
}

// ---------------------------------------------------------------------------
// Convening
// ---------------------------------------------------------------------------

export type ConveneInput = {
  title: string;
  agenda: readonly MeetingAgendaItem[];
  triggerKind?: MeetingTriggerKind;
  triggerDetail?: string;
  taskForceId?: string | null;
  securityClassification?: SecurityClassification;
  meetingMode?: MeetingMode;
  asyncWindowStart?: string;
  asyncWindowEnd?: string;
  temporalContext?: TemporalContext;
  workingLanguage?: string;
  budget?: MeetingBudgetInput;
};

// A meeting is created with its budget in the same call. The governor is not
// opt-in: a room with no ceiling is a room that can run until something else
// breaks, so there is no code path that produces one.
export function convene(state: CivilizationState, actor: ActorContext, input: ConveneInput): Meeting {
  requireSupervisor(state, actor);
  assertUniverseOperable(requireUniverse(state, actor.universeId));

  if (input.meetingMode === 'asynchronous') {
    if (!input.asyncWindowStart || !input.asyncWindowEnd) {
      refuse('meeting_async_window_invalid', 'an asynchronous meeting must declare its window');
    }
    if (Date.parse(input.asyncWindowEnd) <= Date.parse(input.asyncWindowStart)) {
      refuse('meeting_async_window_invalid', 'the window must end after it starts');
    }
  }

  const meeting = openMeeting(state, actor, {
    title: input.title,
    agenda: input.agenda,
    taskForceId: input.taskForceId ?? null,
    securityClassification: input.securityClassification,
    requiresHumanDecision: true,
    triggerKind: input.triggerKind ?? 'human_request',
    triggerDetail: input.triggerDetail ?? null,
    meetingMode: input.meetingMode ?? 'interactive',
    asyncWindowStart: input.asyncWindowStart ?? null,
    asyncWindowEnd: input.asyncWindowEnd ?? null,
    temporalContext: input.temporalContext ?? null,
    workingLanguage: input.workingLanguage ?? 'en',
  });

  setMeetingBudget(state, actor, { meetingId: meeting.id, ...(input.budget ?? {}) });

  return meeting;
}

export function advanceStage(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; stage: MeetingLifecycleStage; note?: string },
): Meeting {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  if (stageIndex(input.stage) < stageIndex(meeting.lifecycleStage)) {
    refuse('meeting_lifecycle_regression', `${meeting.lifecycleStage} -> ${input.stage}`);
  }

  meeting.lifecycleStage = input.stage;
  meeting.status = deriveStatus(meeting);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'meeting_stage_advanced',
    actorUserId: actor.userId,
    decision: input.stage,
    detail: { meetingId: meeting.id, note: input.note ?? null },
  });

  return meeting;
}

// status is derived rather than independently set, so the coarse state a client
// reads can never contradict the lifecycle stage. This mirrors the SQL trigger.
function deriveStatus(meeting: Meeting): Meeting['status'] {
  if (meeting.archivedAt) return 'archived';
  switch (meeting.lifecycleStage) {
    case 'knowledge_lineage':
      return 'archived';
    case 'decision':
    case 'authorized_action':
    case 'outcome':
    case 'post_meeting_evaluation':
      return meeting.decision ? 'decided' : 'awaiting_human';
    case 'human_checkpoint':
      return 'awaiting_human';
    case 'evidence_collected':
    case 'specialist_analysis':
    case 'debate':
    case 'contradiction_detection':
    case 'alternatives_generated':
    case 'risk_analysis':
    case 'consensus_or_disagreement':
      return 'deliberating';
    case 'trigger':
      return 'scheduled';
    default:
      return 'open';
  }
}

// ---------------------------------------------------------------------------
// Seating
// ---------------------------------------------------------------------------

export type SeatInput = {
  meetingId: string;
  participantKind: 'agent' | 'human';
  agentId?: string;
  userId?: string;
  participantRole?: MeetingParticipantRole;
  xarpRoles?: readonly XarpRole[];
  operatorUserId?: string;
  speakingLanguage?: string;
};

export function seat(state: CivilizationState, actor: ActorContext, input: SeatInput): MeetingParticipant {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  const budget = meetingBudget(state, meeting.id);

  if (input.participantKind === 'agent') {
    if (!input.agentId) refuse('meeting_participant_unknown', 'an agent seat needs an agent id');
    requireActiveAgent(state, actor.universeId, input.agentId);
    assertAgentControllable(state, input.agentId);

    // A meeting cannot grow itself past the headcount it was authorised to hold.
    // This is where "a meeting cannot create infinite subagents" is enforced for
    // the population that actually consumes compute.
    const seated = state.meetingParticipants.filter(
      (item) => item.meetingId === meeting.id && item.participantKind === 'agent' && !item.leftAt,
    ).length;
    const alreadyHere = state.meetingParticipants.some(
      (item) => item.meetingId === meeting.id && item.agentId === input.agentId && !item.leftAt,
    );
    if (!alreadyHere && seated + 1 > budget.maxParticipantAgents) {
      refuse('meeting_budget_exhausted', `participant_agents ${seated + 1} > ${budget.maxParticipantAgents}`);
    }
  }

  return joinMeeting(state, actor, {
    meetingId: meeting.id,
    participantKind: input.participantKind,
    agentId: input.agentId ?? null,
    userId: input.userId ?? null,
    participantRole: input.participantRole,
    xarpRoles: input.xarpRoles,
    operatorUserId: input.operatorUserId,
    speakingLanguage: input.speakingLanguage,
  });
}

export function participantsOf(state: CivilizationState, meetingId: string): MeetingParticipant[] {
  return state.meetingParticipants.filter((item) => item.meetingId === meetingId);
}

function participantForAgent(state: CivilizationState, meetingId: string, agentId: string) {
  return state.meetingParticipants.find(
    (item) => item.meetingId === meetingId && item.agentId === agentId && !item.leftAt,
  );
}

function participantForUser(state: CivilizationState, meetingId: string, userId: string) {
  return state.meetingParticipants.find(
    (item) => item.meetingId === meetingId && item.userId === userId && !item.leftAt,
  );
}

// Every agent-authored contribution passes through here. It is the single place
// that checks the agent is running, is seated, is being relayed by its own
// operator, and is speaking in a role it actually holds.
function authorizeAgentAuthor(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; agentId: string; operatorUserId?: string | null; xarpRole?: XarpRole | null },
) {
  assertAgentControllable(state, input.agentId);
  const participant = participantForAgent(state, input.meetingId, input.agentId);
  assertSpeakingGrant({
    participant,
    callerUserId: actor.userId,
    claimedOperatorUserId: input.operatorUserId,
  });
  assertHoldsRole(participant as MeetingParticipant, input.xarpRole);
  return participant as MeetingParticipant;
}

function authorizeHumanAuthor(state: CivilizationState, actor: ActorContext, meetingId: string, userId: string) {
  if (userId !== actor.userId) {
    refuse('xarp_agent_impersonation_blocked', 'a human speaks only as themselves');
  }
  const participant = participantForUser(state, meetingId, userId);
  if (!participant) refuse('meeting_participant_unknown', userId);
  return participant;
}

function assertOpenForContribution(state: CivilizationState, meeting: Meeting) {
  if (meeting.status === 'archived' || meeting.closedAt) refuse('meeting_closed', meeting.id);
  const budget = meetingBudget(state, meeting.id);
  if (budget.exhausted) {
    refuse('meeting_budget_exhausted', `${meeting.id}:${budget.exhaustedDimension ?? 'unknown'}`);
  }
  if (meeting.meetingMode === 'asynchronous' && meeting.asyncWindowEnd) {
    const nowMs = Date.parse(now(state));
    if (nowMs > Date.parse(meeting.asyncWindowEnd)) {
      refuse('meeting_async_window_closed', meeting.id);
    }
  }
  return budget;
}

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

export type SpeakInput = {
  meetingId: string;
  agentId?: string;
  userId?: string;
  operatorUserId?: string;
  xarpRole?: XarpRole;
  messageKind?: MeetingMessageKind;
  originalLanguage?: string;
  originalText: string;
  translatedText?: string;
  translationLanguage?: string;
  interpretation?: string;
  translationProvenance?: Record<string, unknown>;
  // Culture is context, never identity. These stay in separate columns so a
  // reader can always tell "this is how the message will land in Osaka" apart
  // from "the line was down for six hours".
  culturalContext?: string;
  factualClaim?: string;
  tokens?: number;
};

export function speak(state: CivilizationState, actor: ActorContext, input: SpeakInput): MeetingMessage {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  assertOpenForContribution(state, meeting);

  const speakerKind = input.agentId ? 'agent' : 'human';
  if (speakerKind === 'agent') {
    authorizeAgentAuthor(state, actor, {
      meetingId: meeting.id,
      agentId: input.agentId as string,
      operatorUserId: input.operatorUserId,
      xarpRole: input.xarpRole,
    });
  } else {
    authorizeHumanAuthor(state, actor, meeting.id, input.userId ?? actor.userId);
  }

  if (input.translatedText && !input.translationLanguage) {
    refuse('evidence_contract_incomplete', 'a translation must name its target language');
  }

  const charge = chargeMeeting(state, {
    meetingId: meeting.id,
    actorUserId: actor.userId,
    charge: { messages: 1, tokens: input.tokens ?? 0 },
  });
  if (charge.exhausted) {
    // Terminating safely means landing in the human checkpoint with the reason
    // recorded, not stopping mid-sentence and leaving the room in limbo.
    terminateForBudget(state, actor, meeting, charge.dimension ?? 'messages');
    refuse('meeting_budget_exhausted', `${meeting.id}:${charge.dimension}`);
  }

  const sequence = state.meetingMessages.filter((item) => item.meetingId === meeting.id).length + 1;

  const message: MeetingMessage = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    sequence,
    speakerKind,
    speakerAgentId: speakerKind === 'agent' ? (input.agentId as string) : null,
    speakerUserId: speakerKind === 'human' ? (input.userId ?? actor.userId) : null,
    operatorUserId: speakerKind === 'agent' ? (input.operatorUserId ?? actor.userId) : null,
    xarpRole: input.xarpRole ?? null,
    messageKind: input.messageKind ?? (speakerKind === 'human' ? 'human_context' : 'statement'),
    originalLanguage: input.originalLanguage ?? meeting.workingLanguage,
    originalText: input.originalText,
    translatedText: input.translatedText ?? null,
    translationLanguage: input.translationLanguage ?? null,
    interpretation: input.interpretation ?? null,
    translationProvenance: input.translationProvenance ?? {},
    culturalContext: input.culturalContext ?? null,
    factualClaim: input.factualClaim ?? null,
    xacpMessageId: null,
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    provenance: { authoredBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    createdAt: now(state),
  };
  state.meetingMessages.push(message);

  // A message is content. It cannot change who is in the room, what anyone may
  // do, or what the budget is — those all live behind separate authenticated
  // calls. Detection exists so the attempt is visible, not so it is stopped:
  // it was already inert.
  const scan = guardianObserver.scanForInjection(
    [input.originalText, input.translatedText, input.interpretation].filter(Boolean).join(' '),
  );
  if (scan.suspected) {
    guardianObserver.recordInjectionAttempt(state, actor, {
      meetingId: meeting.id,
      messageId: message.id,
      subjectAgentId: message.speakerAgentId,
      markers: scan.markers,
      excerpt: input.originalText,
    });
  }

  return message;
}

function terminateForBudget(
  state: CivilizationState,
  actor: ActorContext,
  meeting: Meeting,
  dimension: string,
) {
  if (stageIndex(meeting.lifecycleStage) < stageIndex('human_checkpoint')) {
    meeting.lifecycleStage = 'human_checkpoint';
  }
  meeting.humanDecisionRequired = true;
  meeting.status = deriveStatus(meeting);
  meeting.unresolvedDisagreements = [
    ...meeting.unresolvedDisagreements,
    `Deliberation stopped at the ${dimension} ceiling before the room reached a position.`,
  ];
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export type EvidenceInput = {
  meetingId: string;
  agentId?: string;
  userId?: string;
  operatorUserId?: string;
  xarpRole?: XarpRole;
  subject: string;
  dimension: string;
  direction?: EvidenceDirection;
  claim: string;
  evidence: string;
  source: string;
  provenance: Record<string, unknown>;
  evidenceDate?: string;
  confidence: number;
  assumptions?: readonly string[];
  counterargument: string;
  risk: string;
  unknowns?: readonly string[];
  recommendation?: string;
  claimKind: MeetingEvidence['claimKind'];
  knowledgeSourceId?: string | null;
};

// Evidence before consensus. Every field the story names is required, and the
// reason they are required rather than encouraged is that an agent which cannot
// state its counterargument, its risk and its unknowns has not finished
// reasoning — it has finished writing.
export function submitEvidence(
  state: CivilizationState,
  actor: ActorContext,
  input: EvidenceInput,
): MeetingEvidence {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  assertOpenForContribution(state, meeting);

  if (input.agentId) {
    authorizeAgentAuthor(state, actor, {
      meetingId: meeting.id,
      agentId: input.agentId,
      operatorUserId: input.operatorUserId,
      xarpRole: input.xarpRole,
    });
  } else {
    authorizeHumanAuthor(state, actor, meeting.id, input.userId ?? actor.userId);
  }

  assertContract(
    {
      subject: input.subject,
      dimension: input.dimension,
      claim: input.claim,
      evidence: input.evidence,
      source: input.source,
      counterargument: input.counterargument,
      risk: input.risk,
    },
    'evidence',
  );
  if (Object.keys(input.provenance ?? {}).length === 0) {
    refuse('evidence_contract_incomplete', 'evidence needs provenance');
  }
  if (input.confidence < 0 || input.confidence > 1) {
    refuse('evidence_contract_incomplete', 'confidence must sit between 0 and 1');
  }

  const charge = chargeMeeting(state, {
    meetingId: meeting.id,
    actorUserId: actor.userId,
    charge: { tool_calls: 1 },
  });
  if (charge.exhausted) {
    terminateForBudget(state, actor, meeting, charge.dimension ?? 'tool_calls');
    refuse('meeting_budget_exhausted', `${meeting.id}:${charge.dimension}`);
  }

  const record: MeetingEvidence = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    submittedByAgentId: input.agentId ?? null,
    submittedByUserId: input.agentId ? null : (input.userId ?? actor.userId),
    operatorUserId: input.agentId ? (input.operatorUserId ?? actor.userId) : null,
    xarpRole: input.xarpRole ?? null,
    subject: input.subject,
    dimension: input.dimension,
    direction: input.direction ?? 'neutral',
    claim: input.claim,
    evidence: input.evidence,
    source: input.source,
    provenance: input.provenance,
    evidenceDate: input.evidenceDate ?? null,
    confidence: input.confidence,
    assumptions: [...(input.assumptions ?? [])],
    counterargument: input.counterargument,
    risk: input.risk,
    unknowns: [...(input.unknowns ?? [])],
    recommendation: input.recommendation ?? null,
    claimKind: input.claimKind,
    knowledgeSourceId: input.knowledgeSourceId ?? null,
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    auditEventId: null,
    createdAt: now(state),
  };
  state.meetingEvidence.push(record);

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_evidence_submitted',
    actorUserId: actor.userId,
    actorAgentId: input.agentId ?? null,
    detail: {
      meetingId: meeting.id,
      subject: record.subject,
      dimension: record.dimension,
      direction: record.direction,
      claimKind: record.claimKind,
      source: record.source,
    },
  });
  record.auditEventId = event.id;

  return record;
}

export function evidenceFor(state: CivilizationState, meetingId: string): MeetingEvidence[] {
  return state.meetingEvidence.filter((item) => item.meetingId === meetingId);
}

// ---------------------------------------------------------------------------
// Proposals, objections and votes
// ---------------------------------------------------------------------------

export type ProposalInput = {
  meetingId: string;
  optionKey: string;
  title: string;
  agentId?: string;
  userId?: string;
  operatorUserId?: string;
  xarpRole?: XarpRole;
  claim: string;
  evidenceIds: readonly string[];
  source: string;
  provenance?: Record<string, unknown>;
  proposalDate?: string;
  confidence: number;
  assumptions?: readonly string[];
  counterargument: string;
  risk: string;
  unknowns?: readonly string[];
  recommendation: string;
};

export function proposeOption(
  state: CivilizationState,
  actor: ActorContext,
  input: ProposalInput,
): MeetingProposal {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  assertOpenForContribution(state, meeting);

  if (input.agentId) {
    authorizeAgentAuthor(state, actor, {
      meetingId: meeting.id,
      agentId: input.agentId,
      operatorUserId: input.operatorUserId,
      xarpRole: input.xarpRole,
    });
  } else {
    authorizeHumanAuthor(state, actor, meeting.id, input.userId ?? actor.userId);
  }

  // A proposal with no cited evidence is an opinion wearing a proposal's clothes.
  if (input.evidenceIds.length === 0) {
    refuse('proposal_requires_evidence', input.optionKey);
  }
  for (const evidenceId of input.evidenceIds) {
    const found = state.meetingEvidence.find((item) => item.id === evidenceId);
    if (!found || found.meetingId !== meeting.id) refuse('evidence_unknown', evidenceId);
  }

  assertContract(
    {
      claim: input.claim,
      source: input.source,
      counterargument: input.counterargument,
      risk: input.risk,
      recommendation: input.recommendation,
    },
    'proposal',
  );

  const duplicate = state.meetingProposals.find(
    (item) => item.meetingId === meeting.id && item.optionKey === input.optionKey,
  );
  if (duplicate) refuse('proposal_requires_evidence', `option ${input.optionKey} already exists`);

  const proposal: MeetingProposal = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    optionKey: input.optionKey,
    title: input.title,
    proposedByAgentId: input.agentId ?? null,
    proposedByUserId: input.agentId ? null : (input.userId ?? actor.userId),
    operatorUserId: input.agentId ? (input.operatorUserId ?? actor.userId) : null,
    xarpRole: input.xarpRole ?? null,
    claim: input.claim,
    evidenceIds: [...input.evidenceIds],
    source: input.source,
    provenance: input.provenance ?? { derivedFrom: meeting.id },
    proposalDate: input.proposalDate ?? null,
    confidence: input.confidence,
    assumptions: [...(input.assumptions ?? [])],
    counterargument: input.counterargument,
    risk: input.risk,
    unknowns: [...(input.unknowns ?? [])],
    recommendation: input.recommendation,
    status: 'open',
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    auditEventId: null,
    createdAt: now(state),
  };
  state.meetingProposals.push(proposal);

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_proposal_recorded',
    actorUserId: actor.userId,
    actorAgentId: input.agentId ?? null,
    decision: proposal.optionKey,
    detail: { meetingId: meeting.id, title: proposal.title, evidenceCount: proposal.evidenceIds.length },
  });
  proposal.auditEventId = event.id;

  return proposal;
}

export function raiseObjection(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    meetingId: string;
    proposalId?: string | null;
    agentId?: string;
    userId?: string;
    operatorUserId?: string;
    xarpRole?: XarpRole;
    objection: string;
    severity?: ObjectionSeverity;
    supportingEvidenceId?: string | null;
  },
): MeetingObjection {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  assertOpenForContribution(state, meeting);

  if (input.agentId) {
    authorizeAgentAuthor(state, actor, {
      meetingId: meeting.id,
      agentId: input.agentId,
      operatorUserId: input.operatorUserId,
      xarpRole: input.xarpRole,
    });
  } else {
    authorizeHumanAuthor(state, actor, meeting.id, input.userId ?? actor.userId);
  }

  if (!input.objection.trim()) refuse('evidence_contract_incomplete', 'an objection needs a statement');

  const objection: MeetingObjection = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    proposalId: input.proposalId ?? null,
    raisedByAgentId: input.agentId ?? null,
    raisedByUserId: input.agentId ? null : (input.userId ?? actor.userId),
    operatorUserId: input.agentId ? (input.operatorUserId ?? actor.userId) : null,
    xarpRole: input.xarpRole ?? null,
    objection: input.objection,
    severity: input.severity ?? 'material',
    supportingEvidenceId: input.supportingEvidenceId ?? null,
    resolutionKind: 'unresolved',
    resolution: null,
    resolvedByUserId: null,
    resolvedAt: null,
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    provenance: { raisedBy: actor.userId },
    auditEventId: null,
    createdAt: now(state),
  };
  state.meetingObjections.push(objection);

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_objection_raised',
    actorUserId: actor.userId,
    actorAgentId: input.agentId ?? null,
    decision: objection.severity,
    detail: { meetingId: meeting.id, objection: objection.objection, proposalId: objection.proposalId },
  });
  objection.auditEventId = event.id;

  return objection;
}

// Only a person closes an objection, and closing it means saying how. Agents may
// argue against each other indefinitely; they cannot declare the argument over.
export function resolveObjection(
  state: CivilizationState,
  actor: ActorContext,
  input: { objectionId: string; resolutionKind: Exclude<ObjectionResolutionKind, 'unresolved'>; resolution: string },
): MeetingObjection {
  requireMember(state, actor);
  const objection = state.meetingObjections.find((item) => item.id === input.objectionId);
  if (!objection) refuse('objection_unknown', input.objectionId);
  if (objection.universeId !== actor.universeId) refuse('tenancy_cross_universe_blocked', input.objectionId);

  const human = participantForUser(state, objection.meetingId, actor.userId);
  if (!human || human.participantKind !== 'human') {
    refuse('objection_requires_human_resolution', actor.userId);
  }
  if (!input.resolution.trim()) {
    refuse('objection_requires_human_resolution', 'a resolution needs to say how');
  }

  objection.resolutionKind = input.resolutionKind;
  objection.resolution = input.resolution;
  objection.resolvedByUserId = actor.userId;
  objection.resolvedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: objection.universeId,
    eventKind: 'meeting_objection_resolved',
    actorUserId: actor.userId,
    decision: input.resolutionKind,
    detail: { objectionId: objection.id, meetingId: objection.meetingId, resolution: input.resolution },
  });

  return objection;
}

export type VoteInput = {
  meetingId: string;
  proposalId: string;
  agentId?: string;
  userId?: string;
  operatorUserId?: string;
  xarpRole?: XarpRole;
  vote: ProposalVote;
  rationale: string;
  citedEvidenceIds?: readonly string[];
  confidence?: number;
};

// Evidence before consensus, again, at the point it matters most. A support or
// oppose vote has to point at the evidence the voter read. Agreement cannot
// spread through the room on the strength of a persuasive sentence from another
// model, because a vote with no citation is not a vote.
export function castVote(state: CivilizationState, actor: ActorContext, input: VoteInput): MeetingProposalVote {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  assertOpenForContribution(state, meeting);

  const proposal = state.meetingProposals.find((item) => item.id === input.proposalId);
  if (!proposal || proposal.meetingId !== meeting.id) refuse('proposal_unknown', input.proposalId);

  const voterKind = input.agentId ? 'agent' : 'human';
  if (voterKind === 'agent') {
    authorizeAgentAuthor(state, actor, {
      meetingId: meeting.id,
      agentId: input.agentId as string,
      operatorUserId: input.operatorUserId,
      xarpRole: input.xarpRole,
    });
  } else {
    authorizeHumanAuthor(state, actor, meeting.id, input.userId ?? actor.userId);
  }

  const cited = [...(input.citedEvidenceIds ?? [])];
  if ((input.vote === 'support' || input.vote === 'oppose') && cited.length === 0) {
    refuse('vote_requires_cited_evidence', `${input.vote} on ${proposal.optionKey}`);
  }
  for (const evidenceId of cited) {
    const found = state.meetingEvidence.find((item) => item.id === evidenceId);
    if (!found) refuse('evidence_unknown', evidenceId);
    if (found.meetingId !== meeting.id) refuse('vote_cites_foreign_evidence', evidenceId);
  }
  if (!input.rationale.trim()) refuse('vote_requires_cited_evidence', 'a vote needs a rationale');

  const existing = state.meetingVotes.find(
    (item) =>
      item.proposalId === proposal.id &&
      ((input.agentId && item.voterAgentId === input.agentId) ||
        (!input.agentId && item.voterUserId === (input.userId ?? actor.userId))),
  );
  if (existing) {
    existing.vote = input.vote;
    existing.rationale = input.rationale;
    existing.citedEvidenceIds = cited;
    existing.confidence = input.confidence ?? existing.confidence;
    return existing;
  }

  const vote: MeetingProposalVote = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    proposalId: proposal.id,
    voterKind,
    voterAgentId: input.agentId ?? null,
    voterUserId: voterKind === 'human' ? (input.userId ?? actor.userId) : null,
    operatorUserId: voterKind === 'agent' ? (input.operatorUserId ?? actor.userId) : null,
    xarpRole: input.xarpRole ?? null,
    vote: input.vote,
    rationale: input.rationale,
    citedEvidenceIds: cited,
    confidence: input.confidence ?? null,
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    provenance: { castBy: actor.userId },
    auditEventId: null,
    createdAt: now(state),
  };
  state.meetingVotes.push(vote);

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_proposal_vote',
    actorUserId: actor.userId,
    actorAgentId: input.agentId ?? null,
    decision: input.vote,
    detail: {
      meetingId: meeting.id,
      proposalId: proposal.id,
      citedEvidence: cited.length,
      rationale: input.rationale,
    },
  });
  vote.auditEventId = event.id;

  return vote;
}

// ---------------------------------------------------------------------------
// Contradiction detection
// ---------------------------------------------------------------------------

// Two agents disagreeing about the same thing is a contradiction. Two agents
// preferring different suppliers on different grounds is a trade-off, and
// flattening the second into the first is how a room manufactures false
// certainty. Only same-subject, same-dimension, opposing-direction evidence
// counts here.
export function detectContradictions(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): EvidenceContradiction[] {
  requireMember(state, actor);
  requireMeeting(state, actor.universeId, meetingId);

  const grouped = new Map<string, MeetingEvidence[]>();
  for (const item of evidenceFor(state, meetingId)) {
    const key = `${item.subject}::${item.dimension}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  const contradictions: EvidenceContradiction[] = [];
  for (const [key, items] of grouped) {
    const favourable = items.filter((item) => item.direction === 'favourable');
    const unfavourable = items.filter((item) => item.direction === 'unfavourable');
    if (favourable.length === 0 || unfavourable.length === 0) continue;

    const [subject, dimension] = key.split('::');
    const total = favourable.length + unfavourable.length;
    const majority = Math.max(favourable.length, unfavourable.length);
    contradictions.push({
      subject,
      dimension,
      favourable: favourable.map((item) => item.id),
      unfavourable: unfavourable.map((item) => item.id),
      // How far the room is from unanimous on this point. 0.5 is a dead split.
      consensusLevel: Number((majority / total).toFixed(4)),
    });
  }

  return contradictions.sort((a, b) => `${a.subject}${a.dimension}`.localeCompare(`${b.subject}${b.dimension}`));
}

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

export type SynthesizeInput = {
  meetingId: string;
  synthesizerAgentId?: string;
  operatorUserId?: string;
  requiredRoles?: readonly XarpRole[];
};

// The synthesizer's job is to produce one recommendation without deleting the
// reasons the room did not agree. Everything that made the room hesitate travels
// with the answer: the alternatives, the unreconciled positions, the
// contradictions and the roles nobody filled.
export function synthesize(
  state: CivilizationState,
  actor: ActorContext,
  input: SynthesizeInput,
): MeetingSynthesis {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  if (input.synthesizerAgentId) {
    authorizeAgentAuthor(state, actor, {
      meetingId: meeting.id,
      agentId: input.synthesizerAgentId,
      operatorUserId: input.operatorUserId,
      xarpRole: 'synthesizer',
    });
  }

  const participants = participantsOf(state, meeting.id);
  const coverage = assertSynthesisRoleCoverage(participants, input.requiredRoles ?? []);

  const proposals = state.meetingProposals.filter(
    (item) => item.meetingId === meeting.id && item.status !== 'withdrawn',
  );
  const evidence = evidenceFor(state, meeting.id);
  const objections = state.meetingObjections.filter((item) => item.meetingId === meeting.id);
  const votes = state.meetingVotes.filter((item) => item.meetingId === meeting.id);
  const contradictions = detectContradictions(state, actor, meeting.id);

  const assessment = assessEvidence(
    evidence.map((item) =>
      evidenceRef({
        label: item.claim,
        claimKind: item.claimKind,
        confidence: item.confidence,
        knowledgeSourceId: item.knowledgeSourceId,
      }),
    ),
  );

  const alternatives: MeetingAlternative[] = proposals
    .map((proposal) => {
      const support = votes.filter((vote) => vote.proposalId === proposal.id && vote.vote === 'support').length;
      const oppose = votes.filter((vote) => vote.proposalId === proposal.id && vote.vote === 'oppose').length;
      const blocking = objections.filter(
        (item) => item.proposalId === proposal.id && item.severity === 'blocking' && item.resolutionKind === 'unresolved',
      ).length;

      // A blocking objection costs a proposal more than an ordinary oppose vote,
      // because it is a claim that the option cannot proceed at all.
      const penalty = oppose * 0.05 + blocking * 0.15;
      const bonus = support * 0.02;
      const confidence = clamp(proposal.confidence + bonus - penalty);

      return {
        optionKey: proposal.optionKey,
        title: proposal.title,
        headline: leadingDimension(evidence, proposal.evidenceIds) ?? proposal.recommendation,
        confidence,
        supportingEvidenceIds: [...proposal.evidenceIds],
      };
    })
    .sort((a, b) => b.confidence - a.confidence || a.optionKey.localeCompare(b.optionKey));

  const leader = alternatives[0] ?? null;

  // The recommendation is only as strong as the evidence under it, so the
  // proposal's own confidence is capped by the weighted evidence assessment.
  const confidence = leader ? clamp(Math.min(leader.confidence, assessment.weightedConfidence)) : 0;

  const preservedDisagreements: PreservedDisagreement[] = objections
    .filter((item) => item.resolutionKind === 'unresolved' || item.resolutionKind === 'deferred_to_human')
    .map((item) => ({
      source: describeAuthor(state, item.raisedByAgentId, item.raisedByUserId),
      position: item.objection,
      severity: item.severity,
      resolutionKind: item.resolutionKind,
    }));

  const insufficientVotes = votes.filter((item) => item.vote === 'insufficient_evidence');
  const highStakes = highStakesProfessions(state, meeting.id);

  const reasons: string[] = [];
  if (meeting.requiresHumanDecision) reasons.push('The room was convened as human-decision-required.');
  for (const disagreement of preservedDisagreements) {
    if (disagreement.severity === 'blocking') {
      reasons.push(`A blocking objection is unresolved: ${disagreement.position}`);
    }
  }
  if (insufficientVotes.length > 0) {
    reasons.push(`${insufficientVotes.length} participant(s) voted insufficient_evidence.`);
  }
  if (!assessment.sufficient) reasons.push(assessment.statement);
  for (const contradiction of contradictions) {
    reasons.push(
      `Sources disagree on ${contradiction.subject}/${contradiction.dimension} at ${contradiction.consensusLevel} consensus.`,
    );
  }
  for (const profession of highStakes) {
    reasons.push(`${profession} is a high-stakes profession and carries mandatory human oversight.`);
  }
  if (!leader) reasons.push('No option was put to the room.');

  const humanDecisionRequired = reasons.length > 0;

  const synthesis: MeetingSynthesis = {
    alternatives,
    recommendedOptionKey: leader?.optionKey ?? null,
    recommendation: leader
      ? `${leader.title}. ${proposals.find((item) => item.optionKey === leader.optionKey)?.recommendation ?? ''}`.trim()
      : HUMAN_JUDGMENT_REQUIRED,
    confidence,
    preservedDisagreements,
    contradictions,
    humanDecisionRequired,
    reasons,
    rolesPresent: coverage.present,
    rolesMissing: coverage.missing,
  };

  meeting.synthesis = synthesis;
  meeting.recommendationConfidence = confidence;
  meeting.humanDecisionRequired = humanDecisionRequired;
  meeting.unresolvedDisagreements = preservedDisagreements.map((item) => item.position);

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_synthesized',
    actorUserId: actor.userId,
    actorAgentId: input.synthesizerAgentId ?? null,
    decision: synthesis.recommendedOptionKey,
    detail: {
      meetingId: meeting.id,
      confidence,
      humanDecisionRequired,
      alternatives: alternatives.length,
      preservedDisagreements: preservedDisagreements.length,
      contradictions: contradictions.length,
    },
  });

  return synthesis;
}

function leadingDimension(evidence: readonly MeetingEvidence[], evidenceIds: readonly string[]) {
  const cited = evidence.filter((item) => evidenceIds.includes(item.id));
  const favourable = cited.find((item) => item.direction === 'favourable');
  return favourable ? `${favourable.dimension}: ${favourable.claim}` : cited[0]?.claim;
}

function highStakesProfessions(state: CivilizationState, meetingId: string): string[] {
  const professions = new Set<string>();
  for (const participant of participantsOf(state, meetingId)) {
    if (!participant.agentId) continue;
    const agent = state.agents.find((item) => item.id === participant.agentId);
    if (!agent) continue;
    const oversight = oversightForProfession(state, participant.universeId, agent.profession);
    if (oversight === 'high_stakes') professions.add(agent.profession);
  }
  return [...professions].sort();
}

function describeAuthor(state: CivilizationState, agentId: string | null, userId: string | null) {
  if (agentId) {
    return state.agents.find((item) => item.id === agentId)?.agentKey ?? agentId;
  }
  return userId ?? 'unknown';
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, Number(value.toFixed(4))));
}

function assertContract(fields: Record<string, string>, label: string) {
  const missing = Object.entries(fields)
    .filter(([, value]) => !value || !value.trim())
    .map(([key]) => key);
  if (missing.length > 0) {
    refuse('evidence_contract_incomplete', `${label} is missing ${missing.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// Human checkpoint and decision
// ---------------------------------------------------------------------------

export function escalate(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; reason: string },
): Meeting {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  if (stageIndex(meeting.lifecycleStage) < stageIndex('human_checkpoint')) {
    meeting.lifecycleStage = 'human_checkpoint';
  }
  meeting.humanDecisionRequired = true;
  meeting.status = deriveStatus(meeting);

  recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_escalated_to_human',
    actorUserId: actor.userId,
    decision: 'awaiting_human',
    detail: { meetingId: meeting.id, reason: input.reason },
  });

  return meeting;
}

export type DecisionInput = {
  meetingId: string;
  decisionKind: DecisionKind;
  selectedProposalId?: string | null;
  rationale: string;
  humanKnowledgeRecordId?: string | null;
};

// The human checkpoint. A decision is a first-person act: the caller signs it,
// the caller must be a human participant in that room, and the machine
// recommendation is stored beside the decision rather than as the decision.
export function decide(
  state: CivilizationState,
  actor: ActorContext,
  input: DecisionInput,
): MeetingDecisionRecord {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  const human = participantForUser(state, meeting.id, actor.userId);
  if (!human || human.participantKind !== 'human') {
    refuse('decision_requires_human_participant', actor.userId);
  }
  if (!input.rationale.trim()) {
    refuse('decision_requires_human_participant', 'a decision needs a rationale');
  }
  if (input.decisionKind === 'approved' && !input.selectedProposalId) {
    refuse('decision_requires_selected_proposal', 'approving means choosing which option');
  }
  if (input.selectedProposalId) {
    const proposal = state.meetingProposals.find((item) => item.id === input.selectedProposalId);
    if (!proposal || proposal.meetingId !== meeting.id) refuse('proposal_unknown', input.selectedProposalId);
  }

  const synthesis = meeting.synthesis;
  if (!synthesis) refuse('meeting_stage_not_reached', 'the room has not synthesized a recommendation');

  const decision: MeetingDecisionRecord = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    selectedProposalId: input.selectedProposalId ?? null,
    xivRecommendation: synthesis.recommendation,
    xivConfidence: synthesis.confidence,
    alternatives: synthesis.alternatives,
    preservedDisagreements: synthesis.preservedDisagreements,
    humanDecisionRequired: synthesis.humanDecisionRequired,
    decisionKind: input.decisionKind,
    decidedByUserId: actor.userId,
    rationale: input.rationale,
    humanKnowledgeRecordId: input.humanKnowledgeRecordId ?? null,
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    provenance: { decidedBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    decidedAt: now(state),
  };
  state.meetingDecisions.push(decision);

  for (const proposal of state.meetingProposals.filter((item) => item.meetingId === meeting.id)) {
    if (proposal.id === decision.selectedProposalId) proposal.status = 'selected';
    else if (decision.decisionKind === 'approved') proposal.status = 'rejected';
  }

  meeting.decision = `${input.decisionKind}: ${synthesis.recommendation}`;
  meeting.decisionBy = actor.userId;
  meeting.decidedAt = decision.decidedAt;
  if (stageIndex(meeting.lifecycleStage) < stageIndex('decision')) meeting.lifecycleStage = 'decision';
  meeting.status = deriveStatus(meeting);

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_decided',
    actorUserId: actor.userId,
    decision: input.decisionKind,
    detail: {
      meetingId: meeting.id,
      selectedProposalId: decision.selectedProposalId,
      xivConfidence: decision.xivConfidence,
      // The disagreement travels into the audit record too, so a later reader
      // sees what the room did not settle rather than only what was chosen.
      preservedDisagreements: decision.preservedDisagreements.map((item) => item.position),
      rationale: input.rationale,
    },
  });
  decision.auditEventId = event.id;

  return decision;
}

// ---------------------------------------------------------------------------
// Authorized action
// ---------------------------------------------------------------------------

export function queueAction(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    meetingId: string;
    decisionId: string;
    action: string;
    authorizationBasis: string;
    assignedAgentId?: string | null;
    requiresHumanApproval?: boolean;
    rollbackPlan?: string | null;
    taskId?: string | null;
  },
): MeetingAction {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);
  const decision = state.meetingDecisions.find((item) => item.id === input.decisionId);
  if (!decision || decision.meetingId !== meeting.id) refuse('decision_unknown', input.decisionId);

  if (input.assignedAgentId) assertAgentControllable(state, input.assignedAgentId);

  // Work produced while everyone was asleep always waits for a person. An
  // asynchronous room may investigate, compare and recommend; it may not decide
  // that something is uncontroversial enough to run unattended.
  const requiresHumanApproval =
    meeting.meetingMode === 'asynchronous' ? true : (input.requiresHumanApproval ?? true);

  const record: MeetingAction = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    decisionId: decision.id,
    taskId: input.taskId ?? null,
    assignedAgentId: input.assignedAgentId ?? null,
    action: input.action,
    authorizationBasis: input.authorizationBasis,
    requiresHumanApproval,
    approvedBy: null,
    approvedAt: null,
    rollbackPlan: input.rollbackPlan ?? null,
    status: 'queued',
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    provenance: { queuedBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    createdAt: now(state),
    executedAt: null,
    revokedAt: null,
  };
  state.meetingActions.push(record);

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_action_queued',
    actorUserId: actor.userId,
    subjectAgentId: record.assignedAgentId,
    detail: { meetingId: meeting.id, action: record.action, requiresHumanApproval: record.requiresHumanApproval },
  });
  record.auditEventId = event.id;

  return record;
}

export function authorizeAction(
  state: CivilizationState,
  actor: ActorContext,
  input: { actionId: string; rollbackPlan?: string },
): MeetingAction {
  requireSupervisor(state, actor);
  const action = requireAction(state, actor.universeId, input.actionId);

  if (action.status === 'revoked') refuse('action_revoked', action.id);
  if (input.rollbackPlan) action.rollbackPlan = input.rollbackPlan;

  // Nothing consequential leaves a meeting without a way back. This is the same
  // rule 62A applies to approval-gated tasks, restated where meeting actions
  // enter the world.
  if (!action.rollbackPlan?.trim()) refuse('action_requires_rollback_plan', action.id);

  action.approvedBy = actor.userId;
  action.approvedAt = now(state);
  action.status = 'authorized';

  const meeting = requireMeeting(state, actor.universeId, action.meetingId);
  if (stageIndex(meeting.lifecycleStage) < stageIndex('authorized_action')) {
    meeting.lifecycleStage = 'authorized_action';
    meeting.status = deriveStatus(meeting);
  }

  recordGovernanceEvent(state, {
    universeId: action.universeId,
    eventKind: 'meeting_action_authorized',
    actorUserId: actor.userId,
    subjectAgentId: action.assignedAgentId,
    decision: 'authorized',
    detail: { actionId: action.id, meetingId: action.meetingId, action: action.action },
  });

  return action;
}

export function executeAction(
  state: CivilizationState,
  actor: ActorContext,
  input: { actionId: string; status?: Extract<MeetingActionStatus, 'completed' | 'failed'> },
): MeetingAction {
  requireMember(state, actor);
  const action = requireAction(state, actor.universeId, input.actionId);

  if (action.requiresHumanApproval && !action.approvedBy) {
    refuse('action_requires_approval', action.id);
  }
  if (action.status === 'revoked') refuse('action_revoked', action.id);
  if (action.assignedAgentId) assertAgentControllable(state, action.assignedAgentId);

  action.status = input.status ?? 'completed';
  action.executedAt = now(state);

  return action;
}

export function revokeAction(
  state: CivilizationState,
  actor: ActorContext,
  input: { actionId: string; reason: string },
): MeetingAction {
  requireSupervisor(state, actor);
  const action = requireAction(state, actor.universeId, input.actionId);

  action.status = 'revoked';
  action.revokedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: action.universeId,
    eventKind: 'meeting_action_revoked',
    actorUserId: actor.userId,
    subjectAgentId: action.assignedAgentId,
    decision: 'revoked',
    detail: { actionId: action.id, reason: input.reason },
  });

  return action;
}

export function requireAction(state: CivilizationState, universeId: string, actionId: string): MeetingAction {
  const action = state.meetingActions.find((item) => item.id === actionId);
  if (!action) refuse('action_unknown', actionId);
  if (action.universeId !== universeId) refuse('tenancy_cross_universe_blocked', actionId);
  return action;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

export function recordOutcome(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    meetingId: string;
    decisionId?: string | null;
    actionId?: string | null;
    horizonDays?: number;
    predicted: Record<string, number>;
    observed: Record<string, number>;
    outcomeGrade: OutcomeGrade;
    notes?: string;
  },
): MeetingOutcome {
  requireSupervisor(state, actor);
  const meeting = requireMeeting(state, actor.universeId, input.meetingId);

  if (Object.keys(input.observed).length === 0) {
    refuse('outcome_requires_measurement', 'an outcome needs at least one observed metric');
  }

  const decision = input.decisionId
    ? state.meetingDecisions.find((item) => item.id === input.decisionId)
    : state.meetingDecisions.find((item) => item.meetingId === meeting.id);

  const predictedConfidence = decision?.xivConfidence ?? null;
  const calibrationError = predictedConfidence === null ? null : calibration(predictedConfidence, input.outcomeGrade);

  const outcome: MeetingOutcome = {
    id: state.nextId(),
    universeId: meeting.universeId,
    organizationId: organizationOf(state, meeting.universeId),
    meetingId: meeting.id,
    decisionId: decision?.id ?? null,
    actionId: input.actionId ?? null,
    horizonDays: input.horizonDays ?? 30,
    predicted: { ...input.predicted },
    observed: { ...input.observed },
    metrics: deltas(input.predicted, input.observed),
    outcomeGrade: input.outcomeGrade,
    predictedConfidence,
    calibrationError,
    notes: input.notes ?? null,
    recordedByUserId: actor.userId,
    securityClassification: meeting.securityClassification,
    retentionPolicy: meeting.retentionPolicy,
    provenance: { recordedBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    measuredAt: now(state),
    createdAt: now(state),
  };
  state.meetingOutcomes.push(outcome);

  if (stageIndex(meeting.lifecycleStage) < stageIndex('outcome')) {
    meeting.lifecycleStage = 'outcome';
    meeting.status = deriveStatus(meeting);
  }

  const event = recordGovernanceEvent(state, {
    universeId: meeting.universeId,
    eventKind: 'meeting_outcome_recorded',
    actorUserId: actor.userId,
    decision: input.outcomeGrade,
    detail: {
      meetingId: meeting.id,
      decisionId: outcome.decisionId,
      horizonDays: outcome.horizonDays,
      calibrationError,
    },
  });
  outcome.auditEventId = event.id;

  return outcome;
}

// A Brier-style score against the grade the outcome actually earned. Confident
// and right costs nothing; confident and wrong costs the most.
function calibration(confidence: number, grade: OutcomeGrade) {
  const realised: Record<OutcomeGrade, number> = {
    successful: 1,
    partial: 0.5,
    unsuccessful: 0,
    inconclusive: 0.5,
  };
  return Number(Math.abs(confidence - realised[grade]).toFixed(4));
}

function deltas(predicted: Record<string, number>, observed: Record<string, number>) {
  const metrics: Record<string, number> = {};
  for (const [key, value] of Object.entries(predicted)) {
    if (typeof observed[key] === 'number') metrics[`${key}_delta`] = Number((observed[key] - value).toFixed(4));
  }
  return metrics;
}

// ---------------------------------------------------------------------------
// Meeting memory
// ---------------------------------------------------------------------------

export type MeetingMemory = {
  meeting: Meeting;
  problem: string;
  temporalContext: TemporalContext | null;
  participants: { who: string; kind: string; roles: XarpRole[] }[];
  evidence: MeetingEvidence[];
  arguments: MeetingMessage[];
  alternatives: MeetingAlternative[];
  contradictions: EvidenceContradiction[];
  objections: MeetingObjection[];
  votes: MeetingProposalVote[];
  decision: MeetingDecisionRecord | null;
  approval: { by: string; at: string } | null;
  actions: MeetingAction[];
  outcomes: MeetingOutcome[];
  guardianObservations: ReturnType<typeof guardianObserver.observationsForMeeting>;
};

// "Why did we make this decision?" answered from the record rather than from a
// summary someone wrote afterwards. Everything here is a stored row.
export function reconstruct(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): MeetingMemory {
  requireMember(state, actor);
  const meeting = requireMeeting(state, actor.universeId, meetingId);
  const decision = state.meetingDecisions.find((item) => item.meetingId === meeting.id) ?? null;

  return {
    meeting,
    problem: meeting.agenda.map((item) => `${item.title}: ${item.detail}`).join(' | ') || meeting.title,
    temporalContext: meeting.temporalContext,
    participants: participantsOf(state, meeting.id).map((participant) => ({
      who: describeAuthor(state, participant.agentId, participant.userId),
      kind: participant.participantKind,
      roles: participant.xarpRoles,
    })),
    evidence: evidenceFor(state, meeting.id),
    arguments: state.meetingMessages.filter((item) => item.meetingId === meeting.id),
    alternatives: meeting.synthesis?.alternatives ?? [],
    contradictions: meeting.synthesis?.contradictions ?? [],
    objections: state.meetingObjections.filter((item) => item.meetingId === meeting.id),
    votes: state.meetingVotes.filter((item) => item.meetingId === meeting.id),
    decision,
    approval: decision ? { by: decision.decidedByUserId, at: decision.decidedAt } : null,
    actions: state.meetingActions.filter((item) => item.meetingId === meeting.id),
    outcomes: state.meetingOutcomes.filter((item) => item.meetingId === meeting.id),
    guardianObservations: guardianObserver.observationsForMeeting(state, actor, meeting.id),
  };
}

export function transcript(state: CivilizationState, actor: ActorContext, meetingId: string): MeetingMessage[] {
  requireMember(state, actor);
  requireMeeting(state, actor.universeId, meetingId);
  return state.meetingMessages
    .filter((item) => item.meetingId === meetingId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function listDecisions(state: CivilizationState, actor: ActorContext): MeetingDecisionRecord[] {
  return visibleTo(state, actor, state.meetingDecisions);
}

export function listActions(state: CivilizationState, actor: ActorContext): MeetingAction[] {
  return visibleTo(state, actor, state.meetingActions);
}

export function listOutcomes(state: CivilizationState, actor: ActorContext): MeetingOutcome[] {
  return visibleTo(state, actor, state.meetingOutcomes);
}

export function roleCoverage(state: CivilizationState, actor: ActorContext, meetingId: string) {
  requireMember(state, actor);
  requireMeeting(state, actor.universeId, meetingId);
  return synthesisRoleCoverage(participantsOf(state, meetingId));
}
