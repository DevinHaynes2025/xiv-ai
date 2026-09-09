import { createId, nowIso } from '../actions';
import { getXivAgent, type XivAgentId } from '../agents';
import { evaluatePolicy } from '../policy';
import { evaluateAgentFirewall } from '../security/firewall';
import type { PersistenceStatus } from '../tenant/context';
import type { OrganizationMembership, UniverseMembership } from '../tenant/types';
import { createCollaborationBudget, consumeBudget } from './budget';
import { authorizeHandoffTenant, specialistLabel } from './conversation';
import { createHandoff, directAgentCallDenied, structuredHandoffMessage } from './handoff';
import { evaluateLoopGuard, isDuplicateRequest } from './loop-guard';
import { meshAgentStatus } from './registry';
import type {
  AgentHandoff,
  CollaborationResult,
  CollaborationSession,
  HandoffType,
  SpecialistContribution,
} from './types';

export function createCollaborationSession(input: {
  orchestratorId: XivAgentId;
  organizationId?: string | null;
  universeId?: string | null;
  allowBoundedCycle?: boolean;
  maxHopCount?: number;
}): CollaborationSession {
  return {
    sessionId: createId('col'),
    orchestratorId: input.orchestratorId,
    participants: [{ agentId: input.orchestratorId, role: 'orchestrator' }],
    path: [input.orchestratorId],
    budget: createCollaborationBudget(input.maxHopCount ? { maxHopCount: input.maxHopCount } : undefined),
    organizationId: input.organizationId ?? null,
    universeId: input.universeId ?? null,
    correlationId: createId('cor'),
    allowBoundedCycle: Boolean(input.allowBoundedCycle),
    createdAt: nowIso(),
    status: 'open',
  };
}

export function routeHandoff(input: {
  session: CollaborationSession;
  handoff: AgentHandoff;
  actorUserId?: string | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  persistenceStatus?: PersistenceStatus;
  previousKeys?: readonly string[];
}): { session: CollaborationSession; allowed: boolean; reason: string; failure?: CollaborationResult['failure'] } {
  const firewall = evaluateAgentFirewall({
    handoff: input.handoff,
    persistenceStatus: input.persistenceStatus,
  });
  if (!firewall.allowed) {
    return { session: { ...input.session, status: 'denied' }, allowed: false, reason: firewall.reason, failure: firewall.failure };
  }

  const loop = evaluateLoopGuard({
    path: input.session.path,
    nextAgent: input.handoff.targetAgent,
    hopCount: input.handoff.hopCount,
    maxHopCount: input.handoff.maxHopCount,
    allowBoundedCycle: input.session.allowBoundedCycle,
  });
  if (loop) {
    return { session: { ...input.session, status: 'stopped' }, allowed: false, reason: loop.reason, failure: loop };
  }

  if (input.previousKeys && isDuplicateRequest(input.previousKeys, input.handoff.purpose, input.handoff.targetAgent)) {
    return {
      session: { ...input.session, status: 'stopped' },
      allowed: false,
      reason: 'Duplicate collaboration request detected: DENY',
      failure: { code: 'loop_detected', reason: 'Duplicate collaboration request detected: DENY' },
    };
  }

  const spent = consumeBudget(input.session.budget, { hops: 1, messages: 1, costUnits: 1 });
  if (spent.exceeded) {
    return {
      session: { ...input.session, budget: spent.budget, status: 'stopped' },
      allowed: false,
      reason: spent.exceeded.reason,
      failure: spent.exceeded,
    };
  }

  const tenant = authorizeHandoffTenant({
    handoff: input.handoff,
    actorUserId: input.actorUserId,
    organization: input.handoff.organizationId ? { id: input.handoff.organizationId } : null,
    universe:
      input.handoff.universeId && input.handoff.organizationId
        ? { id: input.handoff.universeId, organizationId: input.handoff.organizationId }
        : null,
    organizationMembership: input.organizationMembership,
    universeMembership: input.universeMembership,
  });
  if (tenant) {
    return { session: { ...input.session, budget: spent.budget, status: 'denied' }, allowed: false, reason: tenant.reason, failure: tenant };
  }

  const toolId = input.handoff.allowedTools[0];
  if (toolId) {
    const policy = evaluatePolicy({
      agentId: input.handoff.targetAgent,
      toolId,
      environment: 'prototype',
      authorityLevel: input.handoff.authorityLevel,
    });
    if (policy.verdict === 'denied') {
      return {
        session: { ...input.session, budget: spent.budget, status: 'denied' },
        allowed: false,
        reason: policy.reason,
        failure: { code: 'handoff_denied', reason: policy.reason },
      };
    }
  }

  return {
    session: {
      ...input.session,
      budget: spent.budget,
      path: [...input.session.path, input.handoff.targetAgent],
      participants: [
        ...input.session.participants,
        { agentId: input.handoff.targetAgent, role: 'specialist' },
      ],
      status: 'open',
    },
    allowed: true,
    reason: 'Valid bounded handoff allowed.',
  };
}

export function orchestrateConsultation(input: {
  purpose: string;
  specialists: readonly XivAgentId[];
  requestedOutput?: string;
  evidenceRefs?: readonly string[];
  organizationId?: string | null;
  universeId?: string | null;
  actorUserId?: string | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  persistenceStatus?: PersistenceStatus;
  unavailableSpecialists?: readonly XivAgentId[];
  maxHopCount?: number;
  type?: HandoffType;
}): CollaborationResult {
  const orchestrator = getXivAgent('executive');
  if (!orchestrator) {
    const session = createCollaborationSession({ orchestratorId: 'executive' });
    return {
      allowed: false,
      reason: 'Executive orchestrator is not registered.',
      session: { ...session, status: 'denied' },
      contributions: [],
      partial: true,
      missingSpecialists: [...input.specialists],
      failure: { code: 'agent_unavailable', reason: 'Executive orchestrator is not registered.' },
    };
  }

  let session = createCollaborationSession({
    orchestratorId: 'executive',
    organizationId: input.organizationId,
    universeId: input.universeId,
    maxHopCount: input.maxHopCount,
  });
  const contributions: SpecialistContribution[] = [];
  const missing: XivAgentId[] = [];
  let hop = 1;
  const purposes: string[] = [];

  for (const specialist of input.specialists) {
    if (input.unavailableSpecialists?.includes(specialist) || meshAgentStatus(specialist) === 'unavailable') {
      missing.push(specialist);
      contributions.push({
        agentId: specialist,
        status: 'unavailable',
        output: specialistLabel(specialist, false),
      });
      continue;
    }

    const handoff = createHandoff({
      sessionId: session.sessionId,
      sourceAgent: 'executive',
      targetAgent: specialist,
      type: input.type ?? 'consultation',
      purpose: input.purpose,
      requestedOutput: input.requestedOutput ?? 'specialist_analysis',
      evidenceRefs: input.evidenceRefs,
      allowedTools: getXivAgent(specialist)?.allowedTools ?? [],
      authorityLevel: getXivAgent(specialist)?.defaultAuthority ?? 'L0',
      organizationId: input.organizationId,
      universeId: input.universeId,
      hopCount: hop,
      maxHopCount: session.budget.maxHopCount,
      correlationId: session.correlationId,
      scope: input.universeId ? 'universe' : input.organizationId ? 'organization' : 'personal',
    });
    structuredHandoffMessage(handoff);
    const routed = routeHandoff({
      session,
      handoff,
      actorUserId: input.actorUserId,
      organizationMembership: input.organizationMembership,
      universeMembership: input.universeMembership,
      persistenceStatus: input.persistenceStatus,
      previousKeys: purposes,
    });
    session = routed.session;
    purposes.push(`${specialist}::${input.purpose}`);
    if (!routed.allowed) {
      if (routed.failure?.code === 'loop_detected' || routed.failure?.code === 'budget_exceeded') {
        return {
          allowed: false,
          reason: routed.reason,
          session: { ...session, status: 'stopped' },
          contributions,
          partial: true,
          missingSpecialists: [...missing, ...input.specialists.filter((id) => !contributions.some((item) => item.agentId === id))],
          failure: routed.failure,
        };
      }
      missing.push(specialist);
      contributions.push({
        agentId: specialist,
        status: 'denied',
        output: routed.reason,
      });
      continue;
    }
    hop += 1;
    contributions.push({
      agentId: specialist,
      status: 'completed',
      output: specialistLabel(specialist, true),
      stance: 'observed',
    });
  }

  const partial = missing.length > 0;
  return {
    allowed: contributions.some((item) => item.status === 'completed'),
    reason: partial
      ? 'Partial collaboration result. Missing specialist analysis is labeled and not fabricated.'
      : 'Executive orchestrated an allowed consultation.',
    session: { ...session, status: partial ? 'stopped' : 'completed' },
    contributions,
    partial,
    missingSpecialists: missing,
  };
}

export { directAgentCallDenied };
