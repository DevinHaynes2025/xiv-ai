/**
 * Phase 2F-B authorization, gateway, and tenant-context cases.
 * Does not connect to hosted Supabase. Live isolation is documented separately.
 * Run with: npx tsx runtime/phase2fb.test.ts
 */
import assert from 'node:assert/strict';

import { createMemoryAuditStore } from './audit';
import { sanitizeAuditText } from './audit-access';
import { boundedAutonomyEnabled } from './authority';
import { createCompanyDataGateway } from './company-data';
import { createSessionRecordAdapter } from './context/adapters/session-records';
import { canReadMedia, createSignedUploadGrant } from './media';
import { evaluatePolicy } from './policy';
import { publishingWritesEnabled } from './publishing/policy';
import {
  authorizePersistedTenantContext,
  canCreateUniverse,
  canManageOrganization,
  canManageOrganizationMembership,
  canViewOrganization,
  canViewUniverse,
  clientSelectorIsNotAuthority,
  profileCompanyDoesNotGrantTenantAccess,
  selectActiveTenant,
  userCannotJoinArbitraryOrganization,
  userCannotJoinArbitraryUniverse,
  userRolesDoNotGrantTenantAccess,
} from './tenant';
import { recordTenantAudit } from './tenant/audit';
import { reviewPhase2FaMigration } from './tenant/migration-review';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './tenant';
import type { MediaAsset } from './media/types';
import type { Universe as InMemoryUniverse, UniverseMembership as InMemoryMembership } from './universe/types';

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
  createdBy: 'user_a',
  industry: null,
  regionPreference: null,
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
};

const orgB: Organization = { ...orgA, id: 'org_b', slug: 'org-b', name: 'Org B', createdBy: 'user_b' };

const universeA: Universe = {
  id: 'uni_a',
  organizationId: 'org_a',
  name: 'Universe A',
  slug: 'universe-a',
  status: 'active',
  classification: 'internal',
  storageTier: 'business',
  regionPreference: null,
  createdBy: 'user_a',
  createdAt: orgA.createdAt,
  updatedAt: orgA.updatedAt,
};

const universeB: Universe = {
  ...universeA,
  id: 'uni_b',
  organizationId: 'org_b',
  name: 'Universe B',
  slug: 'universe-b',
  createdBy: 'user_b',
};

function orgMember(
  userId: string,
  role: OrganizationMembership['role'],
  organizationId = 'org_a',
): OrganizationMembership {
  return {
    id: `om_${userId}_${organizationId}`,
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
    id: `um_${userId}_${universeId}`,
    universeId,
    userId,
    role,
    status: 'active',
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

function media(partial: Partial<MediaAsset> = {}): MediaAsset {
  return {
    mediaId: 'media_1',
    ownerId: 'user_a',
    universeId: 'uni_a',
    organizationId: 'org_a',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    checksum: 'abc123checksum',
    visibility: 'private',
    classification: 'internal',
    storageProvider: 'not_configured',
    storageKeyReference: '',
    encryptionReference: '',
    uploadStatus: 'quarantined',
    scanStatus: 'unavailable',
    processingStatus: 'pending',
    retentionClass: 'standard',
    createdAt: orgA.createdAt,
    source: 'company',
    prototype: true,
    publicUrl: null,
    ...partial,
  };
}

const inMemoryA: InMemoryUniverse = {
  universeId: 'uni_a',
  organizationId: 'org_a',
  name: 'Universe A',
  status: 'active',
  createdAt: orgA.createdAt,
  dataClassification: 'confidential',
  storageTier: 'business',
  regionPreference: 'eu-north',
  prototype: true,
};

const inMemoryMemberA: InMemoryMembership = {
  membershipId: 'mem_a',
  universeId: 'uni_a',
  organizationId: 'org_a',
  principalId: 'user_a',
  role: 'employee',
  status: 'active',
};

await test('1 creator can bootstrap organization', () => {
  const created = canViewOrganization({
    actorUserId: 'user_a',
    organization: orgA,
    membership: orgMember('user_a', 'owner'),
  });
  assert.equal(created.allowed, true);
  assert.equal(reviewPhase2FaMigration().ok, true);
});

await test('2 creator gets owner membership', () => {
  const membership = orgMember('user_a', 'owner');
  assert.equal(membership.role, 'owner');
  assert.equal(membership.userId, orgA.createdBy);
  assert.equal(
    canManageOrganization({
      actorUserId: 'user_a',
      organization: orgA,
      membership,
    }).allowed,
    true,
  );
});

await test('3 non-member cannot read organization', () => {
  const result = canViewOrganization({
    actorUserId: 'user_b',
    organization: orgA,
    membership: orgMember('user_a', 'owner'),
  });
  assert.equal(result.allowed, false);
});

await test('4 Org A cannot read Org B', () => {
  const result = canViewOrganization({
    actorUserId: 'user_a',
    organization: orgB,
    membership: orgMember('user_a', 'owner'),
  });
  assert.equal(result.allowed, false);
});

await test('5 org viewer cannot manage org', () => {
  const result = canManageOrganization({
    actorUserId: 'user_viewer',
    organization: orgA,
    membership: orgMember('user_viewer', 'viewer'),
  });
  assert.equal(result.allowed, false);
});

await test('6 member cannot self-promote', () => {
  const result = canManageOrganizationMembership({
    actorUserId: 'user_member',
    organization: orgA,
    membership: orgMember('user_member', 'member'),
    targetUserId: 'user_member',
    nextRole: 'owner',
  });
  assert.equal(result.allowed, false);
});

await test('7 arbitrary membership insert denied', () => {
  assert.equal(userCannotJoinArbitraryOrganization().allowed, false);
  assert.equal(userCannotJoinArbitraryUniverse().allowed, false);
});

await test('8 authorized user can bootstrap Universe', () => {
  const result = canCreateUniverse({
    actorUserId: 'user_a',
    organization: orgA,
    membership: orgMember('user_a', 'owner'),
  });
  assert.equal(result.allowed, true);
});

await test('9 unauthorized user cannot create Universe', () => {
  const stranger = canCreateUniverse({
    actorUserId: 'user_b',
    organization: orgA,
    membership: orgMember('user_b', 'owner', 'org_b'),
  });
  assert.equal(stranger.allowed, false);
  const viewer = canCreateUniverse({
    actorUserId: 'user_viewer',
    organization: orgA,
    membership: orgMember('user_viewer', 'viewer'),
  });
  assert.equal(viewer.allowed, false);
});

await test('10 Universe A cannot be read by Org B', () => {
  const result = canViewUniverse({
    actorUserId: 'user_b',
    organization: orgB,
    universe: universeA,
    organizationMembership: orgMember('user_b', 'owner', 'org_b'),
    universeMembership: universeMember('user_b', 'owner', 'uni_b'),
  });
  assert.equal(result.allowed, false);
});

await test('11 Universe membership without org relationship denied', () => {
  const result = canViewUniverse({
    actorUserId: 'user_only_universe',
    organization: orgA,
    universe: universeA,
    universeMembership: universeMember('user_only_universe', 'member'),
  });
  assert.equal(result.allowed, false);
});

await test('12 user_roles does not grant tenant access', () => {
  assert.equal(userRolesDoNotGrantTenantAccess().allowed, false);
  const result = authorizePersistedTenantContext({
    actorUserId: 'user_exec',
    selectorOrganizationId: orgA.id,
    experienceRole: 'executive',
    scope: 'organization',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /user_roles/i);
});

await test('13 profiles.company does not grant tenant access', () => {
  assert.equal(profileCompanyDoesNotGrantTenantAccess().allowed, false);
  const result = authorizePersistedTenantContext({
    actorUserId: 'user_exec',
    selectorOrganizationId: orgA.id,
    profileCompany: 'Acme entered on a profile',
    scope: 'organization',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /profiles\.company/i);
});

await test('14 client org id alone grants nothing', () => {
  assert.equal(clientSelectorIsNotAuthority(orgA.id).allowed, false);
  const result = authorizePersistedTenantContext({
    actorUserId: 'user_x',
    selectorOrganizationId: orgA.id,
    scope: 'organization',
  });
  assert.equal(result.allowed, false);
});

await test('15 client Universe id alone grants nothing', () => {
  assert.equal(clientSelectorIsNotAuthority(universeA.id).allowed, false);
  const result = authorizePersistedTenantContext({
    actorUserId: 'user_x',
    selectorOrganizationId: orgA.id,
    selectorUniverseId: universeA.id,
    scope: 'universe',
  });
  assert.equal(result.allowed, false);
});

await test('16 active tenant context uses persisted membership', () => {
  const selected = selectActiveTenant({
    actorUserId: 'user_a',
    persistenceStatus: 'ready',
    organizations: [orgA, orgB],
    organizationMemberships: [orgMember('user_a', 'owner')],
    universes: [universeA, universeB],
    universeMemberships: [universeMember('user_a', 'owner')],
    requestedOrganizationId: orgB.id,
    requestedUniverseId: universeB.id,
  });
  assert.equal(selected.context.activeOrganization?.id, 'org_a');
  assert.equal(selected.context.activeUniverse?.id, 'uni_a');
  assert.match(selected.denied ?? '', /denied/i);
  assert.equal(selected.context.organizations.some((org) => org.id === 'org_b'), false);
});

await test('17 Guardian has no tenant bypass', async () => {
  const helper = canViewOrganization({
    actorUserId: 'user_a',
    organization: orgA,
    membership: orgMember('user_a', 'owner'),
    agentId: 'guardian',
  });
  assert.equal(helper.allowed, false);
  const gateway = createCompanyDataGateway(
    createSessionRecordAdapter({
      ownerId: 'user_a',
      reader: () => [
        {
          kind: 'profile_identity',
          ownerId: 'user_a',
          scope: 'organization',
          sourceRecordId: 'user_a',
          organizationId: 'org_a',
          universeId: null,
        },
      ],
    }),
  );
  const result = await gateway.read({
    agentId: 'guardian',
    ownerId: 'user_a',
    organizationId: 'org_a',
    organizationMembership: orgMember('user_a', 'owner'),
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(result.allowed, false);
});

await test('18 Executive Agent has no tenant bypass', async () => {
  const helper = canViewUniverse({
    actorUserId: 'user_a',
    organization: orgA,
    universe: universeA,
    organizationMembership: orgMember('user_a', 'owner'),
    universeMembership: universeMember('user_a', 'owner'),
    agentId: 'executive',
  });
  assert.equal(helper.allowed, false);
  const gateway = createCompanyDataGateway(
    createSessionRecordAdapter({
      ownerId: 'user_a',
      reader: () => [
        {
          kind: 'profile_identity',
          ownerId: 'user_a',
          scope: 'organization',
          sourceRecordId: 'user_a',
          organizationId: 'org_a',
          universeId: null,
        },
      ],
    }),
  );
  const result = await gateway.read({
    agentId: 'executive',
    ownerId: 'user_a',
    organizationId: 'org_a',
    experienceRole: 'executive',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(result.allowed, false);
});

await test('19 personal scope remains isolated', async () => {
  const result = await createCompanyDataGateway(
    createSessionRecordAdapter({
      ownerId: 'user_a',
      reader: () => [
        {
          kind: 'profile_identity',
          ownerId: 'user_a',
          scope: 'personal',
          sourceRecordId: 'user_a',
          organizationId: null,
          universeId: null,
          company: 'Acme entered on a profile',
        },
      ],
    }),
  ).read({
    agentId: 'executive',
    ownerId: 'user_other',
    organizationId: orgA.id,
    profileCompany: 'Acme entered on a profile',
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
    scope: 'personal',
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /owner mismatch/i);
});

await test('20 existing Phase 2A-2F-A helpers stay deny-closed', () => {
  assert.equal(reviewPhase2FaMigration().ok, true);
  assert.equal(reviewPhase2FaMigration().hasUsingTrue, false);
  assert.equal(canViewOrganization({ actorUserId: 'x' }).allowed, false);
});

await test('21 L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

await test('22 production agent writes remain denied', () => {
  assert.equal(publishingWritesEnabled(), false);
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
});

await test('23 media cloud upload remains unavailable', () => {
  const grant = createSignedUploadGrant({
    mediaId: 'media_1',
    ownerId: 'user_a',
    universeId: 'uni_a',
    organizationId: 'org_a',
    allowedMime: 'image/jpeg',
    maxBytes: 1024,
    visibility: 'organization',
    classification: 'internal',
  });
  assert.equal(grant.uploadEnabled, false);
  assert.equal(grant.configured, false);
  assert.equal(grant.credentialsReturned, false);
  assert.equal(media().scanStatus, 'unavailable');
});

await test('24 cross-Universe media access remains denied', () => {
  const result = canReadMedia({
    asset: media(),
    universe: { ...inMemoryA, universeId: 'uni_b', organizationId: 'org_b' },
    membership: { ...inMemoryMemberA, universeId: 'uni_b', organizationId: 'org_b' },
  });
  assert.equal(result.allowed, false);
});

await test('tenant audit never records secrets', () => {
  const store = createMemoryAuditStore();
  recordTenantAudit(store, {
    event: 'cross_org_denied',
    actorUserId: 'user_a',
    organizationId: 'org_b',
    decision: 'denied',
    reason: 'Cross-organization access denied',
  });
  const note = store.listEvents()[0]?.note ?? '';
  assert.match(note, /tenant denied/);
  assert.equal(sanitizeAuditText('Authorization token=super-secret'), '');
  assert.doesNotMatch(note, /token=/);
});

await test('authorized org membership can pass the gateway', async () => {
  const result = await createCompanyDataGateway(
    createSessionRecordAdapter({
      ownerId: 'user_a',
      reader: () => [
        {
          kind: 'profile_identity',
          ownerId: 'user_a',
          scope: 'organization',
          sourceRecordId: 'user_a',
          organizationId: 'org_a',
          universeId: null,
        },
      ],
    }),
  ).read({
    agentId: 'technology',
    ownerId: 'user_a',
    organizationId: 'org_a',
    organizationMembership: orgMember('user_a', 'member'),
    toolId: 'company_data_reader',
    capability: 'records',
    mode: 'read',
    classification: 'internal',
    domain: 'technology',
  });
  assert.equal(result.allowed, true);
});

console.log('All Phase 2F-B cases passed.');
