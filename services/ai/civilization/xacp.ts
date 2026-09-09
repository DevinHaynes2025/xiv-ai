import { refuse } from './errors';
import { assertUniverseOperable } from './guardian';
import { assessEvidence } from './human-bridge';
import { isRelationshipAuthorized, requireActiveAgent } from './registry';
import {
  now,
  recordGovernanceEvent,
  requireMember,
  requireUniverse,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  SecurityClassification,
  XacpApprovalStatus,
  XacpEvidenceRef,
  XacpMessage,
  XacpPhase,
} from './types';

// discover -> request -> negotiate -> reason -> delegate -> collaborate -> verify -> report -> archive
// A conversation may skip phases but may never move backwards, so an audit read
// of a conversation is always in protocol order.
export const XACP_PHASES: readonly XacpPhase[] = [
  'discover',
  'request',
  'negotiate',
  'reason',
  'delegate',
  'collaborate',
  'verify',
  'report',
  'archive',
];

// Phases that assert something. They must carry evidence, and a decision has to
// come with a confidence value rather than a bare assertion.
const ASSERTING_PHASES = new Set<XacpPhase>(['reason', 'collaborate', 'verify', 'report']);

export type XacpSendInput = {
  conversationId: string;
  phase: XacpPhase;
  senderAgentId?: string | null;
  senderUserId?: string | null;
  receiverAgentId?: string | null;
  receiverUserId?: string | null;
  purpose: string;
  reasoningArtifact: string;
  evidence?: readonly XacpEvidenceRef[];
  decision?: string | null;
  confidence?: number | null;
  approvalStatus?: XacpApprovalStatus;
  approvedBy?: string | null;
  result?: string | null;
  securityClassification?: SecurityClassification;
};

export function sendXacpMessage(
  state: CivilizationState,
  actor: ActorContext,
  input: XacpSendInput,
): XacpMessage {
  requireMember(state, actor);
  assertUniverseOperable(requireUniverse(state, actor.universeId));

  const purpose = input.purpose.trim();
  const reasoningArtifact = input.reasoningArtifact.trim();
  if (!purpose || !reasoningArtifact) {
    refuse('xacp_incomplete_provenance', 'purpose and reasoning artifact are both required');
  }
  if (!input.senderAgentId && !input.senderUserId) {
    refuse('xacp_participant_unknown', 'a message needs an attributable sender');
  }
  if (!input.receiverAgentId && !input.receiverUserId) {
    refuse('xacp_participant_unknown', 'a message needs an attributable receiver');
  }

  const sender = input.senderAgentId ? requireActiveAgent(state, actor.universeId, input.senderAgentId) : null;
  const receiver = input.receiverAgentId ? requireActiveAgent(state, actor.universeId, input.receiverAgentId) : null;

  // Agent-to-agent traffic follows an authorized relationship. There is no open
  // channel between arbitrary agents even inside one universe.
  if (sender && receiver && !isRelationshipAuthorized(state, sender.id, receiver.id)) {
    refuse('xacp_relationship_unauthorized', `${sender.agentKey} -> ${receiver.agentKey}`);
  }

  const conversation = state.messages
    .filter((item) => item.conversationId === input.conversationId && item.universeId === actor.universeId)
    .sort((left, right) => left.sequence - right.sequence);
  const previous = conversation[conversation.length - 1];
  if (previous && XACP_PHASES.indexOf(input.phase) < XACP_PHASES.indexOf(previous.phase)) {
    refuse('xacp_phase_out_of_order', `${previous.phase} -> ${input.phase}`);
  }

  const evidence = [...(input.evidence ?? [])];
  if (ASSERTING_PHASES.has(input.phase) && evidence.length === 0) {
    refuse('xacp_incomplete_provenance', `${input.phase} must carry evidence`);
  }
  if (input.decision && (input.confidence === null || input.confidence === undefined)) {
    refuse('xacp_incomplete_provenance', 'a decision must carry a confidence value');
  }

  const message: XacpMessage = {
    id: state.nextId(),
    universeId: actor.universeId,
    conversationId: input.conversationId,
    sequence: conversation.length + 1,
    phase: input.phase,
    senderAgentId: sender?.id ?? null,
    senderUserId: input.senderUserId ?? null,
    receiverAgentId: receiver?.id ?? null,
    receiverUserId: input.receiverUserId ?? null,
    purpose,
    evidence,
    reasoningArtifact,
    decision: input.decision ?? null,
    confidence: input.confidence ?? null,
    approvalStatus: input.approvalStatus ?? 'not_required',
    approvedBy: input.approvedBy ?? null,
    result: input.result ?? null,
    securityClassification: input.securityClassification ?? 'confidential',
    createdAt: now(state),
    archivedAt: null,
  };
  state.messages.push(message);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'xacp_message',
    actorUserId: actor.userId,
    actorAgentId: sender?.id ?? null,
    subjectAgentId: receiver?.id ?? null,
    decision: message.decision,
    detail: {
      conversationId: message.conversationId,
      sequence: message.sequence,
      phase: message.phase,
      purpose: message.purpose,
      evidenceCount: evidence.length,
      confidence: message.confidence,
      approvalStatus: message.approvalStatus,
    },
  });

  return message;
}

export function archiveConversation(
  state: CivilizationState,
  actor: ActorContext,
  input: { conversationId: string; summary: string; byUserId?: string },
): XacpMessage {
  requireMember(state, actor);
  const conversation = readConversation(state, actor, input.conversationId);
  if (conversation.length === 0) refuse('xacp_participant_unknown', input.conversationId);

  const last = conversation[conversation.length - 1];
  const closing = sendXacpMessage(state, actor, {
    conversationId: input.conversationId,
    phase: 'archive',
    senderUserId: input.byUserId ?? actor.userId,
    receiverUserId: input.byUserId ?? actor.userId,
    purpose: 'Archive the exchange',
    reasoningArtifact: input.summary,
    evidence: last.evidence,
    result: `archived ${conversation.length} messages`,
    securityClassification: last.securityClassification,
  });

  const stamp = now(state);
  for (const message of [...conversation, closing]) message.archivedAt = stamp;

  return closing;
}

export function readConversation(
  state: CivilizationState,
  actor: ActorContext,
  conversationId: string,
): XacpMessage[] {
  return visibleTo(state, actor, state.messages)
    .filter((item) => item.conversationId === conversationId)
    .sort((left, right) => left.sequence - right.sequence);
}

export type ProvenanceRecord = {
  sender: string;
  receiver: string;
  universe: string;
  purpose: string;
  evidence: string[];
  reasoningArtifact: string;
  decision: string | null;
  confidence: number | null;
  approval: XacpApprovalStatus;
  result: string | null;
};

// sender -> receiver -> Universe -> purpose -> evidence -> reasoning artifact ->
// decision -> confidence -> approval -> result. Every field is present for every
// message, which is what makes an exchange auditable rather than merely logged.
export function provenanceOf(message: XacpMessage): ProvenanceRecord {
  return {
    sender: message.senderAgentId ?? message.senderUserId ?? 'unknown',
    receiver: message.receiverAgentId ?? message.receiverUserId ?? 'unknown',
    universe: message.universeId,
    purpose: message.purpose,
    evidence: message.evidence.map((item) => `${item.claimKind}:${item.label}`),
    reasoningArtifact: message.reasoningArtifact,
    decision: message.decision,
    confidence: message.confidence,
    approval: message.approvalStatus,
    result: message.result,
  };
}

export function conversationEvidence(messages: readonly XacpMessage[]): XacpEvidenceRef[] {
  const seen = new Map<string, XacpEvidenceRef>();
  for (const message of messages) {
    for (const item of message.evidence) {
      seen.set(`${item.claimKind}:${item.label}`, item);
    }
  }
  return [...seen.values()];
}

export function conversationAssessment(messages: readonly XacpMessage[]) {
  return assessEvidence(conversationEvidence(messages));
}
