/**
 * XARP — XIV Agent Reasoning Protocol.
 * Evidence before consensus. Disagreements are preserved.
 * Agents do not vote merely because another model was persuasive.
 */

import { advanceStage, charge, getMeeting, isSeated, type MeetingNetwork } from './engine';
import type {
  Actor,
  Allow,
  Deny,
  MeetingDecision,
  MeetingObjection,
  MeetingProposal,
  MeetingVote,
  OptionProfile,
  XarpRole,
} from './types';
import { XARP_ROLES } from './types';

function deny(reason: string): Deny {
  return { ok: false, reason, audited: true };
}
function allow<T>(value: T): Allow<T> {
  return { ok: true, value, audited: true };
}

const proposals = new Map<string, MeetingProposal[]>();
const objections = new Map<string, MeetingObjection[]>();
const votes = new Map<string, MeetingVote[]>();
const options = new Map<string, OptionProfile[]>();
const decisions = new Map<string, MeetingDecision[]>();

export function resetProtocolState(): void {
  proposals.clear();
  objections.clear();
  votes.clear();
  options.clear();
  decisions.clear();
}

export function listXarpRoles(): readonly XarpRole[] {
  return XARP_ROLES;
}

export function submitProposal(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  draft: Omit<MeetingProposal, 'meetingId' | 'organizationId' | 'universeId' | 'actorId'>,
): Allow<MeetingProposal> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, actor.actorId)) return deny('unseated_proposal_denied');
  if (!draft.claim) return deny('claim_required');
  if (!draft.evidence.length) return deny('evidence_required_before_consensus');
  if (!draft.source || !draft.provenance) return deny('source_and_provenance_required');
  if (!draft.unknown) return deny('unknown_must_be_stated');
  if (!draft.counterargument) return deny('counterargument_required');
  const spend = charge(net, meetingId, { tokens: 80, compute: 2 });
  if (!spend.ok) return spend;
  const proposal: MeetingProposal = {
    ...draft,
    meetingId,
    actorId: actor.actorId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
  };
  const list = proposals.get(meetingId) ?? [];
  list.push(proposal);
  proposals.set(meetingId, list);
  advanceStage(net, meetingId, 'SPECIALIST_ANALYSIS');
  return allow(proposal);
}

export function objectToProposal(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  proposalId: string,
  statement: string,
): Allow<MeetingObjection> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, actor.actorId)) return deny('unseated_objection_denied');
  const found = (proposals.get(meetingId) ?? []).some((p) => p.proposalId === proposalId);
  if (!found) return deny('proposal_not_found');
  const spend = charge(net, meetingId, { tokens: 40, compute: 1 });
  if (!spend.ok) return spend;
  const objection: MeetingObjection = {
    objectionId: `obj:${proposalId}:${actor.actorId}`,
    meetingId,
    proposalId,
    actorId: actor.actorId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
    statement,
  };
  const list = objections.get(meetingId) ?? [];
  list.push(objection);
  objections.set(meetingId, list);
  advanceStage(net, meetingId, 'CONTRADICTION_DETECTION');
  return allow(objection);
}

export function voteOnProposal(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  proposalId: string,
  stance: MeetingVote['stance'],
): Allow<MeetingVote> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, actor.actorId)) return deny('unseated_vote_denied');
  const proposal = (proposals.get(meetingId) ?? []).find((p) => p.proposalId === proposalId);
  if (!proposal) return deny('proposal_not_found');
  if (!proposal.evidence.length) return deny('vote_without_evidence_denied');
  if (stance === 'support' && actor.actorId !== proposal.actorId && proposal.evidence.length === 0) {
    return deny('echo_chamber_vote_denied');
  }
  const spend = charge(net, meetingId, { tokens: 10, compute: 1 });
  if (!spend.ok) return spend;
  const vote: MeetingVote = {
    voteId: `vote:${proposalId}:${actor.actorId}`,
    meetingId,
    proposalId,
    actorId: actor.actorId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
    stance,
    evidenceBacked: true,
  };
  const list = votes.get(meetingId) ?? [];
  list.push(vote);
  votes.set(meetingId, list);
  return allow(vote);
}

export function preserveDisagreement(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  profiles: readonly Omit<OptionProfile, 'preserved'>[],
): Allow<OptionProfile[]> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  const preserved: OptionProfile[] = profiles.map((p) => ({ ...p, preserved: true as const }));
  options.set(meetingId, preserved);
  advanceStage(net, meetingId, 'CONSENSUS_OR_DISAGREEMENT');
  return allow(preserved);
}

export function synthesizeRecommendation(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  recommendation: string,
  confidence: number,
): Allow<MeetingDecision> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, actor.actorId)) return deny('unseated_synthesis_denied');
  const evidence = net.evidence.get(meetingId) ?? [];
  const props = proposals.get(meetingId) ?? [];
  if (!evidence.length && !props.length) return deny('synthesis_requires_evidence');
  const spend = charge(net, meetingId, { tokens: 120, compute: 3 });
  if (!spend.ok) return spend;
  const decision: MeetingDecision = {
    decisionId: `dec:${meetingId}`,
    meetingId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
    recommendation,
    confidence,
    humanDecisionRequired: true,
    humanApproved: false,
    sourceKind: 'machine_inference',
  };
  const list = decisions.get(meetingId) ?? [];
  list.push(decision);
  decisions.set(meetingId, list);
  advanceStage(net, meetingId, 'HUMAN_CHECKPOINT');
  return allow(decision);
}

export function listProposals(meetingId: string): readonly MeetingProposal[] {
  return proposals.get(meetingId) ?? [];
}

export function listObjections(meetingId: string): readonly MeetingObjection[] {
  return objections.get(meetingId) ?? [];
}

export function listVotes(meetingId: string): readonly MeetingVote[] {
  return votes.get(meetingId) ?? [];
}

export function listOptions(meetingId: string): readonly OptionProfile[] {
  return options.get(meetingId) ?? [];
}

export function listDecisions(meetingId: string): readonly MeetingDecision[] {
  return decisions.get(meetingId) ?? [];
}

export function consensusEqualsTruth(): false {
  return false;
}

export function recordHumanDecision(
  meetingId: string,
  decision: MeetingDecision,
): MeetingDecision {
  const list = (decisions.get(meetingId) ?? []).map((d) =>
    d.decisionId === decision.decisionId ? decision : d,
  );
  decisions.set(meetingId, list);
  return decision;
}
