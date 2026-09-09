/**
 * XIV Adaptive Agent Foundry (62I).
 *
 * This module creates only in-memory, bounded logical agent definitions. It
 * never provisions infrastructure, installs tools, issues credentials, or
 * broadens an agent's authority.
 */

export const L4_AUTONOMY_ENABLED = false;
export const AUTO_AGENT_REPLICATION = false;
export const AUTO_PERMISSION_EXPANSION = false;
export const AUTO_TOOL_INSTALL = false;
export const AUTO_MODEL_ENABLE = false;

export type FoundryAgentStatus =
  | 'registered'
  | 'proposed'
  | 'validated'
  | 'active'
  | 'working'
  | 'evaluating'
  | 'hibernating'
  | 'expired'
  | 'retired';

export type CapabilityAgent = {
  id: string;
  organizationId: string;
  universeId: string;
  capabilities: readonly string[];
  allowedTools: readonly string[];
  allowedModels: readonly string[];
  classificationCeiling: number;
  status: FoundryAgentStatus;
  ephemeral: boolean;
  expiresAt?: string;
};

export type AgentBlueprint = {
  id: string;
  role: string;
  purpose: string;
  requiredCapabilities: readonly string[];
  permittedTools: readonly string[];
  permittedModels: readonly string[];
  classificationCeiling: number;
  defaultLifetimeMs: number;
  maximumTasks: number;
};

export type PopulationLimits = {
  maxNewAgentsPerTask: number;
  maxNewAgentsPerWorkflow: number;
  maxNewAgentsPerUniverse: number;
  maxCreationDepth: number;
  maxAgentLifetimeMs: number;
  maxIdleLifetimeMs: number;
  maxTotalActiveAgents: number;
  maxAgentCreationCost: number;
};

export type AgentCreationRequest = {
  proposedAgentId: string;
  organizationId: string;
  universeId: string;
  parentRequestId: string;
  requestingAgentId?: string;
  purpose: string;
  requiredCapabilities: readonly string[];
  allowedTools: readonly string[];
  allowedModels: readonly string[];
  classificationCeiling: number;
  maximumLifetimeMs: number;
  maximumTasks: number;
  estimatedCreationCost: number;
  creationDepth: number;
  newAgentsForTask: number;
  newAgentsForWorkflow: number;
  createdBy: string;
  approvalRequirement: 'guardian_and_human';
  expirationPolicy: 'hibernate_then_expire';
};

export type AgentLineage = {
  originRequestId: string;
  blueprintId: string;
  requestingAgentId?: string;
  approvingPolicy: string;
  organizationId: string;
  universeId: string;
  creationReason: string;
  capabilityGap: readonly string[];
  modelConfiguration: readonly string[];
  toolGrants: readonly string[];
  createdAt: string;
  expiresAt: string;
};

export type FoundryDecision =
  | { kind: 'reuse'; agent: CapabilityAgent }
  | { kind: 'proposed'; request: AgentCreationRequest; blueprint: AgentBlueprint }
  | { kind: 'denied'; reason: string };

export type EphemeralAgent = CapabilityAgent & {
  status: 'active' | 'hibernating' | 'expired' | 'retired';
  maximumTasks: number;
  completedTasks: number;
  lineage: AgentLineage;
};

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function subset(values: readonly string[], allowed: readonly string[]) {
  const permitted = new Set(allowed);
  return values.every((value) => permitted.has(value));
}

function containsAll(values: readonly string[], required: readonly string[]) {
  const offered = new Set(values);
  return required.every((requiredCapability) => offered.has(requiredCapability));
}

function validPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function discoverCapability(
  agents: readonly CapabilityAgent[],
  input: Pick<AgentCreationRequest, 'organizationId' | 'universeId' | 'requiredCapabilities' | 'classificationCeiling'>,
) {
  const now = Date.now();
  return agents.find(
    (agent) =>
      agent.organizationId === input.organizationId &&
      agent.universeId === input.universeId &&
      agent.classificationCeiling >= input.classificationCeiling &&
      (agent.status === 'registered' || agent.status === 'active' || agent.status === 'hibernating') &&
      (!agent.expiresAt || Date.parse(agent.expiresAt) > now) &&
      containsAll(agent.capabilities, input.requiredCapabilities),
  );
}

export function validateAgentCreation(
  request: AgentCreationRequest,
  blueprint: AgentBlueprint | undefined,
  existingAgents: readonly CapabilityAgent[],
  limits: PopulationLimits,
): FoundryDecision {
  const existing = discoverCapability(existingAgents, request);
  if (existing) return { kind: 'reuse', agent: existing };
  if (!blueprint) return { kind: 'denied', reason: 'blueprint_not_registered' };
  if (request.approvalRequirement !== 'guardian_and_human') return { kind: 'denied', reason: 'guardian_human_approval_required' };
  if (request.expirationPolicy !== 'hibernate_then_expire') return { kind: 'denied', reason: 'bounded_expiration_policy_required' };
  if (!request.purpose.trim() || !request.parentRequestId.trim() || !request.createdBy.trim()) {
    return { kind: 'denied', reason: 'creation_contract_incomplete' };
  }
  if (!validPositiveInteger(request.maximumLifetimeMs) || !validPositiveInteger(request.maximumTasks)) {
    return { kind: 'denied', reason: 'invalid_lifetime_or_task_bound' };
  }
  if (request.creationDepth > limits.maxCreationDepth) return { kind: 'denied', reason: 'creation_depth_exceeded' };
  if (request.newAgentsForTask > limits.maxNewAgentsPerTask) return { kind: 'denied', reason: 'task_creation_limit_exceeded' };
  if (request.newAgentsForWorkflow > limits.maxNewAgentsPerWorkflow) return { kind: 'denied', reason: 'workflow_creation_limit_exceeded' };
  if (request.maximumLifetimeMs > limits.maxAgentLifetimeMs) return { kind: 'denied', reason: 'lifetime_limit_exceeded' };
  if (request.estimatedCreationCost > limits.maxAgentCreationCost) return { kind: 'denied', reason: 'creation_budget_exceeded' };
  if (request.classificationCeiling > blueprint.classificationCeiling) return { kind: 'denied', reason: 'classification_ceiling_exceeded' };
  if (!containsAll(blueprint.requiredCapabilities, request.requiredCapabilities)) {
    return { kind: 'denied', reason: 'capabilities_not_in_blueprint' };
  }
  if (!subset(request.allowedTools, blueprint.permittedTools)) return { kind: 'denied', reason: 'tool_grant_not_in_blueprint' };
  if (!subset(request.allowedModels, blueprint.permittedModels)) return { kind: 'denied', reason: 'model_grant_not_in_blueprint' };

  const universeAgents = existingAgents.filter(
    (agent) => agent.organizationId === request.organizationId && agent.universeId === request.universeId && agent.ephemeral,
  );
  const activeAgents = existingAgents.filter((agent) => agent.status === 'active' || agent.status === 'working');
  if (universeAgents.length >= limits.maxNewAgentsPerUniverse) return { kind: 'denied', reason: 'universe_population_limit_exceeded' };
  if (activeAgents.length >= limits.maxTotalActiveAgents) return { kind: 'denied', reason: 'active_population_limit_exceeded' };

  return { kind: 'proposed', request, blueprint };
}

/** A request is only instantiated after the caller records Guardian + human approval. */
export function createEphemeralAgent(
  decision: FoundryDecision,
  approval: { guardianApproved: boolean; humanApproved: boolean; approvingPolicy: string },
  now = new Date(),
): EphemeralAgent | FoundryDecision {
  if (decision.kind !== 'proposed') return decision;
  if (!approval.guardianApproved || !approval.humanApproved || !approval.approvingPolicy.trim()) {
    return { kind: 'denied', reason: 'guardian_human_approval_missing' };
  }

  const { request, blueprint } = decision;
  const expiresAt = new Date(now.getTime() + request.maximumLifetimeMs).toISOString();
  return {
    id: request.proposedAgentId,
    organizationId: request.organizationId,
    universeId: request.universeId,
    capabilities: unique(request.requiredCapabilities),
    allowedTools: unique(request.allowedTools),
    allowedModels: unique(request.allowedModels),
    classificationCeiling: request.classificationCeiling,
    status: 'active',
    ephemeral: true,
    expiresAt,
    maximumTasks: Math.min(request.maximumTasks, blueprint.maximumTasks),
    completedTasks: 0,
    lineage: {
      originRequestId: request.parentRequestId,
      blueprintId: blueprint.id,
      requestingAgentId: request.requestingAgentId,
      approvingPolicy: approval.approvingPolicy,
      organizationId: request.organizationId,
      universeId: request.universeId,
      creationReason: request.purpose,
      capabilityGap: unique(request.requiredCapabilities),
      modelConfiguration: unique(request.allowedModels),
      toolGrants: unique(request.allowedTools),
      createdAt: now.toISOString(),
      expiresAt,
    },
  };
}

export function hibernateEphemeralAgent(agent: EphemeralAgent, now = new Date()): EphemeralAgent {
  if (agent.status === 'retired' || agent.status === 'expired') return agent;
  if (Date.parse(agent.expiresAt ?? '') <= now.getTime()) return { ...agent, status: 'expired' };
  return { ...agent, status: 'hibernating' };
}

export function retireEphemeralAgent(agent: EphemeralAgent): EphemeralAgent {
  return { ...agent, status: 'retired' };
}

export function promoteAgentCandidate(
  agent: EphemeralAgent,
  approval: { humanApproved: boolean; repeatedSuccessfulOutcomes: number },
): CapabilityAgent | FoundryDecision {
  if (!approval.humanApproved) return { kind: 'denied', reason: 'human_promotion_approval_missing' };
  if (approval.repeatedSuccessfulOutcomes < 2) return { kind: 'denied', reason: 'insufficient_outcome_history' };
  return { ...agent, status: 'registered', ephemeral: false };
}
