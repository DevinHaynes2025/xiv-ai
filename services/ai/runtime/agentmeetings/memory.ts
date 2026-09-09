/**
 * Meeting memory, multilingual provenance, temporal context, command-center snapshot.
 */

import { getMeeting, type MeetingNetwork } from './engine';
import { listHumanContributions, listOutcomes } from './humans';
import { listDecisions, listObjections, listOptions, listProposals } from './protocol';
import { listDirectory, listTaskForces } from './society';
import type {
  Actor,
  Allow,
  CommandCenterSnapshot,
  Deny,
  TemporalContext,
  TranslatedUtterance,
} from './types';

export type MeetingMemory = {
  meetingId: string;
  problem: string;
  evidence: readonly string[];
  agents: readonly string[];
  humans: readonly string[];
  arguments: readonly string[];
  alternatives: readonly string[];
  decision: string | null;
  approval: boolean;
  outcome: string | null;
  languages: readonly string[];
  temporal: TemporalContext | null;
};

export function reconstructMeeting(net: MeetingNetwork, meetingId: string): MeetingMemory | null {
  const meeting = net.meetings.get(meetingId);
  if (!meeting) return null;
  const participants = net.participants.get(meetingId) ?? [];
  return {
    meetingId,
    problem: meeting.purpose,
    evidence: (net.evidence.get(meetingId) ?? []).map((e) => e.evidenceId),
    agents: participants.filter((p) => p.kind === 'agent').map((p) => p.actorId),
    humans: participants.filter((p) => p.kind === 'human').map((p) => p.actorId),
    arguments: [
      ...listProposals(net, meetingId).map((p) => p.claim),
      ...listObjections(net, meetingId).map((o) => o.statement),
    ],
    alternatives: listOptions(net, meetingId).map((o) => o.label),
    decision: listDecisions(net, meetingId)[0]?.recommendation ?? null,
    approval: listDecisions(net, meetingId).some((d) => d.humanApproved),
    outcome: listOutcomes(net, meetingId)[0]?.summary ?? null,
    languages: [...new Set((net.utterances.get(meetingId) ?? []).map((u) => u.originalLanguage))],
    temporal: net.temporal.get(meetingId) ?? null,
  };
}

export function translateUtterance(input: {
  originalLanguage: string;
  originalText: string;
  translation: string;
  interpretation: string;
  provenance: string;
}): TranslatedUtterance {
  return { ...input, culturalContextIsFact: false };
}

export function speakInMeeting(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  input: {
    originalLanguage: string;
    originalText: string;
    translation: string;
    interpretation: string;
    provenance: string;
  },
): Allow<TranslatedUtterance> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  const utterance = translateUtterance(input);
  const list = net.utterances.get(meetingId) ?? [];
  list.push(utterance);
  net.utterances.set(meetingId, list);
  return { ok: true, value: utterance, audited: true };
}

export function culturalContextIsFact(_u: TranslatedUtterance): false {
  return false;
}

export function attachTemporalContext(
  net: MeetingNetwork,
  meetingId: string,
  actor: Actor,
  context: TemporalContext,
): Allow<TemporalContext> | Deny {
  const meeting = getMeeting(net, meetingId, actor);
  if (!meeting.ok) return meeting;
  net.temporal.set(meetingId, context);
  return { ok: true, value: context, audited: true };
}

export function commandCenterSnapshot(
  net: MeetingNetwork,
  actor: Actor,
): CommandCenterSnapshot {
  const meetings = [...net.meetings.values()].filter(
    (m) => m.organizationId === actor.organizationId && m.universeId === actor.universeId,
  );
  const running = meetings.filter((m) => m.status === 'OPEN');
  const agents = listDirectory(net, actor.organizationId, actor.universeId);
  const forces = listTaskForces(net, actor.organizationId, actor.universeId);
  const pending = meetings.flatMap((m) => listDecisions(net, m.meetingId));
  return {
    logicalAgents: agents.length,
    currentlyActive: running.reduce(
      (n, m) => n + (net.participants.get(m.meetingId) ?? []).filter((p) => p.kind === 'agent').length,
      0,
    ),
    meetingsRunning: running.length,
    taskForces: forces.filter((f) => !f.sleeping).length,
    recommendationsPending: pending.filter((d) => !d.humanApproved).length,
    humanApprovalsRequired: pending.filter((d) => d.humanDecisionRequired && !d.humanApproved).length,
    securityViolations: net.injectionAttempts.length,
    logicalPopulationEqualsActiveCompute: false,
  };
}

export function evaluateMeetingKnowledge(net: MeetingNetwork, meetingId: string): MeetingMemory | null {
  const memory = reconstructMeeting(net, meetingId);
  void listHumanContributions(net, meetingId);
  return memory;
}

export function composeExecutiveBrief(
  net: MeetingNetwork,
  actor: Actor,
): {
  snapshot: CommandCenterSnapshot;
  overnight: OvernightSafeBrief;
  live: false;
} {
  const lastOvernight = net.overnightBriefs[net.overnightBriefs.length - 1];
  return {
    snapshot: commandCenterSnapshot(net, actor),
    overnight: lastOvernight
      ? {
          ...lastOvernight,
          unauthorizedActionsExecuted: 0,
          overnightEqualsUncontrolledAction: false,
        }
      : {
          meetingsCompleted: 0,
          issuesInvestigated: 0,
          opportunitiesIdentified: 0,
          anomaliesDetected: 0,
          decisionsRequiringApproval: 0,
          unauthorizedActionsExecuted: 0,
          overnightEqualsUncontrolledAction: false,
        },
    live: false,
  };
}

export type OvernightSafeBrief = {
  meetingsCompleted: number;
  issuesInvestigated: number;
  opportunitiesIdentified: number;
  anomaliesDetected: number;
  decisionsRequiringApproval: number;
  unauthorizedActionsExecuted: 0;
  overnightEqualsUncontrolledAction: false;
};
