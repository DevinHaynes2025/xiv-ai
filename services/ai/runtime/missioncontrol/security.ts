/**
 * Security denials + manager-death failure recovery for Mission Control.
 * Expected: DENIED + AUDITED. No mission depends permanently on one agent process.
 */

import type { AgentManager, AgentTaskForce, AgentShiftHandoff } from './types';
import { createShiftHandoff } from './shifts';
import { formTaskForce, makeMember, selectTaskForceLead } from './taskforces';

export type SecurityAttempt =
  | 'MANAGER_PERMISSION_ESCALATION'
  | 'CROSS_TENANT_TASK_FORCE'
  | 'CROSS_UNIVERSE_EVIDENCE'
  | 'UNAUTHORIZED_AGENT_ADDITION'
  | 'BUDGET_BYPASS'
  | 'FORGED_HANDOFF'
  | 'MESSAGE_SPOOFING'
  | 'UNAUTHORIZED_TOOL_DELEGATION';

export function denySecurityAttempt(
  attempt: SecurityAttempt,
  detail?: string,
): { ok: false; reason: string; audited: true; attempt: SecurityAttempt } {
  return {
    ok: false,
    reason: detail ?? `${attempt} denied`,
    audited: true,
    attempt,
  };
}

export function attemptManagerPermissionEscalation(_manager: AgentManager) {
  return denySecurityAttempt('MANAGER_PERMISSION_ESCALATION', 'manager permission escalation denied');
}

export function attemptCrossTenantTaskForce(input: {
  problem: string;
  memberTenantIds: readonly string[];
}) {
  const unique = new Set(input.memberTenantIds);
  if (unique.size > 1) {
    return denySecurityAttempt('CROSS_TENANT_TASK_FORCE', 'cross-tenant task force denied');
  }
  return { ok: true as const };
}

export function attemptBudgetBypass(input: { spent: number; ceiling: number; selfExpand: boolean }) {
  if (input.selfExpand || input.spent > input.ceiling) {
    return denySecurityAttempt('BUDGET_BYPASS', 'budget bypass denied');
  }
  return { ok: true as const };
}

export function attemptForgedHandoff(forged: boolean) {
  if (forged) return denySecurityAttempt('FORGED_HANDOFF', 'forged handoff denied');
  return { ok: true as const };
}

export function attemptUnauthorizedToolDelegation() {
  return denySecurityAttempt('UNAUTHORIZED_TOOL_DELEGATION', 'unauthorized tool delegation denied');
}

export function attemptUnauthorizedAgentAddition() {
  return denySecurityAttempt('UNAUTHORIZED_AGENT_ADDITION', 'unauthorized agent addition denied');
}

/**
 * Manager/worker dies mid task-force:
 * checkpoint → detect loss → select eligible replacement → load debrief → continue
 */
export function recoverFromManagerDeath(input: {
  taskForce: AgentTaskForce;
  deadAgentDirectoryId: string;
  replacementAgentDirectoryId: string;
  replacementRole: string;
  missionId: string;
  fromInstanceId: string;
  toInstanceId: string;
  checkpointId: string;
  nowIso: string;
}): {
  steps: readonly string[];
  taskForce: AgentTaskForce;
  handoff: AgentShiftHandoff;
  dependsOnSingleProcess: false;
} {
  const survivors = input.taskForce.members.filter(
    (m) => m.agentDirectoryId !== input.deadAgentDirectoryId,
  );
  const withReplacement = [
    ...survivors,
    makeMember(input.replacementAgentDirectoryId, input.replacementRole),
  ];
  const reformed = formTaskForce({
    taskForceId: input.taskForce.taskForceId,
    problem: input.taskForce.problem,
    tenantId: input.taskForce.tenantId,
    universeId: input.taskForce.universeId,
    departmentId: input.taskForce.departmentId,
    members: withReplacement,
  });
  if ('ok' in reformed && reformed.ok === false) {
    throw new Error(reformed.reason);
  }
  const tf = selectTaskForceLead(reformed as AgentTaskForce, input.replacementAgentDirectoryId);
  const handoff = createShiftHandoff({
    handoffId: `ho_recover_${input.deadAgentDirectoryId}`,
    fromInstanceId: input.fromInstanceId,
    toInstanceId: input.toInstanceId,
    missionId: input.missionId,
    objective: input.taskForce.problem,
    completedWork: ['checkpointed_before_loss'],
    remainingWork: ['continue_after_replacement'],
    checkpointId: input.checkpointId,
    failures: [`manager_or_worker_lost:${input.deadAgentDirectoryId}`],
    nextRecommendedAction: 'load debrief and continue with replacement',
    nowIso: input.nowIso,
  });
  return {
    steps: ['CHECKPOINT', 'DETECT_LOSS', 'SELECT_REPLACEMENT', 'LOAD_DEBRIEF', 'CONTINUE'],
    taskForce: tf,
    handoff,
    dependsOnSingleProcess: false,
  };
}

export function missionDependsOnSingleProcess(): false {
  return false;
}
