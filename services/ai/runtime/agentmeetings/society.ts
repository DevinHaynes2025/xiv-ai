/**
 * Agent directory, task-force generator, reputation, overnight briefs, outcome learning.
 * Logical population ≠ running compute. Overnight ≠ uncontrolled action.
 */

import { createMeeting, selectParticipants, type MeetingNetwork } from './engine';
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

const directory = new Map<string, DirectoryAgent>();
const reputations = new Map<string, AgentReputation>();
const taskForces = new Map<string, TaskForceRecord>();
const overnightMeetings = new Map<string, string[]>();

function deny(reason: string): Deny {
  return { ok: false, reason, audited: true };
}
function allow<T>(value: T): Allow<T> {
  return { ok: true, value, audited: true };
}

export function resetSocietyState(): void {
  directory.clear();
  reputations.clear();
  taskForces.clear();
  overnightMeetings.clear();
}

export function registerDirectoryAgent(agent: DirectoryAgent): DirectoryAgent {
  directory.set(agent.agentId, {
    ...agent,
    logical: true,
    alwaysRunning: false,
  });
  if (!reputations.has(agent.agentId)) {
    reputations.set(agent.agentId, {
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
  return directory.get(agent.agentId)!;
}

export function getDirectoryAgent(agentId: string): DirectoryAgent | undefined {
  return directory.get(agentId);
}

export function listDirectory(organizationId: string, universeId: string): DirectoryAgent[] {
  return [...directory.values()].filter(
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
    const agent = directory.get(id);
    if (!agent) return deny(`unknown_directory_agent:${id}`);
    if (agent.organizationId !== coordinator.organizationId) {
      return deny('cross_organization_task_force_denied');
    }
    if (agent.universeId !== coordinator.universeId) {
      return deny('cross_universe_task_force_denied');
    }
    const rep = reputations.get(id);
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
    const agent = directory.get(id)!;
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
  taskForces.set(force.taskForceId, force);
  return allow(force);
}

export function advanceTaskForce(taskForceId: string, stage: TaskForceStage): TaskForceRecord | undefined {
  const force = taskForces.get(taskForceId);
  if (!force) return undefined;
  const next = { ...force, stage, sleeping: stage === 'ARCHIVE' };
  taskForces.set(taskForceId, next);
  return next;
}

export function sleepTaskForce(taskForceId: string): TaskForceRecord | undefined {
  const force = taskForces.get(taskForceId);
  if (!force) return undefined;
  const next = { ...force, sleeping: true, stage: 'ARCHIVE' as const };
  taskForces.set(taskForceId, next);
  return next;
}

export function taskForceGrantsPermissions(_force: TaskForceRecord): false {
  return false;
}

export function updateReputation(
  agentId: string,
  patch: Partial<Omit<AgentReputation, 'agentId' | 'authorityExpanded'>>,
): AgentReputation | undefined {
  const current = reputations.get(agentId);
  if (!current) return undefined;
  const next: AgentReputation = {
    ...current,
    ...patch,
    authorityExpanded: false,
  };
  if (next.accuracy < 0.4 || next.securityCompliance < 0.9 || next.hallucinationRate > 0.3) {
    next.eligibleForHighImpact = false;
  }
  reputations.set(agentId, next);
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
  orgId: string,
  stats: {
    meetingsCompleted: number;
    issuesInvestigated: number;
    opportunitiesIdentified: number;
    anomaliesDetected: number;
    decisionsRequiringApproval: number;
  },
): OvernightBrief {
  overnightMeetings.set(orgId, [...(overnightMeetings.get(orgId) ?? []), `ovn:${Date.now()}`]);
  void net;
  return {
    ...stats,
    unauthorizedActionsExecuted: 0,
    overnightEqualsUncontrolledAction: false,
  };
}

export function overnightEqualsUncontrolledAction(): false {
  return false;
}

export function listTaskForces(organizationId: string, universeId: string): TaskForceRecord[] {
  return [...taskForces.values()].filter(
    (f) => f.organizationId === organizationId && f.universeId === universeId,
  );
}

export function seedExampleDirectory(organizationId: string, universeId: string): void {
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
    registerDirectoryAgent({
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
