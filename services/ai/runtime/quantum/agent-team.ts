/**
 * 62L-EX8 — Quantum Agent Team runtime (extends Agent Mesh; not a second framework).
 *
 * Heartbeats, states, child spawn/deny, messaging, offline/provider waits,
 * learning gates. Compute via Hybrid Router contract only.
 */

import {
  EX8_LOCKS,
  QUANTUM_TEAM_ROLES,
  type AgentTeamState,
  type ComputeBudget,
  type DataClass,
  type ExecutionClass,
  type ExternalCostBudget,
  type MemoryBudget,
  type MessageType,
  type QuantumTeamAgentContract,
  type QuantumTeamRole,
  type TeamMessageEnvelope,
  type TimeBudget,
} from './agent-team-types.ts';

const HEARTBEAT_MAX_AGE_MS = 30_000;

export type Denied = { ok: false; reason: string; decision: 'DENIED' };
export type Ok<T> = { ok: true; value: T };

function isSubset<T extends string>(child: readonly T[], parent: readonly T[]): boolean {
  const set = new Set(parent);
  return child.every((x) => set.has(x));
}

function budgetLte(child: ComputeBudget, parent: ComputeBudget): boolean {
  return (
    child.maxCpuMs <= parent.maxCpuMs &&
    child.maxGpuMs <= parent.maxGpuMs &&
    child.maxNpuMs <= parent.maxNpuMs &&
    child.maxQpuShots <= parent.maxQpuShots
  );
}

function parseTime(iso: string): number {
  return Date.parse(iso);
}

export function isHeartbeatActive(
  agent: QuantumTeamAgentContract,
  nowIso: string,
  maxAgeMs: number = HEARTBEAT_MAX_AGE_MS,
): boolean {
  if (!agent.lastHeartbeatAt) return false;
  const age = parseTime(nowIso) - parseTime(agent.lastHeartbeatAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeMs;
}

export type RegisterAgentInput = {
  agentId: string;
  agentRole: QuantumTeamRole;
  missionId: string;
  taskId: string;
  parentTaskId?: string | null;
  tenantId: string;
  universeId: string;
  allowedTools?: readonly string[];
  allowedDataClasses: readonly DataClass[];
  allowedExecutionClasses: readonly ExecutionClass[];
  computeBudget: ComputeBudget;
  memoryBudget: MemoryBudget;
  timeBudget: TimeBudget;
  externalCostBudget?: ExternalCostBudget;
  dependencies?: readonly string[];
  expectedOutput: string;
  evidenceRequirements: readonly string[];
  checkpointPolicy?: string;
  returnPath: string;
  createdAt: string;
  expiresAt: string;
  webOnline?: boolean;
  physicalQpuOnline?: boolean;
  hybridRouterAuthorized?: boolean;
  poweredOff?: boolean;
};

export function registerQuantumTeamAgent(
  input: RegisterAgentInput,
): Ok<QuantumTeamAgentContract> | Denied {
  if (!(QUANTUM_TEAM_ROLES as readonly string[]).includes(input.agentRole)) {
    return { ok: false, reason: 'UNKNOWN_MESH_ROLE', decision: 'DENIED' };
  }
  if (EX8_LOCKS.SECOND_AGENT_FRAMEWORK) {
    return { ok: false, reason: 'SECOND_AGENT_FRAMEWORK_LOCK', decision: 'DENIED' };
  }
  if (EX8_LOCKS.SPAWN_UNCONTROLLED_AGENTS) {
    return { ok: false, reason: 'UNCONTROLLED_AGENT_LOCK', decision: 'DENIED' };
  }

  const poweredOff = input.poweredOff === true;
  const expired = parseTime(input.expiresAt) <= parseTime(input.createdAt);
  let status: AgentTeamState = 'REGISTERED';
  if (poweredOff) status = 'OFFLINE_STOPPED';
  else if (expired) status = 'EXPIRED';
  else status = 'LOCAL_READY';

  const agent: QuantumTeamAgentContract = {
    agentId: input.agentId,
    agentRole: input.agentRole,
    missionId: input.missionId,
    taskId: input.taskId,
    parentTaskId: input.parentTaskId ?? null,
    tenantId: input.tenantId,
    universeId: input.universeId,
    allowedTools: input.allowedTools ?? [],
    allowedDataClasses: input.allowedDataClasses,
    allowedExecutionClasses: input.allowedExecutionClasses,
    computeBudget: { ...input.computeBudget },
    memoryBudget: { ...input.memoryBudget },
    timeBudget: { ...input.timeBudget },
    externalCostBudget: input.externalCostBudget ?? {
      maxUsd: 0,
      cloudPurchaseAllowed: false,
      qpuPurchaseAllowed: false,
    },
    dependencies: input.dependencies ?? [],
    expectedOutput: input.expectedOutput,
    evidenceRequirements: input.evidenceRequirements,
    checkpointPolicy: input.checkpointPolicy ?? 'structured-checkpoint-only',
    returnPath: input.returnPath,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    status,
    lastHeartbeatAt: null,
    poweredOff,
    webOnline: input.webOnline ?? false,
    physicalQpuOnline: input.physicalQpuOnline ?? false,
    hybridRouterAuthorized: input.hybridRouterAuthorized ?? true,
    permissionsFrozen: true,
    hiddenCotPersisted: false,
    secondFramework: false,
    l4Enabled: false,
  };

  return { ok: true, value: agent };
}

export function recordHeartbeat(
  agent: QuantumTeamAgentContract,
  nowIso: string,
): QuantumTeamAgentContract {
  if (agent.poweredOff || agent.status === 'OFFLINE_STOPPED') {
    return { ...agent, status: 'OFFLINE_STOPPED', lastHeartbeatAt: null };
  }
  if (parseTime(agent.expiresAt) <= parseTime(nowIso)) {
    return { ...agent, status: 'EXPIRED', lastHeartbeatAt: nowIso };
  }
  return { ...agent, lastHeartbeatAt: nowIso };
}

/**
 * RUNNING_VERIFIED requires an active heartbeat.
 * Missing heartbeat → not RUNNING_VERIFIED (falls back to QUEUED/LOCAL_READY/WAITING_*).
 */
export function transitionAgentState(
  agent: QuantumTeamAgentContract,
  desired: AgentTeamState,
  nowIso: string,
): QuantumTeamAgentContract {
  if (agent.poweredOff) {
    return { ...agent, status: 'OFFLINE_STOPPED' };
  }
  if (parseTime(agent.expiresAt) <= parseTime(nowIso)) {
    return { ...agent, status: 'EXPIRED' };
  }
  if (desired === 'RUNNING_VERIFIED') {
    if (!isHeartbeatActive(agent, nowIso)) {
      return {
        ...agent,
        status: agent.status === 'QUEUED' ? 'QUEUED' : 'LOCAL_READY',
      };
    }
    if (!agent.hybridRouterAuthorized || EX8_LOCKS.DIRECT_ARBITRARY_HARDWARE) {
      return { ...agent, status: 'WAITING_NODE' };
    }
    return { ...agent, status: 'RUNNING_VERIFIED' };
  }
  if (desired === 'WAITING_DATA' || desired === 'WAITING_PROVIDER') {
    return { ...agent, status: desired };
  }
  return { ...agent, status: desired };
}

export function powerOffAgent(agent: QuantumTeamAgentContract): QuantumTeamAgentContract {
  return {
    ...agent,
    poweredOff: true,
    status: 'OFFLINE_STOPPED',
    lastHeartbeatAt: null,
  };
}

export function stopExpiredAgent(
  agent: QuantumTeamAgentContract,
  nowIso: string,
): QuantumTeamAgentContract {
  if (parseTime(agent.expiresAt) <= parseTime(nowIso)) {
    return { ...agent, status: 'EXPIRED' };
  }
  return agent;
}

/** Web offline → WAITING_DATA when external data required. */
export function evaluateWebDependency(
  agent: QuantumTeamAgentContract,
  requiresExternalWebData: boolean,
): QuantumTeamAgentContract {
  if (requiresExternalWebData && !agent.webOnline) {
    return { ...agent, status: 'WAITING_DATA' };
  }
  return agent;
}

/** Physical QPU offline → WAITING_PROVIDER (never fabricate). */
export function evaluatePhysicalQpuDependency(
  agent: QuantumTeamAgentContract,
  requiresPhysicalQpu: boolean,
): QuantumTeamAgentContract {
  if (requiresPhysicalQpu && !agent.physicalQpuOnline) {
    return { ...agent, status: 'WAITING_PROVIDER' };
  }
  return agent;
}

export type ChildSpawnInput = {
  childAgentId: string;
  childTaskId: string;
  agentRole: QuantumTeamRole;
  allowedTools?: readonly string[];
  allowedDataClasses: readonly DataClass[];
  allowedExecutionClasses: readonly ExecutionClass[];
  computeBudget: ComputeBudget;
  memoryBudget?: MemoryBudget;
  timeBudget?: TimeBudget;
  externalCostBudget?: ExternalCostBudget;
  dependencies?: readonly string[];
  expectedOutput: string;
  evidenceRequirements: readonly string[];
  returnPath: string;
  expiresAt: string;
  /** Attempted expansions (tests). */
  tenantId?: string;
  universeId?: string;
};

export function spawnChildAgent(
  parent: QuantumTeamAgentContract,
  child: ChildSpawnInput,
  nowIso: string,
): Ok<QuantumTeamAgentContract> | Denied {
  if (
    parent.status === 'REVOKED' ||
    parent.status === 'EXPIRED' ||
    parent.status === 'OFFLINE_STOPPED' ||
    parent.status === 'FAILED'
  ) {
    return { ok: false, reason: `PARENT_STATE_${parent.status}`, decision: 'DENIED' };
  }
  if (parseTime(parent.expiresAt) <= parseTime(nowIso)) {
    return { ok: false, reason: 'PARENT_EXPIRED', decision: 'DENIED' };
  }

  const tenantId = child.tenantId ?? parent.tenantId;
  const universeId = child.universeId ?? parent.universeId;
  if (tenantId !== parent.tenantId) {
    return { ok: false, reason: 'CROSS_TENANT_CHILD_DENIED', decision: 'DENIED' };
  }
  if (universeId !== parent.universeId) {
    return { ok: false, reason: 'CROSS_UNIVERSE_CHILD_DENIED', decision: 'DENIED' };
  }
  if (!budgetLte(child.computeBudget, parent.computeBudget)) {
    return {
      ok: false,
      reason: 'CHILD_COMPUTE_BUDGET_EXPANSION_DENIED',
      decision: 'DENIED',
    };
  }
  if (EX8_LOCKS.CHILD_COMPUTE_BUDGET_EXPANSION) {
    return { ok: false, reason: 'CHILD_COMPUTE_BUDGET_EXPANSION_LOCK', decision: 'DENIED' };
  }
  if (!isSubset(child.allowedExecutionClasses, parent.allowedExecutionClasses)) {
    return {
      ok: false,
      reason: 'CHILD_PERMISSION_EXPANSION_DENIED',
      decision: 'DENIED',
    };
  }
  if (!isSubset(child.allowedDataClasses, parent.allowedDataClasses)) {
    return {
      ok: false,
      reason: 'CHILD_DATA_PERMISSION_EXPANSION_DENIED',
      decision: 'DENIED',
    };
  }
  if (child.allowedTools && !isSubset(child.allowedTools, parent.allowedTools)) {
    return {
      ok: false,
      reason: 'CHILD_TOOL_PERMISSION_EXPANSION_DENIED',
      decision: 'DENIED',
    };
  }
  if (EX8_LOCKS.CHILD_PERMISSION_EXPANSION || EX8_LOCKS.BROADEN_PERMISSIONS) {
    return { ok: false, reason: 'CHILD_PERMISSION_EXPANSION_LOCK', decision: 'DENIED' };
  }
  const memoryBudget = child.memoryBudget ?? parent.memoryBudget;
  if (memoryBudget.maxMb > parent.memoryBudget.maxMb) {
    return {
      ok: false,
      reason: 'CHILD_MEMORY_BUDGET_EXPANSION_DENIED',
      decision: 'DENIED',
    };
  }
  const timeBudget = child.timeBudget ?? parent.timeBudget;
  if (timeBudget.maxWallClockMs > parent.timeBudget.maxWallClockMs) {
    return {
      ok: false,
      reason: 'CHILD_TIME_BUDGET_EXPANSION_DENIED',
      decision: 'DENIED',
    };
  }
  if (parseTime(child.expiresAt) > parseTime(parent.expiresAt)) {
    return { ok: false, reason: 'CHILD_EXPIRY_INVALID', decision: 'DENIED' };
  }

  return registerQuantumTeamAgent({
    agentId: child.childAgentId,
    agentRole: child.agentRole,
    missionId: parent.missionId,
    taskId: child.childTaskId,
    parentTaskId: parent.taskId,
    tenantId: parent.tenantId,
    universeId: parent.universeId,
    allowedTools: child.allowedTools ?? parent.allowedTools,
    allowedDataClasses: child.allowedDataClasses,
    allowedExecutionClasses: child.allowedExecutionClasses,
    computeBudget: child.computeBudget,
    memoryBudget,
    timeBudget,
    externalCostBudget: child.externalCostBudget ?? {
      maxUsd: 0,
      cloudPurchaseAllowed: false,
      qpuPurchaseAllowed: false,
    },
    dependencies: child.dependencies,
    expectedOutput: child.expectedOutput,
    evidenceRequirements: child.evidenceRequirements,
    returnPath: child.returnPath,
    createdAt: nowIso,
    expiresAt: child.expiresAt,
    webOnline: parent.webOnline,
    physicalQpuOnline: parent.physicalQpuOnline,
    hybridRouterAuthorized: parent.hybridRouterAuthorized,
  });
}

export function sendTeamMessage(input: {
  messageId: string;
  messageType: MessageType;
  from: QuantumTeamAgentContract;
  to: QuantumTeamAgentContract;
  payload: Readonly<Record<string, unknown>>;
  createdAt: string;
}): TeamMessageEnvelope {
  if (input.from.tenantId !== input.to.tenantId) {
    return {
      messageId: input.messageId,
      messageType: input.messageType,
      missionId: input.from.missionId,
      taskId: input.from.taskId,
      fromAgentId: input.from.agentId,
      toAgentId: input.to.agentId,
      tenantId: input.from.tenantId,
      universeId: input.from.universeId,
      payload: {},
      hiddenCot: false,
      createdAt: input.createdAt,
      status: 'DENIED',
      denyReason: 'CROSS_TENANT_MESSAGE_DENIED',
    };
  }
  if (input.from.universeId !== input.to.universeId) {
    return {
      messageId: input.messageId,
      messageType: input.messageType,
      missionId: input.from.missionId,
      taskId: input.from.taskId,
      fromAgentId: input.from.agentId,
      toAgentId: input.to.agentId,
      tenantId: input.from.tenantId,
      universeId: input.from.universeId,
      payload: {},
      hiddenCot: false,
      createdAt: input.createdAt,
      status: 'DENIED',
      denyReason: 'CROSS_UNIVERSE_MESSAGE_DENIED',
    };
  }
  if (EX8_LOCKS.CROSS_TENANT_MESSAGE || EX8_LOCKS.CROSS_UNIVERSE_MESSAGE) {
    return {
      messageId: input.messageId,
      messageType: input.messageType,
      missionId: input.from.missionId,
      taskId: input.from.taskId,
      fromAgentId: input.from.agentId,
      toAgentId: input.to.agentId,
      tenantId: input.from.tenantId,
      universeId: input.from.universeId,
      payload: {},
      hiddenCot: false,
      createdAt: input.createdAt,
      status: 'DENIED',
      denyReason: 'MESSAGE_ISOLATION_LOCK',
    };
  }
  if (EX8_LOCKS.HIDDEN_COT) {
    return {
      messageId: input.messageId,
      messageType: input.messageType,
      missionId: input.from.missionId,
      taskId: input.from.taskId,
      fromAgentId: input.from.agentId,
      toAgentId: input.to.agentId,
      tenantId: input.from.tenantId,
      universeId: input.from.universeId,
      payload: {},
      hiddenCot: false,
      createdAt: input.createdAt,
      status: 'DENIED',
      denyReason: 'HIDDEN_COT_LOCK',
    };
  }

  // Strip any attempted CoT fields from payload.
  const cleaned: Record<string, unknown> = { ...input.payload };
  delete cleaned.chainOfThought;
  delete cleaned.hiddenCot;
  delete cleaned.cot;
  delete cleaned.privateReasoning;

  return {
    messageId: input.messageId,
    messageType: input.messageType,
    missionId: input.from.missionId,
    taskId: input.from.taskId,
    fromAgentId: input.from.agentId,
    toAgentId: input.to.agentId,
    tenantId: input.from.tenantId,
    universeId: input.from.universeId,
    payload: cleaned,
    hiddenCot: false,
    createdAt: input.createdAt,
    status: 'ACCEPTED',
    denyReason: null,
  };
}

/**
 * LEARNING may update ranking/confidence/retest — never permissions /
 * Guardian / RLS / financial / production authority.
 */
export function applyLearningUpdate(
  agent: QuantumTeamAgentContract,
  lesson: {
    rankingDelta?: number;
    confidenceDelta?: number;
    retestRecommended?: boolean;
    /** Hostile attempts — must be ignored. */
    grantPermissions?: readonly string[];
    weakenGuardian?: boolean;
    weakenRls?: boolean;
    grantFinancialAuthority?: boolean;
    grantProductionAuthority?: boolean;
  },
): {
  agent: QuantumTeamAgentContract;
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
  financialAuthorityChanged: false;
  productionAuthorityChanged: false;
  deniedAttempts: readonly string[];
  rankingDelta: number | null;
  confidenceDelta: number | null;
  retestRecommended: boolean;
} {
  const deniedAttempts: string[] = [];
  if (lesson.grantPermissions && lesson.grantPermissions.length > 0) {
    deniedAttempts.push('LEARNING_PERMISSION_CHANGE_DENIED');
  }
  if (lesson.weakenGuardian) deniedAttempts.push('LEARNING_GUARDIAN_CHANGE_DENIED');
  if (lesson.weakenRls) deniedAttempts.push('LEARNING_RLS_CHANGE_DENIED');
  if (lesson.grantFinancialAuthority) {
    deniedAttempts.push('LEARNING_FINANCIAL_AUTHORITY_CHANGE_DENIED');
  }
  if (lesson.grantProductionAuthority) {
    deniedAttempts.push('LEARNING_PRODUCTION_AUTHORITY_CHANGE_DENIED');
  }
  if (EX8_LOCKS.LEARNING_CHANGES_PERMISSIONS) {
    deniedAttempts.push('LEARNING_PERMISSIONS_LOCK');
  }

  // Agent permissions remain frozen — never expand tools/data/execution.
  return {
    agent: {
      ...agent,
      permissionsFrozen: true,
      allowedTools: agent.allowedTools,
      allowedDataClasses: agent.allowedDataClasses,
      allowedExecutionClasses: agent.allowedExecutionClasses,
    },
    permissionsChanged: false,
    guardianChanged: false,
    rlsChanged: false,
    financialAuthorityChanged: false,
    productionAuthorityChanged: false,
    deniedAttempts,
    rankingDelta: lesson.rankingDelta ?? null,
    confidenceDelta: lesson.confidenceDelta ?? null,
    retestRecommended: lesson.retestRecommended === true,
  };
}

/** Compute must go through Hybrid Router — no direct arbitrary hardware. */
export function requestLocalCompute(input: {
  agent: QuantumTeamAgentContract;
  requestedClass: ExecutionClass;
  bypassHybridRouter?: boolean;
}): Ok<{ routedVia: 'HYBRID_ROUTER'; executionClass: ExecutionClass }> | Denied {
  if (input.bypassHybridRouter || EX8_LOCKS.DIRECT_ARBITRARY_HARDWARE) {
    return {
      ok: false,
      reason: 'DIRECT_ARBITRARY_HARDWARE_DENIED',
      decision: 'DENIED',
    };
  }
  if (!input.agent.hybridRouterAuthorized) {
    return { ok: false, reason: 'HYBRID_ROUTER_UNAUTHORIZED', decision: 'DENIED' };
  }
  if (!input.agent.allowedExecutionClasses.includes(input.requestedClass)) {
    return { ok: false, reason: 'EXECUTION_CLASS_NOT_ALLOWED', decision: 'DENIED' };
  }
  if (input.requestedClass === 'PHYSICAL_QPU' && !input.agent.physicalQpuOnline) {
    return { ok: false, reason: 'WAITING_PROVIDER', decision: 'DENIED' };
  }
  return {
    ok: true,
    value: { routedVia: 'HYBRID_ROUTER', executionClass: input.requestedClass },
  };
}
