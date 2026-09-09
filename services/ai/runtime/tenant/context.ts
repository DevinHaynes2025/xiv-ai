/**
 * Defense-in-depth tenant session helpers.
 * Client organizationId / universeId values are selectors only.
 * Authorization still requires an authenticated user and persisted membership.
 */

import type { DataScope } from '../context/adapters/scope';
import {
  canCreateUniverse,
  canViewOrganization,
  canViewUniverse,
  clientSelectorIsNotAuthority,
  profileCompanyDoesNotGrantTenantAccess,
  userRolesDoNotGrantTenantAccess,
  type TenantDecision,
} from './authorize';
import type {
  Organization,
  OrganizationMembership,
  OrganizationRole,
  Universe,
  UniverseMembership,
  UniverseRole,
} from './types';

export type PersistenceStatus = 'ready' | 'not_applied' | 'schema_collision' | 'unavailable';

export type BootstrapStatus = 'idle' | 'creating' | 'ready' | 'denied' | 'failed';

export type ActiveTenantContext = {
  actorUserId: string | null;
  persistenceStatus: PersistenceStatus;
  organizations: readonly Organization[];
  activeOrganization: Organization | null;
  organizationMembership: OrganizationMembership | null;
  organizationRole: OrganizationRole | null;
  universes: readonly Universe[];
  activeUniverse: Universe | null;
  universeMembership: UniverseMembership | null;
  universeRole: UniverseRole | null;
  loading: boolean;
  error: string | null;
};

export type PersistedTenantRequest = {
  actorUserId?: string | null;
  selectorOrganizationId?: string | null;
  selectorUniverseId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  experienceRole?: string | null;
  profileCompany?: string | null;
  agentId?: string | null;
  treatAgentAsPrincipal?: boolean;
  scope?: DataScope;
};

const emptyContext: ActiveTenantContext = {
  actorUserId: null,
  persistenceStatus: 'unavailable',
  organizations: [],
  activeOrganization: null,
  organizationMembership: null,
  organizationRole: null,
  universes: [],
  activeUniverse: null,
  universeMembership: null,
  universeRole: null,
  loading: false,
  error: null,
};

function present(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function emptyTenantContext(partial?: Partial<ActiveTenantContext>): ActiveTenantContext {
  return { ...emptyContext, ...partial };
}

export function slugFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return slug.length > 0 ? slug : `org-${Date.now().toString(36)}`;
}

/**
 * Builds active tenant state only from persisted membership rows.
 * Requested IDs are selectors. Missing membership clears the selection.
 */
export function selectActiveTenant(input: {
  actorUserId?: string | null;
  persistenceStatus: PersistenceStatus;
  organizations: readonly Organization[];
  organizationMemberships: readonly OrganizationMembership[];
  universes: readonly Universe[];
  universeMemberships: readonly UniverseMembership[];
  requestedOrganizationId?: string | null;
  requestedUniverseId?: string | null;
}): { context: ActiveTenantContext; denied: string | null } {
  if (!present(input.actorUserId)) {
    return {
      context: emptyTenantContext({ persistenceStatus: input.persistenceStatus }),
      denied: null,
    };
  }

  const memberships = input.organizationMemberships.filter(
    (item) => item.userId === input.actorUserId && item.status === 'active',
  );
  const organizations = input.organizations.filter((org) =>
    memberships.some((item) => item.organizationId === org.id),
  );

  let denied: string | null = null;
  let activeOrganization =
    organizations.find((org) => org.id === input.requestedOrganizationId) ?? organizations[0] ?? null;

  if (present(input.requestedOrganizationId) && !organizations.some((org) => org.id === input.requestedOrganizationId)) {
    denied = 'Cross-organization access denied. Selector is not an authorized membership.';
    activeOrganization = organizations[0] ?? null;
  }

  const organizationMembership = activeOrganization
    ? (memberships.find((item) => item.organizationId === activeOrganization?.id) ?? null)
    : null;

  const universes = input.universes.filter((universe) => {
    if (!activeOrganization || universe.organizationId !== activeOrganization.id) return false;
    const view = canViewUniverse({
      actorUserId: input.actorUserId,
      organization: activeOrganization,
      universe,
      organizationMembership,
      universeMembership: input.universeMemberships.find(
        (item) => item.universeId === universe.id && item.userId === input.actorUserId,
      ),
    });
    return view.allowed;
  });

  let activeUniverse =
    universes.find((universe) => universe.id === input.requestedUniverseId) ?? universes[0] ?? null;
  if (present(input.requestedUniverseId) && !universes.some((universe) => universe.id === input.requestedUniverseId)) {
    denied = denied ?? 'Cross-Universe access denied. Selector is not an authorized membership.';
    activeUniverse = universes[0] ?? null;
  }

  const universeMembership = activeUniverse
    ? (input.universeMemberships.find(
        (item) => item.universeId === activeUniverse?.id && item.userId === input.actorUserId,
      ) ?? null)
    : null;

  return {
    context: {
      actorUserId: input.actorUserId,
      persistenceStatus: input.persistenceStatus,
      organizations,
      activeOrganization,
      organizationMembership,
      organizationRole: organizationMembership?.role ?? null,
      universes,
      activeUniverse,
      universeMembership,
      universeRole: universeMembership?.role ?? null,
      loading: false,
      error: null,
    },
    denied,
  };
}

export function authorizePersistedTenantContext(input: PersistedTenantRequest): TenantDecision {
  if (input.treatAgentAsPrincipal && input.agentId) {
    return {
      allowed: false,
      reason: 'Agents are not database principals. Agent identity is not tenant membership: DENY',
    };
  }
  if (input.scope === 'personal' || input.scope === 'public') {
    return { allowed: true, reason: `${input.scope} scope does not use tenant membership as authority.` };
  }
  if (present(input.experienceRole) && !input.organizationMembership && !input.universeMembership) {
    return userRolesDoNotGrantTenantAccess();
  }
  if (present(input.profileCompany) && !input.organizationMembership && !input.universeMembership) {
    return profileCompanyDoesNotGrantTenantAccess();
  }
  if (!present(input.actorUserId)) {
    return { allowed: false, reason: 'Unauthenticated user cannot access tenant: DENY' };
  }

  if (input.scope === 'universe' || present(input.selectorUniverseId)) {
    if (!present(input.selectorUniverseId) || !present(input.selectorOrganizationId)) {
      return clientSelectorIsNotAuthority(input.selectorUniverseId);
    }
    return canViewUniverse({
      actorUserId: input.actorUserId,
      organization: input.organization ?? { id: input.selectorOrganizationId },
      universe: input.universe ?? {
        id: input.selectorUniverseId,
        organizationId: input.selectorOrganizationId,
      },
      organizationMembership: input.organizationMembership,
      universeMembership: input.universeMembership,
    });
  }

  if (input.scope === 'organization' || present(input.selectorOrganizationId)) {
    if (!present(input.selectorOrganizationId)) {
      return clientSelectorIsNotAuthority(input.selectorOrganizationId);
    }
    return canViewOrganization({
      actorUserId: input.actorUserId,
      organization: input.organization ?? { id: input.selectorOrganizationId },
      membership: input.organizationMembership,
    });
  }

  return clientSelectorIsNotAuthority(input.selectorOrganizationId ?? input.selectorUniverseId);
}

export function canBootstrapUniverseFromContext(context: ActiveTenantContext): TenantDecision {
  return canCreateUniverse({
    actorUserId: context.actorUserId,
    organization: context.activeOrganization,
    membership: context.organizationMembership,
  });
}
