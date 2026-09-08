import { refuse } from './errors';
import { assertUniverseOperable } from './guardian';
import {
  now,
  recordGovernanceEvent,
  requireMember,
  requireSupervisor,
  requireUniverse,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  MembershipRole,
  ResourceBudget,
  SecurityClassification,
  Universe,
  UniverseLifecycleStage,
  UniverseMembership,
} from './types';

// Universe Created -> Seed -> Growth -> Operational -> Mature -> Transformation -> Archive.
// A universe only moves forward, except that Transformation may fold back into
// Growth when an organization restructures rather than winds down.
const STAGE_TRANSITIONS: Record<UniverseLifecycleStage, readonly UniverseLifecycleStage[]> = {
  created: ['seed'],
  seed: ['growth', 'archive'],
  growth: ['operational', 'archive'],
  operational: ['mature', 'transformation', 'archive'],
  mature: ['transformation', 'archive'],
  transformation: ['growth', 'operational', 'archive'],
  archive: [],
};

export function createUniverse(
  state: CivilizationState,
  input: {
    organizationId: string;
    name: string;
    createdBy: string;
    securityClassification?: SecurityClassification;
    constellationKey?: string | null;
    galaxyKey?: string | null;
  },
): Universe {
  const universe: Universe = {
    id: state.nextId(),
    organizationId: input.organizationId,
    name: input.name,
    createdBy: input.createdBy,
    lifecycleStage: 'created',
    stageEnteredAt: now(state),
    securityClassification: input.securityClassification ?? 'internal',
    constellationKey: input.constellationKey ?? null,
    galaxyKey: input.galaxyKey ?? null,
    killSwitchEngaged: false,
    killSwitchReason: null,
    createdAt: now(state),
    archivedAt: null,
  };
  state.universes.push(universe);

  const founder: UniverseMembership = {
    id: state.nextId(),
    universeId: universe.id,
    organizationId: universe.organizationId,
    userId: input.createdBy,
    membershipRole: 'owner',
    isSupervisor: true,
    createdAt: now(state),
    revokedAt: null,
  };
  state.memberships.push(founder);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'universe_created',
    actorUserId: input.createdBy,
    detail: { organizationId: universe.organizationId, name: universe.name },
  });

  return universe;
}

export function addMember(
  state: CivilizationState,
  actor: ActorContext,
  input: { userId: string; membershipRole: MembershipRole; isSupervisor?: boolean },
): UniverseMembership {
  const { universe } = requireSupervisor(state, actor);
  const existing = state.memberships.find(
    (item) => item.universeId === universe.id && item.userId === input.userId && !item.revokedAt,
  );
  if (existing) return existing;

  const membership: UniverseMembership = {
    id: state.nextId(),
    universeId: universe.id,
    organizationId: universe.organizationId,
    userId: input.userId,
    membershipRole: input.membershipRole,
    isSupervisor: input.isSupervisor ?? (input.membershipRole === 'owner' || input.membershipRole === 'supervisor'),
    createdAt: now(state),
    revokedAt: null,
  };
  state.memberships.push(membership);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'membership_granted',
    actorUserId: actor.userId,
    detail: { userId: input.userId, membershipRole: membership.membershipRole, isSupervisor: membership.isSupervisor },
  });

  return membership;
}

export function advanceLifecycle(
  state: CivilizationState,
  actor: ActorContext,
  input: { to: UniverseLifecycleStage },
): Universe {
  const { universe } = requireSupervisor(state, actor);
  const allowed = STAGE_TRANSITIONS[universe.lifecycleStage];
  if (!allowed.includes(input.to)) {
    refuse('universe_stage_transition_invalid', `${universe.lifecycleStage} -> ${input.to}`);
  }

  universe.lifecycleStage = input.to;
  universe.stageEnteredAt = now(state);
  if (input.to === 'archive') universe.archivedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'universe_stage_advanced',
    actorUserId: actor.userId,
    decision: input.to,
    detail: { stage: input.to },
  });

  return universe;
}

export function setResourceBudget(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    agentId?: string | null;
    maxRegisteredAgents: number;
    maxActiveAgents: number;
    maxQueuedTasks: number;
    maxCostMicroUsd: number;
    hardStop?: boolean;
  },
): ResourceBudget {
  const { universe } = requireSupervisor(state, actor);
  const agentId = input.agentId ?? null;
  const existing = state.budgets.find((item) => item.universeId === universe.id && item.agentId === agentId);

  const budget: ResourceBudget = existing ?? {
    id: state.nextId(),
    universeId: universe.id,
    agentId,
    periodStart: now(state),
    periodEnd: null,
    maxRegisteredAgents: input.maxRegisteredAgents,
    maxActiveAgents: input.maxActiveAgents,
    maxQueuedTasks: input.maxQueuedTasks,
    maxCostMicroUsd: input.maxCostMicroUsd,
    consumedCostMicroUsd: 0,
    consumedTasks: 0,
    hardStop: input.hardStop ?? true,
    createdAt: now(state),
  };

  budget.maxRegisteredAgents = input.maxRegisteredAgents;
  budget.maxActiveAgents = input.maxActiveAgents;
  budget.maxQueuedTasks = input.maxQueuedTasks;
  budget.maxCostMicroUsd = input.maxCostMicroUsd;
  budget.hardStop = input.hardStop ?? budget.hardStop;

  if (!existing) state.budgets.push(budget);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'budget_set',
    actorUserId: actor.userId,
    subjectAgentId: agentId,
    detail: {
      maxRegisteredAgents: budget.maxRegisteredAgents,
      maxActiveAgents: budget.maxActiveAgents,
      maxQueuedTasks: budget.maxQueuedTasks,
      maxCostMicroUsd: budget.maxCostMicroUsd,
    },
  });

  return budget;
}

export function universeBudget(state: CivilizationState, universeId: string): ResourceBudget {
  const budget = state.budgets.find((item) => item.universeId === universeId && item.agentId === null);
  if (!budget) refuse('quota_budget_missing', universeId);
  return budget;
}

// The kill switch is a plain boolean checked before every message, task and
// activation. There is no negotiation path around it and no timer that clears
// it. A human engages it and a human clears it.
export function engageKillSwitch(
  state: CivilizationState,
  actor: ActorContext,
  input: { reason: string },
): Universe {
  const { universe } = requireSupervisor(state, actor);
  const reason = input.reason.trim();
  if (!reason) refuse('guardian_kill_switch_engaged', 'a kill switch needs a stated reason');

  universe.killSwitchEngaged = true;
  universe.killSwitchReason = reason;

  for (const agent of state.agents) {
    if (agent.universeId !== universe.id) continue;
    if (agent.lifecycleState === 'active') agent.lifecycleState = 'suspended';
  }

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'kill_switch_engaged',
    actorUserId: actor.userId,
    decision: 'engaged',
    detail: { reason },
  });

  return universe;
}

export function clearKillSwitch(state: CivilizationState, actor: ActorContext): Universe {
  const { universe } = requireSupervisor(state, actor);
  universe.killSwitchEngaged = false;
  universe.killSwitchReason = null;

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'kill_switch_cleared',
    actorUserId: actor.userId,
    decision: 'cleared',
  });

  return universe;
}

export function readUniverse(state: CivilizationState, actor: ActorContext): Universe {
  return requireMember(state, actor).universe;
}

export function assertOperableUniverse(state: CivilizationState, universeId: string) {
  assertUniverseOperable(requireUniverse(state, universeId));
}
