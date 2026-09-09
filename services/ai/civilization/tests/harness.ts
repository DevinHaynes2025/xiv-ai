import { createCivilization, type Civilization } from '../civilization';
import type { ActorContext, AgentIdentity } from '../types';

export function sequentialIds(prefix = 'id') {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter.toString().padStart(4, '0')}`;
  };
}

export function fixedClock(start = '2026-09-08T09:30:00.000Z', stepMs = 1000) {
  let current = new Date(start).getTime();
  return () => {
    const value = new Date(current);
    current += stepMs;
    return value;
  };
}

export type TwoUniverseWorld = {
  xiv: Civilization;
  alphaFounder: ActorContext;
  alphaMember: ActorContext;
  betaFounder: ActorContext;
  outsider: ActorContext;
  alphaCoordinator: AgentIdentity;
  alphaSpecialist: AgentIdentity;
  betaCoordinator: AgentIdentity;
};

// Two organizations, two universes, and one human who belongs to neither. This
// is the shape every isolation test needs, so it is built once.
export function twoUniverseWorld(): TwoUniverseWorld {
  const xiv = createCivilization({ clock: fixedClock(), nextId: sequentialIds() });

  const alpha = xiv.createUniverse({
    organizationId: 'org-alpha',
    name: 'Alpha Universe',
    createdBy: 'human-alpha',
  });
  const beta = xiv.createUniverse({
    organizationId: 'org-beta',
    name: 'Beta Universe',
    createdBy: 'human-beta',
  });

  const alphaFounder: ActorContext = { userId: 'human-alpha', universeId: alpha.id };
  const betaFounder: ActorContext = { userId: 'human-beta', universeId: beta.id };
  const alphaMember: ActorContext = { userId: 'human-alpha-analyst', universeId: alpha.id };
  const outsider: ActorContext = { userId: 'human-nobody', universeId: alpha.id };

  xiv.addMember(alphaFounder, { userId: alphaMember.userId, membershipRole: 'participant' });

  for (const actor of [alphaFounder, betaFounder]) {
    xiv.setResourceBudget(actor, {
      maxRegisteredAgents: 6,
      maxActiveAgents: 3,
      maxQueuedTasks: 10,
      maxCostMicroUsd: 500_000,
    });
  }

  const alphaCoordinator = activated(xiv, alphaFounder, {
    agentKey: 'coordinator',
    displayName: 'Alpha Coordinator',
    profession: 'coordination',
  });
  const alphaSpecialist = activated(xiv, alphaFounder, {
    agentKey: 'logistics',
    displayName: 'Alpha Logistics',
    profession: 'logistics',
  });
  const betaCoordinator = activated(xiv, betaFounder, {
    agentKey: 'coordinator',
    displayName: 'Beta Coordinator',
    profession: 'coordination',
  });

  xiv.authorizeRelationship(alphaFounder, {
    fromAgentId: alphaCoordinator.id,
    toAgentId: alphaSpecialist.id,
    relationshipType: 'coordinates',
  });
  xiv.authorizeRelationship(alphaFounder, {
    fromAgentId: alphaSpecialist.id,
    toAgentId: alphaCoordinator.id,
    relationshipType: 'reports_to',
  });

  return {
    xiv,
    alphaFounder,
    alphaMember,
    betaFounder,
    outsider,
    alphaCoordinator,
    alphaSpecialist,
    betaCoordinator,
  };
}

export function activated(
  xiv: Civilization,
  actor: ActorContext,
  input: { agentKey: string; displayName: string; profession: string; parentAgentId?: string },
): AgentIdentity {
  const agent = xiv.registerAgent(actor, {
    agentKey: input.agentKey,
    displayName: input.displayName,
    profession: input.profession,
    modelRuntime: 'test-runtime',
    humanSupervisorId: actor.userId,
    parentAgentId: input.parentAgentId ?? null,
  });
  xiv.recordEvaluation(actor, { agentId: agent.id, evaluationKind: 'safety', score: 0.9, passed: true });
  xiv.recordEvaluation(actor, { agentId: agent.id, evaluationKind: 'tenancy_isolation', score: 0.9, passed: true });
  xiv.activateAgent(actor, { agentId: agent.id });
  return agent;
}

export function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      return String((error as { code: unknown }).code);
    }
    return `unexpected:${String(error)}`;
  }
  return 'no_error_thrown';
}
