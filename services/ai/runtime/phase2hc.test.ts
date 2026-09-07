/**
 * Phase 2H-C tenant activation gate.
 * UNIT/SEMANTIC TEST is not HOSTED RLS PROOF.
 * Run with: npx tsx runtime/phase2hc.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import { consumerCanHostBusinessLive } from './live';
import { consumerInstallDenied } from './modules';
import { evaluatePolicy } from './policy';
import { publishingWritesEnabled } from './publishing/policy';
import {
  authoritativeXivHydrationEnabled,
  businessModulesTenantReady,
  evaluateLiveIsolationPlan,
  evaluateTenantActivation,
  PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG,
  applyHostedIsolationRun,
  recordHumanVerifiedHostedCatalog,
  recordTenantActivationProofs,
  resetHostedCatalogRecord,
  resetTenantActivationProofs,
  tenantActivationProofs,
  tenantAuthorizationStatus,
  tenantPersistenceIsLive,
  tenantPersistenceStatus,
  TENANT_ACTIVATION_PROOF_KEYS,
  validateHostedCatalogObservation,
} from './tenant';
import { hostedApplyGate } from './tenant/hosted-apply-gate';
import { PHASE2FA_MIGRATION_DO_NOT_APPLY, PHASE2HA_MIGRATION } from './tenant/reconciliation';
import { reviewPhase2HaReconciliation } from './tenant/reconciliation-review';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './tenant';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
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

function member(userId: string, organizationId: string): OrganizationMembership {
  return {
    id: `om_${userId}`,
    organizationId,
    userId,
    role: 'owner',
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

const hostedComplete = {
  migrationApplied: true,
  rlsVerified: true,
  forceRlsVerified: true,
  userABootstrapPassed: true,
  userBBootstrapPassed: true,
  crossOrgIsolationPassed: true,
  crossUniverseIsolationPassed: true,
  arbitraryJoinDenied: true,
  selfPromotionDenied: true,
  foreignRoleGrantDenied: true,
  staleAuthorizationDenied: true,
  clientSelectorNotAuthority: true,
  userRolesNotAuthority: true,
  profileCompanyNotAuthority: true,
} as const;

function passingAssertion(testName: string) {
  return {
    testName,
    actorUserId: 'user_a',
    organizationId: 'org_a',
    universeId: 'uni_a',
    operation: testName,
    expected: 'pass',
    actual: 'pass',
    result: 'PASS' as const,
    timestamp: '2026-09-07T00:00:00.000Z',
  };
}

function passingIsolationRun() {
  const names = [
    'bootstrap.userA',
    'bootstrap.userB',
    'cross.org.A-reads-B',
    'cross.org.B-reads-A',
    'cross.universe.A-reads-B',
    'cross.universe.B-reads-A',
    'freshness.staleAuthorizationDenied',
    'freshness.demotedAdminCannotManageOrg',
    'write.joinForeignOrg.A-into-B',
    'write.joinForeignOrg.B-into-A',
    'write.selfPromote.A',
    'write.selfPromote.B',
    'authority.adminCannotCreateOwner',
    'authority.clientSelectorNotAuthority',
    'authority.userRolesNotAuthority',
    'authority.profileCompanyNotAuthority',
  ];
  return {
    isolation: 'PASS' as const,
    assertions: names.map(passingAssertion),
    identities: {
      userAId: 'user_a',
      userBId: 'user_b',
      orgAId: 'org_a',
      orgBId: 'org_b',
      universeAId: 'uni_a',
      universeBId: 'uni_b',
    },
    roleVersion: { before: 1, after: 2, incremented: true, staleContextDenied: true },
    reason: 'Gate-contract fixture. Not hosted RLS proof by itself.',
  };
}

resetTenantActivationProofs();
resetHostedCatalogRecord();

test('APPLY BLOCKED without privileged database connection', () => {
  assert.equal(hostedApplyGate().applied, false);
  assert.equal(hostedApplyGate().privilegedCredentialPresent, false);
  assert.match(hostedApplyGate().reason, /privileged/i);
  assert.equal(existsSync(reconPath), true);
  assert.equal(existsSync(phase2fPath), true);
  assert.equal(reviewPhase2HaReconciliation().ok, true);
  assert.equal(tenantPersistenceStatus(), 'blocked');
  assert.equal(tenantPersistenceIsLive(), false);
});

test('default activation proofs are all false and unproven', () => {
  const proofs = tenantActivationProofs();
  for (const key of TENANT_ACTIVATION_PROOF_KEYS) {
    assert.equal(proofs[key], false, key);
  }
  assert.equal(proofs.evidenceKind, 'unproven');
  assert.equal(proofs.isolationEvidenceKind, 'unproven');
  assert.equal(proofs.catalogEvidenceKind, 'unproven');
  assert.equal(proofs.isolationValidated, false);
  assert.equal(proofs.catalogValidated, false);
  assert.equal(proofs.phase2fApplied, false);
});

test('UNIT/SEMANTIC TEST cannot make tenantPersistence live', () => {
  recordTenantActivationProofs({
    ...hostedComplete,
    evidenceKind: 'unit_semantic',
    reason: 'Unit helpers only.',
  });
  const evaluated = evaluateTenantActivation();
  assert.equal(evaluated.tenantPersistence, 'blocked');
  assert.equal(evaluated.unitSemanticIsNotHostedProof, true);
  assert.equal(evaluated.hostedRlsProof, false);
  assert.equal(authoritativeXivHydrationEnabled(), false);
  resetTenantActivationProofs();
});

test('helper isolation is not hosted RLS proof', () => {
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
  assert.equal(tenantPersistenceStatus(), 'blocked');
});

test('any missing hosted proof keeps tenantPersistence blocked', () => {
  for (const missingKey of TENANT_ACTIVATION_PROOF_KEYS) {
    recordTenantActivationProofs({
      ...hostedComplete,
      [missingKey]: false,
      evidenceKind: 'hosted',
      reason: `Missing ${missingKey}`,
    });
    assert.equal(tenantPersistenceStatus(), 'blocked', missingKey);
  }
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
});

test('human-verified catalog without authenticated isolation stays blocked', () => {
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
  const catalog = recordHumanVerifiedHostedCatalog({
    observation: PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG,
    humanReportedAt: '2026-09-07T11:32:00.000Z',
  });
  assert.equal(catalog.validated, true);
  assert.equal(catalog.evidenceKind, 'human_verified_hosted_catalog');
  assert.equal(tenantPersistenceStatus(), 'blocked');
  assert.equal(evaluateTenantActivation().missing.includes('authenticated_runtime_isolation'), true);
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
});

test('authenticated isolation without human-verified catalog stays blocked', () => {
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
  applyHostedIsolationRun(passingIsolationRun());
  assert.equal(tenantPersistenceStatus(), 'blocked');
  assert.equal(evaluateTenantActivation().missing.includes('human_verified_hosted_catalog'), true);
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
});

test('mismatched catalog observation is not accepted', () => {
  resetHostedCatalogRecord();
  const rejected = recordHumanVerifiedHostedCatalog({
    observation: {
      ...PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG,
      authenticatedPolicyCount: 12,
      tables: PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG.tables.map((row, index) =>
        index === 0 ? { ...row, relforcerowsecurity: false } : row,
      ),
    },
  });
  assert.equal(rejected.validated, false);
  assert.equal(tenantActivationProofs().forceRlsVerified, false);
  assert.equal(tenantActivationProofs().catalogValidated, false);
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
});

test('authored human catalog observation matches required hosted predicates', () => {
  const review = validateHostedCatalogObservation(PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG);
  assert.equal(review.ok, true, review.findings.join('; '));
});

test('proof keys plus evidenceKind hosted cannot activate without validated provenances', () => {
  recordTenantActivationProofs({
    ...hostedComplete,
    evidenceKind: 'hosted',
    catalogValidated: true,
    isolationValidated: true,
    catalogEvidenceKind: 'human_verified_hosted_catalog',
    isolationEvidenceKind: 'authenticated_runtime',
    reason: 'Attempt to smuggle validated provenances through the generic recorder.',
  });
  assert.equal(tenantActivationProofs().catalogValidated, false);
  assert.equal(tenantActivationProofs().isolationValidated, false);
  assert.equal(tenantPersistenceStatus(), 'blocked');
  resetTenantActivationProofs();
});

test('authenticated isolation plus human-verified catalog can evaluate live then reset', () => {
  applyHostedIsolationRun(passingIsolationRun());
  recordHumanVerifiedHostedCatalog({
    observation: PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG,
    humanReportedAt: '2026-09-07T11:32:00.000Z',
  });
  assert.equal(tenantPersistenceStatus(), 'live');
  assert.equal(businessModulesTenantReady(), true);
  assert.equal(tenantAuthorizationStatus(), 'implemented');
  assert.equal(authoritativeXivHydrationEnabled(), true);
  assert.equal(evaluateTenantActivation().isolationEvidenceKind, 'authenticated_runtime');
  assert.equal(evaluateTenantActivation().catalogEvidenceKind, 'human_verified_hosted_catalog');
  resetTenantActivationProofs();
  resetHostedCatalogRecord();
  assert.equal(tenantPersistenceStatus(), 'blocked');
  assert.equal(businessModulesTenantReady(), false);
  assert.equal(tenantAuthorizationStatus(), 'blocked');
  assert.equal(authoritativeXivHydrationEnabled(), false);
});

test('Business Live provider stays not_configured and consumer cannot host', () => {
  assert.equal(evaluateTenantActivation().liveProvider, 'not_configured');
  assert.equal(consumerCanHostBusinessLive(), false);
});

test('L4, writes, Guardian deploy, and consumer module install remain denied', () => {
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(consumerInstallDenied().allowed, false);
  assert.equal(
    evaluatePolicy({ agentId: 'executive', toolId: 'propose_operational_change', environment: 'production' }).verdict,
    'denied',
  );
});

console.log('All Phase 2H-C cases passed.');
