/**
 * Owner protection, immutable tenant keys, and Universe create authority.
 * UNIT/SEMANTIC TEST is not HOSTED RLS PROOF.
 */
import assert from 'node:assert/strict';

import { reviewPhase2HaReconciliation } from './tenant/reconciliation-review';
import {
  reviewSecurityDefinerGrantPolicy,
  supabaseSecurityHardeningDoesNotMarkLive,
} from './tenant/security-definer-review';
import {
  canCreateUniverse,
  canManageOrganizationMembership,
  canManageUniverseMembership,
  canRetargetUniverseOrganization,
  internalPolicyHelperIsNotPublicRpc,
} from './tenant';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './tenant';
import { boundedAutonomyEnabled } from './authority';
import { globalDataFabricProductionLive } from './network-os';
import { agentReceivesRawDbCredential } from './osfund/gateway';
import { agentReceivesSupabaseServiceRoleKey } from './osfund/supabase';
import { databaseRouterReturnsCredentials } from './osfund/router';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const orgA: Organization = {
  id: 'org_a',
  name: 'Org A',
  slug: 'org-a',
  status: 'active',
  createdBy: 'user_owner',
  industry: null,
  regionPreference: null,
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
};
const orgB: Organization = { ...orgA, id: 'org_b', slug: 'org-b', name: 'Org B' };
const uniA: Universe = {
  id: 'uni_a',
  organizationId: 'org_a',
  name: 'Universe A',
  slug: 'uni-a',
  status: 'active',
  classification: 'internal',
  storageTier: 'business',
  regionPreference: null,
  createdBy: 'user_owner',
  createdAt: orgA.createdAt,
  updatedAt: orgA.updatedAt,
};
const uniB: Universe = { ...uniA, id: 'uni_b', organizationId: 'org_b', slug: 'uni-b', name: 'Universe B' };

function orgMember(userId: string, role: OrganizationMembership['role']): OrganizationMembership {
  return {
    id: `om_${userId}`,
    organizationId: 'org_a',
    userId,
    role,
    status: 'active',
    roleVersion: 1,
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

function uniMember(userId: string, role: UniverseMembership['role']): UniverseMembership {
  return {
    id: `um_${userId}`,
    universeId: 'uni_a',
    userId,
    role,
    status: 'active',
    roleVersion: 1,
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

test('authored SQL review includes owner and immutability guards', () => {
  const review = reviewPhase2HaReconciliation();
  assert.equal(review.ok, true, review.findings.join('; '));
});

test('SECURITY DEFINER grant policy: helpers in xiv_internal; bootstrap RPCs intentional', () => {
  const review = reviewSecurityDefinerGrantPolicy();
  assert.equal(review.ok, true, review.findings.join('; '));
  assert.equal(review.membershipHelpersSchema, 'xiv_internal');
  assert.deepEqual(review.intentionalPublicRpcs, ['xiv_create_organization', 'xiv_create_universe']);
  assert.equal(review.rlsAutoEnableCallableByAnonOrAuthenticated, false);
  assert.equal(review.leakedPasswordProtectionClaimedFixedInSql, false);
  assert.equal(supabaseSecurityHardeningDoesNotMarkLive(), true);
});

test('agent cannot obtain DB credentials; L4 disabled; GDF false', () => {
  assert.equal(agentReceivesRawDbCredential(), false);
  assert.equal(agentReceivesSupabaseServiceRoleKey(), false);
  assert.equal(databaseRouterReturnsCredentials(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(globalDataFabricProductionLive(), false);
});

test('admin attempts to demote owner -> DENIED', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_admin',
    organization: orgA,
    membership: orgMember('user_admin', 'admin'),
    targetUserId: 'user_owner',
    targetCurrentRole: 'owner',
    nextRole: 'admin',
    action: 'update',
  });
  assert.equal(result.allowed, false);
});

test('admin attempts to delete owner -> DENIED', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_admin',
    organization: orgA,
    membership: orgMember('user_admin', 'admin'),
    targetUserId: 'user_owner',
    targetCurrentRole: 'owner',
    action: 'delete',
  });
  assert.equal(result.allowed, false);
});

test('admin attempts to suspend owner -> DENIED', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_admin',
    organization: orgA,
    membership: orgMember('user_admin', 'admin'),
    targetUserId: 'user_owner',
    targetCurrentRole: 'owner',
    targetCurrentStatus: 'active',
    nextStatus: 'suspended',
    action: 'update',
  });
  assert.equal(result.allowed, false);
});

test('admin attempts to create owner -> DENIED', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_admin',
    organization: orgA,
    membership: orgMember('user_admin', 'admin'),
    targetUserId: 'user_new',
    nextRole: 'owner',
    action: 'insert',
  });
  assert.equal(result.allowed, false);
});

test('owner attempts to remove final owner -> DENIED', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_owner',
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
    targetUserId: 'user_other_owner',
    targetCurrentRole: 'owner',
    targetCurrentStatus: 'active',
    action: 'delete',
    activeOwnerCount: 1,
  });
  assert.equal(result.allowed, false);
});

test('user attempts to retarget membership organization -> DENIED', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_owner',
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
    targetUserId: 'user_member',
    nextOrganizationId: orgB.id,
    action: 'update',
  });
  assert.equal(result.allowed, false);
});

test('user attempts to retarget membership Universe -> DENIED', () => {
  const result = canManageUniverseMembership({
    actorUserId: 'user_owner',
    organization: orgA,
    universe: uniA,
    organizationMembership: orgMember('user_owner', 'owner'),
    universeMembership: uniMember('user_owner', 'owner'),
    targetUserId: 'user_member',
    nextUniverseId: uniB.id,
  });
  assert.equal(result.allowed, false);
});

test('admin attempts to move Universe to another organization -> DENIED', () => {
  assert.equal(canRetargetUniverseOrganization().allowed, false);
});

test('executive attempts to create Universe -> DENIED', () => {
  const result = canCreateUniverse({
    actorUserId: 'user_exec',
    organization: orgA,
    membership: orgMember('user_exec', 'executive'),
  });
  assert.equal(result.allowed, false);
});

test('direct call to restricted internal helper -> DENIED', () => {
  assert.equal(internalPolicyHelperIsNotPublicRpc().allowed, false);
});

console.log('All tenant hardening cases passed.');
