/**
 * Phase 2H-B hosted isolation, World Bank fetch, and business-module readiness.
 * Run with: npx tsx runtime/phase2hb.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { boundedAutonomyEnabled } from './authority';
import { createCaseFromPublicEvent } from './cases';
import { agentDebuggerCanDeploy } from './diagnostics';
import { africaIsNotOneMarket, chinaDeploymentCapability, xivIsDeployedInChina } from './global';
import { canHostBusinessLive, consumerCanHostBusinessLive } from './live';
import {
  consumerInstallDenied,
  insuranceUnderwritingDecision,
  modulePermissionDefault,
  realEstateFabricatesProperty,
  requestModulePermissions,
  scoreLead,
  wmsInventoriesStock,
} from './modules';
import { evaluatePolicy } from './policy';
import {
  africaCountryAvailability,
  businessEventFromWorldBank,
  fetchWorldBankObservation,
  mapWorldBankRecord,
  missingCountryValueIsFabricated,
  worldBankIsRealtime,
} from './providers';
import { publishingWritesEnabled } from './publishing/policy';
import { requireFreshAuthorization } from './security/freshness';
import {
  canManageOrganizationMembership,
  canViewOrganization,
  canViewUniverse,
  clientSelectorIsNotAuthority,
  evaluateLiveIsolationPlan,
  profileCompanyDoesNotGrantTenantAccess,
  recordHostedApplyEvidence,
  recordHostedIsolationEvidence,
  resetHostedProofForTests,
  tenantPersistenceIsLive,
  userCannotJoinArbitraryOrganization,
  userCannotJoinArbitraryUniverse,
  userRolesDoNotGrantTenantAccess,
} from './tenant';
import { hostedApplyGate } from './tenant/hosted-apply-gate';
import { PHASE2FA_MIGRATION_DO_NOT_APPLY, PHASE2HA_MIGRATION } from './tenant/reconciliation';
import { reviewPhase2HaReconciliation } from './tenant/reconciliation-review';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './tenant';

function test(name: string, run: () => void | Promise<void>) {
  return Promise.resolve()
    .then(run)
    .then(() => {
      console.log(`ok - ${name}`);
    });
}

const here = dirname(fileURLToPath(import.meta.url));
const reconPath = join(here, '../../../supabase/migrations', PHASE2HA_MIGRATION);
const phase2fPath = join(here, '../../../supabase/migrations', PHASE2FA_MIGRATION_DO_NOT_APPLY);

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
  createdBy: 'user_a',
  createdAt: orgA.createdAt,
  updatedAt: orgA.updatedAt,
};
const uniB: Universe = { ...uniA, id: 'uni_b', organizationId: 'org_b', slug: 'uni-b', name: 'Universe B' };

function member(userId: string, organizationId: string, role: OrganizationMembership['role'] = 'owner'): OrganizationMembership {
  return {
    id: `om_${userId}`,
    organizationId,
    userId,
    role,
    status: 'active',
    roleVersion: 1,
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

function uniMember(userId: string, universeId: string): UniverseMembership {
  return {
    id: `um_${userId}`,
    universeId,
    userId,
    role: 'owner',
    status: 'active',
    roleVersion: 1,
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

resetHostedProofForTests();

await test('reconciliation migration authored and old Phase 2F not applied', () => {
  assert.equal(existsSync(reconPath), true);
  assert.equal(existsSync(phase2fPath), true);
  const sql = readFileSync(reconPath, 'utf8');
  assert.match(sql, /xiv_organizations/);
  assert.doesNotMatch(sql, /create table public\.organizations\s*\(/i);
  const review = reviewPhase2HaReconciliation();
  assert.equal(review.ok, true, review.findings.join('; '));
  assert.equal(hostedApplyGate().applied, false);
  assert.equal(hostedApplyGate().phase2fMustNotApply, true);
  assert.equal(tenantPersistenceIsLive(), false);
});

await test('User A cannot read Org B / Universe B and User B cannot read Org A / Universe A', () => {
  const aReadsB = canViewOrganization({
    actorUserId: 'user_a',
    organization: orgB,
    membership: member('user_a', 'org_a'),
  });
  const bReadsA = canViewOrganization({
    actorUserId: 'user_b',
    organization: orgA,
    membership: member('user_b', 'org_b'),
  });
  const aReadsUniB = canViewUniverse({
    actorUserId: 'user_a',
    organization: orgB,
    universe: uniB,
    organizationMembership: member('user_a', 'org_a'),
    universeMembership: uniMember('user_a', 'uni_a'),
  });
  const bReadsUniA = canViewUniverse({
    actorUserId: 'user_b',
    organization: orgA,
    universe: uniA,
    organizationMembership: member('user_b', 'org_b'),
    universeMembership: uniMember('user_b', 'uni_b'),
  });
  assert.equal(aReadsB.allowed, false);
  assert.equal(bReadsA.allowed, false);
  assert.equal(aReadsUniB.allowed, false);
  assert.equal(bReadsUniA.allowed, false);
});

await test('self-promotion and arbitrary membership denied', () => {
  const self = canManageOrganizationMembership({
    actorUserId: 'user_a',
    organization: orgA,
    membership: member('user_a', 'org_a'),
    targetUserId: 'user_a',
    nextRole: 'owner',
  });
  assert.equal(self.allowed, false);
  assert.equal(userCannotJoinArbitraryOrganization().allowed, false);
  assert.equal(userCannotJoinArbitraryUniverse().allowed, false);
});

await test('client selector, user_roles, and profiles.company grant nothing', () => {
  assert.equal(clientSelectorIsNotAuthority('org_b').allowed, false);
  assert.equal(userRolesDoNotGrantTenantAccess().allowed, false);
  assert.equal(profileCompanyDoesNotGrantTenantAccess().allowed, false);
});

await test('stale authorization denied', () => {
  const stale = requireFreshAuthorization(
    {
      roleVersion: 1,
      membershipUpdatedAt: '2026-01-01T00:00:00.000Z',
      authorizationCheckedAt: '2026-01-01T00:00:00.000Z',
      authorizationExpiresAt: '2026-01-02T00:00:00.000Z',
    },
    true,
    Date.parse('2026-09-06T00:00:00.000Z'),
  );
  assert.equal(stale.allowed, false);
});

await test('tenantPersistence remains blocked until isolation passes', () => {
  resetHostedProofForTests();
  const helpers = evaluateLiveIsolationPlan({
    a: {
      userId: 'user_a',
      organization: orgA,
      universe: uniA,
      organizationMembership: member('user_a', 'org_a'),
      universeMembership: uniMember('user_a', 'uni_a'),
    },
    b: {
      userId: 'user_b',
      organization: orgB,
      universe: uniB,
      organizationMembership: member('user_b', 'org_b'),
      universeMembership: uniMember('user_b', 'uni_b'),
    },
  });
  assert.equal(helpers.helperPass, true);
  assert.equal(helpers.hostedRlsPass, false);
  assert.equal(tenantPersistenceIsLive(), false);
});

await test('legacy apply+isolation flags do not activate without catalog and authenticated runtime provenance', () => {
  recordHostedApplyEvidence({
    applied: true,
    tablesVisible: true,
    rlsVerified: true,
    reason: 'Test-only complete apply evidence.',
  });
  assert.equal(tenantPersistenceIsLive(), false);
  recordHostedIsolationEvidence({
    bootstrapPassed: true,
    isolationPassed: true,
    escalationPassed: true,
    freshnessPassed: true,
    twoUsers: true,
    reason: 'Test-only complete isolation evidence.',
  });
  assert.equal(tenantPersistenceIsLive(), false);
  resetHostedProofForTests();
  assert.equal(tenantPersistenceIsLive(), false);
});

await test('World Bank adapter performs real fetch when configured', async () => {
  const fetched = await fetchWorldBankObservation({ countryCode: 'NG' });
  if ('allowed' in fetched) {
    assert.equal(fetched.cadence, 'unavailable');
    assert.equal(worldBankIsRealtime(), false);
    return;
  }
  assert.equal(fetched.connected, true);
  assert.equal(fetched.live, false);
  assert.equal(fetched.prototype, false);
  assert.equal(fetched.cadence, 'historical');
  assert.notEqual(fetched.cadence, 'live');
  assert.ok(fetched.sourceUrl.includes('worldbank.org'));
  assert.equal(fetched.countryCode.length > 0, true);
});

await test('missing provider data does not create event and is not labelled realtime', () => {
  const mapped = mapWorldBankRecord({
    country: { id: 'KE', value: 'Kenya' },
    indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
    date: '2023',
    value: null,
  });
  assert.equal('sourceId' in mapped, true);
  if ('sourceId' in mapped) {
    const event = businessEventFromWorldBank(mapped);
    assert.equal('allowed' in event && event.allowed === false, true);
    assert.equal(mapped.cadence, 'historical');
    assert.equal(worldBankIsRealtime(), false);
  }
});

await test('Africa missing values not fabricated and China deployment remains false', () => {
  assert.equal(africaIsNotOneMarket().oneMarket, false);
  assert.equal(missingCountryValueIsFabricated(), false);
  assert.equal(africaCountryAvailability().every((row) => row.fabricated === false && row.oneMarket === false), true);
  assert.equal(xivIsDeployedInChina(), false);
  assert.equal(chinaDeploymentCapability().dataResidencyRequirement, 'requires_legal_review');
  assert.equal(chinaDeploymentCapability().providerAvailability, 'requires_local_partner');
});

await test('Business Case public_source requires evidence', () => {
  const denied = createCaseFromPublicEvent({
    eventId: '',
    title: 'No evidence',
    country: 'NG',
    evidence: [],
    context: 'Missing',
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
});

await test('Module permission defaults deny and wildcard rejected', () => {
  assert.equal(modulePermissionDefault().allow, false);
  assert.equal(requestModulePermissions(['*']).allowed, false);
  assert.equal(consumerInstallDenied().allowed, false);
});

await test('WMS, lead, insurance, and real estate packs stay bounded', () => {
  assert.equal(wmsInventoriesStock(), false);
  const emptyLead = scoreLead([]);
  assert.equal('allowed' in emptyLead && emptyLead.allowed === false, true);
  assert.equal(insuranceUnderwritingDecision().allowed, false);
  assert.equal(realEstateFabricatesProperty(), false);
});

await test('Business Live still business-host only, L4 disabled, Guardian cannot deploy', () => {
  assert.equal(consumerCanHostBusinessLive(), false);
  assert.equal(canHostBusinessLive({ experienceRole: 'consumer' }).allowed, false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(
    evaluatePolicy({ agentId: 'executive', toolId: 'propose_operational_change', environment: 'production' }).verdict,
    'denied',
  );
});

console.log('All Phase 2H-B cases passed.');
