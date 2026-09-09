import type { AgentRiskLevel } from '../types';
import { refuse } from './errors';
import {
  assertAgentOperable,
  assertCapabilityPermitted,
  assertGenerationDepth,
  assertNotSelfModification,
  assertUniverseOperable,
} from './guardian';
import {
  now,
  recordGovernanceEvent,
  requireAgent,
  requireMember,
  requireSupervisor,
  visibleTo,
  type CivilizationState,
} from './store';
import { universeBudget } from './universe';
import type {
  ActorContext,
  AgentCapability,
  AgentEvaluation,
  AgentIdentity,
  AgentRelationship,
  CapabilityKind,
  EvaluationKind,
  MemoryScope,
  RelationshipType,
  SecurityClassification,
} from './types';

// An agent cannot be activated until it has passed these, and it must never
// have a failing evaluation on any gating kind.
export const REQUIRED_ACTIVATION_GATES: readonly EvaluationKind[] = ['safety', 'tenancy_isolation'];

const COUNTED_LIFECYCLE_STATES = new Set(['draft', 'registered', 'evaluating', 'active', 'sleeping', 'suspended']);

export type AgentIdentityInput = {
  agentKey: string;
  displayName: string;
  profession: string;
  specialization?: string | null;
  modelRuntime: string;
  memoryScope?: MemoryScope;
  securityClassification?: SecurityClassification;
  humanSupervisorId: string;
  guardianPolicyKey?: string;
  parentAgentId?: string | null;
  provenance?: Record<string, unknown>;
  languages?: readonly string[];
  culturalContexts?: readonly string[];
  knowledgeDomains?: readonly string[];
};

export function registerAgent(
  state: CivilizationState,
  actor: ActorContext,
  input: AgentIdentityInput,
): AgentIdentity {
  const { universe } = requireSupervisor(state, actor);
  assertUniverseOperable(universe);

  const budget = universeBudget(state, universe.id);
  const registered = state.agents.filter(
    (item) => item.universeId === universe.id && COUNTED_LIFECYCLE_STATES.has(item.lifecycleState),
  ).length;
  if (registered + 1 > budget.maxRegisteredAgents) {
    refuse('quota_registration_exceeded', `${registered + 1} > ${budget.maxRegisteredAgents}`);
  }

  const parent = input.parentAgentId ? requireAgent(state, universe.id, input.parentAgentId) : null;
  const generationDepth = parent ? parent.generationDepth + 1 : 0;
  assertGenerationDepth(generationDepth);

  const duplicate = state.agents.find((item) => item.universeId === universe.id && item.agentKey === input.agentKey);
  if (duplicate) return duplicate;

  const agent: AgentIdentity = {
    id: state.nextId(),
    universeId: universe.id,
    organizationId: universe.organizationId,
    agentKey: input.agentKey,
    displayName: input.displayName,
    profession: input.profession,
    specialization: input.specialization ?? null,
    modelRuntime: input.modelRuntime,
    memoryScope: input.memoryScope ?? 'session',
    securityClassification: input.securityClassification ?? universe.securityClassification,
    lifecycleState: 'registered',
    humanSupervisorId: input.humanSupervisorId,
    guardianPolicyKey: input.guardianPolicyKey ?? 'guardian.default.v1',
    parentAgentId: parent?.id ?? null,
    generationDepth,
    provenance: {
      registeredBy: actor.userId,
      registeredAt: now(state),
      slice: '2I-AI-62A',
      ...input.provenance,
    },
    killSwitchEngaged: false,
    createdBy: actor.userId,
    createdAt: now(state),
    activatedAt: null,
    archivedAt: null,
  };
  state.agents.push(agent);

  for (const language of input.languages ?? []) {
    grantCapability(state, actor, {
      agentId: agent.id,
      capabilityKind: 'language',
      capabilityKey: language,
      riskLevel: 'low',
      approved: true,
    });
  }
  for (const context of input.culturalContexts ?? []) {
    grantCapability(state, actor, {
      agentId: agent.id,
      capabilityKind: 'cultural_context',
      capabilityKey: context,
      riskLevel: 'low',
      approved: true,
    });
  }
  for (const domain of input.knowledgeDomains ?? []) {
    grantCapability(state, actor, {
      agentId: agent.id,
      capabilityKind: 'knowledge_domain',
      capabilityKey: domain,
      riskLevel: 'low',
      approved: true,
    });
  }

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_registered',
    subjectAgentId: agent.id,
    actorUserId: actor.userId,
    detail: {
      agentKey: agent.agentKey,
      profession: agent.profession,
      generationDepth: agent.generationDepth,
      humanSupervisorId: agent.humanSupervisorId,
    },
  });

  return agent;
}

export function grantCapability(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    agentId: string;
    capabilityKind: CapabilityKind;
    capabilityKey: string;
    riskLevel: AgentRiskLevel;
    approved?: boolean;
    requiresApproval?: boolean;
    expiresAt?: string | null;
    actingAgentId?: string | null;
  },
): AgentCapability {
  const { universe } = requireSupervisor(state, actor);
  const agent = requireAgent(state, universe.id, input.agentId);
  assertNotSelfModification({ actorAgentId: input.actingAgentId, subjectAgentId: agent.id });

  const approved = input.approved ?? false;
  assertCapabilityPermitted({
    capabilityKind: input.capabilityKind,
    capabilityKey: input.capabilityKey,
    riskLevel: input.riskLevel,
    approved,
  });

  const existing = state.capabilities.find(
    (item) =>
      item.agentId === agent.id &&
      item.capabilityKind === input.capabilityKind &&
      item.capabilityKey === input.capabilityKey,
  );

  const capability: AgentCapability = existing ?? {
    id: state.nextId(),
    universeId: universe.id,
    agentId: agent.id,
    capabilityKind: input.capabilityKind,
    capabilityKey: input.capabilityKey,
    riskLevel: input.riskLevel,
    requiresApproval: input.requiresApproval ?? input.riskLevel !== 'low',
    approved,
    grantedBy: approved ? actor.userId : null,
    grantedAt: approved ? now(state) : null,
    expiresAt: input.expiresAt ?? null,
  };

  if (existing) {
    existing.riskLevel = input.riskLevel;
    existing.requiresApproval = input.requiresApproval ?? existing.requiresApproval;
    existing.approved = approved;
    existing.grantedBy = approved ? actor.userId : null;
    existing.grantedAt = approved ? now(state) : null;
  } else {
    state.capabilities.push(capability);
  }

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_capability_granted',
    subjectAgentId: agent.id,
    actorUserId: actor.userId,
    detail: {
      capabilityKind: input.capabilityKind,
      capabilityKey: input.capabilityKey,
      riskLevel: input.riskLevel,
      approved,
    },
  });

  return capability;
}

export function hasApprovedCapability(
  state: CivilizationState,
  agentId: string,
  capabilityKind: CapabilityKind,
  capabilityKey: string,
) {
  return state.capabilities.some(
    (item) =>
      item.agentId === agentId &&
      item.capabilityKind === capabilityKind &&
      item.capabilityKey === capabilityKey &&
      item.approved,
  );
}

export function assertApprovedCapability(
  state: CivilizationState,
  agentId: string,
  capabilityKind: CapabilityKind,
  capabilityKey: string,
) {
  if (!hasApprovedCapability(state, agentId, capabilityKind, capabilityKey)) {
    refuse('agent_capability_missing', `${capabilityKind}:${capabilityKey}`);
  }
}

export function authorizeRelationship(
  state: CivilizationState,
  actor: ActorContext,
  input: { fromAgentId: string; toAgentId: string; relationshipType: RelationshipType },
): AgentRelationship {
  const { universe } = requireSupervisor(state, actor);
  const from = requireAgent(state, universe.id, input.fromAgentId);
  const to = requireAgent(state, universe.id, input.toAgentId);
  if (from.id === to.id) refuse('tenancy_universe_mismatch', 'an agent cannot relate to itself');

  const existing = state.relationships.find(
    (item) =>
      item.fromAgentId === from.id && item.toAgentId === to.id && item.relationshipType === input.relationshipType,
  );

  const relationship: AgentRelationship = existing ?? {
    id: state.nextId(),
    universeId: universe.id,
    fromAgentId: from.id,
    toAgentId: to.id,
    relationshipType: input.relationshipType,
    authorized: true,
    authorizedBy: actor.userId,
    createdAt: now(state),
    revokedAt: null,
  };

  if (existing) {
    existing.authorized = true;
    existing.authorizedBy = actor.userId;
    existing.revokedAt = null;
  } else {
    state.relationships.push(relationship);
  }

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_relationship_authorized',
    subjectAgentId: to.id,
    actorAgentId: from.id,
    actorUserId: actor.userId,
    detail: { relationshipType: input.relationshipType },
  });

  return relationship;
}

export function isRelationshipAuthorized(
  state: CivilizationState,
  fromAgentId: string,
  toAgentId: string,
): boolean {
  return state.relationships.some(
    (item) => item.fromAgentId === fromAgentId && item.toAgentId === toAgentId && item.authorized && !item.revokedAt,
  );
}

// Discovery is scoped by universe and by authorized relationship. An agent
// cannot enumerate the population, only the peers a supervisor connected it to.
export function discoverAgents(
  state: CivilizationState,
  actor: ActorContext,
  input: { fromAgentId: string; profession?: string; requireActive?: boolean },
): AgentIdentity[] {
  requireMember(state, actor);
  const from = requireAgent(state, actor.universeId, input.fromAgentId);
  assertAgentOperable(from);

  const found = visibleTo(state, actor, state.agents).filter((candidate) => {
    if (candidate.id === from.id) return false;
    if (!isRelationshipAuthorized(state, from.id, candidate.id)) return false;
    if (input.profession && candidate.profession !== input.profession) return false;
    if (input.requireActive !== false && candidate.lifecycleState !== 'active') return false;
    return true;
  });

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'agent_discovery',
    actorAgentId: from.id,
    actorUserId: actor.userId,
    detail: { profession: input.profession ?? null, found: found.map((item) => item.agentKey) },
  });

  return found;
}

export function recordEvaluation(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    agentId: string;
    evaluationKind: EvaluationKind;
    score: number;
    passed: boolean;
    gatesActivation?: boolean;
    evaluatorKind?: 'human' | 'automated';
    notes?: string | null;
  },
): AgentEvaluation {
  const { universe } = requireSupervisor(state, actor);
  const agent = requireAgent(state, universe.id, input.agentId);

  const evaluation: AgentEvaluation = {
    id: state.nextId(),
    universeId: universe.id,
    agentId: agent.id,
    evaluationKind: input.evaluationKind,
    score: input.score,
    passed: input.passed,
    gatesActivation: input.gatesActivation ?? true,
    evaluatorKind: input.evaluatorKind ?? 'human',
    evaluatorUserId: (input.evaluatorKind ?? 'human') === 'human' ? actor.userId : null,
    notes: input.notes ?? null,
    evaluatedAt: now(state),
  };
  state.evaluations.push(evaluation);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_evaluated',
    subjectAgentId: agent.id,
    actorUserId: actor.userId,
    decision: input.passed ? 'passed' : 'failed',
    detail: { evaluationKind: input.evaluationKind, score: input.score },
  });

  return evaluation;
}

export function activationGateStatus(state: CivilizationState, agentId: string) {
  const evaluations = state.evaluations.filter((item) => item.agentId === agentId);
  const failed = evaluations.filter((item) => item.gatesActivation && !item.passed);
  const passedKinds = new Set(
    evaluations.filter((item) => item.gatesActivation && item.passed).map((item) => item.evaluationKind),
  );
  const missing = REQUIRED_ACTIVATION_GATES.filter((kind) => !passedKinds.has(kind));
  return { failed, missing, ready: failed.length === 0 && missing.length === 0 };
}

export function activateAgent(state: CivilizationState, actor: ActorContext, input: { agentId: string }): AgentIdentity {
  const { universe } = requireSupervisor(state, actor);
  assertUniverseOperable(universe);
  const agent = requireAgent(state, universe.id, input.agentId);
  assertAgentOperable(agent);

  const gate = activationGateStatus(state, agent.id);
  if (gate.failed.length > 0) {
    refuse('evaluation_gate_failed', gate.failed.map((item) => item.evaluationKind).join(','));
  }
  if (gate.missing.length > 0) {
    refuse('evaluation_gate_missing', gate.missing.join(','));
  }

  const budget = universeBudget(state, universe.id);
  const active = state.agents.filter(
    (item) => item.universeId === universe.id && item.lifecycleState === 'active' && item.id !== agent.id,
  ).length;
  if (active + 1 > budget.maxActiveAgents) {
    refuse('quota_activation_exceeded', `${active + 1} > ${budget.maxActiveAgents}`);
  }

  agent.lifecycleState = 'active';
  agent.activatedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_activated',
    subjectAgentId: agent.id,
    actorUserId: actor.userId,
    detail: { activeAgents: active + 1, maxActiveAgents: budget.maxActiveAgents },
  });

  return agent;
}

export function sleepAgent(state: CivilizationState, actor: ActorContext, input: { agentId: string }): AgentIdentity {
  const { universe } = requireSupervisor(state, actor);
  const agent = requireAgent(state, universe.id, input.agentId);
  agent.lifecycleState = 'sleeping';

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_slept',
    subjectAgentId: agent.id,
    actorUserId: actor.userId,
  });

  return agent;
}

export function archiveAgent(state: CivilizationState, actor: ActorContext, input: { agentId: string }): AgentIdentity {
  const { universe } = requireSupervisor(state, actor);
  const agent = requireAgent(state, universe.id, input.agentId);
  agent.lifecycleState = 'archived';
  agent.archivedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'agent_archived',
    subjectAgentId: agent.id,
    actorUserId: actor.userId,
  });

  return agent;
}

export function listAgents(state: CivilizationState, actor: ActorContext): AgentIdentity[] {
  return visibleTo(state, actor, state.agents);
}

export function requireActiveAgent(state: CivilizationState, universeId: string, agentId: string): AgentIdentity {
  const agent = requireAgent(state, universeId, agentId);
  assertAgentOperable(agent);
  if (agent.lifecycleState !== 'active') refuse('agent_not_active', agent.agentKey);
  return agent;
}
