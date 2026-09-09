/**
 * Phase 2H-A persistence reconciliation, sourced data, and scheduled Guardian.
 * Run with: npx tsx runtime/phase2ha.test.ts
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { denyCrossUniverseHandoff } from './collaboration';
import { caseHasUnsupportedFinancialImpact, createCaseFromPublicEvent } from './cases';
import { agentDebuggerCanDeploy, circuitIsOpen, evaluateCircuitBreaker } from './diagnostics';
import { africaIsNotOneMarket, chinaDeploymentCapability, xivIsDeployedInChina } from './global';
import { guardianDebuggerLoopCannotPatch, guardianMay, runScheduledCheck, scheduledGuardianMutatesCode } from './guardian/schedule';
import { canHostBusinessLive, consumerCanHostBusinessLive, createUnavailableLiveStreamProvider } from './live';
import { createBusinessVerification, issueLiveHostGrant } from './live/verification';
import { evaluatePolicy } from './policy';
import { businessEventFromWorldBank, mapWorldBankRecord, worldBankIsRealtime, worldBankProviderConnected } from './providers';
import { publishingWritesEnabled } from './publishing/policy';
import { billionUserReady, scaleReadinessScorecard } from './scale';
import { requireFreshAuthorization } from './security/freshness';
import {
  clientSelectorIsNotAuthority,
  describeTenantPersistenceBlock,
  evaluateLiveIsolationPlan,
  hostedOrganizationsAudit,
  hostedTableIsNeverAutoDropped,
  preferredReconciliation,
  profileCompanyDoesNotGrantTenantAccess,
  reconciliationRenamesHostedTable,
  tenantPersistenceIsLive,
  userRolesDoNotGrantTenantAccess,
} from './tenant';
import { reviewPhase2HaReconciliation } from './tenant/reconciliation-review';
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
    createdAt: orgA.createdAt,
    updatedAt: orgA.updatedAt,
  };
}

await test('existing organizations collision is detected', () => {
  const block = describeTenantPersistenceBlock();
  assert.equal(block.status, 'schema_collision');
  assert.equal(hostedOrganizationsAudit().table, 'public.organizations');
  assert.equal(tenantPersistenceIsLive(), false);
});

await test('existing table is never auto-dropped', () => {
  assert.equal(hostedTableIsNeverAutoDropped(), true);
  assert.equal(describeTenantPersistenceBlock().mayAutoDropHostedTable, false);
  assert.equal(describeTenantPersistenceBlock().mayDropHostedTable, false);
});

await test('reconciliation migration does not rename hosted table', () => {
  const review = reviewPhase2HaReconciliation();
  assert.equal(review.ok, true, review.findings.join('; '));
  assert.equal(review.renamesHostedTable, false);
  assert.equal(review.dropsHostedTable, false);
  assert.equal(reconciliationRenamesHostedTable(), false);
  assert.equal(preferredReconciliation().option, 'C_isolate_xiv_tables');
});

await test('anon tenant access denied in authored SQL', () => {
  const review = reviewPhase2HaReconciliation();
  assert.equal(review.grantsAnon, false);
});

await test('client selector alone grants nothing', () => {
  assert.equal(clientSelectorIsNotAuthority('org_a').allowed, false);
});

await test('profiles.company grants nothing', () => {
  assert.equal(profileCompanyDoesNotGrantTenantAccess().allowed, false);
});

await test('user_roles grants nothing', () => {
  assert.equal(userRolesDoNotGrantTenantAccess().allowed, false);
});

await test('cross-org remains deny', () => {
  const proof = evaluateLiveIsolationPlan({
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
  assert.equal(proof.helperPass, true);
  assert.equal(proof.hostedRlsPass, false);
  assert.equal(proof.live, false);
});

await test('cross-Universe remains deny', () => {
  const cross = denyCrossUniverseHandoff({
    sourceUniverseId: 'uni_a',
    targetUniverseId: 'uni_b',
    sourceOrganizationId: 'org_a',
    targetOrganizationId: 'org_a',
  });
  assert.equal(cross?.code, 'cross_universe');
});

await test('Guardian scheduled checks cannot mutate code', () => {
  const result = runScheduledCheck('health', 'unknown');
  assert.equal(result.mutatesCode, false);
  assert.equal(scheduledGuardianMutatesCode(), false);
});

await test('AgentDebugger cannot deploy', () => {
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(guardianDebuggerLoopCannotPatch().autonomousPatch, false);
  assert.equal(guardianMay('deploy_code').allowed, false);
});

await test('circuit breaker may isolate failing agent', () => {
  const open = evaluateCircuitBreaker({
    agentId: 'research',
    signals: ['invalid_provenance', 'tool_failure', 'loop_detected'],
  });
  assert.equal(circuitIsOpen(open), true);
});

await test('real business event requires provenance', () => {
  const denied = mapWorldBankRecord({ date: '2023', value: 1 });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const mapped = mapWorldBankRecord({
    country: { id: 'NG', value: 'Nigeria' },
    indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
    date: '2023',
    value: null,
  });
  assert.equal('sourceId' in mapped, true);
  if ('sourceId' in mapped) {
    const event = businessEventFromWorldBank(mapped);
    assert.equal('allowed' in event && event.allowed === false, true);
  }
  assert.equal(worldBankIsRealtime(), false);
  assert.equal(worldBankProviderConnected(), false);
});

await test('business case from public source remains public_source', () => {
  const created = createCaseFromPublicEvent({
    eventId: 'evt_src',
    title: 'Sourced indicator published',
    country: 'NG',
    evidence: ['world_bank:NG:NY.GDP.MKTP.CD:2023'],
    context: 'Public-source case. Outcome unknown.',
  });
  assert.equal('status' in created && created.status === 'public_source', true);
  if ('status' in created) {
    assert.equal(created.outcomes.length, 0);
    assert.equal(caseHasUnsupportedFinancialImpact(created), false);
  }
});

await test('no unsupported financial impact', () => {
  const created = createCaseFromPublicEvent({
    eventId: 'evt_src_2',
    title: 'Sourced indicator',
    country: 'KE',
    evidence: ['world_bank'],
    context: 'No invented dollars.',
  });
  assert.equal('outcomes' in created && created.outcomes.length === 0, true);
});

await test('China deployment remains false', () => {
  assert.equal(xivIsDeployedInChina(), false);
  assert.equal(chinaDeploymentCapability().dataResidencyRequirement, 'requires_legal_review');
  assert.equal(chinaDeploymentCapability().providerAvailability, 'requires_local_partner');
});

await test('Africa country data remains country-specific', () => {
  assert.equal(africaIsNotOneMarket().sharedRulesForEveryCountry, false);
  assert.equal(africaIsNotOneMarket().countryLevelAuthoritative, true);
});

await test('consumer cannot host Live', () => {
  assert.equal(consumerCanHostBusinessLive(), false);
  assert.equal(canHostBusinessLive({ experienceRole: 'consumer' }).allowed, false);
});

await test('business host requires tenant verification model', () => {
  const grant = issueLiveHostGrant({
    consumer: false,
    persistenceReady: true,
    membershipActive: true,
    authorizedHostRole: true,
    verification: createBusinessVerification('org_a'),
    streamProviderConfigured: false,
  });
  assert.equal(grant.allowed, false);
  assert.match(grant.reason, /verif|NOT CONFIGURED/i);
});

await test('stream provider remains not_configured', () => {
  assert.equal(createUnavailableLiveStreamProvider().status, 'not_configured');
});

await test('authorization freshness enforced', () => {
  const expired = requireFreshAuthorization(
    {
      roleVersion: 1,
      membershipUpdatedAt: '2026-01-01T00:00:00.000Z',
      authorizationCheckedAt: '2026-01-01T00:00:00.000Z',
      authorizationExpiresAt: '2026-01-01T00:00:01.000Z',
    },
    true,
    Date.parse('2026-09-06T00:00:00.000Z'),
  );
  assert.equal(expired.allowed, false);
});

await test('scale readiness stays not_tested until evidence', () => {
  const card = scaleReadinessScorecard();
  assert.equal(Object.values(card).every((item) => item === 'not_tested'), true);
});

await test('billion-user-ready stays false', () => {
  assert.equal(billionUserReady(), false);
});

await test('L4 remains disabled and writes governed', () => {
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(
    evaluatePolicy({ agentId: 'executive', toolId: 'propose_operational_change', environment: 'production' }).verdict,
    'denied',
  );
});

console.log('All Phase 2H-A cases passed.');
