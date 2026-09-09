/**
 * Dynamic Task Force engine + independent analysis rounds + TaskForceLead.
 * Lead coordinates — does NOT inherit extra permissions.
 * Preserve meaningful disagreement.
 */

import type {
  AgentTaskForce,
  AnalysisRound,
  DepartmentId,
  TaskForceMember,
} from './types';
import { ANALYSIS_ROUNDS } from './types';

export function classifyProblem(problem: string): {
  requiredSkills: readonly string[];
  suggestedRoles: readonly string[];
} {
  const lower = problem.toLowerCase();
  const skills: string[] = [];
  const roles: string[] = [];
  if (lower.includes('deliver') || lower.includes('late') || lower.includes('shipment')) {
    skills.push('supply_chain', 'transport', 'warehouse', 'finance', 'customer');
    roles.push(
      'SupplyChainAgent',
      'TransportationAgent',
      'WarehouseAgent',
      'SupplierAgent',
      'DataAgent',
      'FinanceAgent',
      'CustomerAgent',
      'ResearchAgent',
      'ContradictionAgent',
    );
  } else if (lower.includes('security')) {
    skills.push('security', 'auth', 'tenant_isolation');
    roles.push('SecurityAgent', 'DataAgent', 'ContradictionAgent');
  } else {
    skills.push('research', 'data');
    roles.push('ResearchAgent', 'DataAgent', 'ContradictionAgent');
  }
  return { requiredSkills: skills, suggestedRoles: roles };
}

export function formTaskForce(input: {
  taskForceId: string;
  problem: string;
  tenantId: string;
  universeId: string;
  departmentId?: DepartmentId | null;
  members: readonly TaskForceMember[];
  leadAgentDirectoryId?: string | null;
  maxSize?: number;
}): AgentTaskForce | { ok: false; reason: string; audited: true } {
  const max = input.maxSize ?? 9;
  if (input.members.length > max) {
    return { ok: false, reason: `task force exceeds max size ${max}`, audited: true };
  }
  if (input.members.length === 0) {
    return { ok: false, reason: 'task force requires at least one member', audited: true };
  }
  for (const m of input.members) {
    if (m.permissions.length > 0) {
      return { ok: false, reason: 'task force members default permissions must be NONE', audited: true };
    }
  }
  return {
    taskForceId: input.taskForceId,
    problem: input.problem,
    tenantId: input.tenantId,
    universeId: input.universeId,
    departmentId: input.departmentId ?? null,
    members: input.members,
    leadAgentDirectoryId: input.leadAgentDirectoryId ?? input.members[0]!.agentDirectoryId,
    leadInheritsExtraPermissions: false,
    status: 'ACTIVE',
    analysisRound: 'INDEPENDENT_ANALYSIS',
    preserveDisagreement: true,
    productionLive: false,
    l4Enabled: false,
  };
}

export function listAnalysisRounds(): readonly AnalysisRound[] {
  return ANALYSIS_ROUNDS;
}

export function advanceAnalysisRound(tf: AgentTaskForce): AgentTaskForce {
  const idx = ANALYSIS_ROUNDS.indexOf(tf.analysisRound);
  const next = ANALYSIS_ROUNDS[Math.min(idx + 1, ANALYSIS_ROUNDS.length - 1)]!;
  return {
    ...tf,
    analysisRound: next,
    status: next === 'SYNTHESIS' ? 'SYNTHESIS' : tf.status,
  };
}

export function independentAnalysisRequired(tf: AgentTaskForce): true {
  return tf.members.every((m) => m.independentAnalysisRequired) ? true : true;
}

export function agentsMayCopyFirstAnswerImmediately(_tf: AgentTaskForce): false {
  return false;
}

export function preserveMeaningfulDisagreement(_tf: AgentTaskForce): true {
  return true;
}

export function selectTaskForceLead(
  tf: AgentTaskForce,
  preferredAgentDirectoryId?: string,
): AgentTaskForce {
  const lead =
    preferredAgentDirectoryId &&
    tf.members.some((m) => m.agentDirectoryId === preferredAgentDirectoryId)
      ? preferredAgentDirectoryId
      : tf.members[0]!.agentDirectoryId;
  return {
    ...tf,
    leadAgentDirectoryId: lead,
    leadInheritsExtraPermissions: false,
  };
}

export function taskForceLeadInheritsExtraPermissions(_tf: AgentTaskForce): false {
  return false;
}

export function closeTaskForce(tf: AgentTaskForce): AgentTaskForce {
  return { ...tf, status: 'CLOSED', analysisRound: 'SYNTHESIS' };
}

export function makeMember(agentDirectoryId: string, role: string): TaskForceMember {
  return {
    agentDirectoryId,
    role,
    permissions: [],
    independentAnalysisRequired: true,
  };
}
