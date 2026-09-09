/**
 * Meeting memory, multilingual provenance, temporal context, command-center snapshot.
 */

import type { MeetingNetwork } from './engine';
import { listHumanContributions, listOutcomes } from './humans';
import { listDecisions, listObjections, listOptions, listProposals } from './protocol';
import { listDirectory, listTaskForces } from './society';
import type {
  Actor,
  CommandCenterSnapshot,
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
      ...listProposals(meetingId).map((p) => p.claim),
      ...listObjections(meetingId).map((o) => o.statement),
    ],
    alternatives: listOptions(meetingId).map((o) => o.label),
    decision: listDecisions(meetingId)[0]?.recommendation ?? null,
    approval: listDecisions(meetingId).some((d) => d.humanApproved),
    outcome: listOutcomes(meetingId)[0]?.summary ?? null,
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

export function culturalContextIsFact(_u: TranslatedUtterance): false {
  return false;
}

export function attachTemporalContext(input: TemporalContext): TemporalContext {
  return input;
}

export function commandCenterSnapshot(
  net: MeetingNetwork,
  actor: Actor,
): CommandCenterSnapshot {
  const meetings = [...net.meetings.values()].filter(
    (m) => m.organizationId === actor.organizationId && m.universeId === actor.universeId,
  );
  const running = meetings.filter((m) => m.status === 'OPEN');
  const agents = listDirectory(actor.organizationId, actor.universeId);
  const forces = listTaskForces(actor.organizationId, actor.universeId);
  const pending = meetings.flatMap((m) => listDecisions(m.meetingId));
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
  void listHumanContributions(meetingId);
  return memory;
}
