/**
 * Defense-in-depth TypeScript helpers mirroring intended RLS semantics.
 *
 * client/server policy helper  !=  database authorization
 * These functions never replace RLS. They never treat a client-supplied
 * organizationId or universeId as authority. Agents are not tenant principals.
 */

import type { XivAgentId } from '../agents';
import {
  ORG_CREATE_UNIVERSE_ROLES,
  ORG_MANAGE_ROLES,
  ORG_ROSTER_ROLES,
  UNIVERSE_MANAGE_ROLES,
  UNIVERSE_ROSTER_ROLES,
  type MembershipStatus,
  type Organization,
  type OrganizationMembership,
  type OrganizationRole,
  type Universe,
  type UniverseMembership,
  type UniverseRole,
} from './types';

export type TenantDecision = {
  allowed: boolean;
  reason: string;
};

function deny(reason: string): TenantDecision {
  return { allowed: false, reason };
}

function allow(reason: string): TenantDecision {
  return { allowed: true, reason };
}

function present(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function activeMembership<T extends { status: string; userId: string }>(
  membership: T | null | undefined,
  actorUserId?: string | null,
): membership is T {
  return Boolean(
    membership &&
      membership.status === 'active' &&
      present(actorUserId) &&
      membership.userId === actorUserId,
  );
}

function agentBypassAttempt(agentId?: XivAgentId | string | null) {
  if (!agentId) return null;
  return deny('Agents are not database principals. Agent identity is not tenant membership: DENY');
}

export function clientSelectorIsNotAuthority(selector?: string | null): TenantDecision {
  void selector;
  return deny('Client-supplied id is a selector only and grants nothing: DENY');
}

export function canViewOrganization(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  membership?: OrganizationMembership | null;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const blocked = agentBypassAttempt(input.agentId);
  if (blocked) return blocked;
  if (!present(input.actorUserId)) return deny('Unauthenticated user cannot access org: DENY');
  if (!input.organization?.id) return deny('Unknown organization: DENY');
  if (!activeMembership(input.membership, input.actorUserId)) {
    return deny('Non-member cannot access org: DENY');
  }
  if (input.membership.organizationId !== input.organization.id) {
    return deny('Membership is for another organization: DENY');
  }
  return allow('Active member can view organization.');
}

export function canManageOrganization(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  membership?: OrganizationMembership | null;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const view = canViewOrganization(input);
  if (!view.allowed) return view;
  const role = input.membership?.role;
  if (!role || !ORG_MANAGE_ROLES.includes(role)) {
    return deny('Role cannot manage organization: DENY');
  }
  return allow('Owner or admin can manage organization.');
}

export function canCreateUniverse(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  membership?: OrganizationMembership | null;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const view = canViewOrganization(input);
  if (!view.allowed) return view;
  const role = input.membership?.role;
  if (!role || !ORG_CREATE_UNIVERSE_ROLES.includes(role)) {
    return deny('Role cannot create a Universe: DENY');
  }
  return allow('Organization owner or admin may create a Universe.');
}

export function canViewUniverse(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const blocked = agentBypassAttempt(input.agentId);
  if (blocked) return blocked;
  const org = canViewOrganization({
    actorUserId: input.actorUserId,
    organization: input.organization,
    membership: input.organizationMembership,
  });
  if (!org.allowed) return deny('Universe member must also satisfy organization relationship: DENY');
  if (!input.universe?.id || !input.universe.organizationId) return deny('Unknown Universe: DENY');
  if (!input.organization?.id || input.universe.organizationId !== input.organization.id) {
    return deny('Universe from Org A cannot be accessed by Org B member: DENY');
  }
  const orgRole = input.organizationMembership?.role;
  const orgCanSeeAll = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'executive';
  if (orgCanSeeAll) return allow('Organization administrator may view Universes in the organization.');
  if (!activeMembership(input.universeMembership, input.actorUserId)) {
    return deny('No active Universe membership: DENY');
  }
  if (input.universeMembership.universeId !== input.universe.id) {
    return deny('Universe membership is for another Universe: DENY');
  }
  return allow('Organization member with Universe membership can view the Universe.');
}

export function canManageUniverse(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const view = canViewUniverse(input);
  if (!view.allowed) return view;
  const orgRole = input.organizationMembership?.role;
  if (orgRole && ORG_MANAGE_ROLES.includes(orgRole)) {
    return allow('Organization owner or admin can manage the Universe.');
  }
  const role = input.universeMembership?.role;
  if (!role || !UNIVERSE_MANAGE_ROLES.includes(role)) {
    return deny('Universe viewer cannot manage Universe: DENY');
  }
  return allow('Universe admin can perform allowed management.');
}

export function canManageOrganizationMembership(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  membership?: OrganizationMembership | null;
  targetUserId?: string | null;
  targetCurrentRole?: OrganizationRole | null;
  targetCurrentStatus?: MembershipStatus | null;
  nextRole?: OrganizationRole | null;
  nextStatus?: MembershipStatus | null;
  nextOrganizationId?: string | null;
  nextUserId?: string | null;
  action?: 'insert' | 'update' | 'delete';
  activeOwnerCount?: number;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const manage = canManageOrganization(input);
  if (!manage.allowed) return manage;
  if (present(input.targetUserId) && input.targetUserId === input.actorUserId) {
    return deny('Member cannot self-promote or alter their own membership: DENY');
  }
  if (
    present(input.nextOrganizationId) &&
    input.organization?.id &&
    input.nextOrganizationId !== input.organization.id
  ) {
    return deny('Organization membership organization_id cannot be retargeted: DENY');
  }
  if (present(input.nextUserId) && present(input.targetUserId) && input.nextUserId !== input.targetUserId) {
    return deny('Organization membership user_id cannot be retargeted: DENY');
  }
  const actorRole = input.membership?.role;
  const targetIsOwner = input.targetCurrentRole === 'owner';
  const makingOwner = input.nextRole === 'owner';
  const ownerAffect =
    targetIsOwner ||
    makingOwner ||
    (input.action === 'delete' && targetIsOwner);
  if (actorRole === 'admin' && ownerAffect) {
    return deny('Admin cannot demote, suspend, revoke, delete, change, or create an OWNER: DENY');
  }
  if (input.nextRole === 'owner' && actorRole !== 'owner') {
    return deny('Only an owner may grant owner: DENY');
  }
  const removingActiveOwner =
    targetIsOwner &&
    (input.targetCurrentStatus ?? 'active') === 'active' &&
    (input.action === 'delete' ||
      (input.nextRole != null && input.nextRole !== 'owner') ||
      (input.nextStatus != null && input.nextStatus !== 'active'));
  if (removingActiveOwner && (input.activeOwnerCount ?? 1) <= 1) {
    return deny('Cannot remove the final active OWNER: DENY');
  }
  return allow('Authorized owner/admin may manage another member.');
}

export function canManageUniverseMembership(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  targetUserId?: string | null;
  targetIsOrgMember?: boolean;
  targetCurrentRole?: UniverseRole | null;
  nextRole?: UniverseRole | null;
  nextUniverseId?: string | null;
  nextUserId?: string | null;
  agentId?: XivAgentId | string | null;
}): TenantDecision {
  const manage = canManageUniverse(input);
  if (!manage.allowed) return manage;
  if (present(input.targetUserId) && input.targetUserId === input.actorUserId) {
    return deny('Member cannot self-promote or alter their own Universe membership: DENY');
  }
  if (present(input.nextUniverseId) && input.universe?.id && input.nextUniverseId !== input.universe.id) {
    return deny('Universe membership universe_id cannot be retargeted: DENY');
  }
  if (present(input.nextUserId) && present(input.targetUserId) && input.nextUserId !== input.targetUserId) {
    return deny('Universe membership user_id cannot be retargeted: DENY');
  }
  if (input.targetIsOrgMember === false) {
    return deny('Universe membership requires an active organization membership: DENY');
  }
  const orgOwner = input.organizationMembership?.role === 'owner';
  const universeOwner = input.universeMembership?.role === 'owner';
  const actorIsOwner = orgOwner || universeOwner;
  if (input.nextRole === 'owner' && !actorIsOwner) {
    return deny('Only an owner may grant Universe owner: DENY');
  }
  if (
    input.organizationMembership?.role === 'admin' &&
    !orgOwner &&
    (input.targetCurrentRole === 'owner' || input.nextRole === 'owner')
  ) {
    return deny('Admin cannot demote, suspend, revoke, delete, change, or create a Universe OWNER: DENY');
  }
  return allow('Authorized admin may manage another Universe member.');
}

export function canRetargetUniverseOrganization(): TenantDecision {
  return deny('Universe organization_id cannot be retargeted: DENY');
}

export function internalPolicyHelperIsNotPublicRpc(): TenantDecision {
  return deny('Internal policy helper is not a public application RPC: DENY');
}

export function canViewOrganizationRoster(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  membership?: OrganizationMembership | null;
}): TenantDecision {
  const view = canViewOrganization(input);
  if (!view.allowed) return view;
  const role = input.membership?.role;
  if (!role || !ORG_ROSTER_ROLES.includes(role)) {
    return deny('Role cannot view the organization roster: DENY');
  }
  return allow('Roster role may view organization memberships.');
}

export function canViewUniverseRoster(input: {
  actorUserId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
}): TenantDecision {
  const view = canViewUniverse(input);
  if (!view.allowed) return view;
  const orgRole = input.organizationMembership?.role;
  if (orgRole && ORG_ROSTER_ROLES.includes(orgRole)) {
    return allow('Organization roster role may view Universe memberships.');
  }
  const role = input.universeMembership?.role;
  if (!role || !UNIVERSE_ROSTER_ROLES.includes(role)) {
    return deny('Role cannot view the Universe roster: DENY');
  }
  return allow('Universe roster role may view Universe memberships.');
}

export function userCannotJoinArbitraryOrganization(): TenantDecision {
  return deny('User cannot join an arbitrary organization by insert: DENY');
}

export function userCannotJoinArbitraryUniverse(): TenantDecision {
  return deny('User cannot join an arbitrary Universe by insert: DENY');
}

export function userRolesDoNotGrantTenantAccess(): TenantDecision {
  return deny('user_roles experience role does not grant tenant access: DENY');
}

export function profileCompanyDoesNotGrantTenantAccess(): TenantDecision {
  return deny('profiles.company is personal identity and does not grant tenant access: DENY');
}
