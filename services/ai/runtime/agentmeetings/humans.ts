/**
 * Human Intelligence Bridge.
 * Humans participate; judgment is recorded separately from machine inference.
 * Human opinion is not automatically universal truth.
 */

import { advanceStage, getMeeting, isSeated, joinMeeting, type MeetingNetwork } from './engine';
import { listDecisions, recordHumanDecision } from './protocol';
import type {
  Actor,
  Allow,
  Deny,
  HumanContribution,
  HumanKnowledgeClass,
  MeetingAction,
  MeetingDecision,
  MeetingOutcome,
  MeetingParticipant,
} from './types';

const contributions = new Map<string, HumanContribution[]>();
const actions = new Map<string, MeetingAction[]>();
const outcomes = new Map<string, MeetingOutcome[]>();

function deny(reason: string): Deny {
  return { ok: false, reason, audited: true };
}
function allow<T>(value: T): Allow<T> {
  return { ok: true, value, audited: true };
}

export function resetHumanState(): void {
  contributions.clear();
  actions.clear();
  outcomes.clear();
}

export function humanEnterMeeting(
  net: MeetingNetwork,
  meetingId: string,
  human: Actor,
): Allow<MeetingParticipant> | Deny {
  if (human.kind !== 'human') return deny('human_bridge_requires_human_actor');
  return joinMeeting(net, meetingId, human, {
    participantId: `p:${human.actorId}`,
    meetingId,
    actorId: human.actorId,
    kind: 'human',
    organizationId: human.organizationId,
    universeId: human.universeId,
    xarpRole: 'HumanLiaison',
  });
}

export function recordHumanKnowledge(
  net: MeetingNetwork,
  meetingId: string,
  human: Actor,
  classification: HumanKnowledgeClass,
  text: string,
): Allow<HumanContribution> | Deny {
  if (human.kind !== 'human') return deny('machine_cannot_file_human_knowledge');
  const meeting = getMeeting(net, meetingId, human);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, human.actorId)) return deny('unseated_human_knowledge_denied');
  const contribution: HumanContribution = {
    contributionId: `hk:${meetingId}:${(contributions.get(meetingId) ?? []).length + 1}`,
    meetingId,
    actorId: human.actorId,
    organizationId: human.organizationId,
    universeId: human.universeId,
    classification,
    text,
    isUniversalTruth: false,
  };
  const list = contributions.get(meetingId) ?? [];
  list.push(contribution);
  contributions.set(meetingId, list);
  return allow(contribution);
}

export function humanOpinionIsUniversalTruth(_c: HumanContribution): false {
  return false;
}

export function humanDecide(
  net: MeetingNetwork,
  meetingId: string,
  human: Actor,
  decisionId: string,
  verdict: 'approve' | 'reject' | 'postpone' | 'escalate',
): Allow<MeetingDecision> | Deny {
  if (human.kind !== 'human') return deny('agent_cannot_fabricate_human_approval');
  const meeting = getMeeting(net, meetingId, human);
  if (!meeting.ok) return meeting;
  if (!isSeated(net, meetingId, human.actorId)) return deny('unseated_human_decision_denied');
  const current = listDecisions(meetingId).find((d) => d.decisionId === decisionId);
  if (!current) return deny('decision_not_found');
  const updated: MeetingDecision = {
    ...current,
    humanApproved: verdict === 'approve',
    approvedBy: verdict === 'approve' ? human.actorId : undefined,
    sourceKind: 'human_judgment',
    recommendation:
      verdict === 'postpone'
        ? `${current.recommendation} (postponed)`
        : verdict === 'escalate'
          ? `${current.recommendation} (escalated)`
          : current.recommendation,
  };
  recordHumanDecision(meetingId, updated);
  if (verdict === 'approve' || verdict === 'reject') {
    advanceStage(net, meetingId, 'DECISION');
  }
  return allow(updated);
}

export function fabricateApproval(_net: MeetingNetwork, actor: Actor): Deny {
  if (actor.kind === 'agent') return deny('agent_cannot_fabricate_human_approval');
  return deny('fabricated_approval_denied');
}

export function queueAuthorizedAction(
  net: MeetingNetwork,
  meetingId: string,
  human: Actor,
  description: string,
): Allow<MeetingAction> | Deny {
  if (human.kind !== 'human') return deny('authorized_action_requires_human');
  const meeting = getMeeting(net, meetingId, human);
  if (!meeting.ok) return meeting;
  const approved = listDecisions(meetingId).some((d) => d.humanApproved);
  if (!approved) return deny('action_requires_human_approval');
  const action: MeetingAction = {
    actionId: `act:${meetingId}:${(actions.get(meetingId) ?? []).length + 1}`,
    meetingId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
    description,
    queued: true,
    executed: false,
    unauthorized: false,
  };
  const list = actions.get(meetingId) ?? [];
  list.push(action);
  actions.set(meetingId, list);
  advanceStage(net, meetingId, 'AUTHORIZED_ACTION');
  return allow(action);
}

export function recordOutcome(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  summary: string,
): Allow<MeetingOutcome> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  const outcome: MeetingOutcome = {
    outcomeId: `out:${meetingId}`,
    meetingId,
    organizationId: meeting.value.organizationId,
    universeId: meeting.value.universeId,
    summary,
    measured: true,
  };
  outcomes.set(meetingId, [outcome]);
  advanceStage(net, meetingId, 'OUTCOME');
  return allow(outcome);
}

export function listHumanContributions(meetingId: string): readonly HumanContribution[] {
  return contributions.get(meetingId) ?? [];
}

export function listActions(meetingId: string): readonly MeetingAction[] {
  return actions.get(meetingId) ?? [];
}

export function listOutcomes(meetingId: string): readonly MeetingOutcome[] {
  return outcomes.get(meetingId) ?? [];
}
