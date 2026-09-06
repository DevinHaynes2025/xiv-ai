/**
 * Persistence-aligned tenant model for Phase 2F.
 * Matches supabase/migrations/20260906220000_persistent_organizations_and_universes.sql
 * Hydrate only from authorized persisted rows. Never synthesize ids or memberships.
 */

export const ORGANIZATION_ROLES = [
  'owner',
  'executive',
  'admin',
  'manager',
  'employee',
  'member',
  'viewer',
] as const;

export const UNIVERSE_ROLES = [
  'owner',
  'executive',
  'admin',
  'operator',
  'employee',
  'member',
  'viewer',
] as const;

export const MEMBERSHIP_STATUSES = ['active', 'invited', 'suspended', 'revoked'] as const;
export const ORGANIZATION_STATUSES = ['active', 'suspended', 'archived'] as const;
export const UNIVERSE_STATUSES = ['active', 'suspended', 'archived'] as const;
export const DATA_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'] as const;
export const STORAGE_TIERS = ['consumer', 'professional', 'business', 'enterprise', 'sovereign'] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];
export type UniverseRole = (typeof UNIVERSE_ROLES)[number];
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];
export type PersistedUniverseStatus = (typeof UNIVERSE_STATUSES)[number];
export type PersistedClassification = (typeof DATA_CLASSIFICATIONS)[number];
export type PersistedStorageTier = (typeof STORAGE_TIERS)[number];

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdBy: string | null;
  industry: string | null;
  regionPreference: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Universe = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  status: PersistedUniverseStatus;
  classification: PersistedClassification;
  storageTier: PersistedStorageTier;
  regionPreference: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMembership = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
};

export type UniverseMembership = {
  id: string;
  universeId: string;
  userId: string;
  role: UniverseRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
};

export const ORG_MANAGE_ROLES: readonly OrganizationRole[] = ['owner', 'admin'];
export const ORG_CREATE_UNIVERSE_ROLES: readonly OrganizationRole[] = ['owner', 'admin', 'executive'];
export const ORG_ROSTER_ROLES: readonly OrganizationRole[] = ['owner', 'admin', 'executive', 'manager'];
export const UNIVERSE_MANAGE_ROLES: readonly UniverseRole[] = ['owner', 'admin'];
export const UNIVERSE_ROSTER_ROLES: readonly UniverseRole[] = ['owner', 'admin', 'executive'];
