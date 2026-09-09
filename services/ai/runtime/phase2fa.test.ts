/**
 * Phase 2F-A authorization semantics. Does not connect to Supabase.
 * Run with: npx tsx runtime/phase2fa.test.ts
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { scopeFromRelationship } from './context/adapters/scope';
import { evaluatePolicy } from './policy';
import { publishingWritesEnabled } from './publishing/policy';
import {
  canCreateUniverse,
  canManageOrganization,
  canManageOrganizationMembership,
  canManageUniverse,
  canManageUniverseMembership,
  canViewOrganization,
  canViewUniverse,
  clientSelectorIsNotAuthority,
  userCannotJoinArbitraryOrganization,
} from './tenant';
import { reviewPhase2FaMigration } from './tenant/migration-review';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './tenant';

function test(name: string, run: () => void | Promise<void>) {
  return Promise.resolve()
    .then(run)
    .then(() => {
      console.log(`ok - ${name}`);
    });
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

const universeA: Universe = {
  id: 'uni_a',
  organizationId: 'org_a',
  name: 'Universe A',
  slug: 'universe-a',
  status: 'active',
  classification: 'internal',
  storageTier: 'business',
  regionPreference: null,
  createdBy: 'user_owner',
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
};

const universeB: Universe = { ...universeA, id: 'uni_b', organizationId: 'org_b', slug: 'universe-b', name: 'Universe B' };

function orgMember(
  userId: string,
  role: OrganizationMembership['role'],
  organizationId = 'org_a',
): OrganizationMembership {
  return {
    id: `om_${userId}`,
    organizationId,
    userId,
    role,
    status: 'active',
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

function universeMember(
  userId: string,
  role: UniverseMembership['role'],
  universeId = 'uni_a',
): UniverseMembership {
  return {
    id: `um_${userId}`,
    universeId,
    userId,
    role,
    status: 'active',
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

await test('1 unauthenticated user cannot access org', () => {
  const result = canViewOrganization({
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
  });
  assert.equal(result.allowed, false);
});

await test('2 non-member cannot access org', () => {
  const result = canViewOrganization({
    actorUserId: 'stranger',
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
  });
  assert.equal(result.allowed, false);
});

await test('3 active member can view org', () => {
  const result = canViewOrganization({
    actorUserId: 'user_member',
    organization: orgA,
    membership: orgMember('user_member', 'member'),
  });
  assert.equal(result.allowed, true);
});

await test('4 viewer cannot manage org', () => {
  const result = canManageOrganization({
    actorUserId: 'user_viewer',
    organization: orgA,
    membership: orgMember('user_viewer', 'viewer'),
  });
  assert.equal(result.allowed, false);
});

await test('5 owner can manage org', () => {
  const result = canManageOrganization({
    actorUserId: 'user_owner',
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
  });
  assert.equal(result.allowed, true);
});

await test('6 member cannot self-promote', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_owner',
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
    targetUserId: 'user_owner',
    nextRole: 'owner',
  });
  assert.equal(result.allowed, false);
});

await test('7 user cannot join arbitrary org by insert', () => {
  const result = userCannotJoinArbitraryOrganization();
  assert.equal(result.allowed, false);
});

await test('8 Universe from Org A cannot be accessed by Org B member', () => {
  const result = canViewUniverse({
    actorUserId: 'user_b',
    organization: orgA,
    universe: universeA,
    organizationMembership: orgMember('user_b', 'member', 'org_b'),
    universeMembership: universeMember('user_b', 'member', 'uni_b'),
  });
  assert.equal(result.allowed, false);
});

await test('9 Universe member must also satisfy organization relationship', () => {
  const result = canViewUniverse({
    actorUserId: 'user_only_universe',
    organization: orgA,
    universe: universeA,
    universeMembership: universeMember('user_only_universe', 'member'),
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /organization relationship/i);
});

await test('10 Universe viewer cannot manage Universe', () => {
  const result = canManageUniverse({
    actorUserId: 'user_viewer',
    organization: orgA,
    universe: universeA,
    organizationMembership: orgMember('user_viewer', 'viewer'),
    universeMembership: universeMember('user_viewer', 'viewer'),
  });
  assert.equal(result.allowed, false);
});

await test('11 Universe admin can perform allowed management', () => {
  const result = canManageUniverse({
    actorUserId: 'user_uadmin',
    organization: orgA,
    universe: universeA,
    organizationMembership: orgMember('user_uadmin', 'employee'),
    universeMembership: universeMember('user_uadmin', 'admin'),
  });
  assert.equal(result.allowed, true);
});

await test('12 personal scope remains separate from organization scope', () => {
  assert.equal(scopeFromRelationship({ organizationId: null, universeId: null }), 'personal');
  assert.notEqual(orgA.name, 'Acme entered on a profile');
});

await test('13 client-provided org id alone grants nothing', () => {
  const selector = clientSelectorIsNotAuthority(orgA.id);
  assert.equal(selector.allowed, false);
  const result = canViewOrganization({
    actorUserId: 'user_x',
    organization: { id: orgA.id },
  });
  assert.equal(result.allowed, false);
});

await test('14 client-provided Universe id alone grants nothing', () => {
  const selector = clientSelectorIsNotAuthority(universeA.id);
  assert.equal(selector.allowed, false);
  const result = canViewUniverse({
    actorUserId: 'user_x',
    organization: orgB,
    universe: universeA,
    organizationMembership: orgMember('user_x', 'owner', 'org_b'),
  });
  assert.equal(result.allowed, false);
});

await test('15 Guardian still has no tenant bypass', () => {
  const result = canViewOrganization({
    actorUserId: 'user_owner',
    organization: orgA,
    membership: orgMember('user_owner', 'owner'),
    agentId: 'guardian',
  });
  assert.equal(result.allowed, false);
});

await test('16 Executive Agent still has no tenant bypass', () => {
  const result = canViewUniverse({
    actorUserId: 'user_owner',
    organization: orgA,
    universe: universeA,
    organizationMembership: orgMember('user_owner', 'owner'),
    universeMembership: universeMember('user_owner', 'owner'),
    agentId: 'executive',
  });
  assert.equal(result.allowed, false);
});

await test('17 L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

await test('18 production writes remain governed', () => {
  assert.equal(publishingWritesEnabled(), false);
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
});

await test('20 no policy helper contains unconditional private access', () => {
  assert.equal(canCreateUniverse({ actorUserId: 'x' }).allowed, false);
  assert.equal(canManageUniverseMembership({ actorUserId: 'x' }).allowed, false);
  assert.equal(reviewPhase2FaMigration().hasUsingTrue, false);
  assert.equal(reviewPhase2FaMigration().hasWithCheckTrue, false);
});

await test('static migration policy review is clean', () => {
  const review = reviewPhase2FaMigration();
  assert.equal(review.ok, true, review.findings.join('; '));
  assert.ok(review.policyCount >= 8);
});

await test('cross-org Universe B remains isolated', () => {
  const result = canViewUniverse({
    actorUserId: 'user_a',
    organization: orgA,
    universe: universeB,
    organizationMembership: orgMember('user_a', 'owner'),
    universeMembership: universeMember('user_a', 'owner'),
  });
  assert.equal(result.allowed, false);
});

console.log('All Phase 2F-A cases passed.');
