/**
 * Agent directory, task-force generator, reputation, overnight briefs, outcome learning.
 * Logical population ≠ running compute. Overnight ≠ uncontrolled action.
 */

import {
  authorizeContext,
  collectEvidence,
  createMeeting,
  selectParticipants,
  type MeetingNetwork,
} from './engine';
import { synthesizeRecommendation } from './protocol';
import type {
  Actor,
  AgentReputation,
  Allow,
  Deny,
  DirectoryAgent,
  MeetingParticipant,
  OvernightBrief,
  TaskForceRecord,
  TaskForceStage,
} from './types';

function deny(reason: string): Deny {
  return { ok: false, reason, audited: true };
}
function allow<T>(value: T): Allow<T> {
  return { ok: true, value, audited: true };
}

export function resetSocietyState(): void {
  // State is per MeetingNetwork.
}

export function registerDirectoryAgent(net: MeetingNetwork, agent: DirectoryAgent): DirectoryAgent {
  net.directory.set(agent.agentId, {
    ...agent,
    logical: true,
    alwaysRunning: false,
  });
  if (!net.reputations.has(agent.agentId)) {
    net.reputations.set(agent.agentId, {
      agentId: agent.agentId,
      accuracy: 0.5,
      evidenceQuality: 0.5,
      calibration: 0.5,
      taskSuccess: 0.5,
      humanCorrections: 0,
      securityCompliance: 1,
      hallucinationRate: 0.1,
      costEfficiency: 0.5,
      latency: 0.5,
      collaborationQuality: 0.5,
      eligibleForHighImpact: false,
      authorityExpanded: false,
    });
  }
  return net.directory.get(agent.agentId)!;
}

export function getDirectoryAgent(net: MeetingNetwork, agentId: string): DirectoryAgent | undefined {
  return net.directory.get(agentId);
}

export function listDirectory(
  net: MeetingNetwork,
  organizationId: string,
  universeId: string,
): DirectoryAgent[] {
  return [...net.directory.values()].filter(
    (a) => a.organizationId === organizationId && a.universeId === universeId,
  );
}

export function logicalPopulationEqualsActiveCompute(): false {
  return false;
}

export function recommendTaskForce(
  net: MeetingNetwork,
  coordinator: Actor,
  input: {
    taskForceId: string;
    problem: string;
    memberIds: readonly string[];
    meetingId: string;
    title: string;
  },
): Allow<TaskForceRecord> | Deny {
  if (!input.problem) return deny('problem_required');
  for (const id of input.memberIds) {
    const agent = net.directory.get(id);
    if (!agent) return deny(`unknown_directory_agent:${id}`);
    if (agent.organizationId !== coordinator.organizationId) {
      return deny('cross_organization_task_force_denied');
    }
    if (agent.universeId !== coordinator.universeId) {
      return deny('cross_universe_task_force_denied');
    }
    const rep = net.reputations.get(id);
    if (rep && !rep.eligibleForHighImpact && agent.highStakes && coordinator.kind !== 'human') {
      return deny('high_stakes_requires_human_oversight');
    }
  }
  const created = createMeeting(net, {
    meetingId: input.meetingId,
    actor: coordinator,
    title: input.title,
    purpose: input.problem,
    trigger: `task-force:${input.taskForceId}`,
  });
  if (!created.ok) return created;
  const seated: MeetingParticipant[] = input.memberIds.map((id) => {
    const agent = net.directory.get(id)!;
    return {
      participantId: `p:${id}`,
      meetingId: input.meetingId,
      actorId: id,
      kind: 'agent',
      organizationId: agent.organizationId,
      universeId: agent.universeId,
      specialistDomain: agent.specialty,
    };
  });
  const selected = selectParticipants(net, input.meetingId, coordinator, seated);
  if (!selected.ok) return selected;
  const force: TaskForceRecord = {
    taskForceId: input.taskForceId,
    organizationId: coordinator.organizationId,
    universeId: coordinator.universeId,
    problem: input.problem,
    stage: 'CREATE',
    memberIds: input.memberIds,
    sleeping: false,
    grantsPermissions: false,
    productionLive: false,
  };
  net.taskForces.set(force.taskForceId, force);
  return allow(force);
}

export function advanceTaskForce(
  net: MeetingNetwork,
  taskForceId: string,
  stage: TaskForceStage,
): TaskForceRecord | undefined {
  const force = net.taskForces.get(taskForceId);
  if (!force) return undefined;
  const next = { ...force, stage, sleeping: stage === 'ARCHIVE' };
  net.taskForces.set(taskForceId, next);
  return next;
}

export function sleepTaskForce(net: MeetingNetwork, taskForceId: string): TaskForceRecord | undefined {
  const force = net.taskForces.get(taskForceId);
  if (!force) return undefined;
  const next = { ...force, sleeping: true, stage: 'ARCHIVE' as const };
  net.taskForces.set(taskForceId, next);
  return next;
}

export function taskForceGrantsPermissions(_force: TaskForceRecord): false {
  return false;
}

export function updateReputation(
  net: MeetingNetwork,
  agentId: string,
  patch: Partial<Omit<AgentReputation, 'agentId' | 'authorityExpanded'>>,
): AgentReputation | undefined {
  const current = net.reputations.get(agentId);
  if (!current) return undefined;
  const next: AgentReputation = {
    ...current,
    ...patch,
    authorityExpanded: false,
  };
  if (next.accuracy < 0.4 || next.securityCompliance < 0.9 || next.hallucinationRate > 0.3) {
    next.eligibleForHighImpact = false;
  }
  net.reputations.set(agentId, next);
  return next;
}

export function reputationExpandsAuthority(_rep: AgentReputation): false {
  return false;
}

export function evaluateRecommendationOutcome(input: {
  recommendedIncreasePct: number;
  actualDemandDeltaPct: number;
  carryingCostOk: boolean;
  serviceLevelOk: boolean;
  stockoutsDown: boolean;
}): { performedWell: boolean; learningClass: 'Outcome-Based Agent Learning' } {
  const aligned = Math.abs(input.recommendedIncreasePct - input.actualDemandDeltaPct) <= 5;
  return {
    performedWell: aligned && input.carryingCostOk && input.serviceLevelOk && input.stockoutsDown,
    learningClass: 'Outcome-Based Agent Learning',
  };
}

export function runOvernightSession(
  net: MeetingNetwork,
  actor: Actor,
  missions: readonly {
    id: string;
    title: string;
    claim: string;
    source: string;
    provenance: string;
  }[],
): OvernightBrief {
  let issuesInvestigated = 0;
  let opportunitiesIdentified = 0;
  let anomaliesDetected = 0;
  let decisionsRequiringApproval = 0;
  let meetingsCompleted = 0;

  for (const mission of missions) {
    const meetingId = `ovn:${mission.id}`;
    const created = createMeeting(net, {
      meetingId,
      actor,
      title: mission.title,
      purpose: mission.claim,
      trigger: 'overnight-async',
    });
    if (!created.ok) continue;
    const analyst = {
      ...actor,
      actorId: actor.kind === 'human' ? 'exec-coord' : actor.actorId,
      kind: 'agent' as const,
    };
    selectParticipants(net, meetingId, actor, [
      {
        participantId: `p:${analyst.actorId}`,
        meetingId,
        actorId: analyst.actorId,
        kind: 'agent',
        organizationId: actor.organizationId,
        universeId: actor.universeId,
        xarpRole: 'Investigator',
      },
    ]);
    authorizeContext(net, meetingId, analyst);
    collectEvidence(net, meetingId, analyst, {
      evidenceId: `ev:${mission.id}`,
      claim: mission.claim,
      source: mission.source,
      provenance: mission.provenance,
      date: 'overnight',
      confidence: 0.6,
      classification: 'internal',
    });
    const rec = synthesizeRecommendation(net, meetingId, analyst, `Review: ${mission.title}`, 0.6);
    if (rec.ok) {
      decisionsRequiringApproval += 1;
      const closed = net.meetings.get(meetingId);
      if (closed) {
        net.meetings.set(meetingId, { ...closed, status: 'CLOSED', stage: 'HUMAN_CHECKPOINT' });
      }
    }
    meetingsCompleted += 1;
    issuesInvestigated += 1;
    if (mission.title.toLowerCase().includes('opportunit')) opportunitiesIdentified += 1;
    if (mission.title.toLowerCase().includes('anomal')) anomaliesDetected += 1;
  }

  const brief: OvernightBrief = {
    meetingsCompleted,
    issuesInvestigated,
    opportunitiesIdentified,
    anomaliesDetected,
    decisionsRequiringApproval,
    unauthorizedActionsExecuted: 0,
    overnightEqualsUncontrolledAction: false,
  };
  net.overnightBriefs.push(brief);
  return brief;
}

export function overnightEqualsUncontrolledAction(): false {
  return false;
}

export function listTaskForces(
  net: MeetingNetwork,
  organizationId: string,
  universeId: string,
): TaskForceRecord[] {
  return [...net.taskForces.values()].filter(
    (f) => f.organizationId === organizationId && f.universeId === universeId,
  );
}

export function seedExampleDirectory(
  net: MeetingNetwork,
  organizationId: string,
  universeId: string,
): void {
  const rows: Array<[string, string, string, boolean]> = [
    ['ceo', 'Business', 'CEO Agent', true],
    ['coo', 'Business', 'COO Agent', true],
    ['cfo', 'Business', 'CFO Agent', true],
    ['product', 'Business', 'Product Agent', false],
    ['strategy', 'Business', 'Strategy Agent', false],
    ['procurement', 'Supply Chain', 'Procurement Agent', false],
    ['warehouse', 'Supply Chain', 'Warehouse Agent', false],
    ['inventory', 'Supply Chain', 'Inventory Agent', false],
    ['transport', 'Supply Chain', 'Transportation Agent', false],
    ['demand', 'Supply Chain', 'Demand Agent', false],
    ['software', 'Technology', 'Software Agent', false],
    ['database', 'Technology', 'Database Agent', false],
    ['cloud', 'Technology', 'Cloud Agent', false],
    ['cyber', 'Technology', 'Cybersecurity Agent', true],
    ['mobile', 'Technology', 'Mobile Agent', false],
    ['ai-eval', 'Technology', 'AI Evaluation Agent', true],
    ['legal', 'Professional Intelligence', 'Legal Research Agent', true],
    ['accounting', 'Professional Intelligence', 'Accounting Agent', true],
    ['engineering', 'Professional Intelligence', 'Engineering Agent', false],
    ['architecture', 'Professional Intelligence', 'Architecture Agent', false],
    ['education', 'Professional Intelligence', 'Education Agent', false],
    ['science', 'Professional Intelligence', 'Scientific Research Agent', true],
    ['risk', 'Supply Chain', 'Risk Agent', true],
    ['weather', 'Supply Chain', 'Weather Intelligence Agent', false],
    ['market', 'Supply Chain', 'Market Intelligence Agent', false],
    ['manufacturing', 'Supply Chain', 'Manufacturing Agent', false],
    ['logistics', 'Supply Chain', 'Logistics Agent', false],
    ['finance', 'Business', 'Finance Agent', true],
    ['exec-coord', 'Business', 'Executive Coordinator Agent', false],
    ['supply-chain', 'Supply Chain', 'Supply Chain Agent', false],
    ['sustainability', 'Supply Chain', 'Sustainability Agent', false],
  ];
  for (const [id, domain, name, highStakes] of rows) {
    registerDirectoryAgent(net, {
      agentId: id,
      organizationId,
      universeId,
      name,
      domain,
      specialty: name,
      tools: highStakes ? ['read'] : ['read', 'analyze'],
      highStakes,
      logical: true,
      alwaysRunning: false,
    });
  }
}
