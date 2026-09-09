import type { XivAgentId } from '../agents';
import { canViewOrganization, canViewUniverse } from '../tenant/authorize';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from '../tenant/types';
import type { AgentHandoff, CollaborationFailure } from './types';

export function denyCrossUniverseHandoff(input: {
  sourceUniverseId?: string | null;
  targetUniverseId?: string | null;
  sourceOrganizationId?: string | null;
  targetOrganizationId?: string | null;
}): CollaborationFailure | null {
  const sourceUni = input.sourceUniverseId ?? null;
  const targetUni = input.targetUniverseId ?? null;
  if (sourceUni && targetUni && sourceUni !== targetUni) {
    return {
      code: 'cross_universe',
      reason: 'Agent in Universe A cannot send tenant data to Universe B. No inferred sharing: DENY',
    };
  }
  const sourceOrg = input.sourceOrganizationId ?? null;
  const targetOrg = input.targetOrganizationId ?? null;
  if (sourceOrg && targetOrg && sourceOrg !== targetOrg) {
    return {
      code: 'cross_universe',
      reason: 'Cross-organization agent collaboration is not implemented: DENY',
    };
  }
  return null;
}

export function authorizeHandoffTenant(input: {
  handoff: AgentHandoff;
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
}): CollaborationFailure | null {
  if (input.handoff.scope === 'public' || input.handoff.scope === 'personal') return null;
  if (input.handoff.scope === 'organization') {
    const view = canViewOrganization({
      actorUserId: input.actorUserId,
      organization: input.organization ?? (input.handoff.organizationId ? { id: input.handoff.organizationId } : null),
      membership: input.organizationMembership,
    });
    if (!view.allowed) return { code: 'tenant_unavailable', reason: view.reason };
  }
  if (input.handoff.scope === 'universe') {
    const view = canViewUniverse({
      actorUserId: input.actorUserId,
      organization: input.organization,
      universe: input.universe,
      organizationMembership: input.organizationMembership,
      universeMembership: input.universeMembership,
    });
    if (!view.allowed) return { code: 'tenant_unavailable', reason: view.reason };
  }
  return denyCrossUniverseHandoff({
    sourceUniverseId: input.handoff.universeId,
    targetUniverseId: input.universe?.id ?? input.handoff.universeId,
    sourceOrganizationId: input.handoff.organizationId,
    targetOrganizationId: input.organization?.id ?? input.handoff.organizationId,
  });
}

export function specialistLabel(agentId: XivAgentId, available: boolean) {
  if (!available) return `Missing specialist analysis from ${agentId}. No fabricated substitute.`;
  return `${agentId} returned a bounded specialist contribution.`;
}
