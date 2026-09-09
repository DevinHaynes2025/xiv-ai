import { getDefaultAgentRuntime } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import {
  authoritativeXivHydrationEnabled,
  recordTenantAudit,
  selectActiveTenant,
  slugFromName,
  tenantPersistenceStatus,
  type ActiveTenantContext,
  type Organization,
  type OrganizationMembership,
  type PersistenceStatus,
  type PersistedClassification,
  type PersistedStorageTier,
  type Universe,
  type UniverseMembership,
} from '../../../../services/ai/runtime/tenant';

const SELECTION_PREFIX = 'xiv.tenant.selection.';

export type TenantSelection = {
  organizationId: string | null;
  universeId: string | null;
};

export type TenantLoadResult = {
  context: ActiveTenantContext;
  denied: string | null;
};

export type TenantMutationResult = {
  status: 'ready' | 'denied' | 'failed';
  message: string;
  organization?: Organization;
  universe?: Universe;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  status: Organization['status'];
  created_by: string | null;
  industry: string | null;
  region_preference: string | null;
  created_at: string;
  updated_at: string;
};

type UniverseRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  status: Universe['status'];
  classification: Universe['classification'];
  storage_tier: Universe['storageTier'];
  region_preference: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type OrganizationMembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMembership['role'];
  status: OrganizationMembership['status'];
  role_version?: number;
  created_at: string;
  updated_at: string;
};

type UniverseMembershipRow = {
  id: string;
  universe_id: string;
  user_id: string;
  role: UniverseMembership['role'];
  status: UniverseMembership['status'];
  role_version?: number;
  created_at: string;
  updated_at: string;
};

function isMissingRelation(error: { code?: string; message?: string } | null) {
  const code = error?.code ?? '';
  const message = (error?.message ?? '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('could not find the table') ||
    message.includes('could not find the function')
  );
}

function isMissingColumn(error: { code?: string } | null) {
  return error?.code === '42703';
}

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdBy: row.created_by,
    industry: row.industry,
    regionPreference: row.region_preference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUniverse(row: UniverseRow): Universe {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    classification: row.classification,
    storageTier: row.storage_tier,
    regionPreference: row.region_preference,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrganizationMembership(row: OrganizationMembershipRow): OrganizationMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    roleVersion: row.role_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUniverseMembership(row: UniverseMembershipRow): UniverseMembership {
  return {
    id: row.id,
    universeId: row.universe_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    roleVersion: row.role_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function readTenantSelection(userId: string): TenantSelection {
  try {
    const raw = localStorage.getItem(`${SELECTION_PREFIX}${userId}`);
    if (!raw) return { organizationId: null, universeId: null };
    const parsed = JSON.parse(raw) as TenantSelection;
    return {
      organizationId: typeof parsed.organizationId === 'string' ? parsed.organizationId : null,
      universeId: typeof parsed.universeId === 'string' ? parsed.universeId : null,
    };
  } catch {
    return { organizationId: null, universeId: null };
  }
}

export function writeTenantSelection(userId: string, selection: TenantSelection) {
  localStorage.setItem(`${SELECTION_PREFIX}${userId}`, JSON.stringify(selection));
}

export function clearTenantSelection(userId: string) {
  localStorage.removeItem(`${SELECTION_PREFIX}${userId}`);
}

export async function detectPersistenceStatus(): Promise<PersistenceStatus> {
  const xivMemberships = await supabase.from('xiv_organization_memberships').select('id').limit(1);
  if (!xivMemberships.error) {
    const orgs = await supabase
      .from('xiv_organizations')
      .select('id,name,slug,status,created_by,industry,region_preference,created_at,updated_at')
      .limit(1);
    if (isMissingColumn(orgs.error)) return 'unavailable';
    if (isMissingRelation(orgs.error)) return 'not_applied';
    if (orgs.error) return 'unavailable';
    if (!authoritativeXivHydrationEnabled()) return 'schema_collision';
    return 'ready';
  }
  if (isMissingRelation(xivMemberships.error)) {
    const legacy = await supabase.from('organizations').select('id,status').limit(1);
    if (!legacy.error || isMissingColumn(legacy.error)) return 'schema_collision';
    return 'not_applied';
  }
  return 'unavailable';
}

export async function loadPersistedTenant(
  userId: string,
  requested?: TenantSelection,
): Promise<TenantLoadResult> {
  const persistenceStatus = await detectPersistenceStatus();
  const selection = requested ?? readTenantSelection(userId);
  if (persistenceStatus !== 'ready') {
    return {
      context: {
        actorUserId: userId,
        persistenceStatus,
        organizations: [],
        activeOrganization: null,
        organizationMembership: null,
        organizationRole: null,
        universes: [],
        activeUniverse: null,
        universeMembership: null,
        universeRole: null,
        loading: false,
        error:
          persistenceStatus === 'schema_collision'
            ? 'Hosted public.organizations still collides. XIV tenant tables (xiv_*) are not readable yet. Persistence is not LIVE until isolation is proven.'
            : persistenceStatus === 'not_applied'
              ? 'XIV tenant tables are not applied on this project.'
              : 'Tenant persistence could not be reached.',
      },
      denied: null,
    };
  }

  const [membershipsResult, universeMembershipsResult] = await Promise.all([
    supabase
      .from('xiv_organization_memberships')
      .select('id,organization_id,user_id,role,status,role_version,created_at,updated_at')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('xiv_universe_memberships')
      .select('id,universe_id,user_id,role,status,role_version,created_at,updated_at')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  if (membershipsResult.error || universeMembershipsResult.error) {
    return {
      context: {
        actorUserId: userId,
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
        error: membershipsResult.error?.message ?? universeMembershipsResult.error?.message ?? 'Membership load failed.',
      },
      denied: 'membership_denied',
    };
  }

  const organizationMemberships = (membershipsResult.data ?? []).map(mapOrganizationMembership);
  const organizationIds = organizationMemberships.map((item) => item.organizationId);
  const organizationsResult =
    organizationIds.length > 0
      ? await supabase
          .from('xiv_organizations')
          .select('id,name,slug,status,created_by,industry,region_preference,created_at,updated_at')
          .in('id', organizationIds)
      : { data: [] as OrganizationRow[], error: null };

  const universesResult = await supabase
    .from('xiv_universes')
    .select(
      'id,organization_id,name,slug,status,classification,storage_tier,region_preference,created_by,created_at,updated_at',
    );

  if (organizationsResult.error || universesResult.error) {
    return {
      context: {
        actorUserId: userId,
        persistenceStatus: isMissingColumn(organizationsResult.error) ? 'schema_collision' : 'unavailable',
        organizations: [],
        activeOrganization: null,
        organizationMembership: null,
        organizationRole: null,
        universes: [],
        activeUniverse: null,
        universeMembership: null,
        universeRole: null,
        loading: false,
        error: organizationsResult.error?.message ?? universesResult.error?.message ?? 'Tenant load failed.',
      },
      denied: null,
    };
  }

  const selected = selectActiveTenant({
    actorUserId: userId,
    persistenceStatus,
    organizations: (organizationsResult.data ?? []).map(mapOrganization),
    organizationMemberships,
    universes: (universesResult.data ?? []).map(mapUniverse),
    universeMemberships: (universeMembershipsResult.data ?? []).map(mapUniverseMembership),
    requestedOrganizationId: selection.organizationId,
    requestedUniverseId: selection.universeId,
  });

  const store = getDefaultAgentRuntime().store;
  if (selected.denied) {
    recordTenantAudit(store, {
      event: selected.denied.toLowerCase().includes('universe') ? 'cross_universe_denied' : 'cross_org_denied',
      actorUserId: userId,
      organizationId: selection.organizationId,
      universeId: selection.universeId,
      decision: 'denied',
      reason: selected.denied,
    });
  }

  writeTenantSelection(userId, {
    organizationId: selected.context.activeOrganization?.id ?? null,
    universeId: selected.context.activeUniverse?.id ?? null,
  });

  return selected;
}

function mutationFailure(error: { message?: string; code?: string } | null): TenantMutationResult {
  const message = error?.message ?? 'Request failed.';
  if (/UNAUTHENTICATED|FORBIDDEN|42501|PGRST301/i.test(message) || error?.code === '42501') {
    return { status: 'denied', message };
  }
  if (isMissingRelation(error) || isMissingColumn(error)) {
    return { status: 'failed', message: 'XIV tenant schema is not applied or not readable.' };
  }
  return { status: 'failed', message };
}

export async function bootstrapOrganization(input: {
  userId: string;
  name: string;
  slug?: string;
}): Promise<TenantMutationResult> {
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugFromName(name)).toLowerCase();
  const { data, error } = await supabase.rpc('xiv_create_organization', {
    p_name: name,
    p_slug: slug,
  });
  if (error || !data) {
    const result = mutationFailure(error);
    recordTenantAudit(getDefaultAgentRuntime().store, {
      event: 'organization_bootstrap',
      actorUserId: input.userId,
      decision: 'denied',
      reason: result.message,
    });
    return result;
  }
  const row = (Array.isArray(data) ? data[0] : data) as OrganizationRow | undefined;
  if (!row?.id) {
    return { status: 'failed', message: 'Organization bootstrap returned no persisted row.' };
  }
  const organization = mapOrganization(row);
  writeTenantSelection(input.userId, { organizationId: organization.id, universeId: null });
  recordTenantAudit(getDefaultAgentRuntime().store, {
    event: 'organization_bootstrap',
    actorUserId: input.userId,
    organizationId: organization.id,
    decision: 'allowed',
    reason: 'Organization created through xiv_create_organization.',
  });
  return { status: 'ready', message: 'Organization created.', organization };
}

export async function bootstrapUniverse(input: {
  userId: string;
  organizationId: string;
  name: string;
  slug?: string;
  classification?: PersistedClassification;
  storageTier?: PersistedStorageTier;
}): Promise<TenantMutationResult> {
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugFromName(name)).toLowerCase();
  const { data, error } = await supabase.rpc('xiv_create_universe', {
    p_organization_id: input.organizationId,
    p_name: name,
    p_slug: slug,
    p_classification: input.classification ?? 'internal',
    p_storage_tier: input.storageTier ?? 'business',
  });
  if (error || !data) {
    const result = mutationFailure(error);
    recordTenantAudit(getDefaultAgentRuntime().store, {
      event: 'universe_bootstrap',
      actorUserId: input.userId,
      organizationId: input.organizationId,
      decision: 'denied',
      reason: result.message,
    });
    return result;
  }
  const row = (Array.isArray(data) ? data[0] : data) as UniverseRow | undefined;
  if (!row?.id) {
    return { status: 'failed', message: 'Universe bootstrap returned no persisted row.' };
  }
  const universe = mapUniverse(row);
  writeTenantSelection(input.userId, { organizationId: input.organizationId, universeId: universe.id });
  recordTenantAudit(getDefaultAgentRuntime().store, {
    event: 'universe_bootstrap',
    actorUserId: input.userId,
    organizationId: input.organizationId,
    universeId: universe.id,
    decision: 'allowed',
    reason: 'Universe created through xiv_create_universe.',
  });
  return { status: 'ready', message: 'Universe created.', universe };
}

export function persistenceLabel(status: PersistenceStatus) {
  const gate = tenantPersistenceStatus();
  if (status === 'ready' && gate === 'live') return 'TENANT PERSISTENCE LIVE. Memberships are readable. UI is not authorization.';
  if (status === 'schema_collision') {
    return 'TENANT PERSISTENCE BLOCKED. Hosted public.organizations remains unrelated. xiv_* hydration is not authoritative until hosted isolation is proven.';
  }
  if (status === 'not_applied') return 'TENANT PERSISTENCE BLOCKED. XIV tenant tables are not applied.';
  return 'TENANT PERSISTENCE BLOCKED. Tenant persistence is unavailable.';
}
