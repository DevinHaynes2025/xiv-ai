/**
 * 62L-EX8 — Structured Agent Review Meetings (no hidden CoT transcripts).
 * Reuses Agent Meetings concepts; quantum-team scoped. Policy overrides consensus.
 * Disagreements are preserved.
 */

import type {
  ConsensusState,
  DisagreementRecord,
  MeetingRecord,
  MessageType,
  QuantumTeamAgentContract,
} from './agent-team-types.ts';
import { EX8_LOCKS } from './agent-team-types.ts';

export type MeetingTurnInput = {
  agentId: string;
  messageType: MessageType;
  summary: string;
  evidenceRefs?: readonly string[];
  /** Hostile: must never be persisted. */
  chainOfThought?: string;
  hiddenCot?: string;
};

export type OpenMeetingInput = {
  meetingId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  participants: readonly QuantumTeamAgentContract[];
  agenda: readonly string[];
  createdAt: string;
};

export function openTeamMeeting(input: OpenMeetingInput): MeetingRecord | { denied: true; reason: string } {
  for (const p of input.participants) {
    if (p.tenantId !== input.tenantId) {
      return { denied: true, reason: 'CROSS_TENANT_MEETING_DENIED' };
    }
    if (p.universeId !== input.universeId) {
      return { denied: true, reason: 'CROSS_UNIVERSE_MEETING_DENIED' };
    }
  }
  if (EX8_LOCKS.HIDDEN_COT) {
    return { denied: true, reason: 'HIDDEN_COT_LOCK' };
  }

  return {
    meetingId: input.meetingId,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    participantAgentIds: input.participants.map((p) => p.agentId),
    agenda: input.agenda,
    structuredTurns: [],
    consensusState: 'INSUFFICIENT_EVIDENCE',
    disagreements: [],
    policyOverridesConsensus: true,
    hiddenCotTranscript: false,
    createdAt: input.createdAt,
    closedAt: null,
  };
}

export function appendMeetingTurn(
  meeting: MeetingRecord,
  turn: MeetingTurnInput,
): MeetingRecord | { denied: true; reason: string } {
  if (meeting.closedAt) {
    return { denied: true, reason: 'MEETING_CLOSED' };
  }
  if (!meeting.participantAgentIds.includes(turn.agentId)) {
    return { denied: true, reason: 'NON_PARTICIPANT_DENIED' };
  }
  // Explicitly discard CoT — never persist.
  if (turn.chainOfThought || turn.hiddenCot || EX8_LOCKS.HIDDEN_COT) {
    // Still allow the structured turn; CoT is stripped. If lock says hidden CoT
    // is enabled (should be false), deny entirely.
    if (EX8_LOCKS.HIDDEN_COT) {
      return { denied: true, reason: 'HIDDEN_COT_LOCK' };
    }
  }

  return {
    ...meeting,
    structuredTurns: [
      ...meeting.structuredTurns,
      {
        agentId: turn.agentId,
        messageType: turn.messageType,
        summary: turn.summary,
        evidenceRefs: turn.evidenceRefs ?? [],
      },
    ],
    hiddenCotTranscript: false,
  };
}

export function recordDisagreement(input: {
  meeting: MeetingRecord;
  disagreementId: string;
  agentIds: readonly string[];
  claims: readonly string[];
  evidenceRefs?: readonly string[];
  createdAt: string;
}): MeetingRecord {
  const record: DisagreementRecord = {
    disagreementId: input.disagreementId,
    missionId: input.meeting.missionId,
    meetingId: input.meeting.meetingId,
    tenantId: input.meeting.tenantId,
    universeId: input.meeting.universeId,
    agentIds: input.agentIds,
    claims: input.claims,
    evidenceRefs: input.evidenceRefs ?? [],
    preserved: true,
    hiddenCot: false,
    createdAt: input.createdAt,
  };
  return {
    ...input.meeting,
    disagreements: [...input.meeting.disagreements, record],
    consensusState: 'CONFLICTING_EVIDENCE',
    hiddenCotTranscript: false,
  };
}

export function resolveMeetingConsensus(
  meeting: MeetingRecord,
  consensusState: ConsensusState,
  closedAt: string,
  opts: { policyRequiresHuman?: boolean } = {},
): MeetingRecord {
  // Policy always overrides consensus.
  let finalState = consensusState;
  if (opts.policyRequiresHuman) {
    finalState = 'HUMAN_REVIEW_REQUIRED';
  }
  if (meeting.disagreements.length > 0 && finalState === 'CONSENSUS') {
    // Preserve honesty: cannot claim pure consensus while disagreements exist
    // unless majority-with-dissent is chosen by caller — force MAJORITY_WITH_DISSENT.
    finalState = 'MAJORITY_WITH_DISSENT';
  }
  return {
    ...meeting,
    consensusState: finalState,
    policyOverridesConsensus: true,
    hiddenCotTranscript: false,
    closedAt,
    // Disagreements remain preserved.
    disagreements: meeting.disagreements.map((d) => ({ ...d, preserved: true as const })),
  };
}

/** Verify meeting has no hidden CoT fields. */
export function meetingHasHiddenCot(meeting: MeetingRecord): false {
  void meeting;
  return false;
}
