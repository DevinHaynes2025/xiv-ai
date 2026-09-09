import { refuse } from './errors';
import { assertAgentOperable, assertUniverseOperable } from './guardian';
import { requireActiveAgent } from './registry';
import {
  now,
  recordGovernanceEvent,
  requireAgent,
  requireMember,
  requireSupervisor,
  requireUniverse,
  visibleTo,
  type CivilizationState,
} from './store';
import { universeBudget } from './universe';
import type {
  ActorContext,
  AgentTask,
  TaskForce,
  TaskForceRecommendation,
  TaskStatus,
} from './types';

export function formTaskForce(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    name: string;
    purpose: string;
    humanExecutiveId: string;
    memberAgentIds: readonly string[];
  },
): TaskForce {
  requireMember(state, actor);
  assertUniverseOperable(requireUniverse(state, actor.universeId));

  for (const agentId of input.memberAgentIds) {
    requireActiveAgent(state, actor.universeId, agentId);
  }

  const taskForce: TaskForce = {
    id: state.nextId(),
    universeId: actor.universeId,
    name: input.name,
    purpose: input.purpose,
    status: 'active',
    humanExecutiveId: input.humanExecutiveId,
    memberAgentIds: [...input.memberAgentIds],
    recommendation: null,
    createdBy: actor.userId,
    createdAt: now(state),
    dissolvedAt: null,
    archivedAt: null,
  };
  state.taskForces.push(taskForce);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'task_force_formed',
    actorUserId: actor.userId,
    detail: { taskForceId: taskForce.id, name: taskForce.name, members: taskForce.memberAgentIds.length },
  });

  return taskForce;
}

export function recordRecommendation(
  state: CivilizationState,
  actor: ActorContext,
  input: { taskForceId: string; recommendation: TaskForceRecommendation },
): TaskForce {
  requireMember(state, actor);
  const taskForce = requireTaskForce(state, actor.universeId, input.taskForceId);
  taskForce.recommendation = input.recommendation;
  taskForce.status = 'reporting';
  return taskForce;
}

// A task force is temporary by construction. It dissolves when its assignment
// completes and its record is archived rather than deleted.
export function dissolveTaskForce(
  state: CivilizationState,
  actor: ActorContext,
  input: { taskForceId: string; archive?: boolean },
): TaskForce {
  requireMember(state, actor);
  const taskForce = requireTaskForce(state, actor.universeId, input.taskForceId);
  taskForce.status = input.archive === false ? 'dissolved' : 'archived';
  taskForce.dissolvedAt = now(state);
  if (input.archive !== false) taskForce.archivedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'task_force_dissolved',
    actorUserId: actor.userId,
    detail: { taskForceId: taskForce.id, status: taskForce.status },
  });

  return taskForce;
}

export function queueTask(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    title: string;
    description: string;
    taskForceId?: string | null;
    assignedAgentId?: string | null;
    priority?: number;
    requiresHumanApproval?: boolean;
    rollbackPlan?: string | null;
    costEstimateMicroUsd?: number;
  },
): AgentTask {
  requireMember(state, actor);
  assertUniverseOperable(requireUniverse(state, actor.universeId));

  const requiresHumanApproval = input.requiresHumanApproval ?? true;
  const rollbackPlan = input.rollbackPlan?.trim() ?? '';
  if (requiresHumanApproval && !rollbackPlan) {
    refuse('task_rollback_plan_missing', input.title);
  }

  if (input.assignedAgentId) {
    const agent = requireAgent(state, actor.universeId, input.assignedAgentId);
    assertAgentOperable(agent);
  }

  const budget = universeBudget(state, actor.universeId);
  const queued = state.tasks.filter(
    (item) => item.universeId === actor.universeId && QUEUE_OCCUPYING.has(item.status),
  ).length;
  if (queued + 1 > budget.maxQueuedTasks) {
    refuse('quota_task_queue_exceeded', `${queued + 1} > ${budget.maxQueuedTasks}`);
  }

  const costEstimate = Math.max(0, input.costEstimateMicroUsd ?? 0);
  if (budget.hardStop && budget.consumedCostMicroUsd + costEstimate > budget.maxCostMicroUsd) {
    refuse('quota_cost_exceeded', `${budget.consumedCostMicroUsd + costEstimate} > ${budget.maxCostMicroUsd}`);
  }

  const task: AgentTask = {
    id: state.nextId(),
    universeId: actor.universeId,
    taskForceId: input.taskForceId ?? null,
    assignedAgentId: input.assignedAgentId ?? null,
    requestedBy: actor.userId,
    title: input.title,
    description: input.description,
    status: 'queued',
    priority: input.priority ?? 100,
    requiresHumanApproval,
    approvedBy: null,
    approvedAt: null,
    rollbackPlan: rollbackPlan || null,
    rolledBackAt: null,
    costEstimateMicroUsd: costEstimate,
    costActualMicroUsd: 0,
    result: null,
    queuedAt: now(state),
    startedAt: null,
    completedAt: null,
    archivedAt: null,
  };
  state.tasks.push(task);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'task_queued',
    actorUserId: actor.userId,
    subjectAgentId: task.assignedAgentId,
    detail: {
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      requiresHumanApproval: task.requiresHumanApproval,
      costEstimateMicroUsd: task.costEstimateMicroUsd,
    },
  });

  return task;
}

const QUEUE_OCCUPYING = new Set<TaskStatus>(['queued', 'scheduled', 'awaiting_approval', 'active', 'blocked']);

export type SchedulerResult = {
  scheduled: AgentTask[];
  awaitingApproval: AgentTask[];
  deferred: AgentTask[];
  activeAgentCount: number;
  maxActiveAgents: number;
};

// Millions of logical agents -> registry -> scheduler -> task queue -> resource
// governor -> selected active agents. Nothing here starts a process; it decides
// which small set of identities is allowed to occupy runtime right now.
export function runScheduler(
  state: CivilizationState,
  actor: ActorContext,
  input?: { limit?: number },
): SchedulerResult {
  requireMember(state, actor);
  const universe = requireUniverse(state, actor.universeId);
  assertUniverseOperable(universe);

  const budget = universeBudget(state, actor.universeId);
  const limit = input?.limit ?? budget.maxActiveAgents;

  const queue = state.tasks
    .filter((item) => item.universeId === actor.universeId && item.status === 'queued')
    .sort((left, right) => left.priority - right.priority || left.queuedAt.localeCompare(right.queuedAt));

  const busyAgents = new Set(
    state.tasks
      .filter((item) => item.universeId === actor.universeId && item.status === 'active' && item.assignedAgentId)
      .map((item) => item.assignedAgentId as string),
  );

  const scheduled: AgentTask[] = [];
  const awaitingApproval: AgentTask[] = [];
  const deferred: AgentTask[] = [];

  for (const task of queue) {
    if (scheduled.length + awaitingApproval.length >= limit) {
      deferred.push(task);
      continue;
    }

    const agent = task.assignedAgentId
      ? state.agents.find((item) => item.id === task.assignedAgentId)
      : undefined;

    if (agent && (agent.lifecycleState !== 'active' || agent.killSwitchEngaged || busyAgents.has(agent.id))) {
      deferred.push(task);
      continue;
    }

    if (budget.hardStop && budget.consumedCostMicroUsd + task.costEstimateMicroUsd > budget.maxCostMicroUsd) {
      task.status = 'blocked';
      deferred.push(task);
      continue;
    }

    task.status = task.requiresHumanApproval ? 'awaiting_approval' : 'scheduled';
    if (agent) busyAgents.add(agent.id);
    if (task.requiresHumanApproval) awaitingApproval.push(task);
    else scheduled.push(task);

    recordGovernanceEvent(state, {
      universeId: actor.universeId,
      eventKind: 'task_scheduled',
      actorUserId: actor.userId,
      subjectAgentId: task.assignedAgentId,
      decision: task.status,
      detail: { taskId: task.id, priority: task.priority },
    });
  }

  return {
    scheduled,
    awaitingApproval,
    deferred,
    activeAgentCount: state.agents.filter(
      (item) => item.universeId === actor.universeId && item.lifecycleState === 'active',
    ).length,
    maxActiveAgents: budget.maxActiveAgents,
  };
}

export function approveTask(
  state: CivilizationState,
  actor: ActorContext,
  input: { taskId: string; note?: string },
): AgentTask {
  const { universe } = requireSupervisor(state, actor);
  assertUniverseOperable(universe);
  const task = requireTask(state, actor.universeId, input.taskId);

  if (task.requiresHumanApproval && !task.rollbackPlan) {
    refuse('task_rollback_plan_missing', task.id);
  }

  task.approvedBy = actor.userId;
  task.approvedAt = now(state);
  task.status = 'scheduled';

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'task_approved',
    actorUserId: actor.userId,
    subjectAgentId: task.assignedAgentId,
    decision: 'approved',
    detail: { taskId: task.id, note: input.note ?? null, rollbackPlan: task.rollbackPlan },
  });

  return task;
}

export function startTask(state: CivilizationState, actor: ActorContext, input: { taskId: string }): AgentTask {
  requireMember(state, actor);
  assertUniverseOperable(requireUniverse(state, actor.universeId));
  const task = requireTask(state, actor.universeId, input.taskId);

  if (task.requiresHumanApproval && !task.approvedBy) refuse('task_not_approved', task.id);
  if (task.assignedAgentId) requireActiveAgent(state, actor.universeId, task.assignedAgentId);

  task.status = 'active';
  task.startedAt = now(state);
  return task;
}

export function completeTask(
  state: CivilizationState,
  actor: ActorContext,
  input: { taskId: string; result: Record<string, unknown>; costActualMicroUsd?: number },
): AgentTask {
  requireMember(state, actor);
  const task = requireTask(state, actor.universeId, input.taskId);
  if (task.status !== 'active') refuse('task_not_active', task.status);

  const cost = Math.max(0, input.costActualMicroUsd ?? task.costEstimateMicroUsd);
  task.status = 'completed';
  task.completedAt = now(state);
  task.costActualMicroUsd = cost;
  task.result = input.result;

  const budget = universeBudget(state, actor.universeId);
  budget.consumedCostMicroUsd += cost;
  budget.consumedTasks += 1;

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'task_completed',
    actorUserId: actor.userId,
    subjectAgentId: task.assignedAgentId,
    decision: 'completed',
    costMicroUsd: cost,
    detail: {
      taskId: task.id,
      result: input.result,
      consumedCostMicroUsd: budget.consumedCostMicroUsd,
      maxCostMicroUsd: budget.maxCostMicroUsd,
    },
  });

  return task;
}

// Rollback is a first-class outcome, not an incident. The plan was recorded
// before approval, so undoing the work is a stated procedure rather than an
// improvised one.
export function rollbackTask(
  state: CivilizationState,
  actor: ActorContext,
  input: { taskId: string; reason: string },
): AgentTask {
  const { universe } = requireSupervisor(state, actor);
  const task = requireTask(state, universe.id, input.taskId);
  if (!task.rollbackPlan) refuse('task_rollback_plan_missing', task.id);

  task.status = 'rolled_back';
  task.rolledBackAt = now(state);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'task_rolled_back',
    actorUserId: actor.userId,
    subjectAgentId: task.assignedAgentId,
    decision: 'rolled_back',
    detail: { taskId: task.id, reason: input.reason, rollbackPlan: task.rollbackPlan },
  });

  return task;
}

export type CostTelemetry = {
  universeId: string;
  consumedCostMicroUsd: number;
  maxCostMicroUsd: number;
  remainingMicroUsd: number;
  utilization: number;
  consumedTasks: number;
  completedTasks: number;
  byAgent: { agentId: string; agentKey: string; costMicroUsd: number }[];
};

export function costTelemetry(state: CivilizationState, actor: ActorContext): CostTelemetry {
  requireMember(state, actor);
  const budget = universeBudget(state, actor.universeId);
  const tasks = state.tasks.filter((item) => item.universeId === actor.universeId);

  const byAgent = new Map<string, number>();
  for (const task of tasks) {
    if (!task.assignedAgentId) continue;
    byAgent.set(task.assignedAgentId, (byAgent.get(task.assignedAgentId) ?? 0) + task.costActualMicroUsd);
  }

  return {
    universeId: actor.universeId,
    consumedCostMicroUsd: budget.consumedCostMicroUsd,
    maxCostMicroUsd: budget.maxCostMicroUsd,
    remainingMicroUsd: Math.max(0, budget.maxCostMicroUsd - budget.consumedCostMicroUsd),
    utilization: budget.maxCostMicroUsd > 0 ? budget.consumedCostMicroUsd / budget.maxCostMicroUsd : 0,
    consumedTasks: budget.consumedTasks,
    completedTasks: tasks.filter((item) => item.status === 'completed').length,
    byAgent: [...byAgent.entries()].map(([agentId, costMicroUsd]) => ({
      agentId,
      agentKey: state.agents.find((item) => item.id === agentId)?.agentKey ?? 'unknown',
      costMicroUsd,
    })),
  };
}

export function listTasks(state: CivilizationState, actor: ActorContext): AgentTask[] {
  return visibleTo(state, actor, state.tasks);
}

export function listTaskForces(state: CivilizationState, actor: ActorContext): TaskForce[] {
  return visibleTo(state, actor, state.taskForces);
}

export function requireTask(state: CivilizationState, universeId: string, taskId: string): AgentTask {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) refuse('task_unknown', taskId);
  if (task.universeId !== universeId) refuse('tenancy_cross_universe_blocked', taskId);
  return task;
}

export function requireTaskForce(state: CivilizationState, universeId: string, taskForceId: string): TaskForce {
  const taskForce = state.taskForces.find((item) => item.id === taskForceId);
  if (!taskForce) refuse('task_force_unknown', taskForceId);
  if (taskForce.universeId !== universeId) refuse('tenancy_cross_universe_blocked', taskForceId);
  return taskForce;
}
